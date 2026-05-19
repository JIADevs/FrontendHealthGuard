"use client";

import styles from "./auth.module.css";

/**
 * Animated background with floating bubbles + wave layers.
 * Uses pure CSS animations (GPU-accelerated) — no JS animation loop needed.
 */
export function AnimatedLoginBackground() {
  return (
    <div className={styles.bgLayer}>
      {/* Floating bubbles */}
      <div className={`${styles.bubble} ${styles.bubble1}`} />
      <div className={`${styles.bubble} ${styles.bubble2}`} />
      <div className={`${styles.bubble} ${styles.bubble3}`} />
      <div className={`${styles.bubble} ${styles.bubble4}`} />
      <div className={`${styles.bubble} ${styles.bubble5}`} />
      <div className={`${styles.bubble} ${styles.bubble6}`} />
      <div className={`${styles.bubble} ${styles.bubble7}`} />

      {/* Animated waves */}
      <div className={styles.wavesContainer}>
        {/* Back wave — tallest, slowest */}
        <svg
          className={`${styles.waveSvg} ${styles.waveBack}`}
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
        >
          <path
            d="M0,56 C120,20 240,90 360,56 C480,22 600,90 720,56 C840,22 960,90 1080,56 C1200,22 1320,90 1440,56 L1440,160 L0,160 Z"
            fill="var(--brand-100)"
            opacity="0.35"
          />
        </svg>

        {/* Middle wave */}
        <svg
          className={`${styles.waveSvg} ${styles.waveMid}`}
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
        >
          <path
            d="M0,80 C160,50 280,110 440,80 C600,50 720,110 880,80 C1040,50 1160,110 1320,80 C1400,65 1440,80 1440,80 L1440,160 L0,160 Z"
            fill="var(--brand-200)"
            opacity="0.45"
          />
        </svg>

        {/* Front wave — shortest, fastest */}
        <svg
          className={`${styles.waveSvg} ${styles.waveFront}`}
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
        >
          <path
            d="M0,100 C180,78 300,122 480,100 C660,78 780,122 960,100 C1140,78 1260,122 1440,100 L1440,160 L0,160 Z"
            fill="var(--brand-300)"
            opacity="0.55"
          />
        </svg>
      </div>
    </div>
  );
}
