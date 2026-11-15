import { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  Plus,
  RefreshCw,
  LogOut,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import AuthPage from './components/AuthPage';
import StatsCards from './components/StatsCards';
import FilterBar from './components/FilterBar';
import TicketList from './components/TicketList';
import NewTicketModal from './components/NewTicketModal';
import TicketDetailDrawer from './components/TicketDetailDrawer';
import { getCurrentUser, clearSession } from './api/auth';
import { getTicketStats, listTickets } from './api/tickets';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY, getErrorMessage } from './api/client';

const INITIAL_FILTERS = {
  status: null,
  priority: null,
  category: null,
  search: '',
};

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authChecking, setAuthChecking] = useState(() =>
    Boolean(localStorage.getItem(TOKEN_STORAGE_KEY))
  );

  // Dashboard state
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');

  // Modal & Drawer state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Listen for 401 unauthorized events from Axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setSelectedTicket(null);
    };
    window.addEventListener('triageflow:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('triageflow:unauthorized', handleUnauthorized);
  }, []);

  // Verify token on initial load
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setAuthChecking(false);
      return;
    }

    let cancelled = false;
    getCurrentUser()
      .then((verifiedUser) => {
        if (!cancelled) setUser(verifiedUser);
      })
      .catch(() => {
        if (!cancelled) {
          clearSession();
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setAuthChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    setError('');
    try {
      const [statsRes, listRes] = await Promise.all([
        getTicketStats(),
        listTickets({
          status: filters.status,
          priority: filters.priority,
          category: filters.category,
          search: filters.search,
          skip: 0,
          limit: 50,
        }),
      ]);
      setStats(statsRes);
      setTickets(listRes.items || []);
      setTotalTickets(listRes.total ?? 0);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load dashboard data.'));
    } finally {
      setLoadingData(false);
    }
  }, [user, filters]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  const handleFilterChange = (partial) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setStats(null);
    setTickets([]);
    setSelectedTicket(null);
  };

  const handleTicketCreated = (createdTicket) => {
    setIsNewModalOpen(false);
    setSelectedTicket(createdTicket);
    fetchDashboardData();
  };

  const handleTicketUpdated = (updatedTicket) => {
    setSelectedTicket(updatedTicket);
    setTickets((prev) =>
      prev.map((item) => (item.id === updatedTicket.id ? updatedTicket : item))
    );
    getTicketStats()
      .then(setStats)
      .catch(() => {});
  };

  const handleTicketDeleted = (deletedId) => {
    setSelectedTicket(null);
    setTickets((prev) => prev.filter((item) => item.id !== deletedId));
    fetchDashboardData();
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <div className="flex items-center gap-3 text-sm font-medium">
          <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span>Restoring TriageFlow AI session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthenticated={(loggedInUser) => setUser(loggedInUser)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">
                  TriageFlow <span className="text-indigo-400">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gemini Triage Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Automated Engineering Issue Triage & Priority Scoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchDashboardData}
              disabled={loadingData}
              title="Refresh tickets and stats"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Ticket</span>
            </button>

            <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-medium text-slate-200 leading-none">
                {user.full_name}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">{user.email}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-rose-500/15 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 text-xs font-medium transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {error && (
          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={fetchDashboardData}
              className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold transition cursor-pointer shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Top KPI Stat Cards (/api/tickets/stats) */}
        <StatsCards stats={stats} loading={loadingData} />

        {/* Status & Priority Filter Pills + Search */}
        <FilterBar
          filters={filters}
          stats={stats}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />

        {/* Ticket List */}
        <TicketList
          tickets={tickets}
          total={totalTickets}
          loading={loadingData}
          selectedTicketId={selectedTicket?.id}
          onSelectTicket={(ticket) => setSelectedTicket(ticket)}
          onOpenNewModal={() => setIsNewModalOpen(true)}
        />
      </main>

      {/* New Ticket Modal */}
      <NewTicketModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={handleTicketCreated}
      />

      {/* Ticket Detail Slide-Over Drawer */}
      <TicketDetailDrawer
        ticketId={selectedTicket?.id}
        initialTicket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onTicketUpdated={handleTicketUpdated}
        onTicketDeleted={handleTicketDeleted}
      />
    </div>
  );
}
