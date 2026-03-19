import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, CheckCircle, Save, User } from 'lucide-react';
import { appointments as aStore, patients as pStore } from '../lib/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AlertModal from '../components/AlertModal';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const COLORS = ['#1e293b','#334155','#475569','#64748b','#94a3b8','#cbd5e1','#e2e8f0','#f1f5f9'];

export default function Finance() {
  const [apts, setApts]   = useState(() => aStore.getCached());
  const [pts, setPts]     = useState(() => pStore.getCached());
  const [editing, setEditing] = useState(null);
  const [amount, setAmount]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [alert, setAlert]     = useState(null);

  useEffect(() => {
    pStore.get().then(setPts);
    aStore.get().then(setApts);

    const unsubs = [
      pStore.subscribe(setPts),
      aStore.subscribe(setApts)
    ];
    return () => unsubs.forEach(fn => fn());
  }, []);

  const completed = apts.filter(a => a.status === 'Completada');
  const getName = id => pts.find(p=>p.id===id)?.name || 'Paciente desconocido';

  const saveAmount = async (id) => {
    setSaving(true);
    try {
      await aStore.update(id, { amount: parseFloat(amount) || 0 });
      const updated = await aStore.get();
      setApts(updated);
      setEditing(null);
      setAmount('');
    } catch (err) {
      setAlert('Error al guardar monto: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const now = new Date();
  const thisYear  = now.getFullYear();
  const thisMonth = now.getMonth();

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(thisYear, thisMonth - (5 - i), 1);
    const mo = d.getMonth(), yr = d.getFullYear();
    const total = completed
      .filter(a => { const ad = new Date(a.date); return ad.getMonth()===mo && ad.getFullYear()===yr; })
      .reduce((sum, a) => sum + (a.amount || 0), 0);
    return { name: MONTHS[mo], total };
  });

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
  const totalYear  = completed.filter(a => new Date(a.date).getFullYear()===thisYear).reduce((sum,a)=>sum+(a.amount||0),0);
  const totalAll   = completed.reduce((sum,a)=>sum+(a.amount||0),0);
  const withAmount = completed.filter(a=>a.amount>0).length;

  const fmt = n => n.toLocaleString('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:0});

  return (
    <div className="p-8 pt-2">
      <div className="flex items-center justify-between mb-8">
        <p className="text-sm text-slate-400 mt-0.5">Indicadores de ingresos y gestión de montos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label:'Este mes',        value:fmt(totalMonth), icon:Calendar,    light:'bg-slate-100', text:'text-slate-700' },
          { label:'Este año',        value:fmt(totalYear),  icon:TrendingUp,  light:'bg-slate-100', text:'text-slate-700' },
          { label:'Total histórico', value:fmt(totalAll),   icon:DollarSign,  light:'bg-green-100', text:'text-green-700' },
          { label:'Citas con monto', value:withAmount,      icon:CheckCircle, light:'bg-amber-100', text:'text-amber-700' },
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Ingresos últimos 6 meses</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{top:0,right:0,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="name" tick={{fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v.toLocaleString()}`}/>
              <Tooltip formatter={v=>[fmt(v),'Ingresos']} contentStyle={{borderRadius:'12px',border:'1px solid #e2e8f0',fontSize:'12px',boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}} cursor={{fill:'#f8fafc'}}/>
              <Bar dataKey="total" fill="#334155" radius={[6,6,0,0]}/>
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
                    {treatmentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent"/>)}
                  </Pie>
                  <Tooltip formatter={v=>fmt(v)} contentStyle={{borderRadius:'12px',border:'1px solid #e2e8f0',fontSize:'12px',boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                </PieChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* Recaudación por cita */}
      <h2 className="text-lg font-bold text-slate-800 mb-4 mt-8">Recaudación por cita (Completadas)</h2>
      <div className="card overflow-hidden bg-white/50 border border-slate-200/60 shadow-sm">
        {completed.length === 0
          ? <div className="p-12 text-center text-slate-400 text-sm">No hay citas completadas aún</div>
          : <div className="divide-y divide-slate-100/80">
              {completed.sort((a,b)=>b.date.localeCompare(a.date)).map(a => (
                <div key={a.id} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50/80 transition-all duration-200 group">
                  <div className="flex-1 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shadow-inner">
                      {getName(a.patient_id).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 tracking-tight">{getName(a.patient_id)}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-600 border border-slate-200/60">{a.treatment || 'Consulta general'}</span>
                        <span>{a.date} · {a.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {editing === a.id 
                      ? <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl shadow-sm border border-slate-200/80">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
                            <input autoFocus type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="pl-7 pr-3 py-1.5 w-28 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800/20 font-bold text-slate-700 shadow-sm" placeholder="0.00" />
                          </div>
                          <button onClick={()=>saveAmount(a.id)} disabled={saving} className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-700 transition-colors shadow-sm"><Save size={14}/></button>
                          <button onClick={()=>setEditing(null)} className="text-slate-400 p-2 rounded-lg hover:bg-slate-200 hover:text-slate-600 transition-colors">✕</button>
                        </div>
                      : <button onClick={()=>{setEditing(a.id);setAmount(a.amount||'');}}
                          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm border flex items-center gap-1.5 ${a.amount ? 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:shadow-md' : 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-200'}`}>
                          {a.amount ? <span className="text-emerald-600 mr-1"><CheckCircle size={14} className="inline"/></span> : null}
                          {a.amount ? fmt(a.amount) : 'Asignar Costo'}
                        </button>
                    }
                  </div>
                </div>
              ))}
            </div>
        }
      </div>

      {alert && <AlertModal message={alert} onClose={() => setAlert(null)} />}
    </div>
  );
}