"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, FolderOpen, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { repository } from "@/lib/repository";
import type { Project } from "@/types";

export default function ProjectsListClient() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    repository.getProjects().then(setProjects);
  }, []);

  async function deleteProject(id: string) {
    if (!confirm("프로젝트를 삭제할까요? 연결된 도면과 분석 결과도 함께 삭제됩니다.")) return;
    await repository.deleteProject(id);
    setProjects((prev) => prev.filter((project) => project.id !== id));
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-700">Projects</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">프로젝트 목록</h1>
          <p className="mt-1 text-sm text-slate-500">샘플 도면과 검증용 프로젝트만 관리하세요.</p>
        </div>
        <Link href="/projects/new" className="df-button-primary">
          <Plus size={15} /> 새 프로젝트
        </Link>
      </div>

      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <p className="flex items-start gap-2">
          <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
          실제 고객 도면, 사내 도번, 업체명은 아직 업로드하지 마세요. V4는 검증용 로컬 저장 기반입니다.
        </p>
      </div>

      <div className="df-card overflow-hidden">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <FolderOpen size={30} className="mb-3 text-slate-300" />
            <p className="font-black text-slate-800">프로젝트가 없습니다</p>
            <p className="mt-1 text-sm text-slate-500">새 프로젝트를 만들고 PDF 도면을 업로드하세요.</p>
            <Link href="/projects/new" className="df-button-primary mt-5">
              <Plus size={14} /> 첫 프로젝트 만들기
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {projects.map((project) => (
              <li key={project.id} className="group flex items-center justify-between px-5 py-4 hover:bg-slate-50">
                <Link href={`/projects/${project.id}`} className="flex flex-1 items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-teal-700">
                    <FolderOpen size={17} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 group-hover:text-teal-700">{project.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {project.customerName ? `${project.customerName} · ` : ""}
                      도면 {project.drawingCount}개 · {project.updatedAt.slice(0, 10)}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <ChevronRight size={15} className="text-slate-300 group-hover:text-teal-600" />
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="rounded p-2 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    title="프로젝트 삭제"
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
