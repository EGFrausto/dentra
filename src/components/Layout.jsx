import { NavLink } from 'react-router-dom';
import { Home, Users, Calendar, FileText, Package, Settings, Image, LogOut, TrendingUp } from 'lucide-react';

const navItems = [
  { to: '/',              icon: Home,       label: 'Inicio',             color: 'from-indigo-500 to-indigo-600', shadow: 'shadow-indigo-200' },
  { to: '/pacientes',     icon: Users,      label: 'Pacientes',          color: 'from-blue-500 to-blue-600',     shadow: 'shadow-blue-200' },
  { to: '/citas',         icon: Calendar,   label: 'Citas',              color: 'from-violet-500 to-violet-600', shadow: 'shadow-violet-200' },
  { to: '/historias',     icon: FileText,   label: 'Historias Clínicas', color: 'from-sky-500 to-sky-600',       shadow: 'shadow-sky-200' },
  { to: '/radiografias',  icon: Image,      label: 'Radiografías',       color: 'from-rose-500 to-rose-600',     shadow: 'shadow-rose-200' },
  { to: '/finanzas',      icon: TrendingUp, label: 'Finanzas',           color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-200' },
  { to: '/inventario',    icon: Package,    label: 'Inventario',         color: 'from-amber-500 to-amber-600',   shadow: 'shadow-amber-200' },
  { to: '/configuracion', icon: Settings,   label: 'Configuración',      color: 'from-slate-500 to-slate-600',   shadow: 'shadow-slate-200' },
];

export default function Layout({ children, onLogout, session }) {
  return (
    <div className="flex h-screen bg-slate-100">
      <aside className="w-52 bg-white border-r border-slate-100 flex flex-col flex-shrink-0 shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <img src="/logo.png" alt="Dentra" className="h-10 w-auto mx-auto block" />
          {session && (
            <div className="mt-3 px-2 py-1.5 bg-indigo-50 rounded-lg text-center">
              <p className="text-xs font-semibold text-indigo-700 truncate">{session.clinic}</p>
              <p className="text-xs text-indigo-400 truncate">{session.user}</p>
            </div>
          )}
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, color, shadow }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${color} text-white font-semibold shadow-sm ${shadow}`
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}>
              {({ isActive }) => (<><Icon size={16} className={isActive ? 'opacity-100' : 'opacity-70'}/><span className="leading-none">{label}</span></>)}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100 space-y-2">
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
            <LogOut size={15}/> Cerrar sesión
          </button>
          <p className="text-xs text-slate-300 text-center">Powered by <span className="font-semibold text-slate-400">Atlara</span></p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}