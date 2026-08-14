import 'server-only';
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import type { Analysis, CoverLetterContent, Job, TailoredResumeContent } from '../types';

const FONT = 'Aptos';

function paragraph(text: string, options?: { bold?: boolean; size?: number; spacingAfter?: number; alignment?: (typeof AlignmentType)[keyof typeof AlignmentType] }) {
  return new Paragraph({
    alignment: options?.alignment,
    spacing: { after: options?.spacingAfter ?? 100 },
    children: [new TextRun({ text, bold: options?.bold, size: options?.size ?? 21, font: FONT })],
  });
}

export async function resumeDocx(content: TailoredResumeContent): Promise<Buffer> {
  const children: Paragraph[] = [];
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: content.candidateName, bold: true, size: 30, font: FONT })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: content.contactLine, size: 19, font: FONT })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: content.headline, bold: true, size: 22, font: FONT })] }));
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 80, after: 40 }, children: [new TextRun({ text: 'PROFESSIONAL SUMMARY', bold: true, size: 21, font: FONT })] }));
  children.push(paragraph(content.summary, { size: 20, spacingAfter: 90 }));
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 60, after: 40 }, children: [new TextRun({ text: 'CORE COMPETENCIES', bold: true, size: 21, font: FONT })] }));
  children.push(paragraph(content.coreCompetencies.join(' • '), { size: 19, spacingAfter: 80 }));

  for (const section of content.sections) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 80, after: 40 }, children: [new TextRun({ text: section.heading.toUpperCase(), bold: true, size: 21, font: FONT })] }));
    for (const p of section.paragraphs ?? []) children.push(paragraph(p, { size: 20, spacingAfter: 40 }));
    for (const b of section.bullets ?? []) {
      children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 35 }, children: [new TextRun({ text: b, size: 20, font: FONT })] }));
    }
  }

  if (content.education.length) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 80, after: 40 }, children: [new TextRun({ text: 'EDUCATION', bold: true, size: 21, font: FONT })] }));
    for (const item of content.education) children.push(paragraph(item, { size: 20, spacingAfter: 30 }));
  }
  if (content.certifications.length) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 80, after: 40 }, children: [new TextRun({ text: 'CERTIFICATIONS', bold: true, size: 21, font: FONT })] }));
    children.push(paragraph(content.certifications.join(' • '), { size: 19 }));
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: 20 }, paragraph: { spacing: { line: 240 } } } } },
    sections: [{ properties: { page: { margin: { top: 540, right: 620, bottom: 540, left: 620 } } }, children }],
  });
  return Packer.toBuffer(doc);
}

export async function coverLetterDocx(content: CoverLetterContent, candidateName: string): Promise<Buffer> {
  const children: Paragraph[] = [
    paragraph(candidateName, { bold: true, size: 28, spacingAfter: 40 }),
    paragraph(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), { size: 20, spacingAfter: 160 }),
    paragraph(content.salutation, { size: 21, spacingAfter: 100 }),
  ];
  for (const p of content.paragraphs) children.push(paragraph(p, { size: 21, spacingAfter: 120 }));
  children.push(paragraph(content.closing, { size: 21, spacingAfter: 60 }));
  children.push(paragraph(candidateName, { size: 21 }));
  const doc = new Document({ sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } }, children }] });
  return Packer.toBuffer(doc);
}

export async function jobDescriptionDocx(job: Job): Promise<Buffer> {
  const children: Paragraph[] = [
    paragraph(`${job.company} | ${job.title}`, { bold: true, size: 28, spacingAfter: 100 }),
    paragraph(`Location: ${job.location}`),
    paragraph(`Work arrangement: ${job.workArrangement}`),
    paragraph(`Source: ${job.source}`),
    paragraph(`Posting URL: ${job.applicationUrl}`, { spacingAfter: 140 }),
    paragraph(job.description, { size: 20 }),
  ];
  return Packer.toBuffer(new Document({ sections: [{ children }] }));
}

export async function analysisDocx(job: Job, analysis: Analysis): Promise<Buffer> {
  const rows = [
    `Overall Fit Score: ${analysis.overallFitScore}/100`,
    `ATS Score Before Tailoring: ${analysis.atsScore}/100`,
    `Priority Score: ${analysis.priorityScore}/100`,
    `Priority: ${analysis.priorityRecommendation}`,
    `Overqualification Risk: ${analysis.overqualificationRisk}`,
    `Underqualification Risk: ${analysis.underqualificationRisk}`,
  ];
  const children: Paragraph[] = [paragraph(`${job.company} | ${job.title}`, { bold: true, size: 28, spacingAfter: 100 }), ...rows.map(r => paragraph(r))];
  for (const [heading, items] of [['Strengths', analysis.strengths], ['Wording Gaps', analysis.wordingGaps], ['True Experience Gaps', analysis.trueExperienceGaps], ['Hard Qualification Risks', analysis.hardQualificationRisks], ['Recruiter Objections', analysis.recruiterObjections]] as const) {
    children.push(paragraph(heading, { bold: true, size: 22, spacingAfter: 50 }));
    for (const item of items) children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: item, font: FONT, size: 20 })] }));
  }
  children.push(paragraph('Recommended Application Strategy', { bold: true, size: 22, spacingAfter: 50 }));
  children.push(paragraph(analysis.recommendedApplicationStrategy, { size: 20 }));
  return Packer.toBuffer(new Document({ sections: [{ children }] }));
}
