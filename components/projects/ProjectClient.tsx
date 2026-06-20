"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, FileText, Loader2, Trash2, Play } from "lucide-react";
import { repository, saveDrawingFile } from "@/lib/repository";
import type { Project, Drawing } from "@/types";

export default function ProjectClient({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    repository.getProject(projectId).then(setProject);
    repository.getDrawings(projectId).then(setDrawings);
  }, [projectId]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith(".pdf")) return;
    setUploading(true);

    try {
      // base64 저장
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

      // 프로젝트 drawingCount 증가
      if (project) {
        const updated: Project = { ...project, drawingCount: project.drawingCount + 1, updatedAt: new Date().toISOString() };
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
    if (!confirm("이 도면을 삭제합니까?")) return;
    await repository.deleteDrawing(id);
    setDrawings((prev) => prev.filter((d) => d.id !== id));
    if (project) {
      const updated: Project = { ...project, drawingCount: Math.max(0, project.drawingCount - 1), updatedAt: new Date().toISOString() };
      await repository.saveProject(updated);
      setProject(updated);
    }
  }

  if (!project) {
    return <div className="p-8 text-slate-400">프로젝트를 불러오는 중...</div>;
  }

  return (
    <div className="p-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-6">
        <ArrowLeft size={14} /> 대시보드로
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-black text-teal-600 uppercase tracking-widest mb-1">Project</p>
          <h1 className="text-3xl font-black text-slate-800">{project.name}</h1>
          {project.customerName && <p className="text-slate-400 mt-1 text-sm">{project.customerName}</p>}
          {project.description && <p className="text-slate-500 mt-2 text-sm max-w-lg">{project.description}</p>}
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-bold rounded-lg transition-colors"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "업로드 중..." : "PDF 도면 업로드"}
          </button>
        </div>
      </div>

      {/* 도면 목록 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-black text-slate-800">도면 목록 ({drawings.length})</h2>
        </div>

        {drawings.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
              <Upload size={24} className="text-teal-600" />
            </div>
            <p className="font-bold text-slate-700 mb-1">도면이 없습니다</p>
            <p className="text-sm text-slate-400">
              PDF 도면을 업로드하면 공차 분석을 바로 시작할 수 있습니다.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {drawings.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <FileText size={16} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{d.fileName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(d.fileSize / 1024).toFixed(0)} KB · {d.createdAt.slice(0, 10)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusChip status={d.status} />
                  <Link
                    href={`/drawings/${d.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    <Play size={11} />
                    분석 시작
                  </Link>
                  <button
                    onClick={() => deleteDrawing(d.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
    pending: { label: "대기", cls: "bg-slate-100 text-slate-500" },
    extracting: { label: "추출 중", cls: "bg-blue-100 text-blue-600" },
    analyzing: { label: "분석 중", cls: "bg-amber-100 text-amber-600" },
    done: { label: "완료", cls: "bg-teal-100 text-teal-700" },
    error: { label: "오류", cls: "bg-red-100 text-red-600" },
  };
  const { label, cls } = map[status];
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>{label}</span>;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
