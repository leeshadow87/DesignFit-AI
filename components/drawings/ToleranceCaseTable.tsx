"use client";
import type { ToleranceCase, RiskLevel } from "@/types";
import { RiskBadge, StatusBadge } from "@/components/ui/Badge";
import { MessageSquare, ShieldAlert } from "lucide-react";

interface Props {
  cases: ToleranceCase[];
  selected: ToleranceCase | null;
  onSelect: (tc: ToleranceCase) => void;
}

const RISK_ORDER: Record<RiskLevel, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export default function ToleranceCaseTable({ cases, selected, onSelect }: Props) {
  const sorted = [...cases].sort(
    (a, b) => RISK_ORDER[b.riskLevel] - RISK_ORDER[a.riskLevel]
  );

  const criticalCount = cases.filter((c) => c.riskLevel === "critical").length;
  const highCount = cases.filter((c) => c.riskLevel === "high").length;

  return (
    <div>
      {/* 요약 헤더 */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4">
        <span className="text-xs font-bold text-slate-500">총 {cases.length}개 항목</span>
        {criticalCount > 0 && (
          <span className="flex items-center gap-1 text-xs font-bold text-red-600">
            <ShieldAlert size={11} /> 위험 {criticalCount}
          </span>
        )}
        {highCount > 0 && (
          <span className="text-xs font-bold text-orange-600">높음 {highCount}</span>
        )}
      </div>

      {/* 테이블 헤더 */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-wide">
        <span>공차 원문</span>
        <span>값</span>
        <span>위험도</span>
        <span>추천</span>
      </div>

      {/* 행 */}
      <div>
        {sorted.map((tc) => {
          const isSelected = selected?.id === tc.id;
          const rowBg =
            tc.riskLevel === "critical"
              ? "border-l-4 border-l-red-400"
              : tc.riskLevel === "high"
              ? "border-l-4 border-l-orange-400"
              : tc.riskLevel === "medium"
              ? "border-l-4 border-l-yellow-400"
              : "border-l-4 border-l-slate-200";

          return (
            <div
              key={tc.id}
              onClick={() => onSelect(tc)}
              className={`grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-4 py-3 border-b border-slate-100 cursor-pointer transition-colors ${rowBg} ${
                isSelected ? "bg-teal-50" : "bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-mono text-xs text-slate-800 truncate font-semibold">
                  {tc.rawText}
                </span>
                {tc.suggestedQuestions.length > 0 && (
                  <MessageSquare size={10} className="text-teal-500 flex-shrink-0" />
                )}
              </div>
              <span className="text-xs text-slate-600 font-mono self-center">
                {tc.currentTolerance}
              </span>
              <div className="self-center">
                <RiskBadge level={tc.riskLevel} />
              </div>
              <div className="self-center">
                <StatusBadge status={tc.recommendationStatus} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
