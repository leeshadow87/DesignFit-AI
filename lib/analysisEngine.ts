/**
 * analysisEngine.ts
 * PDF 텍스트 → ExtractedItem → ToleranceCase 분석 파이프라인
 */

import { parseToleranceText, tokensToExtractedItems } from "./toleranceParser";
import { evaluateTolerance } from "./toleranceRules";
import type {
  ExtractedItem,
  ToleranceCase,
  ToleranceType,
  FeatureType,
  RuleInput,
} from "@/types";

// ============================================================
// 형상 추정 (rawText 기반 휴리스틱)
// ============================================================

function guessFeatureType(rawText: string, context: string): FeatureType {
  const t = rawText + " " + context;
  if (/Ø|직경|bore|내경/i.test(t)) {
    if (/bore|보어|내경/i.test(t)) return "bore";
    return "hole";
  }
  if (/shaft|샤프트|외경|축/i.test(t)) return "shaft";
  if (/평면|face|plane|면/i.test(t)) return "plane";
  if (/slot|슬롯|홈/i.test(t)) return "slot";
  if (/pocket|포켓/i.test(t)) return "pocket";
  if (/thread|나사|M[0-9]/i.test(t)) return "thread";
  if (/boss|보스/i.test(t)) return "boss";
  if (/패턴|pattern|BCD/i.test(t)) return "hole_pattern";
  return "unknown";
}

// ============================================================
// 수치 파싱
// ============================================================

function parseNumericTolerance(item: ExtractedItem): number {
  const val = item.normalizedValue;
  // ±0.01 → 0.01
  const pm = val.match(/[±]\s*(\d+\.?\d*)/);
  if (pm) return parseFloat(pm[1]);
  // Ra 0.8 → 0.8
  const ra = val.match(/Ra\s*(\d+\.?\d*)/i);
  if (ra) return parseFloat(ra[1]);
  // 0.02 (GDNT)
  const plain = val.match(/^(\d+\.?\d*)$/);
  if (plain) return parseFloat(plain[1]);
  return 0;
}

// ============================================================
// 메인 분석
// ============================================================

export function analyzeDrawingText(
  text: string,
  drawingId: string,
  pageNumber: number
): { items: ExtractedItem[]; cases: ToleranceCase[] } {
  const tokens = parseToleranceText(text);
  const items = tokensToExtractedItems(tokens, drawingId, pageNumber);

  const cases: ToleranceCase[] = [];

  for (const item of items) {
    // dimension, datum, material, note 항목은 케이스 생성 제외
    if (["dimension", "datum", "material", "note"].includes(item.itemType)) continue;

    const toleranceType = (item as ExtractedItem & { toleranceType?: ToleranceType }).toleranceType
      ?? (item.itemType === "roughness" ? "roughness" : item.itemType === "fit" ? "fit" : "plus_minus");

    const currentTolerance = parseNumericTolerance(item);
    if (currentTolerance <= 0) continue;

    const featureType = guessFeatureType(item.rawText, text.slice(0, 200));

    const ruleInput: RuleInput = {
      toleranceType,
      currentTolerance,
      featureType,
      functionType: "unknown",
      datumContext: item.rawText,
    };

    const result = evaluateTolerance(ruleInput);

    const tc: ToleranceCase = {
      id: `tc-${item.id}`,
      drawingId,
      extractedItemId: item.id,
      rawText: item.rawText,
      featureType,
      functionType: "unknown",
      currentTolerance,
      toleranceType,
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      riskReason: result.reason,
      recommendedRange: result.recommendedRange,
      recommendationStatus: result.recommendationStatus,
      caution: result.caution,
      caeRequired: result.caeRequired,
      seniorReviewRequired: result.seniorReviewRequired,
      suggestedQuestions: result.suggestedQuestions,
      pageNumber: item.pageNumber,
      bbox: item.bbox,
    };

    cases.push(tc);
  }

  // 위험도 내림차순 정렬
  const riskOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  cases.sort((a, b) => (riskOrder[b.riskLevel] ?? 0) - (riskOrder[a.riskLevel] ?? 0));

  return { items, cases };
}

// ============================================================
// 샘플 데모 데이터
// ============================================================

export function getDemoData(drawingId: string): { items: ExtractedItem[]; cases: ToleranceCase[] } {
  const sampleText = `
    Ø10 ±0.01 H7
    위치도 Ø0.02 A|B|C
    평면도 0.01
    Ra 0.8
    Ø20 ±0.05
    SCM440
    위치도 Ø0.05 A|B
    Ra 1.6
    ±0.1
    평면도 0.03
    동심도 0.01
    흔들림 0.02
  `;
  return analyzeDrawingText(sampleText, drawingId, 1);
}
