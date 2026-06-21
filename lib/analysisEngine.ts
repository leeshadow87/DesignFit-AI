import { parseToleranceText, tokensToExtractedItems } from "./toleranceParser";
import { evaluateTolerance } from "./toleranceRules";
import type {
  ExtractedItem,
  FeatureType,
  RuleInput,
  ToleranceCase,
  ToleranceType,
} from "@/types";

export function analyzeDrawingText(
  text: string,
  drawingId: string,
  pageNumber: number
): { items: ExtractedItem[]; cases: ToleranceCase[] } {
  const tokens = parseToleranceText(text);
  const items = tokensToExtractedItems(tokens, drawingId, pageNumber);

  const cases = items
    .filter((item) => !["dimension", "datum", "material", "note"].includes(item.itemType))
    .map((item, index) => {
      const toleranceType = guessToleranceType(item);
      const currentTolerance = parseNumericTolerance(item);
      const featureType = guessFeatureType(item.rawText, text);
      const ruleInput: RuleInput = {
        toleranceType,
        currentTolerance,
        featureType,
        functionType: "unknown",
        datumContext: item.rawText,
      };
      const result = evaluateTolerance(ruleInput);

      return {
        id: `tc-${item.id}-${index}`,
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
      } satisfies ToleranceCase;
    })
    .filter((tc) => tc.currentTolerance > 0 || tc.toleranceType === "fit")
    .sort((a, b) => riskRank(b.riskLevel) - riskRank(a.riskLevel));

  return { items, cases };
}

export function getDemoData(drawingId: string): { items: ExtractedItem[]; cases: ToleranceCase[] } {
  const sampleText = [
    "DIA 18.000 H7",
    "POSITION DIA 0.025 A|B|C",
    "PROFILE 0.018 A|B",
    "TOTAL RUNOUT 0.015 A",
    "FLATNESS 0.010",
    "Ra 0.8",
    "+/-0.01",
  ].join("\n");

  return analyzeDrawingText(sampleText, drawingId, 1);
}

function guessToleranceType(item: ExtractedItem): ToleranceType {
  const raw = item.rawText.toUpperCase();
  if (raw.includes("POSITION") || raw.includes(" POS")) return "position";
  if (raw.includes("PROFILE")) return "profile";
  if (raw.includes("FLATNESS")) return "flatness";
  if (raw.includes("PERPENDICULARITY")) return "perpendicularity";
  if (raw.includes("PARALLELISM")) return "parallelism";
  if (raw.includes("RUNOUT")) return "runout";
  if (raw.includes("CONCENTRICITY")) return "concentricity";
  if (raw.includes("CYLINDRICITY")) return "cylindricity";
  if (raw.includes("RA") || raw.includes("RZ")) return "roughness";
  if (/[HhGgFf][5-9]|H1[01]/.test(raw)) return "fit";
  if (raw.includes("/") && /[+-]/.test(raw)) return "asymmetric";
  return "plus_minus";
}

function parseNumericTolerance(item: ExtractedItem): number {
  if (item.itemType === "fit") {
    const fit = item.rawText.match(/(?:H|h|G|g|F|f)(\d+)/);
    return fit ? Number.parseFloat(fit[1]) : 7;
  }

  const match = item.normalizedValue.match(/\d+(?:\.\d+)?/);
  if (match) return Number.parseFloat(match[0]);

  const rawMatch = item.rawText.match(/\d+(?:\.\d+)?/);
  return rawMatch ? Number.parseFloat(rawMatch[0]) : 0;
}

function guessFeatureType(rawText: string, context: string): FeatureType {
  const text = `${rawText} ${context}`.toUpperCase();
  if (text.includes("BORE") || text.includes("BEARING")) return "bore";
  if (text.includes("SHAFT")) return "shaft";
  if (text.includes("SLOT") || text.includes("FIR TREE")) return "slot";
  if (text.includes("THREAD") || /\bM\d+/.test(text)) return "thread";
  if (text.includes("BOLT") || text.includes("HOLE") || text.includes("DIA")) return "hole";
  if (text.includes("FACE") || text.includes("FLATNESS")) return "plane";
  return "unknown";
}

function riskRank(level: string) {
  return { critical: 4, high: 3, medium: 2, low: 1 }[level as "critical" | "high" | "medium" | "low"] ?? 0;
}
