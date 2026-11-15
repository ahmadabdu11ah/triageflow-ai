import {
  Layers,
  Inbox,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export default function StatsCards({ stats, loading }) {
  const byStatus = stats?.by_status || {};
  const byPriority = stats?.by_priority || {};
  const byCategory = stats?.by_category || {};

  const total = stats?.total ?? 0;
  const openCount = byStatus.open ?? 0;
  const triagedAndActiveCount = (byStatus.triaged ?? 0) + (byStatus.in_progress ?? 0);
  const urgentCount = (byPriority.critical ?? 0) + (byPriority.high ?? 0);
  const resolvedCount = (byStatus.resolved ?? 0) + (byStatus.closed ?? 0);

  const cards = [
    {
      title: 'Total Tickets',
      value: total,
      subtitle: `${byCategory.bug ?? 0} bugs · ${byCategory.security ?? 0} security · ${byCategory.feature ?? 0} features`,
      icon: Layers,
      iconBg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      accentBorder: 'hover:border-indigo-500/40',
    },
    {
      title: 'Open / Untriaged',
      value: openCount,
      subtitle: `${byStatus.triaged ?? 0} AI-triaged awaiting action`,
      icon: Inbox,
      iconBg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      accentBorder: 'hover:border-sky-500/40',
    },
    {
      title: 'Triaged & In Progress',
      value: triagedAndActiveCount,
      subtitle: `${byStatus.triaged ?? 0} triaged · ${byStatus.in_progress ?? 0} in progress`,
      icon: Sparkles,
      iconBg: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
      accentBorder: 'hover:border-violet-500/40',
    },
    {
      title: 'Critical & High Priority',
      value: urgentCount,
      subtitle: `${byPriority.critical ?? 0} critical · ${byPriority.high ?? 0} high`,
      icon: AlertTriangle,
      iconBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      accentBorder: 'hover:border-rose-500/40',
    },
    {
      title: 'Resolved & Closed',
      value: resolvedCount,
      subtitle: `${byStatus.resolved ?? 0} resolved · ${byStatus.closed ?? 0} closed`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      accentBorder: 'hover:border-emerald-500/40',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 transition ${card.accentBorder}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">{card.title}</span>
              <div className={`p-2 rounded-xl border ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {loading && !stats ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-7 w-16 bg-slate-800 rounded-lg" />
                <div className="h-3.5 w-32 bg-slate-800/70 rounded" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-white tracking-tight">{card.value}</div>
                <p className="text-[11px] text-slate-400 mt-1 truncate">{card.subtitle}</p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
