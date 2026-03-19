import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, CheckCircle, Clock, ChevronRight, Search, X, Gift, TrendingUp, MessageCircle } from 'lucide-react';
import { patients as pStore, appointments as aStore, profile as profStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const STATUS_COLORS = {
  'Programada': { badge:'badge badge-indigo', card:'border-l-4 border-indigo-500' },
  'Confirmada': { badge:'badge badge-teal',   card:'border-l-4 border-teal-500' },
  'Completada': { badge:'badge badge-emerald',card:'border-l-4 border-emerald-500' },
  'Cancelada':  { badge:'badge badge-red',    card:'border-l-4 border-red-500' },
};

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function Home({ user }) {
  const [pts, setPts]     = useState(() => pStore.getCached());
  const [apts, setApts]   = useState(() => aStore.getCached());
  const [prof, setProf]     = useState(() => profStore.getCached());
  const [globalSearch, setGlobalSearch] = useState('');
  const [showResults, setShowResults]   = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const unsubs = [
      pStore.subscribe(setPts),
      aStore.subscribe(setApts),
      profStore.subscribe(setProf)
    ];
    return () => unsubs.forEach(fn => fn());
  }, []);

  useEffect(() => {
    const handler = e => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const now   = new Date();
  const todayApts = apts.filter(a => a.date === today).sort((a,b) => a.time.localeCompare(b.time));
  const upcoming  = apts.filter(a => a.date > today).sort((a,b) => a.date.localeCompare(b.date)||a.time.localeCompare(b.time)).slice(0,5);
  const completed = todayApts.filter(a => a.status === 'Completada').length;
  const pending   = todayApts.filter(a => a.status !== 'Completada' && a.status !== 'Cancelada').length;
  const getName   = id => pts.find(p => p.id === id)?.name || 'Desconocido';

  // Cumpleaños hoy
  const birthdays = pts.filter(p => {
    if (!p.birthdate) return false;
    const b = new Date(p.birthdate);
    return b.getMonth() === now.getMonth() && b.getDate() === now.getDate();
  });

  // Pacientes nuevos este mes
  const newPatientsThisMonth = pts.filter(p => {
    if (!p.id) return false;
    const created = parseInt(p.id);
    if (isNaN(created)) return false;
    const d = new Date(created);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Citas por semana (últimas 6 semanas)
  const weeklyData = Array.from({ length: 6 }, (_, i) => {
    const start = new Date(now);
    start.setDate(now.getDate() - (5 - i) * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const startStr = start.toISOString().split('T')[0];
    const endStr   = end.toISOString().split('T')[0];
    const count = apts.filter(a => a.date >= startStr && a.date <= endStr).length;
    return { name: `S${i+1}`, citas: count };
  });

  // Tratamientos más frecuentes
  const treatmentCount = apts.reduce((acc, a) => {
    if (!a.treatment) return acc;
    acc[a.treatment] = (acc[a.treatment] || 0) + 1;
    return acc;
  }, {});
  const topTreatments = Object.entries(treatmentCount).sort((a,b) => b[1]-a[1]).slice(0,4);

  const todayStr = new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const stats = [
    { label:'Total Pacientes', value:pts.length,       icon:Users,       light:'bg-slate-100', text:'text-slate-700' },
    { label:'Citas Hoy',       value:todayApts.length, icon:Calendar,    light:'bg-slate-100', text:'text-slate-700' },
    { label:'Completadas Hoy', value:completed,        icon:CheckCircle, light:'bg-green-100', text:'text-green-700' },
    { label:'Pendientes Hoy',  value:pending,          icon:Clock,       light:'bg-amber-100', text:'text-amber-700' },
  ];

  const sendBirthdayWhatsApp = (p) => {
    const msg = encodeURIComponent(`¡Feliz cumpleaños ${p.name}! 🎂 De parte de todo el equipo del consultorio, le deseamos un excelente día. ¡Es un placer tenerle como paciente!`);
    const phone = p.phone?.replace(/\D/g,'');
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const profName = prof?.doctor_name ? `${prof.doctor_prefix || ''} ${prof.doctor_name}`.trim() : null;
  const metaName = user?.user_metadata?.full_name ? `${user.user_metadata.prefix || ''} ${user.user_metadata.full_name}`.trim() : null;
  const welcomeName = profName || metaName || user?.email || 'Doctor';

  return (
    <div className="p-8 pt-2">
      <div className="mb-6">
        <p className="text-sm text-slate-500">
          Bienvenido(a), <span className="font-bold text-slate-800 tracking-tight">{welcomeName}</span>
        </p>
      </div>

      {/* Birthday alert */}
      {birthdays.length > 0 && (
        <div className="mb-5 bg-pink-50 border border-pink-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Gift size={20} className="text-pink-500 flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-sm font-semibold text-pink-800">
                🎂 {birthdays.length === 1 ? `¡Hoy es el cumpleaños de ${birthdays[0].name}!` : `¡${birthdays.length} pacientes cumplen años hoy!`}
              </p>
              {birthdays.length > 1 && <p className="text-xs text-pink-600 mt-0.5">{birthdays.map(p=>p.name).join(', ')}</p>}
            </div>
            {birthdays.map(p => p.phone && (
              <button key={p.id} onClick={() => sendBirthdayWhatsApp(p)}
                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-2 rounded-xl font-semibold transition-all flex-shrink-0">
                <MessageCircle size={13}/> Felicitar por WhatsApp
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {stats.map(({ label, value, icon: Icon, light, text }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
                <p className="text-3xl font-bold text-slate-800">{value}</p>
              </div>
              <div className={`${light} p-2.5 rounded-xl`}><Icon size={20} className={text}/></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts + appointments */}
      <div className="grid grid-cols-3 gap-5 mb-5">
        {/* Weekly chart */}
        <div className="card p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">Citas por semana</h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-400"><TrendingUp size={13}/> Últimas 6 semanas</div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData} margin={{top:0,right:0,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="name" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{borderRadius:'12px',border:'1px solid #e2e8f0',fontSize:'12px'}} formatter={v=>[v,'Citas']}/>
              <Bar dataKey="citas" fill="#334155" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top treatments */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Tratamientos frecuentes</h2>
          {topTreatments.length === 0
            ? <div className="text-center py-8 text-slate-300 text-sm">Sin datos aún</div>
            : <div className="space-y-3">
                {topTreatments.map(([name, count], i) => {
                  const max = topTreatments[0][1];
                  const colors = ['bg-slate-700','bg-slate-500','bg-slate-400','bg-slate-300'];
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-slate-600 truncate flex-1 mr-2">{name}</p>
                        <p className="text-xs font-bold text-slate-700">{count}</p>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${colors[i]}`} style={{width:`${(count/max)*100}%`}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Today */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">Citas de Hoy</h2>
            <Link to="/citas" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">Ver todas <ChevronRight size={13}/></Link>
          </div>
          {todayApts.length === 0
            ? <div className="text-center py-10"><Calendar size={32} className="text-slate-200 mx-auto mb-2"/><p className="text-sm text-slate-400">Sin citas hoy</p></div>
            : <div className="space-y-3 mt-2">
                {todayApts.map(a => (
                  <div key={a.id} className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 transition-all hover:shadow-md ${STATUS_COLORS[a.status]?.card || ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-bold text-sm">
                          {getName(a.patient_id).charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 leading-none">{getName(a.patient_id)}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={STATUS_COLORS[a.status]?.badge || 'badge badge-slate'}>{a.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-sm font-bold text-slate-700">{a.time.slice(0,5)}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{a.duration || 30} min</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-indigo-400"/>
                        <p className="text-sm text-slate-600 font-medium">{a.treatment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Upcoming */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">Próximas Citas</h2>
            <Link to="/citas" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">Ver calendario <ChevronRight size={13}/></Link>
          </div>
          {upcoming.length === 0
            ? <div className="text-center py-10"><Clock size={32} className="text-slate-200 mx-auto mb-2"/><p className="text-sm text-slate-400">Sin próximas citas</p></div>
            : <div className="space-y-3 mt-2">
                {upcoming.map(a => {
                  const d = new Date(a.date+'T12:00:00');
                  const dateLabel = d.toLocaleDateString('es-ES',{day:'2-digit',month:'short'});
                  return (
                    <div key={a.id} className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 transition-all hover:shadow-md ${STATUS_COLORS[a.status]?.card || ''}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 rounded-xl px-2 py-1.5 text-center min-w-[42px]">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">{dateLabel.split(' ')[1]}</p>
                            <p className="text-sm font-bold text-slate-700 leading-none">{dateLabel.split(' ')[0]}</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 leading-none">{getName(a.patient_id)}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={STATUS_COLORS[a.status]?.badge || 'badge badge-slate'}>{a.status}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-sm font-bold text-slate-700">{a.time.slice(0,5)}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{a.duration || 30} min</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={14} className="text-indigo-400"/>
                          <p className="text-sm text-slate-600 font-medium">{a.treatment}</p>
                        </div>
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