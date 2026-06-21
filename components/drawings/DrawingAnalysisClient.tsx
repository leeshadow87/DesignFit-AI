"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Play,
  ShieldAlert,
} from "lucide-react";
import { analyzeDrawingText } from "@/lib/analysisEngine";
import { buildReport } from "@/lib/reportGenerator";
import { loadDrawingFile, repository } from "@/lib/repository";
import type { Drawing, Project, ToleranceCase } from "@/types";
import PdfViewer from "./PdfViewer";

export default function DrawingAnalysisClient({ drawingId }: { drawingId: string }) {
  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [cases, setCases] = useState<ToleranceCase[]>([]);
  const [selected, setSelected] = useState<ToleranceCase | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [manualText, setManualText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [notice, setNotice] = useState("PDF 텍스트 레이어가 없으면 OCR 또는 수동 보정이 필요합니다.");

  useEffect(() => {
    async function load() {
      const d = await repository.getDrawing(drawingId);
      setDrawing(d);
      if (!d) return;
      setProject(await repository.getProject(d.projectId));
      setPdfDataUrl(loadDrawingFile(drawingId));
      const storedCases = await repository.getToleranceCases(drawingId);
      setCases(storedCases);
      setSelected(storedCases[0] ?? null);
    }
    load();
  }, [drawingId]);

  const runAnalysis = useCallback(async () => {
    if (!drawing) return;
    setAnalyzing(true);
    setNotice("도면 텍스트를 판독하고 있습니다.");

    try {
      let text = manualText.trim();
      if (!text && pdfDataUrl) {
        text = await extractPdfText(pdfDataUrl);
      }

      if (!text.trim()) {
        setCases([]);
        setSelected(null);
        setNotice("판독 가능한 텍스트가 없습니다. OCR 연동 또는 수동 보정 입력이 필요합니다.");
        const failed: Drawing = { ...drawing, status: "error" };
        await repository.saveDrawing(failed);
        setDrawing(failed);
        return;
      }

      const result = analyzeDrawingText(text, drawingId, 1);
      await repository.saveExtractedItems(result.items);
      await repository.saveToleranceCases(result.cases);
      const done: Drawing = { ...drawing, status: "done" };
      await repository.saveDrawing(done);
      setDrawing(done);
      setCases(result.cases);
      setSelected(result.cases[0] ?? null);
      setNotice(`분석 완료: 공차 후보 ${result.cases.length}개를 찾았습니다.`);
    } catch (error) {
      console.error(error);
      setNotice("분석 중 오류가 발생했습니다. PDF 형식 또는 텍스트 입력을 확인하세요.");
    } finally {
      setAnalyzing(false);
    }
  }, [drawing, drawingId, manualText, pdfDataUrl]);

  function generateReport() {
    if (!drawing || !project || cases.length === 0) return;
    const report = buildReport(
      project.id,
      drawing.id,
      drawing.fileName,
      cases.map((tc) => ({
        toleranceCaseId: tc.id,
        rawText: tc.rawText,
        currentTolerance: tc.currentTolerance,
        toleranceType: tc.toleranceType,
        riskLevel: tc.riskLevel,
        recommendationStatus: tc.recommendationStatus,
        recommendedRange: tc.recommendedRange,
        riskReason: tc.riskReason,
        caution: tc.caution,
        caeRequired: tc.caeRequired,
        seniorReviewRequired: tc.seniorReviewRequired,
      }))
    );
    repository.saveReport(report);
    setNotice("리포트 초안이 저장되었습니다. 고객 제출 전 선임 검토가 필요합니다.");
  }

  if (!drawing) {
    return <div className="p-8 text-sm text-slate-500">도면 정보를 불러오는 중입니다.</div>;
  }

  const criticalCount = cases.filter((c) => c.riskLevel === "critical").length;
  const highCount = cases.filter((c) => c.riskLevel === "high").length;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-3 lg:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <Link
              href={project ? `/projects/${project.id}` : "/"}
              className="mt-1 rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-teal-700">
                <FileText size={14} />
                Drawing Analysis
              </p>
              <h1 className="mt-1 text-lg font-black text-slate-900">{drawing.fileName}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {project?.name ?? "프로젝트"} · 로컬 검증 저장 · V4 MVP
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {criticalCount > 0 && (
              <span className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700">
                Critical {criticalCount}
              </span>
            )}
            {highCount > 0 && (
              <span className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-black text-orange-700">
                High {highCount}
              </span>
            )}
            <button onClick={runAnalysis} disabled={analyzing} className="df-button-primary">
              {analyzing ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
              분석 실행
            </button>
            <button onClick={generateReport} disabled={cases.length === 0} className="df-button-green disabled:opacity-50">
              <Download size={15} />
              리포트 초안
            </button>
          </div>
        </div>
      </header>

      <section className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 lg:px-6">
        <div className="flex items-start gap-2">
          <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
          <p>{notice}</p>
        </div>
      </section>

      <main className="grid flex-1 gap-3 p-3 lg:grid-cols-[minmax(420px,1.25fr)_minmax(420px,.9fr)] lg:grid-rows-[minmax(0,1fr)_260px]">
        <section className="df-card min-h-[520px] overflow-hidden lg:row-span-2">
          <PdfViewer dataUrl={pdfDataUrl} cases={cases} selectedCaseId={selected?.id} />
        </section>

        <section className="df-card overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-black text-slate-900">선택 공차 판단</p>
            <p className="text-xs text-slate-500">위험도와 완화 가능성을 분리해서 검토합니다.</p>
          </div>
          {selected ? (
            <div className="grid gap-4 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-sm font-black text-slate-900">{selected.rawText}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {selected.toleranceType} · {selected.featureType} · page {selected.pageNumber ?? 1}
                  </p>
                </div>
                <span className={`rounded px-2 py-1 text-xs font-black badge-${selected.riskLevel}`}>
                  {selected.riskLevel.toUpperCase()} {selected.riskScore}
                </span>
              </div>
              <Info label="판단 근거" value={selected.riskReason} />
              <Info label="완화 후보" value={selected.recommendedRange ?? "기능 확인 후 판단"} />
              <Info label="주의 사항" value={selected.caution ?? "선임 검토 후 확정"} />
              <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-black text-slate-700">검증 질문</p>
                {selected.suggestedQuestions.slice(0, 3).map((q) => (
                  <p key={q} className="text-sm leading-relaxed text-slate-600">
                    · {q}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <EmptyPanel />
          )}
        </section>

        <section className="df-card overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-black text-slate-900">수동 보정 입력</p>
            <p className="text-xs text-slate-500">OCR 미연동 단계에서는 도면의 공차 문구를 붙여넣어 검증합니다.</p>
          </div>
          <div className="p-4">
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              rows={6}
              className="h-32 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              placeholder="예: DIA 18.000 H7, POSITION DIA 0.025 A|B|C, FLATNESS 0.01, Ra 0.8, +/-0.01"
            />
          </div>
        </section>

        <section className="df-card overflow-hidden lg:col-span-2">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-black text-slate-900">공차 후보 목록</p>
            <p className="text-xs text-slate-500">가장 위험한 항목부터 검토합니다.</p>
          </div>
          <div className="max-h-[260px] overflow-auto">
            {cases.length === 0 ? (
              <div className="flex h-36 items-center justify-center text-sm text-slate-500">
                아직 분석 결과가 없습니다. PDF 분석 또는 수동 입력을 실행하세요.
              </div>
            ) : (
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead className="sticky top-0 bg-white text-left text-xs font-black uppercase text-slate-500">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3">Risk</th>
                    <th className="border-b border-slate-200 px-4 py-3">Raw</th>
                    <th className="border-b border-slate-200 px-4 py-3">Type</th>
                    <th className="border-b border-slate-200 px-4 py-3">Recommendation</th>
                    <th className="border-b border-slate-200 px-4 py-3">Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((tc) => (
                    <tr
                      key={tc.id}
                      onClick={() => setSelected(tc)}
                      className={`cursor-pointer hover:bg-slate-50 ${selected?.id === tc.id ? "bg-teal-50/60" : ""}`}
                    >
                      <td className="border-b border-slate-100 px-4 py-3">
                        <span className={`rounded px-2 py-1 text-xs font-black badge-${tc.riskLevel}`}>
                          {tc.riskLevel}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 font-mono text-xs">{tc.rawText}</td>
                      <td className="border-b border-slate-100 px-4 py-3 font-mono text-xs">{tc.toleranceType}</td>
                      <td className="border-b border-slate-100 px-4 py-3">{tc.recommendedRange ?? tc.recommendationStatus}</td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {tc.caeRequired ? "CAE 필요" : tc.seniorReviewRequired ? "선임 검토" : "일반 검토"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 text-sm">
      <b className="text-slate-700">{label}</b>
      <span className="leading-relaxed text-slate-600">{value}</span>
    </div>
  );
}

function EmptyPanel() {
  return (
    <div className="flex h-72 flex-col items-center justify-center p-8 text-center">
      <AlertTriangle size={28} className="text-amber-600" />
      <p className="mt-3 font-black text-slate-800">선택된 공차가 없습니다</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-500">
        분석을 실행하거나 수동 보정 입력에 공차 문구를 넣어주세요.
      </p>
    </div>
  );
}

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
      fullText += content.items
        .map((item: unknown) => {
          const candidate = item as { str?: string };
          return candidate.str ?? "";
        })
        .join(" ");
      fullText += "\n";
    }
    return fullText;
  } catch {
    return "";
  }
}
