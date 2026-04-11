"use client";

import Link from "next/link";
import { useId, useState, type ChangeEvent } from "react";
import { getTimelineForPlant, type CareHistoryEntry, type JournalEntry, type Plant } from "../../../lib/cityfarm";
import styles from "../cityfarm.module.css";
import { CameraIcon, CheckIcon, ClockIcon, SparkleIcon, TrashIcon } from "../shared/icons";
import { CityImage, HealthBadge, MetricBox } from "../shared/ui";

type DetailTab = "Timeline" | "Care" | "Journal";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

export function PlantDetailScreen({ plant }: { plant: Plant }) {
  const fileInputId = useId();
  const [activeTab, setActiveTab] = useState<DetailTab>("Timeline");
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(plant.journal);
  const [careEntries] = useState<CareHistoryEntry[]>(plant.careHistory);
  const timeline = getTimelineForPlant(plant);

  const handleAddPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const photo = file ? URL.createObjectURL(file) : plant.imageUrl;
    const today = new Date().toISOString().split("T")[0] ?? plant.plantedDate;
    const mockHealth = plant.health === "warning" ? "Warning" : "Healthy";

    setJournalEntries((current) => [
      {
        id: `${Date.now()}`,
        date: today,
        photo,
        aiAnalysis: {
          health: mockHealth,
          leafColor: mockHealth === "Healthy" ? "Vibrant green" : "Slight yellowing",
          issues: mockHealth === "Healthy" ? "None detected" : "Possible heat stress",
          recommendation:
            mockHealth === "Healthy"
              ? "Great update. Keep the same care rhythm for the next 48 hours."
              : "Move the pot to softer shade and recheck tomorrow morning.",
        },
      },
      ...current,
    ]);
    setActiveTab("Journal");
    event.target.value = "";
  };

  return (
    <div className={styles.detailScreen}>
      <div className={styles.detailHero}>
        <CityImage src={plant.imageUrl} alt={plant.name} sizes="100vw" className="h-full w-full" priority />
        <div className={styles.detailOverlay} />
        <div className={styles.detailTopControls}>
          <Link href={`/chatbot?plantId=${encodeURIComponent(plant.id)}`} className={styles.glassButton}>
            <SparkleIcon />
            Gardening Assistant
          </Link>
        </div>
        <div className={styles.detailHeroContent}>
          <div className={styles.headerRow}>
            <div className={styles.detailHeroTitle}>{plant.name}</div>
            <HealthBadge health={plant.health} />
          </div>
          <div className={styles.detailHeroMeta}>
            {plant.type} • Day {plant.daysGrowing}
          </div>
        </div>
      </div>

      <div className={styles.detailMetrics}>
        <MetricBox label="Progress" value={`${plant.progress}%`} accent="green" />
        <MetricBox label="Days Growing" value={`${plant.daysGrowing}`} />
        <MetricBox label="Days to Harvest" value={`${Math.max(0, plant.harvestDays - plant.daysGrowing)}`} />
      </div>

      <div className={styles.detailProgress}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>Growth to Harvest</div>
          <div className={styles.sectionSubtitle}>
            {plant.daysGrowing} / {plant.harvestDays} days
          </div>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${Math.min(100, (plant.daysGrowing / plant.harvestDays) * 100)}%` }}
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
            {careEntries.map((entry) => (
              <div key={entry.id} className={styles.careCard}>
                <div className={styles.careBody}>
                  <div className={styles.taskLead}>
                    <div className={styles.taskIcon}>
                      <CheckIcon />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className={styles.timelineHead}>
                        <div className={styles.plantName}>{entry.action}</div>
                        <div className={styles.metaText}>{entry.time}</div>
                      </div>
                      <div className={styles.metaText}>{formatDate(entry.date)}</div>
                      <div className={styles.tagRow} style={{ marginTop: "0.55rem" }}>
                        <span className={styles.tag}>{entry.aiDetection}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "Journal" ? (
          <div className={styles.photoFeed}>
            {journalEntries.length === 0 ? (
              <div className={styles.mutedCard}>
                <div className={styles.sectionTitle}>No photos yet</div>
                <div className={styles.sectionSubtitle}>Capture your first daily update below.</div>
              </div>
            ) : null}

            {journalEntries.map((entry) => (
              <div key={entry.id} className={styles.journalCard}>
                <div className={styles.journalImage}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    style={{ position: "absolute", top: "0.75rem", right: "0.75rem", zIndex: 2 }}
                    onClick={() =>
                      setJournalEntries((current) => current.filter((currentEntry) => currentEntry.id !== entry.id))
                    }
                  >
                    <TrashIcon />
                  </button>
                  <CityImage src={entry.photo} alt={`Journal ${entry.date}`} sizes="100vw" className="h-full w-full" />
                </div>
                <div className={styles.journalBody}>
                  <div className={styles.timelineHead}>
                    <div className={styles.headerRow}>
                      <SparkleIcon />
                      <div className={styles.plantName}>AI Health Check</div>
                    </div>
                    <div className={styles.statusPill}>{entry.aiAnalysis.health}</div>
                  </div>
                  <div className={styles.listStack} style={{ marginTop: "0.85rem" }}>
                    <div className={styles.mutedCard}>
                      <div className={styles.metaText}>Leaf Color</div>
                      <div className={styles.plantName}>{entry.aiAnalysis.leafColor}</div>
                    </div>
                    <div className={styles.mutedCard}>
                      <div className={styles.metaText}>Recommendation</div>
                      <div className={styles.captionText}>{entry.aiAnalysis.recommendation}</div>
                    </div>
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
