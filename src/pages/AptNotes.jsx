import { useState, useEffect } from 'react';
import { Plus, Trash2, StickyNote, MessageSquare } from 'lucide-react';
import { patients as pStore, appointments as aStore, aptNotes as nStore } from '../lib/store';
import Modal from '../components/Modal';
import Select from '../components/Select';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';

export default function AptNotes() {
  const [pts, setPts]         = useState([]);
  const [apts, setApts]       = useState([]);
  const [notes, setNotes]     = useState([]);
  const [modal, setModal]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [alert, setAlert] = useState(null);
  const [filterPt, setFilterPt] = useState('');
  const [form, setForm]       = useState({ patient_id:'', appointment_id:'', note:'', type:'Instrucción' });

  useEffect(() => { setPts(pStore.get()); setApts(aStore.get()); setNotes(nStore.get()); }, []);
  const reload   = () => setNotes(nStore.get());
  const getName  = id => pts.find(p => p.id === id)?.name || 'Desconocido';

  const filteredApts = form.patient_id ? apts.filter(a => a.patient_id === form.patient_id) : [];
  const filteredNotes = filterPt ? notes.filter(n => n.patient_id === filterPt) : notes;

  const save = () => {
    if (!form.patient_id || !form.note) { setAlert('Paciente y nota son requeridos'); return; }
    nStore.add({ ...form, date: new Date().toISOString().split('T')[0] });
    reload(); setModal(false);
    setForm({ patient_id:'', appointment_id:'', note:'', type:'Instrucción' });
  };

  const TYPE_BADGE = { 'Instrucción':'badge badge-indigo', 'Recordatorio':'badge badge-amber', 'Seguimiento':'badge badge-teal', 'Alerta':'badge badge-red' };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notas entre Citas</h1>
          <p className="text-sm text-slate-400 mt-0.5">Instrucciones y recordatorios para próximas visitas</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary"><Plus size={16}/> Nueva Nota</button>
      </div>

      <div className="mb-5 w-64">
        <Select value={filterPt} onChange={v=>setFilterPt(v)} placeholder="Todos los pacientes"
          options={[{value:'',label:'Todos los pacientes'},...pts.map(p=>({value:p.id,label:p.name}))]}/>
      </div>

      {filteredNotes.length === 0
        ? <div className="card py-16 text-center"><StickyNote size={36} className="text-slate-200 mx-auto mb-3"/><p className="text-sm text-slate-400">No hay notas registradas</p></div>
        : <div className="space-y-3">
            {filteredNotes.sort((a,b) => b.date.localeCompare(a.date)).map(n => {
              const apt = apts.find(a => a.id === n.appointment_id);
              return (
                <div key={n.id} className="card p-4 flex items-start gap-3 group">
                  <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageSquare size={16} className="text-indigo-500"/>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-700">{getName(n.patient_id)}</p>
                      <span className={TYPE_BADGE[n.type]||'badge badge-slate'}>{n.type}</span>
                    </div>
                    <p className="text-sm text-slate-600">{n.note}</p>
                    <div className="flex gap-3 mt-1.5 text-xs text-slate-400">
                      <span>{n.date}</span>
                      {apt && <span>· Cita: {apt.date} {apt.time} - {apt.treatment}</span>}
                    </div>
                  </div>
                  <button onClick={() => setConfirmDel(n.id)} className="icon-btn-danger opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                </div>
              );
            })}
          </div>
      }

      {modal && (
        <Modal title="Nueva Nota entre Citas" onClose={() => setModal(false)}>
          <div className="p-6 space-y-4">
            <div><label className="label">Paciente *</label>
              <Select value={form.patient_id} onChange={v=>setForm(p=>({...p,patient_id:v,appointment_id:''}))} placeholder="Seleccionar paciente..." options={pts.map(p=>({value:p.id,label:p.name}))}/>
            </div>
            <div><label className="label">Cita relacionada (opcional)</label>
              <Select value={form.appointment_id} onChange={v=>setForm(p=>({...p,appointment_id:v}))} placeholder="Seleccionar cita..."
                options={[{value:'',label:'Sin cita específica'},...filteredApts.map(a=>({value:a.id,label:`${a.date} ${a.time} - ${a.treatment}`}))]}/>
            </div>
            <div><label className="label">Tipo</label>
              <Select value={form.type} onChange={v=>setForm(p=>({...p,type:v}))} options={['Instrucción','Recordatorio','Seguimiento','Alerta']}/>
            </div>
            <div><label className="label">Nota *</label>
              <textarea value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="Ej: Paciente debe traer estudios de sangre · Aplicar flúor en siguiente visita · Revisar evolución de pieza 36..." rows={4} className="input-field resize-none" autoFocus/>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={save} className="btn-primary">Guardar nota</button>
          </div>
        </Modal>
      )}

      {alert && <AlertModal message={alert} onClose={() => setAlert(null)}/>}
      {confirmDel && <ConfirmModal message="¿Eliminar esta nota?" onConfirm={() => { nStore.remove(confirmDel); reload(); setConfirmDel(null); }} onCancel={() => setConfirmDel(null)}/>}
    </div>
  );
}