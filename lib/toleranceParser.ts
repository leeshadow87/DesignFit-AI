/**
 * toleranceParser.ts
 * PDF 텍스트에서 치수·공차·기하공차·재질·표면거칠기 패턴을 추출한다.
 */

import type { ExtractedItem, ItemType, ToleranceType } from "@/types";

// ============================================================
// 정규식 패턴
// ============================================================

const PATTERNS: { type: ItemType; toleranceType?: ToleranceType; regex: RegExp; priority: number }[] = [
  // 기하공차 — GD&T (반드시 치수 패턴보다 먼저)
  {
    type: "gdnt",
    toleranceType: "position",
    regex: /위치도\s*[⌖Ø⊕]?\s*Ø?\s*(\d+\.?\d*)/gi,
    priority: 10,
  },
  {
    type: "gdnt",
    toleranceType: "position",
    regex: /(?:pos(?:ition)?|位置度)\s*[⊕]?\s*Ø\s*(\d+\.?\d*)/gi,
    priority: 10,
  },
  {
    type: "gdnt",
    toleranceType: "flatness",
    regex: /평면도\s*(\d+\.?\d*)/gi,
    priority: 10,
  },
  {
    type: "gdnt",
    toleranceType: "flatness",
    regex: /(?:flatness|⏥)\s*(\d+\.?\d*)/gi,
    priority: 10,
  },
  {
    type: "gdnt",
    toleranceType: "straightness",
    regex: /진직도\s*(\d+\.?\d*)/gi,
    priority: 10,
  },
  {
    type: "gdnt",
    toleranceType: "roundness",
    regex: /진원도\s*(\d+\.?\d*)/gi,
    priority: 10,
  },
  {
    type: "gdnt",
    toleranceType: "cylindricity",
    regex: /원통도\s*(\d+\.?\d*)/gi,
    priority: 10,
  },
  {
    type: "gdnt",
    toleranceType: "perpendicularity",
    regex: /직각도\s*(\d+\.?\d*)/gi,
    priority: 10,
  },
  {
    type: "gdnt",
    toleranceType: "parallelism",
    regex: /평행도\s*(\d+\.?\d*)/gi,
    priority: 10,
  },
  {
    type: "gdnt",
    toleranceType: "runout",
    regex: /흔들림\s*(\d+\.?\d*)/gi,
    priority: 10,
  },
  {
    type: "gdnt",
    toleranceType: "concentricity",
    regex: /동심도\s*(\d+\.?\d*)/gi,
    priority: 10,
  },
  {
    type: "gdnt",
    toleranceType: "concentricity",
    regex: /동축도\s*(\d+\.?\d*)/gi,
    priority: 10,
  },
  {
    type: "gdnt",
    toleranceType: "profile",
    regex: /윤곽도\s*(\d+\.?\d*)/gi,
    priority: 10,
  },
  // 끼워맞춤 공차
  {
    type: "fit",
    toleranceType: "fit",
    regex: /(?:Ø\s*\d+\.?\d*\s*)?([A-Z][0-9]+)\b/g,
    priority: 20,
  },
  {
    type: "fit",
    toleranceType: "fit",
    regex: /(?:Ø\s*\d+\.?\d*\s*)?([a-z][0-9]+)\b/g,
    priority: 20,
  },
  // 비대칭 공차
  {
    type: "tolerance",
    toleranceType: "asymmetric",
    regex: /([+\-]\s*\d+\.?\d*)\s*\/\s*([+\-]\s*\d+\.?\d*)/g,
    priority: 25,
  },
  // ± 공차
  {
    type: "tolerance",
    toleranceType: "plus_minus",
    regex: /[±＋－]\s*(\d+\.?\d*)/g,
    priority: 30,
  },
  // 표면거칠기
  {
    type: "roughness",
    toleranceType: "roughness",
    regex: /Ra\s*(\d+\.?\d*)/gi,
    priority: 5,
  },
  {
    type: "roughness",
    toleranceType: "roughness",
    regex: /Rz\s*(\d+\.?\d*)/gi,
    priority: 5,
  },
  // Datum
  {
    type: "datum",
    regex: /(?:datum|기준면|기준점)?\s*[|\[]\s*([A-C](?:-[A-C])*)\s*[|\]]/gi,
    priority: 5,
  },
  // 재질
  {
    type: "material",
    regex: /\b(AL6061|AL7075|SCM[0-9]+|SUS[0-9]+|S[0-9]+C|SK[A-Z0-9]+|Inconel\s*[0-9]+|Ti[-\s]?6Al|AMS[0-9]+|SS400|SM[0-9]+A)\b/gi,
    priority: 5,
  },
  // 치수 (직경, 반경, 일반)
  {
    type: "dimension",
    regex: /Ø\s*(\d+\.?\d*)/g,
    priority: 40,
  },
  {
    type: "dimension",
    regex: /R\s*(\d+\.?\d*)/g,
    priority: 40,
  },
  {
    type: "dimension",
    regex: /M(\d+(?:\.\d+)?(?:x\d+\.?\d*)?)/gi,
    priority: 40,
  },
];

// 끼워맞춤 기호 집합
const FIT_UPPER = new Set(["H", "J", "K", "M", "N", "P", "R", "S", "T", "U", "V", "X", "Z"]);
const FIT_LOWER = new Set(["a", "b", "c", "d", "e", "f", "g", "h", "js", "k", "m", "n", "p", "r", "s", "t", "u", "v", "x", "z"]);

function isFitCode(text: string): boolean {
  if (!text) return false;
  const upper = text.match(/^([A-Z])[0-9]+$/);
  if (upper) return FIT_UPPER.has(upper[1]);
  const lower = text.match(/^([a-z]{1,2})[0-9]+$/);
  if (lower) return FIT_LOWER.has(lower[1]);
  return false;
}

// ============================================================
// 파서 메인
// ============================================================

export interface ParsedToken {
  rawText: string;
  itemType: ItemType;
  toleranceType?: ToleranceType;
  normalizedValue: string;
  numericValue?: number;
  unit: string;
  startIndex: number;
}

export function parseToleranceText(text: string): ParsedToken[] {
  const tokens: ParsedToken[] = [];
  const covered = new Set<string>();  // "start-end" 중복 방지

  const sortedPatterns = [...PATTERNS].sort((a, b) => a.priority - b.priority);

  for (const pattern of sortedPatterns) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;
      const key = `${start}-${end}`;
      if (covered.has(key)) continue;

      // 끼워맞춤 검증
      if (pattern.type === "fit") {
        const code = match[1];
        if (!isFitCode(code)) continue;
      }

      const rawText = match[0].trim();
      let normalizedValue = rawText;
      let numericValue: number | undefined;
      let unit = "mm";

      // 정규화
      if (pattern.toleranceType === "plus_minus" && match[1]) {
        numericValue = parseFloat(match[1]);
        normalizedValue = `±${numericValue}`;
      } else if (pattern.toleranceType === "roughness" && match[1]) {
        numericValue = parseFloat(match[1]);
        unit = "μm";
        normalizedValue = `Ra ${numericValue}`;
      } else if (
        pattern.toleranceType &&
        ["position", "flatness", "straightness", "roundness", "cylindricity",
          "perpendicularity", "parallelism", "runout", "concentricity", "profile"].includes(pattern.toleranceType) &&
        match[1]
      ) {
        numericValue = parseFloat(match[1]);
        normalizedValue = `${numericValue}`;
      }

      tokens.push({
        rawText,
        itemType: pattern.type,
        toleranceType: pattern.toleranceType,
        normalizedValue,
        numericValue,
        unit,
        startIndex: start,
      });

      // 커버 범위 등록
      for (let i = start; i < end; i++) covered.add(`${i}-${i + 1}`);
      covered.add(key);
    }
  }

  return tokens.sort((a, b) => a.startIndex - b.startIndex);
}

// ============================================================
// ExtractedItem 변환
// ============================================================

export function tokensToExtractedItems(
  tokens: ParsedToken[],
  drawingId: string,
  pageNumber: number
): ExtractedItem[] {
  return tokens.map((token, idx) => ({
    id: `ei-${drawingId}-p${pageNumber}-${idx}-${Date.now()}`,
    drawingId,
    pageNumber,
    itemType: token.itemType,
    rawText: token.rawText,
    normalizedValue: token.normalizedValue,
    unit: token.unit,
    ocrConfidence: 0.9,
    userCorrected: false,
  }));
}
