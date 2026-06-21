"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { repository } from "@/lib/repository";
import type { Project } from "@/types";

export default function NewProjectClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
    <div className="max-w-2xl p-4 lg:p-8">
      <Link href="/projects" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800">
        <ArrowLeft size={14} /> 프로젝트 목록
      </Link>

      <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-700">New Project</p>
      <h1 className="mt-1 text-2xl font-black text-slate-900">새 검토 프로젝트</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        V4 시제품에서는 샘플 도면과 공개 도면만 사용하세요. 실제 고객명은 필요할 때만
        익명화해서 입력하는 것을 권장합니다.
      </p>

      <div className="my-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <p className="flex items-start gap-2">
          <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
          보안 도면, 사내 도번, 고객사 실명은 입력하지 마세요. 운영 저장소 적용 전까지는 검증용입니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="df-card space-y-5 p-6">
        <div>
          <label className="mb-1.5 block text-sm font-black text-slate-700">
            프로젝트명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="예: 터빈 디스크 공차 완화 검토"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-black text-slate-700">고객/사업부 별칭</label>
          <input
            type="text"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="예: 내부 검증, 샘플 프로젝트"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-black text-slate-700">검토 메모</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="검토 목적, 공정 가정, 샘플 도면 출처를 간단히 기록하세요."
            rows={4}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/projects" className="df-button flex-1">
            취소
          </Link>
          <button type="submit" disabled={!name.trim() || saving} className="df-button-primary flex-1 disabled:opacity-50">
            {saving ? "저장 중..." : "프로젝트 만들기"}
          </button>
        </div>
      </form>
    </div>
  );
}
