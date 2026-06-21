"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Database, FileSearch, FolderOpen, LayoutDashboard, ShieldCheck } from "lucide-react";

const nav = [
  { href: "/", label: "AI 검토 홈", meta: "Review", icon: FileSearch },
  { href: "/projects", label: "프로젝트", meta: "Files", icon: FolderOpen },
  { href: "/projects/new", label: "새 검토 생성", meta: "New", icon: LayoutDashboard },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen flex-col bg-[var(--df-navy)] px-3 py-4 text-white lg:flex">
      <div className="flex items-center gap-3 border-b border-white/10 px-2 pb-5">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#d9fff0] text-sm font-black text-[#075f48]">
          DF
        </div>
        <div>
          <p className="text-sm font-black leading-tight">DesignFit-AI</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">Manufacturing Intelligence</p>
        </div>
      </div>

      <nav className="mt-5 grid gap-1">
        {nav.map(({ href, label, meta, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center justify-between rounded-lg px-3 py-3 text-sm font-bold transition-colors ${
                active
                  ? "bg-[var(--df-navy-2)] text-white shadow-[inset_3px_0_0_var(--df-green)]"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon size={17} />
                {label}
              </span>
              <span className="font-mono text-[10px] text-slate-500">{meta}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-black text-[#7dffbe]">
          <ShieldCheck size={15} />
          검증용 시제품
        </div>
        <p className="text-xs leading-relaxed text-slate-300">
          실제 고객 도면, 보안 도면, 사내 도번은 업로드하지 마세요. 현재 버전은 공개 샘플 도면으로
          도면 판독과 제조성 검토 흐름을 검증하는 단계입니다.
        </p>
      </div>

      <div className="mt-auto grid gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
        <p className="flex items-center gap-2 font-bold text-white">
          <Database size={14} />
          V5 검토 범위
        </p>
        <p className="flex items-start gap-2">
          <ClipboardList size={14} className="mt-0.5 text-slate-500" />
          공차, GD&T, 재질, 공정 난이도, 검사 방식, 비용 영향, CAE 검증 필요성을 함께 정리합니다.
        </p>
      </div>
    </aside>
  );
}
