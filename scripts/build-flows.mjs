import { writeFile } from "node:fs/promises";
const dv = "shared_commondataserviceforapps",
  approval = "shared_approvals";
const action = (op, parameters, runAfter = {}) => ({
  type: "OpenApiConnection",
  inputs: {
    host: {
      connectionName: dv,
      operationId: op,
      apiId: "/providers/Microsoft.PowerApps/apis/" + dv,
    },
    parameters,
  },
  runAfter,
});
const schema =
  "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#";
const params = {
  $connections: { defaultValue: {}, type: "Object" },
  $authentication: { defaultValue: {}, type: "SecureObject" },
  fo_ApproverEmail: { defaultValue: "", type: "String" },
  fo_ErpEndpoint: { defaultValue: "", type: "String" },
  fo_ErpKey: { type: "SecureString" },
};
const trigger = (entity, filter) => ({
  type: "OpenApiConnectionWebhook",
  inputs: {
    host: {
      connectionName: dv,
      operationId: "SubscribeWebhookTrigger",
      apiId: "/providers/Microsoft.PowerApps/apis/" + dv,
    },
    parameters: {
      "subscriptionRequest/message": 3,
      "subscriptionRequest/entityname": entity,
      "subscriptionRequest/scope": 4,
      "subscriptionRequest/filterexpression": filter,
    },
  },
  conditions: [],
  runtimeConfiguration: { concurrency: { runs: 1 } },
});
const refs = {
  shared_commondataserviceforapps: {
    runtimeSource: "embedded",
    connection: { connectionReferenceLogicalName: "fo_Dataverse" },
    api: { name: dv },
  },
  shared_approvals: {
    runtimeSource: "embedded",
    connection: { connectionReferenceLogicalName: "fo_Approvals" },
    api: { name: approval },
  },
};
const approvalFlow = {
  name: "fo_ValidateAndApprove",
  description:
    "SOURCE TEMPLATE: connector binding and environment validation required",
  properties: {
    connectionReferences: refs,
    definition: {
      $schema: schema,
      contentVersion: "1.0.0.0",
      parameters: params,
      triggers: {
        Delivery_pending: trigger("fo_delivery", "fo_status eq 'pending'"),
      },
      actions: {
        Validate: {
          type: "If",
          expression: {
            and: [
              { greater: ["@triggerOutputs()?['body/fo_quantity']", 0] },
              { greater: ["@triggerOutputs()?['body/fo_expected']", 0] },
              { not: { equals: ["@parameters('fo_ApproverEmail')", ""] } },
            ],
          },
          actions: {
            Approval: {
              type: "OpenApiConnectionWebhook",
              inputs: {
                host: {
                  connectionName: approval,
                  operationId: "StartAndWaitForAnApproval",
                  apiId: "/providers/Microsoft.PowerApps/apis/" + approval,
                },
                parameters: {
                  approvalType: "Basic",
                  "WebhookApprovalCreationInput/title":
                    "@concat('FieldOps levering ',triggerOutputs()?['body/fo_reference'])",
                  "WebhookApprovalCreationInput/assignedTo":
                    "@parameters('fo_ApproverEmail')",
                  "WebhookApprovalCreationInput/details":
                    "@concat('Controleer origineel, hoeveelheid en afwijking: ',triggerOutputs()?['body/fo_note'])",
                  "WebhookApprovalCreationInput/enableNotifications": false,
                  "WebhookApprovalCreationInput/enableReassignment": false,
                },
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
                Approve_row: action("UpdateRecord", {
                  entityName: "fo_deliveries",
                  recordId: "@triggerOutputs()?['body/fo_deliveryid']",
                  "item/fo_status": "approved",
                }),
                Queue_ERP: action(
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
                  { Approve_row: ["Succeeded"] },
                ),
              },
              else: {
                actions: {
                  Reject_row: action("UpdateRecord", {
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
              Invalid: action("CreateRecord", {
                entityName: "fo_auditevents",
                "item/fo_name": "Validatie mislukt",
                "item/fo_event": "validation_error",
                "item/fo_detail": "@triggerOutputs()?['body/fo_reference']",
              }),
            },
          },
          runAfter: {},
        },
        Approval_timeout: action(
          "CreateRecord",
          {
            entityName: "fo_auditevents",
            "item/fo_name": "Controleer goedkeuring",
            "item/fo_event": "approval_flow_failed",
          },
          { Validate: ["Failed", "TimedOut"] },
        ),
      },
    },
  },
};
const erpFlow = {
  name: "fo_SynchronizeERP",
  description:
    "SOURCE TEMPLATE: real ERP endpoint, auth, claim/lease and alternate key required",
  properties: {
    connectionReferences: {
      shared_commondataserviceforapps: refs.shared_commondataserviceforapps,
    },
    definition: {
      $schema: schema,
      contentVersion: "1.0.0.0",
      parameters: params,
      triggers: {
        Queued_job: trigger("fo_integrationjob", "fo_state eq 'queued'"),
      },
      actions: {
        Try: {
          type: "Scope",
          actions: {
            Get_delivery: action("GetItem", {
              entityName: "fo_deliveries",
              recordId: "@triggerOutputs()?['body/_fo_deliveryid_value']",
            }),
            Post_ERP: {
              type: "Http",
              inputs: {
                uri: "@parameters('fo_ErpEndpoint')",
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Idempotency-Key":
                    "@triggerOutputs()?['body/fo_idempotencykey']",
                  Authorization: "@concat('Bearer ',parameters('fo_ErpKey'))",
                },
                body: {
                  reference: "@outputs('Get_delivery')?['body/fo_reference']",
                  quantity: "@outputs('Get_delivery')?['body/fo_quantity']",
                  unit: "@outputs('Get_delivery')?['body/fo_unit']",
                },
                retryPolicy: {
                  type: "exponential",
                  count: 2,
                  interval: "PT10S",
                },
              },
              runtimeConfiguration: {
                secureData: { properties: ["inputs", "outputs"] },
              },
              runAfter: { Get_delivery: ["Succeeded"] },
            },
            Save_receipt: action(
              "UpdateRecord",
              {
                entityName: "fo_deliveries",
                recordId: "@triggerOutputs()?['body/_fo_deliveryid_value']",
                "item/fo_status": "synced",
                "item/fo_erp_id": "@body('Post_ERP')?['id']",
              },
              { Post_ERP: ["Succeeded"] },
            ),
            Complete_job: action(
              "UpdateRecord",
              {
                entityName: "fo_integrationjobs",
                recordId: "@triggerOutputs()?['body/fo_integrationjobid']",
                "item/fo_state": "done",
              },
              { Save_receipt: ["Succeeded"] },
            ),
          },
          runAfter: {},
        },
        Catch: {
          type: "Scope",
          actions: {
            Dead_letter: action("UpdateRecord", {
              entityName: "fo_integrationjobs",
              recordId: "@triggerOutputs()?['body/fo_integrationjobid']",
              "item/fo_state": "dead",
              "item/fo_error":
                "ERP-integratie mislukt; controleer beveiligde runhistoriek.",
            }),
          },
          runAfter: { Try: ["Failed", "TimedOut"] },
        },
      },
    },
  },
};
const errorFlow = {
  name: "fo_ErrorMonitor",
  description:
    "SOURCE TEMPLATE: creates internal audit alerts; no outbound mail enabled",
  properties: {
    connectionReferences: {
      shared_commondataserviceforapps: refs.shared_commondataserviceforapps,
    },
    definition: {
      $schema: schema,
      contentVersion: "1.0.0.0",
      parameters: params,
      triggers: {
        Every_15_minutes: {
          type: "Recurrence",
          recurrence: { frequency: "Minute", interval: 15 },
          runtimeConfiguration: { concurrency: { runs: 1 } },
        },
      },
      actions: {
        List_dead_jobs: action("ListRecords", {
          entityName: "fo_integrationjobs",
          $filter: "fo_state eq 'dead'",
          $top: 5000,
        }),
        Each_job: {
          type: "Foreach",
          foreach: "@outputs('List_dead_jobs')?['body/value']",
          actions: {
            Audit_alert: action("CreateRecord", {
              entityName: "fo_auditevents",
              "item/fo_name": "ERP-foutmelding",
              "item/fo_event": "integration_error",
              "item/fo_detail": "@items('Each_job')?['fo_error']",
            }),
            Mark_notified: action(
              "UpdateRecord",
              {
                entityName: "fo_integrationjobs",
                recordId: "@items('Each_job')?['fo_integrationjobid']",
                "item/fo_state": "dead_notified",
              },
              { Audit_alert: ["Succeeded"] },
            ),
          },
          runAfter: { List_dead_jobs: ["Succeeded"] },
        },
      },
    },
  },
};
for (const flow of [approvalFlow, erpFlow, errorFlow])
  await writeFile(
    `power-platform/flows/${flow.name}.json`,
    JSON.stringify(flow, null, 2),
  );
console.log(
  "3 cloud flow source definitions written; not activated or tenant-validated.",
);
