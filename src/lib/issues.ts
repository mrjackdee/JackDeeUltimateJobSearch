import 'server-only';
import { nanoid } from 'nanoid';
import { updateState } from './storage/state';
import type { AppIssue } from './types';

export async function logAppIssue(input: Omit<AppIssue, 'id' | 'occurredAt'>) {
  const issue: AppIssue = {
    id: nanoid(),
    occurredAt: new Date().toISOString(),
    ...input,
  };

  try {
    await updateState(state => {
      const current = state.issues ?? [];
      state.issues = [issue, ...current].slice(0, 1000);
    });
  } catch (error) {
    console.error('Unable to persist app issue log', issue, error);
  }

  return issue;
}

export function plainUserError(fallback: string, error?: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message && !/GOOGLE_|OAuth|API|mime|token|credential|stack|ECONN|ENOTFOUND|TypeError|ReferenceError|SyntaxError/i.test(message)) return message;
  return fallback;
}
