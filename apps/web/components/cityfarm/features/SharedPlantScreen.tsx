"use client";

import { useState } from "react";
import { getTimelineForPlant, type Plant } from "../../../lib/cityfarm";
import styles from "../cityfarm.module.css";
import { CheckIcon, ClockIcon } from "../shared/icons";
import { CityImage, HealthBadge, MetricBox } from "../shared/ui";

type SharedDetailTab = "Timeline" | "Journal";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

export function SharedPlantScreen({ plant }: { plant: Plant }) {
  const [activeTab, setActiveTab] = useState<SharedDetailTab>("Timeline");
  const timeline = getTimelineForPlant(plant);

  return (
    <div className={styles.detailScreen}>
      <div className={styles.detailHero}>
        <CityImage src={plant.imageUrl} alt={plant.name} sizes="100vw" className="h-full w-full" priority />
        <div className={styles.detailOverlay} />
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

      <div className={`${styles.tabBar} ${styles.tabBarTwo}`}>
        {(["Timeline", "Journal"] as SharedDetailTab[]).map((tab) => (
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

        {activeTab === "Journal" ? (
          <div className={styles.photoFeed}>
            {plant.journal.map((entry) => (
              <div key={entry.id} className={styles.journalCard}>
                <div className={styles.journalImage}>
                  <CityImage src={entry.photo} alt={`Shared entry ${entry.date}`} sizes="100vw" className="h-full w-full" />
                </div>
                <div className={styles.journalBody}>
                  <div className={styles.plantName}>{formatDate(entry.date)}</div>
                  <div className={styles.captionText} style={{ marginTop: "0.5rem" }}>
                    {entry.aiAnalysis.recommendation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.screenPadded} style={{ paddingTop: 0 }}>
        <div className={styles.mutedCard}>
          <div className={styles.captionText}>
            This is a shared view of someone else&apos;s garden. You can inspect the growth history but you cannot
            modify this plant.
          </div>
        </div>
      </div>
    </div>
  );
}
