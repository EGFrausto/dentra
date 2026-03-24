import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, CheckCircle, Save, CreditCard, Receipt, Send, ShieldCheck, Zap } from 'lucide-react';
import { appointments as aStore, patients as pStore, profile as profStore } from '../lib/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AlertModal from '../components/AlertModal';
import ReceiptModal from '../components/ReceiptModal';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const COLORS = ['#1e293b','#334155','#475569','#64748b','#94a3b8','#cbd5e1','#e2e8f0','#f1f5f9'];

export default function Finance() {
  const [apts, setApts]   = useState(() => aStore.getCached());
  const [pts, setPts]     = useState(() => pStore.getCached());
  const [prof, setProf]   = useState(() => profStore.getCached());
  const [editing, setEditing] = useState(null);
  const [amount, setAmount]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [alert, setAlert]     = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [paying, setPaying]   = useState(null);
  const [tab, setTab] = useState('finanzas');

  useEffect(() => {
    pStore.get().then(setPts);
    aStore.get().then(setApts);
    profStore.get().then(setProf);

    const unsubs = [
      pStore.subscribe(setPts),
      aStore.subscribe(setApts),
      profStore.subscribe(setProf)
    ];
    return () => unsubs.forEach(fn => fn());
  }, []);

  const completed = apts.filter(a => a.status === 'Completada');
  const getName = id => pts.find(p=>p.id===id)?.name || 'Paciente desconocido';
  const getPhone = id => pts.find(p=>p.id===id)?.phone || '';

  const saveAmount = async (id) => {
    setSaving(true);
    try {
      await aStore.update(id, { 
        amount: parseFloat(amount) || 0,
        payment_status: 'Pendiente'
      });
      setEditing(null);
      setAmount('');
    } catch (err) {
      // Fallback: If column is missing, just save amount and track status locally
      if (err.message?.includes('column')) {
        await aStore.update(id, { amount: parseFloat(amount) || 0 });
        const localPaid = JSON.parse(localStorage.getItem('dentra_local_status') || '{}');
        localPaid[id] = 'Pendiente';
        localStorage.setItem('dentra_local_status', JSON.stringify(localPaid));
        setEditing(null);
        setAmount('');
        setAlert({ title: 'Éxito', message: 'Monto guardado', type: 'success' });
      } else {
        setAlert({ title: 'Error', message: 'No se pudo guardar el monto: ' + err.message, type: 'warning' });
      }
    } finally {
      setSaving(false);
    }
  };

  const simulateOnlinePayment = async (apt) => {
    setPaying(apt.id);
    await new Promise(r => setTimeout(r, 1500));
    try {
      await aStore.update(apt.id, { 
        payment_status: 'Pagado',
        payment_method: 'Online'
      });
      setAlert({ title: 'Éxito', message: 'Pago registrado', type: 'success' });
    } catch (err) {
      // Fallback local persistence
      const localPaid = JSON.parse(localStorage.getItem('dentra_local_status') || '{}');
      localPaid[apt.id] = 'Pagado';
      localStorage.setItem('dentra_local_status', JSON.stringify(localPaid));
      setApts([...apts]); // Trigger re-render
      setAlert({ title: 'Éxito', message: 'Pago registrado', type: 'success' });
    } finally {
      setPaying(null);
    }
  };

  // Helper to get status with local fallback
  const getPaymentStatus = (apt) => {
    if (apt.payment_status) return apt.payment_status;
    const local = JSON.parse(localStorage.getItem('dentra_local_status') || '{}');
    return local[apt.id] || (apt.amount > 0 ? 'Pendiente' : null);
  };

  const openReceipt = (apt) => {
    setReceiptData({
      id: apt.id,
      patientName: getName(apt.patient_id),
      patientPhone: getPhone(apt.patient_id),
      amount: apt.amount,
      treatment: apt.treatment,
      date: apt.date,
      clinicName: prof?.name || 'Dentra',
      clinicAddress: prof?.address || '',
      clinicPhone: prof?.phone || '',
      clinicLogo: prof?.logo_base64 || null,
    });
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
  const pendingAmount = completed.filter(a => a.amount > 0 && getPaymentStatus(a) !== 'Pagado').reduce((sum,a)=>sum+(a.amount||0),0);

  // Tasa de cobro: citas con monto que ya estan marcadas como pagadas / total con monto
  const withAmount = completed.filter(a => a.amount > 0);
  const paidCount = withAmount.filter(a => getPaymentStatus(a) === 'Pagado').length;
  const collectionRate = withAmount.length > 0 ? Math.round((paidCount / withAmount.length) * 100) : 0;

  const fmt = n => n.toLocaleString('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:0});

  const summary = [
    { label:'Ingresos del mes',  value:fmt(totalMonth), icon:Calendar,    light:'bg-indigo-50', text:'text-indigo-600' },
    { label:'Proyectado anual',  value:fmt(totalYear),  icon:TrendingUp,  light:'bg-slate-100', text:'text-slate-600' },
    { label:'Total histórico',   value:fmt(totalAll),   icon:DollarSign,  light:'bg-emerald-50', text:'text-emerald-600' },
    { label:'Transacciones',     value:completed.length, icon:Zap,         light:'bg-amber-50',  text:'text-amber-600' },
  ];

  const tabs = [
    { id:'finanzas', label:'Panorama Financiero', icon:TrendingUp },
    { id:'cobros',   label:'Gestión de Cobros',    icon:Receipt },
  ];

  return (
    <div className="p-8 pt-2">
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-2xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab===id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon size={15}/> {label}
          </button>
        ))}
      </div>

      {tab === 'finanzas' && (
        <>
      {/* Indicadores de ingresos */}
      <div className="mb-8">
        <h3 className="text-[13px] font-medium text-slate-400 mb-4 tracking-tight">Indicadores de ingresos y gestión de montos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Este mes',         value: fmt(totalMonth), icon: Calendar,    light: 'bg-slate-100', text: 'text-slate-600' },
            { label: 'Este año',         value: fmt(totalYear),  icon: TrendingUp,  light: 'bg-slate-100', text: 'text-slate-600' },
            { label: 'Total histórico',  value: fmt(totalAll),   icon: DollarSign,  light: 'bg-green-100/60', text: 'text-green-600' },
            { label: 'Citas con monto',  value: withAmount.length, icon: CheckCircle, light: 'bg-amber-100/60', text: 'text-amber-600' },
          ].map(({ label, value, icon: Icon, light, text }) => (
            <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-[13px] font-medium text-slate-400 mb-1">{label}</p>
                <p className="text-2xl font-semibold text-slate-800 tracking-tight">{value}</p>
              </div>
              <div className={`${light} w-10 h-10 rounded-xl flex items-center justify-center`}>
                <Icon size={18} className={text} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-8">
             <h2 className="font-bold text-slate-800 text-base">Ingresos últimos 6 meses</h2>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">Real</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{fontSize:11,fill:'#94a3b8',fontWeight:500}} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{fontSize:10,fill:'#94a3b8',fontWeight:500}} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toLocaleString()}`} width={45} />
              <Tooltip formatter={v=>[fmt(v),'Ingresos']} contentStyle={{borderRadius:'16px',border:'none',fontSize:'12px',boxShadow:'0 20px 25px -5px rgb(0 0 0 / 0.1)',fontWeight:800}} cursor={{fill:'#f8fafc',radius:8}}/>
              <Bar dataKey="total" fill="#1e293b" radius={[6,6,0,0]} barSize={45}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-slate-800 text-base mb-8">Ingresos por tratamiento</h2>
          {treatmentData.length === 0
            ? <div className="flex items-center justify-center h-60 text-slate-300 text-xs font-bold uppercase tracking-widest">Sin datos</div>
            : <div className="relative h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={treatmentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={60} paddingAngle={2} stroke="none">
                      {treatmentData.map((_, i) => <Cell key={i} fill={['#1e293b', '#334155', '#475569', '#64748b'][i % 4]} />)}
                    </Pie>
                    <Tooltip formatter={v=>fmt(v)} contentStyle={{borderRadius:'16px',border:'none',fontWeight:800}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
          }
        </div>
      </div>
      </>
      )}

      {tab === 'cobros' && (
        <>
      {/* Compact Premium Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 mb-5 border border-slate-700/50 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-slate-700 p-1.5 rounded-lg shadow-lg shadow-slate-900/20">
                <ShieldCheck size={16} className="text-white" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Finanzas bajo control</span>
            </div>
            <p className="text-slate-300 text-sm font-medium leading-relaxed">
              Controla los pagos en tiempo real y envía comprobantes al instante con Dentra.
            </p>
          </div>
          
          <div className="flex gap-8 items-center bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl">
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5 text-right">Pagos pendientes</span>
              <span className="text-xl font-black text-white text-right">{fmt(pendingAmount)}</span>
            </div>
            <div className="w-px h-8 bg-slate-700 mx-2" />
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5 text-right">Tasa de cobro</span>
              <span className="text-xl font-black text-white text-right">{collectionRate}%</span>
            </div>
            <div className="w-px h-8 bg-slate-700 mx-2" />
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5 text-right">Transacciones</span>
              <span className="text-xl font-black text-slate-300 text-right">{completed.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 pt-2">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Movimientos Recientes</h2>
        <div className="flex gap-2">
        </div>
      </div>

      <div className="card bg-white border border-slate-100 rounded-3xl shadow-sm mt-6">
        {completed.length === 0
          ? <div className="p-20 text-center"><DollarSign size={40} className="text-slate-100 mx-auto mb-4"/><p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No hay registros financieros</p></div>
          : <div className="divide-y divide-slate-50">
              {completed.sort((a,b)=>b.date.localeCompare(a.date)).map((a, idx) => (
                <div key={a.id} className={`flex items-center justify-between p-5 hover:bg-slate-50 transition-all duration-300 group ${idx===0?'rounded-t-3xl':''} ${idx===completed.length-1?'rounded-b-3xl':''}`}>
                  <div className="flex-1 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800 font-black text-sm shadow-inner group-hover:bg-slate-800 group-hover:text-white transition-all">
                      {getName(a.patient_id).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-800 tracking-tight leading-none">{getName(a.patient_id)}</p>
                        {getPaymentStatus(a) === 'Pagado' ? (
                          <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            <CheckCircle size={10}/> PAGADO
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 uppercase">
                            {getPaymentStatus(a) || 'Pendiente'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 font-medium">
                        <span className="text-slate-400">{a.treatment || 'Consulta general'}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"/>
                        <span>{a.date}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {editing === a.id 
                      ? <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200 shadow-inner">
                          <input autoFocus type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="pl-4 pr-3 py-1.5 w-24 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none font-black text-slate-800" placeholder="0" />
                          <button onClick={()=>saveAmount(a.id)} disabled={saving} className="bg-slate-800 text-white p-2 rounded-xl hover:bg-slate-700 shadow-lg tooltip-trigger" data-tip="Guardar"><Save size={16}/></button>
                        </div>
                      : <div className="flex items-center gap-2">
                          {a.amount > 0 && getPaymentStatus(a) !== 'Pagado' && (
                            <button onClick={()=>simulateOnlinePayment(a)} disabled={paying === a.id} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-black hover:bg-slate-900 transition-all shadow-md shadow-slate-200 disabled:opacity-50">
                              <CreditCard size={14}/> {paying === a.id ? 'PROCESANDO...' : 'REGISTRAR PAGO'}
                            </button>
                          )}
                          {getPaymentStatus(a) === 'Pagado' && (
                            <button onClick={()=>openReceipt(a)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black hover:border-slate-800 transition-all">
                              <Receipt size={14}/> COMPROBANTE
                            </button>
                          )}
                          <button onClick={()=>{setEditing(a.id);setAmount(a.amount||'');}}
                            className={`px-6 py-2 rounded-xl text-sm font-black transition-all border flex items-center gap-1.5 ${a.amount ? 'bg-white border-slate-100 text-slate-800 hover:border-slate-300' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'}`}>
                            {a.amount ? fmt(a.amount) : 'ASIGNAR COSTO'}
                          </button>
                        </div>
                    }
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
      </>
      )}

      {receiptData && <ReceiptModal isOpen={!!receiptData} onClose={()=>setReceiptData(null)} data={receiptData} />}
      {alert && <AlertModal message={alert} onClose={() => setAlert(null)} />}
    </div>
  );
}