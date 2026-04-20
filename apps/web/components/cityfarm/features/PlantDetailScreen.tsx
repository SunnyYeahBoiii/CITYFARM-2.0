"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { gardenApi } from "@/lib/api/garden.api";
import { uploadAsset } from "@/lib/api/assets.api";
import { ImageCaptureActions } from "@/components/cityfarm/shared/ImageCaptureActions";
import type {
  CareTaskItem,
  GardenPlantDetail,
  JournalEntryItem,
  PlantHealthStatus,
} from "@/lib/types/garden";
import type { PlantHealth } from "@/lib/cityfarm/types";
import { buildTimelineFromApi, daysSince, getHarvestDays } from "@/lib/cityfarm/utils";
import styles from "../cityfarm.module.css";
import {
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon,
  SparkleIcon,
  TrashIcon,
} from "@/components/cityfarm/shared/icons";
import { CityImage, HealthBadge, MetricBox } from "@/components/cityfarm/shared/ui";
import { formatDateShort } from "@/lib/utils/date";

type DetailTab = "Timeline" | "Care" | "Journal";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

function isDueOrOverdue(dateStr: string) {
  const d = new Date(dateStr);
  const n = new Date();
  const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const nStart = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();  
  return dStart <= nStart;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === "string" && response.data.message.trim()) {
      return response.data.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function toPlantHealth(status: PlantHealthStatus | null | undefined): PlantHealth {
  switch (status) {
    case "HEALTHY":
      return "healthy";
    case "CRITICAL":
      return "critical";
    case "WARNING":
    case "UNKNOWN":
    default:
      return "warning";
  }
}


function CareTaskRow({
  task,
  plantId,
  onCompleted,
}: {
  task: CareTaskItem;
  plantId: string;
  onCompleted: (harvested?: boolean) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const isPendingType = task.status === "PENDING" || task.status === "OVERDUE";
  const due = isDueOrOverdue(task.dueAt);
  const canComplete = isPendingType && due;

  const handleComplete = async () => {
    if (!canComplete || isLoading) return;
    setIsLoading(true);
    try {
      const resp = await gardenApi.logCare(plantId, { taskId: task.id });
      onCompleted(resp.harvested);
    } catch (error) {
      alert(getErrorMessage(error, "Failed to complete task"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.careCard} style={{ opacity: !due && isPendingType ? 0.7 : 1 }}>
      <div className={styles.careBody}>
        <div className={styles.taskLead}>
          <button
            type="button"
            onClick={handleComplete}
            disabled={!canComplete || isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors"
            style={{
              background: task.status === "COMPLETED" ? "#e8f4e5" : "#f3f4f6",
              cursor: canComplete ? "pointer" : "default",
              opacity: isLoading ? 0.6 : 1,
              border: !due && isPendingType ? '1px dashed #d1d5db' : 'none'
            }}
          >
            {task.status === "COMPLETED" ? <CheckIcon /> : (due ? <CheckIcon /> : <ClockIcon />)}
          </button>

          <div style={{ flex: 1 }}>
            <div className={styles.timelineHead}>
              <div
                className={styles.plantName}
                style={{
                  textDecoration: task.status === "COMPLETED" ? "line-through" : "none",
                  opacity: task.status === "COMPLETED" ? 0.5 : 1,
                }}
              >
                {task.title}
              </div>
              <div
                className={
                  task.status === "COMPLETED" ? styles.statusPill : (due ? styles.timePill : styles.statusPill)
                }
                style={!due && isPendingType ? { background: '#f3f4f6', color: '#6b7280' } : {}}
              >
                {task.status === "PENDING" && !due ? "UPCOMING" : task.status}
              </div>
            </div>
            <div className={styles.metaText}>
              {due ? "Due" : "Scheduled"}: {formatDate(task.dueAt)}
            </div>
            {task.description && (
              <div className={styles.captionText} style={{ marginTop: "0.35rem" }}>
                {task.description}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


function JournalEntryRow({
  entry,
  plantId,
  onDeleted,
}: {
  entry: JournalEntryItem;
  plantId: string;
  onDeleted: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await gardenApi.deleteJournal(plantId, entry.id);
      onDeleted();
    } catch (err) {
      console.error("Failed to delete journal:", err);
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.journalCard}>
      <div className={styles.journalImageContainer}>
        {entry.imageAsset?.publicUrl ? (
          <div className={styles.journalImage}>
            <CityImage
              src={entry.imageAsset.publicUrl}
              alt={`Journal ${entry.capturedAt}`}
              sizes="100vw"
              className="h-full w-full"
            />
          </div>
        ) : (
          <div className={styles.journalImage} style={{ background: '#f8faf7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClockIcon style={{ opacity: 0.1, width: 48, height: 48 }} />
          </div>
        )}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label="Delete journal entry"
          className={styles.journalDeleteButton}
        >
          <TrashIcon />
        </button>
      </div>

      <div className={styles.journalBody}>
        <div className={styles.journalAiHeader}>
          <div className={styles.journalAiTitle}>
            <SparkleIcon style={{ color: "#567a3d", opacity: 0.8 }} />
            AI Health Check
          </div>
          {entry.healthStatus && (
            <HealthBadge health={toPlantHealth(entry.healthStatus)} />
          )}
        </div>

        <div className={styles.journalDataCard}>
          <div className={styles.journalDataRow}>
            <span className={styles.journalLabel}>Leaf Color:</span>
            <span className={styles.journalValue}>{entry.leafColorNote || "Normal"}</span>
          </div>
          <div className={styles.journalDivider} />
          <div className="flex flex-col">
            <span className={styles.journalLabel}>Recommendation</span>
            <div className={styles.journalValueSmall}>
              {entry.recommendationSummary || entry.note || "Planting day! Soil looks good."}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function HarvestSuccessModal({ 
  plantName,
  plantId,
  onClose 
}: { 
  plantName: string; 
  plantId: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-in fade-in zoom-in duration-300 rounded-[2rem] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] text-center">
        <div className="mb-4 flex justify-center text-5xl">🎉</div>
        <h2 className="text-xl font-extrabold text-[#1f2916]">
          Amazing Harvest!
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#5c6358]">
          You&apos;ve successfully harvested your <b>{plantName}</b>. Your care rate and stats have been updated!
        </p>
        
        <div className="mt-8 flex flex-col gap-3">
          <Link 
            href={`/marketplace/create?plantId=${encodeURIComponent(plantId)}`}
            className="flex h-12 items-center justify-center rounded-full bg-[#355b31] text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(53,91,49,0.3)]"
          >
            Sell Surplus on Marketplace
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 items-center justify-center rounded-full border border-[rgba(31,41,22,0.1)] bg-[#f8faf7] text-sm font-extrabold text-[#5c6358]"
          >
            Back to Garden
          </button>
        </div>
      </div>
    </div>
  );
}


function MarketplaceActionCard({ plant }: { plant: GardenPlantDetail }) {
  const activeListing = plant.listings?.find(l => 
    ["DRAFT", "ACTIVE", "RESERVED", "SOLD"].includes(l.status)
  );

  const isSold = activeListing?.status === "SOLD";

  return (
    <div className="mx-6 mt-8 mb-8 overflow-hidden rounded-[2.5rem] bg-[#355b31] p-8 shadow-[0_25px_50px_rgba(53,75,44,0.35)] text-white border border-white/10">
      <div className="flex items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl">
          🛍️
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium opacity-90">
            {activeListing ? (isSold ? "Successfully Sold!" : "Listed on Marketplace") : "Harvest Complete!"}
          </div>
          <div className="text-lg font-extrabold leading-tight">
            {activeListing 
              ? (isSold ? "This harvest is gone!" : "Your surplus is now public.") 
              : "Ready to share your surplus?"}
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        {activeListing ? (
          <Link 
            href={`/marketplace/listing/${activeListing.id}`}
            className="flex h-11 items-center justify-center rounded-2xl bg-white text-sm font-extrabold text-[#355b31]"
          >
            {isSold ? "View Sales Record" : "View Your Listing"}
          </Link>
        ) : (
          <Link 
            href={`/marketplace/create?plantId=${encodeURIComponent(plant.id)}`}
            className="flex h-11 items-center justify-center rounded-2xl bg-white text-sm font-extrabold text-[#355b31]"
          >
            List Surplus for Sale
          </Link>
        )}
      </div>
    </div>
  );
}


export function PlantDetailScreen({ plantId }: { plantId: string }) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as DetailTab) || "Timeline";
  const [activeTab, setActiveTab] = useState<DetailTab>(initialTab);
  const [plant, setPlant] = useState<GardenPlantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await gardenApi.getPlantDetail(plantId);
      setPlant(data);
    } catch (error) {
      setError(getErrorMessage(error, "Failed to load plant details."));
    } finally {
      setIsLoading(false);
    }
  }, [plantId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleAddPhoto = async (file: File) => {
    setIsProcessingPhoto(true);
    setPhotoError(null);
    try {
      const asset = await uploadAsset(file, "GARDEN_JOURNAL");
      await gardenApi.logJournal(plantId, { imageAssetId: asset.id });
      await fetchDetail();
      setActiveTab("Journal");
    } catch (error) {
      setPhotoError(getErrorMessage(error, "Failed to process photo analysis."));
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  if (isLoading && !plant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-sm font-bold text-(--color-muted) animate-pulse">
          Loading plant details...
        </div>
      </div>
    );
  }

  if (error || !plant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-center">
        <div className="mb-4 text-red-500">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 15.667c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-(--color-heading)">Error</h2>
        <p className="mt-2 text-sm text-(--color-muted)">{error || "Plant not found"}</p>
        <Link href="/garden" className="mt-6 flex items-center gap-2 font-bold text-(--color-green-deep)">
          <ArrowLeftIcon /> Back to Garden
        </Link>
      </div>
    );
  }

  const timeline = buildTimelineFromApi(plant);
  const growingDays = daysSince(plant.plantedAt);
  const harvestDays = getHarvestDays(plant);
  const progress = Math.min(100, Math.floor((growingDays / harvestDays) * 100));
  
  const pendingTasks = plant.careTasks.filter((t) => t.status === "PENDING" || t.status === "OVERDUE");
  const needsAttention = pendingTasks.filter(t => isDueOrOverdue(t.dueAt));
  const upcomingTasks = pendingTasks.filter(t => !isDueOrOverdue(t.dueAt));
  const doneTasks = plant.careTasks.filter((t) => t.status === "COMPLETED" || t.status === "SKIPPED");

  return (
    <div className={styles.detailScreen}>
      {/* Hero */}
      <div className={styles.detailHero}>
        <CityImage
          src={plant.plantSpecies.products[0]?.coverAsset?.publicUrl || `/img/category/${plant.plantSpecies.category.toLowerCase()}.png`}
          alt={plant.nickname || plant.plantSpecies.commonName}
          sizes="100vw"
          className="h-full w-full"
          priority
        />
        <div className={styles.detailOverlay} />
        <div className={styles.detailTopControls} style={{ justifyContent: "flex-end" }}>
          <Link href={`/chatbot?plantId=${encodeURIComponent(plant.id)}`} className={styles.glassButton}>
            <SparkleIcon />
            Gardening Assistant
          </Link>
        </div>
        <div className={styles.detailHeroContent}>
          <div className={styles.headerRow}>
            <div className={styles.detailHeroTitle}>
              {plant.nickname || plant.plantSpecies.commonName}
            </div>
            <HealthBadge health={toPlantHealth(plant.healthStatus)} />
          </div>
          <div className={styles.detailHeroMeta}>
            {plant.plantSpecies.category} • {plant.growthStage} • Day {growingDays}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className={styles.detailMetrics}>
        <MetricBox label="Progress" value={`${progress}%`} accent="green" />
        <MetricBox label="Planted" value={formatDateShort(plant.plantedAt)} />
        <MetricBox label="Harvest In" value={`${Math.max(0, harvestDays - growingDays)}d`} />
      </div>

      {/* Marketplace Action if Harvested */}
      {plant.status === "HARVESTED" && (
        <MarketplaceActionCard plant={plant} />
      )}

      {/* Progress bar */}
      <div className={styles.detailProgress}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>Growth to Harvest</div>
          <div className={styles.sectionSubtitle}>{growingDays} / {harvestDays} days</div>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Tab bar */}
      <div className={styles.tabBar}>
        {(["Timeline", "Care", "Journal"] as DetailTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === "Care" && needsAttention.length > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-white">
                {needsAttention.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.detailContent}>
        {/* ── Timeline ── */}
        {activeTab === "Timeline" && (
          <div className={styles.timeline}>
            {timeline.map((stage) => (
              <div
                key={`${stage.stage}-${stage.day}`}
                className={`${styles.timelineItem} ${stage.completed ? styles.timelineItemDone : ""}`}
              >
                <div className={stage.completed ? styles.timelineMarkerDone : styles.timelineMarker}>
                  {stage.completed ? <CheckIcon /> : <ClockIcon />}
                </div>
                <div className={`${styles.timelineCard} ${stage.completed ? styles.timelineCardDone : ""}`}>
                  <div className={styles.timelineHead}>
                    <div>
                      <div className={styles.plantName}>{stage.stage}</div>
                      <div className={styles.metaText}>{formatDate(stage.date)}</div>
                    </div>
                    <div className={styles.timePill}>Day {stage.day}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Care ── */}
        {activeTab === "Care" && (
          <div className={styles.careFeed}>
            {plant.careTasks.length === 0 ? (
              <div className={styles.mutedCard}>
                <div className={styles.sectionSubtitle}>No care tasks yet.</div>
              </div>
            ) : (
              <>
                {/* Needs Attention first */}
                {needsAttention.length > 0 && (
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-600">
                    Needs attention ({needsAttention.length})
                  </div>
                )}
                {needsAttention.map((task) => (
                  <CareTaskRow
                    key={task.id}
                    task={task}
                    plantId={plant.id}
                    onCompleted={(harvested) => {
                      if (harvested) setShowHarvestModal(true);
                      fetchDetail();
                    }}
                  />
                ))}

                {/* Upcoming */}
                {upcomingTasks.length > 0 && (
                  <div className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-(--color-muted)">
                    Upcoming ({upcomingTasks.length})
                  </div>
                )}
                {upcomingTasks.map((task) => (
                  <CareTaskRow
                    key={task.id}
                    task={task}
                    plantId={plant.id}
                    onCompleted={(harvested) => {
                      if (harvested) setShowHarvestModal(true);
                      fetchDetail();
                    }}
                  />
                ))}

                {/* Completed */}
                {doneTasks.length > 0 && (
                  <div className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-(--color-muted)">
                    Completed ({doneTasks.length})
                  </div>
                )}
                {doneTasks.map((task) => (
                  <CareTaskRow
                    key={task.id}
                    task={task}
                    plantId={plant.id}
                    onCompleted={fetchDetail}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {/* ── Journal ── */}
        {activeTab === "Journal" && (
          <div className={styles.photoFeed}>
            {plant.journalEntries.length === 0 && (
              <div className={styles.mutedCard}>
                <div className={styles.sectionTitle}>No journal entries</div>
                <div className={styles.sectionSubtitle}>
                  Start tracking your plant&apos;s daily health above.
                </div>
              </div>
            )}

            {plant.journalEntries.map((entry) => (
              <JournalEntryRow
                key={entry.id}
                entry={entry}
                plantId={plant.id}
                onDeleted={fetchDetail}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      {plant.status !== "HARVESTED" && (
        <div className={styles.stickyFooter} style={{ position: "sticky", bottom: 0, padding: "1rem", background: "#ffffff", borderTop: "1px solid rgba(31, 41, 22, 0.08)", zIndex: 20 }}>
          <div className="mb-3">
            <div className="text-sm font-extrabold text-(--color-heading)">Add today&apos;s plant photo</div>
            <div className="mt-1 text-xs font-medium text-(--color-muted)">
              Use the camera on mobile, or fall back to your gallery for an AI journal check.
            </div>
          </div>
          <ImageCaptureActions
            onSelect={(file) => {
              void handleAddPhoto(file);
            }}
            disabled={isProcessingPhoto}
            cameraTitle="Capture today's plant check-in"
            cameraDescription="Take a live photo, review it, then send it for journal analysis and storage."
            cameraConfirmLabel="Use for Journal"
            actionsClassName="grid gap-3"
            cameraButtonClassName={styles.buttonPrimary}
            galleryButtonClassName={styles.buttonOutline}
            cameraLabel={isProcessingPhoto ? "Analyzing Plant..." : "Capture Daily Photo"}
            galleryLabel="Choose from Gallery"
          />
          {photoError ? (
            <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {photoError}
            </div>
          ) : null}
        </div>
      )}

      {showHarvestModal && (
        <HarvestSuccessModal 
          plantId={plant.id}
          plantName={plant.nickname || plant.plantSpecies.commonName}
          onClose={() => {
            setShowHarvestModal(false);
            window.location.href = "/garden";
          }}
        />
      )}
    </div>
  );
}
