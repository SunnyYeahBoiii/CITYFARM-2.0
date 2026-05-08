import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getQrActivationErrorMessage,
  getQrScanFailureCopy,
} from "./qr-activation.ts";

describe("QR activation failure copy", () => {
  it("shows scan failed copy when the QR link has no code", () => {
    assert.deepEqual(getQrScanFailureCopy("missing-code"), {
      eyebrow: "Kit activation",
      title: "Quét thất bại",
      description:
        "QR này không có mã kích hoạt hợp lệ. Hãy quét lại QR trên bộ kit hoặc nhập mã thủ công trong My Garden.",
      actionHref: "/garden",
      actionLabel: "Về My Garden",
    });
  });

  it("keeps the backend message when activation fails", () => {
    const error = {
      response: {
        data: {
          message: "This code has been used",
        },
      },
    };

    assert.equal(getQrActivationErrorMessage(error), "This code has been used");
  });

  it("uses the first backend message when response contains a message list", () => {
    const error = {
      response: {
        data: {
          message: ["Activation code has expired", "Try another code"],
        },
      },
    };

    assert.equal(getQrActivationErrorMessage(error), "Activation code has expired");
  });

  it("falls back to scan failed copy for unknown errors", () => {
    assert.equal(
      getQrActivationErrorMessage(new Error("network")),
      "Không thể kích hoạt bộ kit từ QR này. Hãy thử quét lại hoặc nhập mã thủ công trong My Garden.",
    );
  });
});
