import { useEffect, useState } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Clock,
  User,
  Trash2,
  AlertCircle,
  Loader2,
  MessageSquareQuote,
  Activity,
  CheckCircle2,
  FilePlus2,
  Edit3,
  AlertTriangle,
} from 'lucide-react';
import {
  getTicket,
  updateTicket,
  triageTicket,
  deleteTicket,
} from '../api/tickets';
import { getErrorMessage } from '../api/client';
import {
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  TICKET_CATEGORIES,
  STATUS_MAP,
  PRIORITY_MAP,
  CATEGORY_MAP,
  formatDateTime,
} from '../constants/ticketMeta';

function getActivityMeta(action) {
  switch (action) {
    case 'created':
      return {
        label: 'Ticket Created',
        icon: FilePlus2,
        colorClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      };
    case 'triaged':
      return {
        label: 'AI Triage Completed',
        icon: Sparkles,
        colorClass: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
      };
    case 'updated':
      return {
        label: 'Ticket Updated',
        icon: Edit3,
        colorClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      };
    case 'triage_failed':
      return {
        label: 'AI Triage Error',
        icon: AlertTriangle,
        colorClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      };
    default:
      return {
        label: action,
        icon: CheckCircle2,
        colorClass: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
      };
  }
}

export default function TicketDetailDrawer({
  ticketId,
  initialTicket,
  onClose,
  onTicketUpdated,
  onTicketDeleted,
}) {
  const [ticket, setTicket] = useState(initialTicket || null);
  const [loading, setLoading] = useState(false);
  const [updatingField, setUpdatingField] = useState('');
  const [triaging, setTriaging] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copiedReply, setCopiedReply] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ticketId) {
      setTicket(null);
      return;
    }

    let cancelled = false;
    setError('');

    // If initialTicket already includes activities for this exact ticketId, show immediately while refreshing
    if (initialTicket && initialTicket.id === ticketId) {
      setTicket(initialTicket);
    }

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const fullDetail = await getTicket(ticketId);
        if (!cancelled) {
          setTicket(fullDetail);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Failed to load ticket details.'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  if (!ticketId) return null;

  const handleFieldChange = async (field, value) => {
    if (!ticket || ticket[field] === value) return;
    setError('');
    setUpdatingField(field);
    try {
      const updated = await updateTicket(ticket.id, { [field]: value });
      setTicket(updated);
      onTicketUpdated(updated);
    } catch (err) {
      setError(getErrorMessage(err, `Failed to update ${field}.`));
    } finally {
      setUpdatingField('');
    }
  };

  const handleRunTriage = async () => {
    if (!ticket) return;
    setError('');
    setTriaging(true);
    try {
      const updated = await triageTicket(ticket.id);
      setTicket(updated);
      onTicketUpdated(updated);
    } catch (err) {
      setError(
        getErrorMessage(err, 'AI triage service failed. Check GEMINI_API_KEY in backend/.env.')
      );
      // Refresh ticket so any logged `triage_failed` activity shows up in the timeline
      try {
        const refreshed = await getTicket(ticket.id);
        setTicket(refreshed);
      } catch {
        // ignore secondary error
      }
    } finally {
      setTriaging(false);
    }
  };

  const handleCopySuggestedReply = async () => {
    if (!ticket?.ai_suggested_reply) return;
    try {
      await navigator.clipboard.writeText(ticket.ai_suggested_reply);
      setCopiedReply(true);
      setTimeout(() => setCopiedReply(false), 2200);
    } catch {
      // Fallback copy method
      const textarea = document.createElement('textarea');
      textarea.value = ticket.ai_suggested_reply;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedReply(true);
      setTimeout(() => setCopiedReply(false), 2200);
    }
  };

  const handleDelete = async () => {
    if (!ticket) return;
    setError('');
    setDeleting(true);
    try {
      await deleteTicket(ticket.id);
      onTicketDeleted(ticket.id);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete ticket.'));
      setDeleting(false);
    }
  };

  const confidencePercent =
    ticket?.ai_confidence != null ? Math.round(ticket.ai_confidence * 100) : null;

  const statusMeta = STATUS_MAP[ticket?.status] || STATUS_MAP.open;
  const priorityMeta = PRIORITY_MAP[ticket?.priority] || PRIORITY_MAP.medium;
  const categoryMeta = CATEGORY_MAP[ticket?.category] || CATEGORY_MAP.other;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs">
      {/* Backdrop click target */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-Over Panel */}
      <aside className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs font-semibold">
              #{ticket?.id ?? ticketId}
            </span>
            {ticket && (
              <>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusMeta.badgeClass}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                  {statusMeta.label}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityMeta.badgeClass}`}
                >
                  {priorityMeta.label}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${categoryMeta.badgeClass}`}
                >
                  {categoryMeta.label}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || !ticket}
              title="Delete ticket"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loading && !ticket ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-7 w-3/4 bg-slate-800 rounded-lg" />
              <div className="h-24 w-full bg-slate-800/70 rounded-xl" />
              <div className="h-44 w-full bg-slate-800/50 rounded-2xl" />
            </div>
          ) : ticket ? (
            <>
              {/* Title & Description */}
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white leading-snug">{ticket.title}</h2>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    Reported by{' '}
                    <strong className="text-slate-200 font-medium">
                      {ticket.created_by?.full_name || ticket.created_by?.email || 'User'}
                    </strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Created {formatDateTime(ticket.created_at)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800/90 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {ticket.description}
                </div>
              </div>

              {/* Quick Workflow Controls (PATCH /api/tickets/{id}) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Status
                  </label>
                  <select
                    value={ticket.status}
                    disabled={updatingField === 'status'}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {TICKET_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={ticket.priority}
                    disabled={updatingField === 'priority'}
                    onChange={(e) => handleFieldChange('priority', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {TICKET_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Category
                  </label>
                  <select
                    value={ticket.category}
                    disabled={updatingField === 'category'}
                    onChange={(e) => handleFieldChange('category', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {TICKET_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* AI Triage Intelligence Section */}
              <div className="rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-violet-950/30 border border-indigo-500/30 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Gemini AI Triage Analysis
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Structured executive summary, confidence score & responder reply
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunTriage}
                    disabled={triaging}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 text-xs font-medium transition cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${triaging ? 'animate-spin' : ''}`} />
                    <span>{triaging ? 'Running AI Triage...' : 'Re-run AI Triage'}</span>
                  </button>
                </div>

                {/* Confidence Score Bar */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">AI Classification Confidence</span>
                    {confidencePercent != null ? (
                      <span className="font-mono font-semibold text-indigo-300">
                        {confidencePercent}% ({ticket.ai_confidence.toFixed(2)})
                      </span>
                    ) : (
                      <span className="text-slate-500">Not scored yet</span>
                    )}
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all duration-500"
                      style={{ width: `${confidencePercent ?? 0}%` }}
                    />
                  </div>
                </div>

                {/* AI Summary */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    AI Summary
                  </span>
                  {ticket.ai_summary ? (
                    <p className="text-sm text-slate-200 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 leading-relaxed">
                      {ticket.ai_summary}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-slate-950/50 border border-slate-800/60 rounded-xl p-3.5">
                      No AI summary generated yet. Click &ldquo;Re-run AI Triage&rdquo; above to
                      classify this ticket with Gemini.
                    </p>
                  )}
                </div>

                {/* AI Suggested Reply + Copy Button */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                      <MessageSquareQuote className="w-3.5 h-3.5" />
                      Suggested Responder Reply
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySuggestedReply}
                      disabled={!ticket.ai_suggested_reply}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        copiedReply
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                      }`}
                    >
                      {copiedReply ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Suggested Reply</span>
                        </>
                      )}
                    </button>
                  </div>

                  {ticket.ai_suggested_reply ? (
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {ticket.ai_suggested_reply}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs text-slate-400 italic">
                      No suggested reply available until AI triage completes.
                    </div>
                  )}
                </div>
              </div>

              {/* Ticket Activity Timeline */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    Ticket Activity Timeline ({ticket.activities?.length ?? 0})
                  </h3>
                </div>

                {!ticket.activities || ticket.activities.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4">
                    No activity events recorded yet.
                  </p>
                ) : (
                  <ol className="relative border-l border-slate-800 ml-3 space-y-4 py-1">
                    {ticket.activities.map((act) => {
                      const meta = getActivityMeta(act.action);
                      const Icon = meta.icon;
                      return (
                        <li key={act.id} className="ml-5">
                          <span
                            className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full border ${meta.colorClass}`}
                          >
                            <Icon className="w-3 h-3" />
                          </span>
                          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-200">
                                {meta.label}
                              </span>
                              <time className="text-[11px] text-slate-500">
                                {formatDateTime(act.created_at)}
                              </time>
                            </div>
                            {act.details && (
                              <p className="text-xs text-slate-400 mt-1 break-words">
                                {act.details}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
