"use client";
import { useState, useCallback } from "react";
import { FlaskConical, ChevronRight, AlertTriangle, CheckCircle2, HelpCircle, TrendingUp } from "lucide-react";
import type { ToleranceCase, ToleranceType, FeatureType, FunctionType, RuleInput } from "@/types";
import { simulateRelaxation, findMaxRelaxation, riskLabel, type SimulationResult } from "@/lib/toleranceRules";
import { RiskBadge } from "@/components/ui/Badge";

interface Props {
  cases: ToleranceCase[];
}

const UNIT_MAP: Partial<Record<ToleranceType, string>> = {
  roughness: "μm (Ra)",
};
function unitOf(t: ToleranceType) { return UNIT_MAP[t] ?? "mm"; }

function buildInput(tc: ToleranceCase): RuleInput {
  return {
    toleranceType: tc.toleranceType,
    currentTolerance: tc.currentTolerance,
    featureType: tc.featureType as FeatureType,
    functionType: tc.functionType as FunctionType,
    datumContext: tc.rawText,
  };
}

// ── 개별 시뮬레이션 행 ──────────────────────────────────────
function SimRow({ tc }: { tc: ToleranceCase }) {
  const [inputVal, setInputVal] = useState("");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [maxResult, setMaxResult] = useState<{ maxValue: number; atRisk: string } | null>(null);
  const [mode, setMode] = useState<"idle" | "manual" | "max">("idle");

  const unit = unitOf(tc.toleranceType);

  const runManual = useCallback(() => {
    const v = parseFloat(inputVal);
    if (isNaN(v) || v <= 0) return;
    const r = simulateRelaxation(buildInput(tc), v);
    setResult(r);
    setMaxResult(null);
    setMode("manual");
  }, [inputVal, tc]);

  const runMax = useCallback(() => {
    const r = findMaxRelaxation(buildInput(tc));
    setMaxResult(r);
    setResult(null);
    setMode("max");
  }, [tc]);

  const verdictColor = result
    ? result.verdict === "가능" ? "bg-green-50 border-green-300 text-green-800"
    : result.verdict === "조건부 가능" ? "bg-amber-50 border-amber-300 text-amber-800"
    : "bg-red-50 border-red-300 text-red-800"
    : "";

  const verdictIcon = result
    ? result.verdict === "가능" ? <CheckCircle2 size={13} className="text-green-600 flex-shrink-0 mt-0.5" />
    : result.verdict === "조건부 가능" ? <HelpCircle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
    : <AlertTriangle size={13} className="text-red-600 flex-shrink-0 mt-0.5" />
    : null;

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <RiskBadge level={tc.riskLevel} />
        <span className="font-mono text-sm font-bold text-slate-800">{tc.rawText}</span>
        <span className="text-xs text-slate-400">현재: {tc.currentTolerance} {unit}</span>
      </div>

      <div className="px-4 py-3 flex flex-wrap gap-3 items-end">
        {/* 직접 입력 시뮬레이션 */}
        <div className="flex items-end gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">완화할 값 입력 ({unit})</label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={`예: ${(tc.currentTolerance * 3).toFixed(3)}`}
              className="w-32 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            onClick={runManual}
            disabled={!inputVal}
            className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors"
          >
            <ChevronRight size={12} /> 검토
          </button>
        </div>

        {/* 최대 완화값 자동 탐색 */}
        <button
          onClick={runMax}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-lg transition-colors"
        >
          <TrendingUp size={12} /> 최대 완화값 탐색
        </button>
      </div>

      {/* 결과: 직접 입력 */}
      {mode === "manual" && result && (
        <div className={`mx-4 mb-4 rounded-lg border px-3 py-2.5 flex gap-2 ${verdictColor}`}>
          {verdictIcon}
          <div>
            <p className="text-xs font-black mb-0.5">
              {result.verdict} — {result.proposedTolerance} {unit} 제안 시
              &nbsp;→&nbsp;
              <span className="uppercase">{riskLabel(result.proposedRisk)}</span> (점수 {result.proposedScore}/100)
            </p>
            <p className="text-[11px] leading-relaxed">{result.verdictReason}</p>
            <p className="text-[10px] mt-1 opacity-70">
              MEDIUM 이하 유지 최대값: <b>{result.maxRecommended} {result.maxRecommendedUnit}</b>
            </p>
          </div>
        </div>
      )}

      {/* 결과: 최대 완화값 */}
      {mode === "max" && maxResult && (
        <div className="mx-4 mb-4 rounded-lg border border-teal-300 bg-teal-50 px-3 py-2.5 flex gap-2">
          <TrendingUp size={13} className="text-teal-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-teal-800 mb-0.5">
              MEDIUM 이하 유지 최대 완화값: <span className="text-lg">{maxResult.maxValue}</span> {unit}
            </p>
            <p className="text-[11px] text-teal-700">
              이 값까지 완화해도 위험도 <b>{riskLabel(maxResult.atRisk as "low" | "medium" | "high" | "critical")}</b> 수준 유지.
              기능 확인 후 적용하세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 전체 자동 완화 요약 ─────────────────────────────────────
function AutoSummary({ cases }: { cases: ToleranceCase[] }) {
  const relaxable = cases.filter((c) => c.recommendationStatus === "relax_candidate");
  const conditional = cases.filter((c) => c.recommendationStatus === "conditional");
  const keep = cases.filter((c) => c.recommendationStatus === "keep" || c.recommendationStatus === "need_check");

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
        <p className="text-xs font-bold text-teal-600 mb-1">완화 후보</p>
        <p className="text-3xl font-black text-teal-700">{relaxable.length}</p>
        <p className="text-[10px] text-teal-500 mt-1">기능 확인 후 완화 가능</p>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs font-bold text-amber-600 mb-1">조건부 완화</p>
        <p className="text-3xl font-black text-amber-700">{conditional.length}</p>
        <p className="text-[10px] text-amber-500 mt-1">기능 재확인 필요</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold text-slate-500 mb-1">유지 권장</p>
        <p className="text-3xl font-black text-slate-700">{keep.length}</p>
        <p className="text-[10px] text-slate-400 mt-1">완화 불가 또는 확인 필요</p>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ───────────────────────────────────────────
export default function SimulationPanel({ cases }: Props) {
  const [activeMode, setActiveMode] = useState<"auto" | "point">("auto");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const relaxCandidates = cases.filter(
    (c) => c.recommendationStatus === "relax_candidate" || c.recommendationStatus === "conditional"
  );
  const selectedCase = cases.find((c) => c.id === selectedId) ?? null;

  if (!cases.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <FlaskConical size={28} className="text-slate-300 mb-3" />
        <p className="text-sm text-slate-400">분석을 먼저 실행해야 시뮬레이션을 사용할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 모드 선택 */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveMode("auto")}
          className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${
            activeMode === "auto"
              ? "bg-teal-600 text-white border-teal-600"
              : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
          }`}
        >
          전체 자동 완화 스캔
        </button>
        <button
          onClick={() => setActiveMode("point")}
          className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${
            activeMode === "point"
              ? "bg-teal-600 text-white border-teal-600"
              : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
          }`}
        >
          개별 포인트 시뮬레이션
        </button>
      </div>

      {/* ── Mode A: 전체 자동 스캔 ── */}
      {activeMode === "auto" && (
        <div>
          <div className="mb-4">
            <p className="text-xs font-black text-teal-600 uppercase tracking-widest mb-1">Auto Scan</p>
            <h2 className="text-lg font-black text-slate-800">전체 완화 후보 자동 스캔</h2>
            <p className="text-xs text-slate-400 mt-1">
              룰엔진이 전체 공차를 분석해 완화 가능 포인트를 자동 식별합니다.
            </p>
          </div>

          <AutoSummary cases={cases} />

          {relaxCandidates.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                완화 후보 / 조건부 — {relaxCandidates.length}개
              </p>
              {relaxCandidates.map((tc) => (
                <div key={tc.id} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <RiskBadge level={tc.riskLevel} />
                    <span className="font-mono text-sm font-bold text-slate-800 flex-1">{tc.rawText}</span>
                    <span className="text-xs text-slate-400">현재 {tc.currentTolerance} {unitOf(tc.toleranceType)}</span>
                    <button
                      onClick={() => { setSelectedId(tc.id); setActiveMode("point"); }}
                      className="text-xs text-teal-600 font-bold hover:underline"
                    >
                      시뮬레이션 →
                    </button>
                  </div>
                  {tc.recommendedRange && (
                    <div className="px-4 pb-3 text-xs text-teal-700 bg-teal-50/50 border-t border-teal-100 pt-2 leading-relaxed">
                      {tc.recommendedRange}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">완화 후보가 없습니다.</p>
          )}
        </div>
      )}

      {/* ── Mode B: 개별 포인트 시뮬레이션 ── */}
      {activeMode === "point" && (
        <div>
          <div className="mb-4">
            <p className="text-xs font-black text-teal-600 uppercase tracking-widest mb-1">Point Simulation</p>
            <h2 className="text-lg font-black text-slate-800">개별 포인트 완화 시뮬레이션</h2>
            <p className="text-xs text-slate-400 mt-1">
              공차 항목을 선택하고 직접 값을 입력해 완화 가능 여부를 즉시 검토합니다.
            </p>
          </div>

          <div className="flex gap-4 overflow-hidden" style={{ height: "calc(100vh - 280px)" }}>
            {/* 좌측: 케이스 목록 */}
            <div className="w-56 flex-shrink-0 border border-slate-200 rounded-xl overflow-auto bg-white">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wide">
                공차 항목 선택
              </div>
              {cases.map((tc) => (
                <button
                  key={tc.id}
                  onClick={() => setSelectedId(tc.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-slate-100 transition-colors ${
                    selectedId === tc.id
                      ? "bg-teal-50 border-l-2 border-l-teal-500"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <p className="font-mono text-xs font-bold text-slate-800 truncate">{tc.rawText}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{tc.currentTolerance} {unitOf(tc.toleranceType)}</p>
                </button>
              ))}
            </div>

            {/* 우측: 시뮬레이션 */}
            <div className="flex-1 overflow-auto">
              {selectedCase ? (
                <SimRow key={selectedCase.id} tc={selectedCase} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FlaskConical size={32} className="text-slate-200 mb-3" />
                  <p className="text-sm text-slate-400">왼쪽에서 공차 항목을 선택하세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
