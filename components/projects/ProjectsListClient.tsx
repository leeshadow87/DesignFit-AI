"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderOpen, ChevronRight, Trash2 } from "lucide-react";
import { repository } from "@/lib/repository";
import type { Project } from "@/types";

export default function ProjectsListClient() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    repository.getProjects().then(setProjects);
  }, []);

  async function deleteProject(id: string) {
    if (!confirm("이 프로젝트를 삭제합니까? 모든 도면 분석 결과가 함께 삭제됩니다.")) return;
    await repository.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-black text-teal-600 uppercase tracking-widest mb-1">Projects</p>
          <h1 className="text-2xl font-black text-slate-800">프로젝트 목록</h1>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-lg transition-colors"
        >
          <Plus size={14} />
          새 프로젝트
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {projects.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center">
            <FolderOpen size={28} className="text-slate-300 mb-3" />
            <p className="font-bold text-slate-700 mb-1">프로젝트가 없습니다</p>
            <p className="text-sm text-slate-400 mb-5">새 프로젝트를 만들고 도면을 업로드하세요.</p>
            <Link
              href="/projects/new"
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-lg transition-colors"
            >
              <Plus size={13} />
              새 프로젝트 만들기
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {projects.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 group transition-colors">
                <Link href={`/projects/${p.id}`} className="flex-1 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                    <FolderOpen size={16} className="text-teal-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                      {p.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {p.customerName && `${p.customerName} · `}
                      도면 {p.drawingCount}개 · {p.updatedAt.slice(0, 10)}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-teal-600 transition-colors" />
                  <button
                    onClick={(e) => { e.preventDefault(); deleteProject(p.id); }}
                    className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={13} />
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
