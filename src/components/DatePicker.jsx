import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

const MonthYearDropdown = ({ value, options, onChange, align = 'left' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button 
        type="button" 
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[13px] font-bold text-slate-700 hover:bg-slate-100 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors shadow-sm"
      >
        <span>{options.find(o => o.value === value)?.label}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute z-[120] top-full mt-1 ${align === 'right' ? 'right-0' : 'left-0'} min-w-[110px] bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-200/60 overflow-hidden`}>
          <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  opt.value === value ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function DatePicker({ value, onChange, label = 'Seleccionar fecha', align = 'left' }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value + 'T12:00:00') : new Date());
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const yr = viewDate.getFullYear();
  const mo = viewDate.getMonth();
  const firstDay = new Date(yr, mo, 1).getDay();
  const daysInMo = new Date(yr, mo + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMo; d++) cells.push(d);

  const handleSelect = (d) => {
    const selected = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    onChange(selected);
    setOpen(false);
  };

  const formattedValue = value 
    ? new Date(value + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
    : label;

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white hover:border-slate-300 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all text-left"
      >
        <CalendarIcon size={16} className="text-slate-400 shrink-0" />
        <span className={value ? 'text-slate-700 font-medium' : 'text-slate-400'}>{formattedValue}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-[100] mt-2 w-[260px] ${align === 'right' ? 'right-0' : 'left-0'} bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200/60 p-3`}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex gap-1.5 items-center">
                <MonthYearDropdown 
                  value={mo}
                  onChange={(val) => setViewDate(new Date(yr, val, 1))}
                  options={MONTHS.map((m, idx) => ({ value: idx, label: m }))}
                />
                <MonthYearDropdown 
                  value={yr}
                  onChange={(val) => setViewDate(new Date(val, mo, 1))}
                  options={Array.from({ length: 151 }, (_, i) => {
                    const y = new Date().getFullYear() - 100 + i;
                    return { value: y, label: y };
                  })}
                  align="right"
                />
              </div>
              <div className="flex gap-1">
                <button 
                  type="button"
                  onClick={() => setViewDate(new Date(yr, mo - 1, 1))}
                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  type="button"
                  onClick={() => setViewDate(new Date(yr, mo + 1, 1))}
                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {DAYS.map(d => (
                <span key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1">
                  {d}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                const dateStr = d ? `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null;
                const isSelected = dateStr === value;
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!d}
                    onClick={() => handleSelect(d)}
                    className={`
                      h-8 rounded-xl text-xs transition-all flex items-center justify-center relative
                      ${!d ? 'opacity-0 pointer-events-none' : 'hover:bg-slate-50'}
                      ${isSelected ? 'bg-slate-800 text-white font-bold shadow-md' : 'text-slate-600'}
                      ${isToday && !isSelected ? 'text-indigo-600 font-bold' : ''}
                    `}
                  >
                    {d}
                    {isToday && !isSelected && <span className="absolute bottom-1 w-1 h-1 bg-indigo-500 rounded-full" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
