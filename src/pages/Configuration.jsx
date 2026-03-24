import { useState, useEffect, useRef } from 'react';
import { Save, Building2, User, FileText, ImagePlus, X, ChevronDown } from 'lucide-react';
import { profile as pStore, profilesShared as profsStore } from '../lib/store';
import AlertModal from '../components/AlertModal';
import { Shield, Check, XCircle, Trash2 } from 'lucide-react';

export default function Configuration() {
  const [profile, setProfile] = useState(() => pStore.getCached() || {
    name: '', address: '', phone: '', email: '',
    specialty: '', license: '',
    show_address_in_pdfs: true, show_phone_in_pdfs: true
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [alert, setAlert] = useState(null);
  const [team, setTeam] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [openRoleMenu, setOpenRoleMenu] = useState(null);

  useEffect(() => {
    loadData();
    const unsubP = pStore.subscribe(setProfile);
    const unsubT = profsStore.subscribe(setTeam);
    return () => { unsubP(); unsubT(); };
  }, []);

  const loadData = async () => {
    try {
      const p = await pStore.get();
      if (p) {
        setProfile(p);
        if (p.role === 'admin') {
          setLoadingTeam(true);
          const t = await profsStore.get();
          setTeam(t);
          setLoadingTeam(false);
        }
      }
    } catch (err) {
      console.error(err);
      setLoadingTeam(false);
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

  const updateMember = async (id, updates) => {
    try {
      await profsStore.update(id, updates);
      setAlert({ type: 'success', title: '¡Hecho!', message: 'Usuario actualizado correctamente.' });
    } catch (err) {
      setAlert({ type: 'warning', title: 'Error', message: 'Error al actualizar: ' + err.message });
    }
  };

  const deleteMember = async (id) => {
    if (!confirm('¿Seguro que quieres eliminar a este miembro del equipo?')) return;
    try {
      await profsStore.remove(id);
      setAlert({ type: 'success', title: '¡Hecho!', message: 'Usuario eliminado del equipo.' });
    } catch (err) {
      setAlert({ type: 'warning', title: 'Error', message: 'Error al eliminar: ' + err.message });
    }
  };

  const logoInputRef = useRef(null);

  const pf = k => e => setProfile(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024 * 2) { setAlert('La imagen no puede superar 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setProfile(p => ({ ...p, logo_base64: ev.target.result }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto pt-2">
      <div className="mb-8 text-center">
        <p className="text-sm text-slate-400 mt-0.5">Personaliza la información de tu clínica y documentos</p>
      </div>

      <div className="space-y-6">
        {/* Logo del Consultorio */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-slate-100 rounded-xl"><ImagePlus size={18} className="text-slate-600" /></div>
            <div>
              <h2 className="font-bold text-slate-700">Logo del Consultorio</h2>
              <p className="text-xs text-slate-400 mt-0.5">Aparecerá en todos los documentos PDF generados</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Preview */}
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 flex-shrink-0 overflow-hidden">
              {profile.logo_base64
                ? <img src={profile.logo_base64} alt="Logo" className="w-full h-full object-contain p-2" />
                : <div className="text-center"><ImagePlus size={24} className="text-slate-300 mx-auto mb-1"/><p className="text-[10px] text-slate-400">Sin logo</p></div>
              }
            </div>
            <div className="flex-1">
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <button onClick={() => logoInputRef.current?.click()} className="btn-primary mb-2 w-full justify-center">
                <ImagePlus size={15} /> {profile.logo_base64 ? 'Cambiar logo' : 'Subir logo'}
              </button>
              {profile.logo_base64 && (
                <button onClick={() => setProfile(p => ({ ...p, logo_base64: null }))} className="btn-secondary w-full justify-center text-red-400 hover:text-red-600 hover:bg-red-50">
                  <X size={14} /> Eliminar logo
                </button>
              )}
              <p className="text-xs text-slate-400 mt-2">PNG, JPG o SVG · Máx. 2MB · Fondo transparente recomendado</p>
            </div>
          </div>
        </section>

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
            <label className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-300 cursor-pointer transition-all bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
              <div>
                <span className="text-sm font-bold text-slate-700 block">Dirección en encabezado</span>
                <span className="text-xs text-slate-400 mt-0.5 block">Imprime tu dirección en los PDFs generados.</span>
              </div>
              <div className="relative inline-flex items-center ml-4 shrink-0">
                <input type="checkbox" checked={profile.show_address_in_pdfs} onChange={pf('show_address_in_pdfs')} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-800"></div>
              </div>
            </label>
            <label className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-300 cursor-pointer transition-all bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
              <div>
                <span className="text-sm font-bold text-slate-700 block">Teléfono de contacto</span>
                <span className="text-xs text-slate-400 mt-0.5 block">Muestra tu número principal a los pacientes en los PDFs.</span>
              </div>
              <div className="relative inline-flex items-center ml-4 shrink-0">
                <input type="checkbox" checked={profile.show_phone_in_pdfs} onChange={pf('show_phone_in_pdfs')} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-800"></div>
              </div>
            </label>
          </div>
        </section>

        {/* Gestión de Equipo (Premium Dark Style) */}
        {profile.role === 'admin' && (
          <section className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-900/40 border border-white/5 relative">
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -z-10 rounded-full" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-800/20 blur-[100px] -z-10 rounded-full" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl backdrop-blur-sm">
                  <Shield size={26} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black tracking-[0.2em] text-indigo-400 uppercase mb-1">Gestión de Equipo</h3>
                  <p className="text-white font-bold text-xl tracking-tight">Controla el acceso en tiempo real.</p>
                  <p className="text-indigo-200/50 text-xs mt-1">Gestiona los roles y permisos de tu clínica.</p>
                </div>
              </div>
            </div>
            
            {loadingTeam ? (
              <div className="py-12 text-center text-indigo-300/40 text-sm animate-pulse tracking-wide font-medium">Sincronizando miembros...</div>
            ) : (
              <div className="space-y-4">
                {team.filter(m => m.user_id !== profile.user_id).length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-white/10 rounded-3xl text-center">
                    <p className="text-sm text-indigo-100/40 italic leading-relaxed">
                      No hay otros miembros aún.<br/>
                      Para invitar a tu equipo, pídeles que al crear su cuenta escriban exactamente el nombre de tu clínica: <span className="font-bold text-indigo-300 ml-1">"{profile.name}"</span>
                    </p>
                  </div>
                ) : (
                  team.filter(m => m.user_id !== profile.user_id).map(m => (
                    <div key={m.id} className="flex items-center justify-between p-5 bg-white/5 hover:bg-white/[0.08] border border-white/5 rounded-3xl transition-all group backdrop-blur-md">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-2xl transition-transform group-hover:scale-110 ${
                          m.status === 'active' ? 'bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {m.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <span className="text-base font-bold text-white block tracking-tight">{m.full_name}</span>
                          <div className="flex items-center gap-2.5 mt-1.5 font-medium">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest border ${
                              m.role === 'admin' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-white/5 text-slate-400 border-white/10'
                            }`}>
                              {m.role === 'doctor' ? 'doctor' : m.role === 'reception' ? 'recepción' : 'admin'}
                            </span>
                            {m.status !== 'active' ? (
                              <span className="text-[10px] text-amber-400 flex items-center gap-1.5 italic animate-pulse">
                                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                                Esperando aprobación
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-400 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                Activo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {m.status !== 'active' ? (
                          <button 
                            onClick={() => updateMember(m.id, { status: 'active' })} 
                            className="bg-white text-slate-900 hover:bg-indigo-400 hover:text-white text-[11px] font-black px-6 py-2.5 rounded-2xl transition-all shadow-xl shadow-white/5 active:scale-95"
                          >
                            APROBAR
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <button
                                onClick={() => setOpenRoleMenu(openRoleMenu === m.id ? null : m.id)}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-bold text-slate-200 rounded-xl px-3 py-2 transition-colors outline-none"
                              >
                                {m.role === 'doctor' ? 'Doctor' : m.role === 'reception' ? 'Recepción' : 'Admin'}
                                <ChevronDown size={14} className={`text-slate-400 transition-transform ${openRoleMenu === m.id ? 'rotate-180' : ''}`} />
                              </button>
                              {openRoleMenu === m.id && (
                                <div className="absolute right-0 top-full mt-2 w-36 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                                  {[{v:'doctor',l:'Doctor'},{v:'reception',l:'Recepción'},{v:'admin',l:'Admin'}].map(opt => (
                                    <button
                                      key={opt.v}
                                      onClick={() => { updateMember(m.id, { role: opt.v }); setOpenRoleMenu(null); }}
                                      className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${
                                        m.role === opt.v ? 'text-white bg-white/10' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                      }`}
                                    >
                                      {opt.l}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="w-px h-6 bg-white/10 mx-1" />
                            <button 
                              onClick={() => updateMember(m.id, { status: 'pending' })} 
                              className="tooltip-trigger p-2 rounded-xl text-slate-500 hover:bg-amber-500/10 hover:text-amber-400 transition-all"
                              data-tip="Suspender"
                            >
                              <XCircle size={18}/>
                            </button>
                            <button 
                              onClick={() => deleteMember(m.id)} 
                              className="tooltip-trigger p-2 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
                              data-tip="Eliminar"
                            >
                              <Trash2 size={18}/>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        )}

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
