import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, CheckCircle, Clock, ChevronRight, Search, X } from 'lucide-react';
import { patients as pStore, appointments as aStore, config as cStore } from '../lib/store';

const STATUS_BADGE = {
  'Confirmada': 'badge badge-teal',
  'Programada': 'badge badge-indigo',
  'Completada': 'badge badge-slate',
  'Cancelada':  'badge badge-red',
};

export default function Home() {
  const [pts, setPts]     = useState([]);
  const [apts, setApts]   = useState([]);
  const [cfg, setCfg]     = useState({});
  const [globalSearch, setGlobalSearch] = useState('');
  const [showResults, setShowResults]   = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    setPts(pStore.get());
    setApts(aStore.get());
    setCfg(cStore.get());
  }, []);

  useEffect(() => {
    const handler = e => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayApts = apts.filter(a => a.date === today).sort((a,b) => a.time.localeCompare(b.time));
  const upcoming  = apts.filter(a => a.date > today).sort((a,b) => a.date.localeCompare(b.date)||a.time.localeCompare(b.time)).slice(0,5);
  const completed = todayApts.filter(a => a.status === 'Completada').length;
  const pending   = todayApts.filter(a => a.status !== 'Completada' && a.status !== 'Cancelada').length;
  const getName   = id => pts.find(p => p.id === id)?.name || 'Desconocido';

  // Global search results
  const searchResults = globalSearch.length >= 2 ? [
    ...pts.filter(p => p.name.toLowerCase().includes(globalSearch.toLowerCase()) || p.phone?.includes(globalSearch))
          .map(p => ({ type:'patient', label:p.name, sub:p.phone, link:'/pacientes' })),
    ...apts.filter(a => getName(a.patient_id).toLowerCase().includes(globalSearch.toLowerCase()) || a.treatment?.toLowerCase().includes(globalSearch.toLowerCase()))
           .map(a => ({ type:'appt', label:getName(a.patient_id), sub:`${a.date} · ${a.treatment}`, link:'/citas' })),
  ].slice(0, 8) : [];

  const todayStr = new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const stats = [
    { label:'Total Pacientes', value:pts.length,       icon:Users,       light:'bg-indigo-50', text:'text-indigo-600' },
    { label:'Citas Hoy',       value:todayApts.length, icon:Calendar,    light:'bg-violet-50', text:'text-violet-600' },
    { label:'Completadas Hoy', value:completed,        icon:CheckCircle, light:'bg-sky-50',    text:'text-sky-600' },
    { label:'Pendientes Hoy',  value:pending,          icon:Clock,       light:'bg-amber-50',  text:'text-amber-600' },
  ];

  return (
    <div className="p-8">
      {/* Header with global search */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inicio</h1>
          <p className="text-sm text-slate-400 capitalize mt-0.5">{todayStr}</p>
          {cfg.doctor && <p className="text-sm text-slate-500 mt-1">Bienvenido, <span className="font-semibold text-slate-700">{cfg.doctor}</span></p>}
        </div>

        {/* Global search */}
        <div ref={searchRef} className="relative w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={globalSearch}
            onChange={e => { setGlobalSearch(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
            placeholder="Buscar pacientes, citas..."
            className="input-field pl-10 pr-8"
          />
          {globalSearch && (
            <button onClick={() => { setGlobalSearch(''); setShowResults(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14}/>
            </button>
          )}

          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full mt-1.5 w-full bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="p-1.5">
                {searchResults.map((r, i) => (
                  <Link key={i} to={r.link} onClick={() => { setShowResults(false); setGlobalSearch(''); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${r.type==='patient'?'bg-indigo-100':'bg-violet-100'}`}>
                      {r.type==='patient' ? <Users size={13} className="text-indigo-600"/> : <Calendar size={13} className="text-violet-600"/>}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{r.label}</p>
                      <p className="text-xs text-slate-400">{r.sub}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {showResults && globalSearch.length >= 2 && searchResults.length === 0 && (
            <div className="absolute top-full mt-1.5 w-full bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-4 text-center">
              <p className="text-sm text-slate-400">Sin resultados para "{globalSearch}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, light, text }) => (
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
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">Citas de Hoy</h2>
            <Link to="/citas" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">Ver todas <ChevronRight size={13}/></Link>
          </div>
          {todayApts.length === 0
            ? <div className="text-center py-10"><Calendar size={32} className="text-slate-200 mx-auto mb-2"/><p className="text-sm text-slate-400">Sin citas hoy</p></div>
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
                    <span className={STATUS_BADGE[a.status]||'badge badge-slate'}>{a.status}</span>
                  </div>
                ))}
              </div>
          }
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">Próximas Citas</h2>
            <Link to="/citas" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">Ver calendario <ChevronRight size={13}/></Link>
          </div>
          {upcoming.length === 0
            ? <div className="text-center py-10"><Clock size={32} className="text-slate-200 mx-auto mb-2"/><p className="text-sm text-slate-400">Sin próximas citas</p></div>
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