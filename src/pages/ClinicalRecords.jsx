import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, FileText, PenLine, Trash } from 'lucide-react';
import { patients as pStore, records as rStore } from '../lib/store';
import Modal from '../components/Modal';

const UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
const STATES = ['Sano','Cariado','Extraído','Tratado'];
const STATE_STYLE = {
  Sano:    { btn:'bg-green-100 text-green-700 border-green-300',   tooth:'border-slate-200 text-slate-600 hover:border-green-300' },
  Cariado: { btn:'bg-amber-100 text-amber-700 border-amber-300',   tooth:'border-amber-400 bg-amber-50 text-amber-700' },
  Extraído:{ btn:'bg-red-100 text-red-600 border-red-300',         tooth:'border-red-400 bg-red-50 text-red-600 line-through' },
  Tratado: { btn:'bg-blue-100 text-blue-700 border-blue-300',      tooth:'border-blue-400 bg-blue-50 text-blue-700' },
};

const EMPTY = { patient_id:'', date:new Date().toISOString().split('T')[0], teeth:'', reason:'', diagnosis:'', treatment:'', medications:'', next_steps:'', notes:'', odontogram:{}, signature:'' };

function SignatureCanvas({ value, onChange }) {
  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = value;
    }
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return { x: (touch.clientX - rect.left) * (canvas.width / rect.width), y: (touch.clientY - rect.top) * (canvas.height / rect.height) };
  };

  const startDraw = e => {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = e => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  };

  const endDraw = e => {
    e.preventDefault();
    if (!drawing.current) return;
    drawing.current = false;
    onChange(canvasRef.current.toDataURL());
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="label mb-0">Firma del Paciente</label>
        <button type="button" onClick={clear} className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors">
          <Trash size={12} /> Limpiar
        </button>
      </div>
      <p className="text-xs text-slate-400 mb-2">El paciente puede firmar aquí con Apple Pencil o con el dedo</p>
      <canvas
        ref={canvasRef}
        width={640} height={180}
        className="w-full border-2 border-dashed border-slate-200 rounded-xl bg-white cursor-crosshair touch-none"
        style={{ touchAction: 'none' }}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
      />
    </div>
  );
}

export default function ClinicalRecords() {
  const [pts, setPts]     = useState([]);
  const [list, setList]   = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]   = useState(EMPTY);
  const [markAs, setMarkAs] = useState('Cariado');

  useEffect(() => { setPts(pStore.get()); setList(rStore.get()); }, []);
  const reload = () => setList(rStore.get());
  const getName = id => pts.find(p => p.id === id)?.name || 'Desconocido';

  const filtered = list.filter(r => {
    const s = search.toLowerCase();
    return getName(r.patient_id).toLowerCase().includes(s) || r.diagnosis?.toLowerCase().includes(s) || r.treatment?.toLowerCase().includes(s);
  });

  const openNew  = () => { setForm(EMPTY); setEditing(null); setMarkAs('Cariado'); setModal(true); };
  const openEdit = r => { setForm(r); setEditing(r.id); setMarkAs('Cariado'); setModal(true); };

  const save = () => {
    if (!form.patient_id || !form.date) return alert('Paciente y fecha son requeridos');
    editing ? rStore.update(editing, form) : rStore.add(form);
    reload(); setModal(false);
  };

  const del = id => { if (!confirm('¿Eliminar esta historia?')) return; rStore.remove(id); reload(); };

  const toggleTooth = t => setForm(prev => {
    const od = { ...prev.odontogram };
    od[t] === markAs ? delete od[t] : od[t] = markAs;
    return { ...prev, odontogram: od };
  });

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-7">
        <h1 className="text-2xl font-bold text-slate-800">Historias Clínicas</h1>
        <button onClick={openNew} className="btn-primary"><Plus size={16} /> Nueva Historia</button>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por paciente, diagnóstico o tratamiento..." className="input-field pl-10" />
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0
          ? <div className="py-16 text-center"><FileText size={36} className="text-slate-200 mx-auto mb-3" /><p className="text-sm text-slate-400">No hay historias clínicas registradas</p></div>
          : filtered.map(r => (
            <div key={r.id} className="table-row">
              <div>
                <p className="text-sm font-semibold text-slate-700">{getName(r.patient_id)}</p>
                <div className="flex gap-3 mt-0.5 text-xs text-slate-400">
                  <span>{r.date}</span>
                  {r.diagnosis && <span>· {r.diagnosis}</span>}
                  {r.treatment && <span>· {r.treatment}</span>}
                  {r.signature && <span className="flex items-center gap-1 text-teal-600"><PenLine size={10} /> Firmada</span>}
                </div>
              </div>
              <div className="flex items-center">
                <button onClick={() => openEdit(r)} className="icon-btn"><Edit2 size={15} /></button>
                <button onClick={() => del(r.id)} className="icon-btn-danger"><Trash2 size={15} /></button>
              </div>
            </div>
          ))
        }
      </div>

      {modal && (
        <Modal title={editing ? 'Editar Historia Clínica' : 'Nueva Historia Clínica'} onClose={() => setModal(false)} wide>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Paciente *</label>
                <select value={form.patient_id} onChange={f('patient_id')} className="input-field">
                  <option value="">Seleccionar paciente...</option>
                  {pts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div><label className="label">Fecha de visita *</label><input type="date" value={form.date} onChange={f('date')} className="input-field" /></div>
            </div>
            <div><label className="label">Pieza(s) dental(es)</label><input value={form.teeth} onChange={f('teeth')} placeholder="Ej: 11, 21, 22" className="input-field" /></div>
            <div><label className="label">Motivo de consulta</label><textarea value={form.reason} onChange={f('reason')} placeholder="¿Por qué consulta el paciente?" rows={2} className="input-field resize-none" /></div>
            <div><label className="label">Diagnóstico</label><textarea value={form.diagnosis} onChange={f('diagnosis')} placeholder="Diagnóstico clínico" rows={2} className="input-field resize-none" /></div>
            <div><label className="label">Tratamiento realizado</label><textarea value={form.treatment} onChange={f('treatment')} placeholder="Procedimiento realizado" rows={2} className="input-field resize-none" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Medicamentos recetados</label><textarea value={form.medications} onChange={f('medications')} placeholder="Nombre, dosis, frecuencia..." rows={3} className="input-field resize-none" /></div>
              <div><label className="label">Próximos pasos / Indicaciones</label><textarea value={form.next_steps} onChange={f('next_steps')} placeholder="Instrucciones para el paciente..." rows={3} className="input-field resize-none" /></div>
            </div>
            <div><label className="label">Notas clínicas</label><textarea value={form.notes} onChange={f('notes')} placeholder="Observaciones adicionales..." rows={2} className="input-field resize-none" /></div>

            {/* Odontogram */}
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
              <p className="text-sm font-semibold text-slate-700 mb-1">Odontograma</p>
              <p className="text-xs text-slate-400 mb-3">Selecciona un estado y haz clic en cada diente</p>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {STATES.map(s => (
                  <button key={s} type="button" onClick={() => setMarkAs(s)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${markAs === s ? STATE_STYLE[s].btn : 'border-transparent text-slate-400 hover:border-slate-200'}`}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex justify-center gap-1 mb-1 flex-wrap">
                {UPPER.map(t => <button key={t} type="button" onClick={() => toggleTooth(t)}
                  className={`w-8 h-8 border-2 rounded-lg text-xs font-semibold transition-all hover:scale-110 ${form.odontogram[t] ? STATE_STYLE[form.odontogram[t]].tooth : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>{t}</button>)}
              </div>
              <div className="text-center text-xs text-slate-300 my-1 border-t border-dashed border-slate-200 pt-1">Superior / Inferior</div>
              <div className="flex justify-center gap-1 mt-1 flex-wrap">
                {LOWER.map(t => <button key={t} type="button" onClick={() => toggleTooth(t)}
                  className={`w-8 h-8 border-2 rounded-lg text-xs font-semibold transition-all hover:scale-110 ${form.odontogram[t] ? STATE_STYLE[form.odontogram[t]].tooth : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>{t}</button>)}
              </div>
            </div>

            {/* Signature */}
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
              <SignatureCanvas value={form.signature} onChange={sig => setForm(p => ({ ...p, signature: sig }))} />
            </div>
          </div>

          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={save} className="btn-primary">Guardar historia</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
