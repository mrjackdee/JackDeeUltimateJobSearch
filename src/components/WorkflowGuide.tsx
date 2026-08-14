import Link from 'next/link';
import { Check, ChevronRight, Circle, FileText, Search, Sparkles, Target, Upload, Workflow } from 'lucide-react';

export type WorkflowStatus = {
  baselineReady: boolean;
  careerProfileReady: boolean;
  searchCompleted: boolean;
  analysisReady: boolean;
  packageReady: boolean;
  applicationTracked: boolean;
};

type Step = {
  title: string;
  description: string;
  href: string;
  action: string;
  done: boolean;
  icon: typeof FileText;
  alternateHref?: string;
  alternateAction?: string;
};

export function WorkflowGuide({ status, compact = false }: { status: WorkflowStatus; compact?: boolean }) {
  const steps: Step[] = [
    {
      title: 'Choose your main resume',
      description: 'Add or select the resume the app should start from when it compares you with jobs and prepares tailored materials.',
      href: '/settings#baseline-resume',
      action: 'Choose resume',
      done: status.baselineReady,
      icon: FileText,
    },
    {
      title: 'Create your Career Profile',
      description: 'Let the app build a private summary of your experience, skills, education, and accomplishments from your approved resume files.',
      href: '/settings#career-profile',
      action: 'Create profile',
      done: status.careerProfileReady,
      icon: Target,
    },
    {
      title: 'Find jobs',
      description: 'Run a search for matching jobs, or add a specific employer posting that you already found somewhere else.',
      href: '/#job-search',
      action: 'Search for jobs',
      alternateHref: '/import',
      alternateAction: 'Add a job I found',
      done: status.searchCompleted,
      icon: Search,
    },
    {
      title: 'Review your best matches',
      description: 'See how well each job fits your experience, where there may be gaps, and whether the role is worth pursuing.',
      href: '/#opportunities',
      action: 'Review matches',
      done: status.analysisReady,
      icon: Sparkles,
    },
    {
      title: 'Prepare your application materials',
      description: 'Create a tailored resume and cover letter only for jobs you decide are worth pursuing.',
      href: '/applications',
      action: 'Prepare materials',
      done: status.packageReady,
      icon: Upload,
    },
    {
      title: 'Track what happens next',
      description: 'Keep your application status, recruiter contact, interviews, follow-ups, offers, and final outcome up to date.',
      href: '/applications',
      action: 'Track applications',
      done: status.applicationTracked,
      icon: Workflow,
    },
  ];

  const completed = steps.filter(step => step.done).length;
  const progress = Math.round((completed / steps.length) * 100);
  const nextStepIndex = steps.findIndex(step => !step.done);
  const nextStep = nextStepIndex >= 0 ? steps[nextStepIndex] : undefined;

  if (compact) {
    return (
      <section className="workflow-summary" aria-labelledby="workflow-summary-title">
        <div className="workflow-summary-copy">
          <div className="eyebrow">Your next step</div>
          <h2 id="workflow-summary-title">{nextStep ? nextStep.title : 'You are ready to keep your search moving'}</h2>
          <p>{nextStep ? nextStep.description : 'Your main setup steps are complete. Continue reviewing new jobs and keeping application progress current.'}</p>
        </div>
        <div className="workflow-summary-side">
          <div className="workflow-progress-label"><span>{completed} of {steps.length} steps</span><strong>{progress}%</strong></div>
          <div className="workflow-progress-track" aria-label={`${progress}% complete`}><span style={{ width: `${progress}%` }} /></div>
          <div className="workflow-summary-actions">
            {nextStep && <Link className="button primary" href={nextStep.href}>{nextStep.action}<ChevronRight size={15}/></Link>}
            <Link className="button" href="/guide">See all steps</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="workflow-guide">
      <section className="workflow-overview panel">
        <div>
          <div className="eyebrow">Your progress</div>
          <h2>{progress}% complete</h2>
          <p className="fit">Follow these steps in order the first time. After setup, you can return to any step whenever your job search changes.</p>
        </div>
        <div className="workflow-progress-block">
          <div className="workflow-progress-label"><span>{completed} of {steps.length} steps complete</span><strong>{progress}%</strong></div>
          <div className="workflow-progress-track" aria-label={`${progress}% complete`}><span style={{ width: `${progress}%` }} /></div>
        </div>
      </section>

      <div className="workflow-steps">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCurrent = index === nextStepIndex;
          return (
            <article className={`workflow-step ${step.done ? 'complete' : ''} ${isCurrent ? 'current' : ''}`} key={step.title}>
              <div className="workflow-step-marker">{step.done ? <Check size={17}/> : <span>{index + 1}</span>}</div>
              <div className="workflow-step-body">
                <div className="workflow-step-title-row"><Icon size={17}/><h3>{step.title}</h3>{step.done && <span className="badge good">Done</span>}{isCurrent && <span className="badge">Do this next</span>}</div>
                <p>{step.description}</p>
                <div className="workflow-step-actions">
                  <Link className={isCurrent ? 'button primary' : 'button'} href={step.href}>{step.done ? 'Open this step' : step.action}<ChevronRight size={15}/></Link>
                  {step.alternateHref && <Link className="button subtle" href={step.alternateHref}>{step.alternateAction}</Link>}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="panel workflow-usage-notes">
        <h2>A few things to remember</h2>
        <div className="workflow-rules">
          <div><Circle size={11}/><p><strong>Start with your resume.</strong> The app bases its recommendations on the experience you have documented.</p></div>
          <div><Circle size={11}/><p><strong>Review a job before preparing materials.</strong> This helps you focus your time on roles that are actually worth pursuing.</p></div>
          <div><Circle size={11}/><p><strong>You decide where to apply.</strong> The app can prepare and organize materials, but it does not submit job applications for you.</p></div>
          <div><Circle size={11}/><p><strong>Keep application progress current.</strong> Recording recruiter contact, interviews, follow-ups, and outcomes keeps the app useful over time.</p></div>
        </div>
      </section>
    </div>
  );
}
