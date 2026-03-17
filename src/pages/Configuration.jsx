import { useState, useEffect } from 'react';
import { Save, Building2, User, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { config as store } from '../lib/store';

export default function Configuration() {
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(store.get()); }, []);

  const save = () => {
    store.set(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
        <p className="text-sm text-slate-400 mt-0.5">Información general del consultorio</p>
      </div>

      <div className="space-y-5">
        {/* Clinic info */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-teal-50 rounded-lg"><Building2 size={18} className="text-teal-600" /></div>
            <h2 className="font-semibold text-slate-700">Información del Consultorio</h2>
          </div>
          <div className="space-y-4">
            <div><label className="label">Nombre del consultorio</label>
              <input value={form.clinic_name || ''} onChange={f('clinic_name')} placeholder="Dentra" className="input-field" />
            </div>
            <div><label className="label flex items-center gap-1.5"><MapPin size={12} /> Dirección</label>
              <input value={form.address || ''} onChange={f('address')} placeholder="Calle 123 #45-67, Ciudad" className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label flex items-center gap-1.5"><Phone size={12} /> Teléfono</label>
                <input value={form.phone || ''} onChange={f('phone')} placeholder="+57 300 000 0000" className="input-field" />
              </div>
              <div><label className="label flex items-center gap-1.5"><Mail size={12} /> Email</label>
                <input value={form.email || ''} onChange={f('email')} placeholder="contacto@consultorio.com" className="input-field" />
              </div>
            </div>
            <div><label className="label flex items-center gap-1.5"><Clock size={12} /> Horario de atención</label>
              <input value={form.schedule || ''} onChange={f('schedule')} placeholder="Lunes a Viernes 8:00am - 6:00pm" className="input-field" />
            </div>
          </div>
        </div>

        {/* Doctor info */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-indigo-50 rounded-lg"><User size={18} className="text-indigo-600" /></div>
            <h2 className="font-semibold text-slate-700">Información del Doctor</h2>
          </div>
          <div className="space-y-4">
            <div><label className="label">Nombre del doctor</label>
              <input value={form.doctor || ''} onChange={f('doctor')} placeholder="Dr. Nombre Apellido" className="input-field" />
            </div>
            <div><label className="label">Especialidad</label>
              <input value={form.specialty || ''} onChange={f('specialty')} placeholder="Odontología General" className="input-field" />
            </div>
            <div><label className="label">Número de registro</label>
              <input value={form.license || ''} onChange={f('license')} placeholder="Número de licencia profesional" className="input-field" />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center justify-end gap-3">
          {saved && <p className="text-sm text-teal-600 font-medium">¡Guardado correctamente!</p>}
          <button onClick={save} className="btn-primary">
            <Save size={16} /> Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
