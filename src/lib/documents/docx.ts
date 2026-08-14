import 'server-only';
import { AlignmentType, BorderStyle, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import type { Analysis, CoverLetterContent, Job, TailoredResumeContent } from '../types';

const FONT = 'Aptos';
const BODY = 20; // 10 pt
const LINE = 252;
const TEXT = '172033';
const MUTED = '4B5563';
const ACCENT = '7A5A00';

function paragraph(text: string, options?: { bold?: boolean; size?: number; spacingAfter?: number; spacingBefore?: number; alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]; keepNext?: boolean; color?: string }) {
  return new Paragraph({
    alignment: options?.alignment,
    keepNext: options?.keepNext,
    spacing: { before: options?.spacingBefore ?? 0, after: options?.spacingAfter ?? 72, line: LINE },
    children: [new TextRun({ text, bold: options?.bold, size: options?.size ?? BODY, font: FONT, color: options?.color ?? TEXT })],
  });
}

function sectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    keepNext: true,
    spacing: { before: 145, after: 58 },
    border: { bottom: { color: 'C7CDD6', size: 5, style: BorderStyle.SINGLE, space: 3 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 20, font: FONT, color: ACCENT, characterSpacing: 30 })],
  });
}

function bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    indent: { left: 360, hanging: 180 },
    spacing: { after: 46, line: LINE },
    widowControl: true,
    children: [new TextRun({ text, size: BODY, font: FONT, color: TEXT })],
  });
}

export async function resumeDocx(content: TailoredResumeContent): Promise<Buffer> {
  const children: Paragraph[] = [
    paragraph(content.candidateName, { bold: true, size: 32, spacingAfter: 20, alignment: AlignmentType.CENTER, color: '0F172A' }),
    paragraph(content.contactLine, { size: 18, spacingAfter: 24, alignment: AlignmentType.CENTER, color: MUTED }),
    paragraph(content.headline, { bold: true, size: 21, spacingAfter: 118, alignment: AlignmentType.CENTER, color: ACCENT }),
    sectionHeading('Professional Summary'),
    paragraph(content.summary, { size: BODY, spacingAfter: 86 }),
    sectionHeading('Core Competencies'),
    paragraph(content.coreCompetencies.join('  |  '), { size: 18, spacingAfter: 88, color: MUTED }),
  ];

  for (const section of content.sections) {
    children.push(sectionHeading(section.heading));
    for (const p of section.paragraphs ?? []) children.push(paragraph(p, { size: BODY, spacingAfter: 46, keepNext: false }));
    for (const b of section.bullets ?? []) children.push(bullet(b));
  }

  if (content.education.length) {
    children.push(sectionHeading('Education'));
    for (const item of content.education) children.push(paragraph(item, { size: BODY, spacingAfter: 36 }));
  }
  if (content.certifications.length) {
    children.push(sectionHeading('Certifications'));
    children.push(paragraph(content.certifications.join('  |  '), { size: 18, spacingAfter: 28, color: MUTED }));
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: FONT, size: BODY, color: TEXT }, paragraph: { spacing: { line: LINE } } } },
      paragraphStyles: [{ id: 'Normal', name: 'Normal', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: BODY, color: TEXT }, paragraph: { spacing: { line: LINE, after: 72 } } }],
    },
    sections: [{ properties: { page: { margin: { top: 540, right: 650, bottom: 540, left: 650 } } }, children }],
  });
  return Packer.toBuffer(doc);
}

export async function coverLetterDocx(content: CoverLetterContent, candidateName: string, contactLine: string, job: Job): Promise<Buffer> {
  const children: Paragraph[] = [
    paragraph(candidateName, { bold: true, size: 31, spacingAfter: 18, alignment: AlignmentType.CENTER, color: '0F172A' }),
    paragraph(contactLine, { size: 18, spacingAfter: 126, alignment: AlignmentType.CENTER, color: MUTED }),
    paragraph(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), { size: BODY, spacingAfter: 105 }),
    paragraph('Hiring Team', { size: BODY, spacingAfter: 18 }),
    paragraph(job.company, { bold: true, size: BODY, spacingAfter: 18 }),
    paragraph(`Re: ${job.title}`, { bold: true, size: BODY, spacingAfter: 118, color: ACCENT }),
    paragraph(content.salutation, { size: BODY, spacingAfter: 84 }),
  ];
  for (const p of content.paragraphs) children.push(paragraph(p, { size: BODY, spacingAfter: 102 }));
  children.push(paragraph(content.closing, { size: BODY, spacingAfter: 68 }));
  children.push(paragraph(candidateName, { bold: true, size: BODY }));
  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: BODY, color: TEXT }, paragraph: { spacing: { line: LINE } } } } },
    sections: [{ properties: { page: { margin: { top: 700, right: 820, bottom: 700, left: 820 } } }, children }],
  });
  return Packer.toBuffer(doc);
}

export async function jobDescriptionDocx(job: Job): Promise<Buffer> {
  const children: Paragraph[] = [
    paragraph(`${job.company} | ${job.title}`, { bold: true, size: 28, spacingAfter: 90, color: '0F172A' }),
    paragraph(`Location: ${job.location}`, { color: MUTED }), paragraph(`Work arrangement: ${job.workArrangement}`, { color: MUTED }), paragraph(`Source: ${job.source}`, { color: MUTED }),
    paragraph(`Posting URL: ${job.applicationUrl}`, { spacingAfter: 135, color: MUTED }), sectionHeading('Job Description'), paragraph(job.description, { size: BODY }),
  ];
  return Packer.toBuffer(new Document({ sections: [{ properties: { page: { margin: { top: 650, right: 700, bottom: 650, left: 700 } } }, children }] }));
}

export async function analysisDocx(job: Job, analysis: Analysis): Promise<Buffer> {
  const rows = [`Overall Fit Score: ${analysis.overallFitScore}/100`,`ATS Score Before Tailoring: ${analysis.atsScore}/100`,`Priority Score: ${analysis.priorityScore}/100`,`Priority: ${analysis.priorityRecommendation}`,`Overqualification Risk: ${analysis.overqualificationRisk}`,`Underqualification Risk: ${analysis.underqualificationRisk}`];
  const children: Paragraph[] = [paragraph(`${job.company} | ${job.title}`, { bold: true, size: 28, spacingAfter: 96, color: '0F172A' }), ...rows.map(r => paragraph(r, { color: MUTED }))];
  for (const [heading, items] of [['Strengths', analysis.strengths], ['Wording Gaps', analysis.wordingGaps], ['True Experience Gaps', analysis.trueExperienceGaps], ['Hard Qualification Risks', analysis.hardQualificationRisks], ['Recruiter Objections', analysis.recruiterObjections]] as const) {
    children.push(sectionHeading(heading));
    for (const item of items) children.push(bullet(item));
  }
  children.push(sectionHeading('Recommended Application Strategy'), paragraph(analysis.recommendedApplicationStrategy, { size: BODY }));
  return Packer.toBuffer(new Document({ sections: [{ properties: { page: { margin: { top: 650, right: 700, bottom: 650, left: 700 } } }, children }] }));
}
