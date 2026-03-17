import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, Image, Download, X, ZoomIn } from 'lucide-react';
import { patients as pStore, xrays as xStore } from '../lib/store';
import Modal from '../components/Modal';

const TYPES = ['Panorámica','Periapical','Bite-wing','Cefalométrica','Oclusal','CBCT (3D)'];

export default function Xrays() {
  const [pts, setPts]       = useState([]);
  const [list, setList]     = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState(false);
  const [preview, setPreview] = useState(null);
  const [filterPt, setFilterPt] = useState('');
  const [form, setForm]     = useState({ patient_id:'', type:'Panorámica', date:new Date().toISOString().split('T')[0], notes:'', image:'' });
  const fileRef = useRef();

  useEffect(() => { setPts(pStore.get()); setList(xStore.get()); }, []);
  const reload = () => setList(xStore.get());
  const getName = id => pts.find(p => p.id === id)?.name || 'Desconocido';

  const filtered = list.filter(x => {
    const name = getName(x.patient_id).toLowerCase();
    const s = search.toLowerCase();
    const matchSearch = name.includes(s) || x.type?.toLowerCase().includes(s);
    const matchPt = !filterPt || x.patient_id === filterPt;
    return matchSearch && matchPt;
  });

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(p => ({ ...p, image: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!form.patient_id || !form.image) return alert('Paciente e imagen son requeridos');
    xStore.add(form);
    reload(); setModal(false);
    setForm({ patient_id:'', type:'Panorámica', date:new Date().toISOString().split('T')[0], notes:'', image:'' });
  };

  const del = id => { if (!confirm('¿Eliminar esta radiografía?')) return; xStore.remove(id); reload(); };

  const download = (x) => {
    const a = document.createElement('a');
    a.href = x.image;
    a.download = `radiografia_${getName(x.patient_id)}_${x.date}.png`;
    a.click();
  };

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Radiografías</h1>
          <p className="text-sm text-slate-400 mt-0.5">{list.length} archivos guardados</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary"><Plus size={16} /> Subir Radiografía</button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por paciente o tipo..." className="input-field pl-10" />
        </div>
        <select value={filterPt} onChange={e => setFilterPt(e.target.value)} className="input-field w-56">
          <option value="">Todos los pacientes</option>
          {pts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0
        ? <div className="card py-16 text-center"><Image size={40} className="text-slate-200 mx-auto mb-3" /><p className="text-sm text-slate-400">No hay radiografías registradas</p></div>
        : <div className="grid grid-cols-3 gap-4">
            {filtered.map(x => (
              <div key={x.id} className="card overflow-hidden group">
                <div className="relative bg-slate-900 aspect-video cursor-pointer" onClick={() => setPreview(x)}>
                  <img src={x.image} alt="Radiografía" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                    <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-slate-700 truncate">{getName(x.patient_id)}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <span className="badge badge-rose text-xs">{x.type}</span>
                      <p className="text-xs text-slate-400 mt-1">{x.date}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => download(x)} className="icon-btn"><Download size={14} /></button>
                      <button onClick={() => del(x.id)} className="icon-btn-danger"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {x.notes && <p className="text-xs text-slate-400 mt-1 truncate">{x.notes}</p>}
                </div>
              </div>
            ))}
          </div>
      }

      {/* Upload modal */}
      {modal && (
        <Modal title="Subir Radiografía" onClose={() => setModal(false)}>
          <div className="p-6 space-y-4">
            <div><label className="label">Paciente *</label>
              <select value={form.patient_id} onChange={f('patient_id')} className="input-field">
                <option value="">Seleccionar paciente...</option>
                {pts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Tipo</label>
                <select value={form.type} onChange={f('type')} className="input-field">
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="label">Fecha</label><input type="date" value={form.date} onChange={f('date')} className="input-field" /></div>
            </div>
            <div>
              <label className="label">Imagen *</label>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              {form.image
                ? <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video">
                    <img src={form.image} alt="preview" className="w-full h-full object-contain" />
                    <button onClick={() => setForm(p => ({...p, image:''}))} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70">
                      <X size={14} />
                    </button>
                  </div>
                : <button onClick={() => fileRef.current.click()} className="w-full border-2 border-dashed border-slate-200 rounded-xl py-10 text-center hover:border-teal-300 hover:bg-teal-50 transition-all">
                    <Image size={28} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Haz clic para seleccionar una imagen</p>
                    <p className="text-xs text-slate-300 mt-1">PNG, JPG, DICOM</p>
                  </button>
              }
            </div>
            <div><label className="label">Notas</label><textarea value={form.notes} onChange={f('notes')} placeholder="Observaciones sobre la radiografía..." rows={2} className="input-field resize-none" /></div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={save} className="btn-primary">Guardar radiografía</button>
          </div>
        </Modal>
      )}

      {/* Preview */}
      {preview && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6" onClick={() => setPreview(null)}>
          <button onClick={() => setPreview(null)} className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg"><X size={20} /></button>
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between text-white">
              <div>
                <p className="font-semibold">{getName(preview.patient_id)}</p>
                <p className="text-sm text-white/60">{preview.type} · {preview.date}</p>
              </div>
              <button onClick={() => download(preview)} className="btn-secondary text-white border-white/20 hover:bg-white/10"><Download size={16} /> Descargar</button>
            </div>
            <img src={preview.image} alt="Radiografía" className="w-full rounded-2xl" />
            {preview.notes && <p className="text-white/60 text-sm mt-3">{preview.notes}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
