import { client } from "./dataverse.mjs";
const call = client();
const who = await call("WhoAmI");
const roles = await call(
  `systemusers(${who.UserId})/systemuserroles_association?$select=name`,
);
let privilegeResult;
try {
  const privileges = await call(`RetrieveUserPrivileges(UserId=${who.UserId})`);
  const target = await call(
    "privileges?$filter=name eq 'prvCreateEntity'&$select=privilegeid",
  );
  const id = target.value[0]?.privilegeid;
  privilegeResult = Boolean(
    privileges.RolePrivileges?.some((p) => p.PrivilegeId === id),
  );
} catch {
  privilegeResult =
    "Could not enumerate privilege; run provisioning to verify.";
}
console.log(
  JSON.stringify(
    {
      roles: roles.value.map((r) => r.name),
      canCreateDataverseTables: privilegeResult,
      requiredChange:
        "An authorized admin assigns System Customizer alongside Environment Maker in the selected development environment. This script never changes roles.",
    },
    null,
    2,
  ),
);
