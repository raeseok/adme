"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  STAGE4A_BUILD_NAME,
  STAGE4A_DEMO_CATEGORIES,
  STAGE4A_DEMO_DAYS,
  STAGE4A_DEMO_IMAGE_URL,
  STAGE4A_DEMO_POSTER_URL,
  STAGE4A_DEMO_VIDEO_URL,
  STAGE4A_DEMO_REGIONS,
  STAGE4A_MIN_VIEW_SECONDS_MAX,
  STAGE4A_MIN_VIEW_SECONDS_MIN,
  STAGE4A_POINT_MAX,
  STAGE4A_POINT_MIN,
  STAGE4A_STATUS_LABELS,
} from "@/lib/advertiser-demo/constants";
import {
  calculateStage4ABudgetEstimate,
  estimateStage4AReach,
  estimateStage4AVerifiedEngagements,
  formatStage4ANumber,
  formatStage4APercent,
  formatStage4APoints,
} from "@/lib/advertiser-demo/calculations";
import { useStage4ADemoStore } from "@/lib/advertiser-demo/browser-store";
import {
  STAGE4A_DEMO_CAMPAIGNS,
  STAGE4A_WIZARD_DEFAULTS,
} from "@/lib/advertiser-demo/fixtures";
import {
  createPublicCreative,
  createPublicQuiz,
  getLandingHostname,
  recordLandingClickDemoState,
  switchQuizType,
  validateCreativeMedia,
  validateLandingUrl,
  validateMultipleChoiceQuiz,
} from "@/lib/advertiser-demo/creative-quiz";
import {
  selectStage4ACampaign,
  selectStage4ACampaigns,
  selectStage4ADashboardTotals,
} from "@/lib/advertiser-demo/selectors";
import { applyStage4ATransition } from "@/lib/advertiser-demo/state-machine";
import type {
  AdCreativePublic,
  AdQuizType,
  AdvertiserQuizAuthoringSecret,
  Stage4ACampaign,
  Stage4ACampaignStatus,
} from "@/lib/advertiser-demo/types";

type AdvertiserDemoConsoleProps = {
  view:
    | "dashboard"
    | "campaigns"
    | "wizard"
    | "detail"
    | "preview"
    | "performance"
    | "admin-list"
    | "admin-detail";
  campaignId?: string;
};

type WizardForm = typeof STAGE4A_WIZARD_DEFAULTS;

const timelineStatuses: Stage4ACampaignStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "active",
  "completed",
];

export function AdvertiserDemoConsole({ view, campaignId }: AdvertiserDemoConsoleProps) {
  const { store, setStore, resetStore, mounted } = useStage4ADemoStore();
  const [resetOpen, setResetOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const campaigns = selectStage4ACampaigns(store);
  const campaign = selectStage4ACampaign(store, campaignId);
  const totals = selectStage4ADashboardTotals(store);

  function confirmReset() {
    resetStore();
    setNotice("광고주 데모가 초기 상태로 재설정되었습니다.");
    setResetOpen(false);
  }

  return (
    <div className="space-y-6">
      <DemoHeader mounted={mounted} onReset={() => setResetOpen(true)} />
      {notice && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {notice}
        </p>
      )}
      {view === "dashboard" && (
        <Dashboard campaigns={campaigns} totals={totals} onReset={() => setResetOpen(true)} />
      )}
      {view === "campaigns" && <CampaignList campaigns={campaigns} />}
      {view === "wizard" && <CampaignWizard store={store} setStore={setStore} />}
      {view === "detail" && <CampaignDetail campaign={campaign} storeEvents={store.eventsByCampaignId[campaign.id] ?? []} />}
      {view === "preview" && <CampaignPreview campaign={campaign} />}
      {view === "performance" && <PerformanceDashboard campaign={campaign} />}
      {view === "admin-list" && (
        <AdminReviewList campaigns={campaigns} onReset={() => setResetOpen(true)} />
      )}
      {view === "admin-detail" && (
        <AdminReviewDetail
          campaign={campaign}
          events={store.eventsByCampaignId[campaign.id] ?? []}
          apply={(nextStatus, label) => {
            const result = applyStage4ATransition({
              store,
              campaignId: campaign.id,
              nextStatus,
              label,
            });
            if (result.ok) {
              setStore(result.store);
              setNotice(`${STAGE4A_STATUS_LABELS[nextStatus]} 상태로 변경되었습니다.`);
            } else {
              setNotice(result.message);
            }
          }}
        />
      )}
      {resetOpen && (
        <ResetModal onCancel={() => setResetOpen(false)} onConfirm={confirmReset} />
      )}
    </div>
  );
}

function DemoHeader({
  mounted,
  onReset,
}: {
  mounted: boolean;
  onReset: () => void;
}) {
  return (
    <section className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-4 text-sm text-violet-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold">{STAGE4A_BUILD_NAME}</p>
          <h1 className="mt-1 text-xl font-bold">투자자 데모 · 광고주 콘솔</h1>
          <p className="mt-2 font-semibold">
            DEMO / SANDBOX — 실제 결제·캠페인 집행 없음
          </p>
          <p className="mt-1 text-violet-800">
            Production DB mutation 없음 · 브라우저 전용 demo store · 정답은 서버 전용
            정보이며 소비자 화면에 노출되지 않습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-semibold text-violet-900"
        >
          Demo Reset
        </button>
      </div>
      <p className="mt-2 text-xs text-violet-700">
        Demo store 상태: {mounted ? "browser store loaded" : "loading stable fixture"}
      </p>
    </section>
  );
}

function Dashboard({
  campaigns,
  totals,
  onReset,
}: {
  campaigns: Stage4ACampaign[];
  totals: ReturnType<typeof selectStage4ADashboardTotals>;
  onReset: () => void;
}) {
  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="광고주명" value="AdMe Demo Advertiser" />
        <Metric label="현재 demo 캠페인 수" value={formatStage4ANumber(totals.campaignCount)} />
        <Metric label="활성 캠페인 수" value={formatStage4ANumber(totals.activeCampaignCount)} />
        <Metric label="검토 대기 수" value={formatStage4ANumber(totals.pendingCampaignCount)} />
        <Metric label="총 Verified Views" value={formatStage4ANumber(totals.verifiedViews)} />
        <Metric label="총 Quiz Pass" value={formatStage4ANumber(totals.quizPasses)} />
        <Metric label="총 Demo Point Spend" value={formatStage4APoints(totals.demoPointSpend)} />
        <Metric
          label="평균 Cost per Verified Engagement"
          value={formatStage4APoints(totals.costPerVerifiedEngagement)}
        />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-zinc-900">최근 캠페인</h2>
            <p className="text-sm text-zinc-600">
              모든 수치는 investor demo data이며 실제 집행이나 결제와 연결되지 않습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/advertiser/campaigns/new" className="primary-link">
              새 캠페인 만들기
            </Link>
            <button type="button" onClick={onReset} className="secondary-button">
              Demo Reset
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {campaigns.slice(0, 4).map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-950">
        <h2 className="font-semibold">투자자 데모 진행 순서</h2>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Dashboard에서 demo KPI 확인",
            "5단계 Wizard로 캠페인 생성",
            "관리자 검토 제출 및 승인",
            "성과 Dashboard와 Demo Reset 확인",
          ].map((step, index) => (
            <li key={step} className="rounded-xl bg-white px-3 py-2">
              {index + 1}. {step}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

function CampaignList({ campaigns }: { campaigns: Stage4ACampaign[] }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">캠페인 목록</h2>
          <p className="text-sm text-zinc-600">
            draft, submitted, under_review, changes_requested, approved, active, completed 상태를
            demo data로 확인합니다.
          </p>
        </div>
        <Link href="/advertiser/campaigns/new" className="primary-link">
          새 캠페인 만들기
        </Link>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </section>
  );
}

function CampaignCard({ campaign }: { campaign: Stage4ACampaign }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-blue-700">{campaign.category}</p>
          <h3 className="mt-1 font-semibold text-zinc-900">{campaign.name}</h3>
          <p className="mt-1 text-sm text-zinc-600">{campaign.targetRegions.join(", ")}</p>
        </div>
        <StatusBadge status={campaign.status} />
      </div>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <Info label="지급 포인트" value={formatStage4APoints(campaign.pointPerPass)} />
        <Info label="Demo 예산" value={formatStage4APoints(campaign.demoBudgetPoints)} />
        <Info label="예정일" value={`${campaign.startsAt} ~ ${campaign.endsAt}`} />
        <Info
          label="Quiz Pass Rate"
          value={formatStage4APercent(campaign.metrics.quizPasses, campaign.metrics.quizAttempts)}
        />
        <Info label="Verified Views" value={formatStage4ANumber(campaign.metrics.verifiedViews)} />
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/advertiser/campaigns/${campaign.id}`} className="secondary-link">
          상세 보기
        </Link>
        <Link
          href={`/advertiser/campaigns/${campaign.id}/performance`}
          className="secondary-link"
        >
          성과 보기
        </Link>
      </div>
    </article>
  );
}

function CampaignWizard({
  store,
  setStore,
}: {
  store: ReturnType<typeof useStage4ADemoStore>["store"];
  setStore: (store: ReturnType<typeof useStage4ADemoStore>["store"]) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardForm>(STAGE4A_WIZARD_DEFAULTS);
  const [authoringSecret, setAuthoringSecret] = useState<AdvertiserQuizAuthoringSecret>({
    multipleChoiceSelection: 0,
    shortAnswer: "",
    acceptedAnswers: [],
  });
  const [error, setError] = useState("");
  const estimatedReach = estimateStage4AReach({
    regionCount: form.targetRegions.length,
    categoryCount: form.interestCategories.length,
    dayCount: form.exposureDays.length,
    pointPerPass: form.pointPerPass,
    minViewSeconds: form.minViewSeconds,
  });
  const estimatedVerifiedEngagements = estimateStage4AVerifiedEngagements(estimatedReach);
  const estimate = calculateStage4ABudgetEstimate({
    demoBudgetPoints: form.demoBudgetPoints,
    pointPerPass: form.pointPerPass,
    estimatedVerifiedEngagements,
  });

  function validateCurrentStep() {
    if (step === 1 && (!form.name.trim() || !form.adTitle.trim() || !form.description.trim())) {
      return "기본 정보 필수 입력값을 확인해 주세요.";
    }
    if (step === 2 && (form.targetRegions.length === 0 || form.exposureDays.length === 0)) {
      return "타겟 지역과 노출 요일을 1개 이상 선택해 주세요.";
    }
    if (step === 3) {
      const creative = createPublicCreative({
        type: form.creativeType,
        title: form.creativeTitle,
        body: form.creativeBody,
        imageUrl: form.imageUrl,
        imageAlt: form.imageAlt,
        videoUrl: form.videoUrl,
        videoPosterUrl: form.videoPosterUrl,
        videoCaption: form.videoCaption,
        linkEnabled: form.linkEnabled,
        landingUrl: form.landingUrl,
        ctaLabel: form.ctaLabel,
      });
      const landing = form.linkEnabled ? validateLandingUrl(form.landingUrl) : { ok: true };
      const multipleChoice = validateMultipleChoiceQuiz(
        form.quizOptions,
        authoringSecret.multipleChoiceSelection ?? null,
      );
      const shortAnswerRegistered = Boolean(authoringSecret.shortAnswer?.trim());
      if (
        form.minViewSeconds < STAGE4A_MIN_VIEW_SECONDS_MIN ||
        form.minViewSeconds > STAGE4A_MIN_VIEW_SECONDS_MAX ||
        form.pointPerPass < STAGE4A_POINT_MIN ||
        form.pointPerPass > STAGE4A_POINT_MAX ||
        !validateCreativeMedia(creative) ||
        !landing.ok ||
        !form.quizQuestion.trim() ||
        (form.quizType === "multiple_choice" && !multipleChoice.ok) ||
        (form.quizType === "short_answer" && !shortAnswerRegistered)
      ) {
        return "광고 메인 콘텐츠, 랜딩 URL, 퀴즈 유형, 지급 포인트 범위를 확인해 주세요.";
      }
    }
    if (step === 4 && form.demoBudgetPoints < form.pointPerPass) {
      return "Demo 예산은 지급 포인트보다 커야 합니다.";
    }
    return "";
  }

  function nextStep() {
    const message = validateCurrentStep();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setStep((value) => Math.min(5, value + 1));
  }

  function submitDemo() {
    const draftId = "jongno-after-work-draft";
    const first = applyStage4ATransition({
      store,
      campaignId: draftId,
      nextStatus: "ready_for_preview",
      label: "작성 완료 및 Preview 확인",
    });
    const readyStore = first.ok ? first.store : store;
    const second = applyStage4ATransition({
      store: readyStore,
      campaignId: draftId,
      nextStatus: "submitted",
      label: "관리자 검토 제출",
    });
    if (!second.ok) {
      setError(second.message);
      return;
    }
    setStore(second.store);
    router.push(`/advertiser/campaigns/${draftId}`);
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">캠페인 생성 Wizard</h2>
          <p className="text-sm text-zinc-600">
            소비자의 개인 식별 정보는 광고주에게 제공되지 않습니다.
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-700">
          Step {step} / 5
        </span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-5">
        {["기본 정보", "타겟 설정", "열람·퀴즈·리워드", "예산·예상 성과", "Preview 및 제출"].map(
          (label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index + 1)}
              className={`rounded-lg border px-3 py-2 text-sm ${
                step === index + 1
                  ? "border-violet-300 bg-violet-50 text-violet-900"
                  : "border-zinc-200 bg-zinc-50 text-zinc-600"
              }`}
            >
              {index + 1}. {label}
            </button>
          ),
        )}
      </div>
      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5">
        {step === 1 && <WizardStepOne form={form} setForm={setForm} />}
        {step === 2 && <WizardStepTwo form={form} setForm={setForm} />}
        {step === 3 && (
          <WizardStepThree
            form={form}
            setForm={setForm}
            authoringSecret={authoringSecret}
            setAuthoringSecret={setAuthoringSecret}
          />
        )}
        {step === 4 && (
          <WizardStepFour
            form={form}
            estimatedReach={estimatedReach}
            estimatedVerifiedEngagements={estimatedVerifiedEngagements}
            estimate={estimate}
          />
        )}
        {step === 5 && (
          <WizardStepFive
            form={form}
            estimatedReach={estimatedReach}
            estimatedVerifiedEngagements={estimatedVerifiedEngagements}
            estimate={estimate}
            authoringSecret={authoringSecret}
            onSubmit={submitDemo}
            goToStep={setStep}
          />
        )}
      </div>

      {step < 5 && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStep((value) => Math.max(1, value - 1))}
            className="secondary-button"
          >
            이전
          </button>
          <button type="button" onClick={nextStep} className="primary-button">
            다음
          </button>
        </div>
      )}
    </section>
  );
}

function WizardStepOne({
  form,
  setForm,
}: {
  form: WizardForm;
  setForm: (form: WizardForm) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextInput label="광고주명 (read-only demo)" value={form.advertiserName} readOnly />
      <TextInput label="캠페인명" value={form.name} onChange={(name) => setForm({ ...form, name })} />
      <TextInput
        label="광고 제목"
        value={form.adTitle}
        onChange={(adTitle) => setForm({ ...form, adTitle })}
      />
      <label className="text-sm font-medium text-zinc-700">
        카테고리
        <select
          value={form.category}
          onChange={(event) => setForm({ ...form, category: event.target.value })}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
        >
          {STAGE4A_DEMO_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <label className="md:col-span-2 text-sm font-medium text-zinc-700">
        광고 설명
        <textarea
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          className="mt-1 min-h-24 w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
      </label>
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 md:col-span-2">
        광고 소재 선택: 로컬 branded placeholder 사용 · 이미지 업로드/Storage 연동 없음
      </div>
    </div>
  );
}

function WizardStepTwo({
  form,
  setForm,
}: {
  form: WizardForm;
  setForm: (form: WizardForm) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        소비자의 개인 식별 정보는 광고주에게 제공되지 않으며 플랫폼 내부에서 조건만
        매칭합니다. 사용자 이름, 이메일, 전화번호, 사용자 ID 또는 대상자 목록은 표시하지
        않습니다.
      </p>
      <CheckboxGroup
        label="타겟 지역 복수 선택"
        values={STAGE4A_DEMO_REGIONS}
        selected={form.targetRegions}
        onChange={(targetRegions) => setForm({ ...form, targetRegions })}
      />
      <CheckboxGroup
        label="관심 카테고리"
        values={STAGE4A_DEMO_CATEGORIES}
        selected={form.interestCategories}
        onChange={(interestCategories) => setForm({ ...form, interestCategories })}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-zinc-700">
          성별 조건
          <select
            value={form.genderTarget}
            onChange={(event) =>
              setForm({ ...form, genderTarget: event.target.value as WizardForm["genderTarget"] })
            }
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          >
            <option value="all">전체</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
            <option value="undisclosed">응답자 조건 미적용</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="출생연도 시작"
            value={form.birthYearFrom}
            onChange={(birthYearFrom) => setForm({ ...form, birthYearFrom })}
          />
          <NumberInput
            label="출생연도 종료"
            value={form.birthYearTo}
            onChange={(birthYearTo) => setForm({ ...form, birthYearTo })}
          />
        </div>
        <TextInput
          label="노출 시작 시간"
          value={form.startTime}
          onChange={(startTime) => setForm({ ...form, startTime })}
        />
        <TextInput
          label="노출 종료 시간"
          value={form.endTime}
          onChange={(endTime) => setForm({ ...form, endTime })}
        />
      </div>
      <CheckboxGroup
        label="노출 요일"
        values={STAGE4A_DEMO_DAYS}
        selected={form.exposureDays}
        onChange={(exposureDays) => setForm({ ...form, exposureDays })}
      />
      <p className="text-sm text-zinc-600">
        조건은 소비자의 주거지역·주활동지역과 교차 매칭되며, 광고주에게 개인별 소비자
        목록은 제공되지 않습니다.
      </p>
    </div>
  );
}

function WizardStepThree({
  form,
  setForm,
  authoringSecret,
  setAuthoringSecret,
}: {
  form: WizardForm;
  setForm: (form: WizardForm) => void;
  authoringSecret: AdvertiserQuizAuthoringSecret;
  setAuthoringSecret: (value: AdvertiserQuizAuthoringSecret) => void;
}) {
  const landing = form.linkEnabled ? validateLandingUrl(form.landingUrl) : null;

  function setQuizType(quizType: AdQuizType) {
    const switched = switchQuizType(quizType);
    setForm({
      ...form,
      quizType,
      quizOptions:
        quizType === "multiple_choice"
          ? form.quizOptions.length >= 2
            ? form.quizOptions
            : ["", ""]
          : [],
    });
    setAuthoringSecret(switched.authoringSecret);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
        <h3 className="font-semibold text-zinc-900">A. 광고 열람 조건</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <NumberInput
            label="최소 열람 시간 (3~15초)"
            value={form.minViewSeconds}
            onChange={(minViewSeconds) => setForm({ ...form, minViewSeconds })}
          />
          <NumberInput
            label="퀴즈 통과 지급 포인트 (50~500P)"
            value={form.pointPerPass}
            onChange={(pointPerPass) => setForm({ ...form, pointPerPass })}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <h3 className="font-semibold text-zinc-900">B. 광고 메인 콘텐츠</h3>
        <p className="mt-1 text-sm text-zinc-600">
          텍스트, 이미지, 동영상 demo 소재를 선택합니다. 실제 파일 업로드나 Storage 저장은
          없습니다.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {(["text", "image", "video"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setForm({ ...form, creativeType: type })}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                form.creativeType === type
                  ? "border-violet-300 bg-violet-50 text-violet-900"
                  : "border-zinc-200 bg-zinc-50 text-zinc-600"
              }`}
            >
              {type === "text" ? "텍스트" : type === "image" ? "이미지" : "동영상"}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextInput
            label="광고 제목"
            value={form.creativeTitle}
            onChange={(creativeTitle) => setForm({ ...form, creativeTitle })}
          />
          <TextInput
            label="CTA 문구"
            value={form.ctaLabel}
            onChange={(ctaLabel) => setForm({ ...form, ctaLabel })}
          />
        </div>
        <label className="mt-4 block text-sm font-medium text-zinc-700">
          광고 본문 또는 설명
          <textarea
            value={form.creativeBody}
            onChange={(event) => setForm({ ...form, creativeBody: event.target.value })}
            className="mt-1 min-h-28 w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
        {form.creativeType === "image" && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextInput
              label="이미지 URL"
              value={form.imageUrl}
              onChange={(imageUrl) => setForm({ ...form, imageUrl })}
            />
            <TextInput
              label="이미지 대체 텍스트"
              value={form.imageAlt}
              onChange={(imageAlt) => setForm({ ...form, imageAlt })}
            />
            <button
              type="button"
              onClick={() => setForm({ ...form, imageUrl: STAGE4A_DEMO_IMAGE_URL })}
              className="secondary-button"
            >
              Demo 이미지 선택
            </button>
          </div>
        )}
        {form.creativeType === "video" && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextInput
              label="동영상 URL"
              value={form.videoUrl}
              onChange={(videoUrl) => setForm({ ...form, videoUrl })}
            />
            <TextInput
              label="Poster 이미지 URL"
              value={form.videoPosterUrl}
              onChange={(videoPosterUrl) => setForm({ ...form, videoPosterUrl })}
            />
            <TextInput
              label="동영상 설명 또는 자막용 텍스트"
              value={form.videoCaption}
              onChange={(videoCaption) => setForm({ ...form, videoCaption })}
            />
            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  videoUrl: STAGE4A_DEMO_VIDEO_URL,
                  videoPosterUrl: STAGE4A_DEMO_POSTER_URL,
                })
              }
              className="secondary-button"
            >
              Demo 동영상 선택
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <h3 className="font-semibold text-zinc-900">C. 랜딩페이지 연결</h3>
        <label className="mt-3 flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input
            type="checkbox"
            checked={form.linkEnabled}
            onChange={(event) => setForm({ ...form, linkEnabled: event.target.checked })}
          />
          랜딩페이지 링크 활성화
        </label>
        {form.linkEnabled && (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <TextInput
              label="랜딩페이지 URL"
              value={form.landingUrl}
              onChange={(landingUrl) => setForm({ ...form, landingUrl })}
            />
            <Metric label="랜딩 hostname" value={getLandingHostname(form.landingUrl) || "검증 필요"} />
            {landing && !landing.ok && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-2">
                안전하지 않거나 올바르지 않은 URL입니다. https URL만 사용해 주세요.
              </p>
            )}
            <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 md:col-span-2">
              외부 사이트로 이동합니다. 링크 클릭은 퀴즈 통과나 포인트 적립으로 인정되지
              않습니다.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <h3 className="font-semibold text-zinc-900">D. 퀴즈 유형과 문항</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setQuizType("multiple_choice")}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
              form.quizType === "multiple_choice"
                ? "border-violet-300 bg-violet-50 text-violet-900"
                : "border-zinc-200 bg-zinc-50 text-zinc-600"
            }`}
          >
            선택형
          </button>
          <button
            type="button"
            onClick={() => setQuizType("short_answer")}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
              form.quizType === "short_answer"
                ? "border-violet-300 bg-violet-50 text-violet-900"
                : "border-zinc-200 bg-zinc-50 text-zinc-600"
            }`}
          >
            단답형
          </button>
        </div>
        <TextInput
          label="퀴즈 문항"
          value={form.quizQuestion}
          onChange={(quizQuestion) => setForm({ ...form, quizQuestion })}
        />
        {form.quizType === "multiple_choice" && (
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              {form.quizOptions.map((option, index) => (
                <div key={`option-${index}`} className="flex gap-2">
                  <TextInput
                    label={`선택지 ${index + 1}`}
                    value={option}
                    onChange={(next) => {
                      const quizOptions = [...form.quizOptions];
                      quizOptions[index] = next;
                      setForm({ ...form, quizOptions });
                    }}
                  />
                  {form.quizOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const quizOptions = form.quizOptions.filter((_, optionIndex) => optionIndex !== index);
                        setForm({ ...form, quizOptions });
                        setAuthoringSecret({ multipleChoiceSelection: null });
                      }}
                      className="mt-6 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))}
            </div>
            {form.quizOptions.length < 4 && (
              <button
                type="button"
                onClick={() => setForm({ ...form, quizOptions: [...form.quizOptions, ""] })}
                className="secondary-button"
              >
                선택지 추가
              </button>
            )}
            <label className="block text-sm font-medium text-zinc-700">
              작성 중 서버 등록 선택값 (transient form state)
              <select
                value={authoringSecret.multipleChoiceSelection ?? ""}
                onChange={(event) =>
                  setAuthoringSecret({
                    multipleChoiceSelection:
                      event.target.value === "" ? null : Number(event.target.value),
                  })
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              >
                <option value="">정답 선택 필요</option>
                {form.quizOptions.map((option, index) => (
                  <option key={`${option}-${index}`} value={index}>
                    선택지 {index + 1}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {form.quizType === "short_answer" && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextInput
              label="기준 정답 (transient)"
              value={authoringSecret.shortAnswer ?? ""}
              onChange={(shortAnswer) =>
                setAuthoringSecret({
                  shortAnswer,
                  acceptedAnswers: authoringSecret.acceptedAnswers ?? [],
                })
              }
            />
            {(authoringSecret.acceptedAnswers ?? [""]).slice(0, 5).map((answer, index) => (
              <TextInput
                key={`short-answer-${index}`}
                label={`허용 답안 ${index + 1}`}
                value={answer}
                onChange={(next) => {
                  const acceptedAnswers = [...(authoringSecret.acceptedAnswers ?? [])];
                  acceptedAnswers[index] = next;
                  setAuthoringSecret({
                    shortAnswer: authoringSecret.shortAnswer ?? "",
                    acceptedAnswers,
                  });
                }}
              />
            ))}
            {(authoringSecret.acceptedAnswers ?? []).length < 5 && (
              <button
                type="button"
                onClick={() =>
                  setAuthoringSecret({
                    shortAnswer: authoringSecret.shortAnswer ?? "",
                    acceptedAnswers: [...(authoringSecret.acceptedAnswers ?? []), ""],
                  })
                }
                className="secondary-button"
              >
                허용 답안 추가
              </button>
            )}
          </div>
        )}
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          정답은 작성 중 transient form state에서만 존재합니다. 제출 결과에는
          answerRegistered와 acceptedAnswerCount만 남기며 Preview, diagnostics, URL query,
          browser store에 정답 원문을 저장하지 않습니다.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
        <h3 className="font-semibold text-zinc-900">E. 리워드 포인트</h3>
        <NumberInput
          label="퀴즈 통과 지급 포인트 (50~500P)"
          value={form.pointPerPass}
          onChange={(pointPerPass) => setForm({ ...form, pointPerPass })}
        />
      </section>
    </div>
  );
}

function WizardStepFour({
  form,
  estimatedReach,
  estimatedVerifiedEngagements,
  estimate,
}: {
  form: WizardForm;
  estimatedReach: number;
  estimatedVerifiedEngagements: number;
  estimate: ReturnType<typeof calculateStage4ABudgetEstimate>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <NumberInput
          label="Demo 캠페인 예산(P)"
          value={form.demoBudgetPoints}
          onChange={() => undefined}
          readOnly
        />
        <Metric label="지급 포인트(P)" value={formatStage4APoints(form.pointPerPass)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="예상 도달 소비자" value={formatStage4ANumber(estimatedReach)} />
        <Metric
          label="예상 Verified Engagement"
          value={formatStage4ANumber(estimatedVerifiedEngagements)}
        />
        <Metric
          label="최대 보상 가능 인원"
          value={formatStage4ANumber(estimate.maximumRewardedEngagements)}
        />
        <Metric label="예상 리워드 소진" value={formatStage4APoints(estimate.estimatedPointSpend)} />
        <Metric
          label="예상 잔여 예산"
          value={formatStage4APoints(estimate.estimatedRemainingBudget)}
        />
      </div>
      <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
        예상 도달 소비자는 실제 사용자 수가 아닌 deterministic demo estimate입니다. 모든 계산은
        정수 P 단위로 처리합니다.
      </p>
    </div>
  );
}

function WizardStepFive({
  form,
  estimatedReach,
  estimatedVerifiedEngagements,
  estimate,
  authoringSecret,
  onSubmit,
  goToStep,
}: {
  form: WizardForm;
  estimatedReach: number;
  estimatedVerifiedEngagements: number;
  estimate: ReturnType<typeof calculateStage4ABudgetEstimate>;
  authoringSecret: AdvertiserQuizAuthoringSecret;
  onSubmit: () => void;
  goToStep: (step: number) => void;
}) {
  const creative = createPublicCreative({
    type: form.creativeType,
    title: form.creativeTitle,
    body: form.creativeBody,
    imageUrl: form.imageUrl,
    imageAlt: form.imageAlt,
    videoUrl: form.videoUrl,
    videoPosterUrl: form.videoPosterUrl,
    videoCaption: form.videoCaption,
    linkEnabled: form.linkEnabled,
    landingUrl: form.landingUrl,
    ctaLabel: form.ctaLabel,
  });
  const quiz = createPublicQuiz({
    type: form.quizType,
    question: form.quizQuestion,
    options: form.quizOptions,
    authoringSecret,
  });
  const previewCampaign: Stage4ACampaign = {
    ...STAGE4A_DEMO_CAMPAIGNS[2],
    name: form.name,
    advertiserName: form.advertiserName,
    adTitle: form.adTitle,
    description: form.description,
    category: form.category,
    targetRegions: form.targetRegions,
    interestCategories: form.interestCategories,
    genderTarget: form.genderTarget,
    birthYearRange: { from: form.birthYearFrom, to: form.birthYearTo },
    exposureDays: form.exposureDays,
    exposureTime: { start: form.startTime, end: form.endTime },
    creativeLabel: form.creativeType,
    creative,
    minViewSeconds: form.minViewSeconds,
    quizType: quiz.type,
    quizQuestion: form.quizQuestion,
    quizOptions: quiz.type === "multiple_choice" ? quiz.options ?? [] : [],
    quiz,
    answerRegistered: quiz.answerRegistered,
    acceptedAnswerCount: quiz.acceptedAnswerCount,
    pointPerPass: form.pointPerPass,
    demoBudgetPoints: form.demoBudgetPoints,
    estimatedReach,
    estimatedVerifiedEngagements,
    metrics: {
      ...STAGE4A_DEMO_CAMPAIGNS[2].metrics,
      pointPerPass: form.pointPerPass,
      remainingDemoBudget: estimate.estimatedRemainingBudget,
    },
  };

  return (
    <div className="space-y-4">
      <CampaignPreview campaign={previewCampaign} compact />
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="예상 도달" value={formatStage4ANumber(estimatedReach)} />
        <Metric
          label="예상 Verified Engagement"
          value={formatStage4ANumber(estimatedVerifiedEngagements)}
        />
        <Metric label="예상 리워드 소진" value={formatStage4APoints(estimate.estimatedPointSpend)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => goToStep(1)} className="secondary-button">
          기본 정보 수정
        </button>
        <button type="button" onClick={() => goToStep(2)} className="secondary-button">
          타겟 수정
        </button>
        <button type="button" onClick={onSubmit} className="primary-button">
          관리자 검토 제출
        </button>
      </div>
    </div>
  );
}

function creativeTypeLabel(type: AdCreativePublic["type"]) {
  if (type === "text") return "텍스트";
  if (type === "image") return "이미지";
  return "동영상";
}

function quizTypeLabel(type: AdQuizType) {
  return type === "multiple_choice" ? "선택형" : "단답형";
}

function CreativeBlock({ creative }: { creative: AdCreativePublic }) {
  const [clickState, setClickState] = useState({
    ctaClickCount: 0,
    quizPassGranted: false,
    rewardGranted: false,
  });
  return (
    <section className="mt-3 rounded-xl border border-zinc-200 bg-white px-4 py-4">
      <p className="text-xs font-semibold text-violet-700">광고 메인 콘텐츠 · {creativeTypeLabel(creative.type)}</p>
      <h3 className="mt-1 text-lg font-bold text-zinc-900">{creative.title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{creative.body}</p>
      {creative.type === "image" && (
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
          {creative.imageUrl ? (
            <Image
              src={creative.imageUrl}
              alt={creative.imageAlt ?? "광고 이미지"}
              width={640}
              height={360}
              className="h-auto max-h-72 w-full object-contain"
            />
          ) : (
            <p className="px-4 py-6 text-sm text-zinc-500">이미지 로드 실패 상태</p>
          )}
        </div>
      )}
      {creative.type === "video" && (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <video
            src={creative.videoUrl}
            poster={creative.videoPosterUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full rounded-lg"
          >
            {creative.videoCaption}
          </video>
          <p className="mt-2 text-xs text-zinc-600">{creative.videoCaption}</p>
        </div>
      )}
      {creative.linkEnabled && creative.landingUrl && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
          <p>{creative.externalLinkNotice}</p>
          <a
            href={creative.landingUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={() =>
              setClickState((current) =>
                recordLandingClickDemoState(current.ctaClickCount),
              )
            }
            className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white"
          >
            {creative.ctaLabel ?? "자세히 보기"}
          </a>
          <p className="mt-2 text-xs text-blue-900">
            Landing hostname: {creative.landingHostname}. 링크 클릭은 quiz pass 또는 reward 상태를 변경하지 않습니다.
          </p>
          <p className="mt-1 text-xs text-blue-900">
            CTA demo clicks={clickState.ctaClickCount}; quizPassGranted=
            {String(clickState.quizPassGranted)}; rewardGranted={String(clickState.rewardGranted)}
          </p>
        </div>
      )}
    </section>
  );
}

function CampaignDetail({
  campaign,
  storeEvents,
}: {
  campaign: Stage4ACampaign;
  storeEvents: Array<{ id: string; label: string; status: Stage4ACampaignStatus }>;
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">{campaign.name}</h2>
            <p className="mt-1 text-sm text-zinc-600">{campaign.description}</p>
          </div>
          <StatusBadge status={campaign.status} />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="카테고리" value={campaign.category} />
          <Info label="광고 소재 유형" value={creativeTypeLabel(campaign.creative.type)} />
          <Info
            label="랜딩페이지 hostname"
            value={campaign.creative.landingHostname ?? "연결 없음"}
          />
          <Info label="퀴즈 유형" value={quizTypeLabel(campaign.quiz.type)} />
          <Info label="지급 포인트" value={formatStage4APoints(campaign.pointPerPass)} />
          <Info label="Demo 예산" value={formatStage4APoints(campaign.demoBudgetPoints)} />
          <Info label="정답 등록 여부" value={campaign.answerRegistered ? "정답 등록 완료" : "미등록"} />
        </div>
        <div className="mt-4">
          <CreativeBlock creative={campaign.creative} />
        </div>
        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="text-sm font-semibold text-zinc-900">{campaign.quiz.question}</p>
          {campaign.quiz.type === "multiple_choice" ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(campaign.quiz.options ?? []).map((option) => (
                <div key={option} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm">
                  {option}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-600">
              단답형 정답 등록 완료 · 허용 답안 수 {campaign.quiz.acceptedAnswerCount ?? 0}개
            </p>
          )}
        </div>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          정답은 서버 전용 정보이며 정답은 소비자 화면에 표시되지 않습니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/advertiser/campaigns/${campaign.id}/preview`} className="secondary-link">
            Preview 보기
          </Link>
          <Link href={`/advertiser/campaigns/${campaign.id}/performance`} className="secondary-link">
            성과 Dashboard 보기
          </Link>
          <Link href={`/admin/campaign-review/${campaign.id}`} className="secondary-link">
            관리자 검토 화면으로 이동
          </Link>
        </div>
      </div>
      <Timeline events={storeEvents} />
    </section>
  );
}

function CampaignPreview({
  campaign,
  compact = false,
}: {
  campaign: Stage4ACampaign;
  compact?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
      {!compact && <h2 className="text-lg font-semibold text-zinc-900">소비자 화면 Preview</h2>}
      <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-semibold text-violet-900">{campaign.advertiserName}</p>
        <h3 className="mt-1 text-xl font-bold text-zinc-900">{campaign.name}</h3>
        <CreativeBlock creative={campaign.creative} />
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <Info label="광고 소재 유형" value={creativeTypeLabel(campaign.creative.type)} />
          <Info label="카테고리" value={campaign.category} />
          <Info label="지역" value={campaign.targetRegions.join(", ")} />
          <Info label="최소 열람 시간" value={`${campaign.minViewSeconds}초`} />
          <Info label="퀴즈 유형" value={quizTypeLabel(campaign.quiz.type)} />
          <Info label="지급 포인트" value={formatStage4APoints(campaign.pointPerPass)} />
        </dl>
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
          <p className="font-semibold text-zinc-900">{campaign.quiz.question}</p>
          {campaign.quiz.type === "multiple_choice" ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(campaign.quiz.options ?? []).map((option) => (
                <div key={option} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                  {option}
                </div>
              ))}
            </div>
          ) : (
            <input
              readOnly
              placeholder="단답형 답안을 입력합니다"
              className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          )}
          <p className="mt-3 text-sm text-zinc-600">
            정답 등록 완료 · 정답은 소비자 화면에 표시되지 않습니다 · 실제 채점은 서버에서 처리됩니다.
          </p>
        </div>
        <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          소비자의 개인 식별 정보는 광고주에게 제공되지 않습니다.
        </p>
      </div>
      {!compact && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/advertiser/campaigns/${campaign.id}`} className="secondary-link">
            상세로 돌아가기
          </Link>
          <Link href={`/admin/campaign-review/${campaign.id}`} className="primary-link">
            관리자 검토 제출 상태 보기
          </Link>
        </div>
      )}
    </section>
  );
}

function AdminReviewList({
  campaigns,
  onReset,
}: {
  campaigns: Stage4ACampaign[];
  onReset: () => void;
}) {
  const reviewCampaigns = campaigns.filter((campaign) =>
    ["submitted", "under_review", "changes_requested", "approved"].includes(campaign.status),
  );
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-950">
        <h2 className="text-lg font-bold">투자자 데모 · 캠페인 검토</h2>
        <p className="mt-1 font-semibold">Production DB mutation 없음</p>
        <p className="mt-1">모든 action은 브라우저 demo state만 변경합니다.</p>
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={onReset} className="secondary-button">
          Demo Reset
        </button>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {reviewCampaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </section>
  );
}

function AdminReviewDetail({
  campaign,
  events,
  apply,
}: {
  campaign: Stage4ACampaign;
  events: Array<{ id: string; label: string; status: Stage4ACampaignStatus }>;
  apply: (status: Stage4ACampaignStatus, label: string) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-950">
        <h2 className="text-lg font-bold">투자자 데모 · 캠페인 검토</h2>
        <p className="mt-1 font-semibold">Production DB mutation 없음</p>
      </div>
      <CampaignPreview campaign={campaign} compact />
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <h3 className="font-semibold text-zinc-900">검토 요약</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="광고 제목" value={campaign.creative.title} />
          <Info label="소재 유형" value={creativeTypeLabel(campaign.creative.type)} />
          <Info label="랜딩 URL hostname" value={campaign.creative.landingHostname ?? "연결 없음"} />
          <Info label="CTA 문구" value={campaign.creative.ctaLabel ?? "없음"} />
          <Info label="외부 링크 여부" value={campaign.creative.linkEnabled ? "활성" : "비활성"} />
          <Info label="퀴즈 유형" value={quizTypeLabel(campaign.quiz.type)} />
          <Info label="타겟 조건" value={campaign.targetRegions.join(", ")} />
          <Info
            label="노출 시간"
            value={`${campaign.exposureDays.join(", ")} ${campaign.exposureTime.start}-${campaign.exposureTime.end}`}
          />
          <Info label="최소 열람 시간" value={`${campaign.minViewSeconds}초`} />
          <Info label="정답 등록 여부" value={campaign.answerRegistered ? "정답 등록 완료" : "미등록"} />
          <Info
            label="허용 답안 수"
            value={campaign.quiz.type === "short_answer" ? String(campaign.quiz.acceptedAnswerCount ?? 0) : "선택형"}
          />
          <Info label="지급 포인트" value={formatStage4APoints(campaign.pointPerPass)} />
          <Info label="Demo 예산" value={formatStage4APoints(campaign.demoBudgetPoints)} />
          <Info label="예상 도달" value={formatStage4ANumber(campaign.estimatedReach)} />
          <Info
            label="예상 리워드 소진"
            value={formatStage4APoints(
              calculateStage4ABudgetEstimate({
                demoBudgetPoints: campaign.demoBudgetPoints,
                pointPerPass: campaign.pointPerPass,
                estimatedVerifiedEngagements: campaign.estimatedVerifiedEngagements,
              }).estimatedPointSpend,
            )}
          />
        </div>
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          개인정보 비노출 확인: 광고주에게 사용자 이름, 이메일, 전화번호, 사용자 ID, 대상자
          목록을 제공하지 않습니다.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <h3 className="font-semibold text-zinc-900">검토 checklist</h3>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {[
            "광고 문구가 명확함",
            "허위·과장 표현이 없는 demo 소재임",
            "타겟 조건이 설정됨",
            "퀴즈 문항이 광고 본문과 연결됨",
            "정답 서버 등록 상태 확인",
            "지급 포인트가 50~500P 범위임",
            "실제 결제가 아닌 sandbox임",
          ].map((item) => (
            <li key={item} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => apply("under_review", "관리자 검토 시작")} className="primary-button">
            검토 시작
          </button>
          <button type="button" onClick={() => apply("changes_requested", "수정 요청")} className="secondary-button">
            수정 요청
          </button>
          <button type="button" onClick={() => apply("approved", "관리자 승인")} className="primary-button">
            승인
          </button>
          <button type="button" onClick={() => apply("rejected", "관리자 반려")} className="secondary-button">
            반려
          </button>
          <button type="button" onClick={() => apply("active", "승인 후 Demo 활성화")} className="primary-button">
            승인 후 Demo 활성화
          </button>
        </div>
      </div>
      <Timeline events={events} />
    </section>
  );
}

function PerformanceDashboard({ campaign }: { campaign: Stage4ACampaign }) {
  const passRate = formatStage4APercent(campaign.metrics.quizPasses, campaign.metrics.quizAttempts);
  const costPerVerified =
    campaign.metrics.quizPasses > 0
      ? Math.floor(campaign.metrics.demoPointSpend / campaign.metrics.quizPasses)
      : 0;
  const budgetPercent = Math.min(
    100,
    Math.floor((campaign.metrics.demoPointSpend / campaign.demoBudgetPoints) * 100),
  );
  const dailyViews = [82, 96, 104, 118, 137, 148, 135];
  const dailyPasses = [61, 73, 82, 94, 116, 127, 119];

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <h2 className="text-lg font-semibold text-zinc-900">Demo Performance Data</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Verified Views, Quiz Pass Rate, Demo Point Spend, Cost per Verified Engagement를
          개인 식별 정보 없이 집계합니다.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Matched Consumers" value={formatStage4ANumber(campaign.metrics.matchedConsumers)} />
        <Metric label="Ad Opens" value={formatStage4ANumber(campaign.metrics.adOpens)} />
        <Metric label="Verified Views" value={formatStage4ANumber(campaign.metrics.verifiedViews)} />
        <Metric label="Quiz Attempts" value={formatStage4ANumber(campaign.metrics.quizAttempts)} />
        <Metric label="Quiz Passes" value={formatStage4ANumber(campaign.metrics.quizPasses)} />
        <Metric label="Quiz Pass Rate" value={passRate} />
        <Metric label="Demo Point Spend" value={formatStage4APoints(campaign.metrics.demoPointSpend)} />
        <Metric label="Cost per Verified Engagement" value={formatStage4APoints(costPerVerified)} />
        <Metric
          label="Remaining Demo Budget"
          value={formatStage4APoints(campaign.metrics.remainingDemoBudget)}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarPanel title="전환 Funnel" rows={[
          ["Matched Consumers", campaign.metrics.matchedConsumers],
          ["Ad Opens", campaign.metrics.adOpens],
          ["Verified Views", campaign.metrics.verifiedViews],
          ["Quiz Attempts", campaign.metrics.quizAttempts],
          ["Quiz Passes", campaign.metrics.quizPasses],
        ]} />
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
          <h3 className="font-semibold text-zinc-900">예산 소진 Progress</h3>
          <div className="mt-3 h-4 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full bg-violet-600" style={{ width: `${budgetPercent}%` }} />
          </div>
          <p className="mt-2 text-sm text-zinc-600">
            {budgetPercent}% used · {formatStage4APoints(campaign.metrics.remainingDemoBudget)} remaining
          </p>
        </div>
        <SparklinePanel title="일자별 Verified Views 추이" values={dailyViews} />
        <SparklinePanel title="Quiz Pass 추이" values={dailyPasses} />
        <BarPanel title="타겟 지역별 집계" rows={campaign.targetRegions.map((region, index) => [region, 360 - index * 74])} />
        <BarPanel title="관심 카테고리별 집계" rows={campaign.interestCategories.map((category, index) => [category, 520 - index * 110])} />
      </div>
      <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        광고주에게 개인별 소비자 목록은 제공되지 않으며, 모든 성과는 집계 demo data입니다.
        Point Spend 검증: 672 × 300P = 201,600P.
      </p>
    </section>
  );
}

function Timeline({
  events,
}: {
  events: Array<{ id: string; label: string; status: Stage4ACampaignStatus }>;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
      <h3 className="font-semibold text-zinc-900">상태 Timeline</h3>
      <ol className="mt-3 space-y-2 text-sm">
        {timelineStatuses.map((status) => {
          const event = events.find((item) => item.status === status);
          return (
            <li
              key={status}
              className={`rounded-lg border px-3 py-2 ${
                event ? "border-violet-200 bg-violet-50" : "border-zinc-200 bg-zinc-50"
              }`}
            >
              {STAGE4A_STATUS_LABELS[status]} · {event?.label ?? "대기"}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ResetModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-900">Demo Reset 확인</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Stage 4-A 전용 browser demo store만 초기화합니다. 인증 세션, Stage 3-Q demo state,
          Supabase 데이터는 삭제하지 않습니다.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="secondary-button">
            취소
          </button>
          <button type="button" onClick={onConfirm} className="primary-button">
            재설정
          </button>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-zinc-900">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2">
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-zinc-900">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: Stage4ACampaignStatus }) {
  return (
    <span className="w-fit rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
      {STAGE4A_STATUS_LABELS[status]}
    </span>
  );
}

function TextInput({
  label,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <input
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
        className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 read-only:bg-zinc-100"
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <input
        type="number"
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 read-only:bg-zinc-100"
      />
    </label>
  );
}

function CheckboxGroup<T extends string>({
  label,
  values,
  selected,
  onChange,
}: {
  label: string;
  values: readonly T[];
  selected: readonly string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <fieldset className="rounded-xl border border-zinc-200 px-4 py-3">
      <legend className="px-1 text-sm font-semibold text-zinc-900">{label}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((value) => (
          <label key={value} className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={(event) => {
                if (event.target.checked) onChange([...selected, value]);
                else onChange(selected.filter((item) => item !== value));
              }}
            />
            {value}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function BarPanel({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  const max = Math.max(...rows.map((row) => row[1]), 1);
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
      <h3 className="font-semibold text-zinc-900">{title}</h3>
      <div className="mt-3 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <div className="flex justify-between gap-3 text-sm">
              <span>{label}</span>
              <span className="font-semibold">{formatStage4ANumber(value)}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full bg-blue-600" style={{ width: `${Math.floor((value / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SparklinePanel({ title, values }: { title: string; values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
      <h3 className="font-semibold text-zinc-900">{title}</h3>
      <div className="mt-4 flex h-36 items-end gap-2">
        {values.map((value, index) => (
          <div key={`${title}-${index}`} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t bg-violet-600"
              style={{ height: `${Math.max(8, Math.floor((value / max) * 120))}px` }}
              aria-label={`${index + 1}일차 ${value}`}
            />
            <span className="text-xs text-zinc-500">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
