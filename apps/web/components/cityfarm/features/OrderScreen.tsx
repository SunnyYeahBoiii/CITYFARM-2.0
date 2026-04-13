"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createOrder, type CreateOrderPayload } from "../../../lib/api/orders.api";
import { dirtOptions, kits, potOptions, seeds, type Kit } from "../../../lib/cityfarm";
import styles from "../cityfarm.module.css";
import { ArrowLeftIcon, BagIcon, CheckIcon, DropletIcon, RecycleIcon, SproutIcon } from "../shared/icons";
import { CityImage, OrderTab } from "../shared/ui";

type ProductType = "kit" | "seed" | "dirt" | "pot";
type OrderStep = "select" | "shipping" | "confirm" | "success";
type ShopItem = Kit | (typeof seeds)[number] | (typeof dirtOptions)[number] | (typeof potOptions)[number];

const PHONE_REGEX = /^(0|\+84)[0-9]{9,10}$/;

function getSelectedProduct({
  productType,
  selectedKit,
  selectedSeed,
  selectedDirt,
  selectedPot,
}: {
  productType: ProductType;
  selectedKit: Kit | null;
  selectedSeed: (typeof seeds)[number] | null;
  selectedDirt: (typeof dirtOptions)[number] | null;
  selectedPot: (typeof potOptions)[number] | null;
}) {
  if (productType === "kit") {
    return selectedKit;
  }

  if (productType === "seed") {
    return selectedSeed;
  }

  if (productType === "dirt") {
    return selectedDirt;
  }

  return selectedPot;
}

function hasImagePreview(product: ShopItem): product is Kit {
  return "image" in product;
}

function mapProductTypeToApi(productType: ProductType): CreateOrderPayload["productType"] {
  const map: Record<ProductType, CreateOrderPayload["productType"]> = {
    kit: "KIT",
    seed: "SEED",
    dirt: "SOIL",
    pot: "POT",
  };
  return map[productType];
}

interface ShippingForm {
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
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
  customerNote: "",
};

export function OrderScreen({ initialSeed }: { initialSeed?: string | null }) {
  const [productType, setProductType] = useState<ProductType>("kit");
  const [step, setStep] = useState<OrderStep>("select");
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [selectedSeed, setSelectedSeed] = useState<(typeof seeds)[number] | null>(null);
  const [selectedDirt, setSelectedDirt] = useState<(typeof dirtOptions)[number] | null>(null);
  const [selectedPot, setSelectedPot] = useState<(typeof potOptions)[number] | null>(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [shipping, setShipping] = useState<ShippingForm>(EMPTY_SHIPPING);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialSeed) {
      return;
    }

    const matchedSeed =
      seeds.find((seed) => seed.id === initialSeed.toUpperCase()) ??
      seeds.find((seed) => seed.name.toLowerCase().includes(initialSeed.toLowerCase())) ??
      null;

    if (matchedSeed) {
      setSelectedSeed(matchedSeed);
      setProductType("seed");
      setStep("shipping");
    }
  }, [initialSeed]);

  const selectedProduct = getSelectedProduct({
    productType,
    selectedKit,
    selectedSeed,
    selectedDirt,
    selectedPot,
  });

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

  const handleProceedToShipping = () => {
    if (!selectedProduct) return;
    setStep("shipping");
  };

  const handleProceedToConfirm = () => {
    if (validateShipping()) {
      setStep("confirm");
    }
  };

  const handleOrder = async () => {
    if (!selectedProduct) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createOrder({
        productType: mapProductTypeToApi(productType),
        productId: selectedProduct.id,
        quantity: 1,
        recipientName: shipping.recipientName.trim(),
        recipientPhone: shipping.recipientPhone.trim(),
        deliveryAddress: shipping.deliveryAddress.trim(),
        deliveryDistrict: shipping.customerNote ? undefined : undefined,
        customerNote: shipping.customerNote.trim() || undefined,
      });

      setGeneratedCode(result.orderCode);
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
    if (!generatedCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedCode);
    } catch {
      // Ignore clipboard failures in non-secure contexts.
    }
  };

  const updateShipping = (field: keyof ShippingForm, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className={styles.orderPage}>
      {step === "select" ? (
        <>
          <div className={styles.orderTabs}>
            <OrderTab label="Kits" icon={<BagIcon />} active={productType === "kit"} onClick={() => setProductType("kit")} />
            <OrderTab label="Seeds" icon={<SproutIcon />} active={productType === "seed"} onClick={() => setProductType("seed")} />
            <OrderTab label="Soil" icon={<DropletIcon />} active={productType === "dirt"} onClick={() => setProductType("dirt")} />
            <OrderTab label="Pots" icon={<RecycleIcon />} active={productType === "pot"} onClick={() => setProductType("pot")} />
          </div>

          <div className={styles.section}>
            {productType === "kit" ? (
              <div className={styles.listStack}>
                {kits.map((kit) => (
                  <button
                    key={kit.id}
                    type="button"
                    className={styles.plantCard}
                    onClick={() => {
                      setSelectedKit(kit);
                      setStep("shipping");
                    }}
                  >
                    <div className={styles.plantCardInner}>
                      <div className={styles.summaryThumb}>
                        <CityImage src={kit.image} alt={kit.name} sizes="72px" className="h-full w-full" fit="contain" />
                      </div>
                      <div className={styles.plantBody}>
                        <div className={styles.plantTopRow}>
                          <div>
                            <div className={styles.plantName}>{kit.name}</div>
                            <div className={styles.metaText}>{kit.components.slice(0, 3).join(" • ")}</div>
                          </div>
                          <div className={styles.matchPill}>{kit.price}</div>
                        </div>
                        <div className={styles.sectionAction} style={{ marginTop: "0.7rem", textAlign: "left" }}>
                          Select
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {productType === "seed" ? (
              <div className={styles.gridTwo}>
                {seeds.map((seed) => (
                  <button
                    key={seed.id}
                    type="button"
                    className={styles.selectorCard}
                    onClick={() => {
                      setSelectedSeed(seed);
                      setStep("shipping");
                    }}
                  >
                    <div className={styles.selectorBody} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "2.5rem" }}>{seed.icon}</div>
                      <div className={styles.plantName} style={{ marginTop: "0.6rem" }}>
                        {seed.name}
                      </div>
                      <div className={styles.matchPill} style={{ margin: "0.75rem auto 0", width: "fit-content" }}>
                        {seed.price}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {productType === "dirt" ? (
              <div className={styles.listStack}>
                {dirtOptions.map((dirt) => (
                  <button
                    key={dirt.id}
                    type="button"
                    className={styles.card}
                    style={{ textAlign: "left" }}
                    onClick={() => {
                      setSelectedDirt(dirt);
                      setStep("shipping");
                    }}
                  >
                    <div className={styles.plantTopRow}>
                      <div>
                        <div className={styles.plantName}>{dirt.name}</div>
                        <div className={styles.metaText}>{dirt.quantity}</div>
                      </div>
                      <div className={styles.matchPill}>{dirt.price}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {productType === "pot" ? (
              <div className={styles.gridTwo}>
                {potOptions.map((pot) => (
                  <button
                    key={pot.id}
                    type="button"
                    className={styles.selectorCard}
                    onClick={() => {
                      setSelectedPot(pot);
                      setStep("shipping");
                    }}
                  >
                    <div className={styles.selectorBody} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "2.2rem" }}>{pot.decoration}</div>
                      <div className={styles.plantName} style={{ marginTop: "0.6rem" }}>
                        {pot.name}
                      </div>
                      <div className={styles.metaText}>{pot.size}</div>
                      <div className={styles.matchPill} style={{ margin: "0.75rem auto 0", width: "fit-content" }}>
                        {pot.price}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      {step === "shipping" ? (
        <div className={styles.summaryCard}>
          <div className={styles.screenHeaderTitle}>Thông tin giao hàng</div>

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
            <button type="button" className={styles.buttonOutline} onClick={() => setStep("select")}>
              <ArrowLeftIcon />
              Quay lại
            </button>
          </div>
        </div>
      ) : null}

      {step === "confirm" && selectedProduct ? (
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Order Summary</div>
          <div className={styles.summaryRow}>
            {hasImagePreview(selectedProduct) ? (
              <div className={styles.summaryThumb}>
                <CityImage src={selectedProduct.image} alt={selectedProduct.name} sizes="72px" className="h-full w-full" fit="contain" />
              </div>
            ) : (
              <div className={styles.profileBadge} style={{ width: "4rem", height: "4rem", borderRadius: "1rem" }}>
                {"icon" in selectedProduct ? selectedProduct.icon : "🌱"}
              </div>
            )}
            <div>
              <div className={styles.plantName}>{selectedProduct.name}</div>
              <div className={styles.captionText}>{selectedProduct.price}</div>
            </div>
          </div>

          {"components" in selectedProduct ? (
            <div className={styles.tagRow} style={{ marginTop: "1rem" }}>
              {selectedProduct.components.map((component) => (
                <span key={component} className={styles.tag}>
                  {component}
                </span>
              ))}
            </div>
          ) : null}

          <div
            className={styles.section}
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

      {step === "success" ? (
        <div className={styles.successStage}>
          <div className={styles.successIcon}>
            <CheckIcon />
          </div>
          <div className={styles.screenHeaderTitle}>Order Placed!</div>
          <div className={styles.sectionSubtitle} style={{ maxWidth: "18rem", textAlign: "center" }}>
            Your order is ready. Use the code below to activate your digital garden or keep it for pickup.
          </div>
          <div className={styles.codeCard}>
            <div className={styles.summaryLabel} style={{ color: "rgba(255,255,255,0.56)" }}>
              Order Code
            </div>
            <div className={styles.codeValue}>{generatedCode}</div>
          </div>
          <div className={styles.section} style={{ display: "grid", gap: "0.75rem", width: "100%" }}>
            <button type="button" className={styles.buttonOutline} onClick={handleCopy}>
              Copy Code
            </button>
            <Link href="/garden" className={styles.buttonPrimary}>
              Go to My Garden
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
