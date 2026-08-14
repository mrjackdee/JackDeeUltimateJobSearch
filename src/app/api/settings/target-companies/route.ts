import { NextRequest, NextResponse } from 'next/server';
import { updateState } from '@/lib/storage/state';
import { logAppIssue, plainUserError } from '@/lib/issues';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const companies: string[] = Array.isArray(body.companies)
      ? body.companies.map((value: unknown) => String(value).trim()).filter((value: string) => Boolean(value)).slice(0, 50)
      : [];
    const unique: string[] = [...new Set<string>(companies)];
    await updateState(state => { state.settings.targetCompanies = unique; });
    return NextResponse.json({ ok: true, companies: unique });
  } catch (error) {
    const userMessage = plainUserError('Your target company list could not be saved right now. Please try again.', error);
    await logAppIssue({
      area: 'Search settings',
      action: 'Update target companies',
      severity: 'ERROR',
      userMessage,
      technicalMessage: error instanceof Error ? error.stack ?? error.message : String(error),
      route: '/api/settings/target-companies',
      statusCode: 500,
      resolved: false,
    });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
