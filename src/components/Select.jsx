import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function Select({ value, onChange, options, placeholder = 'Seleccionar...' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => (o.value ?? o) === value);
  const label = selected ? (selected.label ?? selected) : placeholder;

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between gap-2 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white hover:border-indigo-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all">
        <span className={selected ? 'text-slate-700' : 'text-slate-400'}>{label}</span>
        <ChevronDown size={15} className={`text-slate-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/80 overflow-hidden">
          <div className="max-h-56 overflow-y-auto p-1.5">
            {options.map(opt => {
              const val = opt.value ?? opt;
              const lbl = opt.label ?? opt;
              const isSelected = val === value;
              return (
                <button key={val} type="button"
                  onClick={() => { onChange(val); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                    isSelected ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}>
                  {lbl}
                  {isSelected && <Check size={14} className="text-indigo-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}