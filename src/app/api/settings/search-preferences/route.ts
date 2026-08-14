import { NextRequest, NextResponse } from 'next/server';
import { updateState } from '@/lib/storage/state';
import { logAppIssue, plainUserError } from '@/lib/issues';

const allowedThresholds = new Set([70, 75, 80, 85, 90, 95]);
const allowedLookbacks = new Set([1, 3, 7, 14, 30]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fitThreshold = Number(body.fitThreshold);
    const lookbackDays = Number(body.lookbackDays);
    const showStretchRoles = Boolean(body.showStretchRoles);
    const showContractRoles = Boolean(body.showContractRoles);

    if (!allowedThresholds.has(fitThreshold)) return NextResponse.json({ error: 'Choose one of the available minimum match scores.' }, { status: 400 });
    if (!allowedLookbacks.has(lookbackDays)) return NextResponse.json({ error: 'Choose one of the available posting-date ranges.' }, { status: 400 });

    await updateState(state => {
      state.settings.fitThreshold = fitThreshold;
      state.settings.lookbackDays = lookbackDays;
      state.settings.showStretchRoles = showStretchRoles;
      state.settings.showContractRoles = showContractRoles;
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const userMessage = plainUserError('Your search preferences could not be saved right now. Please try again.', error);
    await logAppIssue({
      area: 'Search settings',
      action: 'Save job matching preferences',
      severity: 'ERROR',
      userMessage,
      technicalMessage: error instanceof Error ? error.stack ?? error.message : String(error),
      route: '/api/settings/search-preferences',
      statusCode: 500,
      resolved: false,
    });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
