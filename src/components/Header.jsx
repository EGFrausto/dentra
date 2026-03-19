import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Users, Calendar, FileText, Package } from 'lucide-react';
import { patients as pStore, appointments as aStore, records as rStore, inventory as iStore } from '../lib/store';
import NotificationBell from './NotificationBell';

export default function Header({ user, title, subtitle }) {
  const [globalSearch, setGlobalSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [pts, setPts] = useState(() => pStore.getCached());
  const [apts, setApts] = useState(() => aStore.getCached());
  const [recs, setRecs] = useState(() => rStore.getCached());
  const [inv, setInv] = useState(() => iStore.getCached());
  const searchRef = useRef(null);

  useEffect(() => {
    pStore.get().then(setPts);
    aStore.get().then(setApts);
    rStore.get().then(setRecs);
    iStore.get().then(setInv);
    
    const unsubs = [
      pStore.subscribe(setPts),
      aStore.subscribe(setApts),
      rStore.subscribe(setRecs),
      iStore.subscribe(setInv)
    ];

    const handler = e => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false); };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      unsubs.forEach(fn => fn());
    };
  }, []);

  const getName = id => pts.find(p => p.id === id)?.name || 'Desconocido';

  const s = globalSearch.toLowerCase();
  const searchResults = globalSearch.length >= 2 ? [
    ...pts.filter(p => p.name.toLowerCase().includes(s) || p.phone?.includes(s))
          .map(p => ({ type:'patient', label:p.name, sub:'Paciente · ' + (p.phone||'Sin tel.'), link:'/pacientes', icon:Users, color:'bg-slate-100 text-slate-600' })),
    ...apts.filter(a => getName(a.patient_id).toLowerCase().includes(s) || a.treatment?.toLowerCase().includes(s))
           .map(a => ({ type:'appt', label:getName(a.patient_id), sub:`Cita · ${a.date} · ${a.treatment}`, link:'/citas', icon:Calendar, color:'bg-slate-100 text-slate-600' })),
    ...recs.filter(r => r.diagnosis?.toLowerCase().includes(s) || r.treatment?.toLowerCase().includes(s) || getName(r.patient_id).toLowerCase().includes(s))
           .map(r => ({ type:'record', label:getName(r.patient_id), sub:`Historia · ${r.date} · ${r.diagnosis || r.treatment}`, link:'/historias', icon:FileText, color:'bg-slate-100 text-slate-600' })),
    ...inv.filter(i => i.name.toLowerCase().includes(s) || i.category?.toLowerCase().includes(s))
           .map(i => ({ type:'inv', label:i.name, sub:`Inventario · ${i.category} · ${i.quantity} ${i.unit}`, link:'/inventario', icon:Package, color:'bg-slate-100 text-slate-600' })),
  ].slice(0, 10) : [];

  return (
    <header className="flex items-center justify-between mb-8 px-8 py-6 sticky top-0 bg-slate-100/80 backdrop-blur-md z-30 border-b border-slate-200/50">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5 capitalize">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Universal search */}
        <div ref={searchRef} className="relative w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input 
            value={globalSearch} 
            onChange={e => { setGlobalSearch(e.target.value); setShowResults(true); }} 
            onFocus={() => setShowResults(true)}
            placeholder="Busca pacientes, citas, historias..." 
            className="w-full bg-white border border-slate-200 rounded-2xl px-10 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
          />
          {globalSearch && (
            <button onClick={() => { setGlobalSearch(''); setShowResults(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14}/>
            </button>
          )}
          
          {showResults && globalSearch.length >= 2 && (
            <div className="absolute top-full mt-2 w-full bg-white border border-slate-100 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {searchResults.length > 0 ? (
                <div className="p-2 space-y-1">
                  {searchResults.map((r, i) => (
                    <Link key={i} to={r.link} onClick={() => { setShowResults(false); setGlobalSearch(''); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-slate-50 transition-all group">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${r.color}`}>
                        <r.icon size={15}/>
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-700 truncate">{r.label}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{r.sub}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-sm text-slate-400">Sin resultados para "{globalSearch}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        <NotificationBell user={user} />
      </div>
    </header>
  );
}
