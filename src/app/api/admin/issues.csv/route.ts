import { getState } from '@/lib/storage/state';

function csv(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const state = await getState();
  const issues = (state.issues ?? []).slice().sort((a,b) => b.occurredAt.localeCompare(a.occurredAt));
  const header = ['occurred_at','severity','area','action','user_message','technical_message','route','status_code','resolved'];
  const rows = issues.map(issue => [
    issue.occurredAt,
    issue.severity,
    issue.area,
    issue.action ?? '',
    issue.userMessage,
    issue.technicalMessage ?? '',
    issue.route ?? '',
    issue.statusCode ?? '',
    issue.resolved ? 'yes' : 'no',
  ]);
  const body = [header, ...rows].map(row => row.map(csv).join(',')).join('\n');
  return new Response(body, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="jackdee-job-search-issue-log-${new Date().toISOString().slice(0,10)}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
