"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ImageCaptureActions } from "@/components/cityfarm/shared/ImageCaptureActions";
import { analyzeSpaceScan, type SpaceScanResult } from "@/lib/api/scan.api";
import type { ScanRecommendation } from "@/lib/cityfarm/types";
import styles from "../cityfarm.module.css";
import {
  BagIcon,
  CameraIcon,
  CheckIcon,
  CloudIcon,
  PinIcon,
  SparkleIcon,
  SproutIcon,
  SunIcon,
} from "../shared/icons";
import { AnalysisMetric, CityImage } from "../shared/ui";

type ScanStep = "camera" | "analyzing" | "results" | "visualization";

function AnalyzeStep({
  icon,
  active,
  label,
}: {
  icon: ReactNode;
  active: boolean;
  label: string;
}) {
  return (
    <div className={`${styles.analyzeStep} ${active ? styles.analyzeStepActive : ""}`}>
      <div className={styles.taskIcon}>{icon}</div>
      <span className={styles.captionText} style={{ color: active ? "#24301c" : "#677562" }}>
        {label}
      </span>
    </div>
  );
}

function RecommendationThumb({ recommendation }: { recommendation: ScanRecommendation }) {
  if (recommendation.imageUrl) {
    return (
      <CityImage
        src={recommendation.imageUrl}
        alt={recommendation.name}
        sizes="88px"
        className="h-full w-full"
        fit="contain"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#eef5e9] text-[#567a3d]">
      <SproutIcon size={28} />
    </div>
  );
}

function buildOrderHref(recommendation: ScanRecommendation) {
  return `/order?seed=${encodeURIComponent(recommendation.name)}`;
}

export function ScanScreen() {
  const [scanStep, setScanStep] = useState<ScanStep>("camera");
  const [progress, setProgress] = useState(0);
  const [scanResult, setScanResult] = useState<SpaceScanResult | null>(null);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<string | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceImageUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(sourceImageUrl);
    };
  }, [sourceImageUrl]);

  useEffect(() => {
    if (scanStep !== "analyzing") {
      return;
    }

    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 92) {
          return current;
        }

        if (current < 35) {
          return current + 9;
        }

        if (current < 70) {
          return current + 6;
        }

        return current + 3;
      });
    }, 220);

    return () => {
      window.clearInterval(interval);
    };
  }, [scanStep]);

  const replaceSourceImage = (nextUrl: string | null) => {
    setSourceImageUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return nextUrl;
    });
  };

  const resetScan = () => {
    setScanResult(null);
    setSelectedRecommendationId(null);
    setError(null);
    setProgress(0);
    setScanStep("camera");
    replaceSourceImage(null);
  };

  const handleCaptureSelect = async (file: File) => {
    setError(null);
    setScanResult(null);
    setSelectedRecommendationId(null);
    setProgress(8);
    replaceSourceImage(URL.createObjectURL(file));
    setScanStep("analyzing");

    try {
      const result = await analyzeSpaceScan(file);
      setScanResult(result);
      setSelectedRecommendationId(result.recommendations[0]?.id ?? null);
      setProgress(100);
      setScanStep("results");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to analyze this image right now.";
      setError(message);
      setProgress(0);
      setScanStep("camera");
    }
  };

  const selectedRecommendation =
    scanResult?.recommendations.find((item) => item.id === selectedRecommendationId) ??
    scanResult?.recommendations[0] ??
    null;
  const topRecommendation = scanResult?.recommendations[0] ?? null;
  const hasVisualization = Boolean(scanResult?.visualizedImageUrl && topRecommendation);

  return (
    <div className={styles.screen}>
      {scanStep === "camera" ? (
        <div className={styles.scanStage}>
          <div className={styles.cameraStage}>
            <div className={styles.cameraCard}>
              {sourceImageUrl ? (
                <div className="relative mx-auto mb-4 aspect-[4/3] w-full max-w-[18rem] overflow-hidden rounded-[1.4rem] border border-white/12 bg-white/10">
                  <CityImage src={sourceImageUrl} alt="Last scan source" sizes="288px" className="h-full w-full" />
                </div>
              ) : (
                <div className={styles.scanOrb}>
                  <CameraIcon />
                </div>
              )}

              <div className={styles.cameraCardTitle}>Scan a real grow space</div>
              <p className={styles.cameraCardText}>
                Capture a fresh balcony photo on mobile or fall back to your gallery. CITYFARM will upload the image,
                run the real scan API, and return live recommendations.
              </p>

              {error ? (
                <div className="mt-4 rounded-[1rem] border border-[#efb5b5] bg-[#fff3f2] px-4 py-3 text-left text-sm font-medium text-[#8f3c37]">
                  {error}
                </div>
              ) : null}

              <div className="mt-5">
                <ImageCaptureActions
                  onSelect={(file) => {
                    void handleCaptureSelect(file);
                  }}
                  actionsClassName={styles.cameraActions}
                  cameraButtonClassName={styles.buttonPrimary}
                  galleryButtonClassName={styles.buttonSecondary}
                  cameraLabel="Capture with Camera"
                  galleryLabel="Upload from Gallery"
                  hint="Include windows, floor depth, and the brightest edge of the space."
                  hintClassName={styles.scanHintRow}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {scanStep === "analyzing" ? (
        <div className={styles.analyzePanel}>
          <div className={styles.scanFrame}>
            <div className={styles.scanFrameInner}>
              {sourceImageUrl ? (
                <CityImage
                  src={sourceImageUrl}
                  alt="Uploaded space"
                  sizes="100vw"
                  className="absolute inset-0 h-full w-full"
                />
              ) : (
                <div className={styles.balconyShapes}>
                  <div className={styles.balconyShapeA} />
                  <div className={styles.balconyShapeB} />
                  <div className={styles.balconyShapeC} />
                </div>
              )}

              <div className={styles.scanGuide} />
              <div className={styles.scanGuideCorners}>
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className={styles.analyzeOverlay}>
                <div>
                  <SparkleIcon />
                  <div className={styles.cameraCardTitle} style={{ marginTop: "0.75rem" }}>
                    AI is analyzing your space...
                  </div>
                  <p className="mt-2 text-sm text-white/75">Uploading image, scoring conditions, and composing a placement preview.</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.analyzeSteps}>
              <AnalyzeStep icon={<SunIcon />} active={progress >= 25} label="Reading light and shade patterns..." />
              <AnalyzeStep icon={<PinIcon />} active={progress >= 55} label="Estimating open planting area..." />
              <AnalyzeStep icon={<CloudIcon />} active={progress >= 85} label="Ranking crops and building the top preview..." />
            </div>
          </div>
        </div>
      ) : null}

      {scanStep === "results" && scanResult ? (
        <div className={styles.screenPadded}>
          <section className="px-5 pt-5">
            <div className="overflow-hidden rounded-[1.5rem] border border-[rgba(31,41,22,0.08)] bg-white p-4 shadow-[0_12px_32px_rgba(33,49,30,0.08)]">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.1rem] bg-[#eff4eb]">
                  {sourceImageUrl ? (
                    <CityImage src={sourceImageUrl} alt="Scanned space" sizes="80px" className="h-full w-full" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#567a3d]">
                      <CameraIcon />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7f8e76]">Latest Space Scan</div>
                  <div className="mt-1 text-base font-extrabold text-[#1f2916]">
                    {topRecommendation ? `${topRecommendation.name} is your strongest match` : "Analysis complete"}
                  </div>
                  <div className="mt-1 text-sm leading-relaxed text-[#5f6d56]">
                    {hasVisualization
                      ? "A placement preview is ready for the top recommendation from this scan."
                      : "Recommendations are ready. Capture another angle if you want a new pass."}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className={styles.analysisGrid}>
            <AnalysisMetric
              label="Light Level"
              value={`${scanResult.analysis.lightLevel} (${scanResult.analysis.lightScore}%)`}
              icon={<SunIcon />}
            />
            <AnalysisMetric label="Area Size" value={scanResult.analysis.areaSize} icon={<PinIcon />} />
            <AnalysisMetric label="Climate" value={scanResult.analysis.climate} icon={<CloudIcon />} />
            <AnalysisMetric label="Capacity" value={scanResult.analysis.capacity} icon={<CheckIcon />} />
          </div>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <div className={styles.sectionTitle}>Top Matches</div>
                <div className={styles.sectionSubtitle}>Returned by the live scan API for this photo</div>
              </div>
              <button type="button" className={styles.ghostButton} onClick={resetScan}>
                Scan Again
              </button>
            </div>

            {scanResult.recommendations.length === 0 ? (
              <div className={styles.mutedCard}>
                <div className={styles.sectionTitle}>No recommendations returned</div>
                <div className={styles.sectionSubtitle}>Try a brighter image or a wider angle that shows the full planting area.</div>
              </div>
            ) : (
              <div className={styles.recommendationFeed}>
                {scanResult.recommendations.map((plant, index) => {
                  const isTopRecommendation = index === 0 && hasVisualization;

                  return (
                    <div key={`${plant.id}-${index}`} className={styles.recommendationCard}>
                      <div className={styles.plantCardInner}>
                        <div className={styles.plantThumb}>
                          <RecommendationThumb recommendation={plant} />
                        </div>
                        <div className={styles.plantBody}>
                          <div className={styles.plantTopRow}>
                            <div>
                              <div className={styles.plantName}>{plant.name}</div>
                              <div className={styles.plantMeta}>{plant.harvestDays}</div>
                            </div>
                            <div className={styles.matchPill}>{plant.matchScore}% Match</div>
                          </div>
                          <div className={styles.captionText} style={{ marginTop: "0.55rem" }}>
                            {plant.reason}
                          </div>
                          <div className={styles.tagRow} style={{ marginTop: "0.75rem" }}>
                            <span className={styles.tag}>{plant.sunlight}</span>
                            <span className={styles.tag}>{plant.water}</span>
                            <span className={styles.tag}>{plant.climate}</span>
                          </div>
                          <div className={styles.section} style={{ marginTop: "0.85rem" }}>
                            {isTopRecommendation ? (
                              <button
                                type="button"
                                className={styles.buttonOutline}
                                onClick={() => {
                                  setSelectedRecommendationId(plant.id);
                                  setScanStep("visualization");
                                }}
                              >
                                <SparkleIcon />
                                View AI Placement
                              </button>
                            ) : (
                              <div className="rounded-full border border-[rgba(69,97,54,0.14)] bg-[#f7faf5] px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-[#6f8264]">
                                Placement preview is generated for the top match
                              </div>
                            )}
                            <Link href={buildOrderHref(plant)} className={styles.ghostButton}>
                              Order seed
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {scanStep === "visualization" && selectedRecommendation && scanResult?.visualizedImageUrl ? (
        <div className={styles.screenPadded}>
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.sectionTitle}>AI placement preview</div>
              <div className={styles.sectionSubtitle}>{selectedRecommendation.name} placed into your uploaded space.</div>
            </div>
            <button type="button" className={styles.ghostButton} onClick={() => setScanStep("results")}>
              Back
            </button>
          </div>

          <div className={`${styles.visualizationStage} relative overflow-hidden border border-[rgba(31,41,22,0.08)]`}>
            <CityImage
              src={scanResult.visualizedImageUrl}
              alt={`${selectedRecommendation.name} visualization`}
              sizes="100vw"
              className="h-full w-full"
            />
            <div className={styles.visualizationCaption}>
              <div className={styles.plantName}>{selectedRecommendation.name}</div>
              <div className={styles.captionText}>{selectedRecommendation.reason}</div>
            </div>
          </div>

          <section className={styles.section}>
            <div className="mb-3 rounded-[1rem] bg-[#f5f8f3] px-4 py-3 text-sm leading-relaxed text-[#5a6851]">
              This preview is generated from your exact scan image and currently tracks the highest-ranked recommendation.
            </div>
            <Link href={buildOrderHref(selectedRecommendation)} className={styles.buttonPrimary} style={{ width: "100%" }}>
              <BagIcon />
              Continue to Order
            </Link>
          </section>
        </div>
      ) : null}
    </div>
  );
}
