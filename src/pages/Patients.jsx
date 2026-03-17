import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, ChevronRight, User, Phone, Mail } from 'lucide-react';
import { patients as store } from '../lib/store';
import Modal from '../components/Modal';
import Select from '../components/Select';
import ConfirmModal from '../components/ConfirmModal';

const EMPTY = { name:'', birthdate:'', gender:'', blood_type:'desconocido', phone:'', email:'', address:'', emergency_contact:'', emergency_phone:'', allergies:'', notes:'' };

export default function Patients() {
  const [list, setList]       = useState([]);
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(false);
  const [detail, setDetail]   = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(() => { setList(store.get()); }, []);
  const reload = () => setList(store.get());

  const filtered = list.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search)
  );

  const openNew  = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = p => { setForm(p); setEditing(p.id); setModal(true); };
  const save = () => {
    if (!form.name || !form.phone) return alert('Nombre y teléfono son requeridos');
    editing ? store.update(editing, form) : store.add(form);
    reload(); setModal(false);
  };
  const confirmDelete = () => { store.remove(confirmDel); reload(); if (detail?.id === confirmDel) setDetail(null); setConfirmDel(null); };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pacientes</h1>
          <p className="text-sm text-slate-400 mt-0.5">{list.length} pacientes registrados</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={16}/> Nuevo Paciente</button>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre o teléfono..." className="input-field pl-10"/>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0
          ? <div className="py-16 text-center"><User size={36} className="text-slate-200 mx-auto mb-3"/><p className="text-sm text-slate-400">No se encontraron pacientes</p></div>
          : filtered.map(p => (
            <div key={p.id} className="flex items-center justify-between px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-indigo-500"/>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{p.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {p.phone && <span className="text-xs text-slate-400 flex items-center gap-1"><Phone size={10}/>{p.phone}</span>}
                    {p.email && <span className="text-xs text-slate-400 flex items-center gap-1"><Mail size={10}/>{p.email}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(p)} className="icon-btn"><Edit2 size={15}/></button>
                <button onClick={() => setConfirmDel(p.id)} className="icon-btn-danger"><Trash2 size={15}/></button>
                <button onClick={() => setDetail(p)} className="icon-btn"><ChevronRight size={15}/></button>
              </div>
            </div>
          ))
        }
      </div>

      {modal && (
        <Modal title={editing ? 'Editar Paciente' : 'Nuevo Paciente'} onClose={() => setModal(false)}>
          <div className="p-6 space-y-4">
            <div><label className="label">Nombre completo *</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Nombre completo" className="input-field"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Fecha de nacimiento</label><input type="date" value={form.birthdate} onChange={e=>setForm(p=>({...p,birthdate:e.target.value}))} className="input-field"/></div>
              <div><label className="label">Tipo de sangre</label>
                <Select value={form.blood_type} onChange={v=>setForm(p=>({...p,blood_type:v}))} options={['desconocido','A+','A-','B+','B-','AB+','AB-','O+','O-']}/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Género</label>
                <Select value={form.gender} onChange={v=>setForm(p=>({...p,gender:v}))} placeholder="Seleccionar..." options={['Masculino','Femenino','Otro']}/>
              </div>
              <div><label className="label">Teléfono *</label><input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+52 55 0000 0000" className="input-field"/></div>
            </div>
            <div><label className="label">Correo electrónico</label><input value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="correo@ejemplo.com" className="input-field"/></div>
            <div><label className="label">Dirección</label><input value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))} placeholder="Dirección de residencia" className="input-field"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Contacto de emergencia</label><input value={form.emergency_contact} onChange={e=>setForm(p=>({...p,emergency_contact:e.target.value}))} placeholder="Nombre" className="input-field"/></div>
              <div><label className="label">Teléfono de emergencia</label><input value={form.emergency_phone} onChange={e=>setForm(p=>({...p,emergency_phone:e.target.value}))} placeholder="Teléfono" className="input-field"/></div>
            </div>
            <div><label className="label">Alergias</label><input value={form.allergies} onChange={e=>setForm(p=>({...p,allergies:e.target.value}))} placeholder="Alergias conocidas" className="input-field"/></div>
            <div><label className="label">Notas médicas</label><textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Condiciones preexistentes, medicamentos actuales, etc." rows={3} className="input-field resize-none"/></div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={save} className="btn-primary">{editing ? 'Guardar cambios' : 'Registrar paciente'}</button>
          </div>
        </Modal>
      )}

      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <div className="p-6 space-y-2.5">
            {[['Fecha nacimiento',detail.birthdate],['Género',detail.gender],['Tipo de sangre',detail.blood_type],['Teléfono',detail.phone],['Email',detail.email],['Dirección',detail.address],['Contacto emergencia',detail.emergency_contact],['Tel. emergencia',detail.emergency_phone],['Alergias',detail.allergies],['Notas médicas',detail.notes]]
              .filter(([,v])=>v).map(([label,value])=>(
                <div key={label} className="flex gap-3 text-sm">
                  <span className="text-slate-400 min-w-[140px]">{label}</span>
                  <span className="text-slate-700 font-medium">{value}</span>
                </div>
              ))}
          </div>
        </Modal>
      )}

      {confirmDel && <ConfirmModal message="¿Eliminar este paciente? Esta acción no se puede deshacer." onConfirm={confirmDelete} onCancel={() => setConfirmDel(null)}/>}
    </div>
  );
}