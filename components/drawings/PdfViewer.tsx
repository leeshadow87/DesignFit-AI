"use client";
import { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import type { ToleranceCase } from "@/types";

interface Props {
  dataUrl: string | null;
  cases: ToleranceCase[];
}

export default function PdfViewer({ dataUrl, cases }: Props) {
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
  }, [pdfDoc, currentPage, scale]);

  async function loadPdf(url: string) {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      const doc = await pdfjsLib.getDocument(url).promise;
      setTotalPages(doc.numPages);
      setPdfDoc(doc);
    } catch (e) {
      console.error("PDF load error", e);
    }
  }

  async function renderPage(doc: unknown, pageNum: number, s: number) {
    if (!canvasRef.current || rendering) return;
    setRendering(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const page = await (doc as any).getPage(pageNum);
      const viewport = page.getViewport({ scale: s });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;
    } finally {
      setRendering(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 컨트롤 바 */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-slate-200">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-slate-500 px-1">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.max(0.4, s - 0.2))}
            className="p-1 rounded hover:bg-slate-100"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs text-slate-500 w-10 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(3.0, s + 0.2))}
            className="p-1 rounded hover:bg-slate-100"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* 캔버스 */}
      <div className="flex-1 overflow-auto p-2">
        {!dataUrl ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            PDF 도면을 업로드하면 여기에 표시됩니다.
          </div>
        ) : (
          <div className="relative inline-block">
            <canvas ref={canvasRef} className="block shadow-sm rounded" />
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <span className="text-xs text-slate-400">렌더링 중...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
