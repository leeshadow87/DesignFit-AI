# DesignFit-AI V3 설치 및 배포 가이드

## 1단계: Node.js 설치 (필수)

Node.js가 없으면 아무것도 실행되지 않습니다.

1. https://nodejs.org 접속
2. **LTS 버전 (20.x 이상)** 다운로드 후 설치
3. 터미널(명령 프롬프트/PowerShell)에서 확인:
   ```
   node --version
   npm --version
   ```

---

## 2단계: 패키지 설치 및 로컬 실행

이 폴더(DesignFit-AI-V3)에서 터미널을 열고:

```bash
npm install
npm run dev
```

브라우저에서 열기: http://localhost:3000

---

## 3단계: GitHub 업로드

```bash
git init
git add .
git commit -m "DesignFit-AI V3 초기 커밋"
git branch -M main
git remote add origin https://github.com/[본인 GitHub 계정]/designfit-ai-v3.git
git push -u origin main
```

---

## 4단계: Vercel 배포

1. https://vercel.com 로그인
2. "New Project" → GitHub 리포지토리 선택
3. Framework: **Next.js** (자동 감지됨)
4. Build Command: `npm run build` (자동)
5. "Deploy" 클릭

### 기존 도메인 연결

Vercel 프로젝트 설정 → **Domains** → 기존 V2 도메인 추가

---

## 폴더 구조 요약

```
app/              페이지 (Next.js App Router)
components/       React 컴포넌트
  dashboard/      메인 대시보드
  projects/       프로젝트 관리
  drawings/       도면 분석 (핵심)
  layout/         사이드바, 레이아웃
  ui/             공통 뱃지 등
lib/              엔진 로직
  toleranceParser.ts   공차 패턴 추출
  toleranceRules.ts    위험도 룰엔진
  analysisEngine.ts    분석 파이프라인
  reportGenerator.ts   PDF/CSV 내보내기
  repository.ts        저장소 (localStorage)
types/index.ts    전체 TypeScript 타입
```

---

## V3 사용 방법

1. **새 프로젝트 만들기** → 이름 입력
2. **PDF 도면 업로드** (업로드 버튼)
3. **분석 시작** 클릭 → 공차 자동 추출
4. PDF text layer가 없는 스캔 도면: **텍스트 직접 입력** 사용
5. 각 공차 항목 클릭 → 기능 선택 (베어링/씰링/볼트 등)
6. 리포트 탭 → **CSV/PDF 내보내기**
