export const TICKET_STATUSES = [
  {
    value: 'open',
    label: 'Open',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    dotClass: 'bg-sky-400',
  },
  {
    value: 'triaged',
    label: 'Triaged',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    dotClass: 'bg-violet-400',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotClass: 'bg-amber-400',
  },
  {
    value: 'resolved',
    label: 'Resolved',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
  },
  {
    value: 'closed',
    label: 'Closed',
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    dotClass: 'bg-slate-400',
  },
];

export const TICKET_PRIORITIES = [
  {
    value: 'critical',
    label: 'Critical',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dotClass: 'bg-rose-400',
  },
  {
    value: 'high',
    label: 'High',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    dotClass: 'bg-orange-400',
  },
  {
    value: 'medium',
    label: 'Medium',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotClass: 'bg-amber-400',
  },
  {
    value: 'low',
    label: 'Low',
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    dotClass: 'bg-slate-400',
  },
];

export const TICKET_CATEGORIES = [
  {
    value: 'bug',
    label: 'Bug',
    badgeClass: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
  },
  {
    value: 'security',
    label: 'Security',
    badgeClass: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/25',
  },
  {
    value: 'performance',
    label: 'Performance',
    badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  },
  {
    value: 'feature',
    label: 'Feature',
    badgeClass: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25',
  },
  {
    value: 'support',
    label: 'Support',
    badgeClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25',
  },
  {
    value: 'other',
    label: 'Other',
    badgeClass: 'bg-slate-500/10 text-slate-300 border-slate-500/25',
  },
];

export const STATUS_MAP = Object.fromEntries(TICKET_STATUSES.map((item) => [item.value, item]));
export const PRIORITY_MAP = Object.fromEntries(TICKET_PRIORITIES.map((item) => [item.value, item]));
export const CATEGORY_MAP = Object.fromEntries(TICKET_CATEGORIES.map((item) => [item.value, item]));

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export const SAMPLE_TICKET_TEMPLATES = [
  {
    label: 'Production Auth Outage',
    title: 'SSO login returns 500 error for enterprise workspace users',
    description:
      'Starting at 09:15 UTC after the v2.4.1 release, enterprise customers signing in via SAML SSO receive an HTTP 500 Internal Server Error on /api/auth/callback. Standard password login works, but over 400 enterprise seats are blocked from accessing their dashboards.',
  },
  {
    label: 'SQL Injection Alert',
    title: 'Potential unescaped parameter in legacy audit export endpoint',
    description:
      'Our security scanner flagged the query parameter `sort_col` on the legacy CSV export route as vulnerable to boolean-based blind SQL injection when crafted payloads are passed by authenticated reporters. Please patch and restrict column whitelist immediately.',
  },
  {
    label: 'Slow Dashboard Query',
    title: 'Analytics overview takes 14+ seconds to load for teams with 50k tickets',
    description:
      'When opening the weekly analytics tab on high-volume workspaces, the request hangs for 14-18 seconds before rendering. Database CPU spikes to 92% due to a sequential scan on ticket_activities without a composite index.',
  },
  {
    label: 'Webhook Slack Integration',
    title: 'Add Slack channel notifications when Critical tickets are triaged',
    description:
      'Our on-call engineering rotation would love an option in workspace settings to configure an incoming Slack webhook URL so any ticket classified as Critical or High priority by TriageFlow AI automatically posts a summary card to #incident-triage.',
  },
];
