import { AlertCircle, X } from 'lucide-react';

export default function AlertModal({ message, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <AlertCircle size={24} className="text-amber-500" />
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
              <X size={18} />
            </button>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Atención</h3>
          <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="px-6 py-4 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-900 active:scale-95 transition-all shadow-sm">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
