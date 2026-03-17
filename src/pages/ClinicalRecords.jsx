import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, FileText, PenLine, Trash, Download, StickyNote } from 'lucide-react';
import { patients as pStore, records as rStore } from '../lib/store';
import Modal from '../components/Modal';
import Select from '../components/Select';

const UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
const STATES = ['Sano','Cariado','Extraído','Tratado'];
const STATE_STYLE = {
  Sano:    { btn:'bg-green-100 text-green-700 border-green-300',  tooth:'border-slate-200 text-slate-600' },
  Cariado: { btn:'bg-amber-100 text-amber-700 border-amber-300',  tooth:'border-amber-400 bg-amber-50 text-amber-700' },
  Extraído:{ btn:'bg-red-100 text-red-600 border-red-300',        tooth:'border-red-400 bg-red-50 text-red-600 line-through' },
  Tratado: { btn:'bg-blue-100 text-blue-700 border-blue-300',     tooth:'border-blue-400 bg-blue-50 text-blue-700' },
};
const EMPTY = { patient_id:'', date:new Date().toISOString().split('T')[0], teeth:'', reason:'', diagnosis:'', treatment:'', medications:'', next_steps:'', notes:'', odontogram:{}, signature:'' };

function SignatureCanvas({ value, onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    if (value) { const img = new Image(); img.onload = () => ctx.drawImage(img,0,0); img.src = value; }
  }, []);
  const getPos = (e, canvas) => { const rect=canvas.getBoundingClientRect(),touch=e.touches?e.touches[0]:e; return {x:(touch.clientX-rect.left)*(canvas.width/rect.width),y:(touch.clientY-rect.top)*(canvas.height/rect.height)}; };
  const startDraw = e => { e.preventDefault(); drawing.current=true; lastPos.current=getPos(e,canvasRef.current); };
  const draw = e => { e.preventDefault(); if(!drawing.current)return; const canvas=canvasRef.current,ctx=canvas.getContext('2d'),pos=getPos(e,canvas); ctx.beginPath();ctx.moveTo(lastPos.current.x,lastPos.current.y);ctx.lineTo(pos.x,pos.y);ctx.strokeStyle='#1e293b';ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();lastPos.current=pos; };
  const endDraw = e => { e.preventDefault(); if(!drawing.current)return; drawing.current=false; onChange(canvasRef.current.toDataURL()); };
  const clear = () => { const canvas=canvasRef.current,ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);onChange(''); };
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="label mb-0">Firma del Paciente</label>
        <button type="button" onClick={clear} className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"><Trash size={12}/> Limpiar</button>
      </div>
      <p className="text-xs text-slate-400 mb-2">El paciente puede firmar aquí con Apple Pencil o con el dedo</p>
      <canvas ref={canvasRef} width={640} height={180} className="w-full border-2 border-dashed border-slate-200 rounded-xl bg-white cursor-crosshair" style={{touchAction:'none'}}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}/>
    </div>
  );
}

function exportPDF(r, patientName) {
  const TOOTH_STYLE = { Cariado:'border-color:#f59e0b;background:#fffbeb;color:#b45309;', Extraído:'border-color:#ef4444;background:#fef2f2;color:#dc2626;text-decoration:line-through;', Tratado:'border-color:#3b82f6;background:#eff6ff;color:#1d4ed8;' };
  const tooth = (t) => `<div style="width:26px;height:26px;border:2px solid #e2e8f0;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;${TOOTH_STYLE[r.odontogram[t]]||''}">${t}</div>`;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:13px;color:#1e293b;padding:36px}
    .hdr{display:flex;justify-content:space-between;border-bottom:2px solid #4f46e5;padding-bottom:14px;margin-bottom:20px}
    .brand{font-size:20px;font-weight:800;color:#4f46e5}.brand span{font-size:11px;display:block;color:#94a3b8;font-weight:400}
    .sec{font-size:12px;font-weight:700;color:#4f46e5;margin:16px 0 8px;border-left:3px solid #4f46e5;padding-left:7px}
    .box{background:#f8fafc;border-radius:7px;padding:10px;margin-bottom:8px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px}
    .lbl{font-size:9px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.4px;display:block;margin-bottom:3px}
    .footer{margin-top:28px;border-top:1px solid #e2e8f0;padding-top:10px;text-align:center;color:#94a3b8;font-size:10px}
    .teeth{display:flex;gap:3px;flex-wrap:wrap;justify-content:center}
  </style></head><body>
    <div class="hdr"><div class="brand">Dentra<span>Sistema de Gestión Dental</span></div><div style="text-align:right"><div style="font-size:16px;font-weight:700">Historia Clínica</div><div style="color:#64748b;font-size:11px">${r.date}</div></div></div>
    <div class="grid2"><div class="box"><span class="lbl">Paciente</span>${patientName}</div><div class="box"><span class="lbl">Fecha</span>${r.date}</div></div>
    ${r.teeth?`<div class="box"><span class="lbl">Pieza(s)</span>${r.teeth}</div>`:''}
    ${r.reason?`<div class="sec">Motivo de Consulta</div><div class="box">${r.reason}</div>`:''}
    ${r.diagnosis?`<div class="sec">Diagnóstico</div><div class="box">${r.diagnosis}</div>`:''}
    ${r.treatment?`<div class="sec">Tratamiento Realizado</div><div class="box">${r.treatment}</div>`:''}
    ${(r.medications||r.next_steps)?`<div class="grid2">${r.medications?`<div class="box"><span class="lbl">Medicamentos</span>${r.medications}</div>`:''} ${r.next_steps?`<div class="box"><span class="lbl">Próximos pasos</span>${r.next_steps}</div>`:''}</div>`:''}
    ${r.notes?`<div class="sec">Notas Clínicas</div><div class="box">${r.notes}</div>`:''}
    ${Object.keys(r.odontogram||{}).length>0?`<div class="sec">Odontograma</div><div class="box"><div class="teeth">${[18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28].map(tooth).join('')}</div><div style="text-align:center;font-size:9px;color:#94a3b8;padding:4px 0;border-top:1px dashed #e2e8f0;border-bottom:1px dashed #e2e8f0;margin:4px 0">Superior / Inferior</div><div class="teeth">${[48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38].map(tooth).join('')}</div></div>`:''}
    ${r.signature?`<div class="sec">Firma del Paciente</div><div class="box" style="text-align:center"><img src="${r.signature}" style="max-height:80px"/></div>`:''}
    <div class="footer">Generado por Dentra · Powered by Atlara · ${new Date().toLocaleDateString('es-MX')}</div>
  </body></html>`;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
}

export default function ClinicalRecords() {
  const [pts, setPts]         = useState([]);
  const [list, setList]       = useState([]);
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [markAs, setMarkAs]   = useState('Cariado');
  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText]   = useState('');

  useEffect(() => { setPts(pStore.get()); setList(rStore.get()); }, []);
  const reload = () => setList(rStore.get());
  const getName = id => pts.find(p => p.id === id)?.name || 'Desconocido';

  const filtered = list.filter(r => {
    const s = search.toLowerCase();
    return getName(r.patient_id).toLowerCase().includes(s) || r.diagnosis?.toLowerCase().includes(s) || r.treatment?.toLowerCase().includes(s);
  });

  const openNew  = () => { setForm(EMPTY); setEditing(null); setMarkAs('Cariado'); setModal(true); };
  const openEdit = r  => { setForm(r); setEditing(r.id); setMarkAs('Cariado'); setModal(true); };
  const save = () => {
    if (!form.patient_id || !form.date) return alert('Paciente y fecha son requeridos');
    editing ? rStore.update(editing, form) : rStore.add(form);
    reload(); setModal(false);
  };
  const del = id => { if (!confirm('¿Eliminar esta historia?')) return; rStore.remove(id); reload(); };
  const openNote = r => { setNoteModal(r); setNoteText(r.quick_note || ''); };
  const saveNote = () => { rStore.update(noteModal.id, { quick_note: noteText }); reload(); setNoteModal(null); };
  const toggleTooth = t => setForm(prev => { const od={...prev.odontogram}; od[t]===markAs?delete od[t]:od[t]=markAs; return {...prev,odontogram:od}; });
  const tf = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-7">
        <h1 className="text-2xl font-bold text-slate-800">Historias Clínicas</h1>
        <button onClick={openNew} className="btn-primary"><Plus size={16}/> Nueva Historia</button>
      </div>
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por paciente, diagnóstico o tratamiento..." className="input-field pl-10"/>
      </div>
      <div className="card overflow-hidden">
        {filtered.length===0
          ? <div className="py-16 text-center"><FileText size={36} className="text-slate-200 mx-auto mb-3"/><p className="text-sm text-slate-400">No hay historias clínicas registradas</p></div>
          : filtered.map(r=>(
            <div key={r.id} className="table-row group">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-700">{getName(r.patient_id)}</p>
                  {r.quick_note && <span className="badge badge-amber flex items-center gap-1"><StickyNote size={10}/> Nota</span>}
                  {r.signature  && <span className="badge badge-indigo flex items-center gap-1"><PenLine size={10}/> Firmada</span>}
                </div>
                <div className="flex gap-3 mt-0.5 text-xs text-slate-400">
                  <span>{r.date}</span>
                  {r.diagnosis&&<span>· {r.diagnosis}</span>}
                  {r.treatment&&<span>· {r.treatment}</span>}
                </div>
                {r.quick_note && <p className="text-xs text-amber-600 mt-1 italic">"{r.quick_note}"</p>}
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={()=>openNote(r)} className="icon-btn" title="Nota rápida"><StickyNote size={14}/></button>
                <button onClick={()=>exportPDF(r,getName(r.patient_id))} className="icon-btn" title="Exportar PDF"><Download size={14}/></button>
                <button onClick={()=>openEdit(r)} className="icon-btn"><Edit2 size={14}/></button>
                <button onClick={()=>del(r.id)} className="icon-btn-danger"><Trash2 size={14}/></button>
              </div>
            </div>
          ))
        }
      </div>

      {noteModal && (
        <Modal title={`Nota rápida — ${getName(noteModal.patient_id)}`} onClose={()=>setNoteModal(null)}>
          <div className="p-6">
            <p className="text-xs text-slate-400 mb-3">Agrega una nota rápida visible en el listado</p>
            <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Ej: Paciente sensible al frío, agendar seguimiento..." rows={4} className="input-field resize-none" autoFocus/>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button onClick={()=>setNoteModal(null)} className="btn-secondary">Cancelar</button>
            <button onClick={saveNote} className="btn-primary">Guardar nota</button>
          </div>
        </Modal>
      )}

      {modal && (
        <Modal title={editing?'Editar Historia Clínica':'Nueva Historia Clínica'} onClose={()=>setModal(false)} wide>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Paciente *</label>
                <Select value={form.patient_id} onChange={v=>setForm(p=>({...p,patient_id:v}))} placeholder="Seleccionar paciente..." options={pts.map(p=>({value:p.id,label:p.name}))}/>
              </div>
              <div><label className="label">Fecha de visita *</label><input type="date" value={form.date} onChange={tf('date')} className="input-field"/></div>
            </div>
            <div><label className="label">Pieza(s) dental(es)</label><input value={form.teeth} onChange={tf('teeth')} placeholder="Ej: 11, 21, 22" className="input-field"/></div>
            <div><label className="label">Motivo de consulta</label><textarea value={form.reason} onChange={tf('reason')} placeholder="¿Por qué consulta el paciente?" rows={2} className="input-field resize-none"/></div>
            <div><label className="label">Diagnóstico</label><textarea value={form.diagnosis} onChange={tf('diagnosis')} placeholder="Diagnóstico clínico" rows={2} className="input-field resize-none"/></div>
            <div><label className="label">Tratamiento realizado</label><textarea value={form.treatment} onChange={tf('treatment')} placeholder="Procedimiento realizado" rows={2} className="input-field resize-none"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Medicamentos recetados</label><textarea value={form.medications} onChange={tf('medications')} placeholder="Nombre, dosis, frecuencia..." rows={3} className="input-field resize-none"/></div>
              <div><label className="label">Próximos pasos / Indicaciones</label><textarea value={form.next_steps} onChange={tf('next_steps')} placeholder="Instrucciones para el paciente..." rows={3} className="input-field resize-none"/></div>
            </div>
            <div><label className="label">Notas clínicas</label><textarea value={form.notes} onChange={tf('notes')} placeholder="Observaciones adicionales..." rows={2} className="input-field resize-none"/></div>
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
              <p className="text-sm font-semibold text-slate-700 mb-1">Odontograma</p>
              <p className="text-xs text-slate-400 mb-3">Selecciona un estado y haz clic en cada diente</p>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {STATES.map(s=><button key={s} type="button" onClick={()=>setMarkAs(s)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${markAs===s?STATE_STYLE[s].btn:'border-transparent text-slate-400 hover:border-slate-200'}`}>{s}</button>)}
              </div>
              <div className="flex justify-center gap-1 mb-1 flex-wrap">
                {UPPER.map(t=><button key={t} type="button" onClick={()=>toggleTooth(t)} className={`w-8 h-8 border-2 rounded-lg text-xs font-semibold transition-all hover:scale-110 ${form.odontogram[t]?STATE_STYLE[form.odontogram[t]].tooth:'border-slate-200 text-slate-500 hover:border-slate-300'}`}>{t}</button>)}
              </div>
              <div className="text-center text-xs text-slate-300 my-1 border-t border-dashed border-slate-200 pt-1">Superior / Inferior</div>
              <div className="flex justify-center gap-1 mt-1 flex-wrap">
                {LOWER.map(t=><button key={t} type="button" onClick={()=>toggleTooth(t)} className={`w-8 h-8 border-2 rounded-lg text-xs font-semibold transition-all hover:scale-110 ${form.odontogram[t]?STATE_STYLE[form.odontogram[t]].tooth:'border-slate-200 text-slate-500 hover:border-slate-300'}`}>{t}</button>)}
              </div>
            </div>
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
              <SignatureCanvas value={form.signature} onChange={sig=>setForm(p=>({...p,signature:sig}))}/>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button onClick={()=>setModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={save} className="btn-primary">Guardar historia</button>
          </div>
        </Modal>
      )}
    </div>
  );
}