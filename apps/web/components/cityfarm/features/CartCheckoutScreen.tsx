"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useCart } from "../../../lib/useCart";
import { createOrderFromCart } from "../../../lib/api/order.api";
import styles from "../cityfarm.module.css";
import { ArrowLeftIcon, CheckIcon } from "../shared/icons";

const PHONE_REGEX = /^(0|\+84)[0-9]{9,10}$/;

interface ShippingForm {
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  deliveryDistrict?: string;
  deliveryWard?: string;
  customerNote: string;
}

interface ValidationErrors {
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress?: string;
}

const EMPTY_SHIPPING: ShippingForm = {
  recipientName: "",
  recipientPhone: "",
  deliveryAddress: "",
  deliveryDistrict: "",
  deliveryWard: "",
  customerNote: "",
};

function CartCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFromCart = searchParams.get("from") === "cart";

  const { data: cart, isLoading: cartLoading } = useCart();
  const [step, setStep] = useState<"shipping" | "confirm" | "success">("shipping");
  const [shipping, setShipping] = useState<ShippingForm>(EMPTY_SHIPPING);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{
    orderCode: string;
    activationCodes?: string[];
    totalAmount: number;
  } | null>(null);

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString("vi-VN")}`;
  };

  const validateShipping = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!shipping.recipientName.trim()) {
      newErrors.recipientName = "Vui lòng nhập tên người nhận";
    }

    if (!shipping.recipientPhone.trim()) {
      newErrors.recipientPhone = "Vui lòng nhập số điện thoại";
    } else if (!PHONE_REGEX.test(shipping.recipientPhone.trim())) {
      newErrors.recipientPhone = "SĐT không đúng định dạng Việt Nam (VD: 0912345678)";
    }

    if (!shipping.deliveryAddress.trim()) {
      newErrors.deliveryAddress = "Vui lòng nhập địa chỉ giao hàng";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateShipping = (field: keyof ShippingForm, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleProceedToConfirm = () => {
    if (validateShipping()) {
      setStep("confirm");
    }
  };

  const handleOrder = async () => {
    if (!cart || cart.items.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createOrderFromCart({
        recipientName: shipping.recipientName.trim(),
        recipientPhone: shipping.recipientPhone.trim(),
        deliveryAddress: shipping.deliveryAddress.trim(),
        deliveryDistrict: shipping.deliveryDistrict?.trim() || undefined,
        deliveryWard: shipping.deliveryWard?.trim() || undefined,
        customerNote: shipping.customerNote.trim() || undefined,
      });

      setOrderResult({
        orderCode: result.orderCode,
        activationCodes: result.activationCodes,
        totalAmount: result.totalAmount,
      });
      setStep("success");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.";
      setSubmitError(message ?? "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!orderResult) return;
    const textToCopy = orderResult.activationCodes?.[0] || orderResult.orderCode;

    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      // Ignore clipboard failures
    }
  };

  // Redirect to cart if not from cart or cart is empty
  if (!isFromCart) {
    router.push("/order");
    return null;
  }

  if (cartLoading) {
    return (
      <div className={styles.screen}>
        <div className={styles.screenHeader}>
          <button className={styles.backButton} onClick={() => router.back()}>
            <ArrowLeftIcon />
          </button>
          <h1 className={styles.screenHeaderTitle}>Checkout</h1>
          <div style={{ width: 36 }} />
        </div>
        <div className={styles.screenPadded}>
          <div className={styles.card}>
            <p className={styles.metaText}>Loading cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className={styles.screen}>
        <div className={styles.screenHeader}>
          <button className={styles.backButton} onClick={() => router.push("/cart")}>
            <ArrowLeftIcon />
          </button>
          <h1 className={styles.screenHeaderTitle}>Checkout</h1>
          <div style={{ width: 36 }} />
        </div>
        <div className={styles.screenPadded}>
          <div className={styles.successStage}>
            <p className={styles.metaText}>Your cart is empty. Add items before checkout.</p>
            <Link href="/marketplace" className={styles.buttonPrimary}>
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.orderPage}>
      {step === "shipping" ? (
        <div className={styles.summaryCard}>
          <div className={styles.screenHeaderTitle}>Thông tin giao hàng</div>

          {/* Cart Summary */}
          <div style={{ marginTop: "1rem", padding: "0.85rem", background: "#f8faf7", borderRadius: "0.75rem", border: "1px solid rgba(31,41,22,0.08)" }}>
            <div className={styles.summaryLabel}>Cart Summary ({cart.itemCount} items)</div>
            <div style={{ marginTop: "0.75rem" }}>
              {cart.items.slice(0, 3).map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem", marginBottom: "0.5rem" }}>
                  <span style={{ color: "#24301c" }}>{item.product.name} ({item.quantity})</span>
                  <span style={{ fontWeight: "bold" }}>{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
              {cart.items.length > 3 && (
                <div style={{ fontSize: "0.78rem", color: "#677562" }}>
                  + {cart.items.length - 3} more items
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(31,41,22,0.08)" }}>
              <span>Total</span>
              <span style={{ color: "#567a3d" }}>{formatPrice(cart.subtotal)}</span>
            </div>
          </div>

          {/* Shipping Form */}
          <div className={styles.section} style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label className={styles.summaryLabel} style={{ marginBottom: "0.35rem", display: "block" }}>
                Tên người nhận <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={shipping.recipientName}
                onChange={(e) => updateShipping("recipientName", e.target.value)}
                placeholder="Nguyễn Văn A"
              />
              {errors.recipientName && (
                <p style={{ marginTop: "0.3rem", fontSize: "0.78rem", color: "#e53e3e" }}>{errors.recipientName}</p>
              )}
            </div>

            <div>
              <label className={styles.summaryLabel} style={{ marginBottom: "0.35rem", display: "block" }}>
                Số điện thoại <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <input
                type="tel"
                className={styles.input}
                value={shipping.recipientPhone}
                onChange={(e) => updateShipping("recipientPhone", e.target.value)}
                placeholder="0912345678"
              />
              {errors.recipientPhone && (
                <p style={{ marginTop: "0.3rem", fontSize: "0.78rem", color: "#e53e3e" }}>{errors.recipientPhone}</p>
              )}
            </div>

            <div>
              <label className={styles.summaryLabel} style={{ marginBottom: "0.35rem", display: "block" }}>
                Địa chỉ giao hàng <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <textarea
                className={styles.textarea}
                style={{ minHeight: "5rem" }}
                value={shipping.deliveryAddress}
                onChange={(e) => updateShipping("deliveryAddress", e.target.value)}
                placeholder="Số nhà, đường, phường/xã, quận/huyện"
              />
              {errors.deliveryAddress && (
                <p style={{ marginTop: "0.3rem", fontSize: "0.78rem", color: "#e53e3e" }}>{errors.deliveryAddress}</p>
              )}
            </div>

            <div>
              <label className={styles.summaryLabel} style={{ marginBottom: "0.35rem", display: "block" }}>
                Ghi chú
              </label>
              <input
                type="text"
                className={styles.input}
                value={shipping.customerNote}
                onChange={(e) => updateShipping("customerNote", e.target.value)}
                placeholder="Tùy chọn: ghi chú cho đơn hàng"
              />
            </div>
          </div>

          <div className={styles.section} style={{ display: "grid", gap: "0.75rem" }}>
            <button type="button" className={styles.buttonPrimary} onClick={handleProceedToConfirm}>
              Tiếp tục
            </button>
            <button type="button" className={styles.buttonOutline} onClick={() => router.push("/cart")}>
              <ArrowLeftIcon />
              Quay lại giỏ hàng
            </button>
          </div>
        </div>
      ) : null}

      {step === "confirm" ? (
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Order Summary</div>

          {/* All Items */}
          <div style={{ marginTop: "1rem" }}>
            {cart.items.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div className={styles.summaryThumb} style={{ width: "3rem", height: "3rem", borderRadius: "0.75rem" }}>
                  {item.product.image ? (
                    <img src={item.product.image} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                      {item.product.type === "KIT" ? "📦" : item.product.type === "SEED" ? "🌱" : "🪴"}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div className={styles.plantName} style={{ fontSize: "0.92rem" }}>{item.product.name}</div>
                  <div className={styles.captionText}>{item.quantity} x {formatPrice(item.unitPrice)}</div>
                </div>
                <div style={{ fontWeight: "bold", color: "#567a3d" }}>{formatPrice(item.totalPrice)}</div>
              </div>
            ))}
          </div>

          {/* Shipping Info */}
          <div
            style={{
              marginTop: "1rem",
              padding: "0.85rem",
              borderRadius: "0.75rem",
              background: "#f8faf7",
              border: "1px solid rgba(31,41,22,0.08)",
            }}
          >
            <div className={styles.summaryLabel} style={{ marginBottom: "0.5rem" }}>Thông tin giao hàng</div>
            <div style={{ fontSize: "0.85rem", lineHeight: "1.7", color: "#24301c" }}>
              <div>
                <strong>Người nhận:</strong> {shipping.recipientName}
              </div>
              <div>
                <strong>SĐT:</strong> {shipping.recipientPhone}
              </div>
              <div>
                <strong>Địa chỉ:</strong> {shipping.deliveryAddress}
              </div>
              {shipping.customerNote && (
                <div>
                  <strong>Ghi chú:</strong> {shipping.customerNote}
                </div>
              )}
            </div>
          </div>

          {/* Total */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "1.1rem",
              fontWeight: "bold",
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: "1px solid rgba(31,41,22,0.08)",
              color: "#24301c",
            }}
          >
            <span>Total ({cart.itemCount} items)</span>
            <span style={{ color: "#567a3d" }}>{formatPrice(cart.subtotal)}</span>
          </div>

          {submitError && (
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.75rem",
                borderRadius: "0.75rem",
                background: "#fff5f5",
                border: "1px solid #fed7d7",
                color: "#c53030",
                fontSize: "0.85rem",
              }}
            >
              {submitError}
            </div>
          )}

          <div className={styles.section} style={{ display: "grid", gap: "0.75rem" }}>
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={handleOrder}
              disabled={isSubmitting}
              style={{ opacity: isSubmitting ? 0.6 : 1 }}
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận & Đặt hàng"}
            </button>
            <button type="button" className={styles.buttonOutline} onClick={() => setStep("shipping")}>
              <ArrowLeftIcon />
              Chỉnh sửa thông tin
            </button>
          </div>
        </div>
      ) : null}

      {step === "success" && orderResult ? (
        <div className={styles.successStage}>
          <div className={styles.successIcon}>
            <CheckIcon />
          </div>
          <div className={styles.screenHeaderTitle}>Đặt hàng thành công!</div>
          <div className={styles.sectionSubtitle} style={{ maxWidth: "20rem", textAlign: "center" }}>
            Đơn hàng của bạn đã được ghi nhận. {(orderResult.activationCodes?.length ?? 0) > 0 ? "Sử dụng mã dưới đây để kích hoạt khu vườn của bạn." : "Bạn có thể theo dõi tiến độ đơn hàng trong phần lịch sử."}
          </div>

          {(orderResult.activationCodes?.length ?? 0) > 0 ? (
            <div className={styles.codeCard}>
              <div className={styles.summaryLabel} style={{ color: "rgba(255,255,255,0.56)" }}>
                Mã kích hoạt
              </div>
              <div className={styles.codeValue}>{orderResult.activationCodes?.[0] ?? ""}</div>
              {(orderResult.activationCodes?.length ?? 0) > 1 && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "rgba(255,255,255,0.6)" }}>
                  +{(orderResult.activationCodes?.length ?? 0) - 1} more activation codes
                </div>
              )}
              <div className={styles.metaText} style={{ color: "rgba(255,255,255,0.4)", marginTop: "0.5rem" }}>
                Order: {orderResult.orderCode}
              </div>
            </div>
          ) : (
            <div className={styles.codeCard}>
              <div className={styles.summaryLabel} style={{ color: "rgba(255,255,255,0.56)" }}>
                Mã đơn hàng
              </div>
              <div className={styles.codeValue}>{orderResult.orderCode}</div>
            </div>
          )}

          <div className={styles.section} style={{ display: "grid", gap: "0.75rem", width: "100%", maxWidth: "17rem" }}>
            <button type="button" className={styles.buttonOutline} onClick={handleCopy}>
              Copy {(orderResult.activationCodes?.length ?? 0) > 0 ? "Mã kích hoạt" : "Mã đơn hàng"}
            </button>
            <Link href="/account/history" className={styles.buttonOutline}>
              Xem lịch sử đơn hàng
            </Link>
            <Link href="/garden" className={styles.buttonPrimary}>
              Đến khu vườn của tôi
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CartCheckoutScreen() {
  return (
    <Suspense fallback={
      <div className={styles.screen}>
        <div className={styles.screenHeader}>
          <div style={{ width: 36 }} />
          <h1 className={styles.screenHeaderTitle}>Checkout</h1>
          <div style={{ width: 36 }} />
        </div>
        <div className={styles.screenPadded}>
          <div className={styles.card}>
            <p className={styles.metaText}>Loading...</p>
          </div>
        </div>
      </div>
    }>
      <CartCheckoutContent />
    </Suspense>
  );
}