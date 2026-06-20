"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderOpen, FileSearch, TrendingDown, AlertTriangle, ChevronRight } from "lucide-react";
import { repository } from "@/lib/repository";
import type { Project } from "@/types";

export default function DashboardClient() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    repository.getProjects().then(setProjects);
  }, []);

  const totalDrawings = projects.reduce((s, p) => s + p.drawingCount, 0);

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <p className="text-xs font-black text-teal-600 uppercase tracking-widest mb-2">
          PDF Drawing DFM Copilot · V3
        </p>
        <h1 className="text-4xl font-black text-slate-800 leading-tight max-w-2xl">
          도면을 올리면 과도한 공차를<br />찾아드립니다.
        </h1>
        <p className="mt-3 text-slate-500 text-lg max-w-xl leading-relaxed">
          비숙련 설계자가 타이트하게 잡은 공차를 기능 기준으로 재검토해 제조비를 낮춥니다.
          단정하지 않고, 근거와 기능 확인 질문으로 제안합니다.
        </p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon={<FolderOpen size={20} className="text-teal-600" />} label="프로젝트" value={projects.length} />
        <StatCard icon={<FileSearch size={20} className="text-teal-600" />} label="분석 도면" value={totalDrawings} />
        <StatCard icon={<TrendingDown size={20} className="text-teal-600" />} label="완화 후보 제안" value="공차 검토 후 확인" isText />
      </div>

      {/* V3 핵심 기능 소개 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          {
            step: "01",
            title: "PDF 도면 업로드",
            desc: "도면을 업로드하면 텍스트와 공차 기호를 자동으로 추출합니다. OCR 결과는 직접 수정 가능합니다.",
          },
          {
            step: "02",
            title: "공차 위험도 자동 분류",
            desc: "룰엔진이 ±0.01 이하, 위치도, 평면도, Ra, 끼워맞춤 공차를 CRITICAL·HIGH·MEDIUM·LOW로 분류합니다.",
          },
          {
            step: "03",
            title: "기능 확인 → 완화 후보 제안",
            desc: "베어링인지, 씰링인지, 볼트 통과홀인지 확인 후 완화 가능성을 조건부로 제안합니다.",
          },
        ].map((card) => (
          <div key={card.step} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <span className="text-xs font-black text-teal-600 tracking-widest">{card.step}</span>
            <h3 className="font-black text-slate-800 mt-2 mb-2">{card.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* 프로젝트 목록 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-black text-slate-800">최근 프로젝트</h2>
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-lg transition-colors"
          >
            <Plus size={14} />
            새 프로젝트
          </Link>
        </div>

        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-y divide-slate-100">
            {projects.slice(0, 8).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div>
                    <p className="font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                      {p.name}
                    </p>
                    {p.customerName && (
                      <p className="text-xs text-slate-400 mt-0.5">{p.customerName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>{p.drawingCount}개 도면</span>
                    <span>{p.updatedAt.slice(0, 10)}</span>
                    <ChevronRight size={14} className="group-hover:text-teal-600 transition-colors" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 경고 배너 */}
      <div className="mt-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-700 leading-relaxed">
          <strong>중요:</strong> 이 도구는 공차 완화를 단정하지 않습니다.
          안전·강도·씰링·회전 정렬 관련 공차는 반드시 CAE 또는 선임 엔지니어 검토 후 결정하세요.
          완화 후보는 기능 확인 질문에 답변한 조건 하에서만 유효합니다.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, isText,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  isText?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-xs text-slate-400 font-semibold">{label}</p>
        <p className={`font-black ${isText ? "text-sm text-teal-700 mt-0.5" : "text-2xl text-slate-800"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
        <FileSearch size={28} className="text-teal-600" />
      </div>
      <p className="font-bold text-slate-700 mb-1">아직 프로젝트가 없습니다</p>
      <p className="text-sm text-slate-400 mb-6">
        새 프로젝트를 만들고 PDF 도면을 업로드하면<br />공차 검토를 바로 시작할 수 있습니다.
      </p>
      <Link
        href="/projects/new"
        className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-lg transition-colors"
      >
        <Plus size={14} />
        첫 프로젝트 만들기
      </Link>
    </div>
  );
}
