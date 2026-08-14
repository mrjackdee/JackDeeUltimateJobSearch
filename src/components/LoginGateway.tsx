"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, BrainCircuit, BriefcaseBusiness, CheckCircle2, FileCheck2, LockKeyhole, Search, ShieldCheck, Sparkles, Target } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./LoginGateway.module.css";

const ROTATING_VALUE = ["Find stronger job matches.","Review jobs before you apply.","Create tailored resumes and cover letters.","Keep your entire search organized."];
const SYSTEM_ACTIVITY = ["Looking for strong job matches","Checking salary and work location","Comparing jobs with your experience","Preparing application materials"];
const PREVIEW_CARDS = [
  { label: "Job Match", value: "94", detail: "Strong fit", icon: Target },
  { label: "Resume Match", value: "91", detail: "Strong wording match", icon: FileCheck2 },
  { label: "Priority", value: "APPLY", detail: "Worth reviewing", icon: Sparkles },
];

export default function LoginGateway({ errorMessage }: { errorMessage?: string }) {
  const [valueIndex, setValueIndex] = useState(0);
  const [activityIndex, setActivityIndex] = useState(0);
  useEffect(() => {
    const valueTimer = window.setInterval(() => setValueIndex((value) => (value + 1) % ROTATING_VALUE.length), 3200);
    const activityTimer = window.setInterval(() => setActivityIndex((value) => (value + 1) % SYSTEM_ACTIVITY.length), 2400);
    return () => { window.clearInterval(valueTimer); window.clearInterval(activityTimer); };
  }, []);

  return <div className={styles.gateway}>
    <div className={styles.grid} aria-hidden="true"/><div className={styles.glowOne} aria-hidden="true"/><div className={styles.glowTwo} aria-hidden="true"/>
    <header className={styles.header}><div className={styles.brand}><span className={styles.brandMark}>JD</span><div><strong>Job Search Command Center</strong><span>Private career workspace</span></div></div><div className={styles.secureBadge}><ShieldCheck size={15}/> Private & secure</div></header>
    <main className={styles.main}>
      <section className={styles.copyColumn}>
        <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} transition={{duration:.5}} className={styles.eyebrow}><span className={styles.liveDot}/><BrainCircuit size={15}/>Your private AI-powered job search workspace</motion.div>
        <motion.h1 initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.65,delay:.08}}>Your next career move deserves <span>better intelligence.</span></motion.h1>
        <div className={styles.rotatingLine} aria-live="polite"><AnimatePresence mode="wait"><motion.p key={valueIndex} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} transition={{duration:.35}}>{ROTATING_VALUE[valueIndex]}</motion.p></AnimatePresence></div>
        <motion.p initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:.6,delay:.2}} className={styles.subcopy}>Find jobs that fit your experience, understand which ones are worth pursuing, create tailored application materials, and keep your progress organized in one private workspace.</motion.p>
        {errorMessage && <div className="notice error"><AlertTriangle size={15}/> {errorMessage}</div>}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.6,delay:.28}} className={styles.actions}><a className={styles.loginButton} href="/api/auth/google/start"><span className={styles.googleMark}>G</span><span>Sign in with Google</span><ArrowRight size={17}/></a><div className={styles.securityCopy}><LockKeyhole size={14}/><span>Only the approved Google account can open this workspace.</span></div></motion.div>
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:.6,delay:.42}} className={styles.capabilities}><span><Search size={15}/> Find jobs</span><span><Target size={15}/> Compare matches</span><span><FileCheck2 size={15}/> Prepare application materials</span><span><BriefcaseBusiness size={15}/> Track applications</span></motion.div>
      </section>
      <motion.section initial={{opacity:0,x:28}} animate={{opacity:1,x:0}} transition={{duration:.75,delay:.18}} className={styles.previewColumn} aria-label="Example of what the app can show after you sign in">
        <div className={styles.previewShell}>
          <div className={styles.previewTopbar}><div><span className={styles.previewEyebrow}>Job match review</span><h2>Director, AI Transformation</h2></div><span className={styles.remotePill}>REMOTE</span></div>
          <div className={styles.companyRow}><div className={styles.companyIcon}>A</div><div><strong>Enterprise Technology</strong><span>Executive transformation leadership</span></div></div>
          <div className={styles.metrics}>{PREVIEW_CARDS.map((item,index)=>{const Icon=item.icon;return <motion.div key={item.label} animate={{y:[0,index%2===0?-4:4,0]}} transition={{duration:4+index,repeat:Infinity,ease:"easeInOut"}} className={styles.metricCard}><div className={styles.metricLabel}><Icon size={15}/> {item.label}</div><strong className={item.value==="APPLY"?styles.applyValue:undefined}>{item.value}</strong><span>{item.detail}</span></motion.div>})}</div>
          <div className={styles.insightPanel}><div className={styles.insightHeader}><Sparkles size={16}/> Why this job stands out</div><div className={styles.insightRow}><CheckCircle2 size={15}/> Leadership responsibilities match your experience</div><div className={styles.insightRow}><CheckCircle2 size={15}/> Salary and work location meet your preferences</div><div className={styles.insightRow}><CheckCircle2 size={15}/> Tailored application materials can be prepared</div></div>
          <div className={styles.activityBar}><span className={styles.scanDot}/><AnimatePresence mode="wait"><motion.span key={activityIndex} initial={{opacity:0,y:7}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-7}} transition={{duration:.25}}>{SYSTEM_ACTIVITY[activityIndex]}...</motion.span></AnimatePresence></div>
        </div>
        <div className={styles.floatingCardOne}><span>Applications ready</span><strong>3</strong></div><div className={styles.floatingCardTwo}><span>Strong matches</span><strong>7</strong></div>
      </motion.section>
    </main>
    <footer className={styles.footer}><span>Jack Dee Career Intelligence</span><span>Private by design</span></footer>
  </div>;
}
