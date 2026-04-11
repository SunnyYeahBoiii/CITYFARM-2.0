"use client";

import React from "react";
import styles from "../cityfarm.module.css";
import { BottomNavigation } from "./BottomNavigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.appBackdrop}>
      <div className={styles.shellCenter}>
        <div className={styles.deviceFrame}>
          <main className={styles.shellMain}>{children}</main>
          <BottomNavigation />
        </div>
      </div>
    </div>
  );
}

export function DetailShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.appBackdrop}>
      <div className={styles.shellCenter}>
        <div className={styles.deviceFrame}>{children}</div>
      </div>
    </div>
  );
}
