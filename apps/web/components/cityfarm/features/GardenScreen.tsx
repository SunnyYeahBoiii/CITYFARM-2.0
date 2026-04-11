import Link from "next/link";
import { getPlants } from "../../../lib/cityfarm";
import { PlusIcon } from "../shared/icons";
import { CityImage, HealthBadge } from "../shared/ui";

export function GardenScreen() {
  const plants = getPlants();
  const stats = {
    totalPlants: plants.length,
    healthyPlants: plants.filter((plant) => plant.health === "healthy").length,
    needsAttention: plants.filter((plant) => plant.health === "warning").length,
    avgCareRate: 87,
  };

  return (
    <div className="min-h-full px-4 pb-6 pt-4">
      <section className="rounded-[1.25rem] border border-[color:rgba(31,41,22,0.08)] bg-[linear-gradient(135deg,#ecf5e7,#f7fbf4)] p-4 shadow-[0_8px_20px_rgba(33,49,30,0.06)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-[var(--color-heading)]">Activate a new kit</h2>
            <p className="mt-1.5 text-xs leading-5 text-[var(--color-muted)]">
              Reorder seeds, top up soil, or start a new balcony configuration without leaving the app.
            </p>
          </div>
          <Link
            href="/order"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--color-green-deep)] shadow-[0_8px_18px_rgba(33,49,30,0.1)]"
            aria-label="Order more supplies"
          >
            <PlusIcon />
          </Link>
        </div>
        <Link
          href="/order"
          className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--color-green-deep)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(53,91,49,0.24)]"
        >
          Order more supplies
        </Link>
      </section>

      <section className="mt-4 grid grid-cols-3 gap-2.5">
        <div className="rounded-[1rem] border border-[color:rgba(31,41,22,0.08)] bg-emerald-50 px-2.5 py-3 text-center">
          <div className="text-lg font-extrabold text-[var(--color-heading)]">{stats.totalPlants}</div>
          <div className="mt-0.5 text-[11px] font-medium leading-4 text-[var(--color-muted)]">Total Plants</div>
        </div>
        <div className="rounded-[1rem] border border-[color:rgba(31,41,22,0.08)] bg-sky-50 px-2.5 py-3 text-center">
          <div className="text-lg font-extrabold text-[var(--color-heading)]">{stats.healthyPlants}</div>
          <div className="mt-0.5 text-[11px] font-medium leading-4 text-[var(--color-muted)]">Healthy</div>
        </div>
        <div className="rounded-[1rem] border border-[color:rgba(31,41,22,0.08)] bg-amber-50 px-2.5 py-3 text-center">
          <div className="text-lg font-extrabold text-[var(--color-heading)]">{stats.avgCareRate}%</div>
          <div className="mt-0.5 text-[11px] font-medium leading-4 text-[var(--color-muted)]">Care Rate</div>
        </div>
      </section>

      <section className="mt-4">
        <div className="mb-2.5">
          <h2 className="text-[15px] font-extrabold text-[var(--color-heading)]">All plants</h2>
          <p className="text-xs text-[var(--color-muted)]">
            {stats.needsAttention > 0
              ? `${stats.needsAttention} plant needs attention this week`
              : "Everything looks stable"}
          </p>
        </div>

        <div className="grid gap-2.5">
          {plants.map((plant) => (
            <Link
              key={plant.id}
              href={`/garden/${plant.id}`}
              className="rounded-[1rem] border border-[color:rgba(31,41,22,0.08)] bg-white p-3 shadow-[0_8px_20px_rgba(33,49,30,0.06)]"
            >
              <div className="flex gap-3">
                <CityImage
                  src={plant.imageUrl}
                  alt={plant.name}
                  sizes="96px"
                  fit="contain"
                  className="h-[4.5rem] w-[4.5rem] rounded-[1rem] bg-[linear-gradient(145deg,#eef5e9,#f8fbf5)] p-2"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[15px] font-extrabold text-[var(--color-heading)]">{plant.name}</div>
                      <div className="text-xs text-[var(--color-muted)]">
                        {plant.type} • {plant.code}
                      </div>
                    </div>
                    <HealthBadge health={plant.health} />
                  </div>
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[var(--color-screen)]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#567a3d,#89a963)]"
                      style={{ width: `${plant.progress}%` }}
                    />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-3 text-xs">
                    <span className="text-[var(--color-muted)]">{plant.nextWatering}</span>
                    <span className="font-bold uppercase tracking-[0.08em] text-[var(--color-green-deep)]">View</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
