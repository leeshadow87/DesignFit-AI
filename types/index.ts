// ============================================================
// Core Domain Types — DesignFit-AI V3
// ============================================================

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RecommendationStatus =
  | "relax_candidate"   // 완화 가능성 높음
  | "conditional"       // 조건부 완화 가능
  | "need_check"        // 추가 확인 필요
  | "keep";             // 유지 권장

export type ItemType =
  | "dimension"
  | "tolerance"
  | "gdnt"
  | "datum"
  | "roughness"
  | "material"
  | "fit"
  | "note";

export type ToleranceType =
  | "plus_minus"
  | "asymmetric"
  | "fit"
  | "position"
  | "flatness"
  | "straightness"
  | "roundness"
  | "cylindricity"
  | "perpendicularity"
  | "parallelism"
  | "angularity"
  | "profile"
  | "runout"
  | "total_runout"
  | "concentricity"
  | "roughness";

export type FeatureType =
  | "hole"
  | "bore"
  | "shaft"
  | "plane"
  | "slot"
  | "pocket"
  | "thread"
  | "boss"
  | "hole_pattern"
  | "unknown";

export type FunctionType =
  | "fastening"       // 볼트/나사 체결
  | "locating"        // 위치결정
  | "bearing"         // 베어링 삽입
  | "sealing"         // 씰링/기밀
  | "rotating"        // 회전 정렬
  | "sliding"         // 슬라이딩 접촉
  | "cosmetic"        // 외관
  | "cover"           // 커버/단순 체결
  | "unknown";

// ============================================================
// Project
// ============================================================
export interface Project {
  id: string;
  name: string;
  customerName?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  drawingCount: number;
}

// ============================================================
// Drawing
// ============================================================
export interface Drawing {
  id: string;
  projectId: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  material?: string;
  processHint?: string;
  status: "pending" | "extracting" | "analyzing" | "done" | "error";
  createdAt: string;
  // base64 or blob URL stored in localStorage
  fileDataUrl?: string;
}

// ============================================================
// ExtractedItem — OCR로 추출된 개별 항목
// ============================================================
export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
  page: number;
}

export interface ExtractedItem {
  id: string;
  drawingId: string;
  pageNumber: number;
  itemType: ItemType;
  rawText: string;
  normalizedValue: string;
  unit?: string;
  bbox?: BBox;
  ocrConfidence?: number;  // 0~1
  userCorrected: boolean;
}

// ============================================================
// ToleranceCase — 공차 검토 케이스
// ============================================================
export interface ToleranceCase {
  id: string;
  drawingId: string;
  extractedItemId: string;
  rawText: string;
  featureType: FeatureType;
  functionType: FunctionType;
  currentTolerance: number;   // absolute value (mm or degree)
  toleranceType: ToleranceType;
  riskLevel: RiskLevel;
  riskScore: number;          // 0~100
  riskReason: string;
  recommendedRange?: string;
  recommendationStatus: RecommendationStatus;
  caution?: string;
  caeRequired: boolean;
  seniorReviewRequired: boolean;
  suggestedQuestions: string[];
  pageNumber?: number;
  bbox?: BBox;
}

// ============================================================
// ReviewQuestion — 기능 확인 질문/답변
// ============================================================
export interface ReviewQuestion {
  id: string;
  toleranceCaseId: string;
  question: string;
  answer?: string;
  answerType?: "fastening" | "locating" | "bearing" | "sealing" | "rotating" | "sliding" | "cosmetic" | "cover" | "other";
  createdAt: string;
}

// ============================================================
// Report
// ============================================================
export interface ReportItem {
  toleranceCaseId: string;
  rawText: string;
  currentTolerance: number;
  toleranceType: ToleranceType;
  riskLevel: RiskLevel;
  recommendationStatus: RecommendationStatus;
  recommendedRange?: string;
  riskReason: string;
  caution?: string;
  functionAnswer?: string;
  caeRequired: boolean;
  seniorReviewRequired: boolean;
}

export interface Report {
  id: string;
  projectId: string;
  drawingId: string;
  drawingName: string;
  generatedAt: string;
  summary: ReportSummary;
  items: ReportItem[];
}

export interface ReportSummary {
  totalItems: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  relaxCandidateCount: number;
  keepCount: number;
  needCheckCount: number;
  conditionalCount: number;
}

// ============================================================
// Rule Engine I/O
// ============================================================
export interface RuleInput {
  toleranceType: ToleranceType;
  currentTolerance: number;
  featureType: FeatureType;
  functionType: FunctionType;
  material?: string;
  roughness?: number;
  datumContext?: string;
  processHint?: string;
}

export interface RuleOutput {
  riskLevel: RiskLevel;
  riskScore: number;
  reason: string;
  suggestedQuestions: string[];
  recommendationStatus: RecommendationStatus;
  recommendedRange?: string;
  caution?: string;
  caeRequired: boolean;
  seniorReviewRequired: boolean;
}

// ============================================================
// Storage — Repository Interface
// ============================================================
export interface IRepository {
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  saveProject(project: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;

  // Drawings
  getDrawings(projectId: string): Promise<Drawing[]>;
  getDrawing(id: string): Promise<Drawing | null>;
  saveDrawing(drawing: Drawing): Promise<void>;
  deleteDrawing(id: string): Promise<void>;

  // ExtractedItems
  getExtractedItems(drawingId: string): Promise<ExtractedItem[]>;
  saveExtractedItems(items: ExtractedItem[]): Promise<void>;
  updateExtractedItem(item: ExtractedItem): Promise<void>;

  // ToleranceCases
  getToleranceCases(drawingId: string): Promise<ToleranceCase[]>;
  saveToleranceCases(cases: ToleranceCase[]): Promise<void>;
  updateToleranceCase(tc: ToleranceCase): Promise<void>;

  // ReviewQuestions
  getReviewQuestions(toleranceCaseId: string): Promise<ReviewQuestion[]>;
  saveReviewQuestion(q: ReviewQuestion): Promise<void>;

  // Reports
  getReports(projectId: string): Promise<Report[]>;
  saveReport(report: Report): Promise<void>;
}
