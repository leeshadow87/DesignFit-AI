import type { RiskLevel } from "@/types";

export interface DimensionInput {
  id: string;
  label: string;
  nominal: number;
  plus: number;
  minus: number;
  functional: boolean;
}

export interface DimensionRange {
  id: string;
  label: string;
  nominal: number;
  min: number;
  max: number;
  width: number;
  functional: boolean;
}

export interface StackupResult {
  min: number;
  max: number;
  width: number;
  functionalCount: number;
  status: "ok" | "review" | "cae-required";
  reason: string;
}

export interface FitInput {
  holeNominal: number;
  holePlus: number;
  holeMinus: number;
  shaftNominal: number;
  shaftPlus: number;
  shaftMinus: number;
}

export interface FitResult {
  minClearance: number;
  maxClearance: number;
  condition: "clearance" | "transition" | "interference";
  riskLevel: RiskLevel;
  reason: string;
}

export interface AssemblyImpactInput {
  hasAssemblyDrawing: boolean;
  linkedToFunctionalChain: boolean;
  loadRelated: boolean;
  rotatingOrSealing: boolean;
}

export interface AssemblyImpactResult {
  reviewStatus:
    | "preliminary"
    | "assembly-info-required"
    | "calculable"
    | "cae-required"
    | "relaxation-candidate";
  label: string;
  reason: string;
}

export function calculateDimensionRange(input: DimensionInput): DimensionRange {
  return {
    id: input.id,
    label: input.label,
    nominal: input.nominal,
    min: round(input.nominal - Math.abs(input.minus)),
    max: round(input.nominal + Math.abs(input.plus)),
    width: round(Math.abs(input.plus) + Math.abs(input.minus)),
    functional: input.functional,
  };
}

export function calculateStackup(inputs: DimensionInput[]): StackupResult {
  const ranges = inputs.map(calculateDimensionRange);
  const min = round(ranges.reduce((sum, item) => sum + item.min, 0));
  const max = round(ranges.reduce((sum, item) => sum + item.max, 0));
  const width = round(max - min);
  const functionalCount = ranges.filter((item) => item.functional).length;

  if (functionalCount >= 2 && width <= 0.08) {
    return {
      min,
      max,
      width,
      functionalCount,
      status: "cae-required",
      reason: "기능 치수 체인에 타이트한 누적 공차가 걸려 있어 CAE 또는 시험 근거가 필요합니다.",
    };
  }

  if (width <= 0.15 || functionalCount > 0) {
    return {
      min,
      max,
      width,
      functionalCount,
      status: "review",
      reason: "어셈블리 영향이 있는 치수입니다. 단품 공차만 보고 완화 판단을 확정하면 안 됩니다.",
    };
  }

  return {
    min,
    max,
    width,
    functionalCount,
    status: "ok",
    reason: "현재 입력 기준으로는 일반 제조성 검토 범위입니다.",
  };
}

export function calculateFit(input: FitInput): FitResult {
  const holeMin = input.holeNominal - Math.abs(input.holeMinus);
  const holeMax = input.holeNominal + Math.abs(input.holePlus);
  const shaftMin = input.shaftNominal - Math.abs(input.shaftMinus);
  const shaftMax = input.shaftNominal + Math.abs(input.shaftPlus);
  const minClearance = round(holeMin - shaftMax);
  const maxClearance = round(holeMax - shaftMin);

  if (maxClearance < 0) {
    return {
      minClearance,
      maxClearance,
      condition: "interference",
      riskLevel: "critical",
      reason: "전 구간이 간섭입니다. 압입, 열박음, 구조 강도 목적이 아니라면 완화 또는 설계 검토가 필요합니다.",
    };
  }

  if (minClearance < 0 && maxClearance >= 0) {
    return {
      minClearance,
      maxClearance,
      condition: "transition",
      riskLevel: "high",
      reason: "간극과 간섭이 모두 가능한 전이 끼워맞춤입니다. 조립성, 공정 능력, 기능 요구 확인이 필요합니다.",
    };
  }

  if (minClearance <= 0.02) {
    return {
      minClearance,
      maxClearance,
      condition: "clearance",
      riskLevel: "high",
      reason: "간극이 매우 작습니다. 반복 조립, 표면처리, 온도 변화 영향을 검토해야 합니다.",
    };
  }

  return {
    minClearance,
    maxClearance,
    condition: "clearance",
    riskLevel: "medium",
    reason: "간극은 확보되어 있으나 기능 치수 체인 포함 여부에 따라 완화 판단이 달라집니다.",
  };
}

export function evaluateAssemblyImpact(input: AssemblyImpactInput): AssemblyImpactResult {
  if (!input.hasAssemblyDrawing) {
    return {
      reviewStatus: "assembly-info-required",
      label: "어셈블리 정보 필요",
      reason: "단품 도면만으로는 최종 공차 완화 가능 여부를 확정할 수 없습니다.",
    };
  }

  if (input.loadRelated || input.rotatingOrSealing) {
    return {
      reviewStatus: "cae-required",
      label: "CAE/시험 필요",
      reason: "하중, 회전, 씰링, 열 변형과 연결된 공차는 계산만으로 완화 확정이 어렵습니다.",
    };
  }

  if (input.linkedToFunctionalChain) {
    return {
      reviewStatus: "calculable",
      label: "계산 검토 가능",
      reason: "어셈블리 치수 체인과 연결되어 있어 누적 공차와 간극/간섭 계산을 수행할 수 있습니다.",
    };
  }

  return {
    reviewStatus: "relaxation-candidate",
    label: "완화 후보",
    reason: "현재 입력 기준으로 기능 치수 체인 영향이 낮아 완화 후보로 검토할 수 있습니다.",
  };
}

export function riskTone(level: RiskLevel | StackupResult["status"] | AssemblyImpactResult["reviewStatus"]) {
  if (level === "critical" || level === "cae-required") return "red";
  if (level === "high" || level === "assembly-info-required" || level === "review") return "orange";
  if (level === "medium" || level === "calculable" || level === "preliminary") return "blue";
  return "green";
}

function round(value: number) {
  return Math.round(value * 10000) / 10000;
}
