/**
 * toleranceRules.ts
 * 룰엔진 — 공차 위험도 평가 및 기능 확인 질문 생성
 * 판단은 단정하지 않고 반드시 근거와 조건을 포함한다.
 */

import type {
  RuleInput,
  RuleOutput,
  RiskLevel,
  RecommendationStatus,
  ToleranceType,
  FeatureType,
  FunctionType,
} from "@/types";

// ============================================================
// 위험도 판정 테이블 — 치수공차 ±mm
// ============================================================

interface TolThreshold {
  max: number;
  risk: RiskLevel;
  score: number;
  reason: string;
}

const PLUS_MINUS_THRESHOLDS: TolThreshold[] = [
  {
    max: 0.005,
    risk: "critical",
    score: 95,
    reason:
      "±0.005mm 이하는 연삭·호닝·랩핑 등 정밀 공정과 CMM 전수 검사가 필요한 수준입니다. 기능적 필요성을 반드시 확인해야 합니다.",
  },
  {
    max: 0.01,
    risk: "critical",
    score: 88,
    reason:
      "±0.01mm는 정밀 연삭 또는 보링/리밍 공정이 필요하며 온도 관리와 전용 게이지 또는 CMM 검사가 요구될 가능성이 높습니다.",
  },
  {
    max: 0.02,
    risk: "high",
    score: 75,
    reason:
      "±0.02mm는 일반 CNC 선삭/밀링으로 관리가 어려울 수 있으며, 정밀 공정 또는 전용 지그가 필요할 수 있습니다.",
  },
  {
    max: 0.05,
    risk: "high",
    score: 62,
    reason:
      "±0.05mm는 CNC 정밀 가공 범위이나 재질·형상에 따라 반복 재현성을 검토해야 합니다.",
  },
  {
    max: 0.1,
    risk: "medium",
    score: 40,
    reason:
      "±0.1mm는 일반 CNC 가공 범위이나 기능 요구에 비해 과도한지 확인이 필요합니다.",
  },
  {
    max: 0.2,
    risk: "low",
    score: 20,
    reason: "±0.2mm는 일반 가공 공차 범위로 대부분의 CNC 공정에서 관리 가능합니다.",
  },
  {
    max: Infinity,
    risk: "low",
    score: 8,
    reason: "일반공차 수준으로 가공성 문제는 낮습니다.",
  },
];

// ============================================================
// 기하공차 위험도 테이블
// ============================================================

interface GdntThreshold {
  type: ToleranceType;
  max: number;
  risk: RiskLevel;
  score: number;
  reason: string;
}

const GDNT_THRESHOLDS: GdntThreshold[] = [
  // 위치도
  { type: "position", max: 0.02, risk: "critical", score: 92, reason: "위치도 Ø0.02 이하는 정밀 지그/CMM 반복 측정이 필요합니다." },
  { type: "position", max: 0.05, risk: "high", score: 72, reason: "위치도 Ø0.05는 정밀 가공 및 검사 설비가 필요할 수 있습니다." },
  { type: "position", max: 0.1, risk: "medium", score: 45, reason: "위치도 Ø0.1은 기능에 따라 완화 가능성을 검토할 수 있습니다." },
  { type: "position", max: Infinity, risk: "low", score: 15, reason: "위치도 공차가 비교적 여유롭습니다." },
  // 평면도
  { type: "flatness", max: 0.01, risk: "critical", score: 90, reason: "평면도 0.01 이하는 정밀 평삭·래핑과 평면 측정기가 필요합니다." },
  { type: "flatness", max: 0.02, risk: "high", score: 73, reason: "평면도 0.02는 정밀 밀링 또는 연삭 후 검사가 필요할 수 있습니다." },
  { type: "flatness", max: 0.05, risk: "medium", score: 42, reason: "평면도 0.05는 기능에 따라 완화 가능성이 있습니다." },
  { type: "flatness", max: Infinity, risk: "low", score: 18, reason: "평면도 공차가 비교적 여유롭습니다." },
  // 원통도
  { type: "cylindricity", max: 0.005, risk: "critical", score: 93, reason: "원통도 0.005 이하는 연삭·호닝과 원통 측정기가 필요합니다." },
  { type: "cylindricity", max: 0.01, risk: "high", score: 78, reason: "원통도 0.01은 정밀 연삭 가공이 필요할 수 있습니다." },
  { type: "cylindricity", max: Infinity, risk: "medium", score: 38, reason: "원통도 공차를 기능 기준으로 검토하세요." },
  // 동심도/동축도
  { type: "concentricity", max: 0.01, risk: "critical", score: 91, reason: "동심도 0.01 이하는 회전체·씰링 정밀 정렬이 필요한 수준입니다." },
  { type: "concentricity", max: 0.02, risk: "high", score: 74, reason: "동심도 0.02는 회전체/씰링 기능 여부를 반드시 확인해야 합니다." },
  { type: "concentricity", max: Infinity, risk: "medium", score: 40, reason: "동심도 기능 요구를 검토하세요." },
  // 직각도
  { type: "perpendicularity", max: 0.01, risk: "high", score: 70, reason: "직각도 0.01은 정밀 가공 및 검사가 필요합니다." },
  { type: "perpendicularity", max: Infinity, risk: "medium", score: 38, reason: "직각도 기능 요구를 검토하세요." },
  // 흔들림
  { type: "runout", max: 0.01, risk: "critical", score: 88, reason: "흔들림 0.01 이하는 고정밀 회전부에 해당하며 밸런싱 검토가 필요합니다." },
  { type: "runout", max: 0.02, risk: "high", score: 70, reason: "흔들림 0.02는 회전 기능이면 유지, 단순 체결이면 완화 후보입니다." },
  { type: "runout", max: Infinity, risk: "medium", score: 35, reason: "흔들림 기능 요구를 검토하세요." },
];

// ============================================================
// 표면거칠기 위험도
// ============================================================

interface RoughnessThreshold {
  max: number;
  risk: RiskLevel;
  score: number;
  reason: string;
}

const ROUGHNESS_THRESHOLDS: RoughnessThreshold[] = [
  { max: 0.4, risk: "critical", score: 85, reason: "Ra 0.4 이하는 경면 연삭·래핑이 필요하며 별도 검사 장비가 필요합니다." },
  { max: 0.8, risk: "high", score: 68, reason: "Ra 0.8은 씰링면·베어링 접촉면 등 기능면 여부를 확인해야 합니다." },
  { max: 1.6, risk: "medium", score: 42, reason: "Ra 1.6은 일반 정밀 가공 수준이나 기능 요구를 검토하세요." },
  { max: 3.2, risk: "low", score: 18, reason: "Ra 3.2는 일반 절삭 가공으로 달성 가능한 수준입니다." },
  { max: Infinity, risk: "low", score: 8, reason: "표면거칠기 요구가 완화된 수준입니다." },
];

// ============================================================
// 끼워맞춤 공차 위험도
// ============================================================

interface FitRule {
  pattern: RegExp;
  risk: RiskLevel;
  score: number;
  reason: string;
  suggestedQuestions: string[];
}

const FIT_RULES: FitRule[] = [
  {
    pattern: /H[45]|h[45]/,
    risk: "critical",
    score: 92,
    reason: "H4/H5 끼워맞춤은 고정밀 베어링·정밀 핀 삽입 수준으로 연삭 공정이 필요합니다.",
    suggestedQuestions: ["이 구멍은 어떤 부품이 삽입됩니까? 정밀 베어링, 게이지 핀, 일반 핀 중 어느 쪽입니까?"],
  },
  {
    pattern: /H[67]|h[67]/,
    risk: "high",
    score: 70,
    reason: "H7/H6은 베어링·정밀 핀 삽입 또는 슬라이딩 끼워맞춤에 사용됩니다. 기능에 따라 완화 가능성이 있습니다.",
    suggestedQuestions: [
      "이 H7 구멍은 베어링 삽입부입니까, 단순 위치결정 핀 홀입니까, 볼트 관통홀입니까?",
    ],
  },
  {
    pattern: /H[89]|H1[01]/,
    risk: "medium",
    score: 38,
    reason: "H8~H11은 일반 끼워맞춤 범위로 기능에 따라 완화 또는 유지를 검토할 수 있습니다.",
    suggestedQuestions: ["이 끼워맞춤 기능이 무엇인지 확인해 주세요."],
  },
  {
    pattern: /[gf][67]/,
    risk: "high",
    score: 65,
    reason: "g6/f7은 슬라이딩 끼워맞춤에 사용되며 가공 정밀도와 표면 거칠기 관리가 필요합니다.",
    suggestedQuestions: ["이 축은 슬라이딩 동작이 있습니까, 고정 조립입니까?"],
  },
];

// ============================================================
// 기능 기반 추천 결정
// ============================================================

function getRecommendationByFunction(
  functionType: FunctionType,
  riskLevel: RiskLevel
): { status: RecommendationStatus; caution: string } {
  if (functionType === "bearing") {
    return { status: "keep", caution: "베어링 삽입부는 끼워맞춤 공차 유지 권장. 완화 시 유격 증가로 소음·진동·수명 저하 위험." };
  }
  if (functionType === "sealing") {
    return { status: "keep", caution: "씰링면은 공차·표면거칠기 유지 권장. 완화 시 누설 위험. CAE 또는 시험 검증 필요." };
  }
  if (functionType === "rotating") {
    return { status: "need_check", caution: "회전 정렬 기능이면 동심도·흔들림 유지 권장. 밸런싱 검토 필요." };
  }
  if (functionType === "fastening") {
    if (riskLevel === "critical" || riskLevel === "high") {
      return { status: "relax_candidate", caution: "볼트/나사 체결용이면 공차를 상당히 완화할 수 있습니다. 볼트 헤드 착좌면 평면도만 확인하세요." };
    }
    return { status: "relax_candidate", caution: "체결 기능이면 일반공차 수준으로 완화 후보." };
  }
  if (functionType === "locating") {
    return { status: "conditional", caution: "위치결정 기능이면 재검토 필요. 핀 홀이면 유지, 볼트 통과홀이면 완화 가능." };
  }
  if (functionType === "cover" || functionType === "cosmetic") {
    return { status: "relax_candidate", caution: "커버·외관 부품이면 일반공차로 완화 가능성이 높습니다." };
  }
  if (functionType === "sliding") {
    return { status: "conditional", caution: "슬라이딩 기능이면 끼워맞춤 공차와 표면거칠기는 유지 권장. 마찰·마모 검토 필요." };
  }

  // unknown — risk 기반 기본값
  if (riskLevel === "critical") return { status: "need_check", caution: "기능 미확인 상태에서 고위험 공차는 선임자 검토 필요." };
  if (riskLevel === "high") return { status: "need_check", caution: "기능을 확인 후 완화 여부를 결정하세요." };
  if (riskLevel === "medium") return { status: "conditional", caution: "기능 확인 후 완화 후보를 검토하세요." };
  return { status: "relax_candidate", caution: "일반 가공 공차 범위로 완화 후보 검토 가능." };
}

// ============================================================
// 기능 확인 질문 생성
// ============================================================

function buildQuestions(input: RuleInput, riskLevel: RiskLevel): string[] {
  const q: string[] = [];
  const { toleranceType, featureType, currentTolerance } = input;

  if (toleranceType === "fit") {
    q.push("이 끼워맞춤 구멍/축은 베어링 삽입부입니까, 위치결정 핀입니까, 볼트 관통홀입니까?");
    return q;
  }

  if (toleranceType === "position") {
    q.push(
      `이 위치도 Ø${currentTolerance}는 위치결정 핀 홀입니까, 볼트 관통홀입니까?`
    );
    q.push("이 홀 패턴이 상대 부품의 기준 위치를 결정합니까?");
    return q;
  }

  if (toleranceType === "flatness") {
    q.push("이 평면은 씰링면(O-링, 가스켓)입니까, 단순 체결면입니까?");
    if (currentTolerance <= 0.02) {
      q.push("이 면의 가공 후 래핑 또는 연삭 공정이 현재 계획에 포함되어 있습니까?");
    }
    return q;
  }

  if (toleranceType === "roughness") {
    q.push("이 표면은 유체 씰링면 또는 슬라이딩 접촉면입니까, 외관/단순 접합면입니까?");
    return q;
  }

  if (toleranceType === "concentricity") {
    q.push("이 동심도/동축도는 회전 정렬 기능이 있습니까, 단순 조립 기준입니까?");
    return q;
  }

  if (toleranceType === "runout") {
    q.push("이 부품은 회전체입니까? 흔들림이 기능에 직접 영향을 줍니까?");
    return q;
  }

  if (toleranceType === "cylindricity") {
    q.push("이 원통면은 베어링 저널이거나 씰링 접촉면입니까?");
    return q;
  }

  // plus_minus — feature 기반
  if (featureType === "hole" || featureType === "bore") {
    q.push(`이 Ø 치수 ±${currentTolerance}mm 구멍은 어떤 부품이 삽입됩니까? (베어링, 핀, 볼트, 축)`);
  } else if (featureType === "shaft") {
    q.push(`이 축 직경 ±${currentTolerance}mm는 상대 구멍과의 끼워맞춤 기능이 있습니까?`);
  } else if (featureType === "plane") {
    q.push(`이 평면 공차 ±${currentTolerance}mm는 씰링 또는 정밀 접촉 기능이 있습니까?`);
  } else {
    q.push(`이 ±${currentTolerance}mm 공차는 어떤 기능 요구에 의해 설정되었습니까?`);
  }

  if (riskLevel === "critical" || riskLevel === "high") {
    q.push("이 공차를 설정한 근거 도면/표준/CAE 결과가 있습니까?");
  }

  return q;
}

// ============================================================
// 완화 후보 범위 제안
// ============================================================

function buildRecommendedRange(input: RuleInput): string | undefined {
  const { toleranceType, currentTolerance, featureType } = input;

  if (toleranceType === "plus_minus") {
    if (currentTolerance <= 0.005) {
      return "기능이 일반 체결이면 ±0.05~±0.1 완화 후보 검토 가능. 정밀 조립이면 ±0.01~±0.02 재검토.";
    }
    if (currentTolerance <= 0.01) {
      return "기능이 볼트 체결이면 ±0.05~±0.1, 정밀 끼워맞춤이면 ±0.02~±0.03 완화 후보.";
    }
    if (currentTolerance <= 0.02) {
      return "기능이 단순 조립이면 ±0.05~±0.1, 정밀 조립이면 ±0.03 재검토.";
    }
    if (currentTolerance <= 0.05) {
      return "일반 CNC 가공 공차(±0.1~±0.2) 완화 가능성 검토.";
    }
    return "현재 공차가 적절한 수준입니다.";
  }

  if (toleranceType === "position") {
    if (currentTolerance <= 0.02) {
      return "볼트 관통홀이면 Ø0.1~Ø0.2 완화 후보. 위치결정 핀 홀이면 유지 권장.";
    }
    if (currentTolerance <= 0.05) {
      return "볼트 관통홀이면 Ø0.1~Ø0.2 완화 후보.";
    }
    return "기능에 따라 일반공차 수준 검토 가능.";
  }

  if (toleranceType === "flatness") {
    if (currentTolerance <= 0.01) {
      return "씰링면이면 유지 권장 또는 CAE/시험 필요. 단순 체결면이면 0.03~0.05 완화 후보.";
    }
    if (currentTolerance <= 0.02) {
      return "단순 커버 체결면이면 0.05~0.1 완화 후보.";
    }
    return "기능 확인 후 일반공차 검토 가능.";
  }

  if (toleranceType === "roughness") {
    if (currentTolerance <= 0.8) {
      return "씰링/슬라이딩면이면 유지 권장. 외관·단순 접합면이면 Ra 1.6~3.2 완화 후보.";
    }
    if (currentTolerance <= 1.6) {
      return "외관면이면 Ra 3.2~6.3 완화 후보 검토 가능.";
    }
    return "표면거칠기가 완화된 수준입니다.";
  }

  if (toleranceType === "fit") {
    return "베어링 삽입부이면 H7 유지 권장. 볼트 관통홀이면 H11 또는 일반공차로 완화 가능.";
  }

  return undefined;
}

// ============================================================
// 메인 룰엔진 함수
// ============================================================

export function evaluateTolerance(input: RuleInput): RuleOutput {
  const { toleranceType, currentTolerance, functionType } = input;

  let riskLevel: RiskLevel = "low";
  let riskScore = 10;
  let reason = "공차 수준이 일반 범위입니다.";
  let caeRequired = false;
  let seniorReviewRequired = false;

  // --- 끼워맞춤 공차 ---
  if (toleranceType === "fit") {
    const rawText = input.datumContext || String(currentTolerance);
    const matchedRule = FIT_RULES.find((r) => r.pattern.test(rawText));
    if (matchedRule) {
      riskLevel = matchedRule.risk;
      riskScore = matchedRule.score;
      reason = matchedRule.reason;
      const suggestedQuestions = matchedRule.suggestedQuestions;
      const { status, caution } = getRecommendationByFunction(functionType, riskLevel);
      const recommendedRange = buildRecommendedRange(input);
      if (riskLevel === "critical") { caeRequired = true; seniorReviewRequired = true; }
      else if (riskLevel === "high") { seniorReviewRequired = true; }
      return { riskLevel, riskScore, reason, suggestedQuestions, recommendationStatus: status, recommendedRange, caution, caeRequired, seniorReviewRequired };
    }
  }

  // --- 표면거칠기 ---
  if (toleranceType === "roughness") {
    const threshold = ROUGHNESS_THRESHOLDS.find((t) => currentTolerance <= t.max);
    if (threshold) {
      riskLevel = threshold.risk;
      riskScore = threshold.score;
      reason = threshold.reason;
      if (riskLevel === "critical") { caeRequired = false; seniorReviewRequired = true; }
      else if (riskLevel === "high") { seniorReviewRequired = false; }
    }
  }
  // --- 기하공차 ---
  else if (
    ["position", "flatness", "straightness", "roundness", "cylindricity",
      "perpendicularity", "parallelism", "runout", "total_runout", "concentricity", "profile"].includes(toleranceType)
  ) {
    const thresholds = GDNT_THRESHOLDS.filter((t) => t.type === toleranceType);
    const threshold = thresholds.find((t) => currentTolerance <= t.max);
    if (threshold) {
      riskLevel = threshold.risk;
      riskScore = threshold.score;
      reason = threshold.reason;
      if (riskLevel === "critical") { caeRequired = true; seniorReviewRequired = true; }
      else if (riskLevel === "high") { seniorReviewRequired = true; }
    }
  }
  // --- 치수공차 ±mm ---
  else if (toleranceType === "plus_minus" || toleranceType === "asymmetric") {
    const threshold = PLUS_MINUS_THRESHOLDS.find((t) => currentTolerance <= t.max);
    if (threshold) {
      riskLevel = threshold.risk;
      riskScore = threshold.score;
      reason = threshold.reason;
      if (riskLevel === "critical") { caeRequired = true; seniorReviewRequired = true; }
      else if (riskLevel === "high") { seniorReviewRequired = true; }
    }
  }

  const suggestedQuestions = buildQuestions(input, riskLevel);
  const { status, caution } = getRecommendationByFunction(functionType, riskLevel);
  const recommendedRange = buildRecommendedRange(input);

  return {
    riskLevel,
    riskScore,
    reason,
    suggestedQuestions,
    recommendationStatus: status,
    recommendedRange,
    caution,
    caeRequired,
    seniorReviewRequired,
  };
}

// ============================================================
// 기능 답변 → RecommendationStatus 갱신
// ============================================================

export function resolveByAnswer(
  functionType: FunctionType,
  riskLevel: RiskLevel
): { status: RecommendationStatus; caution: string } {
  return getRecommendationByFunction(functionType, riskLevel);
}

// ============================================================
// 위험도 레이블
// ============================================================

export function riskLabel(level: RiskLevel): string {
  return { low: "낮음", medium: "보통", high: "높음", critical: "위험" }[level];
}

export function statusLabel(status: RecommendationStatus): string {
  return {
    relax_candidate: "완화 후보",
    conditional: "조건부 완화",
    need_check: "추가 확인 필요",
    keep: "유지 권장",
  }[status];
}

// ============================================================
// 완화 시뮬레이션
// ============================================================

export interface SimulationResult {
  proposedTolerance: number;
  proposedRisk: RiskLevel;
  proposedScore: number;
  verdict: "가능" | "조건부 가능" | "불가";
  verdictReason: string;
  maxRecommended: number;
  maxRecommendedUnit: string;
}

const RISK_ORDER: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3, critical: 4 };

// 특정 제안값에 대한 완화 시뮬레이션
export function simulateRelaxation(
  originalInput: RuleInput,
  proposedTolerance: number
): SimulationResult {
  if (proposedTolerance <= originalInput.currentTolerance) {
    return {
      proposedTolerance,
      proposedRisk: originalInput.toleranceType === "plus_minus" ? "critical" : "critical",
      proposedScore: 0,
      verdict: "불가",
      verdictReason: "제안값이 현재 공차보다 작습니다. 완화(완緩)는 공차값을 키우는 방향입니다.",
      maxRecommended: originalInput.currentTolerance,
      maxRecommendedUnit: getUnit(originalInput.toleranceType),
    };
  }

  const proposed = evaluateTolerance({ ...originalInput, currentTolerance: proposedTolerance });
  const origRiskOrder = RISK_ORDER[getOriginalRisk(originalInput)];
  const propRiskOrder = RISK_ORDER[proposed.riskLevel];

  let verdict: "가능" | "조건부 가능" | "불가";
  let verdictReason: string;

  if (proposed.riskLevel === "low" || proposed.riskLevel === "medium") {
    verdict = "가능";
    verdictReason = `완화 후 위험도가 ${riskLabel(proposed.riskLevel)} 수준으로 유지됩니다. ${proposed.reason}`;
  } else if (propRiskOrder <= origRiskOrder) {
    verdict = "조건부 가능";
    verdictReason = `위험도 변화 없음(${riskLabel(proposed.riskLevel)}). 기능 확인 후 적용 가능. ${proposed.reason}`;
  } else if (proposed.riskLevel === "high") {
    verdict = "조건부 가능";
    verdictReason = `완화 후 HIGH 위험 수준. 선임자 검토 및 기능 재확인 필요. ${proposed.reason}`;
  } else {
    verdict = "불가";
    verdictReason = `완화 후 CRITICAL 위험 수준으로 상승. 추가 완화 불가. ${proposed.reason}`;
  }

  const maxRec = findMaxRelaxation(originalInput);

  return {
    proposedTolerance,
    proposedRisk: proposed.riskLevel,
    proposedScore: proposed.riskScore,
    verdict,
    verdictReason,
    maxRecommended: maxRec.maxValue,
    maxRecommendedUnit: getUnit(originalInput.toleranceType),
  };
}

// 완화 가능 최대값 탐색 (MEDIUM 이하를 유지하는 최대 공차)
export function findMaxRelaxation(input: RuleInput): { maxValue: number; atRisk: RiskLevel } {
  const { toleranceType, currentTolerance } = input;

  // 탐색 후보 값 목록 (타입별 의미있는 breakpoint)
  const candidates = getCandidates(toleranceType, currentTolerance);

  let maxValue = currentTolerance;
  let atRisk: RiskLevel = getOriginalRisk(input);

  for (const candidate of candidates) {
    if (candidate <= currentTolerance) continue;
    const result = evaluateTolerance({ ...input, currentTolerance: candidate });
    if (RISK_ORDER[result.riskLevel] <= 2) { // low or medium
      maxValue = candidate;
      atRisk = result.riskLevel;
    } else {
      break;
    }
  }

  return { maxValue, atRisk };
}

function getOriginalRisk(input: RuleInput): RiskLevel {
  return evaluateTolerance(input).riskLevel;
}

function getCandidates(type: ToleranceType, current: number): number[] {
  if (type === "plus_minus" || type === "asymmetric") {
    return [0.005, 0.01, 0.02, 0.03, 0.05, 0.08, 0.1, 0.15, 0.2, 0.3, 0.5, 1.0]
      .filter((v) => v > current);
  }
  if (type === "roughness") {
    return [0.4, 0.8, 1.6, 3.2, 6.3, 12.5].filter((v) => v > current);
  }
  // GD&T
  return [0.005, 0.01, 0.02, 0.03, 0.05, 0.08, 0.1, 0.15, 0.2, 0.3, 0.5]
    .filter((v) => v > current);
}

function getUnit(type: ToleranceType): string {
  if (type === "roughness") return "μm";
  return "mm";
}
