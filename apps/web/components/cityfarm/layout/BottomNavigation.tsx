"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../cityfarm.module.css";
import {
  HomeIcon,
  BagIcon,
  SproutIcon,
  UsersIcon,
  CameraIcon,
} from "../icons";

export function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    { href: "/home", label: "Home", icon: <HomeIcon /> },
    { href: "/order", label: "Order", icon: <BagIcon /> },
    { href: "/garden", label: "Garden", icon: <SproutIcon /> },
    { href: "/community", label: "Social", icon: <UsersIcon /> },
  ];

  return (
    <nav className={styles.bottomNav}>
      <div className={styles.bottomNavInner}>
        <div className={styles.bottomNavGroup}>
          {navItems.slice(0, 2).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? styles.navItemActive : styles.navItem}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className={styles.navGap} />

        <Link
          href="/scan"
          className={
            pathname === "/scan" ? styles.scanFabActive : styles.scanFab
          }
          aria-label="Open Scan"
        >
          <CameraIcon />
        </Link>

        <div className={styles.bottomNavGroup}>
          {navItems.slice(2).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? styles.navItemActive : styles.navItem}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
