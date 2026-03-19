import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TimePicker({ value, onChange, label = 'Seleccionar hora', align = 'left' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Parse current value (HH:mm)
  const [hStr, mStr] = (value || '09:00').split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const updateTime = (newH, newM, newAmpm) => {
    let finalH = newH % 12;
    if (newAmpm === 'PM') finalH += 12;
    const timeString = `${String(finalH).padStart(2, '0')}:${newM}`;
    onChange(timeString);
  };

  const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutes = ['00', '15', '30', '45'];

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white hover:border-slate-300 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all text-left"
      >
        <Clock size={16} className="text-slate-400 shrink-0" />
        <span className={value ? 'text-slate-700 font-medium' : 'text-slate-400'}>
          {value ? `${displayH}:${m} ${ampm}` : label}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-[100] mt-2 w-[220px] ${align === 'right' ? 'right-0' : 'left-0'} bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200/60 p-3`}
          >
            <div className="grid grid-cols-3 gap-2">
              {/* Hours section */}
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1 text-center">Hora</p>
                <div className="max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {hours.map(hr => (
                    <button
                      key={hr}
                      type="button"
                      onClick={() => updateTime(hr, m, ampm)}
                      className={`w-full text-center py-2 rounded-lg text-sm transition-all ${displayH === hr ? 'bg-slate-800 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {String(hr).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes section */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Min</p>
                {minutes.map(min => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => updateTime(displayH, min, ampm)}
                    className={`w-full text-center py-2 rounded-lg text-sm transition-all ${m === min ? 'bg-slate-800 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {min}
                  </button>
                ))}
              </div>

              {/* AM/PM section */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Periodo</p>
                {['AM', 'PM'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateTime(displayH, m, p)}
                    className={`w-full text-center py-2 rounded-lg text-sm transition-all ${ampm === p ? 'bg-slate-800 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {p}
                  </button>
                ))}
                <div className="pt-4 h-full">
                  <button 
                    type="button"
                    onClick={() => setOpen(false)}
                    className="w-full bg-slate-100 text-slate-600 text-[10px] font-bold py-2 rounded-lg hover:bg-slate-200 transition-colors uppercase tracking-wider"
                  >
                    Listo
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
