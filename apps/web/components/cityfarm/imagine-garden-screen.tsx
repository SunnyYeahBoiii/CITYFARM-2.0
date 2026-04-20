"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import type { SVGProps } from "react";
import { useEffect, useMemo, useState } from "react";
import { getPlants, type Plant } from "../../lib/cityfarm-data";

type PlantHealth = Plant["health"];

const simulatedCodes = [
  "CITYFARM-TOMATO-01",
  "CITYFARM-LETTUCE-02",
  "CITYFARM-MINT-03",
  "CITYFARM-ONION-04",
];

const healthStyles: Record<PlantHealth, string> = {
  healthy: "bg-emerald-500/90",
  warning: "bg-amber-500/90",
  critical: "bg-rose-600/90",
};

function IconSeedling(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...props}>
      <path d="M12 20V11" />
      <path d="M12 11C9 11 6.5 8.5 6.5 5.5 9.5 5.5 12 8 12 11Z" />
      <path d="M12 11c3 0 5.5-2.5 5.5-5.5-3 0-5.5 2.5-5.5 5.5Z" />
      <path d="M8 20h8" />
    </svg>
  );
}

function IconPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconWater(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...props}>
      <path d="M12 3C9 7 6.5 9.8 6.5 13.3A5.5 5.5 0 0 0 12 18.8a5.5 5.5 0 0 0 5.5-5.5C17.5 9.8 15 7 12 3Z" />
    </svg>
  );
}

function IconSun(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
    </svg>
  );
}

function IconArrowRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function IconClose(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function IconLoader(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M21 12a9 9 0 1 1-9-9" />
    </svg>
  );
}

function makeActivatedPlant(base: Plant, code: string): Plant {
  const now = Date.now();
  return {
    ...base,
    id: `${base.id}-kit-${now}`,
    code,
    note: "Activated from smart kit.",
    daysGrowing: 1,
    progress: 2,
    plantedDate: new Date().toISOString().slice(0, 10),
    nextWatering: "Today, 6:00 PM",
    nextFertilizing: "In 4 days",
  };
}

export function ImagineGardenScreen() {
  const router = useRouter();
  const starterPlants = useMemo(() => getPlants(), []);
  const [plants, setPlants] = useState<Plant[]>(starterPlants);
  const [isScanning, setIsScanning] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isBooting, setIsBooting] = useState(true);

  const featuredPlant = starterPlants[0];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsBooting(false);
    }, 900);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsScanning(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const stats = useMemo(() => {
    return {
      totalPlants: plants.length,
      healthyPlants: plants.filter((plant) => plant.health === "healthy").length,
      needsAttention: plants.filter((plant) => plant.health === "warning").length,
      avgCareRate: Math.max(
        76,
        Math.round(plants.reduce((acc, plant) => acc + plant.progress, 0) / Math.max(1, plants.length)),
      ),
    };
  }, [plants]);

  const handleScanSubmit = async (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      return;
    }

    setIsProcessing(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 700);
    });

    const matchedPlant = starterPlants.find((plant) => plant.code === normalized) ?? starterPlants[0];

    if (matchedPlant) {
      setPlants((current) => [makeActivatedPlant(matchedPlant, normalized), ...current]);
      setIsScanning(false);
      setScanInput("");
    }

    setIsProcessing(false);
  };

  if (isBooting) {
    return (
      <div className="relative min-h-full overflow-hidden bg-[radial-gradient(circle_at_10%_0%,rgba(56,189,130,0.25),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(252,211,77,0.2),transparent_30%),linear-gradient(180deg,#f4f8f1_0%,#eef4eb_45%,#e5efe0_100%)] pb-28">
        <div className="pointer-events-none absolute inset-x-0 top-[-8rem] h-56 bg-[radial-gradient(circle,rgba(22,163,74,0.25),transparent_65%)] blur-3xl" />

        <header className="sticky top-0 z-20 border-b border-emerald-900/10 bg-white/70 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="h-3 w-28 animate-pulse rounded-full bg-emerald-100" />
              <div className="h-7 w-60 animate-pulse rounded-full bg-emerald-200/80" />
              <div className="h-4 w-72 animate-pulse rounded-full bg-emerald-100" />
            </div>
            <div className="h-10 w-24 animate-pulse rounded-xl bg-white" />
          </div>
        </header>

        <div className="space-y-5 px-4 py-5 sm:px-6">
          <section className="rounded-3xl border border-white/80 bg-white/85 p-4 shadow-[0_16px_40px_rgba(26,58,38,0.08)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
                <div className="h-5 w-36 animate-pulse rounded-full bg-slate-100" />
              </div>
              <div className="h-7 w-20 animate-pulse rounded-full bg-emerald-100" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="h-28 animate-pulse rounded-2xl bg-emerald-50" />
              <div className="h-28 animate-pulse rounded-2xl bg-amber-50" />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_18px_44px_rgba(18,54,34,0.12)]">
            <div className="relative h-52 overflow-hidden bg-gradient-to-br from-emerald-100 via-emerald-50 to-lime-100">
              <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.9),transparent_24%),radial-gradient(circle_at_70%_40%,rgba(16,185,129,0.18),transparent_34%)]" />
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/80 p-3 backdrop-blur-sm">
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-3 w-52 animate-pulse rounded-full bg-slate-100" />
                </div>
                <div className="h-8 w-20 animate-pulse rounded-full bg-emerald-100" />
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="h-40 animate-pulse rounded-3xl bg-white/85" />
            <div className="h-40 animate-pulse rounded-3xl bg-white/85" />
          </section>

          <section className="rounded-3xl border border-dashed border-emerald-300 bg-white/80 p-5 text-center">
            <div className="mx-auto mb-3 h-12 w-12 animate-pulse rounded-full bg-emerald-100" />
            <div className="mx-auto h-4 w-40 animate-pulse rounded-full bg-slate-200" />
            <div className="mx-auto mt-2 h-3 w-64 animate-pulse rounded-full bg-slate-100" />
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-[radial-gradient(circle_at_10%_0%,rgba(56,189,130,0.25),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(252,211,77,0.2),transparent_30%),linear-gradient(180deg,#f4f8f1_0%,#eef4eb_45%,#e5efe0_100%)] pb-28">
      <div className="pointer-events-none absolute inset-x-0 top-[-8rem] h-56 bg-[radial-gradient(circle,rgba(22,163,74,0.25),transparent_65%)] blur-3xl" />

      <header className="sticky top-0 z-20 border-b border-emerald-900/10 bg-white/70 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700/80">Imagine Garden</p>
            <h1 className="mt-1 text-2xl font-semibold leading-tight text-emerald-950">Build your digital greenhouse</h1>
            <p className="mt-1 text-sm text-emerald-900/75">Activate smart kits and monitor each new plant in one flow.</p>
          </div>

          <button
            type="button"
            onClick={() => setIsScanning(true)}
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-700/25 bg-white px-3 py-2 text-sm font-medium text-emerald-900 transition hover:-translate-y-0.5 hover:border-emerald-600 hover:bg-emerald-50"
          >
            <IconSeedling className="h-4 w-4" />
            Activate
          </button>
        </div>
      </header>

      <div className="relative space-y-5 px-4 py-5 sm:px-6">
        <section className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_18px_44px_rgba(18,54,34,0.12)]">
          <div className="relative h-56 overflow-hidden">
            <img
              src={featuredPlant?.imageUrl ?? ""}
              alt={featuredPlant?.name ?? "Featured crop"}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/18 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100">Featured crop</p>
              <h2 className="mt-1 text-2xl font-semibold leading-tight">Cherry Tomato</h2>
            </div>
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Full Sun</span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Every 2 days</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">HCMC Friendly</span>
            </div>
            <p className="text-sm leading-6 text-slate-700">
              Works if you keep it near the bright edge of the balcony.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-emerald-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/75">Placement</p>
                <p className="mt-1 text-sm font-medium text-emerald-950">East balcony rack</p>
              </div>
              <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Growth pace</p>
                <p className="mt-1 text-sm font-medium text-slate-900">Balanced for compact fruit set</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_16px_40px_rgba(26,58,38,0.08)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-emerald-900">Garden Pulse</p>
              <p className="text-xs text-emerald-900/70">Realtime AI summary from your active planters.</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{stats.avgCareRate}% stable</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="mb-2 inline-flex rounded-lg bg-emerald-600 p-2 text-white">
                <IconSeedling className="h-4 w-4" />
              </div>
              <p className="text-2xl font-semibold text-emerald-950">{stats.healthyPlants}</p>
              <p className="text-xs text-emerald-800/80">Healthy plants</p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="mb-2 inline-flex rounded-lg bg-amber-500 p-2 text-white">
                <IconWater className="h-4 w-4" />
              </div>
              <p className="text-2xl font-semibold text-amber-900">{stats.needsAttention}</p>
              <p className="text-xs text-amber-700/80">Need care today</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Total plants</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{stats.totalPlants}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Sunlight mode</p>
              <p className="mt-1 inline-flex items-center gap-1 text-lg font-semibold text-slate-900">
                <IconSun className="h-4 w-4 text-amber-500" />
                Balanced
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800/70">My Planters</p>
              <h2 className="text-xl font-semibold text-emerald-950">Live growth board</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsScanning(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-700/20 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-50"
            >
                <IconPlus className="h-3.5 w-3.5" />
              Add plant
            </button>
          </div>

          {plants.map((plant, index) => {
            const growthPercent = Math.min(100, Math.round((plant.daysGrowing / Math.max(plant.harvestDays, 1)) * 100));
            return (
              <article
                key={plant.id}
                onClick={() => router.push(`/garden/${plant.id.replace(/-kit-\d+$/, "")}`)}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_12px_35px_rgba(18,54,34,0.1)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(18,54,34,0.15)]"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={plant.imageUrl}
                    alt={plant.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white ${healthStyles[plant.health]}`}>
                    {plant.health === "healthy" ? "Healthy" : plant.health === "warning" ? "Warning" : "Critical"}
                  </span>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-lg font-semibold leading-none">{plant.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-emerald-100">{plant.type}</p>
                  </div>
                </div>

                <div className="space-y-3 p-3.5">
                  <div className="flex items-center justify-between text-sm">
                    <p className="font-medium text-slate-600">Growth Progress</p>
                    <p className="font-semibold text-slate-900">
                      Day {plant.daysGrowing} <span className="font-normal text-slate-500">/ {plant.harvestDays}</span>
                    </p>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                      style={{ width: `${growthPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{plant.nextWatering}</span>
                    <span className="font-semibold text-emerald-700">Open detail</span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="rounded-2xl border border-dashed border-emerald-300 bg-white/80 p-5 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <IconPlus className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-emerald-950">Grow something new</h3>
          <p className="mt-1 text-sm text-emerald-900/70">Scan your environment or activate a kit to launch another smart pot.</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Link
              href="/scan"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:border-emerald-500 hover:text-emerald-700"
            >
              Scan space
            </Link>
            <button
              type="button"
              onClick={() => setIsScanning(true)}
              className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-[0_8px_24px_rgba(5,150,105,0.35)] transition hover:bg-emerald-700"
            >
              Activate Kit
            </button>
          </div>
        </section>
      </div>

      {isMounted &&
        isScanning &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            onClick={() => setIsScanning(false)}
          >
            <div
              className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Activate Smart Kit</p>
                  <p className="text-xs text-slate-500">Use camera frame or enter a Kit ID.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScanning(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200"
                  aria-label="Close"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 p-4">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-900">
                  <div className="absolute inset-0 border-[28px] border-black/40" />
                  <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-emerald-400">
                    <div className="scan-line absolute left-0 top-0 h-1 w-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
                  </div>
                  <p className="absolute bottom-3 left-0 right-0 text-center text-xs font-medium text-white/85">Align QR code inside frame</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Developer mode</p>
                  <div className="grid grid-cols-2 gap-2">
                    {simulatedCodes.map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => handleScanSubmit(code)}
                        disabled={isProcessing}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-3 text-xs font-medium text-slate-700 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {code.replace("CITYFARM-", "").replace(/-\d+$/, "")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    value={scanInput}
                    onChange={(event) => setScanInput(event.target.value)}
                    placeholder="Or enter Kit ID manually"
                    className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none ring-emerald-500 placeholder:text-slate-400 focus:ring-2"
                  />
                  <button
                    type="button"
                    disabled={scanInput.trim().length === 0 || isProcessing}
                    onClick={() => handleScanSubmit(scanInput)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                    aria-label="Submit code"
                  >
                    {isProcessing ? <IconLoader className="h-4 w-4 animate-spin" /> : <IconArrowRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <style jsx global>{`
              .scan-line {
                animation: cityfarm-scan-down 2s linear infinite;
              }

              @keyframes cityfarm-scan-down {
                0% {
                  transform: translateY(0);
                }
                100% {
                  transform: translateY(180px);
                }
              }
            `}</style>
          </div>,
          document.body,
        )}
    </div>
  );
}
