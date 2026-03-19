import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Bell, BellOff, Calendar, StickyNote, MessageSquare, DollarSign, CheckCircle } from 'lucide-react';
import { patients as pStore, appointments as aStore, aptNotes as nStore } from '../lib/store';
import Modal from '../components/Modal';
import Select from '../components/Select';
import DatePicker from '../components/DatePicker';
import TimePicker from '../components/TimePicker';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';

const DEFAULT_TREATMENTS = ['Limpieza dental','Consulta general','Endodoncia (conducto)','Extracción','Ortodoncia','Blanqueamiento','Implante','Corona','Puente','Otro'];
const STATUSES   = ['Programada','Confirmada','Completada','Cancelada'];
const DURATIONS  = [15,30,45,60,90,120];
const MONTHS     = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS       = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const STATUS_COLORS = {
  'Programada': { badge:'badge badge-indigo', card:'border-l-4 border-indigo-500' },
  'Confirmada': { badge:'badge badge-teal',   card:'border-l-4 border-teal-500' },
  'Completada': { badge:'badge badge-emerald',card:'border-l-4 border-emerald-500' },
  'Cancelada':  { badge:'badge badge-red',    card:'border-l-4 border-red-500' },
};
const CAL_COLORS = { 'Programada':'bg-indigo-500','Confirmada':'bg-teal-500','Completada':'bg-emerald-500','Cancelada':'bg-red-500' };
const EMPTY = { patient_id:'', date:new Date().toISOString().split('T')[0], time:'09:00', duration:30, status:'Programada', treatment:'', amount: 0, notes:'', reminder_sent:false };
const NOTE_TYPES = ['Instrucción','Recordatorio','Seguimiento','Alerta'];
const NOTE_BADGE = { 'Instrucción':'badge badge-indigo','Recordatorio':'badge badge-amber','Seguimiento':'badge badge-teal','Alerta':'badge badge-red' };

export default function Appointments() {
  const [pts, setPts]     = useState(() => pStore.getCached());
  const [apts, setApts]   = useState(() => aStore.getCached());
  const [notes, setNotes] = useState(() => nStore.getCached());
  const [cur, setCur]     = useState(new Date());
  const [sel, setSel]     = useState(new Date().toISOString().split('T')[0]);
  const [tab, setTab]     = useState('citas');
  const [showModal, setShowModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]   = useState(EMPTY);
  const [noteForm, setNoteForm] = useState({ patient_id:'', appointment_id:'', note:'', type:'Instrucción' });
  const [confirmDel, setConfirmDel] = useState(null);
  const [alert, setAlert] = useState(null);
  const [confirmDelNote, setConfirmDelNote] = useState(null);
  const [filterPt, setFilterPt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    pStore.get().then(setPts);
    aStore.get().then(setApts);
    nStore.get().then(setNotes);

    const unsubs = [
      pStore.subscribe(setPts),
      aStore.subscribe(setApts),
      nStore.subscribe(setNotes)
    ];
    return () => unsubs.forEach(fn => fn());
  }, []);

  const reload      = () => aStore.get().then(setApts);
  const reloadNotes = () => nStore.get().then(setNotes);

  const yr = cur.getFullYear(), mo = cur.getMonth();
  const firstDay = new Date(yr,mo,1).getDay();
  const daysInMo = new Date(yr,mo+1,0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const byDate  = d => apts.filter(a=>a.date===d).sort((a,b)=>a.time.localeCompare(b.time));
  const selApts = byDate(sel);
  const getName = id => pts.find(p=>p.id===id)?.name||'Desconocido';

  const openNew  = () => { setForm({...EMPTY,date:sel}); setEditing(null); setShowModal(true); };
  const openEdit = a  => { setForm(a); setEditing(a.id); setShowModal(true); };
  
  const save = async () => {
    if (!form.patient_id||!form.date||!form.time) { setAlert('Paciente, fecha y hora son requeridos'); return; }
    setSaving(true);
    try {
      editing ? await aStore.update(editing,form) : await aStore.add(form);
      await reload();
      setShowModal(false);
    } catch (err) {
      setAlert('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const sendReminderWhatsApp = async (a) => {
    const patient = pts.find(p => p.id === a.patient_id);
    if (!a.reminder_sent && patient?.phone) {
       const msg = encodeURIComponent(`Hola ${patient.name}, le recordamos su próxima cita el ${a.date.split('-').reverse().join('/')} a las ${a.time.slice(0,5)} en nuestro consultorio dental. ¡Le confirmamos su asistencia y le esperamos!`);
       const phone = patient.phone.replace(/\D/g,'');
       if (phone) window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    }
    try {
      await aStore.update(a.id, { reminder_sent: !a.reminder_sent });
      await reload();
    } catch (err) {
      setAlert('Error: ' + err.message);
    }
  };

  const sf = (k,v) => setForm(p => ({ ...p, [k]: v }));

  const saveNote = async () => {
    if (!noteForm.patient_id||!noteForm.note) { setAlert('Paciente y nota son requeridos'); return; }
    setSaving(true);
    try {
      await nStore.add({...noteForm,date:new Date().toISOString().split('T')[0]});
      await reloadNotes();
      setShowNoteModal(false);
      setNoteForm({patient_id:'',appointment_id:'',note:'',type:'Instrucción'});
    } catch (err) {
      setAlert('Error al guardar nota: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await aStore.remove(confirmDel);
      await reload();
      setConfirmDel(null);
    } catch (err) {
      setAlert('Error al eliminar: ' + err.message);
    }
  };

  const confirmDeleteNote = async () => {
    try {
      await nStore.remove(confirmDelNote);
      await reloadNotes();
      setConfirmDelNote(null);
    } catch (err) {
      setAlert('Error al eliminar nota: ' + err.message);
    }
  };

  const filteredNotes = filterPt ? notes.filter(n=>n.patient_id===filterPt) : notes;
  const filteredApts  = noteForm.patient_id ? apts.filter(a=>a.patient_id===noteForm.patient_id) : [];

  const selDateLabel = () => new Date(sel+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  const cells = [];
  for (let i=0;i<firstDay;i++) cells.push(null);
  for (let d=1;d<=daysInMo;d++) cells.push(d);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-8 pt-2">
      {/* Tabs & Header */}
      <div className="max-w-[1200px] w-full mx-auto">
        <div className="flex gap-1 bg-slate-100/80 p-1 rounded-2xl w-fit mb-6 shadow-sm border border-slate-200/50">
          {[{ id:'citas', label:'Calendario', icon:Calendar },{ id:'notas', label:'Notas entre Citas', icon:StickyNote }].map(({id,label,icon:Icon})=>(
            <button key={id} onClick={()=>setTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab===id?'bg-white text-slate-800 shadow-sm border border-slate-200/50':'text-slate-500 hover:text-slate-700'}`}>
              <Icon size={15}/>{label}
            </button>
          ))}
        </div>

        {tab==='citas' && (
          <div className="flex min-h-[700px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            {/* Calendar side */}
            <div className="w-[380px] border-r border-slate-100 flex flex-col bg-slate-50/30">
              <div className="p-6 border-b border-slate-100 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-slate-700">{MONTHS[mo]} {yr}</p>
                  <div className="flex gap-1">
                    <button onClick={()=>setCur(new Date(yr,mo-1,1))} className="icon-btn p-1.5"><ChevronLeft size={16}/></button>
                    <button onClick={()=>setCur(new Date(yr,mo+1,1))} className="icon-btn p-1.5"><ChevronRight size={16}/></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {DAYS.map(d=><span key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((d,i)=>{
                    const date=`${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                    const dayApts = byDate(date);
                    const hasApts=d&&dayApts.length>0;
                    return (
                      <button key={i} disabled={!d} onClick={()=>setSel(date)}
                        className={`h-9 rounded-xl text-sm transition-all flex flex-col items-center justify-center relative ${!d?'opacity-0':''} ${sel===date?'bg-indigo-50 ring-1 ring-inset ring-indigo-500 font-bold text-indigo-700':'text-slate-600 hover:bg-slate-100'}`}>
                        <span className="mb-0.5">{d}</span>
                        {hasApts && (
                          <div className="absolute bottom-1 flex gap-0.5">
                            {[...new Set(dayApts.map(a=>CAL_COLORS[a.status]||'bg-indigo-400'))].slice(0,4).map((color, idx) => (
                              <span key={idx} className={`w-1 h-1 rounded-full ${color}`} />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="mb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Hoy es {new Date().toLocaleDateString('es-ES',{day:'numeric',month:'long'})}</p>
                </div>
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-4 text-center shadow-sm">
                  <Calendar size={20} className="text-slate-200 mx-auto mb-2"/>
                  <p className="text-xs text-slate-500">Selecciona un día en el calendario para gestionar tus citas.</p>
                </div>
              </div>
            </div>

          {/* Agenda side */}
          <div className="flex-1 flex flex-col bg-white">
            <div className="p-8 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 capitalize">{selDateLabel()}</h2>
                  <p className="text-sm text-slate-400 mt-1">{selApts.length} citas programadas</p>
                </div>
                <button onClick={openNew} className="btn-primary shadow-lg shadow-indigo-100"><Plus size={18}/> Nueva Cita</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
              {selApts.length===0
                ? <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <Calendar size={48} className="mb-4 opacity-20"/>
                    <p className="text-sm">No hay citas para este día.</p>
                  </div>
                : <div className="space-y-4 max-w-2xl">
                    {selApts.map(a=>(
                      <div key={a.id} className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md ${STATUS_COLORS[a.status]?.card}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-bold text-sm">
                              {getName(a.patient_id).charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 leading-none">{getName(a.patient_id)}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className={STATUS_COLORS[a.status]?.badge}>{a.status}</span>
                                <button onClick={()=>sendReminderWhatsApp(a)} className={`text-[11px] flex items-center gap-1 font-medium transition-colors hover:text-green-500 ${a.reminder_sent?'text-green-500':'text-slate-400'}`}>
                                  <Bell size={10}/> {a.reminder_sent ? 'Recordatorio enviado' : 'Enviar recordatorio'}
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <p className="text-sm font-bold text-slate-700">{a.time.slice(0,5)}</p>
                            <p className="text-[11px] text-slate-400 font-medium">{a.duration} min</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <div className="flex items-center gap-4">
                            <p className="text-sm text-slate-600 font-medium flex items-center gap-1.5">
                              <CheckCircle size={14} className="text-indigo-400"/> {a.treatment}
                            </p>
                            {a.amount > 0 && (
                              <p className="text-sm text-slate-700 font-bold flex items-center gap-1">
                                <DollarSign size={14} className="text-green-500"/> {a.amount.toLocaleString('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:0})}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                             <button onClick={()=>openEdit(a)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={14}/></button>
                             <button onClick={()=>setConfirmDel(a.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        </div>
      )}

      {tab==='notas' && (
        <div className="p-8 h-full overflow-y-auto bg-slate-50/30">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1 max-w-xs">
                <Select value={filterPt} onChange={v=>setFilterPt(v)} placeholder="Todos los pacientes"
                  options={[{value:'',label:'Todos los pacientes'},...pts.map(p=>({value:p.id,label:p.name}))]}/>
              </div>
              <button onClick={()=>setShowNoteModal(true)} className="btn-primary"><Plus size={16}/> Nueva Nota</button>
            </div>
            {filteredNotes.length===0
              ?<div className="card py-16 text-center"><StickyNote size={36} className="text-slate-200 mx-auto mb-3"/><p className="text-sm text-slate-400">No hay notas registradas</p></div>
              :<div className="space-y-3">{filteredNotes.sort((a,b)=>b.date.localeCompare(a.date)).map(n=>{
                const apt=apts.find(a=>a.id===n.appointment_id);
                return (
                  <div key={n.id} className="card p-4 flex items-start gap-3 group">
                    <div className="w-9 h-9 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"><MessageSquare size={16} className="text-cyan-600"/></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-700">{getName(n.patient_id)}</p>
                        <span className={NOTE_BADGE[n.type]||'badge badge-slate'}>{n.type}</span>
                      </div>
                      <p className="text-sm text-slate-600">{n.note}</p>
                      <div className="flex gap-3 mt-1.5 text-xs text-slate-400">
                        <span>{n.date}</span>{apt&&<span>· {apt.date} {apt.time.slice(0,5)} - {apt.treatment}</span>}
                      </div>
                    </div>
                    <button onClick={()=>setConfirmDelNote(n.id)} className="icon-btn-danger opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                  </div>
                );
              })}</div>
            }
          </div>
        </div>
      )}

      {/* Modal cita */}
      {showModal&&(
        <Modal title={editing?'Editar Cita':'Nueva Cita'} onClose={()=>setShowModal(false)}>
          <div className="p-6 space-y-4">
            <div><label className="label">Paciente *</label><Select value={form.patient_id} onChange={v=>sf('patient_id',v)} placeholder="Seleccionar paciente..." options={pts.map(p=>({value:p.id,label:p.name}))}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Fecha *</label><DatePicker value={form.date} onChange={v=>sf('date',v)} /></div>
              <div><label className="label">Hora *</label><TimePicker value={form.time} onChange={v=>sf('time',v)} align="right" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Duración</label><Select value={form.duration} onChange={v=>sf('duration',v)} options={DURATIONS.map(d=>({value:d,label:`${d} min`}))}/></div>
              <div><label className="label">Estado</label><Select value={form.status} onChange={v=>sf('status',v)} options={STATUSES}/></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
               <div className="col-span-2">
                 <label className="label">Tratamiento</label>
                 <Select value={form.treatment} onChange={v=>sf('treatment',v)} placeholder="Seleccionar..." options={DEFAULT_TREATMENTS}/>
               </div>
               <div>
                  <label className="label">Monto ($)</label>
                  <input type="number" value={form.amount} onChange={e=>sf('amount', parseFloat(e.target.value)||0)} className="input-field" placeholder="0"/>
               </div>
            </div>
            <div><label className="label">Notas</label><textarea value={form.notes} onChange={e=>sf('notes',e.target.value)} placeholder="Notas adicionales..." rows={2} className="input-field resize-none"/></div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button onClick={()=>setShowModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : (editing ? 'Guardar cambios' : 'Agendar cita')}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal nota */}
      {showNoteModal&&(
        <Modal title="Nueva Nota de Cita" onClose={()=>setShowNoteModal(false)}>
          <div className="p-6 space-y-4">
            <div><label className="label">Paciente *</label><Select value={noteForm.patient_id} onChange={v=>setNoteForm(p=>({...p,patient_id:v}))} placeholder="Seleccionar..." options={pts.map(p=>({value:p.id,label:p.name}))}/></div>
            <div><label className="label">Cita asociada (Opcional)</label><Select value={noteForm.appointment_id} onChange={v=>setNoteForm(p=>({...p,appointment_id:v}))} placeholder="Cita..." options={filteredApts.map(a=>({value:a.id,label:`${a.date} - ${a.treatment}`}))}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Tipo de nota</label><Select value={noteForm.type} onChange={v=>setNoteForm(p=>({...p,type:v}))} options={NOTE_TYPES}/></div>
            </div>
            <div><label className="label">Nota *</label><textarea value={noteForm.note} onChange={e=>setNoteForm(p=>({...p,note:e.target.value}))} placeholder="Instrucciones post-operatorias, observaciones..." rows={4} className="input-field resize-none"/></div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button onClick={()=>setShowNoteModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={saveNote} disabled={saving} className="btn-primary">{saving?'Guardando...':'Guardar Nota'}</button>
          </div>
        </Modal>
      )}

      </div>

      {alert && <AlertModal message={alert} onClose={() => setAlert(null)}/>}
      {confirmDel && <ConfirmModal message="¿Eliminar esta cita? Esta acción no se puede deshacer." onConfirm={confirmDelete} onCancel={() => setConfirmDel(null)}/>}
      {confirmDelNote && <ConfirmModal message="¿Eliminar esta nota?" onConfirm={confirmDeleteNote} onCancel={() => setConfirmDelNote(null)}/>}
    </div>
  );
}