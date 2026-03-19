import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, Image, Download, X, ZoomIn } from 'lucide-react';
import { patients as pStore, xrays as xStore } from '../lib/store';
import Modal from '../components/Modal';
import Select from '../components/Select';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';

const TYPES = ['Panorámica','Periapical','Bite-wing','Cefalométrica','Oclusal','CBCT (3D)'];

export default function Xrays() {
  const [pts,setPts]         = useState(() => pStore.getCached());
  const [list,setList]       = useState(() => xStore.getCached());
  const [search,setSearch]   = useState('');
  const [modal,setModal]     = useState(false);
  const [preview,setPreview] = useState(null);
  const [filterPt,setFilterPt] = useState('');
  const [confirmDel,setConfirmDel] = useState(null);
  const [alert, setAlert] = useState(null);
  const [form,setForm]       = useState({patient_id:'',type:'Panorámica',date:new Date().toISOString().split('T')[0],notes:'',image:''});
  const [saving, setSaving]   = useState(false);
  const fileRef = useRef();

  useEffect(()=>{
    pStore.get().then(setPts);
    xStore.get().then(setList);

    const unsubs = [
      pStore.subscribe(setPts),
      xStore.subscribe(setList)
    ];
    return () => unsubs.forEach(fn => fn());
  },[]);

  const reload=()=>xStore.get().then(setList);
  const getName=id=>pts.find(p=>p.id===id)?.name||'Desconocido';

  const filtered=list.filter(x=>{
    const name=getName(x.patient_id).toLowerCase(),s=search.toLowerCase();
    return (name.includes(s)||x.type?.toLowerCase().includes(s))&&(!filterPt||x.patient_id===filterPt);
  });

  const handleFile=e=>{
    const file=e.target.files[0];
    if(!file)return;
    const r=new FileReader();
    r.onload=ev=>setForm(p=>({...p,image:ev.target.result}));
    r.readAsDataURL(file);
  };

  const save=async ()=>{
    if(!form.patient_id||!form.image){ setAlert('Paciente e imagen son requeridos'); return; }
    setSaving(true);
    try {
      await xStore.add(form);
      await reload();
      setModal(false);
      setForm({patient_id:'',type:'Panorámica',date:new Date().toISOString().split('T')[0],notes:'',image:''});
    } catch (err) {
      setAlert('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete=async ()=>{
    try {
      await xStore.remove(confirmDel);
      await reload();
      setConfirmDel(null);
    } catch (err) {
      setAlert('Error al eliminar: ' + err.message);
    }
  };

  const download=x=>{
    const a=document.createElement('a');
    a.href=x.image;
    a.download=`radiografia_${getName(x.patient_id)}_${x.date}.png`;
    a.click();
  };

  const sf=(k,v)=>setForm(p=>({...p,[k]:v}));

  return (
    <div className="p-8 pt-2">
      <div className="flex items-center justify-between mb-7">
        <p className="text-sm text-slate-400 mt-0.5">{list.length} archivos guardados</p>
        <button onClick={()=>setModal(true)} className="btn-primary"><Plus size={16}/> Subir Radiografía</button>
      </div>
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por paciente o tipo..." className="input-field pl-10"/></div>
        <div className="w-56"><Select value={filterPt} onChange={v=>setFilterPt(v)} placeholder="Todos los pacientes" options={[{value:'',label:'Todos los pacientes'},...pts.map(p=>({value:p.id,label:p.name}))]}/></div>
      </div>

      {filtered.length===0
        ?<div className="card py-16 text-center"><Image size={40} className="text-slate-200 mx-auto mb-3"/><p className="text-sm text-slate-400">No hay radiografías registradas</p></div>
        :<div className="grid grid-cols-3 gap-4">
          {filtered.map(x=>(
            <div key={x.id} className="card overflow-hidden group">
              <div className="relative bg-slate-900 aspect-video cursor-pointer" onClick={()=>setPreview(x)}>
                <img src={x.image} alt="Radiografía" className="w-full h-full object-contain"/>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center"><ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity"/></div>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-slate-700 truncate">{getName(x.patient_id)}</p>
                <div className="flex items-center justify-between mt-1">
                  <div><span className="badge badge-rose">{x.type}</span><p className="text-xs text-slate-400 mt-1">{x.date}</p></div>
                  <div className="flex gap-1">
                    <button onClick={(e)=>{e.stopPropagation(); download(x);}} className="icon-btn"><Download size={14}/></button>
                    <button onClick={(e)=>{e.stopPropagation(); setConfirmDel(x.id);}} className="icon-btn-danger"><Trash2 size={14}/></button>
                  </div>
                </div>
                {x.notes&&<p className="text-xs text-slate-400 mt-1 truncate">{x.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      }

      {modal&&(
        <Modal title="Subir Radiografía" onClose={()=>setModal(false)}>
          <div className="p-6 space-y-4">
            <div><label className="label">Paciente *</label><Select value={form.patient_id} onChange={v=>sf('patient_id',v)} placeholder="Seleccionar paciente..." options={pts.map(p=>({value:p.id,label:p.name}))}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Tipo</label><Select value={form.type} onChange={v=>sf('type',v)} options={TYPES}/></div>
              <div><label className="label">Fecha</label><input type="date" value={form.date} onChange={e=>sf('date',e.target.value)} className="input-field"/></div>
            </div>
            <div>
              <label className="label">Imagen *</label>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden"/>
              {form.image
                ?<div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video"><img src={form.image} alt="preview" className="w-full h-full object-contain"/><button onClick={()=>setForm(p=>({...p,image:''}))} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"><X size={14}/></button></div>
                :<button onClick={()=>fileRef.current.click()} className="w-full border-2 border-dashed border-slate-200 rounded-xl py-10 text-center hover:border-indigo-300 hover:bg-indigo-50 transition-all"><Image size={28} className="text-slate-300 mx-auto mb-2"/><p className="text-sm text-slate-400">Haz clic para seleccionar una imagen</p><p className="text-xs text-slate-300 mt-1">PNG, JPG, DICOM</p></button>
              }
            </div>
            <div><label className="label">Notas</label><textarea value={form.notes} onChange={e=>sf('notes',e.target.value)} placeholder="Observaciones sobre la radiografía..." rows={2} className="input-field resize-none"/></div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button onClick={()=>setModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : 'Guardar radiografía'}
            </button>
          </div>
        </Modal>
      )}

      {preview&&(
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6" onClick={()=>setPreview(null)}>
          <button onClick={()=>setPreview(null)} className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg"><X size={20}/></button>
          <div className="max-w-4xl w-full" onClick={e=>e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between text-white">
              <div><p className="font-semibold">{getName(preview.patient_id)}</p><p className="text-sm text-white/60">{preview.type} · {preview.date}</p></div>
              <button onClick={()=>download(preview)} className="btn-secondary text-white border-white/20 hover:bg-white/10"><Download size={16}/> Descargar</button>
            </div>
            <img src={preview.image} alt="Radiografía" className="w-full rounded-2xl"/>
            {preview.notes&&<p className="text-white/60 text-sm mt-3">{preview.notes}</p>}
          </div>
        </div>
      )}

      {alert && <AlertModal message={alert} onClose={() => setAlert(null)}/>}
      {confirmDel&&<ConfirmModal message="¿Eliminar esta radiografía? Esta acción no se puede deshacer." onConfirm={confirmDelete} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
}