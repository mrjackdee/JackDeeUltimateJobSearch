"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, MapPin, Search, Sparkles } from "lucide-react";
import styles from "./HeroSection.module.css";

const ROTATING_TITLES = [
  "Executive Strategy",
  "AI Implementation",
  "Product Leadership",
  "Program Management",
];

const POPULAR_TAGS = [
  "Remote",
  "Director of AI",
  "Principal Program Manager",
  "VP of Product",
];

type HeroSectionProps = {
  roleQuery: string;
  locationQuery: string;
  onRoleQueryChange: (value: string) => void;
  onLocationQueryChange: (value: string) => void;
  onSearch: () => void;
  isPending?: boolean;
};

export default function HeroSection({
  roleQuery,
  locationQuery,
  onRoleQueryChange,
  onLocationQueryChange,
  onSearch,
  isPending = false,
}: HeroSectionProps) {
  const [titleIndex, setTitleIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % ROTATING_TITLES.length);
    }, 3000);
    return () => window.clearInterval(interval);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch();
  }

  function applyPopularTag(tag: string) {
    if (tag === "Remote") {
      onLocationQueryChange(tag);
      return;
    }
    onRoleQueryChange(tag);
  }

  return (
    <section id="job-search" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.content}>
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={styles.activityBadge}
        >
          <span className={styles.statusDot} />
          <Sparkles size={14} aria-hidden="true" />
          <span>Real-time AI Role Matching Active</span>
        </motion.div>

        <motion.h1
          id="hero-title"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={styles.title}
        >
          Find your next{" "}
          <span className={styles.rotatingWrap}>
            <AnimatePresence mode="wait">
              <motion.span
                key={titleIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className={styles.rotatingTitle}
              >
                {ROTATING_TITLES[titleIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
          <br />
          opportunity.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={styles.subtitle}
        >
          Curated executive and high-impact positions. Cut through generic listings with precision tracking and dynamic matches.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={styles.searchWrap}
          onSubmit={handleSubmit}
          role="search"
        >
          <div className={styles.outerGlow} aria-hidden="true" />
          <div className={styles.searchPanel}>
            <label className={styles.inputGroup}>
              <Briefcase size={20} className={styles.roleIcon} aria-hidden="true" />
              <span className={styles.srOnly}>Job title, skill, or keyword</span>
              <input
                type="search"
                placeholder="Job title, skill, or keyword..."
                value={roleQuery}
                onChange={(event) => onRoleQueryChange(event.target.value)}
              />
            </label>

            <label className={`${styles.inputGroup} ${styles.locationGroup}`}>
              <MapPin size={20} className={styles.locationIcon} aria-hidden="true" />
              <span className={styles.srOnly}>Location or remote</span>
              <input
                type="search"
                placeholder="Location or 'Remote'..."
                value={locationQuery}
                onChange={(event) => onLocationQueryChange(event.target.value)}
              />
            </label>

            <button type="submit" className={styles.searchButton} disabled={isPending}>
              <Search size={16} aria-hidden="true" />
              <span>{isPending ? "Searching..." : "Search"}</span>
            </button>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className={styles.tags}
        >
          <span className={styles.tagsLabel}>Trending Searches:</span>
          {POPULAR_TAGS.map((tag) => (
            <button key={tag} type="button" onClick={() => applyPopularTag(tag)} className={styles.tagButton}>
              {tag}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
