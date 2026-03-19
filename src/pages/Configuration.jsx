import { useState, useEffect } from 'react';
import { Save, Building2, User, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { profile as pStore } from '../lib/store';
import AlertModal from '../components/AlertModal';

export default function Configuration() {
  const [profile, setProfile] = useState(() => pStore.getCached() || {
    name: '', address: '', phone: '', email: '',
    specialty: '', license: '',
    show_address_in_pdfs: true, show_phone_in_pdfs: true
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    loadData();
    return pStore.subscribe(setProfile);
  }, []);

  const loadData = async () => {
    try {
      const p = await pStore.get();
      if (p) setProfile(p);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await pStore.set(profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setAlert('Error al guardar el perfil: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const pf = k => e => setProfile(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <div className="p-8 max-w-2xl mx-auto pt-2">
      <div className="mb-8 text-center">
        <p className="text-sm text-slate-400 mt-0.5">Personaliza la información de tu práctica y documentos</p>
      </div>

      <div className="space-y-6">
        {/* Perfil Profesional */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-indigo-50 rounded-xl"><User size={18} className="text-indigo-600" /></div>
            <h2 className="font-bold text-slate-700">Perfil Profesional</h2>
          </div>
          <div className="space-y-4">
            <p className="text-xs text-slate-400">Esta información se utilizará para generar tus recetas, historias clínicas y consentimientos.</p>
            <div><label className="label">Especialidad</label>
              <input value={profile.specialty || ''} onChange={pf('specialty')} placeholder="Ej: Especialista en Endodoncia" className="input-field" />
            </div>
            <div><label className="label">Cédula Profesional</label>
              <input value={profile.license || ''} onChange={pf('license')} placeholder="Número de licencia" className="input-field" />
            </div>
          </div>
        </section>

        {/* Información del Consultorio */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-teal-50 rounded-xl"><Building2 size={18} className="text-teal-600" /></div>
            <h2 className="font-bold text-slate-700">Consultorio</h2>
          </div>
          <div className="space-y-4">
            <div><label className="label">Nombre del consultorio</label>
              <input value={profile.name || ''} onChange={pf('name')} placeholder="Nombre comercial" className="input-field" />
            </div>
            <div><label className="label">Dirección</label>
              <input value={profile.address || ''} onChange={pf('address')} placeholder="Calle, Número, Ciudad" className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Teléfono</label>
                <input value={profile.phone || ''} onChange={pf('phone')} placeholder="WhatsApp / Local" className="input-field" />
              </div>
              <div><label className="label">Email de contacto</label>
                <input value={profile.email || ''} onChange={pf('email')} placeholder="clinica@ejemplo.com" className="input-field" />
              </div>
            </div>
          </div>
        </section>

        {/* Ajustes de PDF */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-slate-100 rounded-xl"><FileText size={18} className="text-slate-600" /></div>
            <h2 className="font-bold text-slate-700">Personalización de Documentos (PDF)</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">Selecciona qué información del consultorio deseas mostrar en tus documentos.</p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
              <input type="checkbox" checked={profile.show_address_in_pdfs} onChange={pf('show_address_in_pdfs')} className="w-4 h-4 rounded text-slate-800 focus:ring-slate-800" />
              <span className="text-sm text-slate-600">Mostrar dirección en el encabezado</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
              <input type="checkbox" checked={profile.show_phone_in_pdfs} onChange={pf('show_phone_in_pdfs')} className="w-4 h-4 rounded text-slate-800 focus:ring-slate-800" />
              <span className="text-sm text-slate-600">Mostrar teléfono de contacto</span>
            </label>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && <p className="text-sm text-teal-600 font-medium">¡Cambios guardados!</p>}
          <button onClick={handleSaveProfile} disabled={saving} className="btn-primary px-8">
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {alert && <AlertModal message={alert} onClose={() => setAlert(null)} />}
    </div>
  );
}
