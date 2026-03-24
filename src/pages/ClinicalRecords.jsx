import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, FileText, PenLine, Trash, Download, StickyNote, FileCheck, ClipboardList } from 'lucide-react';
import { patients as pStore, records as rStore, consents as cStore, plans as plStore, profile as profStore, profilesShared as profsStore } from '../lib/store';
import Modal from '../components/Modal';
import Select from '../components/Select';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import Odontogram from '../components/Odontogram';

// ─── Constants ────────────────────────────────────────────────
const UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
const STATES = ['Sano','Cariado','Extraído','Tratado'];
const STATE_STYLE = {
  Sano:    { btn:'bg-green-100 text-green-700 border-green-300',  tooth:'border-slate-200 text-slate-600' },
  Cariado: { btn:'bg-amber-100 text-amber-700 border-amber-300',  tooth:'border-amber-400 bg-amber-50 text-amber-700' },
  Extraído:{ btn:'bg-red-100 text-red-600 border-red-300',        tooth:'border-red-400 bg-red-50 text-red-600 line-through' },
  Tratado: { btn:'bg-blue-100 text-blue-700 border-blue-300',     tooth:'border-blue-400 bg-blue-50 text-blue-700' },
};
const EMPTY_RECORD = { patient_id:'', date:new Date().toISOString().split('T')[0], teeth:'', reason:'', diagnosis:'', treatment:'', medications:'', next_steps:'', notes:'', odontogram:{}, signature:'', doctor_name: '' };
const CONSENT_TYPES = ['Consulta general','Extracción dental','Endodoncia','Implante dental','Ortodoncia','Blanqueamiento','Cirugía oral','Anestesia general'];
const TREATMENTS_PLAN = ['Limpieza dental','Consulta general','Endodoncia (conducto)','Extracción','Ortodoncia','Blanqueamiento','Implante dental','Corona','Puente','Cirugía oral','Radiografía','Otro'];
const PRIORITIES = ['Alta','Media','Baja'];
const PRIORITY_BADGE = { Alta:'badge badge-red', Media:'badge badge-amber', Baja:'badge badge-slate' };

// ─── Signature Canvas ─────────────────────────────────────────
function SignatureCanvas({ value, onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    if (value) { const img = new Image(); img.onload = () => ctx.drawImage(img,0,0); img.src = value; }
  }, []);
  const getPos = (e, c) => { const r=c.getBoundingClientRect(),t=e.touches?e.touches[0]:e; return {x:(t.clientX-r.left)*(c.width/r.width),y:(t.clientY-r.top)*(c.height/r.height)}; };
  const startDraw = e => { e.preventDefault(); drawing.current=true; lastPos.current=getPos(e,canvasRef.current); };
  const draw = e => { e.preventDefault(); if(!drawing.current)return; const c=canvasRef.current,ctx=c.getContext('2d'),pos=getPos(e,c); ctx.beginPath();ctx.moveTo(lastPos.current.x,lastPos.current.y);ctx.lineTo(pos.x,pos.y);ctx.strokeStyle='#1e293b';ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();lastPos.current=pos; };
  const endDraw = e => { e.preventDefault(); if(!drawing.current)return; drawing.current=false; onChange(canvasRef.current.toDataURL()); };
  const clear = () => { const c=canvasRef.current,ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);onChange(''); };
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

// ─── Export PDF Historia ──────────────────────────────────────
function exportPDF(r, patientName, prof) {
  const TOOTH_STYLE = { 
    Sano:     { fill: '#f0fdf4',     stroke: '#22c55e' },
    Cariado:  { fill: '#fee2e2',     stroke: '#ef4444' },
    Tratado:  { fill: '#eff6ff',     stroke: '#3b82f6' },
    Extraído: { fill: 'transparent', stroke: '#ef4444' },
    Corona:   { fill: '#fffbeb',     stroke: '#f59e0b' }
  };
  
  const getPoly = (points, status) => {
    const isSpecial = status === 'Extraído' || status === 'Corona';
    const fill = !status ? 'transparent' : (isSpecial ? 'transparent' : TOOTH_STYLE[status].fill);
    const stroke = !status ? '#cbd5e1' : (TOOTH_STYLE[status]?.stroke || '#cbd5e1');
    const sw = !status ? 0.8 : 1.2;
    return `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
  };

  const renderToothSVG = (t, o = {}) => {
    const faceF = o['F'];
    const isExtracted = faceF === 'Extraído';
    // If extracted, we draw the cross over the whole tooth box
    const extractedLines = isExtracted ? `<line x1="10" y1="10" x2="40" y2="40" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/><line x1="40" y1="10" x2="10" y2="40" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>` : '';
    
    // Draw the 5 faces
    const svg = `
      <svg width="22" height="22" viewBox="0 0 50 50" style="display:block;margin:0 auto">
        ${getPoly("5,5 45,5 35,15 15,15", o['T'])}
        ${getPoly("5,45 45,45 35,35 15,35", o['B'])}
        ${getPoly("5,5 15,15 15,35 5,45", o['L'])}
        ${getPoly("45,5 35,15 35,35 45,45", o['R'])}
        ${getPoly("15,15 35,15 35,35 15,35", o['C'])}
        ${extractedLines}
      </svg>
    `;

    // Wrap the number and the SVG diagram in a box
    let wrapperStyle = `width:28px; display:inline-flex; flex-direction:column; align-items:center; gap:3px; margin:0 1px;`;
    if (faceF === 'Corona') {
      wrapperStyle += ` border-bottom: 3px solid #f59e0b; padding-bottom: 2px;`;
    }

    return `
      <div style="${wrapperStyle}">
        <div style="font-size:9px; font-weight:700; color:#475569;">${t}</div>
        ${svg}
      </div>
    `;
  };

  const toothObj = t => renderToothSVG(t, r.odontogram?.[t] || {});
  
  const docName = r.doctor_name || (prof?.doctor_name ? `${prof.doctor_prefix} ${prof.doctor_name}` : 'Dentra');
  const clinicName = prof?.name || 'Sistema de Gestión Dental';
  const address = prof?.show_address_in_pdfs ? prof?.address : '';
  const phone = prof?.show_phone_in_pdfs ? prof?.phone : '';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>@media print { @page { margin: 0; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:13px;color:#1e293b;padding:36px}.hdr{display:flex;justify-content:space-between;border-bottom:2px solid #1e293b;padding-bottom:14px;margin-bottom:20px}.brand{font-size:20px;font-weight:800;color:#1e293b}.brand span{font-size:11px;display:block;color:#94a3b8;font-weight:400}.sec{font-size:12px;font-weight:700;color:#1e293b;margin:16px 0 8px;border-left:3px solid #334155;padding-left:7px}.box{background:#f8fafc;border-radius:7px;padding:10px;margin-bottom:8px}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px}.lbl{font-size:9px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.4px;display:block;margin-bottom:3px}.footer{margin-top:28px;border-top:1px solid #e2e8f0;padding-top:10px;text-align:center;color:#94a3b8;font-size:10px}.teeth{display:flex;gap:3px;flex-wrap:wrap;justify-content:center}</style></head><body>
    <div class="hdr">
      <div class="brand">
        ${prof?.logo_base64 ? `<img src="${prof.logo_base64}" style="max-height:48px;max-width:160px;object-fit:contain;display:block;margin-bottom:4px"/>` : ''}
        ${clinicName}
        <span>${docName} ${prof?.specialty ? `· ${prof.specialty}` : ''}</span>
      </div>
      <div style="text-align:right">
        <div style="font-size:16px;font-weight:700">Historia Clínica</div>
        <div style="color:#64748b;font-size:10px;margin-top:2px">
          ${address ? `<div>${address}</div>` : ''}
          ${phone ? `<div>Tel: ${phone}</div>` : ''}
          <div style="margin-top:4px;font-weight:600">${r.date}</div>
        </div>
      </div>
    </div>
    <div class="grid2"><div class="box"><span class="lbl">Paciente</span>${patientName}</div><div class="box"><span class="lbl">Fecha</span>${r.date}</div></div>
    ${r.teeth?`<div class="box"><span class="lbl">Pieza(s)</span>${r.teeth}</div>`:''}
    ${r.reason?`<div class="sec">Motivo de Consulta</div><div class="box">${r.reason}</div>`:''}
    ${r.diagnosis?`<div class="sec">Diagnóstico</div><div class="box">${r.diagnosis}</div>`:''}
    ${r.treatment?`<div class="sec">Tratamiento Realizado</div><div class="box">${r.treatment}</div>`:''}
    ${(r.medications||r.next_steps)?`<div class="grid2">${r.medications?`<div class="box"><span class="lbl">Medicamentos</span>${r.medications}</div>`:''} ${r.next_steps?`<div class="box"><span class="lbl">Próximos pasos</span>${r.next_steps}</div>`:''}</div>`:''}
    ${r.notes?`<div class="sec">Notas Clínicas</div><div class="box">${r.notes}</div>`:''}
    ${Object.keys(r.odontogram||{}).length>0?`<div class="sec">Odontograma</div><div class="box"><div class="teeth">${UPPER.map(toothObj).join('')}</div><div style="text-align:center;font-size:9px;color:#94a3b8;padding:8px 0;border-top:1px dashed #e2e8f0;border-bottom:1px dashed #e2e8f0;margin:8px 0">Superior / Inferior</div><div class="teeth">${LOWER.map(toothObj).join('')}</div></div>`:''}
    ${r.signature?`<div class="sec">Firma del Paciente</div><div class="box" style="text-align:center"><img src="${r.signature}" style="max-height:80px"/></div>`:''}
    <div class="footer">${prof?.license ? `Cédula Profesional: ${prof.license} · ` : ''}${clinicName}${prof?.address ? ` · ${prof.address}` : ''} · ${new Date().toLocaleDateString('es-MX')}</div>
  </body></html>`;
  const win = window.open('', '_blank'); 
  win.document.write(html); 
  win.document.close(); 
  setTimeout(() => { if (!win.closed) win.print(); }, 500);
}

// ─── Tab: Historias ───────────────────────────────────────────
function TabHistorias({ pts, prof, profs }) {
  const [list, setList]           = useState(() => rStore.getCached());
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_RECORD);
  const [markAs, setMarkAs]       = useState('Cariado');
  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText]   = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { 
    reload();
    const unsub = rStore.subscribe(setList);
    const draft = localStorage.getItem('draft_historia');
    if (draft) { setForm(JSON.parse(draft)); setModal(true); }
    return unsub;
  }, []);

  useEffect(() => {
    if (modal && !editing) localStorage.setItem('draft_historia', JSON.stringify(form));
    else localStorage.removeItem('draft_historia');
  }, [form, modal, editing]);

  const reload  = () => rStore.get().then(setList);
  const getName = id => pts.find(p=>p.id===id)?.name||'Desconocido';
  const filtered = list.filter(r => { const s=search.toLowerCase(); return getName(r.patient_id).toLowerCase().includes(s)||r.diagnosis?.toLowerCase().includes(s)||r.treatment?.toLowerCase().includes(s); });

  const openNew  = () => { setForm(EMPTY_RECORD); setEditing(null); setMarkAs('Cariado'); setModal(true); };
  const openEdit = r  => { setForm(r); setEditing(r.id); setMarkAs('Cariado'); setModal(true); };
  
  const save = async () => { 
    if (!form.patient_id||!form.date||!form.signature) { setAlert('Paciente, fecha y firma son requeridos'); return; } 
    setSaving(true);
    try {
      editing ? await rStore.update(editing,form) : await rStore.add(form); 
      await reload(); 
      setModal(false); 
      localStorage.removeItem('draft_historia');
    } catch (err) {
      setAlert('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const openNote = r => { setNoteModal(r); setNoteText(r.quick_note||''); };
  
  const saveNote = async () => { 
    setSaving(true);
    try {
      await rStore.update(noteModal.id,{quick_note:noteText}); 
      await reload(); 
      setNoteModal(null); 
    } catch (err) {
      setAlert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await rStore.remove(confirmDel);
      await reload();
      setConfirmDel(null);
    } catch (err) {
      setAlert('Error al eliminar: ' + err.message);
    }
  };

  const tf = k => e => setForm(p=>({...p,[k]:e.target.value}));

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 mr-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por paciente, diagnóstico o tratamiento..." className="input-field pl-10"/>
        </div>
        <button onClick={openNew} className="btn-primary flex-shrink-0"><Plus size={16}/> Nueva Historia</button>
      </div>

      <div className="card">
        {filtered.length===0
          ?<div className="py-16 text-center"><FileText size={36} className="text-slate-200 mx-auto mb-3"/><p className="text-sm text-slate-400">No hay historias clínicas registradas</p></div>
          :filtered.map((r, idx)=>(
            <div key={r.id} className={`flex items-center justify-between p-3 px-5 bg-white hover:bg-slate-50 transition-all group border-b border-slate-50 last:border-0 relative ${idx===0?'rounded-t-xl':''} ${idx===filtered.length-1?'rounded-b-xl':''}`}>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-700 truncate">{getName(r.patient_id)}</p>
                  <div className="flex gap-1">
                    {r.quick_note&&<span className="badge badge-amber py-0.5 px-1.5 text-[9px] flex items-center gap-1 uppercase tracking-wider"><StickyNote size={8}/> Nota</span>}
                    {r.signature&&<span className="badge badge-indigo py-0.5 px-1.5 text-[9px] flex items-center gap-1 uppercase tracking-wider"><PenLine size={8}/> Firmada</span>}
                  </div>
                </div>
                <div className="flex gap-3 mt-0.5 text-xs text-slate-400">
                  <span className="font-medium">{r.date}</span>{r.doctor_name && <span className="text-indigo-400 font-bold">· {r.doctor_name}</span>}{r.diagnosis&&<span className="truncate">· {r.diagnosis}</span>}{r.treatment&&<span className="truncate">· {r.treatment}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                <button onClick={()=>openNote(r)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all tooltip-trigger tooltip-left" data-tip="Nota rápida"><StickyNote size={15}/></button>
                <button onClick={()=>exportPDF(r,getName(r.patient_id), prof)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all tooltip-trigger tooltip-left" data-tip="Exportar PDF"><Download size={15}/></button>
                <button onClick={()=>openEdit(r)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all tooltip-trigger tooltip-left" data-tip="Editar"><Edit2 size={15}/></button>
                <button onClick={()=>setConfirmDel(r.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all tooltip-trigger tooltip-left" data-tip="Eliminar"><Trash2 size={15}/></button>
              </div>
            </div>
          ))
        }
      </div>

      {noteModal&&(<Modal title={`Nota rápida — ${getName(noteModal.patient_id)}`} onClose={()=>setNoteModal(null)}><div className="p-6"><p className="text-xs text-slate-400 mb-3">Agrega una nota rápida visible en el listado</p><textarea value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Ej: Paciente sensible al frío..." rows={4} className="input-field resize-none" autoFocus/></div><div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100"><button onClick={()=>setNoteModal(null)} className="btn-secondary">Cancelar</button><button onClick={saveNote} disabled={saving} className="btn-primary">{saving?'Guardando...':'Guardar nota'}</button></div></Modal>)}

      {modal&&(
        <Modal title={editing?'Editar Historia Clínica':'Nueva Historia Clínica'} onClose={()=>setModal(false)} wide>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Paciente *</label><Select value={form.patient_id} onChange={v=>setForm(p=>({...p,patient_id:v}))} placeholder="Seleccionar paciente..." options={pts.map(p=>({value:p.id,label:p.name}))}/></div>
              <div><label className="label">Fecha de visita *</label><input type="date" value={form.date} onChange={tf('date')} className="input-field"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Pieza(s) dental(es)</label><input value={form.teeth} onChange={tf('teeth')} placeholder="Ej: 11, 21, 22" className="input-field"/></div>
              <div>
                <label className="label">Doctor(a) que atiende</label>
                <Select 
                  value={form.doctor_name || ''} 
                  onChange={v => setForm(p => ({ ...p, doctor_name: v }))} 
                  placeholder="Asignar doctor..." 
                  options={profs.filter(p => p.role === 'admin' || p.role === 'doctor').map(p => ({ value: p.full_name, label: p.full_name }))} 
                />
              </div>
            </div>
            <div><label className="label">Motivo de consulta</label><textarea value={form.reason} onChange={tf('reason')} placeholder="¿Por qué consulta el paciente?" rows={2} className="input-field resize-none"/></div>
            <div><label className="label">Diagnóstico</label><textarea value={form.diagnosis} onChange={tf('diagnosis')} placeholder="Diagnóstico clínico" rows={2} className="input-field resize-none"/></div>
            <div><label className="label">Tratamiento realizado</label><textarea value={form.treatment} onChange={tf('treatment')} placeholder="Procedimiento realizado" rows={2} className="input-field resize-none"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Medicamentos recetados</label><textarea value={form.medications} onChange={tf('medications')} placeholder="Nombre, dosis, frecuencia..." rows={3} className="input-field resize-none"/></div>
              <div><label className="label">Próximos pasos</label><textarea value={form.next_steps} onChange={tf('next_steps')} placeholder="Instrucciones para el paciente..." rows={3} className="input-field resize-none"/></div>
            </div>
            <div><label className="label">Notas clínicas</label><textarea value={form.notes} onChange={tf('notes')} placeholder="Observaciones adicionales..." rows={2} className="input-field resize-none"/></div>
            <Odontogram value={form.odontogram} onChange={od => setForm(p => ({...p, odontogram: od}))}/>
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
              <SignatureCanvas value={form.signature} onChange={sig=>setForm(p=>({...p,signature:sig}))}/>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button onClick={()=>setModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary">{saving?'Guardando...':'Guardar historia'}</button>
          </div>
        </Modal>
      )}
      {alert && <AlertModal message={alert} onClose={() => setAlert(null)}/>}
      {confirmDel&&<ConfirmModal message="¿Eliminar esta historia clínica?" onConfirm={confirmDelete} onCancel={()=>setConfirmDel(null)}/>}
    </>
  );
}

// ─── Tab: Consentimientos ─────────────────────────────────────
function TabConsents({ pts, prof }) {
  const [list, setList]   = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [alert, setAlert] = useState(null);
  const [form, setForm]   = useState({ patient_id:'', type:'', date:new Date().toISOString().split('T')[0], content:'', signature:'' });
  const [saving, setSaving] = useState(false);

  useEffect(()=>{ 
    reload();
    const unsub = cStore.subscribe(setList);
    const draft = localStorage.getItem('draft_consent');
    if (draft) { setForm(JSON.parse(draft)); setModal(true); }
    return unsub;
  },[]);

  useEffect(() => {
    if (modal) localStorage.setItem('draft_consent', JSON.stringify(form));
    else localStorage.removeItem('draft_consent');
  }, [form, modal]);

  const reload  = ()=> cStore.get().then(setList);
  const getName = id=>pts.find(p=>p.id===id)?.name||'Desconocido';
  const filtered = list.filter(c=>getName(c.patient_id).toLowerCase().includes(search.toLowerCase())||c.type?.toLowerCase().includes(search.toLowerCase()));

  const genContent = (type, pName) => `CONSENTIMIENTO INFORMADO - ${type?.toUpperCase()||''}\n\nYo, ${pName}, mayor de edad, de manera libre y voluntaria:\n\nDECLARO que el médico me ha informado sobre:\n1. El diagnóstico de mi condición dental actual.\n2. El procedimiento a realizar: ${type}.\n3. Los beneficios esperados del tratamiento.\n4. Los riesgos y posibles complicaciones asociadas.\n5. Las alternativas de tratamiento disponibles.\n\nAUTORIZO la realización del procedimiento indicado.\n\nFecha: ${new Date().toLocaleDateString('es-MX')}`;

  const handleChange = (field, val) => setForm(prev => {
    const updated = { ...prev, [field]: val };
    const pName = field==='patient_id' ? (pts.find(p=>p.id===val)?.name||'') : getName(prev.patient_id);
    const type  = field==='type' ? val : prev.type;
    if (field==='patient_id'||field==='type') updated.content = genContent(type, pName);
    return updated;
  });

  const save = async () => {
    if (!form.patient_id||!form.type||!form.signature) { setAlert('Paciente, tipo y firma son requeridos'); return; }
    setSaving(true);
    try {
      await cStore.add(form); 
      await reload(); 
      setModal(false);
      localStorage.removeItem('draft_consent');
      setForm({ patient_id:'', type:'', date:new Date().toISOString().split('T')[0], content:'', signature:'' });
    } catch (err) {
      setAlert('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await cStore.remove(confirmDel);
      await reload();
      setConfirmDel(null);
    } catch (err) {
      setAlert('Error al eliminar: ' + err.message);
    }
  };

  const exportConsentPDF = (c, prof) => {
    const docName = prof?.doctor_name ? `${prof.doctor_prefix} ${prof.doctor_name}` : 'Dentra';
    const clinicName = prof?.name || 'Sistema de Gestión Dental';
    const address = prof?.show_address_in_pdfs ? prof?.address : '';
    const phone = prof?.show_phone_in_pdfs ? prof?.phone : '';

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>@media print { @page { margin: 0; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:13px;color:#1e293b;padding:40px;line-height:1.6}.hdr{display:flex;justify-content:space-between;border-bottom:2px solid #1e293b;padding-bottom:14px;margin-bottom:24px}.brand{font-size:20px;font-weight:800;color:#1e293b}.brand span{font-size:11px;display:block;color:#94a3b8;font-weight:400}.content{white-space:pre-wrap;line-height:1.8;color:#374151}.sig{margin-top:32px;display:flex;justify-content:flex-end}.sig-box{text-align:center}.sig-box img{max-height:70px;display:block;margin:0 auto 8px}.sig-line{border-top:1px solid #1e293b;width:200px;padding-top:4px;font-size:11px;color:#94a3b8}.footer{margin-top:24px;border-top:1px solid #e2e8f0;padding-top:10px;text-align:center;color:#94a3b8;font-size:10px}</style></head><body>
      <div class="hdr">
        <div class="brand">
          ${prof?.logo_base64 ? `<img src="${prof.logo_base64}" style="max-height:48px;max-width:160px;object-fit:contain;display:block;margin-bottom:4px"/>` : ''}
          ${clinicName}
          <span>${docName} ${prof?.specialty ? `· ${prof.specialty}` : ''}</span>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:#64748b">${c.date}</div>
          <div style="font-size:10px;color:#94a3b8;margin-top:2px">
            ${address ? `<div>${address}</div>` : ''}
            ${phone ? `<div>Tel: ${phone}</div>` : ''}
          </div>
        </div>
      </div>
      <div class="content">${c.content}</div>
      <div class="sig"><div class="sig-box">${c.signature?`<img src="${c.signature}"/>`:'<div style="height:70px"></div>'}<div class="sig-line">Firma del Paciente · ${getName(c.patient_id)}</div></div></div>
      <div class="footer">${prof?.license ? `Cédula Profesional: ${prof.license} · ` : ''}${clinicName}${address ? ` · ${address}` : ''}${phone ? ` · Tel: ${phone}` : ''} · ${new Date().toLocaleDateString('es-MX')}</div>
    </body></html>`;
    const win=window.open('','_blank'); 
    win.document.write(html); 
    win.document.close(); 
    setTimeout(() => { if (!win.closed) win.print(); }, 500);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 mr-4"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por paciente o procedimiento..." className="input-field pl-10"/></div>
        <button onClick={()=>setModal(true)} className="btn-primary flex-shrink-0"><Plus size={16}/> Nuevo Consentimiento</button>
      </div>
      <div className="card overflow-hidden">
        {filtered.length===0
          ?<div className="py-16 text-center"><FileCheck size={36} className="text-slate-200 mx-auto mb-3"/><p className="text-sm text-slate-400">No hay consentimientos registrados</p></div>
          :filtered.map(c=>(
            <div key={c.id} className="flex items-center justify-between p-3 px-5 bg-white hover:bg-slate-50 transition-all group border-b border-slate-50 last:border-0 relative">
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0"><FileCheck size={16} className="text-indigo-600"/></div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-700 truncate">{getName(c.patient_id)}</p>
                  <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                    <span className="font-medium">{c.type}</span>
                    <span className="truncate">· {c.date}</span>
                    {c.signature&&<span className="flex items-center gap-1 text-slate-600 font-bold uppercase text-[9px] tracking-wider"><PenLine size={10}/> Firmado</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                <button onClick={()=>exportConsentPDF(c, prof)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all tooltip-trigger" data-tip="Exportar PDF"><Download size={15}/></button>
                <button onClick={()=>setConfirmDel(c.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all tooltip-trigger" data-tip="Eliminar"><Trash2 size={15}/></button>
              </div>
            </div>
          ))
        }
      </div>
      {modal&&(
        <Modal title="Nuevo Consentimiento Informado" onClose={()=>setModal(false)} wide>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Paciente *</label><Select value={form.patient_id} onChange={v=>handleChange('patient_id',v)} placeholder="Seleccionar paciente..." options={pts.map(p=>({value:p.id,label:p.name}))}/></div>
              <div><label className="label">Fecha</label><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} className="input-field"/></div>
            </div>
            <div><label className="label">Tipo de procedimiento *</label><Select value={form.type} onChange={v=>handleChange('type',v)} placeholder="Seleccionar procedimiento..." options={CONSENT_TYPES}/></div>
            <div><label className="label">Contenido</label><textarea value={form.content} onChange={e=>setForm(p=>({...p,content:e.target.value}))} rows={8} className="input-field resize-none font-mono text-xs"/></div>
            <SignatureCanvas value={form.signature} onChange={sig=>setForm(p=>({...p,signature:sig}))}/>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button onClick={()=>setModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary">
              <FileCheck size={15} className="mr-1.5 inline"/> {saving ? 'Guardando...' : 'Guardar y firmar'}
            </button>
          </div>
        </Modal>
      )}
      {alert && <AlertModal message={alert} onClose={() => setAlert(null)}/>}
      {confirmDel && <ConfirmModal message="¿Eliminar este consentimiento?" onConfirm={confirmDelete} onCancel={()=>setConfirmDel(null)}/>}
    </>
  );
}

// ─── Tab: Planes ──────────────────────────────────────────────
function TabPlans({ pts }) {
  const [list, setList]   = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [alert, setAlert] = useState(null);
  const [form, setForm]   = useState({ patient_id:'', date:new Date().toISOString().split('T')[0], notes:'', items:[] });
  const [newItem, setNewItem] = useState({ treatment:'', notes:'', priority:'Media' });
  const [saving, setSaving] = useState(false);

  useEffect(()=>{ 
    reload();
    const unsub = plStore.subscribe(setList);
    const draft = localStorage.getItem('draft_plan');
    if (draft) { setForm(JSON.parse(draft)); setModal(true); }
    return unsub;
  },[]);

  useEffect(() => {
    if (modal) localStorage.setItem('draft_plan', JSON.stringify(form));
    else localStorage.removeItem('draft_plan');
  }, [form, modal]);

  const reload  = ()=> plStore.get().then(setList);
  const getName = id=>pts.find(p=>p.id===id)?.name||'Desconocido';
  const filtered = list.filter(p=>getName(p.patient_id).toLowerCase().includes(search.toLowerCase()));

  const addItem = () => { if (!newItem.treatment) return; setForm(prev=>({...prev,items:[...prev.items,{...newItem,id:Date.now().toString(),done:false}]})); setNewItem({treatment:'',notes:'',priority:'Media'}); };
  
  const toggleItem = async (planId, itemId) => { 
    const plan=list.find(p=>p.id===planId); 
    const items=plan.items.map(i=>i.id===itemId?{...i,done:!i.done}:i); 
    try {
      await plStore.update(planId,{items}); 
      await reload(); 
    } catch (err) {
      setAlert('Error: ' + err.message);
    }
  };

  const save = async () => { 
    if (!form.patient_id||form.items.length===0) { setAlert('Paciente y al menos un procedimiento son requeridos'); return; } 
    setSaving(true);
    try {
      await plStore.add(form); 
      await reload(); 
      setModal(false); 
      localStorage.removeItem('draft_plan');
      setForm({patient_id:'',date:new Date().toISOString().split('T')[0],notes:'',items:[]}); 
    } catch (err) {
      setAlert('Error al guardar plan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await plStore.remove(confirmDel);
      await reload();
      setConfirmDel(null);
    } catch (err) {
      setAlert('Error al eliminar: ' + err.message);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 mr-4"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por paciente..." className="input-field pl-10"/></div>
        <button onClick={()=>setModal(true)} className="btn-primary flex-shrink-0"><Plus size={16}/> Nuevo Plan</button>
      </div>
      {filtered.length===0
        ?<div className="card py-16 text-center"><ClipboardList size={36} className="text-slate-200 mx-auto mb-3"/><p className="text-sm text-slate-400">No hay planes de tratamiento</p></div>
        :<div className="space-y-4">
          {filtered.map(plan=>{
            const done=(plan.items||[]).filter(i=>i.done).length, total=(plan.items||[]).length, pct=total>0?Math.round((done/total)*100):0;
            return (
              <div key={plan.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div><p className="font-semibold text-slate-700">{getName(plan.patient_id)}</p><p className="text-xs text-slate-400 mt-0.5">{plan.date} · {total} procedimientos</p></div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">{pct}% completado</span>
                    <button onClick={()=>setConfirmDel(plan.id)} className="icon-btn-danger tooltip-trigger" data-tip="Eliminar Plan"><Trash2 size={14}/></button>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4"><div className="bg-slate-700 h-1.5 rounded-full transition-all" style={{width:`${pct}%`}}/></div>
                <div className="space-y-2">
                  {(plan.items||[]).map(item=>(
                    <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${item.done?'bg-slate-50 border-slate-100 opacity-60':'bg-white border-slate-100 hover:border-slate-300'}`} onClick={()=>toggleItem(plan.id,item.id)}>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${item.done?'bg-slate-700 border-slate-700':'border-slate-300'}`}>
                        {item.done&&<div className="w-2 h-2 bg-white rounded-full"/>}
                      </div>
                      <p className={`text-sm font-medium flex-1 ${item.done?'line-through text-slate-400':'text-slate-700'}`}>{item.treatment}</p>
                      {item.notes&&<p className="text-xs text-slate-400">{item.notes}</p>}
                      <span className={PRIORITY_BADGE[item.priority]||'badge badge-slate'}>{item.priority}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      }
      {modal&&(
        <Modal title="Nuevo Plan de Tratamiento" onClose={()=>setModal(false)} wide>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Paciente *</label><Select value={form.patient_id} onChange={v=>setForm(p=>({...p,patient_id:v}))} placeholder="Seleccionar paciente..." options={pts.map(p=>({value:p.id,label:p.name}))}/></div>
              <div><label className="label">Fecha</label><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} className="input-field"/></div>
            </div>
            <div><label className="label">Notas del plan</label><textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Observaciones generales..." rows={2} className="input-field resize-none"/></div>
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
              <p className="text-sm font-semibold text-slate-700 mb-3">Procedimientos</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <Select value={newItem.treatment} onChange={v=>setNewItem(p=>({...p,treatment:v}))} placeholder="Tratamiento..." options={TREATMENTS_PLAN}/>
                <input value={newItem.notes} onChange={e=>setNewItem(p=>({...p,notes:e.target.value}))} placeholder="Notas..." className="input-field"/>
                <div className="flex gap-2">
                  <Select value={newItem.priority} onChange={v=>setNewItem(p=>({...p,priority:v}))} options={PRIORITIES}/>
                  <button onClick={addItem} className="btn-primary px-3 flex-shrink-0"><Plus size={15}/></button>
                </div>
              </div>
              {form.items.length===0?<p className="text-xs text-slate-400 text-center py-3">Sin procedimientos aún</p>
                :<div className="space-y-2">{form.items.map((item,i)=>(
                  <div key={item.id} className="flex items-center gap-2 bg-white rounded-xl p-2.5 border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 w-5">{i+1}</span>
                    <p className="text-sm text-slate-700 flex-1">{item.treatment}</p>
                    {item.notes&&<p className="text-xs text-slate-400">{item.notes}</p>}
                    <span className={PRIORITY_BADGE[item.priority]||'badge badge-slate'}>{item.priority}</span>
                    <button onClick={()=>setForm(p=>({...p,items:p.items.filter((_,idx)=>idx!==i)}))} className="icon-btn-danger p-1 tooltip-trigger" data-tip="Quitar"><Trash2 size={12}/></button>
                  </div>
                ))}</div>
              }
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button onClick={()=>setModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Guardar plan'}</button>
          </div>
        </Modal>
      )}
      {alert && <AlertModal message={alert} onClose={() => setAlert(null)}/>}
      {confirmDel && <ConfirmModal message="¿Eliminar este plan?" onConfirm={confirmDelete} onCancel={()=>setConfirmDel(null)}/>}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function ClinicalRecords() {
  const [pts, setPts] = useState(() => pStore.getCached());
  const [prof, setProf] = useState(() => profStore.getCached());
  const [profs, setProfs] = useState(() => profsStore.getCached());
  const [tab, setTab] = useState('historias');

  useEffect(() => { 
    pStore.get().then(setPts); 
    profStore.get().then(setProf);
    profsStore.get().then(setProfs);
    const unsubs = [
      pStore.subscribe(setPts),
      profStore.subscribe(setProf),
      profsStore.subscribe(setProfs)
    ];
    return () => unsubs.forEach(fn => fn());
  }, []);

  const tabs = [
    { id:'historias',       label:'Historias Clínicas', icon:FileText },
    { id:'consentimientos', label:'Consentimientos',     icon:FileCheck },
    { id:'planes',          label:'Planes de Tratamiento', icon:ClipboardList },
  ];

  return (
    <div className="p-8 pt-2">

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-2xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab===id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon size={15}/> {label}
          </button>
        ))}
      </div>

      {tab==='historias'       && <TabHistorias       pts={pts} prof={prof} profs={profs}/>}
      {tab==='consentimientos' && <TabConsents         pts={pts} prof={prof}/>}
      {tab==='planes'          && <TabPlans            pts={pts} prof={prof}/>}
    </div>
  );
}