"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderOpen, FileText, ChevronRight } from "lucide-react";

const nav = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/projects", label: "프로젝트", icon: FolderOpen },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-[#1f303b] text-white flex flex-col z-30">
      {/* 브랜드 */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-200 text-teal-900 font-black flex items-center justify-center text-sm tracking-tight">
            DF
          </div>
          <div>
            <p className="font-black text-sm leading-tight">설계핏 AI</p>
            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">공차 최적화 Copilot V3</p>
          </div>
        </div>
      </div>

      {/* 네비 */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                active ? "bg-teal-700/60 text-white" : "text-slate-300 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* 하단 안내 */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="rounded-lg border border-white/12 bg-white/5 p-3">
          <p className="text-xs font-bold text-teal-300 mb-1">V3 핵심 원칙</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            공차 완화는 단정하지 않습니다.<br />
            기능을 확인한 후 후보를 제안합니다.
          </p>
        </div>
      </div>
    </aside>
  );
}
