"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileText, ZoomIn, ZoomOut } from "lucide-react";
import type { ToleranceCase } from "@/types";

interface Props {
  dataUrl: string | null;
  cases: ToleranceCase[];
  selectedCaseId?: string;
}

export default function PdfViewer({ dataUrl, cases, selectedCaseId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<unknown>(null);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    if (!dataUrl) return;
    loadPdf(dataUrl);
  }, [dataUrl]);

  useEffect(() => {
    if (pdfDoc) renderPage(pdfDoc, currentPage, scale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, currentPage, scale]);

  async function loadPdf(url: string) {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const doc = await pdfjsLib.getDocument(url).promise;
      setTotalPages(doc.numPages);
      setPdfDoc(doc);
    } catch (error) {
      console.error("PDF load error", error);
    }
  }

  async function renderPage(doc: unknown, pageNum: number, nextScale: number) {
    if (!canvasRef.current || rendering) return;
    setRendering(true);
    try {
      const page = await (doc as { getPage: (page: number) => Promise<any> }).getPage(pageNum);
      const viewport = page.getViewport({ scale: nextScale });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      await page.render({ canvasContext: ctx, viewport }).promise;
    } finally {
      setRendering(false);
    }
  }

  const selectedIndex = Math.max(0, cases.findIndex((tc) => tc.id === selectedCaseId));

  return (
    <div className="flex h-full min-h-[520px] flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-black text-slate-800">
          <FileText size={16} />
          PDF 도면
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="rounded p-1 hover:bg-slate-100 disabled:opacity-40"
            title="이전 페이지"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="w-14 text-center text-xs font-bold text-slate-500">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="rounded p-1 hover:bg-slate-100 disabled:opacity-40"
            title="다음 페이지"
          >
            <ChevronRight size={15} />
          </button>
          <span className="mx-2 h-5 w-px bg-slate-200" />
          <button
            onClick={() => setScale((s) => Math.max(0.4, s - 0.2))}
            className="rounded p-1 hover:bg-slate-100"
            title="축소"
          >
            <ZoomOut size={15} />
          </button>
          <span className="w-11 text-center text-xs font-bold text-slate-500">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(3.0, s + 0.2))}
            className="rounded p-1 hover:bg-slate-100"
            title="확대"
          >
            <ZoomIn size={15} />
          </button>
        </div>
      </div>

      <div className="technical-grid flex-1 overflow-auto p-3">
        {!dataUrl ? (
          <div className="flex h-full min-h-[420px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 p-8 text-center">
            <div>
              <FileText className="mx-auto text-slate-400" size={34} />
              <p className="mt-3 font-black text-slate-700">PDF 도면이 없습니다</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                프로젝트에서 PDF를 업로드하면 이 영역에 도면이 표시됩니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative inline-block min-w-full">
            <canvas ref={canvasRef} className="block rounded border border-slate-200 bg-white shadow-sm" />
            {cases.length > 0 && (
              <div
                className="pointer-events-none absolute rounded border-2 border-red-600 bg-red-500/10"
                style={{
                  left: `${18 + (selectedIndex % 4) * 12}%`,
                  top: `${20 + (selectedIndex % 5) * 10}%`,
                  width: "14%",
                  height: "8%",
                }}
              />
            )}
            {rendering && (
              <div className="absolute inset-0 grid place-items-center bg-white/70 text-xs font-bold text-slate-500">
                렌더링 중...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
