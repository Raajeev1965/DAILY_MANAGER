// Keyword-based auto-categorizer. Longer, more specific keywords score higher.
export const KEYS: Record<string, string[]> = {
  Grocery: ["grocery", "groceries", "vegetable", "vegetables", "sabzi", "fruit", "fruits", "milk", "dudh", "kirana", "atta", "flour", "rice", "dal", "sugar", "bread", "egg", "eggs", "tea powder", "supermarket", "bigbasket", "blinkit", "zepto", "ration", "snacks", "biscuit"],
  Health: ["health", "medicine", "medicines", "medical", "dawa", "doctor", "hospital", "clinic", "pharmacy", "chemist", "dentist", "tablet", "tablets", "checkup", "lab test", "blood test", "surgery", "physio", "eye test", "spectacles"],
  Communication: ["communication", "recharge", "mobile", "phone", "internet", "wifi", "broadband", "sim", "postpaid", "prepaid", "airtel", "jio", "bsnl", "dth", "tata play", "telephone", "data pack", "whatsapp"],
  Bills: ["bill", "bills", "electricity", "bijli", "light bill", "rent", "water", "gas", "cylinder", "emi", "loan", "insurance", "premium", "tax", "maintenance", "school fee", "fees", "subscription", "netflix", "property tax"],
  Fuel: ["fuel", "petrol", "diesel", "cng", "pump", "refuel", "engine oil", "petrol pump"],
};

export function guess(text: string): { cat: string; score: number } {
  const l = text.toLowerCase();
  let best = "Miscellaneous", top = 0;
  for (const [cat, words] of Object.entries(KEYS)) {
    let s = 0;
    for (const w of words) if (new RegExp("\\b" + w + "\\b").test(l)) s += w.length;
    if (s > top) { top = s; best = cat; }
  }
  return { cat: best, score: top };
}
