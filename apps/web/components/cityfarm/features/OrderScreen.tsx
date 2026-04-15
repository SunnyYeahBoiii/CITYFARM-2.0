"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { shopApi } from "../../../lib/api/shop.api";
import type { Kit, ShopSeed, DirtOption, PotOption, ProductTypeQuery } from "../../../lib/types/shop";
import styles from "../cityfarm.module.css";
import { ArrowLeftIcon, BagIcon, CheckIcon, DropletIcon, RecycleIcon, SproutIcon } from "../shared/icons";
import { CityImage, OrderTab } from "../shared/ui";

type OrderStep = "select" | "confirm" | "success";
type ShopItem = Kit | ShopSeed | DirtOption | PotOption;

function hasImagePreview(product: ShopItem): boolean {
  return !!product.image;
}

export function OrderScreen({ initialSeed }: { initialSeed?: string | null }) {
  const [productType, setProductType] = useState<ProductTypeQuery>("kit");
  const [step, setStep] = useState<OrderStep>("select");
  const [products, setProducts] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ShopItem | null>(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setLoading(true);
    shopApi.getProducts(productType).then((data) => {
      setProducts(data);
      
      // Auto-select initialSeed if specified in URL explicitly (e.g. redirected from scan)
      if (initialSeed && productType === "seed" && data.length > 0) {
         const matchedSeed = data.find((seed: ShopSeed) => 
            seed.id === initialSeed.toUpperCase() || 
            seed.name.toLowerCase().includes(initialSeed.toLowerCase())
         );
         if (matchedSeed) {
            setSelectedProduct(matchedSeed);
            setStep("confirm");
         }
      }
    }).finally(() => setLoading(false));
  }, [productType, initialSeed]);

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
            <OrderTab label="Soil" icon={<DropletIcon />} active={productType === "soil"} onClick={() => setProductType("soil")} />
            <OrderTab label="Pots" icon={<RecycleIcon />} active={productType === "pot"} onClick={() => setProductType("pot")} />
          </div>

          <div className={styles.section}>
            {loading ? (
               <div style={{ textAlign: "center", padding: "2rem", opacity: 0.5 }}>Loading...</div>
            ) : productType === "kit" ? (
              <div className={styles.listStack}>
                {(products as Kit[]).map((kit) => (
                  <button
                    key={kit.id}
                    type="button"
                    className={styles.plantCard}
                    onClick={() => {
                      setSelectedProduct(kit);
                      setStep("confirm");
                    }}
                  >
                    <div className={styles.plantCardInner}>
                      <div className={styles.summaryThumb}>
                        <CityImage src={kit.image} alt={kit.name} sizes="72px" className="h-full w-full" fit="contain" />
                      </div>
                      <div className={styles.plantBody}>
                        <div className={styles.plantTopRow}>
                          <div style={{ textAlign: "left", flex: 1 }}>
                            <div className={styles.plantName}>{kit.name}</div>
                            {kit.components && kit.components.length > 0 && (
                              <ul style={{ paddingLeft: "1.25rem", marginTop: "0.25rem", listStyleType: "disc", color: "var(--color-muted)" }} className={styles.metaText}>
                                {kit.components.map(c => <li key={c} style={{ marginBottom: "0.15rem" }}>{c}</li>)}
                              </ul>
                            )}
                          </div>
                          <div className={styles.matchPill} style={{ alignSelf: "flex-start" }}>{kit.price}</div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : productType === "seed" ? (
              <div className={styles.listStack}>
                {(products as ShopSeed[]).map((seed) => (
                  <button
                    key={seed.id}
                    type="button"
                    className={styles.card}
                    style={{ textAlign: "left" }}
                    onClick={() => {
                      setSelectedProduct(seed);
                      setStep("confirm");
                    }}
                  >
                    <div className={styles.plantTopRow}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        {seed.image ? (
                          <div className={styles.summaryThumb} style={{ width: "4rem", height: "4rem", flexShrink: 0 }}>
                            <CityImage src={seed.image} alt={seed.name} sizes="64px" className="h-full w-full object-cover rounded-md" />
                          </div>
                        ) : (
                          <div style={{ fontSize: "2rem", width: "4rem", textAlign: "center" }}>{seed.icon}</div>
                        )}
                        <div>
                          <div className={styles.plantName}>{seed.name}</div>
                        </div>
                      </div>
                      <div className={styles.matchPill}>{seed.price}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : productType === "soil" ? (
              <div className={styles.listStack}>
                {(products as DirtOption[]).map((dirt) => (
                  <button
                    key={dirt.id}
                    type="button"
                    className={styles.card}
                    style={{ textAlign: "left" }}
                    onClick={() => {
                      setSelectedProduct(dirt);
                      setStep("confirm");
                    }}
                  >
                    <div className={styles.plantTopRow}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        {dirt.image ? (
                          <div className={styles.summaryThumb} style={{ width: "4rem", height: "4rem", flexShrink: 0 }}>
                            <CityImage src={dirt.image} alt={dirt.name} sizes="64px" className="h-full w-full object-cover rounded-md" />
                          </div>
                        ) : (
                          <div style={{ fontSize: "2rem", width: "4rem", textAlign: "center" }}>🪴</div>
                        )}
                        <div>
                          <div className={styles.plantName}>{dirt.name}</div>
                          <div className={styles.metaText}>{dirt.quantity}</div>
                        </div>
                      </div>
                      <div className={styles.matchPill}>{dirt.price}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : productType === "pot" ? (
              <div className={styles.listStack}>
                {(products as PotOption[]).map((pot) => (
                  <button
                    key={pot.id}
                    type="button"
                    className={styles.card}
                    style={{ textAlign: "left" }}
                    onClick={() => {
                      setSelectedProduct(pot);
                      setStep("confirm");
                    }}
                  >
                    <div className={styles.plantTopRow}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        {pot.image ? (
                          <div className={styles.summaryThumb} style={{ width: "4rem", height: "4rem", flexShrink: 0 }}>
                            <CityImage src={pot.image} alt={pot.name} sizes="64px" className="h-full w-full object-cover rounded-md" />
                          </div>
                        ) : (
                          <div style={{ fontSize: "2rem", width: "4rem", textAlign: "center" }}>{pot.decoration}</div>
                        )}
                        <div>
                          <div className={styles.plantName}>{pot.name}</div>
                          <div className={styles.metaText}>{pot.size}</div>
                        </div>
                      </div>
                      <div className={styles.matchPill}>{pot.price}</div>
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
            {hasImagePreview(selectedProduct) && selectedProduct.image ? (
              <div 
                className={styles.summaryThumb} 
                style={{ position: 'relative', cursor: 'zoom-in', width: '5rem', height: '5rem', overflow: 'hidden' }}
                onClick={() => setIsZoomed(true)}
                title="Phóng to ảnh"
              >
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                  background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0,
                  transition: 'opacity 0.2s'
                }} className="hover:opacity-100">
                   <div style={{ color: 'white', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4, fontSize: '10px' }}>Zoom</div>
                </div>
                <CityImage src={selectedProduct.image} alt={selectedProduct.name} sizes="80px" className="h-full w-full" fit="cover" />
              </div>
            ) : (
              <div className={styles.profileBadge} style={{ width: "4rem", height: "4rem", borderRadius: "1rem" }}>
                {"icon" in selectedProduct ? selectedProduct.icon : "decoration" in selectedProduct ? selectedProduct.decoration : "🌱"}
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

      {isZoomed && selectedProduct && hasImagePreview(selectedProduct) && selectedProduct.image && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
          onClick={() => setIsZoomed(false)}
        >
          <img 
            src={selectedProduct.image} 
            alt="Zoom" 
            style={{ width: '85vw', maxWidth: '500px', objectFit: 'contain', borderRadius: 12, cursor: 'zoom-out', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} 
          />
        </div>
      )}

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
