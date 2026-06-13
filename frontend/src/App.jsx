import { Routes, Route, Link, NavLink } from 'react-router-dom';
import TicketListPage from './pages/TicketListPage.jsx';
import CreateTicketPage from './pages/CreateTicketPage.jsx';
import TicketDetailPage from './pages/TicketDetailPage.jsx';

function Header() {
  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-brand-50 text-brand-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white font-bold">
            A
          </div>
          <div>
            <div className="text-base font-semibold text-slate-900">Appzeto Helpdesk</div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">
              Support Dashboard
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            Tickets
          </NavLink>
          <NavLink to="/tickets/new" className={linkClass}>
            New Ticket
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<TicketListPage />} />
          <Route path="/tickets/new" element={<CreateTicketPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          <Route
            path="*"
            element={
              <div className="card p-10 text-center">
                <div className="text-lg font-semibold">Page not found</div>
                <Link to="/" className="text-brand-600 hover:underline">
                  Back to tickets
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
