/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState, useRef } from "react";
import {
  dirtOptions,
  getPlantById,
  getPlants,
  getTimelineForPlant,
  homeStats,
  kits,
  potOptions,
  reminders,
  scanAnalysis,
  scanRecommendations,
  seeds,
  type CareHistoryEntry,
  type JournalEntry,
  type Kit,
  type Plant,
  type PlantHealth,
  type ScanRecommendation,
} from "../../lib/cityfarm-data";
import {
  HomeIcon,
  BagIcon,
  SproutIcon,
  UsersIcon,
  CameraIcon,
  DropletIcon,
  SunIcon,
  CheckIcon,
  ClockIcon,
  ArrowLeftIcon,
  SparkleIcon,
  TrashIcon,
  PlusIcon,
  SearchIcon,
  HeartIcon,
  HelpIcon,
  ImageIcon,
  PinIcon,
  CloudIcon,
  RecycleIcon,
  CloseIcon,
} from "./icons";
import { PostType, type FeedPost, type MarketListing } from "../../lib/types/community";
import { createPost, loadCommunityData, toggleReaction } from "../../lib/api/community.api";
import { uploadAsset } from "../../lib/api/assets.api";
import styles from "./cityfarm.module.css";

type DetailTab = "Timeline" | "Care" | "Journal";
type SharedDetailTab = "Timeline" | "Journal";
type CommunityTab = "feed" | "market";
type ScanStep = "camera" | "analyzing" | "results" | "visualization";
type ProductType = "kit" | "seed" | "dirt" | "pot";
type OrderStep = "select" | "confirm" | "success";



export function HomeScreen() {
  const plants = getPlants();

  return (
    <div className={`${styles.screen} ${styles.screenHome}`}>
      <div className={styles.heroHeader}>
        <div className={styles.brandRow}>
          <div className={styles.brandStack}>
            <div className={styles.brandMark}>CF</div>
            <div>
              <div className={styles.brandName}>CITYFARM</div>
              <div className={styles.brandTagline}>Grow clean, live green</div>
            </div>
          </div>
          <Link href="/account" className={styles.profileBadge} aria-label="Open account">
            SG
          </Link>
        </div>

        <div className={styles.heroCard}>
          <div className={styles.heroCardTitle}>Start Your Garden</div>
          <p className={styles.heroCardText}>
            Scan your space and get AI-powered plant recommendations tuned for dense urban homes.
          </p>
          <div className={styles.heroCardFooter}>
            <Link href="/scan" className={styles.primaryLink}>
              <CameraIcon />
              Scan Your Space
            </Link>
            <Link href="/order" className={styles.secondaryLink}>
              <BagIcon />
              Browse kits
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.screenPadded}>
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.sectionTitle}>Today&apos;s Care Tasks</div>
              <div className={styles.sectionSubtitle}>Keep your streak stable before sunset.</div>
            </div>
            <div className={styles.statusPill}>{reminders.length} pending</div>
          </div>
          <div className={styles.listStack}>
            {reminders.map((reminder) => (
              <div key={reminder.id} className={styles.taskCard}>
                <div className={styles.taskLead}>
                  <div className={styles.taskIcon}>{getReminderIcon(reminder.icon)}</div>
                  <div>
                    <div className={styles.taskTitle}>{reminder.plant}</div>
                    <div className={styles.taskText}>{reminder.action}</div>
                  </div>
                </div>
                <div className={styles.timePill}>{reminder.time}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.sectionTitle}>My Garden</div>
              <div className={styles.sectionSubtitle}>Tap a plant to open the full care view.</div>
            </div>
            <Link href="/garden" className={styles.sectionAction}>
              View All
            </Link>
          </div>

          <div className={styles.listStack}>
            {plants.slice(0, 3).map((plant) => (
              <Link key={plant.id} href={`/garden/${plant.id}`} className={styles.plantCard}>
                <div className={styles.plantCardInner}>
                  <div className={styles.plantThumb}>
                    <img src={plant.imageUrl} alt={plant.name} />
                  </div>
                  <div className={styles.plantBody}>
                    <div className={styles.plantTopRow}>
                      <div>
                        <div className={styles.plantName}>{plant.name}</div>
                        <div className={styles.plantMeta}>
                          Day {plant.daysGrowing} of {plant.harvestDays}
                        </div>
                      </div>
                      <HealthBadge health={plant.health} />
                    </div>
                    <div className={styles.progressTrack}>
                      <div className={styles.progressFill} style={{ width: `${plant.progress}%` }} />
                    </div>
                    <div className={styles.plantActionRow}>
                      <span className={styles.metaText}>{plant.nextWatering}</span>
                      <span className={styles.sectionAction}>Open</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.statsGrid}>
            {homeStats.map((stat) => (
              <div
                key={stat.label}
                className={`${styles.statCard} ${
                  stat.tone === "green"
                    ? styles.statGreen
                    : stat.tone === "blue"
                      ? styles.statBlue
                      : styles.statAmber
                }`}
              >
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.heroBanner}>
            <div className={styles.heroBannerTitle}>Local Green Market</div>
            <p className={styles.marketBannerText}>
              Fresh produce from verified growers in your district, backed by planting logs.
            </p>
            <div className={styles.section} style={{ marginTop: "0.85rem" }}>
              <Link href="/community" className={styles.buttonOutline}>
                Browse Community
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function GardenScreen() {
  const plants = getPlants();
  const stats = {
    totalPlants: plants.length,
    healthyPlants: plants.filter((plant) => plant.health === "healthy").length,
    needsAttention: plants.filter((plant) => plant.health === "warning").length,
    avgCareRate: 87,
  };

  return (
    <div className={styles.screen}>
      <header className={styles.screenHeader}>
        <div>
          <div className={styles.screenHeaderTitle}>My Garden</div>
          <div className={styles.screenHeaderMeta}>Track care, harvest pace and active kits.</div>
        </div>
        <div className={styles.headerActions}>
          <Link href="/order" className={styles.iconButton}>
            <PlusIcon />
          </Link>
        </div>
      </header>

      <div className={styles.screenPadded}>
        <section className={styles.section}>
          <div className={styles.heroBanner}>
            <div className={styles.heroBannerTitle}>Activate a new kit</div>
            <p className={styles.marketBannerText}>
              Reorder seeds, top up soil or start a new balcony configuration without leaving the app.
            </p>
            <div className={styles.section} style={{ marginTop: "0.85rem" }}>
              <Link href="/order" className={styles.buttonOutline}>
                Order more supplies
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.statGreen}`}>
              <div className={styles.statValue}>{stats.totalPlants}</div>
              <div className={styles.statLabel}>Total Plants</div>
            </div>
            <div className={`${styles.statCard} ${styles.statBlue}`}>
              <div className={styles.statValue}>{stats.healthyPlants}</div>
              <div className={styles.statLabel}>Healthy</div>
            </div>
            <div className={`${styles.statCard} ${styles.statAmber}`}>
              <div className={styles.statValue}>{stats.avgCareRate}%</div>
              <div className={styles.statLabel}>Care Rate</div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.sectionTitle}>All plants</div>
              <div className={styles.sectionSubtitle}>
                {stats.needsAttention > 0
                  ? `${stats.needsAttention} plant needs attention this week`
                  : "Everything looks stable"}
              </div>
            </div>
          </div>
          <div className={styles.listStack}>
            {plants.map((plant) => (
              <Link key={plant.id} href={`/garden/${plant.id}`} className={styles.plantCard}>
                <div className={styles.plantCardInner}>
                  <div className={styles.plantThumb}>
                    <img src={plant.imageUrl} alt={plant.name} />
                  </div>
                  <div className={styles.plantBody}>
                    <div className={styles.plantTopRow}>
                      <div>
                        <div className={styles.plantName}>{plant.name}</div>
                        <div className={styles.plantMeta}>
                          {plant.type} • {plant.code}
                        </div>
                      </div>
                      <HealthBadge health={plant.health} />
                    </div>
                    <div className={styles.progressTrack}>
                      <div className={styles.progressFill} style={{ width: `${plant.progress}%` }} />
                    </div>
                    <div className={styles.plantActionRow}>
                      <span className={styles.metaText}>{plant.nextWatering}</span>
                      <span className={styles.sectionAction}>View detail</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function PlantDetailScreen({ plant }: { plant: Plant }) {
  const router = useRouter();
  const fileInputId = useId();
  const [activeTab, setActiveTab] = useState<DetailTab>("Timeline");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(plant.journal);
  const [careEntries] = useState<CareHistoryEntry[]>(plant.careHistory);
  const timeline = getTimelineForPlant(plant);

  const handleAddPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleDeleteEntry = (entryId: string) => {
    setJournalEntries((entries) => entries.filter((entry) => entry.id !== entryId));
  };

  return (
    <div className={styles.detailScreen}>
      <div className={styles.detailHero}>
        <img src={plant.imageUrl} alt={plant.name} />
        <div className={styles.detailOverlay} />
        <div className={styles.detailTopControls}>
          <button type="button" className={styles.glassButton} onClick={() => router.push("/garden")}>
            <ArrowLeftIcon />
          </button>
          <button type="button" className={styles.glassButton} onClick={() => setAssistantOpen(true)}>
            <SparkleIcon />
            Gardening Assistant
          </button>
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
        <MetricBox label="Days Growing" value={`${plant.daysGrowing}`} accent="default" />
        <MetricBox
          label="Days to Harvest"
          value={`${Math.max(0, plant.harvestDays - plant.daysGrowing)}`}
          accent="default"
        />
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
                      <div className={styles.metaText}>{new Date(stage.date).toLocaleDateString()}</div>
                    </div>
                    <div className={styles.timePill}>Day {stage.day}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Care" && (
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
                      <div className={styles.metaText}>{new Date(entry.date).toLocaleDateString()}</div>
                      <div className={styles.tagRow} style={{ marginTop: "0.55rem" }}>
                        <span className={styles.tag}>{entry.aiDetection}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Journal" && (
          <div className={styles.photoFeed}>
            {journalEntries.length === 0 && (
              <div className={styles.mutedCard}>
                <div className={styles.sectionTitle}>No photos yet</div>
                <div className={styles.sectionSubtitle}>Capture your first daily update below.</div>
              </div>
            )}

            {journalEntries.map((entry) => (
              <div key={entry.id} className={styles.journalCard}>
                <div className={styles.journalImage}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    style={{ position: "absolute", top: "0.75rem", right: "0.75rem", zIndex: 2 }}
                    onClick={() => handleDeleteEntry(entry.id)}
                  >
                    <TrashIcon />
                  </button>
                  <img src={entry.photo} alt={`Journal ${entry.date}`} />
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
        )}
      </div>

      <div style={{ position: "sticky", bottom: 0, padding: "1rem", background: "#ffffff", borderTop: "1px solid rgba(31, 41, 22, 0.08)" }}>
        <label htmlFor={fileInputId} className={styles.buttonPrimary} style={{ width: "100%" }}>
          <CameraIcon />
          Capture Daily Photo
        </label>
        <input id={fileInputId} type="file" accept="image/*" hidden onChange={handleAddPhoto} />
      </div>

      {assistantOpen && (
        <div className={styles.assistantOverlay} onClick={() => setAssistantOpen(false)}>
          <div className={styles.assistantSheet} onClick={(event) => event.stopPropagation()}>
            <div className={styles.sheetHead}>
              <div>
                <div className={styles.sectionTitle}>Gardening Assistant</div>
                <div className={styles.sectionSubtitle}>Quick help for {plant.name}</div>
              </div>
              <button type="button" className={styles.iconButton} onClick={() => setAssistantOpen(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className={styles.assistMessages}>
              <div className={styles.assistBubbleBot}>
                I checked the latest journal entry. The main signal is {plant.health === "warning" ? "heat stress" : "stable growth"}.
              </div>
              <div className={styles.assistBubble}>
                What should I do next?
              </div>
              <div className={styles.assistBubbleBot}>
                Prioritize: {plant.nextWatering}. After that, {plant.nextFertilizing.toLowerCase()}.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SharedPlantScreen({ plant }: { plant: Plant }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SharedDetailTab>("Timeline");
  const timeline = getTimelineForPlant(plant);

  return (
    <div className={styles.detailScreen}>
      <div className={styles.detailHero}>
        <img src={plant.imageUrl} alt={plant.name} />
        <div className={styles.detailOverlay} />
        <div className={styles.detailTopControls}>
          <button
            type="button"
            className={styles.glassButton}
            onClick={() => router.push("/community")}
          >
            <ArrowLeftIcon />
          </button>
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
        <MetricBox label="Days Growing" value={`${plant.daysGrowing}`} accent="default" />
        <MetricBox
          label="Days to Harvest"
          value={`${Math.max(0, plant.harvestDays - plant.daysGrowing)}`}
          accent="default"
        />
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
                      <div className={styles.metaText}>{new Date(stage.date).toLocaleDateString()}</div>
                    </div>
                    <div className={styles.timePill}>Day {stage.day}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Journal" && (
          <div className={styles.photoFeed}>
            {plant.journal.map((entry) => (
              <div key={entry.id} className={styles.journalCard}>
                <div className={styles.journalImage}>
                  <img src={entry.photo} alt={`Shared entry ${entry.date}`} />
                </div>
                <div className={styles.journalBody}>
                  <div className={styles.plantName}>{new Date(entry.date).toLocaleDateString()}</div>
                  <div className={styles.captionText} style={{ marginTop: "0.5rem" }}>
                    {entry.aiAnalysis.recommendation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.screenPadded} style={{ paddingTop: 0 }}>
        <div className={styles.mutedCard}>
          <div className={styles.captionText}>
            This is a shared view of someone else&apos;s garden. You can inspect the growth history but
            you cannot modify this plant.
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScanScreen() {
  const router = useRouter();
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
      <header className={styles.screenHeader}>
        <div>
          <div className={styles.screenHeaderTitle}>Scan Your Space</div>
          <div className={styles.screenHeaderMeta}>Mock AI scan flow from the original CITYFARM app.</div>
        </div>
        <button type="button" className={styles.iconButton} onClick={() => router.push("/home")}>
          <CloseIcon />
        </button>
      </header>

      {scanStep === "camera" && (
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
      )}

      {scanStep === "analyzing" && (
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
      )}

      {scanStep === "results" && (
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
                      <img src={plant.imageUrl} alt={plant.name} />
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
      )}

      {scanStep === "visualization" && selectedRecommendation && (
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
              <img
                className={styles.visualizationPlant}
                src={selectedRecommendation.imageUrl}
                alt={selectedRecommendation.name}
              />
              <div className={styles.visualizationCaption}>
                <div className={styles.plantName}>{selectedRecommendation.name}</div>
                <div className={styles.captionText}>
                  {selectedRecommendation.reason}
                </div>
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
      )}
    </div>
  );
}

export function CommunityScreen() {
  const [activeTab, setActiveTab] = useState<CommunityTab>("feed");
  const [feedFilter, setFeedFilter] = useState<PostType | "all">("all");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [isCommunityLoading, setIsCommunityLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [postType, setPostType] = useState<"caption" | "image" | "plant">("caption");
  const [caption, setCaption] = useState("");
  const [selectedPlantId, setSelectedPlantId] = useState(getPlants()[0]?.id ?? "");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetComposer = () => {
    setCaption("");
    setPostType("caption");
    setSelectedImage(null);
    setSelectedFile(null);
    setIsCreating(false);
  };

  const reloadCommunityData = async (activeRef?: { current: boolean }) => {
    try {
      setIsCommunityLoading(true);
      const result = await loadCommunityData();

      if (activeRef && !activeRef.current) {
        return;
      }

      setPosts(result.posts);
      setListings(result.listings);
    } finally {
      if (!activeRef || activeRef.current) {
        setIsCommunityLoading(false);
      }
    }
  };

  useEffect(() => {
    const activeRef = { current: true };

    void reloadCommunityData(activeRef);

    return () => {
      activeRef.current = false;
    };
  }, []);


  const filteredPosts =
    feedFilter === "all" ? posts : posts.filter((post) => post.postType === feedFilter);

  const handleLike = async (postId: string) => {
    const currentPost = posts.find((post) => post.id === postId);
    const wasLiked = Boolean(currentPost?.isLiked);
    const optimisticLiked = !wasLiked;

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: optimisticLiked,
              likes: optimisticLiked ? post.likes + 1 : Math.max(post.likes - 1, 0),
            }
          : post,
      ),
    );

    const actualLiked = await toggleReaction(postId);
    if (actualLiked === optimisticLiked) {
      return;
    }

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: actualLiked,
              likes: actualLiked ? post.likes + 1 : Math.max(post.likes - 1, 0),
            }
          : post,
      ),
    );
  };

  const handleCreatePost = async () => {
    if (!caption.trim()) {
      return;
    }

    let imageAssetId: string | undefined = undefined;

    if (postType === "image" && selectedFile) {
      try {
        const asset = await uploadAsset(selectedFile, "POST_IMAGE");
        imageAssetId = asset.id;
      } catch (error) {
        console.error("Failed to upload image:", error);
        alert("Có lỗi khi tải ảnh lên. Vui lòng thử lại.");
        return;
      }
    }

    const newPost = await createPost({
      postType: postType === "plant" ? PostType.PLANT_SHARE : PostType.SHOWCASE,
      caption,
      imageAssetId,
      gardenPlantId: postType === "plant" ? selectedPlantId : undefined,
    });

    setPosts((current) => [newPost, ...current]);
    resetComposer();
  };

  return (
    <div className={styles.screen}>
      <header className={`${styles.screenHeader} ${styles.screenHeaderTall}`}>
        <div className={styles.screenHeaderMain}>
          <div>
            <div className={styles.screenHeaderTitle}>Community</div>
            <div className={styles.screenHeaderMeta}>
              Feed &amp; Marketplace
            </div>
          </div>
          <div className={styles.headerActions}>
            {activeTab === "feed" && (
              <button type="button" className={styles.iconButton} onClick={() => setIsCreating(true)}>
                <PlusIcon />
              </button>
            )}
            <button type="button" className={styles.iconButton}>
              <SearchIcon />
            </button>
          </div>
        </div>
        
        <div className={styles.headerTabs}>
          <button
            type="button"
            className={activeTab === "feed" ? styles.headerTabActive : styles.headerTab}
            onClick={() => setActiveTab("feed")}
          >
            Social Feed
          </button>
          <button
            type="button"
            className={activeTab === "market" ? styles.headerTabActive : styles.headerTab}
            onClick={() => setActiveTab("market")}
          >
            Fresh Market
          </button>
        </div>
      </header>

      <div className={styles.screenPadded}>

        {activeTab === "feed" && (
          <div className={styles.section} style={{ marginTop: 0 }}>
            <div className={styles.filterRow}>
              <button
                type="button"
                className={feedFilter === "all" ? styles.filterChipActive : styles.filterChip}
                onClick={() => setFeedFilter("all")}
              >
                All Posts
              </button>
              <button
                type="button"
                className={feedFilter === PostType.SHOWCASE ? styles.filterChipActive : styles.filterChip}
                onClick={() => setFeedFilter(PostType.SHOWCASE)}
              >
                <CameraIcon />
                Showcase
              </button>
              <button
                type="button"
                className={
                  feedFilter === PostType.QUESTION ? styles.filterChipQuestionActive : `${styles.filterChip} ${styles.filterChipQuestion}`
                }
                onClick={() => setFeedFilter(PostType.QUESTION)}
              >
                <HelpIcon />
                Q&amp;A
              </button>
            </div>

            <div className={styles.postFeed}>
              {isCommunityLoading && <div className={styles.metaText}>Loading community...</div>}
              {!isCommunityLoading && filteredPosts.length === 0 && (
                <div className={styles.metaText}>No posts available yet.</div>
              )}
              {filteredPosts.map((post) => (
                <div key={post.id} className={styles.postCard}>
                  <div className={styles.postHeader}>
                    <div className={styles.feedHead}>
                      <div className={styles.avatarRow}>
                        <Avatar name={post.user.username} />
                        <div>
                          <div className={styles.headerRow}>
                            <div className={styles.plantName}>{post.user.username}</div>
                            {post.postType === PostType.QUESTION && <div className={styles.questionPill}>Question</div>}
                            {post.postType === PostType.PLANT_SHARE && <div className={styles.sharePill}>Plant Share</div>}
                          </div>
                          <div className={styles.feedMetaText}>{post.user.district}</div>
                        </div>
                      </div>
                      <div className={styles.feedMetaText}>
                        {new Date(post.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  {post.postType !== PostType.QUESTION && (post.imageUrl || post.imageAssetId) && (
                    <div className={styles.postImage}>
                      <img src={post.imageUrl || post.imageAssetId} alt={post.caption} />
                    </div>
                  )}

                  {post.postType === PostType.PLANT_SHARE && post.gardenPlantId && getPlantById(post.gardenPlantId) && (
                    <Link href={`/community/shared/${post.gardenPlantId}`} className={styles.shareImage}>
                      <img src={getPlantById(post.gardenPlantId)?.imageUrl} alt={post.caption} />
                    </Link>
                  )}

                  <div className={styles.postBody}>
                    <div className={styles.postActions}>
                      <button type="button" className={styles.ghostButton} onClick={() => void handleLike(post.id)}>
                        <HeartIcon filled={post.isLiked} />
                      </button>
                      <span className={styles.metaText}>{post.likes} likes</span>
                      <span className={styles.metaText}>{post.comments} comments</span>
                    </div>
                    <div className={styles.captionText}>
                      <strong>{post.user.username}</strong> {post.caption}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "market" && (
          <div className={styles.section} style={{ marginTop: 0 }}>
            <div className={styles.marketBanner}>
              <div className={styles.marketBannerTitle}>Fresh Market</div>
              <div className={styles.marketBannerText}>
                Buy and sell verified home-grown produce with planting logs attached.
              </div>
            </div>

            <div className={styles.listingFeed} style={{ marginTop: "1rem" }}>
              {!isCommunityLoading && listings.length === 0 && (
                <div className={styles.metaText}>No marketplace listings available.</div>
              )}
              {listings.map((listing) => (
                <div key={listing.id} className={styles.listingCard}>
                  <div className={styles.listingBody}>
                    <div className={styles.listingRow}>
                      <div className={styles.listingImage}>
                        <img src={listing.imageAssetId} alt={listing.product} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className={styles.listingHead}>
                          <div>
                            <div className={styles.plantName}>{listing.product}</div>
                            <div className={styles.metaText}>
                              {listing.quantity} • {new Date(listing.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </div>
                          </div>
                          <div className={styles.matchPill}>₫{listing.priceAmount.toLocaleString()}</div>
                        </div>
                        <div className={styles.captionText} style={{ marginTop: "0.55rem" }}>
                          {listing.description}
                        </div>
                        <div className={styles.tagRow} style={{ marginTop: "0.75rem" }}>
                          <span className={styles.tag}>{listing.seller.username}</span>
                          <span className={styles.tag}>{listing.seller.district}</span>
                          {listing.seller.verifiedGrower && <span className={styles.verifiedPill}>Verified Grower</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isCreating && (
        <div className={styles.composerOverlay} onClick={resetComposer}>
          <div className={styles.composerSheet} onClick={(event) => event.stopPropagation()}>
            <div className={styles.sheetHead}>
              <div>
                <div className={styles.sectionTitle}>Create Post</div>
                <div className={styles.sectionSubtitle}>Share a progress update or ask a question.</div>
              </div>
              <button type="button" className={styles.iconButton} onClick={resetComposer}>
                <CloseIcon />
              </button>
            </div>

            <div className={styles.orderTabs}>
              <button
                type="button"
                className={postType === "caption" ? styles.filterChipActive : styles.filterChip}
                onClick={() => setPostType("caption")}
              >
                Caption
              </button>
              <button
                type="button"
                className={postType === "image" ? styles.filterChipActive : styles.filterChip}
                onClick={() => setPostType("image")}
              >
                Image
              </button>
              <button
                type="button"
                className={postType === "plant" ? styles.filterChipActive : styles.filterChip}
                onClick={() => setPostType("plant")}
              >
                Plant Share
              </button>
            </div>

            <div className={styles.section}>
              <textarea
                className={styles.textarea}
                placeholder="Write your update..."
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
              />
            </div>

            {postType === "image" && (
              <div className={styles.section}>
                <div className={styles.sectionSubtitle}>Select an image to share</div>
                <div 
                  className={styles.imagePlaceholder} 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    backgroundImage: selectedImage ? `url(${selectedImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer',
                    minHeight: '220px',
                    borderRadius: '1.25rem',
                    backgroundColor: '#f1f6ec',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed #37542d33',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {!selectedImage && (
                    <div className="flex flex-col items-center gap-3 text-[#37542d]">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <PlusIcon />
                      </div>
                      <span className="text-sm font-bold opacity-80">Tap to upload photo</span>
                    </div>
                  )}
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageChange}
                  />
                </div>
              </div>
            )}

            {postType === "plant" && (
              <div className={styles.section}>
                <div className={styles.sectionSubtitle}>Select a plant to share</div>
                <div className={styles.gridTwo}>
                  {getPlants().map((plant) => (
                    <button
                      key={plant.id}
                      type="button"
                      className={styles.selectorCard}
                      onClick={() => setSelectedPlantId(plant.id)}
                      style={{
                        outline: selectedPlantId === plant.id ? "2px solid #567a3d" : "none",
                      }}
                    >
                      <div className={styles.selectorBody}>
                        <div className={styles.avatarRow}>
                          <div className={styles.plantThumb} style={{ width: "3.25rem", height: "3.25rem" }}>
                            <img src={plant.imageUrl} alt={plant.name} />
                          </div>
                          <div>
                            <div className={styles.plantName}>{plant.name}</div>
                            <div className={styles.metaText}>Day {plant.daysGrowing}</div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.section} style={{ display: "grid", gap: "0.75rem" }}>
              <button type="button" className={styles.buttonPrimary} onClick={() => void handleCreatePost()}>
                Publish Post
              </button>
              <button type="button" className={styles.buttonOutline} onClick={resetComposer}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderScreen({ initialSeed }: { initialSeed?: string | null }) {
  const router = useRouter();
  const [productType, setProductType] = useState<ProductType>("kit");
  const [step, setStep] = useState<OrderStep>("select");
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [selectedSeed, setSelectedSeed] = useState<(typeof seeds)[number] | null>(null);
  const [selectedDirt, setSelectedDirt] = useState<(typeof dirtOptions)[number] | null>(null);
  const [selectedPot, setSelectedPot] = useState<(typeof potOptions)[number] | null>(null);
  const [generatedCode, setGeneratedCode] = useState("");

  useEffect(() => {
    const seedQuery = initialSeed;
    if (!seedQuery) {
      return;
    }

    const matchedSeed =
      seeds.find((seed) => seed.id === seedQuery.toUpperCase()) ??
      seeds.find((seed) => seed.name.toLowerCase().includes(seedQuery.toLowerCase())) ??
      null;

    if (matchedSeed) {
      setSelectedSeed(matchedSeed);
      setProductType("kit");
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
    <div className={styles.screen}>
      <header className={styles.screenHeader}>
        <div className={styles.headerRow}>
          {step !== "select" && (
            <button type="button" className={styles.backButton} onClick={() => setStep("select")}>
              <ArrowLeftIcon />
            </button>
          )}
          <div>
            <div className={styles.screenHeaderTitle}>
              {step === "select" ? "Shop" : step === "confirm" ? "Confirm Order" : "Order Placed!"}
            </div>
            <div className={styles.screenHeaderMeta}>Starter kits, seeds, soil and recycled pots.</div>
          </div>
        </div>
      </header>

      <div className={styles.orderPage}>
        {step === "select" && (
          <>
            <div className={styles.orderTabs}>
              <OrderTab label="Kits" icon={<BagIcon />} active={productType === "kit"} onClick={() => setProductType("kit")} />
              <OrderTab label="Seeds" icon={<SproutIcon />} active={productType === "seed"} onClick={() => setProductType("seed")} />
              <OrderTab label="Soil" icon={<DropletIcon />} active={productType === "dirt"} onClick={() => setProductType("dirt")} />
              <OrderTab label="Pots" icon={<RecycleIcon />} active={productType === "pot"} onClick={() => setProductType("pot")} />
            </div>

            <div className={styles.section}>
              {productType === "kit" && (
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
                          <img src={kit.image} alt={kit.name} />
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
              )}

              {productType === "seed" && (
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
              )}

              {productType === "dirt" && (
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
              )}

              {productType === "pot" && (
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
              )}
            </div>
          </>
        )}

        {step === "confirm" && selectedProduct && (
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Order Summary</div>
            <div className={styles.summaryRow}>
              {hasImagePreview(selectedProduct) ? (
                <div className={styles.summaryThumb}>
                  <img src={selectedProduct.image} alt={selectedProduct.name} />
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

            {"components" in selectedProduct && (
              <div className={styles.tagRow} style={{ marginTop: "1rem" }}>
                {selectedProduct.components.map((component) => (
                  <span key={component} className={styles.tag}>
                    {component}
                  </span>
                ))}
              </div>
            )}

            <div className={styles.section} style={{ display: "grid", gap: "0.75rem" }}>
              <button type="button" className={styles.buttonPrimary} onClick={handleOrder}>
                Confirm Order
              </button>
              <button type="button" className={styles.buttonOutline} onClick={() => setStep("select")}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === "success" && (
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
              <button type="button" className={styles.buttonPrimary} onClick={() => router.push("/garden")}>
                Go to My Garden
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HealthBadge({ health }: { health: PlantHealth }) {
  if (health === "healthy") {
    return <span className={`${styles.healthPill} ${styles.healthPillHealthy}`}>Healthy</span>;
  }

  if (health === "warning") {
    return <span className={`${styles.healthPill} ${styles.healthPillWarning}`}>Warning</span>;
  }

  return <span className={`${styles.healthPill} ${styles.healthPillCritical}`}>Critical</span>;
}

function MetricBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "green" | "default";
}) {
  return (
    <div className={styles.metricBox}>
      <div
        className={styles.metricBoxValue}
        style={{ color: accent === "green" ? "#567a3d" : "#24301c" }}
      >
        {value}
      </div>
      <div className={styles.metricBoxLabel}>{label}</div>
    </div>
  );
}

function AnalyzeStep({
  icon,
  active,
  label,
}: {
  icon: React.ReactNode;
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

function AnalysisMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={styles.analysisMetric}>
      <div className={styles.headerRow}>
        {icon}
        <span className={styles.analysisMetricLabel}>{label}</span>
      </div>
      <div className={styles.analysisMetricValue}>{value}</div>
    </div>
  );
}

function OrderTab({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? styles.filterChipActive : styles.filterChip}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function Avatar({ name }: { name: string }) {
  const parts = name.split(" ").filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return <div className={styles.avatar}>{initials}</div>;
}

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

function getReminderIcon(icon: "water" | "sun" | "check") {
  if (icon === "water") {
    return <DropletIcon />;
  }
  if (icon === "sun") {
    return <SunIcon />;
  }
  return <CheckIcon />;
}

type ShopItem = Kit | (typeof seeds)[number] | (typeof dirtOptions)[number] | (typeof potOptions)[number];
