import type { Stage3CResultCode } from "./stage3c-types";

export type Stage3CUxMapping = {
  message: string;
  canRetry: boolean;
  submitDisabled: boolean;
  showRewardAmount: boolean;
};

export function mapStage3CResultToUx(
  resultCode: Stage3CResultCode,
  rewardAmount: number | null,
  isProductionBlocked: boolean,
): Stage3CUxMapping {
  if (isProductionBlocked) {
    return {
      message:
        "현재 운영 환경에서는 실제 포인트 적립이 아직 열려 있지 않습니다. 광고와 퀴즈 UI는 확인 가능하지만, 실제 포인트 적립은 운영 승인 후 활성화됩니다.",
      canRetry: false,
      submitDisabled: true,
      showRewardAmount: false,
    };
  }

  switch (resultCode) {
    case "STAGE3B_REWARDED":
      return {
        message:
          rewardAmount != null
            ? `정답입니다. 포인트가 적립되었습니다. (+${rewardAmount}P)`
            : "정답입니다. 포인트가 적립되었습니다.",
        canRetry: false,
        submitDisabled: true,
        showRewardAmount: rewardAmount != null,
      };
    case "STAGE3B_WRONG_RETRY_ALLOWED":
      return {
        message: "오답입니다. 한 번 더 도전할 수 있습니다.",
        canRetry: true,
        submitDisabled: false,
        showRewardAmount: false,
      };
    case "STAGE3B_WRONG_FINAL_NO_REWARD":
      return {
        message:
          "오답입니다. 이 광고의 포인트 적립 기회가 종료되었습니다.",
        canRetry: false,
        submitDisabled: true,
        showRewardAmount: false,
      };
    case "STAGE3B_DUPLICATE_SUBMISSION_BLOCKED":
      return {
        message: "이미 처리된 제출입니다. 추가 적립은 없습니다.",
        canRetry: false,
        submitDisabled: true,
        showRewardAmount: false,
      };
    case "STAGE3B_IDEMPOTENT_DUPLICATE":
      return {
        message:
          rewardAmount != null
            ? "방금 제출한 결과를 다시 확인했습니다. 이미 적립된 내역입니다."
            : "방금 제출한 결과를 다시 확인했습니다. 추가 적립은 없습니다.",
        canRetry: false,
        submitDisabled: true,
        showRewardAmount: false,
      };
    case "STAGE3B_MIN_VIEW_SECONDS_NOT_MET":
      return {
        message:
          "아직 최소 열람 시간이 충족되지 않았습니다. 광고 내용을 조금 더 확인해 주세요.",
        canRetry: true,
        submitDisabled: true,
        showRewardAmount: false,
      };
    case "STAGE3B_CAMPAIGN_BUDGET_INSUFFICIENT":
      return {
        message:
          "이 캠페인의 리워드 예산이 소진되어 포인트를 적립할 수 없습니다.",
        canRetry: false,
        submitDisabled: true,
        showRewardAmount: false,
      };
    case "STAGE3B_CONSUMER_ROLE_REQUIRED":
    case "STAGE3C_CONSUMER_ROLE_REQUIRED":
      return {
        message: "소비자 계정으로만 퀴즈에 참여할 수 있습니다.",
        canRetry: false,
        submitDisabled: true,
        showRewardAmount: false,
      };
    case "STAGE3B_PRODUCTION_BLOCKED":
    case "STAGE3C_PRODUCTION_REWARD_BLOCKED":
      return {
        message:
          "현재 운영 환경에서는 실제 포인트 적립이 아직 열려 있지 않습니다.",
        canRetry: false,
        submitDisabled: true,
        showRewardAmount: false,
      };
    case "STAGE3C_AUTH_REQUIRED":
      return {
        message: "퀴즈 제출을 위해 로그인이 필요합니다.",
        canRetry: false,
        submitDisabled: true,
        showRewardAmount: false,
      };
    case "STAGE3C_UNCONTROLLED_CAMPAIGN":
      return {
        message:
          "이 캠페인은 아직 controlled integration 대상이 아닙니다. dev verify fixture 캠페인에서 테스트해 주세요.",
        canRetry: false,
        submitDisabled: true,
        showRewardAmount: false,
      };
    case "STAGE3C_AD_VIEW_NOT_FOUND":
      return {
        message: "광고 열람을 시작한 뒤 퀴즈를 제출해 주세요.",
        canRetry: true,
        submitDisabled: false,
        showRewardAmount: false,
      };
    default:
      return {
        message:
          "퀴즈 제출 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        canRetry: true,
        submitDisabled: false,
        showRewardAmount: false,
      };
  }
}
