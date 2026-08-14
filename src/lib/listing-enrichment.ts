import * as cheerio from 'cheerio';
import type { Job } from './types';
import { expiredSignals } from './config';
import { parseSalary } from './utils';

function textFromHtml(value: string): string {
  return cheerio.load(value || '').text().replace(/\s+/g, ' ').trim();
}

function flattenJsonLd(parsed: any): any[] {
  if (Array.isArray(parsed)) return parsed.flatMap(flattenJsonLd);
  if (parsed?.['@graph']) return flattenJsonLd(parsed['@graph']);
  return parsed ? [parsed] : [];
}

function pickJobPosting($: cheerio.CheerioAPI): any | undefined {
  const values: any[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      values.push(...flattenJsonLd(JSON.parse($(el).text())));
    } catch { /* ignore malformed embedded metadata */ }
  });
  return values.find(value => value?.['@type'] === 'JobPosting' || (Array.isArray(value?.['@type']) && value['@type'].includes('JobPosting')));
}

function likelyOfficialEmployerUrl(url: string, company = ''): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (/indeed|linkedin|ziprecruiter|glassdoor|remotive|jobicy|serpapi|google\./i.test(host)) return false;
    if (/workdayjobs|myworkdayjobs|greenhouse|lever|smartrecruiters|careers|jobs\./i.test(host)) return true;
    const companyToken = company.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,8);
    return Boolean(companyToken && host.replace(/[^a-z0-9]/g,'').includes(companyToken));
  } catch { return false; }
}

export async function enrichAndVerifyListing(job: Job): Promise<Job> {
  if (!job.applicationUrl.startsWith('http')) return { ...job, active:false, verificationStatus:'INACTIVE', lastVerifiedDate:new Date().toISOString() };
  const checked = new Date().toISOString();
  try {
    const response = await fetch(job.applicationUrl, {
      method:'GET',
      redirect:'follow',
      headers:{ 'User-Agent':'Mozilla/5.0 JackDeeJobSearch/1.0' },
      signal:AbortSignal.timeout(15000),
    });
    if (response.status===404 || response.status===410) return { ...job, active:false, verificationStatus:'INACTIVE', lastVerifiedDate:checked };
    if (!response.ok) return { ...job, verificationStatus:'STATUS_UNCERTAIN', lastVerifiedDate:checked };

    const finalUrl = response.url || job.applicationUrl;
    const html = (await response.text()).slice(0, 500000);
    const lower = html.toLowerCase();
    if (expiredSignals.some(signal => lower.includes(signal))) return { ...job, active:false, verificationStatus:'INACTIVE', lastVerifiedDate:checked };

    const $ = cheerio.load(html);
    const structured = pickJobPosting($);
    const structuredDescription = structured?.description ? textFromHtml(String(structured.description)) : '';
    const mainText = $('main').text().replace(/\s+/g,' ').trim();
    const bodyText = $('body').text().replace(/\s+/g,' ').trim();
    const candidates = [job.description, structuredDescription, mainText, bodyText]
      .map(value => String(value || '').trim())
      .filter(value => value.length >= 200)
      .sort((a,b)=>b.length-a.length);
    const description = candidates[0] ?? job.description;
    const salary = parseSalary(`${JSON.stringify(structured?.baseSalary ?? '')} ${description}`);
    const employerDatePosted = structured?.datePosted ? String(structured.datePosted) : job.employerDatePosted || job.datePosted;
    const req = structured?.identifier?.value ? String(structured.identifier.value) : job.requisitionNumber || job.externalId;
    const directUrl = structured?.url && String(structured.url).startsWith('http') ? String(structured.url) : finalUrl;
    const official = likelyOfficialEmployerUrl(directUrl, job.company);
    const applySignal = /apply|application|submit your application|apply now/i.test(bodyText);
    const completeness = description.length >= 3000 ? 'FULL' : description.length >= 1200 ? 'MOSTLY_COMPLETE' : 'PARTIAL';

    return {
      ...job,
      applicationUrl: official ? directUrl : job.applicationUrl,
      employerCareersUrl: official ? directUrl : job.employerCareersUrl,
      description,
      descriptionCompleteness: completeness,
      employerDatePosted,
      datePosted: employerDatePosted || job.datePosted,
      requisitionNumber: req,
      salaryMin: job.salaryMin ?? salary.min,
      salaryMax: job.salaryMax ?? salary.max,
      salaryCurrency: job.salaryCurrency ?? (salary.min || salary.max ? 'USD' : undefined),
      active:true,
      verificationStatus: applySignal ? 'ACTIVE_VERIFIED' : 'ACTIVE_LIKELY',
      lastVerifiedDate:checked,
    };
  } catch {
    return {
      ...job,
      descriptionCompleteness: job.descriptionCompleteness ?? (job.description.length >= 3000 ? 'FULL' : job.description.length >= 1200 ? 'MOSTLY_COMPLETE' : 'PARTIAL'),
      verificationStatus:'STATUS_UNCERTAIN',
      lastVerifiedDate:checked,
    };
  }
}
