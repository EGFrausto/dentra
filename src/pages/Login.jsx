import { useState } from 'react';
import { Stethoscope, Eye, EyeOff, Building2, User, Lock } from 'lucide-react';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ clinic_code: '', user: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clinic_code || !form.user || !form.password) {
      setError('Por favor completa todos los campos');
      return;
    }
    setLoading(true);
    setError('');
    // Simulate async auth
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    onLogin({ clinic: form.clinic_code.toUpperCase(), user: form.user });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl shadow-xl shadow-indigo-900/50 mb-4">
              <Stethoscope size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Dentra</h1>
            <p className="text-indigo-300 text-sm mt-1">Sistema de Gestión Dental</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Clinic code */}
            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-1.5 uppercase tracking-wide">Código de Consultorio</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input
                  value={form.clinic_code}
                  onChange={f('clinic_code')}
                  placeholder="ej. CLINIC-001"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-10 text-white placeholder:text-indigo-400 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 transition-all"
                />
              </div>
            </div>

            {/* User */}
            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-1.5 uppercase tracking-wide">Usuario</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input
                  value={form.user}
                  onChange={f('user')}
                  placeholder="nombre.usuario"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-10 text-white placeholder:text-indigo-400 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-1.5 uppercase tracking-wide">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={f('password')}
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-10 pr-10 text-white placeholder:text-indigo-400 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 transition-all"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-200 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/50 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-2">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Ingresando...</span>
                : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-xs text-indigo-400 mt-4">
            ¿Problemas para ingresar? Contacta a tu administrador
          </p>
        </div>

        {/* Atlara footer */}
        <p className="text-center text-xs text-indigo-500 mt-6">
          Powered by <span className="font-bold text-indigo-400">Atlara</span>
        </p>
      </div>
    </div>
  );
}
