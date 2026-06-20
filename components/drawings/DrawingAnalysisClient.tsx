"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Play, FileText, Loader2, AlertTriangle, Download } from "lucide-react";
import { repository, loadDrawingFile } from "@/lib/repository";
import { analyzeDrawingText, getDemoData } from "@/lib/analysisEngine";
import { buildReport } from "@/lib/reportGenerator";
import type { Drawing, ExtractedItem, ToleranceCase, Project } from "@/types";
import ToleranceCaseTable from "./ToleranceCaseTable";
import CaseDetailPanel from "./CaseDetailPanel";
import PdfViewer from "./PdfViewer";
import ReportPanel from "./ReportPanel";

export default function DrawingAnalysisClient({ drawingId }: { drawingId: string }) {
  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [cases, setCases] = useState<ToleranceCase[]>([]);
  const [selected, setSelected] = useState<ToleranceCase | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"table" | "report">("table");
  const [manualText, setManualText] = useState("");
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    async function load() {
      const d = await repository.getDrawing(drawingId);
      setDrawing(d);
      if (d) {
        const p = await repository.getProject(d.projectId);
        setProject(p);
        const fileData = loadDrawingFile(drawingId);
        if (fileData) setPdfDataUrl(fileData);
      }
      const existingItems = await repository.getExtractedItems(drawingId);
      const existingCases = await repository.getToleranceCases(drawingId);
      if (existingItems.length > 0) {
        setItems(existingItems);
        setCases(existingCases);
      }
    }
    load();
  }, [drawingId]);

  const runAnalysis = useCallback(async (textOverride?: string) => {
    if (!drawing) return;
    setAnalyzing(true);

    // 상태 업데이트
    const updated: Drawing = { ...drawing, status: "analyzing" };
    await repository.saveDrawing(updated);
    setDrawing(updated);

    try {
      // PDF text layer 추출 시도
      let text = textOverride ?? "";

      if (!text && pdfDataUrl) {
        text = await extractPdfText(pdfDataUrl);
      }

      // 텍스트가 없으면 데모 데이터 사용
      const result = text.trim()
        ? analyzeDrawingText(text, drawingId, 1)
        : getDemoData(drawingId);

      await repository.saveExtractedItems(result.items);
      await repository.saveToleranceCases(result.cases);

      setItems(result.items);
      setCases(result.cases);

      const done: Drawing = { ...updated, status: "done" };
      await repository.saveDrawing(done);
      setDrawing(done);
    } catch (err) {
      console.error(err);
      const errDrawing: Drawing = { ...updated, status: "error" };
      await repository.saveDrawing(errDrawing);
      setDrawing(errDrawing);
    } finally {
      setAnalyzing(false);
    }
  }, [drawing, drawingId, pdfDataUrl]);

  async function handleCaseUpdate(updated: ToleranceCase) {
    await repository.updateToleranceCase(updated);
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelected(updated);
  }

  function handleGenerateReport() {
    if (!drawing || !project) return;
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
    repository.saveReport(report);
    setActiveTab("report");
    return report;
  }

  if (!drawing) {
    return <div className="p-8 text-slate-400">도면을 불러오는 중...</div>;
  }

  const hasCases = cases.length > 0;
  const criticalCount = cases.filter((c) => c.riskLevel === "critical").length;
  const highCount = cases.filter((c) => c.riskLevel === "high").length;

  return (
    <div className="flex flex-col h-screen">
      {/* 상단 헤더 */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={project ? `/projects/${project.id}` : "/"}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-slate-400" />
              <span className="font-bold text-slate-800 text-sm">{drawing.fileName}</span>
              {project && <span className="text-slate-400 text-xs">— {project.name}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasCases && (
              <>
                {criticalCount > 0 && (
                  <span className="badge-critical px-2 py-0.5 rounded text-xs font-bold">
                    위험 {criticalCount}
                  </span>
                )}
                {highCount > 0 && (
                  <span className="badge-high px-2 py-0.5 rounded text-xs font-bold">
                    높음 {highCount}
                  </span>
                )}
              </>
            )}

            <button
              onClick={() => setShowManual(!showManual)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              텍스트 직접 입력
            </button>

            {hasCases && (
              <button
                onClick={handleGenerateReport}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-bold transition-colors"
              >
                <Download size={12} />
                리포트 생성
              </button>
            )}

            <button
              onClick={() => runAnalysis()}
              disabled={analyzing}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors"
            >
              {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
              {analyzing ? "분석 중..." : hasCases ? "재분석" : "분석 시작"}
            </button>
          </div>
        </div>

        {/* 텍스트 직접 입력 패널 */}
        {showManual && (
          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 mb-2">
              PDF OCR이 안 될 때: 공차 텍스트를 직접 붙여넣어 분석합니다.
            </p>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="예: Ø10 ±0.01, 위치도 Ø0.02, 평면도 0.01, Ra 0.8, H7"
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
            <button
              onClick={() => { runAnalysis(manualText); setShowManual(false); }}
              disabled={!manualText.trim() || analyzing}
              className="mt-2 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors"
            >
              이 텍스트로 분석
            </button>
          </div>
        )}
      </div>

      {/* 메인 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측: PDF 뷰어 */}
        <div className="w-[420px] flex-shrink-0 border-r border-slate-200 bg-slate-100 overflow-hidden">
          <PdfViewer dataUrl={pdfDataUrl} cases={cases} />
        </div>

        {/* 우측: 분석 결과 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 탭 */}
          <div className="flex border-b border-slate-200 bg-white px-4">
            {[
              { key: "table", label: `공차 검토 목록 ${hasCases ? `(${cases.length})` : ""}` },
              { key: "report", label: "리포트" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as "table" | "report")}
                className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
                  activeTab === key
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 flex overflow-hidden">
            {activeTab === "table" ? (
              <>
                {/* 공차 목록 */}
                <div className={`overflow-auto ${selected ? "w-[55%]" : "w-full"} border-r border-slate-200`}>
                  {!hasCases ? (
                    <EmptyAnalysis onRun={() => runAnalysis()} analyzing={analyzing} />
                  ) : (
                    <ToleranceCaseTable
                      cases={cases}
                      selected={selected}
                      onSelect={setSelected}
                    />
                  )}
                </div>

                {/* 우측 상세 패널 */}
                {selected && (
                  <div className="flex-1 overflow-auto bg-white">
                    <CaseDetailPanel
                      tc={selected}
                      onUpdate={handleCaseUpdate}
                      onClose={() => setSelected(null)}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 overflow-auto">
                <ReportPanel
                  cases={cases}
                  drawing={drawing}
                  project={project}
                  onGenerateReport={handleGenerateReport}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyAnalysis({ onRun, analyzing }: { onRun: () => void; analyzing: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
        <Play size={24} className="text-teal-600" />
      </div>
      <p className="font-bold text-slate-700 mb-1">아직 분석하지 않았습니다</p>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">
        분석 시작 버튼을 누르면 PDF에서 공차 항목을 추출하고<br />
        위험도를 자동으로 분류합니다.
      </p>
      <button
        onClick={onRun}
        disabled={analyzing}
        className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-bold rounded-lg transition-colors"
      >
        {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
        {analyzing ? "분석 중..." : "분석 시작"}
      </button>
      <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-left max-w-sm">
        <AlertTriangle size={13} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700">
          PDF text layer가 없는 스캔 도면은 &quot;텍스트 직접 입력&quot;을 사용하세요.
        </p>
      </div>
    </div>
  );
}

// PDF.js로 텍스트 레이어 추출
async function extractPdfText(dataUrl: string): Promise<string> {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const loadingTask = pdfjsLib.getDocument(dataUrl);
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: unknown) => {
        const t = item as Record<string, unknown>;
        return typeof t.str === "string" ? t.str : "";
      }).join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  } catch {
    return "";
  }
}
