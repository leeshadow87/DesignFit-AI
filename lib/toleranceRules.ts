import type {
  FunctionType,
  RecommendationStatus,
  RiskLevel,
  RuleInput,
  RuleOutput,
  ToleranceType,
} from "@/types";

export function evaluateTolerance(input: RuleInput): RuleOutput {
  const risk = scoreRisk(input.toleranceType, input.currentTolerance);
  const recommendation = recommend(input.toleranceType, input.currentTolerance, input.functionType);
  const checks = requiredChecks(input.toleranceType, risk.riskLevel);

  return {
    riskLevel: risk.riskLevel,
    riskScore: risk.riskScore,
    reason: risk.reason,
    suggestedQuestions: buildQuestions(input),
    recommendationStatus: recommendation.status,
    recommendedRange: recommendation.range,
    caution: recommendation.caution,
    caeRequired: checks.caeRequired,
    seniorReviewRequired: checks.seniorReviewRequired,
  };
}

export function riskLabel(level: RiskLevel): string {
  return {
    critical: "치명",
    high: "높음",
    medium: "보통",
    low: "낮음",
  }[level];
}

export function statusLabel(status: RecommendationStatus): string {
  return {
    relax_candidate: "완화 후보",
    conditional: "조건부 완화",
    need_check: "검증 필요",
    keep: "유지 권장",
  }[status];
}

export function resolveByAnswer(
  functionType: FunctionType,
  riskLevel: RiskLevel
): { status: RecommendationStatus; caution: string } {
  if (["bearing", "sealing", "rotating"].includes(functionType)) {
    return {
      status: "keep",
      caution: "핵심 기능면입니다. 완화 전 CAE, 조립성, 수명 검증이 필요합니다.",
    };
  }

  if (["fastening", "cover", "cosmetic"].includes(functionType)) {
    return {
      status: riskLevel === "critical" ? "conditional" : "relax_candidate",
      caution: "체결/커버 기능이면 완화 여지가 있습니다. 간섭과 클리어런스를 먼저 확인하세요.",
    };
  }

  return {
    status: "need_check",
    caution: "기능 태깅이 필요합니다. 위치 결정, 압입, 밀봉, 회전체 여부를 확인하세요.",
  };
}

export interface SimulationResult {
  proposedTolerance: number;
  proposedRisk: RiskLevel;
  proposedScore: number;
  verdict: "가능" | "조건부 가능" | "불가";
  verdictReason: string;
  maxRecommended: number;
  maxRecommendedUnit: string;
}

export function simulateRelaxation(input: RuleInput, proposedTolerance: number): SimulationResult {
  const proposed = evaluateTolerance({ ...input, currentTolerance: proposedTolerance });
  const verdict =
    proposed.riskLevel === "low" || proposed.riskLevel === "medium"
      ? "가능"
      : proposed.riskLevel === "high"
        ? "조건부 가능"
        : "불가";

  return {
    proposedTolerance,
    proposedRisk: proposed.riskLevel,
    proposedScore: proposed.riskScore,
    verdict,
    verdictReason: proposed.reason,
    maxRecommended: suggestedMax(input.toleranceType),
    maxRecommendedUnit: input.toleranceType === "roughness" ? "um" : "mm",
  };
}

export function findMaxRelaxation(input: RuleInput): { maxValue: number; atRisk: RiskLevel } {
  const maxValue = suggestedMax(input.toleranceType);
  return {
    maxValue,
    atRisk: evaluateTolerance({ ...input, currentTolerance: maxValue }).riskLevel,
  };
}

function scoreRisk(type: ToleranceType, value: number): { riskLevel: RiskLevel; riskScore: number; reason: string } {
  if (type === "fit") {
    if (value <= 6) {
      return {
        riskLevel: "critical",
        riskScore: 90,
        reason: "H6 이하급 끼워맞춤은 정밀 보어 가공과 반복 측정이 필요합니다. 기능 근거 없이 지정하면 비용이 크게 증가합니다.",
      };
    }
    if (value <= 7) {
      return {
        riskLevel: "high",
        riskScore: 74,
        reason: "H7은 베어링 압입 또는 위치 결정 기능에서 자주 쓰입니다. 단순 관통부라면 완화 후보입니다.",
      };
    }
    return {
      riskLevel: "medium",
      riskScore: 45,
      reason: "일반 끼워맞춤 범위입니다. 기능에 따라 유지 또는 완화를 검토할 수 있습니다.",
    };
  }

  if (type === "roughness") {
    if (value <= 0.4) return high("Ra 0.4 이하는 연삭/래핑 등 추가 공정 가능성이 큽니다.", 86);
    if (value <= 0.8) return high("Ra 0.8은 접촉면, 밀봉면, 베어링면인지 확인해야 합니다.", 68);
    if (value <= 1.6) return medium("Ra 1.6은 정밀 가공면 수준입니다. 기능면이 아니면 완화 여지가 있습니다.", 42);
    return low("표면 거칠기 요구가 비교적 완화되어 있습니다.", 18);
  }

  if (["position", "profile", "runout", "total_runout", "concentricity", "cylindricity"].includes(type)) {
    if (value <= 0.02) return critical("GD&T 0.02 이하 요구는 정밀 지그, CMM 측정, 공정 제한을 유발합니다.", 92);
    if (value <= 0.05) return high("GD&T 0.05 이하는 제조와 검사 난이도가 높습니다. 기능 근거 확인이 필요합니다.", 74);
    if (value <= 0.1) return medium("GD&T 0.1 수준은 기능에 따라 완화 검토가 가능합니다.", 46);
    return low("GD&T 요구가 비교적 완화되어 있습니다.", 20);
  }

  if (["flatness", "perpendicularity", "parallelism"].includes(type)) {
    if (value <= 0.01) return critical("형상/방향 공차 0.01 이하는 정밀 가공과 평면 측정이 필요합니다.", 88);
    if (value <= 0.03) return high("형상/방향 공차가 타이트합니다. 기준면 기능을 확인해야 합니다.", 70);
    if (value <= 0.08) return medium("기능면이 아니면 완화 후보입니다.", 42);
    return low("일반 가공 범위에서 관리 가능한 수준입니다.", 18);
  }

  if (value <= 0.01) return critical("+/-0.01mm 이하는 비숙련 설계자가 과도하게 지정하기 쉬운 비용 상승 공차입니다.", 88);
  if (value <= 0.02) return high("+/-0.02mm는 일반 CNC보다 정밀 관리가 필요할 수 있습니다.", 74);
  if (value <= 0.05) return medium("+/-0.05mm는 기능에 따라 일반 공차로 완화 가능성을 검토할 수 있습니다.", 45);
  return low("일반 가공 공차 범위로 판단됩니다.", 18);
}

function recommend(
  type: ToleranceType,
  value: number,
  functionType: FunctionType
): { status: RecommendationStatus; range?: string; caution: string } {
  if (["bearing", "sealing", "rotating"].includes(functionType)) {
    return {
      status: "keep",
      range: "기능 검증 전 유지",
      caution: "핵심 기능면일 가능성이 있어 임의 완화 금지입니다.",
    };
  }

  if (type === "fit") {
    return {
      status: "need_check",
      range: value <= 7 ? "H8-H11 후보, 단 베어링/압입 제외" : "현재 유지 가능",
      caution: "끼워맞춤은 기능 확인 없이는 완화하면 안 됩니다.",
    };
  }

  if (type === "roughness") {
    return {
      status: value <= 0.8 ? "conditional" : "relax_candidate",
      range: value <= 0.8 ? "Ra 1.6-3.2 조건부 검토" : "Ra 3.2 이상 검토",
      caution: "밀봉면, 슬라이딩면, 베어링 접촉면이면 유지해야 합니다.",
    };
  }

  if (value <= 0.02) {
    return {
      status: "conditional",
      range: "0.03-0.08 조건부 검토",
      caution: "기능 태깅과 조립/CAE 검증이 필요합니다.",
    };
  }

  if (value <= 0.05) {
    return {
      status: "relax_candidate",
      range: "0.08-0.15 후보",
      caution: "체결 관통부 또는 커버면이면 완화 가능성이 있습니다.",
    };
  }

  return {
    status: "relax_candidate",
    range: "현재 수준 유지 또는 일반 공차화 검토",
    caution: "기능 요구가 낮으면 일반 공차로 전환할 수 있습니다.",
  };
}

function requiredChecks(type: ToleranceType, riskLevel: RiskLevel) {
  const caeRequired =
    riskLevel === "critical" ||
    ["runout", "total_runout", "concentricity", "profile"].includes(type);
  const seniorReviewRequired = riskLevel === "critical" || riskLevel === "high";
  return { caeRequired, seniorReviewRequired };
}

function buildQuestions(input: RuleInput): string[] {
  const questions = [
    "이 공차가 베어링, 밀봉, 회전 정렬, 위치 결정 중 어떤 기능에 직접 연결됩니까?",
    "현재 공차를 지정한 근거가 도면 표준, 기존 양산 이력, CAE 결과 중 어디에 있습니까?",
    "볼트 관통부나 커버 체결면처럼 기능 여유가 있는 항목입니까?",
  ];

  if (input.toleranceType === "fit") {
    questions.unshift("이 끼워맞춤은 압입/베어링 기준입니까, 단순 조립 위치 기준입니까?");
  }

  if (input.toleranceType === "roughness") {
    questions.unshift("이 표면은 밀봉면, 슬라이딩면, 베어링 접촉면입니까?");
  }

  return questions;
}

function suggestedMax(type: ToleranceType) {
  if (type === "roughness") return 3.2;
  if (type === "fit") return 8;
  return 0.1;
}

function critical(reason: string, score: number) {
  return { riskLevel: "critical" as RiskLevel, riskScore: score, reason };
}

function high(reason: string, score: number) {
  return { riskLevel: "high" as RiskLevel, riskScore: score, reason };
}

function medium(reason: string, score: number) {
  return { riskLevel: "medium" as RiskLevel, riskScore: score, reason };
}

function low(reason: string, score: number) {
  return { riskLevel: "low" as RiskLevel, riskScore: score, reason };
}
