"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { dirtOptions, kits, potOptions, seeds, type Kit } from "../../../lib/cityfarm";
import styles from "../cityfarm.module.css";
import { ArrowLeftIcon, BagIcon, CheckIcon, DropletIcon, RecycleIcon, SproutIcon } from "../shared/icons";
import { CityImage, OrderTab } from "../shared/ui";

type ProductType = "kit" | "seed" | "dirt" | "pot";
type OrderStep = "select" | "confirm" | "success";
type ShopItem = Kit | (typeof seeds)[number] | (typeof dirtOptions)[number] | (typeof potOptions)[number];

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

export function OrderScreen({ initialSeed }: { initialSeed?: string | null }) {
  const [productType, setProductType] = useState<ProductType>("kit");
  const [step, setStep] = useState<OrderStep>("select");
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [selectedSeed, setSelectedSeed] = useState<(typeof seeds)[number] | null>(null);
  const [selectedDirt, setSelectedDirt] = useState<(typeof dirtOptions)[number] | null>(null);
  const [selectedPot, setSelectedPot] = useState<(typeof potOptions)[number] | null>(null);
  const [generatedCode, setGeneratedCode] = useState("");

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
      setStep("confirm");
    }
  }, [initialSeed]);

  const selectedProduct = getSelectedProduct({
    productType,
    selectedKit,
    selectedSeed,
    selectedDirt,
    selectedPot,
  });

  const handleOrder = () => {
    if (!selectedProduct) {
      return;
    }

    const uniqueId = Math.floor(1000 + Math.random() * 9000);
    setGeneratedCode(`${productType.toUpperCase()}-${selectedProduct.id}-${uniqueId}`);
    setStep("success");
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
                      setStep("confirm");
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
                      setStep("confirm");
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
                      setStep("confirm");
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
                      setStep("confirm");
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

          <div className={styles.section} style={{ display: "grid", gap: "0.75rem" }}>
            <button type="button" className={styles.buttonPrimary} onClick={handleOrder}>
              Confirm Order
            </button>
            <button type="button" className={styles.buttonOutline} onClick={() => setStep("select")}>
              <ArrowLeftIcon />
              Back
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
