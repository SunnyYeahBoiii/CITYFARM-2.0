"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { HomeData } from "@/lib/home-server";
import { gardenApi } from "@/lib/api/garden.api";
import type { GardenPlantSummary, GardenStats } from "@/lib/types/garden";
import { WeatherWidget } from "./WeatherWidget";
import {
  BagIcon,
  CameraIcon,
  CheckIcon,
  DropletIcon,
  MessageIcon,
  PinIcon,
  SunIcon,
} from "../shared/icons";
import { Avatar, CityImage, HealthBadge, cn } from "../shared/ui";

type HomeTaskIcon = HomeData["careTasks"][number]["icon"];

function diffInDays(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));
}

function formatTime(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

function formatShortDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(isoDate));
}

function formatRelativeDay(isoDate: string): string {
  const target = new Date(isoDate);
  const startOfToday = new Date();
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const startOfCurrent = new Date(
    startOfToday.getFullYear(),
    startOfToday.getMonth(),
    startOfToday.getDate(),
  ).getTime();
  const dayDiff = Math.round((startOfTarget - startOfCurrent) / (1000 * 60 * 60 * 24));

  if (dayDiff < 0) return `Overdue · ${formatTime(isoDate)}`;
  if (dayDiff === 0) return `Today · ${formatTime(isoDate)}`;
  if (dayDiff === 1) return `Tomorrow · ${formatTime(isoDate)}`;
  return `${formatShortDate(isoDate)} · ${formatTime(isoDate)}`;
}

function fallbackPlantImage(category: string): string {
  const normalized = category.toLowerCase();
  if (normalized.includes("herb")) return "/cityfarm/img/mint.png";
  if (normalized.includes("onion") || normalized.includes("allium")) return "/cityfarm/img/onion.png";
  if (normalized.includes("leaf") || normalized.includes("green") || normalized.includes("lettuce")) {
    return "/cityfarm/img/lettuce.png";
  }
  return "/cityfarm/img/tomato.png";
}

function mapPlantHealth(status: GardenPlantSummary["healthStatus"]): "healthy" | "warning" | "critical" {
  if (status === "HEALTHY") return "healthy";
  if (status === "CRITICAL") return "critical";
  return "warning";
}

function buildPlantCards(plants: GardenPlantSummary[]): HomeData["plants"] {
  return plants
    .filter((plant) => plant.status === "ACTIVE" || plant.status === "HARVEST_READY")
    .slice(0, 3)
    .map((plant) => {
      const timeline = plant.plantSpecies.careProfile?.growthTimeline;
      let harvestDays = plant.plantSpecies.harvestDaysMin ?? plant.plantSpecies.harvestDaysMax ?? 60;
      if (timeline && timeline.length > 0) {
        const cumulativeDays = timeline.reduce((acc, stage) => acc + (stage.days || 0), 0);
        harvestDays = Math.max(cumulativeDays, plant.plantSpecies.harvestDaysMin ?? 0);
      }

      const daysGrowing = Math.max(0, diffInDays(plant.plantedAt));
      const progress = Math.min(100, Math.round((daysGrowing / harvestDays) * 100));
      const imageUrl = plant.plantSpecies.products[0]?.coverAsset?.publicUrl ?? fallbackPlantImage(plant.plantSpecies.category);
      const nextTask = plant.careTasks[0];

      return {
        id: plant.id,
        name: plant.nickname || plant.plantSpecies.commonName,
        subtitle: `Day ${daysGrowing} of ${harvestDays}`,
        health: mapPlantHealth(plant.healthStatus),
        imageUrl,
        progress,
        taskLabel: nextTask ? nextTask.title : "No tasks scheduled",
      };
    });
}

function buildTaskCards(plants: GardenPlantSummary[]): HomeData["careTasks"] {
  return plants
    .flatMap((plant) =>
      plant.careTasks.map((task) => {
        const icon: HomeTaskIcon =
          task.taskType === "WATERING" ? "water" : task.taskType === "PEST_CHECK" ? "sun" : "check";

        return {
        id: task.id,
        gardenPlantId: plant.id,
        plantName: plant.nickname || plant.plantSpecies.commonName,
        action: task.title,
        timeLabel: formatRelativeDay(task.dueAt),
        dueAt: new Date(task.dueAt).getTime(),
        icon,
      };
      }),
    )
    .filter((task) => {
      const now = new Date();
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
      return task.dueAt <= endOfToday;
    })
    .sort((left, right) => left.dueAt - right.dueAt)
    .slice(0, 3)
    .map((task) => ({
      id: task.id,
      gardenPlantId: task.gardenPlantId,
      plantName: task.plantName,
      action: task.action,
      timeLabel: task.timeLabel,
      icon: task.icon,
    }));
}

function buildStats(stats: GardenStats): HomeData["stats"] {
  return [
    { label: "Active Plants", value: `${stats.totalPlants}`, tone: "green" },
    { label: "Needs Attention", value: `${stats.needsAttention}`, tone: "amber" },
    { label: "Care Rate", value: `${stats.careRate}%`, tone: "blue" },
  ];
}

function getTaskIcon(icon: "water" | "sun" | "check") {
  if (icon === "water") {
    return <DropletIcon />;
  }

  if (icon === "sun") {
    return <SunIcon />;
  }

  return <CheckIcon />;
}

function statToneClass(tone: "green" | "blue" | "amber") {
  if (tone === "green") {
    return "bg-emerald-50";
  }

  if (tone === "blue") {
    return "bg-sky-50";
  }

  return "bg-amber-50";
}

export function HomeScreen({ data }: { data: HomeData }) {
  const [livePlants, setLivePlants] = useState(data.plants);
  const [liveCareTasks, setLiveCareTasks] = useState(data.careTasks);
  const [liveStats, setLiveStats] = useState(data.stats);

  useEffect(() => {
    let isMounted = true;
    const fetchGardenData = async () => {
      try {
        const [plants, stats] = await Promise.all([gardenApi.getMyGarden(), gardenApi.getGardenStats()]);
        if (!isMounted) return;
        setLivePlants(buildPlantCards(plants));
        setLiveCareTasks(buildTaskCards(plants));
        setLiveStats(buildStats(stats));
      } catch {
        // Keep server-rendered fallback data when client-side refresh fails.
      }
    };

    void fetchGardenData();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayData = useMemo(
    () => ({
      ...data,
      plants: livePlants,
      careTasks: liveCareTasks,
      stats: liveStats,
    }),
    [data, liveCareTasks, livePlants, liveStats],
  );

  const hasPlants = displayData.plants.length > 0;
  const hasMarketData = data.marketListings.length > 0;
  const hasCommunityPost = Boolean(data.latestPost);

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#f1f6ec_0%,#ffffff_44%)] pb-6">
      <div className="px-4 pt-4">
        <section className="overflow-hidden rounded-[1.55rem] bg-[linear-gradient(145deg,#537a3d,#355327)] p-4.5 text-white shadow-[0_18px_44px_rgba(53,83,39,0.22)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">Daily launchpad</p>
              <h2 className="mt-1.5 text-xl font-black">Start Your Garden</h2>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-white/15 text-sm text-white">CF</div>
          </div>
          <p className="mt-3 text-[13px] leading-5 text-white/78">
            Scan your space, activate a kit, and keep every care task moving from one mobile home screen.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link
              href="/scan"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-(--color-green-deep) shadow-[0_10px_22px_rgba(0,0,0,0.12)]"
            >
              <CameraIcon />
              Scan Your Space
            </Link>
            <Link
              href="/order"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2.5 text-sm font-bold text-white"
            >
              <BagIcon />
              Browse kits
            </Link>
          </div>
        </section>

        <WeatherWidget />

        <section className="mt-4">
          <div className="mb-2.5 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-extrabold text-(--color-heading)">Today&apos;s Care Tasks</h3>
              <p className="text-xs text-(--color-muted)">
                {displayData.careTasks.length > 0
                  ? "Sorted from the soonest task in your real garden data."
                  : "No pending task yet. Add a kit and the home feed will start guiding care."}
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {displayData.careTasks.length} pending
            </span>
          </div>
          {displayData.careTasks.length > 0 ? (
            <div className="grid gap-2.5">
              {displayData.careTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/garden/${task.gardenPlantId}?tab=Care`}
                  className="flex items-center justify-between gap-3 rounded-[1rem] border border-[rgba(31,41,22,0.08)] bg-white p-3 shadow-[0_8px_20px_rgba(33,49,30,0.06)] active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-interactive-bg) text-(--color-green-deep)">
                      {getTaskIcon(task.icon)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-(--color-heading)">{task.plantName}</div>
                      <div className="text-xs text-(--color-muted)">{task.action}</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-(--color-screen) px-3 py-1 text-xs font-semibold text-(--color-interactive-ink)">
                    {task.timeLabel}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[1rem] border border-dashed border-[rgba(31,41,22,0.12)] bg-white px-4 py-5 shadow-[0_8px_20px_rgba(33,49,30,0.04)]">
              <div className="text-sm font-bold text-(--color-heading)">Nothing to water or trim yet.</div>
              <p className="mt-1.5 text-xs leading-5 text-(--color-muted)">
                Once you activate a plant, care tasks from the backend will appear here automatically.
              </p>
              <Link
                href="/order"
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-(--color-green-deep) px-4 py-2.5 text-sm font-bold text-white"
              >
                Shop starter kits
              </Link>
            </div>
          )}
        </section>

        <section className="mt-4">
          <div className="mb-2.5 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-extrabold text-(--color-heading)">My Garden</h3>
              <p className="text-xs text-(--color-muted)">
                {hasPlants
                  ? "Tap a plant to open the full care view."
                  : "Your home is empty right now. Add a kit to start tracking real plants."}
              </p>
            </div>
            <Link href="/garden" className="text-xs font-bold uppercase tracking-[0.08em] text-(--color-green-deep)">
              View All
            </Link>
          </div>

          {hasPlants ? (
            <div className="grid gap-2.5">
              {displayData.plants.map((plant) => (
                <Link
                  key={plant.id}
                  href={`/garden/${plant.id}`}
                  className="rounded-[1rem] border border-[rgba(31,41,22,0.08)] bg-white p-3 shadow-[0_8px_20px_rgba(33,49,30,0.06)]"
                >
                  <div className="flex gap-3">
                    <CityImage
                      src={plant.imageUrl}
                      alt={plant.name}
                      sizes="96px"
                      fit="cover"
                      className="h-[4.5rem] w-[4.5rem] rounded-[1rem] bg-[linear-gradient(145deg,#eef5e9,#f8fbf5)]"
                      priority
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[15px] font-extrabold text-(--color-heading)">{plant.name}</div>
                          <div className="text-xs text-(--color-muted)">{plant.subtitle}</div>
                        </div>
                        <HealthBadge health={plant.health} />
                      </div>
                      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-(--color-screen)">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#567a3d,#89a963)]"
                          style={{ width: `${plant.progress}%` }}
                        />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between gap-3 text-xs">
                        <span className="text-(--color-muted)">{plant.taskLabel}</span>
                        <span className="font-bold uppercase tracking-[0.08em] text-(--color-green-deep)">Open</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-[rgba(31,41,22,0.12)] bg-white p-4 shadow-[0_8px_20px_rgba(33,49,30,0.04)]">
              <div className="text-sm font-bold text-(--color-heading)">No active plants in your account.</div>
              <p className="mt-1.5 text-xs leading-5 text-(--color-muted)">
                Buy a starter kit or activate a code to turn this home screen into a live care dashboard.
              </p>
              <Link
                href="/order"
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-(--color-green-deep) px-4 py-2.5 text-sm font-bold text-white"
              >
                Buy a kit
              </Link>
            </div>
          )}
        </section>

        {!hasPlants && data.starterKits.length > 0 ? (
          <section className="mt-4">
            <div className="mb-2.5 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-extrabold text-(--color-heading)">Starter Kits</h3>
                <p className="text-xs text-(--color-muted)">Real products from the shop to get your garden moving.</p>
              </div>
              <Link href="/order" className="text-xs font-bold uppercase tracking-[0.08em] text-(--color-green-deep)">
                Shop All
              </Link>
            </div>
            <div className="grid gap-2.5">
              {data.starterKits.map((kit) => (
                <Link
                  key={kit.id}
                  href="/order"
                  className="rounded-[1rem] border border-[rgba(31,41,22,0.08)] bg-white p-3 shadow-[0_8px_20px_rgba(33,49,30,0.06)]"
                >
                  <div className="flex gap-3">
                    <CityImage
                      src={kit.imageUrl}
                      alt={kit.name}
                      sizes="88px"
                      className="h-[4.5rem] w-[4.5rem] rounded-[1rem] bg-[linear-gradient(145deg,#f4f1ea,#fbfaf7)]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-extrabold text-(--color-heading)">{kit.name}</div>
                          <div className="mt-1 text-xs leading-5 text-(--color-muted)">
                            {kit.description || "Compact setup for balconies and small indoor corners."}
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                          {kit.price}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-4 grid grid-cols-3 gap-2.5">
          {displayData.stats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "rounded-[1rem] border border-[rgba(31,41,22,0.08)] px-2.5 py-3 text-center",
                statToneClass(stat.tone),
              )}
            >
              <div className="text-lg font-extrabold text-(--color-heading)">{stat.value}</div>
              <div className="mt-0.5 text-[11px] font-medium leading-4 text-(--color-muted)">{stat.label}</div>
            </div>
          ))}
        </section>

        <section className="mt-4 rounded-[1.25rem] border border-[rgba(31,41,22,0.08)] bg-[linear-gradient(135deg,#e8e3d9,#d6e4d0)] p-4 shadow-[0_8px_20px_rgba(33,49,30,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-extrabold text-(--color-heading)">Local Green Pulse</h3>
              <p className="mt-1.5 text-xs leading-5 text-(--color-muted)">
                Fresh marketplace activity and the newest community post, directly from real backend data.
              </p>
            </div>
            <Link
              href="/community"
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-[rgba(69,97,54,0.18)] bg-white px-4 py-2.5 text-sm font-bold text-(--color-green-deep)"
            >
              Browse Community
            </Link>
          </div>

          {hasMarketData || hasCommunityPost ? (
            <div className="mt-4 grid gap-3">
              {hasMarketData ? (
                <div className="grid gap-2.5">
                  {data.marketListings.map((listing) => (
                    <Link
                      key={listing.id}
                      href="/community"
                      className="rounded-[1rem] border border-white/55 bg-white/80 p-3 backdrop-blur"
                    >
                      <div className="flex items-center gap-3">
                        {listing.imageUrl ? (
                          <CityImage
                            src={listing.imageUrl}
                            alt={listing.title}
                            sizes="64px"
                            className="h-14 w-14 rounded-[0.9rem] bg-white"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-[0.9rem] bg-white text-(--color-green-deep)">
                            <BagIcon />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-extrabold text-(--color-heading)">{listing.title}</div>
                              <div className="mt-1 flex items-center gap-1 text-[11px] text-(--color-muted)">
                                <PinIcon size={14} />
                                <span>
                                  {listing.sellerName} · {listing.district}
                                </span>
                              </div>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                              {listing.price}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-(--color-muted)">
                            <span>{listing.quantity}</span>
                            <span>{listing.createdLabel}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}

              {data.latestPost ? (
                <Link href="/community" className="rounded-[1rem] border border-white/55 bg-white/80 p-3 backdrop-blur">
                  <div className="flex items-start gap-3">
                    <Avatar name={data.latestPost.author} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-extrabold text-(--color-heading)">{data.latestPost.author}</div>
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-(--color-muted)">
                            <PinIcon size={14} />
                            <span>{data.latestPost.district}</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-(--color-muted)">{data.latestPost.createdLabel}</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-(--color-heading)">{data.latestPost.caption}</p>
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-(--color-muted)">
                        <MessageIcon size={14} />
                        <span>{data.latestPost.engagement}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 rounded-[1rem] border border-dashed border-[rgba(31,41,22,0.12)] bg-white/75 px-4 py-5">
              <div className="text-sm font-bold text-(--color-heading)">Community activity will appear here when data is available.</div>
              <p className="mt-1.5 text-xs leading-5 text-(--color-muted)">
                When growers publish listings or share updates, the home screen will surface the latest pulse automatically.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
