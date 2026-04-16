"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState, type ChangeEvent } from "react";
import { gardenApi } from "@/lib/api/garden.api";
import { uploadAsset } from "@/lib/api/assets.api";
import type {
  CareTaskItem,
  GardenPlantDetail,
  JournalEntryItem,
  LogJournalPayload,
  PlantHealthStatus,
} from "@/lib/types/garden";
import { buildTimelineFromApi, daysSince } from "@/lib/cityfarm/utils";
import styles from "../cityfarm.module.css";
import {
  ArrowLeftIcon,
  CameraIcon,
  CheckIcon,
  ClockIcon,
  PlusIcon,
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


function CareTaskRow({
  task,
  plantId,
  onCompleted,
}: {
  task: CareTaskItem;
  plantId: string;
  onCompleted: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const isPendingType = task.status === "PENDING" || task.status === "OVERDUE";
  const due = isDueOrOverdue(task.dueAt);
  const canComplete = isPendingType && due;

  const handleComplete = async () => {
    if (!canComplete || isLoading) return;
    setIsLoading(true);
    try {
      await gardenApi.logCare(plantId, { taskId: task.id });
      onCompleted();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to complete task");
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
            <HealthBadge health={entry.healthStatus.toLowerCase() as any} />
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
  );
}


export function PlantDetailScreen({ plantId }: { plantId: string }) {
  const fileInputId = useId();
  const [activeTab, setActiveTab] = useState<DetailTab>("Timeline");
  const [plant, setPlant] = useState<GardenPlantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await gardenApi.getPlantDetail(plantId);
      setPlant(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load plant details.");
    } finally {
      setIsLoading(false);
    }
  }, [plantId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleAddPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    try {
      // 1. Upload
      const asset = await uploadAsset(file, 'GARDEN_JOURNAL');
      // 2. Log Journal (AI logic triggers in backend)
      await gardenApi.logJournal(plantId, { imageAssetId: asset.id });
      // 3. Refresh
      await fetchDetail();
      setActiveTab("Journal");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to process photo analysis.");
    } finally {
      setIsProcessingPhoto(false);
      event.target.value = "";
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
  const harvestDays = plant.plantSpecies.harvestDaysMin ?? 60;
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
            <HealthBadge health={plant.healthStatus.toLowerCase() as any} />
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
                    onCompleted={fetchDetail}
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
                    onCompleted={fetchDetail}
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
                  Start tracking your plant's daily health above.
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
      <div className={styles.stickyFooter} style={{ position: "sticky", bottom: 0, padding: "1rem", background: "#ffffff", borderTop: "1px solid rgba(31, 41, 22, 0.08)", zIndex: 20 }}>
        <label 
          htmlFor={fileInputId} 
          className={`${styles.buttonPrimary} ${isProcessingPhoto ? 'opacity-70 pointer-events-none' : ''}`}
          style={{ width: "100%", cursor: "pointer" }}
        >
          {isProcessingPhoto ? (
            <span className="flex items-center gap-2">
              <SparkleIcon /> Analyzing Plant...
            </span>
          ) : (
            <>
              <CameraIcon /> Capture Daily Photo
            </>
          )}
        </label>
        <input 
          id={fileInputId} 
          type="file" 
          accept="image/*" 
          hidden 
          onChange={handleAddPhoto} 
          disabled={isProcessingPhoto}
        />
      </div>
    </div>
  );
}
