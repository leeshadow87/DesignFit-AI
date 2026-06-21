"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, Play, ShieldAlert, Trash2, Upload } from "lucide-react";
import { repository, saveDrawingFile } from "@/lib/repository";
import type { Drawing, Project } from "@/types";

export default function ProjectClient({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    repository.getProject(projectId).then(setProject);
    repository.getDrawings(projectId).then(setDrawings);
  }, [projectId]);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      alert("현재 V5는 PDF 업로드만 지원합니다. PNG/HTML 도면은 PDF로 변환한 뒤 업로드하세요.");
      return;
    }
    setUploading(true);

    try {
      const dataUrl = await fileToDataUrl(file);
      const drawingId = `drw-${Date.now()}`;
      const drawing: Drawing = {
        id: drawingId,
        projectId,
        fileName: file.name,
        fileSize: file.size,
        pageCount: 1,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      saveDrawingFile(drawingId, dataUrl);
      await repository.saveDrawing(drawing);

      if (project) {
        const updated = {
          ...project,
          drawingCount: project.drawingCount + 1,
          updatedAt: new Date().toISOString(),
        };
        await repository.saveProject(updated);
        setProject(updated);
      }

      setDrawings((prev) => [drawing, ...prev]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function deleteDrawing(id: string) {
    if (!confirm("도면을 삭제할까요? 분석 결과도 함께 삭제됩니다.")) return;
    await repository.deleteDrawing(id);
    setDrawings((prev) => prev.filter((drawing) => drawing.id !== id));
    if (project) {
      const updated = {
        ...project,
        drawingCount: Math.max(0, project.drawingCount - 1),
        updatedAt: new Date().toISOString(),
      };
      await repository.saveProject(updated);
      setProject(updated);
    }
  }

  if (!project) {
    return <div className="p-8 text-sm text-slate-500">프로젝트를 불러오는 중입니다.</div>;
  }

  return (
    <div className="p-4 lg:p-8">
      <Link href="/projects" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800">
        <ArrowLeft size={14} /> 프로젝트 목록
      </Link>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Review Project</p>
          <h1 className="df-heading mt-1 text-3xl font-black text-slate-900">{project.name}</h1>
          {project.customerName && <p className="mt-1 text-sm text-slate-500">{project.customerName}</p>}
          {project.description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{project.description}</p>}
        </div>

        <div>
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="df-button-primary">
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {uploading ? "업로드 중..." : "PDF 도면 업로드"}
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <p className="flex items-start gap-2">
          <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
          실제 고객 도면은 아직 업로드하지 마세요. V5는 로컬 저장 기반이며, 권한 관리와 비공개 저장 구조가 붙기 전까지
          공개 샘플 도면만 사용하는 것이 좋습니다.
        </p>
      </div>

      <div className="df-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <h2 className="font-black text-slate-900">도면 목록 ({drawings.length})</h2>
            <p className="mt-1 text-xs text-slate-500">PDF를 업로드한 뒤 분석 화면에서 공차, GD&T, 제조성 리스크를 검토합니다.</p>
          </div>
        </div>

        {drawings.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Upload size={24} />
            </div>
            <p className="font-black text-slate-800">아직 도면이 없습니다</p>
            <p className="mt-1 text-sm text-slate-500">샘플 PDF 도면을 업로드해서 제조성 검토 흐름을 확인하세요.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {drawings.map((drawing) => (
              <li key={drawing.id} className="group flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                    <FileText size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{drawing.fileName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {(drawing.fileSize / 1024).toFixed(0)} KB / {drawing.createdAt.slice(0, 10)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                  <StatusChip status={drawing.status} />
                  <Link href={`/drawings/${drawing.id}`} className="df-button-primary h-8 px-3 text-xs">
                    <Play size={12} /> 분석
                  </Link>
                  <button
                    onClick={() => deleteDrawing(drawing.id)}
                    className="rounded p-2 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    title="도면 삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: Drawing["status"] }) {
  const map: Record<Drawing["status"], { label: string; cls: string }> = {
    pending: { label: "대기", cls: "bg-slate-100 text-slate-600" },
    extracting: { label: "판독 중", cls: "bg-blue-100 text-blue-700" },
    analyzing: { label: "분석 중", cls: "bg-amber-100 text-amber-700" },
    done: { label: "완료", cls: "bg-emerald-100 text-emerald-700" },
    error: { label: "확인 필요", cls: "bg-red-100 text-red-700" },
  };

  const item = map[status];
  return <span className={`rounded px-2 py-1 text-xs font-bold ${item.cls}`}>{item.label}</span>;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
