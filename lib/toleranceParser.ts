import type { ExtractedItem, ItemType, ToleranceType } from "@/types";

interface PatternRule {
  itemType: ItemType;
  toleranceType?: ToleranceType;
  regex: RegExp;
  priority: number;
}

export interface ParsedToken {
  rawText: string;
  itemType: ItemType;
  toleranceType?: ToleranceType;
  normalizedValue: string;
  numericValue?: number;
  unit: string;
  startIndex: number;
}

const PATTERNS: PatternRule[] = [
  {
    itemType: "gdnt",
    toleranceType: "position",
    regex: /\b(?:POSITION|POS)\s*(?:DIA|Ø|⌀)?\s*(\d+(?:\.\d+)?)/gi,
    priority: 10,
  },
  {
    itemType: "gdnt",
    toleranceType: "profile",
    regex: /\bPROFILE(?:\s+OF\s+(?:SURFACE|LINE))?\s*(\d+(?:\.\d+)?)/gi,
    priority: 10,
  },
  {
    itemType: "gdnt",
    toleranceType: "flatness",
    regex: /\bFLATNESS\s*(\d+(?:\.\d+)?)/gi,
    priority: 10,
  },
  {
    itemType: "gdnt",
    toleranceType: "perpendicularity",
    regex: /\bPERPENDICULARITY\s*(\d+(?:\.\d+)?)/gi,
    priority: 10,
  },
  {
    itemType: "gdnt",
    toleranceType: "parallelism",
    regex: /\bPARALLELISM\s*(\d+(?:\.\d+)?)/gi,
    priority: 10,
  },
  {
    itemType: "gdnt",
    toleranceType: "runout",
    regex: /\b(?:RUNOUT|TOTAL\s+RUNOUT)\s*(\d+(?:\.\d+)?)/gi,
    priority: 10,
  },
  {
    itemType: "gdnt",
    toleranceType: "concentricity",
    regex: /\bCONCENTRICITY\s*(\d+(?:\.\d+)?)/gi,
    priority: 10,
  },
  {
    itemType: "gdnt",
    toleranceType: "cylindricity",
    regex: /\bCYLINDRICITY\s*(\d+(?:\.\d+)?)/gi,
    priority: 10,
  },
  {
    itemType: "roughness",
    toleranceType: "roughness",
    regex: /\bR[az]\s*(\d+(?:\.\d+)?)/gi,
    priority: 20,
  },
  {
    itemType: "fit",
    toleranceType: "fit",
    regex: /\b(?:DIA|Ø|⌀)?\s*\d+(?:\.\d+)?\s*([HhGgFf][5-9]|H1[01])\b/g,
    priority: 25,
  },
  {
    itemType: "tolerance",
    toleranceType: "asymmetric",
    regex: /([+-]\s*\d+(?:\.\d+)?)\s*\/\s*([+-]\s*\d+(?:\.\d+)?)/g,
    priority: 30,
  },
  {
    itemType: "tolerance",
    toleranceType: "plus_minus",
    regex: /(?:\+\/-|±)\s*(\d+(?:\.\d+)?)/g,
    priority: 30,
  },
  {
    itemType: "material",
    regex: /\b(?:SCM420|SCM440|SUS304|SUS316|AL6061|AL7075|Ti-6Al-4V|INCONEL\s*718|ADC12|A356)\b/gi,
    priority: 40,
  },
  {
    itemType: "dimension",
    regex: /\b(?:DIA|Ø|⌀|R|M)\s*\d+(?:\.\d+)?/gi,
    priority: 50,
  },
];

export function parseToleranceText(text: string): ParsedToken[] {
  const tokens: ParsedToken[] = [];
  const occupied = new Set<number>();

  for (const pattern of [...PATTERNS].sort((a, b) => a.priority - b.priority)) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (rangeUsed(occupied, start, end)) continue;

      const rawText = match[0].trim();
      const numericValue = extractNumber(match);
      const normalizedValue = normalizeValue(pattern, rawText, numericValue);
      const unit = pattern.toleranceType === "roughness" ? "um" : "mm";

      tokens.push({
        rawText,
        itemType: pattern.itemType,
        toleranceType: pattern.toleranceType,
        normalizedValue,
        numericValue,
        unit,
        startIndex: start,
      });

      for (let i = start; i < end; i += 1) occupied.add(i);
    }
  }

  return tokens.sort((a, b) => a.startIndex - b.startIndex);
}

export function tokensToExtractedItems(
  tokens: ParsedToken[],
  drawingId: string,
  pageNumber: number
): ExtractedItem[] {
  return tokens.map((token, index) => ({
    id: `ei-${drawingId}-p${pageNumber}-${index}-${Date.now()}`,
    drawingId,
    pageNumber,
    itemType: token.itemType,
    rawText: token.rawText,
    normalizedValue: token.normalizedValue,
    unit: token.unit,
    ocrConfidence: token.itemType === "dimension" ? 0.72 : 0.88,
    userCorrected: false,
  }));
}

function rangeUsed(occupied: Set<number>, start: number, end: number) {
  for (let i = start; i < end; i += 1) {
    if (occupied.has(i)) return true;
  }
  return false;
}

function extractNumber(match: RegExpExecArray) {
  for (let i = 1; i < match.length; i += 1) {
    const value = match[i]?.replace(/\s/g, "");
    if (!value) continue;
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return Math.abs(parsed);
  }
  const fallback = match[0].match(/\d+(?:\.\d+)?/);
  return fallback ? Number.parseFloat(fallback[0]) : undefined;
}

function normalizeValue(rule: PatternRule, rawText: string, numericValue?: number) {
  if (rule.toleranceType === "plus_minus" && numericValue !== undefined) return `+/-${numericValue}`;
  if (rule.toleranceType === "roughness" && numericValue !== undefined) return `Ra ${numericValue}`;
  if (rule.toleranceType && numericValue !== undefined) return `${numericValue}`;
  return rawText;
}
