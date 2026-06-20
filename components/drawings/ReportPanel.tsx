"use client";
import { useState } from "react";
import { Download, FileText, Table } from "lucide-react";
import type { ToleranceCase, Drawing, Project, Report } from "@/types";
import { RiskBadge, StatusBadge } from "@/components/ui/Badge";
import { buildReport } from "@/lib/reportGenerator";
import { repository } from "@/lib/repository";

interface Props {
  cases: ToleranceCase[];
  drawing: Drawing | null;
  project: Project | null;
  onGenerateReport: () => Report | undefined;
}

export default function ReportPanel({ cases, drawing, project, onGenerateReport }: Props) {
  const [exporting, setExporting] = useState(false);

  const criticalCount = cases.filter((c) => c.riskLevel === "critical").length;
  const highCount = cases.filter((c) => c.riskLevel === "high").length;
  const mediumCount = cases.filter((c) => c.riskLevel === "medium").length;
  const relaxCount = cases.filter((c) => c.recommendationStatus === "relax_candidate").length;
  const keepCount = cases.filter((c) => c.recommendationStatus === "keep").length;
  const needCheckCount = cases.filter((c) => c.recommendationStatus === "need_check").length;

  async function handleExportCsv() {
    if (!drawing || !project || !cases.length) return;
    setExporting(true);
    try {
      const reportItems = cases.map((c) => ({
        toleranceCaseId: c.id,
        rawText: c.rawText,
        currentTolerance: c.currentTolerance,
        toleranceType: c.toleranceType,
        riskLevel: c.riskLevel,
        recommendationStatus: c.recommendationStatus,
        recommendedRange: c.recommendedRange,
        riskReason: c.riskReason,
        caution: c.caution,
        caeRequired: c.caeRequired,
        seniorReviewRequired: c.seniorReviewRequired,
      }));
      const report = buildReport(project.id, drawing.id, drawing.fileName, reportItems);
      await repository.saveReport(report);
      const { exportCsv } = await import("@/lib/reportGenerator");
      exportCsv(report);
    } finally {
      setExporting(false);
    }
  }

  async function handleExportPdf() {
    if (!drawing || !project || !cases.length) return;
    setExporting(true);
    try {
      const reportItems = cases.map((c) => ({
        toleranceCaseId: c.id,
        rawText: c.rawText,
        currentTolerance: c.currentTolerance,
        toleranceType: c.toleranceType,
        riskLevel: c.riskLevel,
        recommendationStatus: c.recommendationStatus,
        recommendedRange: c.recommendedRange,
        riskReason: c.riskReason,
        caution: c.caution,
        caeRequired: c.caeRequired,
        seniorReviewRequired: c.seniorReviewRequired,
      }));
      const report = buildReport(project.id, drawing.id, drawing.fileName, reportItems);
      await repository.saveReport(report);
      const { exportPdf } = await import("@/lib/reportGenerator");
      await exportPdf(report);
    } finally {
      setExporting(false);
    }
  }

  if (!cases.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <FileText size={28} className="text-slate-300 mb-3" />
        <p className="text-sm text-slate-400">분석을 완료하면 리포트를 생성할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-black text-teal-600 uppercase tracking-widest mb-1">Report</p>
          <h2 className="text-xl font-black text-slate-800">공차 검토 리포트</h2>
          <p className="text-sm text-slate-400 mt-1">{drawing?.fileName}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition-colors"
          >
            <Table size={12} />
            CSV 내보내기
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-lg text-xs font-bold transition-colors"
          >
            <Download size={12} />
            PDF 내보내기
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <SummaryCard label="위험 (CRITICAL)" value={criticalCount} colorClass="text-red-700 bg-red-50 border-red-200" />
        <SummaryCard label="높음 (HIGH)" value={highCount} colorClass="text-orange-700 bg-orange-50 border-orange-200" />
        <SummaryCard label="보통 (MEDIUM)" value={mediumCount} colorClass="text-yellow-700 bg-yellow-50 border-yellow-200" />
        <SummaryCard label="완화 후보" value={relaxCount} colorClass="text-teal-700 bg-teal-50 border-teal-200" />
        <SummaryCard label="추가 확인 필요" value={needCheckCount} colorClass="text-orange-700 bg-orange-50 border-orange-200" />
        <SummaryCard label="유지 권장" value={keepCount} colorClass="text-slate-600 bg-slate-50 border-slate-200" />
      </div>

      {/* 항목 테이블 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_3fr] gap-3 px-4 py-2 bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wide">
          <span>원문</span>
          <span>위험도</span>
          <span>추천 상태</span>
          <span>검토 필요</span>
          <span>완화 범위 / 근거</span>
        </div>
        <div className="divide-y divide-slate-100">
          {cases.map((tc) => (
            <div key={tc.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_3fr] gap-3 px-4 py-3 items-start">
              <span className="font-mono text-xs font-semibold text-slate-800">{tc.rawText}</span>
              <RiskBadge level={tc.riskLevel} />
              <StatusBadge status={tc.recommendationStatus} />
              <div className="text-[10px] space-y-0.5">
                {tc.caeRequired && <span className="block text-red-600 font-bold">CAE 필요</span>}
                {tc.seniorReviewRequired && <span className="block text-orange-600 font-bold">선임 검토</span>}
                {!tc.caeRequired && !tc.seniorReviewRequired && <span className="text-slate-400">—</span>}
              </div>
              <div>
                {tc.recommendedRange ? (
                  <p className="text-xs text-teal-700 leading-relaxed">{tc.recommendedRange}</p>
                ) : (
                  <p className="text-xs text-slate-400 leading-relaxed">{tc.riskReason}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 면책 문구 */}
      <div className="mt-4 text-[10px] text-slate-400 leading-relaxed border-t border-slate-200 pt-4">
        ※ 이 리포트는 기능 확인 전 1차 검토 결과입니다. 완화 후보는 베어링·씰링·안전 관련 기능 확인 후
        CAE 또는 선임 엔지니어 검증을 거쳐 반영하십시오. 이 도구는 공차 완화를 단정하지 않습니다.
      </div>
    </div>
  );
}

function SummaryCard({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  return (
    <div className={`rounded-lg border p-4 ${colorClass}`}>
      <p className="text-xs font-semibold opacity-70">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );
}
