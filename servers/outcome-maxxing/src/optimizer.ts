const COMPRESSIONS: [RegExp, string][] = [
  [/\bplease\b/gi, ""],
  [/\bkindly\b/gi, ""],
  [/\bcould you\b/gi, ""],
  [/\bI would like you to\b/gi, ""],
  [/\bI need you to\b/gi, ""],
  [/\bI want you to\b/gi, ""],
  [/\bcan you please\b/gi, ""],
  [/\bwould you mind\b/gi, ""],
  [/\bin order to\b/gi, "to"],
  [/\bdue to the fact that\b/gi, "because"],
  [/\bat this point in time\b/gi, "now"],
  [/\bin the event that\b/gi, "if"],
  [/\bfor the purpose of\b/gi, "for"],
  [/\bas a result of\b/gi, "due to"],
  [/\bwith regard to\b/gi, "about"],
  [/\bit is important to note that\b/gi, "note:"],
  [/\bplease note that\b/gi, "note:"],
  [/ {2,}/g, " "],
];

const KO_COMPRESSIONS: [RegExp, string][] = [
  [/해 주시겠어요\?/g, "해줘"],
  [/해 주세요/g, "해줘"],
  [/해주시길 바랍니다/g, "해줘"],
  [/부탁드립니다/g, ""],
  [/감사합니다/g, ""],
  [/안녕하세요\.?\s*/g, ""],
];

export interface CompressionResult {
  original: string;
  compressed: string;
  originalTokens: number;
  compressedTokens: number;
  reductionPct: number;
}

function estimateTokens(text: string): number {
  const koreanChars = (text.match(/[가-힣]/g) ?? []).length;
  return Math.ceil(koreanChars / 2 + (text.length - koreanChars) / 4);
}

export function compressPrompt(prompt: string): CompressionResult {
  const originalTokens = estimateTokens(prompt);
  let compressed = prompt;

  for (const [p, r] of COMPRESSIONS) compressed = compressed.replace(p, r);
  for (const [p, r] of KO_COMPRESSIONS) compressed = compressed.replace(p, r);
  compressed = compressed.replace(/\n{3,}/g, "\n\n").trim();

  const compressedTokens = estimateTokens(compressed);
  const reductionPct =
    originalTokens > 0
      ? Math.round(((originalTokens - compressedTokens) / originalTokens) * 100)
      : 0;

  return { original: prompt, compressed, originalTokens, compressedTokens, reductionPct };
}
