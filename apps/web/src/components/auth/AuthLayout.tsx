"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { AnimatedLoginBackground } from "./AnimatedLoginBackground";
import styles from "./auth.module.css";

interface AuthLayoutProps {
  /** Main branding title (e.g. "Bienvenido a Helu") */
  title: string;
  /** Sub-branding text */
  subtitle: string;
  /** Card heading */
  cardTitle: string;
  /** Card description */
  cardSubtitle: string;
  /** Error message to show */
  error?: string | null;
  /** Footer "already have account" text */
  footerText: string;
  /** Footer link label */
  footerLink: string;
  /** Footer link href */
  footerHref: string;
  children: ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  cardTitle,
  cardSubtitle,
  error,
  footerText,
  footerLink,
  footerHref,
  children,
}: AuthLayoutProps) {
  return (
    <div className={styles.authWrapper}>
      <AnimatedLoginBackground />

      <div className={styles.authContent}>
        {/* Header: Logo + branding */}
        <div className={styles.header}>
            <Image
              src="/helu-logo.png"
              alt="Helu"
              width={140}
              height={140}
              className={styles.logo}
              priority
            />
          <h1 className={styles.brandTitle}>{title}</h1>
          <p className={styles.brandSubtitle}>{subtitle}</p>
        </div>

        {/* Form card */}
        <div className={styles.formCard}>
          <h2 className={styles.cardTitle}>{cardTitle}</h2>
          <p className={styles.cardSubtitle}>{cardSubtitle}</p>

          {!!error && <div className={styles.errorBox}>{error}</div>}

          {children}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>{footerText}</p>
          <a href={footerHref} className={styles.footerLink}>
            {footerLink}
          </a>
        </div>
      </div>
    </div>
  );
}
