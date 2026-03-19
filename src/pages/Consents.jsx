import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, FileCheck, PenLine, Trash, Download } from 'lucide-react';
import { patients as pStore, consents as cStore, profile as profStore } from '../lib/store';
import Modal from '../components/Modal';
import Select from '../components/Select';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';

const CONSENT_TYPES = ['Consulta general','Extracción dental','Endodoncia','Implante dental','Ortodoncia','Blanqueamiento','Cirugía oral','Anestesia general','Procedimiento radiológico'];

const CONSENT_TEXT = (type, patient, doctor, clinic) => `CONSENTIMIENTO INFORMADO - ${type?.toUpperCase() || 'PROCEDIMIENTO DENTAL'}

Yo, ${patient}, mayor de edad, en pleno uso de mis facultades mentales, de manera libre y voluntaria:

DECLARO que el ${doctor} me ha informado de manera clara y comprensible sobre:

1. El diagnóstico de mi condición dental actual.
2. El procedimiento a realizar: ${type}.
3. Los beneficios esperados del tratamiento.
4. Los riesgos y posibles complicaciones asociadas.
5. Las alternativas de tratamiento disponibles.
6. Las consecuencias de no realizar el tratamiento.

AUTORIZO al equipo de ${clinic} a realizar el procedimiento indicado y cualquier acto médico necesario durante el mismo.

CONFIRMO que he tenido la oportunidad de hacer preguntas y que todas han sido respondidas satisfactoriamente.

Fecha: ${new Date().toLocaleDateString('es-MX')}`;

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
        <label className="label mb-0">Firma del Paciente *</label>
        <button type="button" onClick={clear} className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"><Trash size={12}/> Limpiar</button>
      </div>
      <p className="text-xs text-slate-400 mb-2">El paciente firma aquí con el dedo o mouse</p>
      <canvas ref={canvasRef} width={640} height={160} className="w-full border-2 border-dashed border-slate-200 rounded-xl bg-white cursor-crosshair" style={{touchAction:'none'}}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}/>
    </div>
  );
}

function exportConsentPDF(c, patientName, prof) {
  const docName = prof?.doctor_name ? `${prof.doctor_prefix} ${prof.doctor_name}` : 'Dentra';
  const clinicName = prof?.name || 'Sistema de Gestión Dental';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:13px;color:#1e293b;padding:40px;line-height:1.6}
    .hdr{display:flex;justify-content:space-between;border-bottom:2px solid #1e293b;padding-bottom:14px;margin-bottom:24px}
    .brand{font-size:20px;font-weight:800;color:#1e293b}.brand span{font-size:11px;display:block;color:#94a3b8;font-weight:400}
    .title{font-size:16px;font-weight:700;text-align:center;margin-bottom:20px;color:#1e293b}
    .content{white-space:pre-wrap;line-height:1.8;color:#374151;font-size:13px}
    .sig{margin-top:32px;border-top:1px solid #e2e8f0;padding-top:16px;display:flex;justify-content:space-between;align-items:flex-end}
    .sig-box{text-align:center}.sig-box img{max-height:70px;display:block;margin:0 auto 8px}
    .sig-line{border-top:1px solid #1e293b;width:200px;padding-top:4px;font-size:11px;color:#94a3b8}
    .footer{margin-top:24px;border-top:1px solid #e2e8f0;padding-top:10px;text-align:center;color:#94a3b8;font-size:10px}
  </style></head><body>
    <div class="hdr"><div class="brand">${clinicName}<span>Sistema de Gestión Dental</span></div><div style="text-align:right;font-size:11px;color:#64748b">${c.date}<br/>Consentimiento #${c.id}</div></div>
    <div class="title">CONSENTIMIENTO INFORMADO<br/>${c.type}</div>
    <div class="content">${c.content}</div>
    <div class="sig">
      <div class="sig-box"><div class="sig-line">Firma del Médico · ${docName}</div></div>
      <div class="sig-box">${c.signature?`<img src="${c.signature}"/>`:'<div style="height:70px"></div>'}<div class="sig-line">Firma del Paciente · ${patientName}</div></div>
    </div>
    <div class="footer">Generado por Dentra · Powered by Atlara · ${new Date().toLocaleDateString('es-MX')}</div>
  </body></html>`;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
}

export default function Consents() {
  const [pts, setPts]         = useState([]);
  const [list, setList]       = useState([]);
  const [prof, setProf]       = useState(null);
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [alert, setAlert] = useState(null);
  const [form, setForm]       = useState({ patient_id:'', type:'', date:new Date().toISOString().split('T')[0], content:'', signature:'' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [p, c, pr] = await Promise.all([pStore.get(), cStore.get(), profStore.get()]);
    setPts(p);
    setList(c);
    setProf(pr);
  };

  const reload   = () => cStore.get().then(setList);
  const getName  = id => pts.find(p => p.id === id)?.name || 'Desconocido';

  const filtered = list.filter(c => getName(c.patient_id).toLowerCase().includes(search.toLowerCase()) || c.type?.toLowerCase().includes(search.toLowerCase()));

  const handlePatientOrType = (field, val) => {
    setForm(prev => {
      const updated = { ...prev, [field]: val };
      const pName = field === 'patient_id' ? (pts.find(p => p.id === val)?.name || '') : getName(prev.patient_id);
      const type  = field === 'type' ? val : prev.type;
      const docName = prof?.doctor_name ? `${prof.doctor_prefix} ${prof.doctor_name}` : 'Dr.';
      const clinicName = prof?.name || 'Dentra';
      updated.content = CONSENT_TEXT(type, pName, docName, clinicName);
      return updated;
    });
  };

  const save = async () => {
    if (!form.patient_id || !form.type || !form.signature) { setAlert('Paciente, tipo y firma son requeridos'); return; }
    setSaving(true);
    try {
      await cStore.add(form);
      await reload();
      setModal(false);
      setForm({ patient_id:'', type:'', date:new Date().toISOString().split('T')[0], content:'', signature:'' });
    } catch (err) {
      setAlert('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await cStore.remove(id);
      await reload();
      setConfirmDel(null);
    } catch (err) {
      setAlert('Error al eliminar: ' + err.message);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Consentimientos Informados</h1>
          <p className="text-sm text-slate-400 mt-0.5">{list.length} documentos registrados</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary"><Plus size={16}/> Nuevo Consentimiento</button>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por paciente o procedimiento..." className="input-field pl-10"/>
      </div>

      <div className="card overflow-hidden">
        {list.length === 0
          ? <div className="py-16 text-center"><FileCheck size={36} className="text-slate-200 mx-auto mb-3"/><p className="text-sm text-slate-400">No hay consentimientos registrados</p></div>
          : filtered.map(c => (
            <div key={c.id} className="table-row group">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileCheck size={16} className="text-slate-600"/>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{getName(c.patient_id)}</p>
                  <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                    <span>{c.type}</span>
                    <span>· {c.date}</span>
                    {c.signature && <span className="flex items-center gap-1 text-slate-500"><PenLine size={10}/> Firmado</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => exportConsentPDF(c, getName(c.patient_id), prof)} className="icon-btn" title="Exportar PDF"><Download size={14}/></button>
                <button onClick={() => setConfirmDel(c.id)} className="icon-btn-danger"><Trash2 size={14}/></button>
              </div>
            </div>
          ))
        }
      </div>

      {modal && (
        <Modal title="Nuevo Consentimiento Informado" onClose={() => setModal(false)} wide>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Paciente *</label>
                <Select value={form.patient_id} onChange={v => handlePatientOrType('patient_id', v)} placeholder="Seleccionar paciente..." options={pts.map(p => ({value:p.id,label:p.name}))}/>
              </div>
              <div><label className="label">Fecha</label><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} className="input-field"/></div>
            </div>
            <div><label className="label">Tipo de procedimiento *</label>
              <Select value={form.type} onChange={v => handlePatientOrType('type', v)} placeholder="Seleccionar procedimiento..." options={CONSENT_TYPES}/>
            </div>
            <div>
              <label className="label">Contenido del consentimiento</label>
              <textarea value={form.content} onChange={e=>setForm(p=>({...p,content:e.target.value}))} rows={10} className="input-field resize-none font-mono text-xs"/>
            </div>
            <SignatureCanvas value={form.signature} onChange={sig => setForm(p=>({...p,signature:sig}))}/>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary"><FileCheck size={15}/> {saving ? 'Guardando...' : 'Guardar y firmar'}</button>
          </div>
        </Modal>
      )}

      {alert && <AlertModal message={alert} onClose={() => setAlert(null)}/>}
      {confirmDel && <ConfirmModal message="¿Eliminar este consentimiento? Esta acción no se puede deshacer." onConfirm={() => handleDelete(confirmDel)} onCancel={() => setConfirmDel(null)}/>}
    </div>
  );
}