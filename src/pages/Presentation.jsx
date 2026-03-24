import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  ClipboardList, 
  TrendingUp, 
  ShieldCheck, 
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { useState } from 'react';

const Slide = ({ children, className = "" }) => (
  <section className={`min-h-screen flex flex-col items-center justify-center snap-start relative overflow-hidden px-6 py-20 ${className}`}>
    {children}
  </section>
);

const FeatureCard = ({ icon: Icon, title, description, image, index }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1, duration: 0.8 }}
    className="group relative bg-white/40 backdrop-blur-xl border border-white/20 rounded-[32px] p-8 hover:bg-white/60 transition-all duration-500 shadow-2xl overflow-hidden"
  >
    <div className="flex items-center gap-4 mb-6">
      <div className="p-3 bg-slate-900 rounded-2xl text-white">
        <Icon size={24} />
      </div>
      <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
    </div>
    <p className="text-slate-600 text-lg leading-relaxed mb-8">
      {description}
    </p>
    <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-100 group-hover:scale-[1.02] transition-transform duration-700">
      <img src={image} alt={title} className="w-full h-auto" />
    </div>
  </motion.div>
);

export default function Presentation() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="bg-[#f5f5f7] selection:bg-slate-900 selection:text-white overflow-x-hidden">
      {/* Scroll Indicator */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-slate-900 origin-left z-50"
        style={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
      />

      {/* Hero Section */}
      <Slide className="bg-slate-950 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-700" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center max-w-4xl"
        >
          <img src="/logo.png" alt="Dentra" className="h-16 w-auto mx-auto mb-12 brightness-0 invert opacity-90" />
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[1.1] mb-8">
            Gestión dental<br />
            <span className="bg-gradient-to-r from-slate-400 via-white to-slate-400 bg-clip-text text-transparent italic">
              elevada al arte.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Dentra no es solo un software; es el cerebro digital que tu consultorio merece. Elegante, rápido y absurdamente simple.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <button className="px-10 py-5 bg-white text-slate-950 rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2">
              Comenzar ahora <ArrowRight size={20} />
            </button>
            <p className="text-slate-500 text-sm tracking-widest uppercase">Explora el futuro ↓</p>
          </div>
        </motion.div>
      </Slide>

      {/* Module: Dashboard */}
      <Slide>
        <div className="max-w-6xl w-full">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <span className="text-slate-500 font-bold tracking-widest uppercase text-sm">Control Total</span>
              <h2 className="text-5xl font-bold text-slate-900 leading-tight">
                Todo bajo control,<br />de un solo vistazo.
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                El dashboard inteligente centraliza tus citas, ingresos y pacientes. Toma decisiones basadas en datos reales, no en suposiciones.
              </p>
              <ul className="space-y-4">
                {[
                  'Métricas en tiempo real',
                  'Próximas citas automatizadas',
                  'Alertas de inventario y pagos'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-medium lowercase italic first-letter:uppercase">
                    <ShieldCheck className="text-slate-900" size={18} /> {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-slate-900/5 rounded-[40px] blur-2xl" />
              <img src="/screenshots/dashboard.png" className="relative rounded-[32px] shadow-3xl border border-white/50 w-full hover:scale-[1.02] transition-transform duration-700" alt="Dashboard" />
            </motion.div>
          </div>
        </div>
      </Slide>

      {/* Grid of Features */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-bold text-slate-900 mb-6">Módulos diseñados para la excelencia.</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Cada píxel ha sido pensado para ahorrarte tiempo y mejorar la experiencia de tus pacientes.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              index={0}
              icon={Calendar} 
              title="Agendamiento" 
              description="Agenda inteligente con recordatorios automáticos. Visualiza tu semana con claridad absoluta."
              image="/screenshots/appointments.png"
            />
            <FeatureCard 
              index={1}
              icon={ClipboardList} 
              title="Historias Clínicas" 
              description="Expedientes completos, digitalizados y seguros. Con firma digital integrada."
              image="/screenshots/records.png"
            />
            <FeatureCard 
              index={2}
              icon={TrendingUp} 
              title="Finanzas" 
              description="Controla tus flujos de caja, pagos pendientes y presupuestos sin complicaciones."
              image="/screenshots/finance.png"
            />
          </div>
        </div>
      </section>

      {/* Security & Cloud */}
      <Slide className="bg-slate-50">
        <div className="max-w-4xl text-center">
          <div className="inline-block p-4 bg-slate-900 rounded-3xl text-white mb-10">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-5xl font-bold text-slate-900 mb-8 italic">Tu información, blindada.</h2>
          <p className="text-2xl text-slate-500 leading-relaxed mb-12">
            Utilizamos tecnología de grado militar (vía Supabase) para asegurar que tus datos y los de tus pacientes estén siempre protegidos y disponibles 24/7 en cualquier dispositivo.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60">
            <div className="text-center"><p className="font-bold text-slate-900">SSL</p><p className="text-xs uppercase tracking-widest mt-1">Encriptación</p></div>
            <div className="text-center"><p className="font-bold text-slate-900">Cloud</p><p className="text-xs uppercase tracking-widest mt-1">Respaldo</p></div>
            <div className="text-center"><p className="font-bold text-slate-900">Real-time</p><p className="text-xs uppercase tracking-widest mt-1">Sincronización</p></div>
            <div className="text-center"><p className="font-bold text-slate-900">2FA</p><p className="text-xs uppercase tracking-widest mt-1">Seguridad</p></div>
          </div>
        </div>
      </Slide>

      {/* Final CTA */}
      <Slide className="bg-slate-900 text-white">
        <div className="relative z-10 text-center">
          <h2 className="text-6xl md:text-8xl font-bold mb-12 tracking-tighter">¿Listo para el cambio?</h2>
          <p className="text-2xl text-slate-400 mb-16 max-w-2xl mx-auto font-light">
            Únete a los odontólogos que ya están transformando su práctica con Dentra.
          </p>
          <button className="px-16 py-8 bg-white text-slate-950 rounded-full font-black text-2xl hover:scale-110 active:scale-95 transition-all shadow-white/10 shadow-2xl">
            ¡ADQUIRIR DENTRA AHORA!
          </button>
          <p className="mt-12 text-slate-600 uppercase tracking-[0.3em] text-sm">Powered by Atlara</p>
        </div>
      </Slide>

      {/* Minimal Footer */}
      <footer className="py-10 bg-slate-900 border-t border-slate-800 text-center text-slate-700 text-xs">
        &copy; 2026 Dentra Software. Todos los derechos reservados.
      </footer>
    </div>
  );
}
