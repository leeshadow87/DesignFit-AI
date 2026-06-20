"use client";
import { useState } from "react";
import { X, AlertTriangle, CheckCircle2, HelpCircle, Wrench } from "lucide-react";
import type { ToleranceCase, FunctionType, RecommendationStatus } from "@/types";
import { RiskBadge, StatusBadge } from "@/components/ui/Badge";
import { resolveByAnswer, statusLabel } from "@/lib/toleranceRules";

const FUNCTION_OPTIONS: { value: FunctionType; label: string; desc: string }[] = [
  { value: "fastening", label: "볼트/나사 체결", desc: "관통홀, 탭홀 등 체결 기능" },
  { value: "locating", label: "위치결정", desc: "핀, 키, 다웰 등 위치 기준" },
  { value: "bearing", label: "베어링 삽입", desc: "구름 베어링, 부시 삽입부" },
  { value: "sealing", label: "씰링/기밀", desc: "O-링, 가스켓, 유체 누설 방지면" },
  { value: "rotating", label: "회전 정렬", desc: "회전체 동심·흔들림 기능" },
  { value: "sliding", label: "슬라이딩 접촉", desc: "선형 운동, 슬라이딩 베어링" },
  { value: "cosmetic", label: "외관면", desc: "외관·도장면" },
  { value: "cover", label: "커버/단순 체결", desc: "커버, 패널 등 비기능 조립" },
  { value: "unknown", label: "불명확", desc: "기능 미확인" },
];

interface Props {
  tc: ToleranceCase;
  onUpdate: (updated: ToleranceCase) => void;
  onClose: () => void;
}

export default function CaseDetailPanel({ tc, onUpdate, onClose }: Props) {
  const [functionType, setFunctionType] = useState<FunctionType>(tc.functionType);
  const [saving, setSaving] = useState(false);

  function handleFunctionChange(fn: FunctionType) {
    setFunctionType(fn);
    const { status, caution } = resolveByAnswer(fn, tc.riskLevel);
    const updated: ToleranceCase = {
      ...tc,
      functionType: fn,
      recommendationStatus: status,
      caution,
    };
    onUpdate(updated);
  }

  const riskColorMap: Record<string, string> = {
    critical: "text-red-700 bg-red-50 border-red-200",
    high: "text-orange-700 bg-orange-50 border-orange-200",
    medium: "text-yellow-700 bg-yellow-50 border-yellow-200",
    low: "text-green-700 bg-green-50 border-green-200",
  };

  return (
    <div className="p-5 h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">공차 상세 검토</p>
          <p className="font-black text-slate-800 font-mono text-lg">{tc.rawText}</p>
        </div>
        <button onClick={onClose} className="p-1 text-slate-300 hover:text-slate-500 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* 위험도 + 상태 */}
      <div className="flex items-center gap-2 mb-4">
        <RiskBadge level={tc.riskLevel} />
        <StatusBadge status={tc.recommendationStatus} />
        <span className="text-xs text-slate-400">위험 점수 {tc.riskScore}/100</span>
      </div>

      {/* 위험 근거 */}
      <div className={`rounded-lg border p-3 mb-4 text-xs leading-relaxed ${riskColorMap[tc.riskLevel]}`}>
        <p className="font-bold mb-1">판단 근거</p>
        <p>{tc.riskReason}</p>
      </div>

      {/* 완화 후보 범위 */}
      {tc.recommendedRange && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 mb-4">
          <p className="text-xs font-bold text-teal-700 mb-1">완화 후보 범위</p>
          <p className="text-xs text-teal-600 leading-relaxed">{tc.recommendedRange}</p>
        </div>
      )}

      {/* 기능 확인 질문 */}
      {tc.suggestedQuestions.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <HelpCircle size={13} className="text-teal-600" />
            <p className="text-xs font-black text-slate-700">기능 확인 질문</p>
          </div>
          <div className="space-y-2">
            {tc.suggestedQuestions.map((q, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 leading-relaxed">
                {q}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 기능 답변 */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Wrench size={13} className="text-teal-600" />
          <p className="text-xs font-black text-slate-700">이 형상의 기능은?</p>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {FUNCTION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleFunctionChange(opt.value)}
              className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                functionType === opt.value
                  ? "border-teal-500 bg-teal-50 text-teal-700 font-bold"
                  : "border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 text-slate-600"
              }`}
            >
              <p className="font-semibold">{opt.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 주의사항 */}
      {tc.caution && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
          <div className="flex items-start gap-1.5">
            <AlertTriangle size={12} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-700 mb-0.5">주의사항</p>
              <p className="text-xs text-amber-600 leading-relaxed">{tc.caution}</p>
            </div>
          </div>
        </div>
      )}

      {/* CAE / 선임자 검토 */}
      <div className="flex gap-2 mt-auto">
        {tc.caeRequired && (
          <div className="flex-1 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertTriangle size={11} className="text-red-600" />
            <span className="text-xs font-bold text-red-700">CAE 검토 필요</span>
          </div>
        )}
        {tc.seniorReviewRequired && (
          <div className="flex-1 flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
            <CheckCircle2 size={11} className="text-orange-600" />
            <span className="text-xs font-bold text-orange-700">선임자 검토 필요</span>
          </div>
        )}
      </div>
    </div>
  );
}
