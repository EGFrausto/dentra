import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { patients as pStore, appointments as aStore, config as cStore } from '../lib/store';

const STATUS_BADGE = {
  'Confirmada': 'badge badge-teal',
  'Programada': 'badge badge-indigo',
  'Completada': 'badge badge-slate',
  'Cancelada':  'badge badge-red',
};

export default function Home() {
  const [pts, setPts]   = useState([]);
  const [apts, setApts] = useState([]);
  const [cfg, setCfg]   = useState({});

  useEffect(() => {
    setPts(pStore.get());
    setApts(aStore.get());
    setCfg(cStore.get());
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayApts  = apts.filter(a => a.date === today).sort((a,b) => a.time.localeCompare(b.time));
  const upcoming   = apts.filter(a => a.date > today).sort((a,b) => a.date.localeCompare(b.date)||a.time.localeCompare(b.time)).slice(0,5);
  const completed  = todayApts.filter(a => a.status === 'Completada').length;
  const pending    = todayApts.filter(a => a.status !== 'Completada' && a.status !== 'Cancelada').length;
  const getName    = id => pts.find(p => p.id === id)?.name || 'Desconocido';

  const todayStr = new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const stats = [
    { label: 'Total Pacientes',   value: pts.length,        icon: Users,        from: 'from-indigo-500', to: 'to-indigo-600', shadow: 'shadow-indigo-200', light: 'bg-indigo-50',  text: 'text-indigo-600' },
    { label: 'Citas Hoy',         value: todayApts.length,  icon: Calendar,     from: 'from-violet-500', to: 'to-violet-600', shadow: 'shadow-violet-200', light: 'bg-violet-50', text: 'text-violet-600' },
    { label: 'Completadas Hoy',   value: completed,         icon: CheckCircle,  from: 'from-teal-500',   to: 'to-teal-600',   shadow: 'shadow-teal-200',   light: 'bg-indigo-50',   text: 'text-indigo-600' },
    { label: 'Pendientes Hoy',    value: pending,           icon: Clock,        from: 'from-amber-500',  to: 'to-amber-600',  shadow: 'shadow-amber-200',  light: 'bg-amber-50',  text: 'text-amber-600' },
  ];

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-800">Inicio</h1>
        <p className="text-sm text-slate-400 capitalize mt-0.5">{todayStr}</p>
        {cfg.doctor && <p className="text-sm text-slate-500 mt-1">Bienvenido, <span className="font-semibold text-slate-700">{cfg.doctor}</span></p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, from, to, shadow, light, text }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
                <p className="text-3xl font-bold text-slate-800">{value}</p>
              </div>
              <div className={`${light} p-2.5 rounded-xl`}>
                <Icon size={20} className={text} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Today */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">Citas de Hoy</h2>
            <Link to="/citas" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">Ver todas <ChevronRight size={13} /></Link>
          </div>
          {todayApts.length === 0
            ? <div className="text-center py-10"><Calendar size={32} className="text-slate-200 mx-auto mb-2" /><p className="text-sm text-slate-400">Sin citas hoy</p></div>
            : <div className="space-y-1">
                {todayApts.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-indigo-600 w-12 tabular-nums">{a.time}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{getName(a.patient_id)}</p>
                        <p className="text-xs text-slate-400">{a.treatment}</p>
                      </div>
                    </div>
                    <span className={STATUS_BADGE[a.status] || 'badge badge-slate'}>{a.status}</span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Upcoming */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">Próximas Citas</h2>
            <Link to="/citas" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">Ver calendario <ChevronRight size={13} /></Link>
          </div>
          {upcoming.length === 0
            ? <div className="text-center py-10"><Clock size={32} className="text-slate-200 mx-auto mb-2" /><p className="text-sm text-slate-400">Sin próximas citas</p></div>
            : <div className="space-y-1">
                {upcoming.map(a => {
                  const d = new Date(a.date + 'T12:00:00');
                  const dateLabel = d.toLocaleDateString('es-ES', { day:'2-digit', month:'short' });
                  return (
                    <div key={a.id} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
                      <div className="bg-slate-100 rounded-lg px-2.5 py-1.5 text-center min-w-[48px]">
                        <p className="text-xs font-semibold text-slate-600">{dateLabel}</p>
                        <p className="text-xs text-slate-400 tabular-nums">{a.time}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{getName(a.patient_id)}</p>
                        <p className="text-xs text-slate-400">{a.treatment}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </div>
      </div>
    </div>
  );
}
