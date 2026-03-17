import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { appointments as aStore, patients as pStore } from '../lib/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const COLORS = ['#4f46e5','#7c3aed','#0ea5e9','#f59e0b','#10b981','#ef4444','#ec4899','#f97316','#06b6d4','#84cc16'];

export default function Finance() {
  const [apts, setApts]   = useState([]);
  const [pts, setPts]     = useState([]);
  const [editing, setEditing] = useState(null);
  const [amount, setAmount]   = useState('');

  useEffect(() => { setApts(aStore.get()); setPts(pStore.get()); }, []);
  const reload = () => setApts(aStore.get());

  const getName = id => pts.find(p => p.id === id)?.name || 'Desconocido';
  const completed = apts.filter(a => a.status === 'Completada');

  const saveAmount = (id) => {
    aStore.update(id, { amount: parseFloat(amount) || 0 });
    reload(); setEditing(null); setAmount('');
  };

  const now = new Date();
  const thisYear  = now.getFullYear();
  const thisMonth = now.getMonth();

  // Ingresos por mes (últimos 6 meses)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(thisYear, thisMonth - (5 - i), 1);
    const mo = d.getMonth(), yr = d.getFullYear();
    const total = completed
      .filter(a => { const ad = new Date(a.date); return ad.getMonth()===mo && ad.getFullYear()===yr; })
      .reduce((sum, a) => sum + (a.amount || 0), 0);
    return { name: MONTHS[mo], total };
  });

  // Ingresos por tratamiento
  const byTreatment = completed.reduce((acc, a) => {
    if (!a.amount) return acc;
    const t = a.treatment || 'Sin tratamiento';
    acc[t] = (acc[t] || 0) + (a.amount || 0);
    return acc;
  }, {});
  const treatmentData = Object.entries(byTreatment)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const totalMonth = completed
    .filter(a => { const d = new Date(a.date); return d.getMonth()===thisMonth && d.getFullYear()===thisYear; })
    .reduce((sum, a) => sum + (a.amount || 0), 0);

  const totalYear = completed
    .filter(a => new Date(a.date).getFullYear() === thisYear)
    .reduce((sum, a) => sum + (a.amount || 0), 0);

  const totalAll = completed.reduce((sum, a) => sum + (a.amount || 0), 0);
  const withAmount = completed.filter(a => a.amount > 0).length;

  const fmt = n => n.toLocaleString('es-MX', { style:'currency', currency:'MXN', minimumFractionDigits:0 });

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-800">Finanzas</h1>
        <p className="text-sm text-slate-400 mt-0.5">Ingresos por tratamiento</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label:'Este mes',        value:fmt(totalMonth), icon:Calendar,     light:'bg-indigo-50',  text:'text-indigo-600' },
          { label:'Este año',        value:fmt(totalYear),  icon:TrendingUp,   light:'bg-violet-50',  text:'text-violet-600' },
          { label:'Total histórico', value:fmt(totalAll),   icon:DollarSign,   light:'bg-sky-50',     text:'text-sky-600' },
          { label:'Citas con monto', value:withAmount,      icon:CheckCircle,  light:'bg-amber-50',   text:'text-amber-600' },
        ].map(({ label, value, icon:Icon, light, text }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
                <p className="text-xl font-bold text-slate-800">{value}</p>
              </div>
              <div className={`${light} p-2.5 rounded-xl`}><Icon size={20} className={text}/></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-5 mb-6">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Ingresos últimos 6 meses</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{top:0,right:0,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="name" tick={{fontSize:12, fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11, fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toLocaleString()}`}/>
              <Tooltip formatter={v => [fmt(v), 'Ingresos']} contentStyle={{borderRadius:'12px',border:'1px solid #e2e8f0',fontSize:'12px'}}/>
              <Bar dataKey="total" fill="#4f46e5" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Ingresos por tratamiento</h2>
          {treatmentData.length === 0
            ? <div className="flex items-center justify-center h-52 text-slate-300 text-sm">Sin datos aún</div>
            : <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={treatmentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                    {treatmentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} contentStyle={{borderRadius:'12px',border:'1px solid #e2e8f0',fontSize:'12px'}}/>
                  <Legend iconType="circle" iconSize={8} formatter={v => <span style={{fontSize:'11px',color:'#64748b'}}>{v}</span>}/>
                </PieChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* Completed appointments table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">Citas completadas</h2>
          <p className="text-xs text-slate-400">Haz clic en el monto para editarlo</p>
        </div>
        <div className="grid grid-cols-5 px-5 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
          <span className="col-span-2">Paciente</span>
          <span>Fecha</span>
          <span>Tratamiento</span>
          <span>Monto</span>
        </div>
        {completed.length === 0
          ? <div className="py-12 text-center text-sm text-slate-400">No hay citas completadas aún</div>
          : completed.sort((a,b) => b.date.localeCompare(a.date)).map(a => (
            <div key={a.id} className="grid grid-cols-5 items-center px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors">
              <span className="col-span-2 text-sm font-medium text-slate-700">{getName(a.patient_id)}</span>
              <span className="text-sm text-slate-500">{a.date}</span>
              <span className="text-sm text-slate-500">{a.treatment || '—'}</span>
              <div>
                {editing === a.id
                  ? <div className="flex items-center gap-1">
                      <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}
                        placeholder="0.00" className="input-field py-1.5 px-2 text-xs w-24"
                        onKeyDown={e => e.key==='Enter' && saveAmount(a.id)} autoFocus/>
                      <button onClick={() => saveAmount(a.id)} className="text-xs px-2 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">OK</button>
                      <button onClick={() => setEditing(null)} className="text-xs px-2 py-1.5 bg-slate-100 text-slate-500 rounded-lg">✕</button>
                    </div>
                  : <button onClick={() => { setEditing(a.id); setAmount(a.amount || ''); }}
                      className={`text-sm font-semibold ${a.amount ? 'text-indigo-600 hover:text-indigo-800' : 'text-slate-300 hover:text-slate-500'} transition-colors`}>
                      {a.amount ? fmt(a.amount) : '+ Agregar'}
                    </button>
                }
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}