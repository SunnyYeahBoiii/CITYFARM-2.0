"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { scanAnalysis, scanRecommendations, type ScanRecommendation } from "../../../lib/cityfarm";
import styles from "../cityfarm.module.css";
import {
  BagIcon,
  CameraIcon,
  CheckIcon,
  CloudIcon,
  ImageIcon,
  PinIcon,
  SparkleIcon,
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

export function ScanScreen() {
  const [scanStep, setScanStep] = useState<ScanStep>("camera");
  const [progress, setProgress] = useState(0);
  const [selectedRecommendation, setSelectedRecommendation] = useState<ScanRecommendation | null>(null);

  useEffect(() => {
    if (scanStep !== "analyzing") {
      return;
    }

    setProgress(0);
    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          window.clearInterval(interval);
          return 100;
        }

        return current + 5;
      });
    }, 120);

    const done = window.setTimeout(() => {
      setScanStep("results");
    }, 2700);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(done);
    };
  }, [scanStep]);

  return (
    <div className={styles.screen}>
      {scanStep === "camera" ? (
        <div className={styles.scanStage}>
          <div className={styles.cameraStage}>
            <div className={styles.cameraCard}>
              <div className={styles.scanOrb}>
                <CameraIcon />
              </div>
              <div className={styles.cameraCardTitle}>Ready to analyze?</div>
              <p className={styles.cameraCardText}>
                Use the mock scan to keep the original onboarding rhythm: capture, analyze, recommend and visualize.
              </p>
              <div className={styles.cameraActions}>
                <button type="button" className={styles.buttonPrimary} onClick={() => setScanStep("analyzing")}>
                  <CameraIcon />
                  Start Camera
                </button>
                <button type="button" className={styles.buttonSecondary} onClick={() => setScanStep("analyzing")}>
                  <ImageIcon />
                  Upload from Gallery
                </button>
              </div>
              <div className={styles.scanHintRow}>
                <span>Include windows</span>
                <span>•</span>
                <span>Show floor depth</span>
                <span>•</span>
                <span>Face the brightest side</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {scanStep === "analyzing" ? (
        <div className={styles.analyzePanel}>
          <div className={styles.scanFrame}>
            <div className={styles.scanFrameInner}>
              <div className={styles.balconyShapes}>
                <div className={styles.balconyShapeA} />
                <div className={styles.balconyShapeB} />
                <div className={styles.balconyShapeC} />
              </div>
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
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.analyzeSteps}>
              <AnalyzeStep icon={<SunIcon />} active={progress >= 30} label="Detecting light intensity..." />
              <AnalyzeStep icon={<PinIcon />} active={progress >= 60} label="Measuring available area..." />
              <AnalyzeStep icon={<CloudIcon />} active={progress >= 90} label="Matching HCMC climate data..." />
            </div>
          </div>
        </div>
      ) : null}

      {scanStep === "results" ? (
        <div className={styles.screenPadded}>
          <div className={styles.analysisGrid}>
            <AnalysisMetric label="Light Level" value={`${scanAnalysis.lightLevel} (${scanAnalysis.lightScore}%)`} icon={<SunIcon />} />
            <AnalysisMetric label="Area Size" value={scanAnalysis.areaSize} icon={<PinIcon />} />
            <AnalysisMetric label="Climate" value={scanAnalysis.climate} icon={<CloudIcon />} />
            <AnalysisMetric label="Capacity" value={scanAnalysis.capacity} icon={<CheckIcon />} />
          </div>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <div className={styles.sectionTitle}>Top Matches</div>
                <div className={styles.sectionSubtitle}>Based on your balcony conditions</div>
              </div>
              <button type="button" className={styles.ghostButton} onClick={() => setScanStep("camera")}>
                Scan Again
              </button>
            </div>

            <div className={styles.recommendationFeed}>
              {scanRecommendations.map((plant) => (
                <div key={plant.id} className={styles.recommendationCard}>
                  <div className={styles.plantCardInner}>
                    <div className={styles.plantThumb}>
                      <CityImage src={plant.imageUrl} alt={plant.name} sizes="88px" className="h-full w-full" fit="contain" />
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
                        <button
                          type="button"
                          className={styles.buttonOutline}
                          onClick={() => {
                            setSelectedRecommendation(plant);
                            setScanStep("visualization");
                          }}
                        >
                          <SparkleIcon />
                          Visualize This
                        </button>
                        <Link href={`/order?seed=${plant.id}`} className={styles.ghostButton}>
                          Order kit
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {scanStep === "visualization" && selectedRecommendation ? (
        <div className={styles.screenPadded}>
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.sectionTitle}>Future garden preview</div>
              <div className={styles.sectionSubtitle}>{selectedRecommendation.name} placed into your scan.</div>
            </div>
            <button type="button" className={styles.ghostButton} onClick={() => setScanStep("results")}>
              Back
            </button>
          </div>

          <div className={styles.visualizationStage}>
            <div className={styles.scanFrameInner}>
              <div className={styles.balconyShapes}>
                <div className={styles.balconyShapeA} />
                <div className={styles.balconyShapeB} />
                <div className={styles.balconyShapeC} />
              </div>
              <CityImage
                src={selectedRecommendation.imageUrl}
                alt={selectedRecommendation.name}
                sizes="180px"
                className={styles.visualizationPlant}
                fit="contain"
              />
              <div className={styles.visualizationCaption}>
                <div className={styles.plantName}>{selectedRecommendation.name}</div>
                <div className={styles.captionText}>{selectedRecommendation.reason}</div>
              </div>
            </div>
          </div>

          <section className={styles.section}>
            <Link href={`/order?seed=${selectedRecommendation.id}`} className={styles.buttonPrimary} style={{ width: "100%" }}>
              <BagIcon />
              Continue to Order
            </Link>
          </section>
        </div>
      ) : null}
    </div>
  );
}
