import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, ClipboardList, CheckCircle2, Circle, Download } from 'lucide-react';
import { patients as pStore, plans as plStore } from '../lib/store';
import Modal from '../components/Modal';
import Select from '../components/Select';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';

const TREATMENTS = ['Limpieza dental','Consulta general','Endodoncia (conducto)','Extracción','Ortodoncia','Blanqueamiento','Implante dental','Corona','Puente','Cirugía oral','Radiografía','Otro'];
const PRIORITIES  = ['Alta','Media','Baja'];

export default function Plans() {
  const [pts, setPts]         = useState([]);
  const [list, setList]       = useState([]);
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [alert, setAlert] = useState(null);
  const [form, setForm]       = useState({ patient_id:'', date:new Date().toISOString().split('T')[0], notes:'', items:[] });
  const [newItem, setNewItem] = useState({ treatment:'', notes:'', priority:'Media' });

  useEffect(() => { setPts(pStore.get()); setList(plStore.get()); }, []);
  const reload  = () => setList(plStore.get());
  const getName = id => pts.find(p => p.id === id)?.name || 'Desconocido';

  const filtered = list.filter(p => getName(p.patient_id).toLowerCase().includes(search.toLowerCase()));

  const addItem = () => {
    if (!newItem.treatment) return;
    setForm(prev => ({ ...prev, items: [...prev.items, { ...newItem, id: Date.now().toString(), done: false }] }));
    setNewItem({ treatment:'', notes:'', priority:'Media' });
  };

  const toggleItem = (planId, itemId) => {
    const plan = list.find(p => p.id === planId);
    const items = plan.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i);
    plStore.update(planId, { items });
    reload();
  };

  const save = () => {
    if (!form.patient_id || form.items.length === 0) { setAlert('Paciente y al menos un procedimiento son requeridos'); return; }
    plStore.add(form);
    reload(); setModal(false);
    setForm({ patient_id:'', date:new Date().toISOString().split('T')[0], notes:'', items:[] });
  };

  const PRIORITY_BADGE = { Alta:'badge badge-red', Media:'badge badge-amber', Baja:'badge badge-slate' };

  const exportPDF = (plan) => {
    const patientName = getName(plan.patient_id);
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:13px;color:#1e293b;padding:36px}
      .hdr{display:flex;justify-content:space-between;border-bottom:2px solid #1e293b;padding-bottom:14px;margin-bottom:20px}
      .brand{font-size:20px;font-weight:800;color:#1e293b}.brand span{font-size:11px;display:block;color:#94a3b8;font-weight:400}
      .item{display:flex;align-items:flex-start;gap:10px;padding:10px;background:#f8fafc;border-radius:8px;margin-bottom:8px}
      .check{width:18px;height:18px;border:2px solid #1e293b;border-radius:4px;flex-shrink:0;margin-top:1px;${plan.items?.every(i=>i.done)?'background:#1e293b;':''}  }
      .badge{font-size:10px;padding:2px 8px;border-radius:99px;font-weight:600}
      .alta{background:#fee2e2;color:#dc2626}.media{background:#fef3c7;color:#d97706}.baja{background:#f1f5f9;color:#64748b}
      .footer{margin-top:28px;border-top:1px solid #e2e8f0;padding-top:10px;text-align:center;color:#94a3b8;font-size:10px}
    </style></head><body>
      <div class="hdr"><div class="brand">Dentra<span>Plan de Tratamiento</span></div><div style="text-align:right;font-size:11px;color:#64748b">${plan.date}</div></div>
      <div style="margin-bottom:16px"><strong>Paciente:</strong> ${patientName}</div>
      ${plan.notes?`<div style="background:#f8fafc;padding:10px;border-radius:8px;margin-bottom:16px;font-size:12px;color:#64748b">${plan.notes}</div>`:''}
      ${(plan.items||[]).map((item,i) => `
        <div class="item">
          <div class="check"></div>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <strong>${i+1}. ${item.treatment}</strong>
              <span class="badge ${item.priority?.toLowerCase()}">${item.priority}</span>
            </div>
            ${item.notes?`<div style="font-size:12px;color:#64748b">${item.notes}</div>`:''}
          </div>
        </div>`).join('')}
      <div class="footer">Generado por Dentra · Powered by Atlara · ${new Date().toLocaleDateString('es-MX')}</div>
    </body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Planes de Tratamiento</h1>
          <p className="text-sm text-slate-400 mt-0.5">{list.length} planes registrados</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary"><Plus size={16}/> Nuevo Plan</button>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por paciente..." className="input-field pl-10"/>
      </div>

      {filtered.length === 0
        ? <div className="card py-16 text-center"><ClipboardList size={36} className="text-slate-200 mx-auto mb-3"/><p className="text-sm text-slate-400">No hay planes de tratamiento</p></div>
        : <div className="space-y-4">
            {filtered.map(plan => {
              const done = (plan.items||[]).filter(i=>i.done).length;
              const total = (plan.items||[]).length;
              const pct = total > 0 ? Math.round((done/total)*100) : 0;
              return (
                <div key={plan.id} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-700">{getName(plan.patient_id)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{plan.date} · {total} procedimientos</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">{pct}% completado</span>
                      <button onClick={() => exportPDF(plan)} className="icon-btn"><Download size={14}/></button>
                      <button onClick={() => setConfirmDel(plan.id)} className="icon-btn-danger"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
                    <div className="bg-slate-700 h-1.5 rounded-full transition-all" style={{width:`${pct}%`}}/>
                  </div>
                  <div className="space-y-2">
                    {(plan.items||[]).map(item => (
                      <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${item.done?'bg-slate-50 border-slate-100 opacity-60':'bg-white border-slate-100 hover:border-slate-300'}`}
                        onClick={() => toggleItem(plan.id, item.id)}>
                        {item.done
                          ? <CheckCircle2 size={18} className="text-slate-600 flex-shrink-0"/>
                          : <Circle size={18} className="text-slate-300 flex-shrink-0"/>
                        }
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${item.done?'line-through text-slate-400':'text-slate-700'}`}>{item.treatment}</p>
                          {item.notes && <p className="text-xs text-slate-400">{item.notes}</p>}
                        </div>
                        <span className={PRIORITY_BADGE[item.priority]||'badge badge-slate'}>{item.priority}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
      }

      {modal && (
        <Modal title="Nuevo Plan de Tratamiento" onClose={() => setModal(false)} wide>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Paciente *</label>
                <Select value={form.patient_id} onChange={v=>setForm(p=>({...p,patient_id:v}))} placeholder="Seleccionar paciente..." options={pts.map(p=>({value:p.id,label:p.name}))}/>
              </div>
              <div><label className="label">Fecha</label><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} className="input-field"/></div>
            </div>
            <div><label className="label">Notas del plan</label><textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Observaciones generales del plan..." rows={2} className="input-field resize-none"/></div>

            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
              <p className="text-sm font-semibold text-slate-700 mb-3">Procedimientos</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <Select value={newItem.treatment} onChange={v=>setNewItem(p=>({...p,treatment:v}))} placeholder="Tratamiento..." options={TREATMENTS}/>
                <input value={newItem.notes} onChange={e=>setNewItem(p=>({...p,notes:e.target.value}))} placeholder="Notas..." className="input-field"/>
                <div className="flex gap-2">
                  <Select value={newItem.priority} onChange={v=>setNewItem(p=>({...p,priority:v}))} options={PRIORITIES}/>
                  <button onClick={addItem} className="btn-primary px-3 flex-shrink-0"><Plus size={15}/></button>
                </div>
              </div>
              {form.items.length === 0
                ? <p className="text-xs text-slate-400 text-center py-3">Sin procedimientos aún</p>
                : <div className="space-y-2">
                    {form.items.map((item, i) => (
                      <div key={item.id} className="flex items-center gap-2 bg-white rounded-xl p-2.5 border border-slate-100">
                        <span className="text-xs font-bold text-slate-400 w-5">{i+1}</span>
                        <p className="text-sm text-slate-700 flex-1">{item.treatment}</p>
                        {item.notes && <p className="text-xs text-slate-400">{item.notes}</p>}
                        <span className={PRIORITY_BADGE[item.priority]||'badge badge-slate'}>{item.priority}</span>
                        <button onClick={() => setForm(p=>({...p,items:p.items.filter((_,idx)=>idx!==i)}))} className="icon-btn-danger p-1"><Trash2 size={12}/></button>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={save} className="btn-primary">Guardar plan</button>
          </div>
        </Modal>
      )}

      {alert && <AlertModal message={alert} onClose={() => setAlert(null)}/>}
      {confirmDel && <ConfirmModal message="¿Eliminar este plan de tratamiento?" onConfirm={() => { plStore.remove(confirmDel); reload(); setConfirmDel(null); }} onCancel={() => setConfirmDel(null)}/>}
    </div>
  );
}