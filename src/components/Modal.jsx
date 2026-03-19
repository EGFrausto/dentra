import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, wide = false, noHeader = false }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[92vh] overflow-y-auto shadow-xl relative`}>
        {!noHeader ? (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
            <h2 className="font-bold text-slate-800 text-base">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={18} />
            </button>
          </div>
        ) : (
          <button onClick={onClose} className="absolute top-4 right-4 z-50 p-1.5 rounded-full hover:bg-white/20 bg-black/10 text-white backdrop-blur-md transition-all shadow-sm">
            <X size={18} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
