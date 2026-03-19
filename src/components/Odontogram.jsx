import { useState } from 'react';

// ─── Surface colors ───────────────────────────────────────────
const STATE_COLORS = {
  Sano:     { stroke: '#d1d5db', fill: 'white',    dot: '#9ca3af' },
  Cariado:  { stroke: '#f59e0b', fill: '#fef9c3',  dot: '#f59e0b' },
  Extraído: { stroke: '#ef4444', fill: '#fee2e2',  dot: '#ef4444' },
  Tratado:  { stroke: '#3b82f6', fill: '#eff6ff',  dot: '#3b82f6' },
};

// ─── Individual tooth SVG with 5 surfaces ────────────────────
function ToothSVG({ number, state, onClick, upper }) {
  const c = STATE_COLORS[state] || STATE_COLORS.Sano;
  const isSelected = !!state;
  const stroke = c.stroke;
  const fill = c.fill;
  const sw = isSelected ? 1.8 : 1.2;

  // Determine morphology
  const isMolar    = [16,17,18,26,27,28,36,37,38,46,47,48].includes(number);
  const isPremolar = [14,15,24,25,34,35,44,45].includes(number);
  const isCanine   = [13,23,33,43].includes(number);

  // ── Occlusal / incisal view (top square-ish shape) ──
  const OcclusalView = () => {
    if (isMolar) return (
      <g>
        <rect x="4" y="2" width="24" height="22" rx="5" fill={fill} stroke={stroke} strokeWidth={sw}/>
        {/* cusps cross */}
        <line x1="16" y1="4" x2="16" y2="22" stroke={stroke} strokeWidth="0.8" opacity="0.5"/>
        <line x1="6" y1="13" x2="26" y2="13" stroke={stroke} strokeWidth="0.8" opacity="0.5"/>
        <ellipse cx="10" cy="8"  rx="3" ry="3" fill={stroke} opacity="0.15"/>
        <ellipse cx="22" cy="8"  rx="3" ry="3" fill={stroke} opacity="0.15"/>
        <ellipse cx="10" cy="18" rx="3" ry="3" fill={stroke} opacity="0.15"/>
        <ellipse cx="22" cy="18" rx="3" ry="3" fill={stroke} opacity="0.15"/>
      </g>
    );
    if (isPremolar) return (
      <g>
        <rect x="6" y="2" width="20" height="20" rx="5" fill={fill} stroke={stroke} strokeWidth={sw}/>
        <line x1="16" y1="4" x2="16" y2="20" stroke={stroke} strokeWidth="0.8" opacity="0.5"/>
        <ellipse cx="11" cy="12" rx="2.5" ry="3" fill={stroke} opacity="0.15"/>
        <ellipse cx="21" cy="12" rx="2.5" ry="3" fill={stroke} opacity="0.15"/>
      </g>
    );
    // Canine / incisor — thin oval
    return (
      <g>
        <ellipse cx="16" cy="12" rx={isCanine?7:8} ry={isCanine?9:8} fill={fill} stroke={stroke} strokeWidth={sw}/>
        {isCanine && <ellipse cx="16" cy="12" rx="4" ry="5" fill={stroke} opacity="0.1"/>}
      </g>
    );
  };

  // ── Facial / Lingual view (main tooth body) ──
  const FacialView = () => {
    if (isMolar) {
      if (upper) return (
        <g>
          {/* Crown */}
          <path d="M5,2 Q16,0 27,2 L27,18 Q22,22 16,23 Q10,22 5,18 Z" fill={fill} stroke={stroke} strokeWidth={sw}/>
          {/* Roots - 3 roots for upper molars */}
          <path d="M7,20 Q6,30 5,38" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          <path d="M16,22 Q16,32 16,40" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          <path d="M25,20 Q26,30 27,38" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          {/* Crown detail */}
          <path d="M9,8 Q13,12 16,10 Q19,12 23,8" fill="none" stroke={stroke} strokeWidth="0.8" opacity="0.4"/>
        </g>
      );
      return (
        <g>
          {/* Roots - 2 roots for lower molars */}
          <path d="M9,4 Q8,12 7,20" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          <path d="M23,4 Q24,12 25,20" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          {/* Crown */}
          <path d="M5,20 Q10,18 16,17 Q22,18 27,20 L27,36 Q22,40 16,41 Q10,40 5,36 Z" fill={fill} stroke={stroke} strokeWidth={sw}/>
          <path d="M9,30 Q13,26 16,28 Q19,26 23,30" fill="none" stroke={stroke} strokeWidth="0.8" opacity="0.4"/>
        </g>
      );
    }
    if (isPremolar) {
      if (upper) return (
        <g>
          <path d="M8,2 Q16,0 24,2 L24,18 Q20,22 16,23 Q12,22 8,18 Z" fill={fill} stroke={stroke} strokeWidth={sw}/>
          <path d="M11,20 Q10,30 9,40" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          <path d="M21,20 Q22,30 23,40" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
        </g>
      );
      return (
        <g>
          <path d="M11,3 Q10,12 9,20" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          <path d="M21,3 Q22,12 23,20" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          <path d="M8,20 Q12,18 16,17 Q20,18 24,20 L24,36 Q20,40 16,41 Q12,40 8,36 Z" fill={fill} stroke={stroke} strokeWidth={sw}/>
        </g>
      );
    }
    if (isCanine) {
      if (upper) return (
        <g>
          <path d="M9,2 Q16,0 23,2 L22,20 Q19,25 16,26 Q13,25 10,20 Z" fill={fill} stroke={stroke} strokeWidth={sw}/>
          <path d="M16,25 Q16,33 16,42" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
        </g>
      );
      return (
        <g>
          <path d="M16,2 Q16,12 16,18" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          <path d="M10,18 Q13,16 16,15 Q19,16 22,18 L23,38 Q19,42 16,43 Q13,42 9,38 Z" fill={fill} stroke={stroke} strokeWidth={sw}/>
        </g>
      );
    }
    // Incisor
    if (upper) return (
      <g>
        <path d="M8,2 Q16,0 24,2 L23,20 Q20,24 16,25 Q12,24 9,20 Z" fill={fill} stroke={stroke} strokeWidth={sw}/>
        <path d="M16,24 Q16,33 16,42" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
      </g>
    );
    return (
      <g>
        <path d="M16,2 Q16,12 16,18" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
        <path d="M9,18 Q12,16 16,15 Q20,16 23,18 L24,38 Q20,42 16,43 Q12,42 8,38 Z" fill={fill} stroke={stroke} strokeWidth={sw}/>
      </g>
    );
  };

  // ── Proximal (mesial/distal) view ──
  const ProximalView = () => {
    if (isMolar) {
      if (upper) return (
        <g>
          <path d="M6,2 Q16,0 26,2 L26,18 Q20,22 16,22 Q12,22 6,18 Z" fill={fill} stroke={stroke} strokeWidth={sw}/>
          <path d="M10,20 Q9,30 8,40" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          <path d="M22,20 Q23,30 24,40" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
        </g>
      );
      return (
        <g>
          <path d="M10,3 Q9,12 8,20" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          <path d="M22,3 Q23,12 24,20" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          <path d="M6,20 Q12,18 16,17 Q20,18 26,20 L26,36 Q20,40 16,41 Q12,40 6,36 Z" fill={fill} stroke={stroke} strokeWidth={sw}/>
        </g>
      );
    }
    if (upper) return (
      <g>
        <path d="M8,2 Q16,1 24,2 L23,20 Q20,23 16,24 Q12,23 9,20 Z" fill={fill} stroke={stroke} strokeWidth={sw}/>
        <path d="M16,23 Q16,33 16,42" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
      </g>
    );
    return (
      <g>
        <path d="M16,2 Q16,12 16,18" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
        <path d="M9,18 Q12,16 16,15 Q20,16 23,18 L24,37 Q20,41 16,42 Q12,41 8,37 Z" fill={fill} stroke={stroke} strokeWidth={sw}/>
      </g>
    );
  };

  // State overlay mark
  const Mark = ({ cx, cy }) => {
    if (state === 'Extraído') return (
      <>
        <line x1={cx-5} y1={cy-5} x2={cx+5} y2={cy+5} stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
        <line x1={cx+5} y1={cy-5} x2={cx-5} y2={cy+5} stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
      </>
    );
    if (state === 'Cariado') return <circle cx={cx} cy={cy} r="3.5" fill="#f59e0b" opacity="0.8"/>;
    if (state === 'Tratado') return <circle cx={cx} cy={cy} r="3.5" fill="#3b82f6" opacity="0.7"/>;
    return null;
  };

  const w = 32, h = 44;
  const mid = { cx: 16, cy: upper ? 12 : 32 };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 group transition-transform hover:scale-110 active:scale-95 ${isSelected ? 'scale-105' : ''}`}
      title={`${number}${state ? ` - ${state}` : ''}`}
    >
      {/* Occlusal/Incisal view */}
      <svg width={w} height={26} viewBox="0 0 32 26" className="overflow-visible">
        <OcclusalView/>
        {isSelected && <Mark cx={16} cy={13}/>}
      </svg>
      {/* Facial/Lingual view */}
      <svg width={w} height={h} viewBox="0 0 32 44" className="overflow-visible">
        <FacialView/>
      </svg>
      {/* Number */}
      <span className={`text-[9px] font-bold mt-0.5 transition-colors ${isSelected ? 'text-slate-700' : 'text-slate-400 group-hover:text-slate-600'}`}>
        {number}
      </span>
    </button>
  );
}

// ─── Tooth rows ───────────────────────────────────────────────
const PERM = {
  upperRight: [18,17,16,15,14,13,12,11],
  upperLeft:  [21,22,23,24,25,26,27,28],
  lowerRight: [48,47,46,45,44,43,42,41],
  lowerLeft:  [31,32,33,34,35,36,37,38],
};
const DEC = {
  upperRight: [55,54,53,52,51],
  upperLeft:  [61,62,63,64,65],
  lowerRight: [85,84,83,82,81],
  lowerLeft:  [71,72,73,74,75],
};

const STATES = ['Sano','Cariado','Extraído','Tratado'];
const STATE_BTN_CLS = {
  Sano:     'border-slate-300 text-slate-500 hover:border-slate-400',
  Cariado:  'border-amber-400 bg-amber-50 text-amber-700',
  Extraído: 'border-red-400 bg-red-50 text-red-600',
  Tratado:  'border-blue-400 bg-blue-50 text-blue-700',
};

// ─── Main export ──────────────────────────────────────────────
export default function Odontogram({ value = {}, onChange }) {
  const [markAs, setMarkAs] = useState('Cariado');
  const [view, setView]     = useState('permanentes');

  const toggle = t => {
    const next = { ...value };
    if (next[t] === markAs) delete next[t];
    else next[t] = markAs;
    onChange(next);
  };

  const Row = ({ teeth, upper }) => (
    <div className="flex gap-1 justify-center">
      {teeth.map(t => (
        <ToothSVG key={t} number={t} state={value[t]} onClick={() => toggle(t)} upper={upper}/>
      ))}
    </div>
  );

  const teeth = view === 'permanentes' ? PERM : DEC;

  return (
    <div className="border border-slate-100 rounded-2xl p-5 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-700">Odontograma</p>
        <div className="flex gap-0.5 bg-slate-100 p-1 rounded-xl">
          {['permanentes','deciduos'].map(v => (
            <button key={v} type="button" onClick={() => setView(v)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${view===v?'bg-white text-slate-800 shadow-sm':'text-slate-400 hover:text-slate-600'}`}>
              {v === 'permanentes' ? 'Permanentes' : 'Decíduos'}
            </button>
          ))}
        </div>
      </div>

      {/* State selector */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="text-xs text-slate-400 font-medium">Marcar como:</span>
        {STATES.map(s => (
          <button key={s} type="button" onClick={() => setMarkAs(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${markAs===s ? STATE_BTN_CLS[s] : 'border-transparent text-slate-400 hover:border-slate-200'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Arch */}
      <div className="overflow-x-auto">
        <div className="min-w-max mx-auto">
          {/* Upper */}
          <div className="flex justify-center gap-3 mb-2">
            <Row teeth={teeth.upperRight} upper={true}/>
            <div className="w-px bg-slate-200 self-stretch mx-1"/>
            <Row teeth={teeth.upperLeft} upper={true}/>
          </div>
          {/* Midline */}
          <div className="relative flex items-center justify-center my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-dashed border-slate-200"/>
            </div>
            <span className="relative bg-white px-3 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
              Superior / Inferior
            </span>
          </div>
          {/* Lower */}
          <div className="flex justify-center gap-3 mt-2">
            <Row teeth={teeth.lowerRight} upper={false}/>
            <div className="w-px bg-slate-200 self-stretch mx-1"/>
            <Row teeth={teeth.lowerLeft} upper={false}/>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-5 pt-4 border-t border-slate-100 justify-center flex-wrap">
        {STATES.map(s => {
          const c = STATE_COLORS[s];
          return (
            <div key={s} className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-3 h-3 rounded-full border-2" style={{borderColor:c.stroke,background:s==='Sano'?'white':c.fill}}/>
              {s}
            </div>
          );
        })}
      </div>
    </div>
  );
}