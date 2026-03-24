import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Building2, User, Lock, ArrowRight, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';

// ─── Particle Background Component ─────────────────────────────
function Particles() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const particles = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;

    const resize = () => {
      if (!canvas) return;
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);

    const onMove = e => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener('mousemove', onMove);

    particles.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    const drawTooth = (x, y, r, opacity, rot) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      
      const w = r * 2.2;
      const h = r * 2.8;
      
      ctx.moveTo(-w/2, -h/6);
      ctx.bezierCurveTo(-w/1.8, -h/1.1, -w/6, -h, 0, -h/2);
      ctx.bezierCurveTo(w/6, -h, w/1.8, -h/1.1, w/2, -h/6);
      ctx.lineTo(w/2.2, h/4);
      ctx.bezierCurveTo(w/2, h/1.2, w/4, h/1.5, w/8, h/2);
      ctx.bezierCurveTo(0, h/1.5, 0, h/2, 0, h/2);
      ctx.bezierCurveTo(0, h/1.5, -w/4, h/1.5, -w/2.2, h/4);
      
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const mx = mouse.current.x, my = mouse.current.y;

      particles.current.forEach(p => {
        const dx = p.x - mx, dy = p.y - my, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const f = (120 - dist) / 120;
          p.vx += (dx / dist) * f * 0.4;
          p.vy += (dy / dist) * f * 0.4;
        }
        p.vx *= 0.97; p.vy *= 0.97;
        p.x += p.vx; p.y += p.vy;
        p.rot = (p.rot || 0) + (p.vx + p.vy) * 0.1;
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
        drawTooth(p.x, p.y, p.r * 2.5, p.opacity, p.rot);
      });

      particles.current.forEach((p, i) => {
        particles.current.slice(i + 1).forEach(q => {
          const dx = p.x - q.x, dy = p.y - q.y, dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(148, 163, 184, ${(1 - dist / 100) * 0.08})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// ─── Main Auth Page ─────────────────────────────────────────────
export default function Auth() {
  const [form, setForm] = useState({ clinic_name: '', full_name: '', prefix: 'Dr.', role: 'doctor', user: '', password: '' });
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [showPass, setShowPass] = useState(false);
  const [showPrefixMenu, setShowPrefixMenu] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => { setTimeout(() => setReady(true), 100); }, []);

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.user || !form.password || (mode === 'signup' && (!form.clinic_name || !form.full_name))) {
      setError('Por favor completa todos los campos');
      return;
    }
    setLoading(true); setError('');

    try {
      if (mode === 'login') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: form.user,
          password: form.password,
        });
        if (authError) throw authError;
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email: form.user,
          password: form.password,
          options: {
            data: {
              clinic_name: form.clinic_name,
              full_name: form.full_name,
              prefix: form.prefix
            }
          }
        });
        if (authError) throw authError;
        
        console.log('Usuario creado en Auth:', data.user.id);

        // 1. Verificar si la clínica ya existe por nombre
        const { data: existingClinic } = await supabase
          .from('clinics')
          .select('id')
          .ilike('name', form.clinic_name.trim())
          .maybeSingle();

        let clinicId;
        let userRole = 'admin';

        if (existingClinic) {
          // Si existe, nos unimos a ella
          clinicId = existingClinic.id;
          userRole = form.role; // Usar el rol seleccionado (doctor o reception)
        } else {
          // Si no existe, creamos la clínica (el primer usuario es admin)
          const { data: newClinic, error: clinicError } = await supabase.from('clinics').insert([{
            user_id: data.user.id,
            name: form.clinic_name,
            doctor_name: form.full_name,
            doctor_prefix: form.prefix,
            status: 'pending' // Pendiente de activación general (pago)
          }]).select().single();

          if (clinicError) throw clinicError;
          clinicId = newClinic.id;
        }

        // 2. Crear el perfil del usuario vinculado a la clínica
        const { error: profileError } = await supabase.from('profiles').insert([{
          user_id: data.user.id,
          clinic_id: clinicId,
          role: userRole,
          full_name: form.full_name,
          status: existingClinic ? 'pending' : 'active'
        }]);

        if (profileError) {
          console.error('Error al insertar en profiles:', profileError);
        }
        
        setError('¡Cuenta creada correctamente! Por favor, espera a que el administrador active tu acceso.');
        setMode('login');
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!form.user) {
      setError('Por favor ingresa tu correo electrónico en el campo superior para restablecer tu contraseña.');
      return;
    }
    setLoading(true); setError('');
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.user);
      if (resetError) throw resetError;
      setError('Instrucciones enviadas. Revisa tu bandeja de correo para cambiar tu contraseña.');
    } catch (err) {
      setError('Error al reiniciar contraseña: ' + (err.message || 'Inténtalo de nuevo más tarde'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-white overflow-hidden font-['Plus_Jakarta_Sans'] transition-all">
      
      {/* Left side: Branding & Particles */}
      <div className="relative w-full md:w-[45%] lg:w-[40%] bg-slate-950 flex flex-col justify-between p-10 lg:p-12 overflow-hidden shrink-0 shadow-2xl z-10">
        <Particles />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/10 to-slate-900/40 pointer-events-none" />
        
        <div className={`relative z-10 transition-all duration-1000 delay-300 ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <img src="/logo.png" alt="Dentra" className="h-9 w-auto brightness-0 invert opacity-90" />
        </div>

        <div className={`relative z-10 my-auto py-8 transition-all duration-1000 delay-500 ${ready ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-5">
            Dentra<br /><span className="text-slate-400 font-semibold text-[0.8em]">Tu clínica, simple.</span>
          </h1>
          <p className="text-slate-500 text-base md:text-lg max-w-sm leading-relaxed">
            La plataforma diseñada para que te enfoques en lo que más importa: la sonrisa de tus pacientes.
          </p>
          
          <div className="mt-8 lg:mt-12 space-y-3 lg:space-y-4">
            {['Historias clínicas digitales', 'Seguimiento de pacientes', 'Control de citas y finanzas'].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-400 text-sm">
                <div className="w-1 h-1 rounded-full bg-slate-500" />
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className={`relative z-10 transition-all duration-1000 delay-700 ${ready ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-slate-600 text-[10px] tracking-widest uppercase font-semibold">
            Powered by <span className="text-slate-400">Atlara</span>
          </p>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="flex-1 bg-slate-50/50 overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-12 lg:p-16">
          <div className={`w-full max-w-sm transition-all duration-700 delay-200 ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
            <div className="mb-10 text-center md:text-left">
              <div className="flex bg-slate-200/50 p-1.5 rounded-2xl mb-8 w-fit mx-auto md:mx-0">
                <button 
                  onClick={() => { setMode('login'); setError(''); }}
                  className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Iniciar Sesión
                </button>
                <button 
                  onClick={() => { setMode('signup'); setError(''); }}
                  className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Crear Cuenta
                </button>
              </div>

              <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">
                {mode === 'login' ? 'Bienvenido(a) a Dentra' : 'Crea tu cuenta'}
              </h2>
              <p className="text-slate-400 text-sm">
                {mode === 'login' ? 'Ingresa tus datos para continuar' : 'Comienza a gestionar tu consultorio hoy mismo'}
              </p>
            </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            
            {mode === 'signup' && (
              <div className="space-y-4 md:space-y-5 animate-in slide-in-from-top-4 duration-300">
                <div className="space-y-1.5">
                  <label className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Nombre de la Clínica</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      type="text"
                      value={form.clinic_name} 
                      onChange={f('clinic_name')} 
                      placeholder="ej. Clínica Dental Sonrisas"
                      className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-3 md:py-3.5 pl-11 text-slate-800 placeholder:text-slate-300 text-sm focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-50 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  {form.role !== 'reception' && (
                    <div className="w-24 space-y-1.5 shrink-0 relative animate-in fade-in slide-in-from-left-2 duration-300">
                      <label className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Prefijo</label>
                      <button 
                        type="button"
                        onClick={() => setShowPrefixMenu(!showPrefixMenu)}
                        className="w-full bg-white border border-slate-100 rounded-2xl px-4 py-3 md:py-3.5 text-left text-slate-800 text-sm focus:outline-none hover:border-slate-400 transition-all flex items-center justify-between group"
                      >
                        {form.prefix}
                        <ChevronRight size={14} className={`text-slate-300 transition-transform ${showPrefixMenu ? 'rotate-90' : ''}`} />
                      </button>
                      {showPrefixMenu && (
                        <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-xl z-20 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          {['Dr.', 'Dra.'].map(p => (
                            <button 
                              key={p}
                              type="button"
                              onClick={() => { setForm(prev => ({ ...prev, prefix: p })); setShowPrefixMenu(false); }}
                              className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5 transition-all duration-300">
                    <label className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Nombre Completo</label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="text"
                        value={form.full_name} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm(p => {
                            let newPrefix = p.prefix;
                            if (p.role !== 'reception') {
                              const firstName = val.split(' ')[0].toLowerCase();
                              if (firstName.length > 2) {
                                if (firstName.endsWith('a')) newPrefix = 'Dra.';
                                else if (firstName.endsWith('o') || firstName.endsWith('r')) newPrefix = 'Dr.';
                              }
                            }
                            return { ...p, full_name: val, prefix: newPrefix };
                          });
                        }} 
                        placeholder={form.role === 'reception' ? 'Nombre completo' : (form.prefix === 'Dr.' ? 'ej. Ayrton Senna' : 'ej. Tania Ortiz')}
                        className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-3 md:py-3.5 pl-11 text-slate-800 placeholder:text-slate-300 text-sm focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Mi Rol en la Clínica</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'doctor', label: 'Doctor(a)', icon: User },
                      { id: 'reception', label: 'Recepción', icon: Lock }
                    ].map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, role: r.id }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all font-bold text-xs ${form.role === r.id ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
                      >
                        <r.icon size={14} />
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Correo Electrónico</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="email"
                  value={form.user} 
                  onChange={f('user')} 
                  placeholder="ej. dr.garcia@gmail.com"
                  className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-3 md:py-3.5 pl-11 text-slate-800 placeholder:text-slate-300 text-sm focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-slate-400">Contraseña</label>
                {mode === 'login' && <button type="button" onClick={handleResetPassword} disabled={loading} className="text-[9px] md:text-[10px] font-bold text-slate-400 hover:text-slate-800 disabled:opacity-50">¿Olvidaste tu contraseña?</button>}
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type={showPass ? 'text' : 'password'} 
                  value={form.password} 
                  onChange={f('password')} 
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-3 md:py-3.5 pl-11 pr-11 text-slate-800 placeholder:text-slate-300 text-sm focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-50 transition-all"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(p => !p)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className={`border rounded-2xl px-4 py-2.5 animate-in slide-in-from-top-2 ${error.includes('creada') ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-500'}`}>
                <p className="text-xs font-medium">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 md:py-4 rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
            >
              {mode === 'login' ? 'Iniciar Sesión' : 'Registrarme'} <ArrowRight size={18} />
            </button>

          </form>

          <p className="text-center text-[10px] text-slate-400 mt-8 md:mt-12">
            Al {mode === 'login' ? 'ingresar' : 'registrarte'} aceptas nuestros <button type="button" onClick={() => setShowTerms(true)} className="text-slate-600 font-semibold cursor-pointer underline hover:text-slate-800">Términos</button> y <button type="button" onClick={() => setShowPrivacy(true)} className="text-slate-600 font-semibold cursor-pointer underline hover:text-slate-800">Privacidad</button>
          </p>
        </div>
        </div>
      </div>

      {showTerms && (
        <Modal title="Términos y Condiciones" onClose={() => setShowTerms(false)} wide>
          <div className="p-6 md:p-8 space-y-4 text-sm text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800">1. Aceptación de los Términos</h3>
            <p>Al acceder y utilizar Dentra, usted acepta estar sujeto a estos términos y condiciones. Si no está de acuerdo con alguna parte, no podrá utilizar nuestros servicios.</p>
            
            <h3 className="text-lg font-bold text-slate-800">2. Uso de la Plataforma</h3>
            <p>Dentra proporciona herramientas para la gestión de clínicas dentales, historiales de pacientes y cobros. El usuario es responsable de asegurar que el uso cumpla con las leyes locales de salud y manejo de datos clínicos.</p>
            
            <h3 className="text-lg font-bold text-slate-800">3. Cuentas y Seguridad</h3>
            <p>Usted es responsable de mantener la confidencialidad de sus credenciales. Todo el acceso a la plataforma o la pérdida de datos como resultado del mal cuidado de su contraseña será su responsabilidad exclusiva.</p>
            
            <h3 className="text-lg font-bold text-slate-800">4. Disponibilidad del Servicio</h3>
            <p>Nos esforzamos por garantizar el 99.9% de tiempo de actividad. Sin embargo, no nos hace responsables por la pérdida de ingresos debido a interrupciones ocasionales del sistema por mantenimiento.</p>
          </div>
          <div className="flex justify-end px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
            <button onClick={() => setShowTerms(false)} className="btn-primary">Aceptar y cerrar</button>
          </div>
        </Modal>
      )}

      {showPrivacy && (
        <Modal title="Aviso de Privacidad" onClose={() => setShowPrivacy(false)} wide>
          <div className="p-6 md:p-8 space-y-4 text-sm text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800">1. Recopilación de Datos</h3>
            <p>Dentra recopila información de identificación personal (nombres, correos electrónicos, etc.) tanto suya como la información clínica que introduce sobre sus pacientes. Usted actúa como el controlador de datos de sus pacientes, nosotros como procesadores.</p>
            
            <h3 className="text-lg font-bold text-slate-800">2. Uso de la Información</h3>
            <p>Toda la información se utiliza únicamente para el correcto funcionamiento de Dentra. No vendemos ni compartimos sus bases de datos clínicas con terceros bajo ninguna circunstancia.</p>
            
            <h3 className="text-lg font-bold text-slate-800">3. Seguridad de Datos</h3>
            <p>Nuestra infraestructura utiliza encriptación de extremo a extremo, protocolos seguros HTTPS y base de datos con políticas estrictas de seguridad (RLS) para prevenir brechas e ingresos no autorizados.</p>
            
            <h3 className="text-lg font-bold text-slate-800">4. Derechos del Usuario</h3>
            <p>Puede solicitar la exportación o eliminación total de su cuenta y base de datos de pacientes en cualquier momento contactando a nuestro equipo de soporte técnico.</p>
          </div>
          <div className="flex justify-end px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
            <button onClick={() => setShowPrivacy(false)} className="btn-primary">Entendido</button>
          </div>
        </Modal>
      )}

    </div>
  );
}
