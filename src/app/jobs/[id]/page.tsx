import { notFound } from 'next/navigation';
import { getState } from '@/lib/storage/state';
import { salaryText } from '@/lib/utils';
import { JobActions } from '@/components/JobActions';
import type { Analysis } from '@/lib/types';
export const dynamic = 'force-dynamic';

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = await getState();
  const job = state.jobs.find(j=>j.id===id); if (!job) notFound();
  const analysis = state.analyses.filter(a=>a.jobId===id).sort((a,b)=>b.analysisDate.localeCompare(a.analysisDate))[0];
  const packages = state.applicationPackages.filter(p=>p.jobId===id).sort((a,b)=>b.version-a.version);
  const application = state.applications.find(a=>a.jobId===id);
  const requirements = analysis?.requirementEvaluations ?? [];
  const core = requirements.filter(r=>r.category==='CORE_RESPONSIBILITY');
  const required = requirements.filter(r=>r.category==='REQUIRED_QUALIFICATION');
  const preferred = requirements.filter(r=>r.category==='PREFERRED_QUALIFICATION');
  const hard = requirements.filter(r=>r.importance==='HARD');

  return <>
    <section className="hero"><div className="eyebrow">{job.company}</div><h1>{job.title}</h1><p>{job.location} · {friendlyWorkStyle(job.workArrangement)} · {salaryText(job.salaryMin,job.salaryMax)}</p><div className="hero-actions"><a className="button primary" href={job.applicationUrl} target="_blank" rel="noreferrer">View employer&apos;s job posting</a>{packages[0]?.googleDriveFolderUrl&&<a className="button" href={packages[0].googleDriveFolderUrl} target="_blank" rel="noreferrer">Open saved application materials</a>}</div></section>

    {analysis && <section className="analysis-hero panel">
      <div><div className="eyebrow">Evidence-based assessment</div><h2>{analysis.matchConfidence==='LOW'?'Preliminary Match':analysis.matchLabel ?? 'Job Match'}</h2><p className="fit">This score is based on the available job description compared with evidence in your current Career Profile, not title similarity alone.</p></div>
      <div className="analysis-scoreblock"><div className="analysis-score">{analysis.overallFitScore}<span>/100</span></div><strong>{confidenceText(analysis.matchConfidence)}</strong></div>
    </section>}

    {analysis?.disqualified && <div className="notice error"><strong>Do not apply recommendation.</strong> {analysis.disqualificationReasons?.join(' ') || 'A hard requirement is not supported by your current resume.'}</div>}

    <div className="detail-layout"><div style={{display:'grid',gap:14}}>
      {analysis ? <>
        <section className="panel"><h2>Why This Matches</h2><ul className="analysis-list">{analysis.strengths.map(x=><li key={x}>{x}</li>)}</ul></section>

        <section className="panel"><h2>Key Resume Evidence</h2>{analysis.keyResumeEvidence?.length ? <div className="evidence-grid">{analysis.keyResumeEvidence.map((item,index)=><div className="evidence-card" key={`${item.label}-${index}`}><strong>{item.label}</strong><p>{item.evidence}</p></div>)}</div> : <p className="fit">No detailed evidence summary is available for this review.</p>}</section>

        <RequirementSection title="Core Responsibilities" items={core}/>
        <RequirementSection title="Required Qualifications" items={required}/>
        <RequirementSection title="Preferred Qualifications" items={preferred}/>

        <section className="panel"><h2>Hard Requirement Check</h2>{hard.length ? <div className="requirement-table">{hard.map((item,index)=><div className="requirement-row" key={`${item.requirement}-${index}`}><div><strong>{item.requirement}</strong><p>{item.resumeEvidence.length ? item.resumeEvidence.join(' · ') : 'No supporting resume evidence identified.'}</p></div><div><span className={`badge ${item.pass?'good':'danger'}`}>{item.pass?'PASS':'GAP'}</span><span className="requirement-classification">{friendlyClassification(item.evidenceClassification)}</span></div></div>)}</div> : <p className="fit">No explicit hard requirements were identified in the available description.</p>}</section>

        <section className="panel"><h2>Gaps / Risks</h2>{analysis.gapDetails?.length ? <div className="gap-list">{analysis.gapDetails.map((gap,index)=><div className="gap-item" key={`${gap.requirement}-${index}`}><div><strong>{gap.requirement}</strong><p>{gap.explanation}</p></div><span className={`badge ${gap.severity==='MINOR'?'good':gap.severity==='MODERATE'?'warn':'danger'}`}>{friendlySeverity(gap.severity)}</span></div>)}</div> : <p className="fit">No important gaps were identified in the current review.</p>}</section>

        <section className="panel"><h2>Salary Assessment</h2><div className="kv"><div className="kv-row"><div className="kv-key">Published compensation</div><div>{salaryText(job.salaryMin,job.salaryMax)}</div></div><div className="kv-row"><div className="kv-key">Assessment</div><div>{friendlyCompensation(analysis.compensationLabel)}</div></div><div className="kv-row"><div className="kv-key">Compensation risk</div><div>{analysis.compensationRisk?'Yes. Part of the disclosed range falls below your minimum.':'No disclosed range risk identified.'}</div></div></div></section>

        <section className="panel"><h2>Location Assessment</h2><p className="fit">{friendlyLocationAssessment(job.workArrangement, job.location)}</p></section>

        <section className="panel"><h2>Resume Competitiveness</h2><p className="analysis-callout"><strong>{friendlyCompetitiveness(analysis.resumeCompetitiveness)}</strong></p><p className="fit">This rating asks whether your current resume can credibly compete for this job as written today, not whether you could potentially learn the role.</p></section>

        <section className="panel"><h2>Why I Selected This Role</h2><p className="fit">{analysis.whySelected || 'This role passed the evidence-based comparison against your current resume and search preferences.'}</p></section>

        <section className="panel"><h2>Suggested Resume Positioning</h2><p className="fit">{analysis.recommendedApplicationStrategy}</p><div className="notice" style={{marginTop:12}}>Resume tailoring may reorganize and strengthen supported experience, but it will not invent missing skills, certifications, responsibilities, technologies, or domain expertise.</div></section>

        <section className="panel"><h2>Application Recommendation</h2><div className="recommendation-banner"><strong>{friendlyApplicationRecommendation(analysis.applicationRecommendation)}</strong><span>Application Priority: {analysis.priorityScore}/100</span></div>{analysis.validatorScore != null && <p className="field-help" style={{marginTop:10}}>High-match validation completed. Independent review score: {analysis.validatorScore}/100{analysis.validatorDelta != null ? ` · difference from initial review: ${analysis.validatorDelta} points` : ''}.</p>}{analysis.validatorNotes?.length ? <ul>{analysis.validatorNotes.slice(0,5).map(x=><li key={x}>{x}</li>)}</ul> : null}</section>
      </> : <div className="notice">This job has not been reviewed against your Career Profile yet.</div>}

      <section className="panel"><h2>Job Summary</h2><div className="kv"><div className="kv-row"><div className="kv-key">Company</div><div>{job.company}</div></div><div className="kv-row"><div className="kv-key">Location</div><div>{job.location}</div></div><div className="kv-row"><div className="kv-key">Work style</div><div>{friendlyWorkStyle(job.workArrangement)}</div></div><div className="kv-row"><div className="kv-key">Employment type</div><div>{friendlyEmployment(job.employmentType)}</div></div><div className="kv-row"><div className="kv-key">Posted</div><div>{job.employerDatePosted||job.datePosted?new Date(job.employerDatePosted||job.datePosted!).toLocaleDateString():'Not listed'}</div></div><div className="kv-row"><div className="kv-key">Salary</div><div>{salaryText(job.salaryMin,job.salaryMax)}</div></div></div></section>
      <section className="panel"><h2>Full Available Job Description</h2><div className="prose">{job.description}</div></section>
    </div>

    <aside style={{display:'grid',gap:14}}>
      <JobActions jobId={job.id} packages={packages} currentStatus={application?.status}/>
      <section className="panel"><h2>At a glance</h2><div className="kv">{analysis&&<><div className="kv-row"><div className="kv-key">Match score</div><div>{analysis.overallFitScore}/100</div></div><div className="kv-row"><div className="kv-key">Confidence</div><div>{confidenceText(analysis.matchConfidence)}</div></div><div className="kv-row"><div className="kv-key">Resume competitiveness</div><div>{friendlyCompetitiveness(analysis.resumeCompetitiveness)}</div></div><div className="kv-row"><div className="kv-key">Application priority</div><div>{analysis.priorityScore}/100</div></div></>}<div className="kv-row"><div className="kv-key">Listing status</div><div>{friendlyVerification(job.verificationStatus)}</div></div><div className="kv-row"><div className="kv-key">Where it came from</div><div>{job.source}</div></div><div className="kv-row"><div className="kv-key">Added to your app</div><div>{new Date(job.dateDiscovered).toLocaleDateString()}</div></div><div className="kv-row"><div className="kv-key">Appears reposted</div><div>{job.repost?'Yes':'No'}</div></div><div className="kv-row"><div className="kv-key">Best resume to start from</div><div>{analysis?.recommendedMasterResume??'Not decided yet'}</div></div></div></section>
      <section className="panel"><h2>Saved application materials</h2>{packages.length?packages.map(p=><div key={p.id} style={{borderTop:'1px solid var(--navy-700)',padding:'10px 0'}}><strong>Version {p.version}</strong> · <span className={`badge ${p.qaStatus==='PASSED'?'good':'danger'}`}>{p.qaStatus==='PASSED'?'READY':'NEEDS REVIEW'}</span><div className="fit">Resume match improved from {p.atsScoreBefore} to {p.atsScoreAfter}</div><div className="hero-actions" style={{marginTop:8}}>{p.resumeUrl&&<a className="button" href={p.resumeUrl} target="_blank" rel="noreferrer">Resume</a>}{p.coverLetterUrl&&<a className="button" href={p.coverLetterUrl} target="_blank" rel="noreferrer">Cover letter</a>}{p.analysisUrl&&<a className="button" href={p.analysisUrl} target="_blank" rel="noreferrer">Match review</a>}</div></div>):<p className="fit">No application materials have been prepared yet.</p>}</section>
    </aside></div>
  </>;
}

function RequirementSection({title,items}:{title:string;items:NonNullable<Analysis['requirementEvaluations']>}) { return <section className="panel"><h2>{title}</h2>{items.length?<div className="requirement-table">{items.map((item,index)=><div className="requirement-row" key={`${item.requirement}-${index}`}><div><strong>{item.requirement}</strong><p>{item.resumeEvidence.length?item.resumeEvidence.join(' · '):'No supporting resume evidence identified.'}</p></div><div><span className={`badge ${item.pass?'good':item.gapSeverity==='MINOR'?'warn':'danger'}`}>{item.pass?'SUPPORTED':'GAP'}</span><span className="requirement-classification">{friendlyClassification(item.evidenceClassification)}</span></div></div>)}</div>:<p className="fit">No items were identified in this category.</p>}</section>; }
function friendlyWorkStyle(value: string) { return value === 'REMOTE' ? 'Remote' : value === 'HYBRID' ? 'Hybrid' : value === 'ONSITE' ? 'On-site' : 'Work style not listed'; }
function friendlyEmployment(value:string){return value==='FULL_TIME'?'Permanent full-time':value==='CONTRACT'?'Contract':value==='PART_TIME'?'Part-time':value==='TEMPORARY'?'Temporary':value==='INTERNSHIP'?'Internship':'Not clearly stated';}
function friendlyVerification(value: string) { return value === 'ACTIVE_VERIFIED' ? 'Active' : value === 'ACTIVE_LIKELY' ? 'Likely active' : value === 'INACTIVE' ? 'No longer active' : 'Needs confirmation'; }
function confidenceText(value?:Analysis['matchConfidence']){return value==='HIGH'?'High':value==='MEDIUM'?'Medium':value==='LOW'?'Low':'Not rated';}
function friendlyClassification(value:string){return value==='DIRECT'?'Direct experience':value==='TRANSFERABLE'?'Transferable experience':value==='ADJACENT'?'Adjacent experience':value==='MISSING'?'Missing experience':'Contradictory / disqualifying';}
function friendlySeverity(value:string){return value==='MINOR'?'Minor':value==='MODERATE'?'Moderate':value==='SIGNIFICANT'?'Significant':'Potential Disqualifier';}
function friendlyCompensation(value?:Analysis['compensationLabel']){return value==='ABOVE_TARGET'?'Above Target':value==='WITHIN_TARGET'?'Within Acceptable Range':value==='BELOW_TARGET'?'Below Target':value==='NOT_DISCLOSED'?'Not Disclosed':'Not assessed';}
function friendlyCompetitiveness(value?:Analysis['resumeCompetitiveness']){return value==='HIGHLY_COMPETITIVE'?'Highly Competitive':value==='COMPETITIVE'?'Competitive':value==='POSSIBLE'?'Possible':value==='WEAK'?'Weak':value==='NOT_COMPETITIVE'?'Not Competitive':'Not rated';}
function friendlyApplicationRecommendation(value?:Analysis['applicationRecommendation']){return value==='APPLY_NOW'?'APPLY NOW':value==='APPLY'?'APPLY':value==='REVIEW_BEFORE_APPLYING'?'REVIEW BEFORE APPLYING':value==='STRETCH_APPLICATION'?'STRETCH APPLICATION':value==='DO_NOT_APPLY'?'DO NOT APPLY':'Not rated';}
function friendlyLocationAssessment(workArrangement:string,location:string){if(workArrangement==='REMOTE')return `This role is listed as fully remote. The posting location is ${location}.`;return `This role is ${friendlyWorkStyle(workArrangement).toLowerCase()} in ${location}. Hybrid and on-site recommendations are limited to the Atlanta or Dallas/Fort Worth areas.`;}
