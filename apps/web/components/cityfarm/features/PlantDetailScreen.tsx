"use client";

import Link from "next/link";
import { useEffect, useId, useState, type ChangeEvent } from "react";
import { gardenApi } from "@/lib/api/garden.api";
import { GardenPlantDetail, CareTaskItem, JournalEntryItem } from "@/lib/types/garden";
import { buildTimelineFromApi, daysSince } from "@/lib/cityfarm/utils";
import styles from "../cityfarm.module.css";
import { CameraIcon, CheckIcon, ClockIcon, SparkleIcon, TrashIcon, ArrowLeftIcon } from "@/components/cityfarm/shared/icons";
import { CityImage, HealthBadge, MetricBox } from "@/components/cityfarm/shared/ui";
import { formatDateShort } from "@/lib/utils/date";

type DetailTab = "Timeline" | "Care" | "Journal";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

export function PlantDetailScreen({ plantId }: { plantId: string }) {
  const fileInputId = useId();
  const [activeTab, setActiveTab] = useState<DetailTab>("Timeline");
  const [plant, setPlant] = useState<GardenPlantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        const data = await gardenApi.getPlantDetail(plantId);
        setPlant(data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load plant details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [plantId]);

  const handleAddPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    // This will still be a mock/local action for now until Part 7 (AI Journal Upload)
    alert("Photo upload feature coming soon with AI Analysis integration!");
    event.target.value = "";
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-sm font-bold text-(--color-muted) animate-pulse">Loading plant details...</div>
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
        <Link href="/garden" className="mt-6 font-bold text-(--color-green-deep) flex items-center gap-2">
          <ArrowLeftIcon /> Back to Garden
        </Link>
      </div>
    );
  }

  const timeline = buildTimelineFromApi(plant);
  const growingDays = daysSince(plant.plantedAt);
  const harvestDays = plant.plantSpecies.harvestDaysMin ?? 60;
  const progress = Math.min(100, Math.floor((growingDays / harvestDays) * 100));

  return (
    <div className={styles.detailScreen}>
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
            Assistant
          </Link>
        </div>
        <div className={styles.detailHeroContent}>
          <div className={styles.headerRow}>
            <div className={styles.detailHeroTitle}>{plant.nickname || plant.plantSpecies.commonName}</div>
            <HealthBadge health={plant.healthStatus.toLowerCase() as any} />
          </div>
          <div className={styles.detailHeroMeta}>
            {plant.plantSpecies.category} • {plant.growthStage} • Day {growingDays}
          </div>
        </div>
      </div>

      <div className={styles.detailMetrics}>
        <MetricBox label="Progress" value={`${progress}%`} accent="green" />
        <MetricBox label="Planted" value={formatDateShort(plant.plantedAt)} />
        <MetricBox label="Harvest In" value={`${Math.max(0, harvestDays - growingDays)}d`} />
      </div>

      <div className={styles.detailProgress}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>Growth to Harvest</div>
          <div className={styles.sectionSubtitle}>
            {growingDays} / {harvestDays} days
          </div>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className={styles.tabBar}>
        {(["Timeline", "Care", "Journal"] as DetailTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.detailContent}>
        {activeTab === "Timeline" ? (
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
        ) : null}

        {activeTab === "Care" ? (
          <div className={styles.careFeed}>
            {plant.careTasks.length === 0 ? (
              <div className={styles.mutedCard}>
                <div className={styles.sectionSubtitle}>No care tasks recorded for this plant yet.</div>
              </div>
            ) : null}
            {plant.careTasks.map((task) => (
              <div key={task.id} className={styles.careCard}>
                <div className={styles.careBody}>
                  <div className={styles.taskLead}>
                    <div className={styles.taskIcon} style={{ background: task.status === 'COMPLETED' ? '#e8f4e5' : '#f3f4f6' }}>
                      <CheckIcon />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className={styles.timelineHead}>
                        <div className={styles.plantName}>{task.title}</div>
                        <div className={task.status === 'COMPLETED' ? styles.statusPill : styles.timePill}>
                           {task.status}
                        </div>
                      </div>
                      <div className={styles.metaText}>{formatDate(task.dueAt)}</div>
                      {task.aiSummary && (
                        <div className={styles.tagRow} style={{ marginTop: "0.55rem" }}>
                          <span className={styles.tag}>{task.aiSummary}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "Journal" ? (
          <div className={styles.photoFeed}>
            {plant.journalEntries.length === 0 ? (
              <div className={styles.mutedCard}>
                <div className={styles.sectionTitle}>No journal entries</div>
                <div className={styles.sectionSubtitle}>Capture daily growth photos to track health over time.</div>
              </div>
            ) : null}

            {plant.journalEntries.map((entry) => (
              <div key={entry.id} className={styles.journalCard}>
                <div className={styles.journalImage}>
                  {entry.imageAsset?.publicUrl ? (
                    <CityImage src={entry.imageAsset.publicUrl} alt={`Journal ${entry.capturedAt}`} sizes="100vw" className="h-full w-full" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                       No Image
                    </div>
                  )}
                </div>
                <div className={styles.journalBody}>
                  <div className={styles.timelineHead}>
                    <div className={styles.headerRow}>
                      <SparkleIcon />
                      <div className={styles.plantName}>AI Health Check</div>
                    </div>
                    <div className={entry.healthStatus === 'HEALTHY' ? styles.healthPillHealthy : styles.healthPillWarning}>
                      {entry.healthStatus || 'UNKNOWN'}
                    </div>
                  </div>
                  <div className={styles.listStack} style={{ marginTop: "0.85rem" }}>
                    <div className={styles.mutedCard}>
                      <div className={styles.metaText}>Leaf Observation</div>
                      <div className={styles.plantName}>{entry.leafColorNote || "No specific note"}</div>
                    </div>
                    {entry.recommendationSummary && (
                      <div className={styles.mutedCard}>
                        <div className={styles.metaText}>AI Recommendation</div>
                        <div className={styles.captionText}>{entry.recommendationSummary}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: "sticky",
          bottom: 0,
          padding: "1rem",
          background: "#ffffff",
          borderTop: "1px solid rgba(31, 41, 22, 0.08)",
        }}
      >
        <label htmlFor={fileInputId} className={styles.buttonPrimary} style={{ width: "100%" }}>
          <CameraIcon />
          Capture Daily Photo
        </label>
        <input id={fileInputId} type="file" accept="image/*" hidden onChange={handleAddPhoto} />
      </div>
    </div>
  );
}
