import { motion } from 'framer-motion';
import { LogOut, Clock, MessageCircle, ShieldCheck } from 'lucide-react';

const PendingActivation = ({ onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white">
      
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 md:p-12 relative z-10 border border-slate-100/50"
      >
        <div className="flex flex-col items-center text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-slate-900/20"
          >
            <Clock size={36} className="text-white" />
          </motion.div>

          <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Acceso en Proceso
          </h1>
          
          <p className="text-slate-500 leading-relaxed mb-10">
            {localStorage.getItem('dentra_role') === 'admin' 
              ? 'Tu clínica está en proceso de activación. El equipo de Dentra validará tu registro a la brevedad.' 
              : 'Tu perfil está pendiente de aprobación. Recibirás acceso completo una vez que sea activado.'}
          </p>

          <div className="w-full space-y-4 mb-10">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200/50">
                <ShieldCheck size={20} className="text-slate-600" />
              </div>
              <div className="text-left flex-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Estado</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-700">Validando suscripción</p>
                  <div className="flex gap-0.5">
                    <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 text-center font-medium italic">Esta página se actualizará automáticamente una vez activada.</p>
          </div>

          <div className="grid grid-cols-1 w-full gap-3">
            <a 
              href="https://wa.me/524271615400?text=Hola,%20acabo%20de%20registrarme%20en%20Dentra%20y%20me%20gustaria%20activar%20mi%20cuenta." 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-slate-900 text-white py-4 px-6 rounded-2xl font-bold hover:bg-slate-800 transition-all hover:shadow-lg hover:shadow-slate-900/20 group"
            >
              <MessageCircle size={20} />
              Contactar Soporte
            </a>
            
            <button 
              onClick={onLogout}
              className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 py-3 font-semibold transition-colors"
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </motion.div>

      <p className="mt-8 text-slate-400 text-sm font-medium">
        Powered by <span className="text-slate-900">Atlara</span>
      </p>
    </div>
  );
};

export default PendingActivation;
