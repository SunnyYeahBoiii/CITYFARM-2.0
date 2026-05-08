export type QrScanFailureReason = "missing-code" | "activation-failed";

export type QrScanFailureCopy = {
  eyebrow: string;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
};

const DEFAULT_QR_ACTIVATION_ERROR =
  "Không thể kích hoạt bộ kit từ QR này. Hãy thử quét lại hoặc nhập mã thủ công trong My Garden.";

export function getQrScanFailureCopy(
  reason: QrScanFailureReason,
  detail?: string | null,
): QrScanFailureCopy {
  return {
    eyebrow: "Kit activation",
    title: "Quét thất bại",
    description:
      reason === "missing-code"
        ? "QR này không có mã kích hoạt hợp lệ. Hãy quét lại QR trên bộ kit hoặc nhập mã thủ công trong My Garden."
        : detail || DEFAULT_QR_ACTIVATION_ERROR,
    actionHref: "/garden",
    actionLabel: "Về My Garden",
  };
}

export function getQrActivationErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data
  ) {
    const message = error.response.data.message;
    if (Array.isArray(message)) return String(message[0] ?? DEFAULT_QR_ACTIVATION_ERROR);
    if (typeof message === "string") return message;
  }

  return DEFAULT_QR_ACTIVATION_ERROR;
}
