import {
  Sparkles,
  ChevronRight,
  Inbox,
  Plus,
  Clock,
  User,
} from 'lucide-react';
import {
  STATUS_MAP,
  PRIORITY_MAP,
  CATEGORY_MAP,
  formatDateTime,
} from '../constants/ticketMeta';

export default function TicketList({
  tickets,
  total,
  loading,
  selectedTicketId,
  onSelectTicket,
  onOpenNewModal,
}) {
  if (loading && tickets.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-6 space-y-3">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="h-20 w-full rounded-xl bg-slate-800/50 animate-pulse border border-slate-800"
          />
        ))}
      </div>
    );
  }

  if (!loading && tickets.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-12 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
          <Inbox className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-base font-semibold text-white">No tickets match the current view</h3>
          <p className="text-xs text-slate-400">
            Create a new issue ticket to watch TriageFlow AI automatically classify priority,
            category, summary, and draft a responder reply.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create First Ticket</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/40">
        <span className="text-xs font-semibold text-slate-300">
          Showing <span className="text-white">{tickets.length}</span> of{' '}
          <span className="text-white">{total}</span> tickets
        </span>
        <span className="text-[11px] text-slate-400">
          Click any ticket to inspect AI triage & activity timeline
        </span>
      </div>

      <div className="divide-y divide-slate-800/80">
        {tickets.map((ticket) => {
          const statusMeta = STATUS_MAP[ticket.status] || STATUS_MAP.open;
          const priorityMeta = PRIORITY_MAP[ticket.priority] || PRIORITY_MAP.medium;
          const categoryMeta = CATEGORY_MAP[ticket.category] || CATEGORY_MAP.other;
          const isSelected = selectedTicketId === ticket.id;
          const confidencePct =
            ticket.ai_confidence != null ? Math.round(ticket.ai_confidence * 100) : null;

          return (
            <div
              key={ticket.id}
              onClick={() => onSelectTicket(ticket)}
              className={`group px-5 py-4 transition cursor-pointer flex items-start justify-between gap-4 ${
                isSelected
                  ? 'bg-indigo-500/10 border-l-2 border-l-indigo-400'
                  : 'hover:bg-slate-800/40'
              }`}
            >
              <div className="min-w-0 flex-1 space-y-2">
                {/* Top Metadata Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-slate-400 font-semibold">
                    #{ticket.id}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusMeta.badgeClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                    {statusMeta.label}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${priorityMeta.badgeClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dotClass}`} />
                    {priorityMeta.label}
                  </span>

                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${categoryMeta.badgeClass}`}
                  >
                    {categoryMeta.label}
                  </span>

                  {confidencePct != null && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      AI {confidencePct}%
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-white group-hover:text-indigo-200 transition truncate">
                  {ticket.title}
                </h3>

                {/* AI Summary Preview or Description Fallback */}
                {ticket.ai_summary ? (
                  <p className="text-xs text-slate-300 line-clamp-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{ticket.ai_summary}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 line-clamp-1">{ticket.description}</p>
                )}

                {/* Bottom Reporter & Timestamp */}
                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {ticket.created_by?.full_name || ticket.created_by?.email || 'Reporter'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(ticket.created_at)}
                  </span>
                </div>
              </div>

              <div className="self-center text-slate-500 group-hover:text-indigo-400 transition shrink-0">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
