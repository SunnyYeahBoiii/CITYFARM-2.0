import Link from "next/link";
import { getPlants, homeStats, reminders } from "../../../lib/cityfarm";
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
    <div className="min-h-full bg-[linear-gradient(180deg,#f1f6ec_0%,#ffffff_44%)] pb-8">
      <div className="px-5 pt-5">
        <section className="overflow-hidden rounded-[1.8rem] bg-[linear-gradient(145deg,#537a3d,#355327)] p-6 text-white shadow-[0_18px_44px_rgba(53,83,39,0.26)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Daily launchpad</p>
              <h2 className="mt-2 text-2xl font-black">Start Your Garden</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">CF</div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/78">
            Scan your space and get AI-powered plant recommendations tuned for dense urban homes.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/scan"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[var(--color-green-deep)] shadow-[0_12px_28px_rgba(0,0,0,0.12)]"
            >
              <CameraIcon />
              Scan Your Space
            </Link>
            <Link
              href="/order"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/15 px-5 py-3 text-sm font-bold text-white"
            >
              <BagIcon />
              Browse kits
            </Link>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-[var(--color-heading)]">Today&apos;s Care Tasks</h3>
              <p className="text-sm text-[var(--color-muted)]">Keep your streak stable before sunset.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {reminders.length} pending
            </span>
          </div>
          <div className="grid gap-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white p-4 shadow-[0_10px_28px_rgba(33,49,30,0.06)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-interactive-bg)] text-[var(--color-green-deep)]">
                    {getReminderIcon(reminder.icon)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--color-heading)]">{reminder.plant}</div>
                    <div className="text-sm text-[var(--color-muted)]">{reminder.action}</div>
                  </div>
                </div>
                <span className="rounded-full bg-[var(--color-screen)] px-3 py-1 text-xs font-semibold text-[var(--color-interactive-ink)]">
                  {reminder.time}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-[var(--color-heading)]">My Garden</h3>
              <p className="text-sm text-[var(--color-muted)]">Tap a plant to open the full care view.</p>
            </div>
            <Link href="/garden" className="text-sm font-bold text-[var(--color-green-deep)]">
              View All
            </Link>
          </div>
          <div className="grid gap-3">
            {plants.slice(0, 3).map((plant) => (
              <Link
                key={plant.id}
                href={`/garden/${plant.id}`}
                className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white p-4 shadow-[0_10px_28px_rgba(33,49,30,0.06)]"
              >
                <div className="flex gap-4">
                  <CityImage
                    src={plant.imageUrl}
                    alt={plant.name}
                    sizes="96px"
                    fit="contain"
                    className="h-20 w-20 rounded-[1.2rem] bg-[linear-gradient(145deg,#eef5e9,#f8fbf5)] p-2"
                    priority
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-extrabold text-[var(--color-heading)]">{plant.name}</div>
                        <div className="text-sm text-[var(--color-muted)]">
                          Day {plant.daysGrowing} of {plant.harvestDays}
                        </div>
                      </div>
                      <HealthBadge health={plant.health} />
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-screen)]">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#567a3d,#89a963)]"
                        style={{ width: `${plant.progress}%` }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                      <span className="text-[var(--color-muted)]">{plant.nextWatering}</span>
                      <span className="font-bold text-[var(--color-green-deep)]">Open</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-6 grid grid-cols-3 gap-3">
          {homeStats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] px-3 py-4 text-center",
                stat.tone === "green"
                  ? "bg-emerald-50"
                  : stat.tone === "blue"
                    ? "bg-sky-50"
                    : "bg-amber-50",
              )}
            >
              <div className="text-xl font-extrabold text-[var(--color-heading)]">{stat.value}</div>
              <div className="mt-1 text-xs font-medium text-[var(--color-muted)]">{stat.label}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-[1.5rem] border border-[color:rgba(31,41,22,0.08)] bg-[linear-gradient(135deg,#e8e3d9,#d6e4d0)] p-5 shadow-[0_10px_28px_rgba(33,49,30,0.06)]">
          <h3 className="text-base font-extrabold text-[var(--color-heading)]">Local Green Market</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Fresh produce from verified growers in your district, backed by planting logs.
          </p>
          <Link
            href="/community"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-[color:rgba(69,97,54,0.18)] bg-white px-5 py-3 text-sm font-bold text-[var(--color-green-deep)]"
          >
            Browse Community
          </Link>
        </section>
      </div>
    </div>
  );
}
