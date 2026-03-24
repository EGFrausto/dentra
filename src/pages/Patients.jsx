import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, User, Phone, Mail, MessageCircle, FileText, Calendar, Image, Gift, Download, DollarSign, CheckCircle, Receipt } from 'lucide-react';
import { patients as store, appointments as aStore, records as rStore, xrays as xStore } from '../lib/store';
import Modal from '../components/Modal';
import Select from '../components/Select';
import DatePicker from '../components/DatePicker';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';

const EMPTY = { name:'', birthdate:'', gender:'', blood_type:'desconocido', phone:'', email:'', address:'', emergency_contact:'', emergency_phone:'', allergies:'', notes:'' };


function exportToCSV(patients) {
  const headers = ['Nombre','Teléfono','Email','Fecha nacimiento','Género','Tipo sangre','Dirección','Alergias','Notas'];
  const rows = patients.map(p => [
    p.name, p.phone, p.email, p.birthdate, p.gender, p.blood_type, p.address, p.allergies, p.notes
  ].map(v => `"${(v||'').replace(/"/g,'""')}"`));
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'pacientes_dentra.csv'; a.click();
  URL.revokeObjectURL(url);
}

function PatientProfile({ patient, onClose, onEdit }) {
  const [apts, setApts]     = useState([]);
  const [records, setRecords] = useState([]);
  const [xrays, setXrays]   = useState([]);

  useEffect(() => {
    aStore.get().then(res => setApts(res.filter(a => a.patient_id === patient.id).sort((a,b) => b.date.localeCompare(a.date))));
    rStore.get().then(res => setRecords(res.filter(r => r.patient_id === patient.id).sort((a,b) => b.date.localeCompare(a.date))));
    xStore.get().then(res => setXrays(res.filter(x => x.patient_id === patient.id).sort((a,b) => b.date.localeCompare(a.date))));
  }, [patient.id]);

  const STATUS_BADGE = { 'Confirmada':'badge badge-teal', 'Programada':'badge badge-indigo', 'Completada':'badge badge-slate', 'Cancelada':'badge badge-red' };

  const age = patient.birthdate ? Math.floor((new Date() - new Date(patient.birthdate)) / (365.25*24*60*60*1000)) : null;

  const sendWhatsApp = () => {
    const phone = patient.phone?.replace(/\D/g,'');
    if (phone) window.open(`https://wa.me/${phone}`, '_blank');
  };

  return (
    <Modal noHeader onClose={onClose} wide>
      <div className="bg-slate-800 px-6 pt-6 pb-8 rounded-t-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
              <User size={28} className="text-white"/>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{patient.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                {age && <span className="text-indigo-200 text-sm">{age} años</span>}
                {patient.gender && <span className="text-indigo-200 text-sm">· {patient.gender}</span>}
                {patient.blood_type && patient.blood_type !== 'desconocido' && <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-semibold">{patient.blood_type}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2 pr-8 mt-1">
            {patient.phone && (
              <button onClick={sendWhatsApp} className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-2 rounded-xl font-semibold transition-all">
                <MessageCircle size={14}/> WhatsApp
              </button>
            )}
            <button onClick={onEdit} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-2 rounded-xl font-semibold transition-all">
              <Edit2 size={14}/> Editar
            </button>
          </div>
        </div>

        {/* Quick info */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { icon: Calendar, label: 'Citas', value: apts.length },
            { icon: FileText, label: 'Historias', value: records.length },
            { icon: Image, label: 'Radiografías', value: xrays.length },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-indigo-200 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Contact info */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Información de contacto</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Teléfono', patient.phone],
              ['Email', patient.email],
              ['Dirección', patient.address],
              ['Fecha de nacimiento', patient.birthdate],
              ['Contacto emergencia', patient.emergency_contact],
              ['Tel. emergencia', patient.emergency_phone],
            ].filter(([,v])=>v).map(([label,value])=>(
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="text-sm font-medium text-slate-700">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Medical info */}
        {(patient.allergies || patient.notes) && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Información médica</p>
            <div className="space-y-2">
              {patient.allergies && <div className="bg-red-50 border border-red-100 rounded-xl p-3"><p className="text-xs text-red-400 mb-1">Alergias</p><p className="text-sm font-medium text-red-700">{patient.allergies}</p></div>}
              {patient.notes && <div className="bg-amber-50 border border-amber-100 rounded-xl p-3"><p className="text-xs text-amber-400 mb-1">Notas médicas</p><p className="text-sm font-medium text-amber-700">{patient.notes}</p></div>}
            </div>
          </div>
        )}

        {/* Recent appointments */}
        {apts.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Últimas citas</p>
            <div className="space-y-2">
              {apts.slice(0,4).map(a => (
                <div key={a.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{a.treatment || 'Sin tratamiento'}</p>
                    <p className="text-xs text-slate-400">{a.date} · {a.time}</p>
                  </div>
                  <span className={STATUS_BADGE[a.status]||'badge badge-slate'}>{a.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Billing History */}
        {apts.some(a => a.amount > 0) && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Historial de Pagos</p>
            <div className="space-y-2">
              {apts.filter(a => a.amount > 0).map(a => {
                const local = JSON.parse(localStorage.getItem('dentra_local_status') || '{}');
                const status = a.payment_status || local[a.id] || 'Pendiente';

                return (
                  <div key={a.id} className="flex items-center justify-between border border-slate-100 rounded-2xl p-4 bg-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status === 'Pagado' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        <DollarSign size={18}/>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{a.treatment || 'Tratamiento'}</p>
                        <p className="text-xs text-slate-400">{a.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-800 tracking-tight">{(a.amount || 0).toLocaleString('es-MX', {style:'currency', currency:'MXN'})}</p>
                      <div className="flex items-center gap-1 justify-end mt-1">
                        {status === 'Pagado' ? (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 uppercase tracking-wider"><CheckCircle size={10}/> Pagado</span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pendiente</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent records */}
        {records.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Últimas historias clínicas</p>
            <div className="space-y-2">
              {records.slice(0,3).map(r => (
                <div key={r.id} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-sm font-medium text-slate-700">{r.diagnosis || r.treatment || 'Sin diagnóstico'}</p>
                  <p className="text-xs text-slate-400">{r.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Xrays */}
        {xrays.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Radiografías</p>
            <div className="grid grid-cols-3 gap-2">
              {xrays.slice(0,6).map(x => (
                <div key={x.id} className="rounded-xl overflow-hidden bg-slate-900 aspect-video">
                  <img src={x.image} alt={x.type} className="w-full h-full object-contain"/>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function Patients() {
  const [patients, setPatients] = useState(() => store.getCached());
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [profile, setProfile]     = useState(null);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [alertMsg, setAlertMsg]   = useState(null);

  useEffect(() => { reload(); }, []);
  const reload = () => store.get().then(setPatients);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search)
  );

  const isBirthdayToday = p => {
    if (!p.birthdate) return false;
    const today = new Date();
    const bday  = new Date(p.birthdate);
    return bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate();
  };

  const birthdays = patients.filter(isBirthdayToday);

  const openNew  = () => { setForm(EMPTY); setEditing(null); setShowModal(true); };
  const openEdit = p => { setForm(p); setEditing(p.id); setShowModal(true); if (profile) setProfile(null); };
  
  const save = async () => {
    if (!form.name || !form.phone) return setAlertMsg('Nombre y teléfono son requeridos');
    setSaving(true);
    try {
      editing ? await store.update(editing, form) : await store.add(form);
      await reload();
      setShowModal(false);
    } catch (err) {
      setAlertMsg('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await store.remove(confirmDel);
      await reload();
      if (profile?.id === confirmDel) setProfile(null);
      setConfirmDel(null);
    } catch (err) {
      setAlertMsg('Error al eliminar: ' + err.message);
    }
  };

  return (
    <div className="p-8 pt-2">
      <div className="flex items-center justify-between mb-7">
        <p className="text-sm text-slate-400">{patients.length} pacientes registrados</p>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(patients)} className="btn-secondary"><Download size={16}/> Exportar Excel</button>
          <button onClick={openNew} className="btn-primary"><Plus size={16}/> Nuevo Paciente</button>
        </div>
      </div>

      {/* Birthday alert */}
      {birthdays.length > 0 && (
        <div className="mb-5 bg-pink-50 border border-pink-200 rounded-2xl p-4 flex items-center gap-3">
          <Gift size={20} className="text-pink-500 flex-shrink-0"/>
          <div>
            <p className="text-sm font-semibold text-pink-800">
              🎂 {birthdays.length === 1 ? `¡Hoy es el cumpleaños de ${birthdays[0].name}!` : `¡${birthdays.length} pacientes cumplen años hoy!`}
            </p>
            {birthdays.length > 1 && <p className="text-xs text-pink-600 mt-0.5">{birthdays.map(p=>p.name).join(', ')}</p>}
          </div>
        </div>
      )}

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre o teléfono..." className="input-field pl-10"/>
      </div>

      <div className="card">
        {filtered.length === 0
          ? <div className="py-16 text-center"><User size={36} className="text-slate-200 mx-auto mb-3"/><p className="text-sm text-slate-400">No se encontraron pacientes</p></div>
          : filtered.map((p, idx ) => (
            <div key={p.id} className={`flex items-center justify-between px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors group cursor-pointer ${idx===0?'rounded-t-2xl':''} ${idx===filtered.length-1?'rounded-b-2xl':''}`} onClick={() => setProfile(p)}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isBirthdayToday(p) ? 'bg-pink-100' : 'bg-indigo-100'}`}>
                  {isBirthdayToday(p) ? <Gift size={16} className="text-pink-500"/> : <User size={16} className="text-indigo-500"/>}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-700">{p.name}</p>
                    {isBirthdayToday(p) && <span className="badge badge-rose text-xs">🎂 Cumpleaños</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {p.phone && <span className="text-xs text-slate-400 flex items-center gap-1"><Phone size={10}/>{p.phone}</span>}
                    {p.email && <span className="text-xs text-slate-400 flex items-center gap-1"><Mail size={10}/>{p.email}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e=>e.stopPropagation()}>
                <button onClick={(e)=>{e.stopPropagation(); setEditing(p);}} className="icon-btn tooltip-trigger tooltip-left" data-tip="Editar"><Edit2 size={14}/></button>
                <button onClick={(e)=>{e.stopPropagation(); setConfirmDel(p.id);}} className="icon-btn-danger tooltip-trigger tooltip-left" data-tip="Eliminar"><Trash2 size={14}/></button>
              </div>
            </div>
          ))
        }
      </div>

      {profile && <PatientProfile patient={profile} onClose={() => setProfile(null)} onEdit={() => openEdit(profile)}/>}

      {showModal && (
        <Modal title={editing ? 'Editar Paciente' : 'Nuevo Paciente'} onClose={() => setShowModal(false)}>
          <div className="p-6 space-y-4">
            <div><label className="label">Nombre completo *</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Nombre completo" className="input-field"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Fecha de nacimiento</label><DatePicker value={form.birthdate} onChange={v=>setForm(p=>({...p,birthdate:v}))} /></div>
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
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : (editing ? 'Guardar cambios' : 'Registrar paciente')}
            </button>
          </div>
        </Modal>
      )}

      {confirmDel && <ConfirmModal message="¿Eliminar este paciente? Esta acción no se puede deshacer." onConfirm={confirmDelete} onCancel={() => setConfirmDel(null)}/>}
      {alertMsg && <AlertModal message={alertMsg} onClose={() => setAlertMsg(null)}/>}
    </div>
  );
}