import { nativeState } from "./native-state.mjs";
import { client } from "./dataverse.mjs";
import { serviceRequest } from "./power-services.mjs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
const runtimeFile = await nativeState("native-runtime"),
  flowsFile = await nativeState("native-flows");
const call = client(),
  env = process.env.POWER_PLATFORM_ENVIRONMENT_ID;
const draftsOnly = process.argv.includes("--drafts-only"),
  onlyName = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const runtime = JSON.parse(await readFile(runtimeFile, "utf8"));
const who = await call("WhoAmI");
const me = await call(
  `systemusers(${who.UserId})?$select=internalemailaddress`,
);
const connections = await serviceRequest(
  `https://api.powerapps.com/providers/Microsoft.PowerApps/connections?api-version=2016-11-01&$filter=environment%20eq%20'${env}'`,
  "https://service.powerapps.com/",
);
const approvalConnection = connections.value.find(
  (c) =>
    c.properties.apiId.endsWith("shared_approvals") &&
    c.properties.statuses.some((s) => s.status === "Connected"),
);
if (!approvalConnection && !process.argv.includes("--without-approval"))
  throw Error(
    "Maak eerst een Microsoft Approvals-verbinding in deze omgeving, of gebruik --without-approval voor de onafhankelijke ERP-flows.",
  );
for (const [name, connector, id] of [
  ["fo_dataverse", "shared_commondataserviceforapps", runtime.connectionName],
  ...(approvalConnection
    ? [["fo_approvals", "shared_approvals", approvalConnection.name]]
    : []),
]) {
  const exists = await call(
    `connectionreferences?$filter=connectionreferencelogicalname eq '${name}'&$select=connectionreferenceid`,
  );
  let ref = exists.value[0];
  if (!ref)
    ref = await call(
      "connectionreferences",
      "POST",
      {
        connectionreferencelogicalname: name,
        connectionreferencedisplayname:
          name === "fo_dataverse"
            ? "FieldOps Dataverse Runtime"
            : "FieldOps Approvals",
        connectorid: "/providers/Microsoft.PowerApps/apis/" + connector,
        connectionid: id,
      },
      {
        Prefer: "return=representation",
        "MSCRM.SolutionUniqueName": "FieldOps360",
      },
    );
  else
    await call(`connectionreferences(${ref.connectionreferenceid})`, "PATCH", {
      connectionid: id,
    });
  console.log("Connector reference ready:", name);
}
const dv = "shared_commondataserviceforapps",
  ap = "shared_approvals",
  auth = "@parameters('$authentication')";
const refs = {
  [dv]: {
    runtimeSource: "embedded",
    connection: {
      name: runtime.connectionName,
      connectionReferenceLogicalName: "fo_dataverse",
    },
    api: { name: dv },
  },
  [ap]: {
    runtimeSource: "embedded",
    connection: {
      name: approvalConnection?.name,
      connectionReferenceLogicalName: "fo_approvals",
    },
    api: { name: ap },
  },
};
const parameters = {
  $connections: { defaultValue: {}, type: "Object" },
  $authentication: { defaultValue: {}, type: "SecureObject" },
};
const action = (op, params, after = {}) => ({
  type: "OpenApiConnection",
  inputs: {
    host: {
      apiId: "/providers/Microsoft.PowerApps/apis/" + dv,
      connectionName: dv,
      operationId: op,
    },
    parameters: params,
    authentication: auth,
  },
  runAfter: after,
});
const trigger = (entity, filter, field) => ({
  type: "OpenApiConnectionWebhook",
  inputs: {
    host: {
      apiId: "/providers/Microsoft.PowerApps/apis/" + dv,
      connectionName: dv,
      operationId: "SubscribeWebhookTrigger",
    },
    parameters: {
      "subscriptionRequest/message": 4,
      "subscriptionRequest/entityname": entity,
      "subscriptionRequest/scope": 4,
      "subscriptionRequest/filterexpression": filter,
      "subscriptionRequest/filteringattributes": field,
    },
    authentication: auth,
  },
  runtimeConfiguration: { concurrency: { runs: 1 } },
});
const base = (triggers, actions, params = parameters) => ({
  $schema:
    "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
  contentVersion: "1.0.0.0",
  parameters: params,
  triggers,
  actions,
});
let records;
try {
  records = JSON.parse(await readFile(flowsFile, "utf8"));
} catch {
  records = {};
}
async function upsert(name, displayName, definition, connections) {
  let rows = await call(
    `workflows?$filter=uniquename eq '${name}'&$select=workflowid,statecode`,
  );
  let row = rows.value[0];
  if (onlyName && name !== onlyName) {
    if (!row) throw Error("Requested dependent flow is absent: " + name);
    return row.workflowid;
  }
  if (row?.statecode === 1)
    await call(`workflows(${row.workflowid})`, "PATCH", {
      statecode: 0,
      statuscode: 1,
    });
  const data = {
    name: displayName,
    uniquename: name,
    category: 5,
    type: 1,
    primaryentity: "none",
    description: "FieldOps 360 native cloud flow",
    clientdata: JSON.stringify({
      properties: { connectionReferences: connections, definition },
      schemaVersion: "1.0.0.0",
    }),
  };
  if (row) await call(`workflows(${row.workflowid})`, "PATCH", data);
  else
    row = await call("workflows", "POST", data, {
      Prefer: "return=representation",
      "MSCRM.SolutionUniqueName": "FieldOps360",
    });
  await call("AddSolutionComponent", "POST", {
    ComponentId: row.workflowid,
    ComponentType: 29,
    SolutionUniqueName: "FieldOps360",
    AddRequiredComponents: false,
  });
  records[name] = { id: row.workflowid, name: displayName };
  await writeFile(flowsFile, JSON.stringify(records, null, 2), { mode: 0o600 });
  console.log("Flow stored:", displayName);
  if (!draftsOnly) {
    await call(`workflows(${row.workflowid})`, "PATCH", {
      statecode: 1,
      statuscode: 2,
    });
    console.log("Flow enabled:", displayName);
  } else console.log("Draft mode: activation deferred until licensed.");
  return row.workflowid;
}
const erpDef = base(
  {
    manual: {
      type: "Request",
      kind: "Http",
      inputs: {
        schema: {
          type: "object",
          required: ["deliveryId", "reference", "quantity", "unit"],
          properties: {
            deliveryId: { type: "string" },
            reference: { type: "string" },
            quantity: { type: "number" },
            unit: { type: "string" },
            simulateFailure: { type: "boolean" },
          },
        },
      },
      runtimeConfiguration: { concurrency: { runs: 1 } },
    },
  },
  {
    Validate: {
      type: "If",
      expression: {
        and: [
          { greater: ["@triggerBody()?['quantity']", 0] },
          { not: { equals: ["@triggerBody()?['deliveryId']", ""] } },
        ],
      },
      actions: {
        Availability: {
          type: "If",
          expression: { equals: ["@triggerBody()?['simulateFailure']", true] },
          actions: {
            Unavailable: {
              type: "Response",
              kind: "Http",
              inputs: {
                statusCode: 503,
                body: { error: "Deliberate FieldOps ERP test outage" },
              },
              runAfter: {},
            },
          },
          else: {
            actions: {
              Receipt: {
                type: "Response",
                kind: "Http",
                inputs: {
                  statusCode: 200,
                  body: {
                    id: "@concat('ERP-NATIVE-',triggerBody()?['deliveryId'])",
                    reference: "@triggerBody()?['reference']",
                    provider: "FieldOps native ERP test API",
                    idempotent: true,
                  },
                },
                runAfter: {},
              },
            },
          },
          runAfter: {},
        },
      },
      else: {
        actions: {
          Invalid: {
            type: "Response",
            kind: "Http",
            inputs: { statusCode: 422, body: { error: "Invalid delivery" } },
            runAfter: {},
          },
        },
      },
      runAfter: {},
    },
  },
);
delete erpDef.triggers.manual.runtimeConfiguration;
const erpId = await upsert(
  "fo_erptestapi",
  "FieldOps 360 · ERP Test API",
  erpDef,
  {},
);
const callback = draftsOnly
  ? { value: "https://replace-after-activation.example.invalid/receipts" }
  : await serviceRequest(
      `https://api.flow.microsoft.com/providers/Microsoft.ProcessSimple/environments/${env}/flows/${erpId}/triggers/manual/listCallbackUrl?api-version=2016-11-01`,
      "https://service.flow.microsoft.com/",
      "POST",
      {},
    );
const endpoint = callback.value || callback.response?.value;
if (!endpoint || !endpoint.startsWith("https://"))
  throw Error("Geen ERP callback-URL ontvangen");
const approve = base(
  {
    Delivery_pending: trigger(
      "fo_delivery",
      "fo_status eq 'pending'",
      "fo_status",
    ),
  },
  {
    Validate: {
      type: "If",
      expression: {
        and: [
          { greater: ["@triggerOutputs()?['body/fo_quantity']", 0] },
          { greater: ["@triggerOutputs()?['body/fo_expected']", 0] },
          {
            not: {
              equals: [
                "@triggerOutputs()?['body/_createdby_value']",
                who.UserId,
              ],
            },
          },
        ],
      },
      actions: {
        Approval: {
          type: "OpenApiConnectionWebhook",
          inputs: {
            host: {
              apiId: "/providers/Microsoft.PowerApps/apis/" + ap,
              connectionName: ap,
              operationId: "StartAndWaitForAnApproval",
            },
            parameters: {
              approvalType: "Basic",
              "WebhookApprovalCreationInput/title":
                "@concat('FieldOps levering ',triggerOutputs()?['body/fo_reference'])",
              "WebhookApprovalCreationInput/assignedTo":
                me.internalemailaddress,
              "WebhookApprovalCreationInput/details":
                "@concat('Controleer hoeveelheid, originele bon en afwijking. ',triggerOutputs()?['body/fo_note'])",
              "WebhookApprovalCreationInput/enableNotifications": false,
              "WebhookApprovalCreationInput/enableReassignment": false,
            },
            authentication: auth,
          },
          limit: { timeout: "P2D" },
          runAfter: {},
        },
        Decision: {
          type: "If",
          expression: {
            equals: ["@outputs('Approval')?['body/outcome']", "Approve"],
          },
          actions: {
            Approve: action("UpdateRecord", {
              entityName: "fo_deliveries",
              recordId: "@triggerOutputs()?['body/fo_deliveryid']",
              "item/fo_status": "approved",
            }),
            Queue: action(
              "CreateRecord",
              {
                entityName: "fo_integrationjobs",
                "item/fo_name": "@triggerOutputs()?['body/fo_reference']",
                "item/fo_state": "queued",
                "item/fo_idempotencykey":
                  "@triggerOutputs()?['body/fo_deliveryid']",
                "item/fo_deliveryid@odata.bind":
                  "@concat('/fo_deliveries(',triggerOutputs()?['body/fo_deliveryid'],')')",
              },
              { Approve: ["Succeeded"] },
            ),
          },
          else: {
            actions: {
              Reject: action("UpdateRecord", {
                entityName: "fo_deliveries",
                recordId: "@triggerOutputs()?['body/fo_deliveryid']",
                "item/fo_status": "rejected",
                "item/fo_note":
                  "@string(outputs('Approval')?['body/responses'])",
              }),
            },
          },
          runAfter: { Approval: ["Succeeded"] },
        },
      },
      else: {
        actions: {
          Blocked: action("CreateRecord", {
            entityName: "fo_auditevents",
            "item/fo_name": "Goedkeuring geblokkeerd",
            "item/fo_event": "approval_validation_blocked",
            "item/fo_detail": "Controleer data en onafhankelijke goedkeurder.",
          }),
        },
      },
      runAfter: {},
    },
  },
);
if (approvalConnection)
  await upsert(
    "fo_validateandapprove",
    "FieldOps 360 · Validatie en goedkeuring",
    approve,
    refs,
  );
const sync = base(
  {
    Queued_job: trigger(
      "fo_integrationjob",
      "fo_state eq 'queued'",
      "fo_state",
    ),
  },
  {
    Try: {
      type: "Scope",
      actions: {
        Delivery: action("GetItem", {
          entityName: "fo_deliveries",
          recordId: "@triggerOutputs()?['body/_fo_deliveryid_value']",
        }),
        Verify_approved: {
          type: "If",
          expression: {
            equals: ["@outputs('Delivery')?['body/fo_status']", "approved"],
          },
          actions: {
            ERP: {
              type: "Http",
              inputs: {
                method: "POST",
                uri: endpoint,
                headers: {
                  "Content-Type": "application/json",
                  "Idempotency-Key":
                    "@triggerOutputs()?['body/fo_idempotencykey']",
                },
                body: {
                  deliveryId: "@triggerOutputs()?['body/fo_idempotencykey']",
                  reference: "@outputs('Delivery')?['body/fo_reference']",
                  quantity: "@outputs('Delivery')?['body/fo_quantity']",
                  unit: "@outputs('Delivery')?['body/fo_unit']",
                  simulateFailure:
                    "@equals(triggerOutputs()?['body/fo_error'],'SIMULATE_503')",
                },
                retryPolicy: {
                  type: "exponential",
                  count: 2,
                  interval: "PT5S",
                },
              },
              runtimeConfiguration: {
                secureData: { properties: ["inputs", "outputs"] },
              },
              runAfter: {},
            },
            Save_receipt: action(
              "UpdateRecord",
              {
                entityName: "fo_deliveries",
                recordId: "@triggerOutputs()?['body/_fo_deliveryid_value']",
                "item/fo_status": "synced",
                "item/fo_erp_id": "@body('ERP')?['id']",
              },
              { ERP: ["Succeeded"] },
            ),
            Finish_job: action(
              "UpdateRecord",
              {
                entityName: "fo_integrationjobs",
                recordId: "@triggerOutputs()?['body/fo_integrationjobid']",
                "item/fo_state": "done",
                "item/fo_error": "",
              },
              { Save_receipt: ["Succeeded"] },
            ),
          },
          else: {
            actions: {
              Invalid_state: {
                type: "Terminate",
                inputs: {
                  runStatus: "Failed",
                  runError: {
                    code: "NotApproved",
                    message: "Levering is niet goedgekeurd",
                  },
                },
                runAfter: {},
              },
            },
          },
          runAfter: { Delivery: ["Succeeded"] },
        },
      },
      runAfter: {},
    },
    Catch: {
      type: "Scope",
      actions: {
        Dead: action("UpdateRecord", {
          entityName: "fo_integrationjobs",
          recordId: "@triggerOutputs()?['body/fo_integrationjobid']",
          "item/fo_state": "dead",
          "item/fo_error":
            "ERP-integratie mislukt; controleer de beveiligde runhistoriek.",
        }),
      },
      runAfter: { Try: ["Failed", "TimedOut"] },
    },
  },
);
await upsert("fo_synchronizeerp", "FieldOps 360 · ERP synchronisatie", sync, {
  [dv]: refs[dv],
});
const monitor = base(
  {
    On_failed_job: trigger(
      "fo_integrationjob",
      "fo_state eq 'dead'",
      "fo_state",
    ),
  },
  {
    List_dead: action("ListRecords", {
      entityName: "fo_integrationjobs",
      $filter: "fo_state eq 'dead'",
      $top: 100,
    }),
    Each: {
      type: "Foreach",
      foreach: "@outputs('List_dead')?['body/value']",
      actions: {
        Alert: action("CreateRecord", {
          entityName: "fo_auditevents",
          "item/fo_name": "ERP-foutmelding",
          "item/fo_event": "integration_error",
          "item/fo_detail": "@items('Each')?['fo_error']",
          "item/fo_deliveryid@odata.bind":
            "@concat('/fo_deliveries(',items('Each')?['_fo_deliveryid_value'],')')",
        }),
        Notified: action(
          "UpdateRecord",
          {
            entityName: "fo_integrationjobs",
            recordId: "@items('Each')?['fo_integrationjobid']",
            "item/fo_state": "dead_notified",
          },
          { Alert: ["Succeeded"] },
        ),
      },
      runAfter: { List_dead: ["Succeeded"] },
    },
  },
);
await upsert("fo_errormonitor", "FieldOps 360 · Foutmeldingen", monitor, {
  [dv]: refs[dv],
});
console.log(
  draftsOnly
    ? "Native flow drafts installed. Activation is blocked by missing premium entitlement."
    : "Native flows installed and activation requests completed. Runtime tests still required.",
);
