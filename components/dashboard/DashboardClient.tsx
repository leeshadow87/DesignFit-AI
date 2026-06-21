"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Gauge,
  LockKeyhole,
  Play,
  ShieldAlert,
  Sparkles,
  Upload,
} from "lucide-react";

const candidates = [
  {
    risk: "Critical",
    type: "RUNOUT",
    value: "0.015",
    feature: "Outer rim",
    recommendation: "유지 권장 / 회전체 검증",
    tone: "critical",
  },
  {
    risk: "High",
    type: "POSITION",
    value: "DIA 0.025",
    feature: "Bolt circle",
    recommendation: "조건부 완화 후보",
    tone: "high",
  },
  {
    risk: "High",
    type: "PROFILE",
    value: "0.018",
    feature: "Fir tree slot",
    recommendation: "유지 권장",
    tone: "high",
  },
  {
    risk: "Medium",
    type: "BORE FIT",
    value: "H7",
    feature: "Bearing bore",
    recommendation: "기능 확인 필요",
    tone: "medium",
  },
  {
    risk: "Low",
    type: "ROUGHNESS",
    value: "Ra 1.6",
    feature: "Mount face",
    recommendation: "현재 유지",
    tone: "low",
  },
];

const summary = [
  { label: "판독 후보", value: "18", caption: "텍스트/공차 항목", icon: FileSearch },
  { label: "고위험", value: "3", caption: "CAE 또는 선임 검토", icon: AlertTriangle },
  { label: "완화 후보", value: "5", caption: "비용 절감 검토", icon: Gauge },
];

export default function DashboardClient() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-700">
              DesignFit-AI V4
            </p>
            <h1 className="mt-1 text-xl font-black text-slate-900 lg:text-2xl">
              공차 완화 검토 워크벤치
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              도면에서 공차 후보를 찾고, 제조 난이도와 검증 조건을 한 화면에서 판단합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/projects/new" className="df-button">
              <Upload size={15} />
              PDF 업로드
            </Link>
            <button className="df-button-primary">
              <Play size={15} />
              샘플 분석 실행
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,.8fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:p-6">
        <section className="df-card overflow-hidden lg:row-span-2">
          <div className="flex h-12 items-center justify-between border-b border-slate-200 bg-slate-50 px-4">
            <div>
              <p className="text-sm font-black text-slate-900">Drawing Viewer</p>
              <p className="text-xs text-slate-500">DF-PROD-102 / synthetic sample / page 1</p>
            </div>
            <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
              판독 완료
            </span>
          </div>

          <div className="technical-grid relative min-h-[560px] p-5 lg:min-h-[720px]">
            <div className="relative h-full min-h-[520px] rounded border-2 border-slate-900 bg-white/70">
              <DrawingMockup />
              <div className="absolute left-[43%] top-[33%] h-[9%] w-[13%] rounded border-2 border-red-600 bg-red-500/10" />
              <div className="absolute left-[22%] top-[58%] h-[8%] w-[16%] rounded border-2 border-orange-500 bg-orange-500/10" />
              <div className="absolute left-[65%] top-[52%] h-[10%] w-[11%] rounded border-2 border-blue-600 bg-blue-500/10" />
              <div className="absolute bottom-3 left-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                시제품 모드: 샘플/공개 도면만 업로드 권장
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {summary.map(({ label, value, caption, icon: Icon }) => (
            <div key={label} className="df-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500">{label}</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">{value}</p>
                  <p className="mt-1 text-xs text-slate-500">{caption}</p>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-teal-50 text-teal-700">
                  <Icon size={21} />
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="df-card overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-slate-900">Selected Tolerance</p>
                <p className="text-xs text-slate-500">POSITION DIA 0.025 | A | B | C</p>
              </div>
              <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-black text-red-700">
                Risk 74
              </span>
            </div>
          </div>

          <div className="grid gap-4 p-4">
            <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-4">
              <div className="grid h-[92px] w-[92px] place-items-center rounded-full bg-[conic-gradient(#c92a2a_0_74%,#e9eef2_74%_100%)]">
                <div className="grid h-[66px] w-[66px] place-items-center rounded-full bg-white font-mono text-2xl font-black">
                  74
                </div>
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">고위험 검토 후보</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  위치도 공차가 볼트 패턴에 적용되어 있습니다. 위치 결정 기준인지, 단순 체결
                  관통부인지 확인 후 완화 가능성을 판단해야 합니다.
                </p>
              </div>
            </div>

            <div className="grid gap-2 text-sm">
              <InfoRow label="제조 영향" value="정밀 지그, CMM 반복 측정, 공정 선택 폭 축소 가능성" />
              <InfoRow label="완화 후보" value="DIA 0.050 - 0.080 조건부 검토" mono />
              <InfoRow label="필요 검증" value="볼트 클리어런스, 체결 후 밸런싱, 동심도 영향 확인" />
              <InfoRow label="AI 역할" value="정답 확정이 아니라 검토 근거와 질문을 정리" />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="flex items-center gap-2 text-xs font-black text-slate-700">
                <Sparkles size={14} className="text-teal-700" />
                V4 판단 원칙
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                위험도와 완화 가능성을 분리합니다. 같은 0.01mm라도 베어링 압입부와 커버
                체결면의 판단은 달라야 합니다.
              </p>
            </div>
          </div>
        </section>

        <section className="df-card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-black text-slate-900">Tolerance Candidates</p>
              <p className="text-xs text-slate-500">위험도, 기능, 완화 후보, 검증 조건을 분리해서 표시</p>
            </div>
            <button className="df-button-green">
              <CheckCircle2 size={15} />
              리포트 초안 생성
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-white text-xs font-black uppercase text-slate-500">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3">Risk</th>
                  <th className="border-b border-slate-200 px-4 py-3">Type</th>
                  <th className="border-b border-slate-200 px-4 py-3">Value</th>
                  <th className="border-b border-slate-200 px-4 py-3">Feature</th>
                  <th className="border-b border-slate-200 px-4 py-3">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((item) => (
                  <tr key={`${item.type}-${item.value}`} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-4 py-3">
                      <span className={`rounded px-2 py-1 text-xs font-black badge-${item.tone}`}>
                        {item.risk}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 font-mono text-xs font-bold">
                      {item.type}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 font-mono text-xs">
                      {item.value}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                      {item.feature}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                      {item.recommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="df-card overflow-hidden lg:col-span-2">
          <div className="grid gap-3 p-4 md:grid-cols-3">
            <SafetyCard
              icon={<LockKeyhole size={18} />}
              title="공개 URL 주의"
              desc="지금은 검증용입니다. 외부 공유 시 실제 도면명, 고객명, 사내 도번을 넣지 마세요."
            />
            <SafetyCard
              icon={<ShieldAlert size={18} />}
              title="OCR 실패 처리"
              desc="도면 판독 실패 시 demo data로 바꾸지 않고 OCR 필요 상태를 명확히 표시해야 합니다."
            />
            <SafetyCard
              icon={<ArrowRight size={18} />}
              title="다음 단계"
              desc="업로드, 분석, 리포트 흐름을 실제 PDF 샘플 기준으로 연결합니다."
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
      <b className="text-slate-700">{label}</b>
      <span className={mono ? "font-mono text-slate-900" : "text-slate-600"}>{value}</span>
    </div>
  );
}

function SafetyCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center gap-2 font-black text-slate-900">
        <span className="text-teal-700">{icon}</span>
        {title}
      </div>
      <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
    </div>
  );
}

function DrawingMockup() {
  return (
    <svg viewBox="0 0 920 620" className="h-full w-full" aria-label="synthetic drawing preview">
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#111827" />
        </marker>
      </defs>
      <rect x="18" y="18" width="884" height="584" fill="none" stroke="#111827" strokeWidth="1.5" />
      <circle cx="300" cy="300" r="150" fill="none" stroke="#111827" strokeWidth="1.5" />
      <circle cx="300" cy="300" r="102" fill="none" stroke="#536273" />
      <circle cx="300" cy="300" r="50" fill="none" stroke="#111827" strokeWidth="1.2" />
      <line x1="130" y1="300" x2="470" y2="300" stroke="#536273" strokeDasharray="6 4" />
      <line x1="300" y1="130" x2="300" y2="470" stroke="#536273" strokeDasharray="6 4" />
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const rad = (a * Math.PI) / 180;
        const x = 300 + 102 * Math.cos(rad);
        const y = 300 + 102 * Math.sin(rad);
        return <circle key={a} cx={x} cy={y} r="8" fill="none" stroke="#536273" />;
      })}
      <path
        d="M600 220 L650 260 L630 305 L670 348 L652 390 L560 390 L542 348 L582 305 L562 260 Z"
        fill="none"
        stroke="#111827"
        strokeWidth="1.3"
      />
      <rect x="650" y="505" width="185" height="70" fill="none" stroke="#111827" />
      <line x1="650" y1="528" x2="835" y2="528" stroke="#111827" />
      <line x1="720" y1="505" x2="720" y2="575" stroke="#111827" />
      <text x="35" y="44" fontSize="12" fontWeight="700">SYNTHETIC PRODUCTION DRAWING - TOLERANCE TEST</text>
      <text x="260" y="305" fontSize="13" fontWeight="700">DATUM A</text>
      <text x="365" y="215" fontSize="12">DATUM B</text>
      <text x="425" y="292" fontSize="11">12X DIA 18.000 H7</text>
      <text x="485" y="330" fontSize="11">POSITION DIA 0.025 | A | B | C</text>
      <text x="675" y="245" fontSize="11">PROFILE 0.018 | A | B</text>
      <text x="682" y="356" fontSize="11">ANGLE 55 deg +/-0.08</text>
      <text x="665" y="548" fontSize="11" fontWeight="700">DF-PROD-102</text>
      <text x="735" y="548" fontSize="11">TURBINE DISK SLOT</text>
      <line x1="410" y1="300" x2="560" y2="305" stroke="#111827" markerEnd="url(#arrow)" />
      <line x1="645" y1="260" x2="735" y2="246" stroke="#111827" markerEnd="url(#arrow)" />
      <line x1="620" y1="348" x2="752" y2="355" stroke="#111827" markerEnd="url(#arrow)" />
    </svg>
  );
}
