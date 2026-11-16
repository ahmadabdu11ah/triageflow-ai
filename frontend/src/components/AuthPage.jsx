import { useState } from 'react';
import {
  Sparkles,
  LogIn,
  UserPlus,
  Zap,
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Bot,
  Activity,
} from 'lucide-react';
import { loginUser, registerUser, loginDemoUser, DEMO_CREDENTIALS } from '../api/auth';
import { getErrorMessage } from '../api/client';

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoStatus, setDemoStatus] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let tokenData;
      if (mode === 'login') {
        tokenData = await loginUser({ email, password });
      } else {
        tokenData = await registerUser({
          email,
          full_name: fullName,
          password,
        });
      }
      onAuthenticated(tokenData.user);
    } catch (err) {
      setError(getErrorMessage(err, 'Authentication failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (demoLoading || loading) return;
    setError('');
    setMode('login');
    setEmail(DEMO_CREDENTIALS.email);
    setFullName(DEMO_CREDENTIALS.full_name);
    setPassword(DEMO_CREDENTIALS.password);
    setDemoLoading(true);
    setDemoStatus('Signing in to demo account...');
    try {
      const tokenData = await loginDemoUser({
        onStatusChange: (msg) => setDemoStatus(msg),
      });
      onAuthenticated(tokenData.user);
    } catch (err) {
      setError(getErrorMessage(err, 'Demo User sign-in failed. Ensure the backend API is running.'));
    } finally {
      setDemoLoading(false);
      setDemoStatus('');
    }
  };

  const switchMode = (targetMode) => {
    setMode(targetMode);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center relative overflow-hidden px-4 py-12">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left column: Brand & Value Prop */}
        <div className="lg:col-span-6 space-y-6 pr-0 lg:pr-6">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Powered by Gemini Structured Output</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                TriageFlow <span className="text-indigo-400">AI</span>
              </h1>
            </div>
            <p className="text-slate-400 text-base leading-relaxed">
              Automated engineering issue classification, priority scoring, executive summaries,
              and ready-to-send responder drafts in milliseconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3.5 pt-2">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Zero-Touch AI Triage</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automatically categorizes bug, security, performance, and feature tickets with
                  confidence scores.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 mt-0.5">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Live KPI & Audit Timeline</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track every status transition, AI classification, and priority update in real time.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Instant Suggested Replies</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Copy empathetic, actionable first responses drafted specifically for the reporter.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Auth Card */}
        <div className="lg:col-span-6">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
            {/* 1-Click Demo User CTA */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/15 via-violet-500/15 to-indigo-500/10 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  Instant Sandbox Access
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {DEMO_CREDENTIALS.email}
                </span>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={demoLoading || loading}
                aria-busy={demoLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {demoLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{demoStatus || 'Signing in as Demo User...'}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>1-Click Demo User Login</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800" />
              <span className="flex-shrink mx-3 text-xs uppercase tracking-wider text-slate-500">
                Or continue with email
              </span>
              <div className="flex-grow border-t border-slate-800" />
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${mode === 'login'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${mode === 'register'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Register</span>
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      minLength={1}
                      maxLength={255}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ada Lovelace"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="engineer@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">Password</label>
                  {mode === 'register' && (
                    <span className="text-[11px] text-slate-500">8–72 characters</span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={mode === 'register' ? 8 : 1}
                    maxLength={72}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || demoLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                  </>
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>

              <p
                role="status"
                aria-live="polite"
                className={`text-center text-xs transition-colors ${loading || demoLoading
                    ? 'text-indigo-300 animate-pulse'
                    : 'text-slate-500'
                  }`}
              >
                Waking up free-tier API server first request may take ~20–30 seconds
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
