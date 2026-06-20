"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { repository } from "@/lib/repository";
import type { Project } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProjectClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const project: Project = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      customerName: customerName.trim() || undefined,
      description: description.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      drawingCount: 0,
    };
    await repository.saveProject(project);
    router.push(`/projects/${project.id}`);
  }

  return (
    <div className="p-8 max-w-xl">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-6">
        <ArrowLeft size={14} /> 대시보드로
      </Link>

      <p className="text-xs font-black text-teal-600 uppercase tracking-widest mb-2">New Project</p>
      <h1 className="text-2xl font-black text-slate-800 mb-6">새 프로젝트 만들기</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            프로젝트 이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 유압 실린더 V2 도면 검토"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">고객사 / 담당자</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="예: ABC 자동화"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">설명 / 메모</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="이 프로젝트의 목적, 검토 배경 등을 입력하세요."
            rows={3}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/"
            className="flex-1 text-center px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
          >
            {saving ? "저장 중..." : "프로젝트 만들기"}
          </button>
        </div>
      </form>
    </div>
  );
}
