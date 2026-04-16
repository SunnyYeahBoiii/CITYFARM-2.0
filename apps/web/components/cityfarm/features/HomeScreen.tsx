import Link from "next/link";
import { getPlants, homeStats, reminders } from "@/lib/cityfarm";
import { BagIcon, CameraIcon, CheckIcon, DropletIcon, SunIcon } from "../shared/icons";
import { CityImage, HealthBadge, cn } from "../shared/ui";

function getReminderIcon(icon: "water" | "sun" | "check") {
  if (icon === "water") {
    return <DropletIcon />;
  }

  if (icon === "sun") {
    return <SunIcon />;
  }

  return <CheckIcon />;
}

export function HomeScreen() {
  const plants = getPlants();

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
            Scan your space and get AI-powered plant recommendations tuned for dense urban homes.
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

        <section className="mt-4">
          <div className="mb-2.5 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-extrabold text-(--color-heading)">Today&apos;s Care Tasks</h3>
              <p className="text-xs text-(--color-muted)">Keep your streak stable before sunset.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {reminders.length} pending
            </span>
          </div>
          <div className="grid gap-2.5">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between gap-3 rounded-[1rem] border border-[rgba(31,41,22,0.08)] bg-white p-3 shadow-[0_8px_20px_rgba(33,49,30,0.06)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-interactive-bg) text-(--color-green-deep)">
                    {getReminderIcon(reminder.icon)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-(--color-heading)">{reminder.plant}</div>
                    <div className="text-xs text-(--color-muted)">{reminder.action}</div>
                  </div>
                </div>
                <span className="rounded-full bg-(--color-screen) px-3 py-1 text-xs font-semibold text-(--color-interactive-ink)">
                  {reminder.time}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4">
          <div className="mb-2.5 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-extrabold text-(--color-heading)">My Garden</h3>
              <p className="text-xs text-(--color-muted)">Tap a plant to open the full care view.</p>
            </div>
            <Link href="/garden" className="text-xs font-bold uppercase tracking-[0.08em] text-(--color-green-deep)">
              View All
            </Link>
          </div>
          <div className="grid gap-2.5">
            {plants.slice(0, 3).map((plant) => (
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
                    fit="contain"
                    className="h-[4.5rem] w-[4.5rem] rounded-[1rem] bg-[linear-gradient(145deg,#eef5e9,#f8fbf5)] p-2"
                    priority
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[15px] font-extrabold text-(--color-heading)">{plant.name}</div>
                        <div className="text-xs text-(--color-muted)">
                          Day {plant.daysGrowing} of {plant.harvestDays}
                        </div>
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
                      <span className="text-(--color-muted)">{plant.nextWatering}</span>
                      <span className="font-bold uppercase tracking-[0.08em] text-(--color-green-deep)">Open</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-4 grid grid-cols-3 gap-2.5">
          {homeStats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "rounded-[1rem] border border-[rgba(31,41,22,0.08)] px-2.5 py-3 text-center",
                stat.tone === "green"
                  ? "bg-emerald-50"
                  : stat.tone === "blue"
                    ? "bg-sky-50"
                    : "bg-amber-50",
              )}
            >
              <div className="text-lg font-extrabold text-(--color-heading)">{stat.value}</div>
              <div className="mt-0.5 text-[11px] font-medium leading-4 text-(--color-muted)">{stat.label}</div>
            </div>
          ))}
        </section>

        <section className="mt-4 rounded-[1.25rem] border border-[rgba(31,41,22,0.08)] bg-[linear-gradient(135deg,#e8e3d9,#d6e4d0)] p-4 shadow-[0_8px_20px_rgba(33,49,30,0.06)]">
          <h3 className="text-[15px] font-extrabold text-(--color-heading)">Local Green Market</h3>
          <p className="mt-1.5 text-xs leading-5 text-(--color-muted)">
            Fresh produce from verified growers in your district, backed by planting logs.
          </p>
          <Link
            href="/community"
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full border border-[rgba(69,97,54,0.18)] bg-white px-4 py-2.5 text-sm font-bold text-(--color-green-deep)"
          >
            Browse Community
          </Link>
        </section>
      </div>
    </div>
  );
}
