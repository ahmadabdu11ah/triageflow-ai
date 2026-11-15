import { useState } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  Wand2,
  Send,
} from 'lucide-react';
import { createTicket } from '../api/tickets';
import { getErrorMessage } from '../api/client';
import { SAMPLE_TICKET_TEMPLATES } from '../constants/ticketMeta';

export default function NewTicketModal({ isOpen, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleApplyTemplate = (template) => {
    setTitle(template.title);
    setDescription(template.description);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters.');
      return;
    }
    if (!description.trim()) {
      setError('Description cannot be empty.');
      return;
    }

    setSubmitting(true);
    try {
      const createdTicket = await createTicket({ title, description });
      setTitle('');
      setDescription('');
      onCreated(createdTicket);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create ticket.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Create New Ticket</h2>
              <p className="text-xs text-slate-400">
                Gemini AI will automatically classify category, priority, summary & draft a reply
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Quick-Fill Templates */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quick-fill a realistic scenario to test AI triage:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_TICKET_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  disabled={submitting}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-indigo-500/15 text-slate-300 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/40 text-xs font-medium transition cursor-pointer"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Issue Title <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-slate-500">{title.length}/255</span>
            </div>
            <input
              type="text"
              required
              minLength={3}
              maxLength={255}
              disabled={submitting}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., SAML SSO callback returns 500 error for enterprise accounts"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Detailed Description <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Include symptoms, impact & steps to reproduce
              </span>
            </div>
            <textarea
              required
              rows={5}
              minLength={1}
              maxLength={20000}
              disabled={submitting}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue, affected users, error logs, or expected behavior..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-y"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting & Running AI Triage...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Create & Auto-Triage Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
