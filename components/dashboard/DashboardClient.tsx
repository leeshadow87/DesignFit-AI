"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Brain,
  CheckCircle2,
  CircleDot,
  FileSearch,
  Gauge,
  Layers3,
  ListChecks,
  Play,
  Route,
  ShieldAlert,
  Upload,
} from "lucide-react";

const reviewSummary = [
  { label: "검출 항목", value: "18", desc: "치수, 공차, GD&T, 표면거칠기", icon: FileSearch },
  { label: "제조 리스크", value: "7", desc: "가공 난이도와 검사 부담", icon: AlertTriangle },
  { label: "개선 후보", value: "5", desc: "완화, 공정 변경, 검증 필요", icon: Gauge },
  { label: "검증 질문", value: "3", desc: "CAE, 조립성, 기능 요구 확인", icon: BadgeCheck },
];

const findings = [
  {
    type: "GD&T",
    target: "POSITION DIA 0.025 | A | B | C",
    risk: "볼트 패턴 위치도가 조립 기준 대비 과도하게 타이트합니다.",
    impact: "CMM 반복 측정, 치공구 보정, 재가공 가능성이 증가합니다.",
    action: "기능 간섭이 없으면 DIA 0.05-0.08 범위로 완화 검토",
    level: "High",
  },
  {
    type: "회전체",
    target: "TOTAL RUNOUT 0.015 TO A",
    risk: "런아웃은 진동, 동심도, 베어링 수명과 직접 연결됩니다.",
    impact: "단순 완화보다 회전 해석 또는 시험 근거가 먼저 필요합니다.",
    action: "CAE/시험 조건 확인 후 유지 또는 부분 완화 판단",
    level: "Critical",
  },
  {
    type: "표면",
    target: "Ra 0.8 / PROFILE 0.018",
    risk: "접촉면이 아닌 영역까지 고정밀 조건이 확장되어 있습니다.",
    impact: "연삭, 추가 검사, 리드타임 증가 요인이 됩니다.",
    action: "기능면과 비기능면을 분리해 Ra 1.6-3.2 후보 제시",
    level: "Medium",
  },
];

const processSteps = [
  "도면 업로드",
  "OCR/도면 판독",
  "요구조건 추출",
  "제조성 판단",
  "검증 질문 생성",
  "리포트 초안",
];

const scopeCards = [
  {
    icon: Layers3,
    title: "도면 판독",
    desc: "PDF, 이미지, CAD 출력물을 읽고 치수와 GD&T 후보를 구조화합니다.",
  },
  {
    icon: Route,
    title: "공정 영향",
    desc: "일반 가공, 특수 공정, 검사 방법, 비용 증가 요인을 함께 봅니다.",
  },
  {
    icon: Brain,
    title: "AI 검토 질문",
    desc: "바로 완화하지 않고 먼저 확인해야 할 기능, 조립, CAE 질문을 만듭니다.",
  },
];

export default function DashboardClient() {
  return (
    <div className="min-h-screen bg-[var(--df-bg)]">
      <header className="border-b border-slate-200 bg-white px-4 py-5 lg:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-5xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--df-green)]">
              DesignFit-AI V5 Direction
            </p>
            <h1 className="df-heading mt-2 max-w-5xl text-2xl font-black leading-tight text-slate-950 lg:text-3xl 2xl:text-4xl">
              도면을 읽고 제조 리스크와 설계 개선 방향을 판단합니다.
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600 lg:text-base">
              공차 완화는 결과 중 하나입니다. DesignFit-AI는 도면의 치수, GD&T, 재질, 공정 난이도,
              검사 방법, 비용 영향, CAE 검증 필요성을 함께 정리해 설계자가 다음 결정을 빠르게 내리도록 돕습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/projects/new" className="df-button">
              <Upload size={15} />
              도면 업로드
            </Link>
            <button className="df-button-primary">
              <Play size={15} />
              샘플 분석 실행
            </button>
          </div>
        </div>
      </header>

      <main className="grid gap-5 p-4 lg:p-8">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(390px,.8fr)]">
          <div className="df-card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">도면 기반 AI 검토 화면</h2>
                <p className="mt-1 text-sm text-slate-500">
                  설계자가 보는 도면 위에 리스크 후보와 근거를 바로 겹쳐 보여주는 구조입니다.
                </p>
              </div>
              <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                시제품 검증 모드
              </span>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="technical-grid rounded-lg border border-slate-200 bg-white p-4">
                <div className="relative min-h-[430px] rounded border-2 border-slate-900 bg-white/80">
                  <DrawingPreview />
                  <RiskBox className="left-[42%] top-[35%] h-[10%] w-[15%]" tone="red" label="위치도" />
                  <RiskBox className="left-[23%] top-[60%] h-[8%] w-[18%]" tone="orange" label="공차" />
                  <RiskBox className="right-[21%] top-[55%] h-[11%] w-[12%]" tone="blue" label="CAE" />
                  <div className="absolute bottom-3 left-3 max-w-[72%] rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-relaxed text-amber-900">
                    실제 고객 도면 업로드 전까지는 샘플/공개 도면으로만 검증하는 화면입니다.
                  </div>
                </div>
              </div>

              <div className="grid content-start gap-3">
                {reviewSummary.map(({ label, value, desc, icon: Icon }) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-slate-500">{label}</p>
                        <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
                      </div>
                      <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                        <Icon size={21} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="df-card overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="text-lg font-black text-slate-950">AI 판단 결과</h2>
              <p className="mt-1 text-sm text-slate-500">
                정답을 단정하지 않고 리스크, 영향, 확인 질문을 분리합니다.
              </p>
            </div>

            <div className="grid gap-4 p-5">
              <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-white text-red-700">
                    <AlertTriangle size={21} />
                  </div>
                  <div>
                    <p className="font-black text-red-800">우선 검토 필요 항목 3개</p>
                    <p className="mt-1 text-sm leading-relaxed text-red-700">
                      회전체, 위치도, 프로파일 공차는 비용뿐 아니라 기능과 검사 신뢰성에 직접 영향을 줍니다.
                    </p>
                  </div>
                </div>
              </div>

              {findings.map((finding) => (
                <div key={finding.target} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className={`rounded px-2 py-1 text-xs font-black badge-${finding.level.toLowerCase()}`}>
                      {finding.type}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{finding.level}</span>
                  </div>
                  <p className="font-mono text-xs font-black text-slate-900">{finding.target}</p>
                  <p className="mt-2 text-sm font-bold text-slate-800">{finding.risk}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{finding.impact}</p>
                  <p className="mt-2 text-sm font-black text-emerald-800">{finding.action}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="df-card overflow-hidden">
          <div className="grid gap-4 p-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--df-green)]">Product Scope</p>
              <h2 className="mt-2 text-xl font-black text-slate-950">V5는 공차 완화 앱이 아니라 도면 제조성 판단 앱입니다.</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                화면도 이 관점에 맞춰, 업로드 버튼보다 판단 근거와 다음 액션이 먼저 보이도록 구성해야 합니다.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {scopeCards.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-white text-emerald-700">
                    <Icon size={18} />
                  </div>
                  <p className="font-black text-slate-950">{title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="df-card overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="text-lg font-black text-slate-950">검토 프로세스</h2>
              <p className="mt-1 text-sm text-slate-500">MVP에서 바로 보여줘야 할 사용자 흐름입니다.</p>
            </div>
            <div className="grid gap-2 p-5 md:grid-cols-6">
              {processSteps.map((step, index) => (
                <div key={step} className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="font-mono text-xs font-black text-emerald-700">0{index + 1}</p>
                  <p className="mt-2 text-sm font-black text-slate-900">{step}</p>
                  {index < processSteps.length - 1 && <ArrowRight className="mt-3 hidden text-slate-300 md:block" size={16} />}
                </div>
              ))}
            </div>
          </div>

          <div className="df-card p-5">
            <div className="flex items-center gap-2">
              <ListChecks size={18} className="text-emerald-700" />
              <h2 className="font-black text-slate-950">V5 설계 원칙</h2>
            </div>
            <div className="mt-4 grid gap-3 text-sm leading-relaxed text-slate-600">
              <Principle text="챗봇이 아니라 도면 위에서 판단하는 엔지니어링 콘솔처럼 보이게 합니다." />
              <Principle text="공차 완화보다 제조성, 검사성, 비용 영향, 검증 질문을 먼저 보여줍니다." />
              <Principle text="확신 점수보다 근거와 보류 조건을 분리해 설계자가 신뢰할 수 있게 합니다." />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="mt-0.5 flex-shrink-0 text-amber-700" />
            <div>
              <p className="font-black text-amber-900">시제품 공개 범위</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-800">
                현재 단계에서는 공개 샘플 도면만 사용하세요. 실제 고객 도면, 보안 도면, 사내 도번, 업체명,
                프로젝트명은 권한 관리와 비공개 저장 구조가 붙기 전까지 업로드하지 않는 것이 좋습니다.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Principle({ text }: { text: string }) {
  return (
    <div className="flex gap-2">
      <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-emerald-700" />
      <p>{text}</p>
    </div>
  );
}

function RiskBox({ className, tone, label }: { className: string; tone: "red" | "orange" | "blue"; label: string }) {
  const color =
    tone === "red"
      ? "border-red-600 bg-red-500/10 text-red-700"
      : tone === "orange"
        ? "border-orange-500 bg-orange-500/10 text-orange-700"
        : "border-blue-600 bg-blue-500/10 text-blue-700";

  return (
    <div className={`absolute rounded border-2 ${color} ${className}`}>
      <span className="absolute -top-6 left-0 min-w-12 rounded bg-white px-2 py-0.5 text-center text-[10px] font-black shadow-sm">
        {label}
      </span>
    </div>
  );
}

function DrawingPreview() {
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
      <text x="35" y="44" fontSize="12" fontWeight="700">SYNTHETIC PRODUCTION DRAWING - DESIGN REVIEW TEST</text>
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
      <g transform="translate(48 500)">
        <rect width="220" height="72" fill="none" stroke="#111827" />
        <text x="12" y="22" fontSize="10" fontWeight="700">GENERAL NOTES</text>
        <text x="12" y="42" fontSize="9">1. ALL DIMENSIONS IN MM.</text>
        <text x="12" y="56" fontSize="9">2. INSPECTION REQUIRED FOR GD&T.</text>
      </g>
      <CircleDot x={0} y={0} className="hidden" />
      <BarChart3 className="hidden" />
    </svg>
  );
}
