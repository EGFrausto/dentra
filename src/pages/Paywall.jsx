import { Lock, MessageCircle, LogOut, CreditCard, Store, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Paywall({ user }) {
  const onLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleWhatsApp = () => {
    // Te dejamos este número como marcador; la idea es que tú lo cambies.
    const phone = '524271615400'; 
    const msg = encodeURIComponent(`Hola equipo de Dentra, acabo de realizar mi registro con el correo: ${user?.email} y me gustaría realizar el pago para activar mi cuenta.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 selection:bg-indigo-100">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 overflow-hidden text-center relative">
        <div className="bg-slate-900 px-8 py-10 text-white relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob"></div>

          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5 backdrop-blur-md border border-white/10 relative z-10 shadow-lg shadow-black/20">
            <Lock size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2 relative z-10">Activa tu cuenta</h1>
          <p className="text-slate-300 text-sm relative z-10">Tu cuenta requiere activación manual para acceder al panel de control de Dentra.</p>
        </div>
        
        <div className="p-8 pb-10">
          <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-5 mb-8 text-left shadow-sm">
             <h3 className="font-bold text-indigo-900 mb-1.5 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
               Completa tu registro
             </h3>
             <p className="text-sm text-slate-600 mb-4 leading-relaxed">Para continuar usando el sistema y gestionar tu consultorio sin límites, realiza tu pago y envía tu comprobante.</p>
             <ul className="text-sm text-indigo-800 font-medium space-y-2.5">
               <li className="flex items-center gap-2.5 bg-white px-3 py-2 rounded-lg border border-indigo-100/50"><CreditCard size={18} className="text-indigo-400"/> Transferencia interbancaria</li>
               <li className="flex items-center gap-2.5 bg-white px-3 py-2 rounded-lg border border-indigo-100/50"><Store size={18} className="text-indigo-400"/> Depósito en OXXO</li>
               <li className="flex items-center gap-2.5 bg-white px-3 py-2 rounded-lg border border-indigo-100/50"><Smartphone size={18} className="text-indigo-400"/> Verificación por WhatsApp</li>
             </ul>
          </div>

          <button onClick={handleWhatsApp} className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-white font-bold py-3.5 px-6 rounded-xl transition-all mb-5 shadow-lg shadow-[#25D366]/30">
            <MessageCircle size={20} /> Enviar comprobante
          </button>
          
          <button onClick={onLogout} className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-2 mx-auto uppercase tracking-wide">
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </div>
      <div className="mt-8 text-center text-slate-400">
        <p className="text-xs font-medium uppercase tracking-wider mb-1">Dentra Software de Gestión Dental</p>
        <p className="text-[10px] opacity-70">© {new Date().getFullYear()} Atlara. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}
