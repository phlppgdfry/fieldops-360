export function extractFields(text, confidence = 1) {
  const pick = (re) => text.match(re)?.[1]?.trim() || "";
  const quantity = pick(
    /(?:hoeveelheid|quantity)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
  );
  const fields = {
    reference: pick(
      /(?:bonnummer|bonnr|delivery\s*note)\s*[:#]?\s*([A-Z0-9-]+)/i,
    ),
    supplier: pick(/(?:leverancier|supplier)\s*[:]?\s*([^\n]+)/i),
    quantity: quantity ? Number(quantity.replace(",", ".")) : null,
    unit: pick(/(?:eenheid|unit)\s*[:]?\s*([a-z³0-9]+)/i),
  };
  const warnings = [];
  for (const [key, value] of Object.entries(fields))
    if (value === null || value === "")
      warnings.push(`Ontbrekend veld: ${key}`);
  if (confidence < 0.85) warnings.push("Lage OCR-betrouwbaarheid");
  return {
    fields,
    confidence,
    warnings,
    requiresHumanReview: true,
    rawText: text,
  };
}
