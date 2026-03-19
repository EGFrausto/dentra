import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, FileText, Image, Package, Settings, LogOut, TrendingUp } from 'lucide-react';
import { profile as pStore } from '../lib/store';
import { useState, useEffect } from 'react';
import Header from './Header';

const navItems = [
  { to: '/',             icon: Home,       label: 'Inicio' },
  { to: '/pacientes',    icon: Users,      label: 'Pacientes' },
  { to: '/citas',        icon: Calendar,   label: 'Citas' },
  { to: '/historias',    icon: FileText,   label: 'Historias Clínicas' },
  { to: '/radiografias', icon: Image,      label: 'Radiografías' },
  { to: '/finanzas',     icon: TrendingUp, label: 'Finanzas' },
  { to: '/inventario',   icon: Package,    label: 'Inventario' },
  { to: '/configuracion',icon: Settings,   label: 'Configuración' },
];

export default function Layout({ children, onLogout, user }) {
  const [prof, setProf] = useState(() => pStore.getCached());
  const location = useLocation();

  useEffect(() => {
    if (user) {
      pStore.get().then(setProf);
      return pStore.subscribe(setProf);
    }
  }, [user]);

  const todayStr = new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const activeNavItem = navItems.find(item => item.to === location.pathname);
  const title = activeNavItem?.label || 'Dentra';
  const subtitle = location.pathname === '/' ? todayStr : '';

  const clinicName = prof?.name || user?.user_metadata?.clinic_name || 'Cargando...';
  const profName = prof?.doctor_name ? `${prof.doctor_prefix || ''} ${prof.doctor_name}`.trim() : null;
  const metaName = user?.user_metadata?.full_name ? `${user.user_metadata.prefix || ''} ${user.user_metadata.full_name}`.trim() : null;
  const docName = profName || metaName || user?.email || 'Doctor';

  return (
    <div className="flex h-screen bg-slate-100">
      <aside className="w-52 bg-white border-r border-slate-100 flex flex-col flex-shrink-0 shadow-sm z-40">
        <div className="p-4 border-b border-slate-100">
          <img src="/logo.png" alt="Dentra" className="h-10 w-auto mx-auto block" style={{filter:'brightness(0)'}}/>
          {user && (
            <div className="mt-3 px-2 py-1.5 bg-slate-100 rounded-lg text-center">
              <p className="text-xs font-semibold text-slate-700 truncate">{clinicName}</p>
              <p className="text-[10px] text-slate-400 truncate opacity-80">{docName}</p>
            </div>
          )}
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}>
              {({ isActive }) => (<><Icon size={15} className={isActive ? 'opacity-100' : 'opacity-70'}/><span className="leading-none">{label}</span></>)}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100 space-y-1">
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
            <LogOut size={14}/> Cerrar sesión
          </button>
          <p className="text-xs text-slate-300 text-center">Powered by <span className="font-semibold text-slate-400">Atlara</span></p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}