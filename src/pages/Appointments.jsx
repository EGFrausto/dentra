import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Bell, BellOff, Calendar } from 'lucide-react';
import { patients as pStore, appointments as aStore } from '../lib/store';
import Modal from '../components/Modal';
import Select from '../components/Select';

const TREATMENTS = ['Limpieza dental','Consulta general','Endodoncia (conducto)','Extracción','Ortodoncia','Blanqueamiento','Implante','Corona','Puente','Otro'];
const STATUSES   = ['Programada','Confirmada','Completada','Cancelada'];
const DURATIONS  = [15,30,45,60,90,120];
const MONTHS     = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS       = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

const STATUS_COLORS = {
  'Confirmada': { badge:'badge badge-teal',   dot:'bg-teal-400',   card:'border-l-4 border-teal-400' },
  'Programada': { badge:'badge badge-indigo', dot:'bg-indigo-400', card:'border-l-4 border-indigo-400' },
  'Completada': { badge:'badge badge-slate',  dot:'bg-slate-300',  card:'border-l-4 border-slate-300' },
  'Cancelada':  { badge:'badge badge-red',    dot:'bg-red-400',    card:'border-l-4 border-red-400' },
};

const CAL_COLORS = {
  'Confirmada': 'bg-teal-400',
  'Programada': 'bg-indigo-400',
  'Completada': 'bg-slate-300',
  'Cancelada':  'bg-red-400',
};

const EMPTY = { patient_id:'', date: new Date().toISOString().split('T')[0], time:'09:00', duration:30, status:'Programada', treatment:'', notes:'', reminder_sent:false };

export default function Appointments() {
  const [pts, setPts]     = useState([]);
  const [apts, setApts]   = useState([]);
  const [cur, setCur]     = useState(new Date());
  const [sel, setSel]     = useState(new Date().toISOString().split('T')[0]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]   = useState(EMPTY);

  useEffect(() => { setPts(pStore.get()); setApts(aStore.get()); }, []);
  const reload = () => setApts(aStore.get());

  const yr = cur.getFullYear(), mo = cur.getMonth();
  const firstDay = new Date(yr, mo, 1).getDay();
  const daysInMo = new Date(yr, mo+1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const byDate  = d => apts.filter(a => a.date === d).sort((a,b) => a.time.localeCompare(b.time));
  const selApts = byDate(sel);
  const getName = id => pts.find(p => p.id === id)?.name || 'Desconocido';

  const openNew  = () => { setForm({ ...EMPTY, date: sel }); setEditing(null); setModal(true); };
  const openEdit = a   => { setForm(a); setEditing(a.id); setModal(true); };

  const save = () => {
    if (!form.patient_id || !form.date || !form.time) return alert('Paciente, fecha y hora son requeridos');
    editing ? aStore.update(editing, form) : aStore.add(form);
    reload(); setModal(false);
  };

  const del = id => { if (!confirm('¿Eliminar esta cita?')) return; aStore.remove(id); reload(); };
  const toggleReminder = id => { const a = apts.find(x=>x.id===id); aStore.update(id,{reminder_sent:!a.reminder_sent}); reload(); };
  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const selDateLabel = () => {
    const d = new Date(sel + 'T12:00:00');
    return d.toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMo; d++) cells.push(d);

  return (
    <div className="flex h-full">
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-7">
          <h1 className="text-2xl font-bold text-slate-800">Citas</h1>
          <button onClick={openNew} className="btn-primary"><Plus size={16} /> Nueva Cita</button>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => setCur(new Date(yr,mo-1,1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft size={18} /></button>
            <h2 className="font-bold text-slate-700">{MONTHS[mo]} {yr}</h2>
            <button onClick={() => setCur(new Date(yr,mo+1,1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day,i) => {
              if (!day) return <div key={`e${i}`} />;
              const ds = `${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const dayApts = byDate(ds);
              const isToday = ds === today, isSel = ds === sel;
              return (
                <button key={ds} onClick={() => setSel(ds)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all relative font-medium ${
                    isSel   ? 'bg-violet-600 text-white shadow-md shadow-violet-200' :
                    isToday ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' :
                    'hover:bg-slate-50 text-slate-600'}`}>
                  {day}
                  {dayApts.length > 0 && (
                    <div className="absolute bottom-1 flex gap-0.5">
                      {dayApts.slice(0,3).map((a,idx) => (
                        <span key={idx} className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-white' : (CAL_COLORS[a.status] || 'bg-slate-400')}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 justify-center flex-wrap">
            {Object.entries(CAL_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                {status}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day panel */}
      <div className="w-80 border-l border-slate-100 bg-white overflow-y-auto p-5">
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide capitalize">{selDateLabel().split(',')[0]}</p>
          <p className="text-lg font-bold text-slate-800 mt-0.5 capitalize">{selDateLabel().split(',').slice(1).join(',').trim()}</p>
          <p className="text-sm text-slate-400">{selApts.length} cita(s)</p>
        </div>
        {selApts.length === 0
          ? <div className="text-center py-16"><Calendar size={32} className="text-slate-200 mx-auto mb-2" /><p className="text-sm text-slate-400">Sin citas este día</p></div>
          : <div className="space-y-3">
              {selApts.map(a => {
                const sc = STATUS_COLORS[a.status] || STATUS_COLORS['Programada'];
                return (
                  <div key={a.id} className={`bg-slate-50 rounded-2xl p-4 border border-slate-100 ${sc.card}`}>
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-slate-700">{getName(a.patient_id)}</p>
                      <span className={sc.badge}>{a.status}</span>
                    </div>
                    <p className="text-xs text-violet-600 font-medium mb-1">{a.treatment||'Sin tratamiento'}</p>
                    <p className="text-xs text-slate-400 mb-3">{a.time} · {a.duration} min{a.notes?` · ${a.notes}`:''}</p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleReminder(a.id)}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${a.reminder_sent?'bg-indigo-100 text-indigo-700':'bg-slate-100 text-slate-500'}`}>
                        {a.reminder_sent?<Bell size={11}/>:<BellOff size={11}/>}
                        {a.reminder_sent?'Recordatorio enviado':'Sin recordatorio'}
                      </button>
                      <div className="ml-auto flex">
                        <button onClick={() => openEdit(a)} className="icon-btn"><Edit2 size={13}/></button>
                        <button onClick={() => del(a.id)} className="icon-btn-danger"><Trash2 size={13}/></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        }
      </div>

      {modal && (
        <Modal title={editing ? 'Editar Cita' : 'Nueva Cita'} onClose={() => setModal(false)}>
          <div className="p-6 space-y-4">
            <div><label className="label">Paciente *</label>
              <Select value={form.patient_id} onChange={v => sf('patient_id',v)} placeholder="Seleccionar paciente..."
                options={pts.map(p => ({ value: p.id, label: p.name }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Fecha *</label><input type="date" value={form.date} onChange={e=>sf('date',e.target.value)} className="input-field" /></div>
              <div><label className="label">Hora *</label><input type="time" value={form.time} onChange={e=>sf('time',e.target.value)} className="input-field" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Duración</label>
                <Select value={form.duration} onChange={v=>sf('duration',v)} options={DURATIONS.map(d=>({value:d,label:`${d} min`}))} />
              </div>
              <div><label className="label">Estado</label>
                <Select value={form.status} onChange={v=>sf('status',v)} options={STATUSES} />
              </div>
            </div>
            <div><label className="label">Tratamiento</label>
              <Select value={form.treatment} onChange={v=>sf('treatment',v)} placeholder="Seleccionar tratamiento..." options={TREATMENTS} />
            </div>
            <div><label className="label">Notas</label><textarea value={form.notes} onChange={e=>sf('notes',e.target.value)} placeholder="Notas adicionales..." rows={3} className="input-field resize-none" /></div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={save} className="btn-primary">{editing?'Guardar cambios':'Agendar cita'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}