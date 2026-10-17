import { test } from "node:test";
import assert from "node:assert/strict";
import { deliveryCsv, csvCell } from "../app/export.js";
test("CSV preserves quoted values and neutralizes spreadsheet formulas", () => {
  assert.equal(csvCell('A;"B"'), '"A;""B"""');
  for (const input of [
    '=HYPERLINK("https://example.com")',
    " +SUM(1;2)",
    "\t@SUM(1;2)",
    "-1+1",
  ])
    assert.ok(csvCell(input).startsWith("\"'"));
  const out = deliveryCsv([
    {
      reference: "TEST",
      site_name: "Brugge",
      supplier: "Beton",
      quantity: 18,
      expected: 24,
      unit: "ton",
      status: "pending",
    },
  ]);
  assert.ok(out.startsWith("\uFEFF"));
  assert.ok(out.includes('"Ter controle"'));
  assert.equal(out.split("\r\n").length, 2);
});
