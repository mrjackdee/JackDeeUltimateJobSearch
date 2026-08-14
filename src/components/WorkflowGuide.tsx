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
      title: 'Choose your baseline resume',
      description: 'Add or select the resume the system should use as the source for analysis and tailoring.',
      href: '/settings#baseline-resume',
      action: 'Set baseline',
      done: status.baselineReady,
      icon: FileText,
    },
    {
      title: 'Build your Career Evidence Profile',
      description: 'Sync approved resume evidence so AI recommendations stay grounded in your documented experience.',
      href: '/settings#career-profile',
      action: 'Sync profile',
      done: status.careerProfileReady,
      icon: Target,
    },
    {
      title: 'Find opportunities',
      description: 'Run the job search for matching roles, or import a specific employer posting you already found.',
      href: '/#job-search',
      action: 'Search roles',
      alternateHref: '/import',
      alternateAction: 'Import a role',
      done: status.searchCompleted,
      icon: Search,
    },
    {
      title: 'Review match intelligence',
      description: 'Compare fit, ATS alignment, gaps, compensation, and overqualification risk before deciding to apply.',
      href: '/#opportunities',
      action: 'Review matches',
      done: status.analysisReady,
      icon: Sparkles,
    },
    {
      title: 'Prepare an application package',
      description: 'Generate the tailored resume and cover letter only for roles you decide are worth pursuing.',
      href: '/applications',
      action: 'Prepare package',
      done: status.packageReady,
      icon: Upload,
    },
    {
      title: 'Track the application',
      description: 'Record submission status, recruiter activity, interviews, follow-ups, offers, and final outcomes.',
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
          <div className="eyebrow">Guided workflow</div>
          <h2 id="workflow-summary-title">{nextStep ? `Next: ${nextStep.title}` : 'Workflow complete'}</h2>
          <p>{nextStep ? nextStep.description : 'Your core job-search workflow is configured and active. Continue reviewing and tracking new opportunities.'}</p>
        </div>
        <div className="workflow-summary-side">
          <div className="workflow-progress-label"><span>{completed} of {steps.length} steps</span><strong>{progress}%</strong></div>
          <div className="workflow-progress-track" aria-label={`${progress}% complete`}><span style={{ width: `${progress}%` }} /></div>
          <div className="workflow-summary-actions">
            {nextStep && <Link className="button primary" href={nextStep.href}>{nextStep.action}<ChevronRight size={15}/></Link>}
            <Link className="button" href="/guide">View all steps</Link>
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
          <p className="fit">Follow the steps in order the first time. After setup, you can jump directly to any step whenever your search changes.</p>
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
                <div className="workflow-step-title-row"><Icon size={17}/><h3>{step.title}</h3>{step.done && <span className="badge good">Complete</span>}{isCurrent && <span className="badge">Next step</span>}</div>
                <p>{step.description}</p>
                <div className="workflow-step-actions">
                  <Link className={isCurrent ? 'button primary' : 'button'} href={step.href}>{step.done ? 'Open step' : step.action}<ChevronRight size={15}/></Link>
                  {step.alternateHref && <Link className="button subtle" href={step.alternateHref}>{step.alternateAction}</Link>}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="panel workflow-usage-notes">
        <h2>How the system is designed to work</h2>
        <div className="workflow-rules">
          <div><Circle size={11}/><p><strong>Start with evidence.</strong> Your baseline resume and Career Evidence Profile define what the system is allowed to claim about your experience.</p></div>
          <div><Circle size={11}/><p><strong>Search before generating.</strong> Review match intelligence before spending time creating an application package.</p></div>
          <div><Circle size={11}/><p><strong>You make the application decision.</strong> The app prepares and organizes materials, but it does not automatically submit job applications.</p></div>
          <div><Circle size={11}/><p><strong>Keep statuses current.</strong> Tracking recruiter contact, interviews, follow-ups, and outcomes keeps the command center useful over time.</p></div>
        </div>
      </section>
    </div>
  );
}
