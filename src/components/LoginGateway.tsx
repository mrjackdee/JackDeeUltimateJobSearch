"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BrainCircuit, BriefcaseBusiness, CheckCircle2, FileCheck2, LockKeyhole, Search, ShieldCheck, Sparkles, Target } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./LoginGateway.module.css";

const ROTATING_VALUE = [
  "Discover higher-fit opportunities.",
  "Analyze roles before you apply.",
  "Build tailored application packages.",
  "Track your search from one command center.",
];

const SYSTEM_ACTIVITY = [
  "Matching executive opportunities",
  "Evaluating compensation and work arrangement",
  "Scoring ATS and career alignment",
  "Preparing focused application intelligence",
];

const PREVIEW_CARDS = [
  { label: "Career Match", value: "94", detail: "Strong alignment", icon: Target },
  { label: "ATS Readiness", value: "91", detail: "Keywords aligned", icon: FileCheck2 },
  { label: "Priority", value: "APPLY", detail: "High-value opportunity", icon: Sparkles },
];

export default function LoginGateway() {
  const [valueIndex, setValueIndex] = useState(0);
  const [activityIndex, setActivityIndex] = useState(0);

  useEffect(() => {
    const valueTimer = window.setInterval(() => setValueIndex((value) => (value + 1) % ROTATING_VALUE.length), 3200);
    const activityTimer = window.setInterval(() => setActivityIndex((value) => (value + 1) % SYSTEM_ACTIVITY.length), 2400);
    return () => {
      window.clearInterval(valueTimer);
      window.clearInterval(activityTimer);
    };
  }, []);

  return (
    <div className={styles.gateway}>
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.glowOne} aria-hidden="true" />
      <div className={styles.glowTwo} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>JD</span>
          <div>
            <strong>Job Search Command Center</strong>
            <span>Private career operating system</span>
          </div>
        </div>
        <div className={styles.secureBadge}><ShieldCheck size={15} /> Secure workspace</div>
      </header>

      <main className={styles.main}>
        <section className={styles.copyColumn}>
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={styles.eyebrow}
          >
            <span className={styles.liveDot} />
            <BrainCircuit size={15} />
            Private AI Career Command Center
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
          >
            Your next career move deserves <span>better intelligence.</span>
          </motion.h1>

          <div className={styles.rotatingLine} aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.p
                key={valueIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
              >
                {ROTATING_VALUE[valueIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={styles.subcopy}
          >
            Discover high-fit roles, evaluate them against your career evidence, prepare tailored application materials, and manage every opportunity from one focused workspace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className={styles.actions}
          >
            <a className={styles.loginButton} href="/api/auth/google/start">
              <span className={styles.googleMark}>G</span>
              <span>Sign in with Google</span>
              <ArrowRight size={17} />
            </a>
            <div className={styles.securityCopy}>
              <LockKeyhole size={14} />
              <span>Authorized account access only. No public registration.</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.42 }}
            className={styles.capabilities}
          >
            <span><Search size={15} /> Role discovery</span>
            <span><Target size={15} /> Fit intelligence</span>
            <span><FileCheck2 size={15} /> ATS-ready packages</span>
            <span><BriefcaseBusiness size={15} /> Pipeline tracking</span>
          </motion.div>
        </section>

        <motion.section
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75, delay: 0.18 }}
          className={styles.previewColumn}
          aria-label="Illustrative product preview"
        >
          <div className={styles.previewShell}>
            <div className={styles.previewTopbar}>
              <div>
                <span className={styles.previewEyebrow}>Opportunity intelligence</span>
                <h2>Director, AI Transformation</h2>
              </div>
              <span className={styles.remotePill}>REMOTE</span>
            </div>

            <div className={styles.companyRow}>
              <div className={styles.companyIcon}>A</div>
              <div><strong>Enterprise Technology</strong><span>Executive transformation leadership</span></div>
            </div>

            <div className={styles.metrics}>
              {PREVIEW_CARDS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    animate={{ y: [0, index % 2 === 0 ? -4 : 4, 0] }}
                    transition={{ duration: 4 + index, repeat: Infinity, ease: "easeInOut" }}
                    className={styles.metricCard}
                  >
                    <div className={styles.metricLabel}><Icon size={15} /> {item.label}</div>
                    <strong className={item.value === "APPLY" ? styles.applyValue : undefined}>{item.value}</strong>
                    <span>{item.detail}</span>
                  </motion.div>
                );
              })}
            </div>

            <div className={styles.insightPanel}>
              <div className={styles.insightHeader}><Sparkles size={16} /> AI assessment</div>
              <div className={styles.insightRow}><CheckCircle2 size={15} /> Leadership scope aligns with career evidence</div>
              <div className={styles.insightRow}><CheckCircle2 size={15} /> Compensation and work model meet target criteria</div>
              <div className={styles.insightRow}><CheckCircle2 size={15} /> Application package ready for focused tailoring</div>
            </div>

            <div className={styles.activityBar}>
              <span className={styles.scanDot} />
              <AnimatePresence mode="wait">
                <motion.span
                  key={activityIndex}
                  initial={{ opacity: 0, y: 7 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -7 }}
                  transition={{ duration: 0.25 }}
                >
                  {SYSTEM_ACTIVITY[activityIndex]}...
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <div className={styles.floatingCardOne}><span>Applications ready</span><strong>3</strong></div>
          <div className={styles.floatingCardTwo}><span>Priority matches</span><strong>7</strong></div>
        </motion.section>
      </main>

      <footer className={styles.footer}>
        <span>Jack Dee Career Intelligence</span>
        <span>Private by design</span>
      </footer>
    </div>
  );
}
