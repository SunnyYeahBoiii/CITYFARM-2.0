"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { gardenApi } from "@/lib/api/garden.api";
import { GardenPlantSummary, GardenStats } from "@/lib/types/garden";
import { daysSince } from "@/lib/cityfarm/utils";
import { PlusIcon } from "@/components/cityfarm/shared/icons";
import { CityImage, HealthBadge } from "@/components/cityfarm/shared/ui";
import { ActivateCodeModal } from "./ActivateCodeModal";

export function GardenScreen() {
  const [plants, setPlants] = useState<GardenPlantSummary[]>([]);
  const [stats, setStats] = useState<GardenStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGarden = async () => {
    try {
      setIsLoading(true);
      const [plantsData, statsData] = await Promise.all([
        gardenApi.getMyGarden(),
        gardenApi.getGardenStats(),
      ]);
      setPlants(plantsData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch garden:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGarden();
  }, []);

  const displayStats = {
    totalPlants: stats?.totalPlants ?? 0,
    healthyPlants: stats?.healthyPlants ?? 0,
    needsAttention: stats?.needsAttention ?? 0,
    careRate: stats?.careRate ?? 0,
  };

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <div className="text-sm font-bold text-(--color-muted) animate-pulse">Loading your garden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-full px-4 pb-6 pt-4">
      {/* Activation Section */}
      <section className="rounded-[1.25rem] border border-[rgba(31,41,22,0.08)] bg-[linear-gradient(135deg,#ecf5e7,#f7fbf4)] p-4 shadow-[0_8px_20px_rgba(33,49,30,0.06)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-(--color-heading)">Activate a new kit</h2>
            <p className="mt-1.5 text-xs leading-5 text-(--color-muted)">
              Enter your activation code to add a newly purchased kit or seeds to your garden.
            </p>
          </div>
          <ActivateCodeModal 
            onSuccess={fetchGarden}
            trigger={
              <button
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-(--color-green-deep) shadow-[0_8px_18px_rgba(33,49,30,0.1)]"
                aria-label="Activate kit"
              >
                <PlusIcon />
              </button>
            }
          />
        </div>
        <div className="mt-3">
          <ActivateCodeModal 
            onSuccess={fetchGarden}
            trigger={
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-(--color-green-deep) px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(53,91,49,0.24)]"
              >
                Activate your kit
              </button>
            }
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="mt-4 grid grid-cols-3 gap-2.5">
        <div className="rounded-[1rem] border border-[rgba(31,41,22,0.08)] bg-emerald-50 px-2.5 py-3 text-center">
          <div className="text-lg font-extrabold text-(--color-heading)">{displayStats.totalPlants}</div>
          <div className="mt-0.5 text-[11px] font-medium leading-4 text-(--color-muted)">Total Plants</div>
        </div>
        <div className="rounded-[1rem] border border-[rgba(31,41,22,0.08)] bg-sky-50 px-2.5 py-3 text-center">
          <div className="text-lg font-extrabold text-(--color-heading)">{displayStats.healthyPlants}</div>
          <div className="mt-0.5 text-[11px] font-medium leading-4 text-(--color-muted)">Healthy</div>
        </div>
        <div className="rounded-[1rem] border border-[rgba(31,41,22,0.08)] bg-amber-50 px-2.5 py-3 text-center">
          <div className="text-lg font-extrabold text-(--color-heading)">{displayStats.careRate}%</div>
          <div className="mt-0.5 text-[11px] font-medium leading-4 text-(--color-muted)">Care Rate</div>
        </div>
      </section>

      {/* Plants List Section */}
      <section className="mt-4">
        <div className="mb-2.5">
          <h2 className="text-[15px] font-extrabold text-(--color-heading)">My Garden</h2>
          <p className="text-xs text-(--color-muted)">
            {plants.length === 0 
              ? "You haven't activated any plants yet." 
              : displayStats.needsAttention > 0
                ? `${displayStats.needsAttention} plant needs attention this week`
                : "Everything looks stable"}
          </p>
        </div>

        {plants.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-[rgba(31,41,22,0.1)] py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-(--color-screen) text-(--color-green-deep) opacity-40">
               <PlusIcon />
            </div>
            <p className="px-8 text-sm font-bold text-(--color-muted)">
              Your garden is empty. Purchase a kit or enter an activation code to get started!
            </p>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {plants.map((plant) => {
              const harvestDays = plant.plantSpecies.harvestDaysMin ?? 60;
              const growingDays = daysSince(plant.plantedAt);
              const progress = Math.min(100, Math.floor((growingDays / harvestDays) * 100));
              const nextTask = plant.careTasks[0];
              const publicUrl = plant.plantSpecies.products[0]?.coverAsset?.publicUrl;

              return (
                <Link
                  key={plant.id}
                  href={`/garden/${plant.id}`}
                  className="rounded-[1rem] border border-[rgba(31,41,22,0.08)] bg-white p-3 shadow-[0_8px_20px_rgba(33,49,30,0.06)]"
                >
                  <div className="flex gap-3">
                    <div className="h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-[1rem] bg-[linear-gradient(145deg,#eef5e9,#f8fbf5)] p-0">
                      <CityImage
                        src={publicUrl || `/img/category/${plant.plantSpecies.category.toLowerCase()}.png`}
                        alt={plant.nickname || plant.plantSpecies.commonName}
                        sizes="96px"
                        fit="cover"
                        className="h-full w-full"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[15px] font-extrabold text-(--color-heading) truncate">
                            {plant.nickname || plant.plantSpecies.commonName}
                          </div>
                          <div className="text-xs text-(--color-muted)">
                            {plant.plantSpecies.category} • {plant.plantSpecies.commonName}
                          </div>
                        </div>
                        <HealthBadge health={plant.healthStatus.toLowerCase() as any} />
                      </div>
                      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-(--color-screen)">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#567a3d,#89a963)]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between gap-3 text-xs">
                        <span className="text-(--color-muted) truncate">
                          {nextTask ? `${nextTask.title}` : "No tasks scheduled"}
                        </span>
                        <span className="font-bold uppercase tracking-[0.08em] text-(--color-green-deep)">View</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
