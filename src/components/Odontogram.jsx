import React, { useState } from 'react';

// ─── Constants and Colors ─────────────────────────────────────
const STATES = ['Sano', 'Cariado', 'Tratado', 'Extraído', 'Corona'];

const STATE_COLORS = {
  Sano:     { fill: '#f0fdf4',     stroke: '#22c55e' }, // Emerald/Green for Healthy
  Cariado:  { fill: '#fee2e2',     stroke: '#ef4444' }, // Red for Cavity
  Tratado:  { fill: '#eff6ff',     stroke: '#3b82f6' }, // Blue for Treated
  Extraído: { fill: 'transparent', stroke: '#ef4444' }, // Red Cross for Extracted
  Corona:   { fill: '#fffbeb',     stroke: '#f59e0b' }, // Amber for Crown
};

const STATE_BTN_CLS = {
  Sano:     'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-sm',
  Cariado:  'border-red-500 bg-red-50 text-red-700 font-bold shadow-md',
  Tratado:  'border-blue-500 bg-blue-50 text-blue-700 font-bold shadow-md',
  Extraído: 'border-slate-800 bg-slate-100 text-slate-800 font-bold shadow-md',
  Corona:   'border-amber-500 bg-amber-50 text-amber-700 font-bold shadow-md',
};

// ─── Sub-components ───────────────────────────────────────────

// 5-Surface Box
const SurfaceBox = ({ toothId, data = {}, markAs, onChange }) => {
  const toggle = (surf) => {
    const next = { ...data };
    if (next[surf] === markAs) delete next[surf]; 
    else next[surf] = markAs; 
    onChange(next);
  };

  const Polygon = ({ points, surf }) => {
    const status = data[surf];
    const isSpecial = status === 'Extraído' || status === 'Corona';
    const fill = !status ? 'transparent' : (isSpecial ? 'transparent' : STATE_COLORS[status].fill);
    const stroke = !status ? '#cbd5e1' : (STATE_COLORS[status]?.stroke || '#cbd5e1');

    return (
      <polygon
        points={points}
        fill={fill}
        stroke={stroke}
        strokeWidth={!status ? 0.8 : 1.2}
        strokeLinejoin="round"
        strokeLinecap="round"
        className="hover:opacity-75 cursor-pointer transition-colors"
        onClick={() => toggle(surf)}
      />
    );
  };

  return (
    <svg width="24" height="24" viewBox="0 0 50 50" className="mx-auto block my-1">
      <Polygon surf="T" points="5,5 45,5 35,15 15,15" />
      <Polygon surf="B" points="5,45 45,45 35,35 15,35" />
      <Polygon surf="L" points="5,5 15,15 15,35 5,45" />
      <Polygon surf="R" points="45,5 35,15 35,35 45,45" />
      <Polygon surf="C" points="15,15 35,15 35,35 15,35" />
    </svg>
  );
};
// ─── Surgical Anatomical Teeth (Phase 6: Professional Edition) ────
const TOOTH_LIBRARY = {
  1: { // Central Incisor
    outline: "M25 96 C 15 94 10 75 12 52 C 10 42 12 15 25 5 C 38 15 40 42 38 52 C 40 75 35 94 25 96 Z",
    interior: "M25 90 C 18 88 15 70 16 52 M25 90 C 32 88 35 70 34 52",
    pulp: "M25 92 L25 52",
    cej: "M12 52 Q 25 56 38 52"
  },
  2: { // Lateral Incisor
    outline: "M25 94 C 18 92 12 75 14 52 C 12 40 15 20 25 10 C 35 20 38 40 36 52 C 38 75 32 92 25 94 Z",
    interior: "M25 88 C 20 86 16 70 17 52 M25 88 C 30 86 34 70 33 52",
    pulp: "M25 90 L25 52",
    cej: "M14 52 Q 25 55 36 52"
  },
  3: { // Canine
    outline: "M25 98 C 15 92 8 75 14 52 C 12 25 22 8 25 4 C 28 8 38 25 36 52 C 42 75 35 92 25 98 Z",
    interior: "M25 92 C 18 85 15 70 15 52 M25 92 C 32 85 35 70 35 52",
    pulp: "M25 95 L25 52",
    cej: "M14 52 Q 25 56 36 52"
  },
  4: { // 1st Premolar
    outline: "M25 95 C 18 92 15 75 15 48 C 12 25 18 12 25 8 C 32 12 38 25 35 48 C 35 75 32 92 25 95 Z",
    interior: "M25 88 C 20 85 18 70 18 48 M25 88 C 30 85 32 70 32 48",
    pulp: "M25 90 L25 48",
    cej: "M15 48 Q 25 52 35 48"
  },
  5: { // 2nd Premolar
    outline: "M25 95 C 18 92 15 75 15 48 C 12 30 18 15 25 12 C 32 15 38 30 35 48 C 35 75 32 92 25 95 Z",
    interior: "M25 88 C 20 85 18 70 18 48 M25 88 C 30 85 32 70 32 48",
    pulp: "M25 90 L25 48",
    cej: "M15 48 Q 25 52 35 48"
  },
  6: { // 1st Molar (Surgical Divergence)
    outline: "M25 95 C 10 90 2 65 8 52 C 4 30 12 8 20 5 C 23 12 25 25 25 40 C 25 25 27 12 30 5 C 38 8 46 30 42 52 C 48 65 40 90 25 95 Z",
    interior: "M15 85 C 10 75 12 70 12 52 M35 85 C 40 75 38 70 38 52",
    pulp: "M15 82 L15 52 M35 82 L35 52",
    cej: "M8 52 Q 25 58 42 52"
  },
  7: { // 2nd Molar
    outline: "M25 92 C 12 88 8 70 12 52 C 8 35 15 15 22 10 C 24 18 25 28 25 40 C 25 28 26 18 28 10 C 35 15 42 35 38 52 C 42 70 38 88 25 92 Z",
    interior: "M18 82 C 12 72 15 65 15 52 M32 82 C 38 72 35 65 35 52",
    pulp: "M18 80 L18 52 M32 80 L32 52",
    cej: "M12 52 Q 25 56 38 52"
  },
  8: { // 3rd Molar
    outline: "M25 88 C 15 85 12 70 15 52 C 12 40 18 25 22 20 C 24 25 25 32 25 40 C 25 32 26 25 28 20 C 32 25 38 40 35 52 C 38 70 35 85 25 88 Z",
    interior: "M20 78 C 15 68 18 60 18 52 M30 78 C 35 68 32 60 32 52",
    pulp: "M20 75 L20 52 M30 75 L30 52",
    cej: "M15 52 Q 25 55 35 52"
  }
};

const FacialPaths = ({ number }) => {
  const lastDigit = number % 10;
  const toothIdx = lastDigit === 0 ? 1 : (lastDigit > 8 ? 8 : lastDigit);
  const data = TOOTH_LIBRARY[toothIdx] || TOOTH_LIBRARY[1];
  const isLeft = [21,22,23,24,25,26,27,28, 31,32,33,34,35,36,37,38].includes(number);

  return (
    <svg viewBox="0 0 50 100" className="w-full h-full drop-shadow-[0_3px_4px_rgba(0,0,0,0.06)]">
      <defs>
        <radialGradient id={`toothRad-${number}`} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </radialGradient>
      </defs>
      <g style={{ transform: isLeft ? 'scaleX(-1)' : 'none', transformOrigin: '25px 50px' }}>
        {/* Anatomical Outline with Volume Gradient */}
        <path d={data.outline} fill={`url(#toothRad-${number})`} stroke="#334155" strokeWidth="0.9" strokeLinejoin="round" />
        {/* Interior Depth Contours */}
        <path d={data.interior} fill="none" stroke="#475569" strokeOpacity="0.6" strokeWidth="0.6" strokeLinecap="round" />
        {/* Root Pulp/Center Detail */}
        <path d={data.pulp} fill="none" stroke="#64748b" strokeOpacity="0.4" strokeWidth="0.5" strokeDasharray="1 1.5" />
        {/* Cervical Junction */}
        <path d={data.cej} fill="none" stroke="#1e293b" strokeOpacity="0.7" strokeWidth="0.7" />
      </g>
    </svg>
  );
};

const FacialTooth = ({ number, upper, data = {}, markAs, onChange }) => {
  const status = data['F'];
  const fill = !status || status === 'Extraído' ? 'transparent' : STATE_COLORS[status].fill;
  const stroke = !status ? '#cbd5e1' : STATE_COLORS[status].stroke;

  const toggle = () => {
    const next = { ...data };
    if (next['F'] === markAs) delete next['F'];
    else next['F'] = markAs;
    onChange(next);
  };

  return (
    <div className="relative">
      <svg
        width="22"
        height="44"
        viewBox="0 0 50 100"
        className="mx-auto cursor-pointer hover:opacity-75 transition-all"
        onClick={toggle}
        style={{ transform: !upper ? 'rotate(180deg)' : 'none' }}
      >
        <g fill={fill} stroke={stroke} strokeWidth={status === 'Sano' ? 2 : 3} strokeLinejoin="round" strokeLinecap="round">
           <FacialPaths number={number} />
        </g>
      </svg>
      {status === 'Extraído' && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 50 100">
          <line x1="10" y1="15" x2="40" y2="85" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          <line x1="40" y1="15" x2="10" y2="85" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
};

const ToothWidget = ({ number, upper, data, markAs, onChange }) => {
  return (
    <div className="flex flex-col items-center justify-start w-[24px] sm:w-[28px] group">
      {upper ? (
        <>
          <FacialTooth number={number} upper={true} data={data} markAs={markAs} onChange={onChange} />
          <SurfaceBox toothId={number} data={data} markAs={markAs} onChange={onChange} />
          <span className="text-[10px] text-slate-400 font-bold mt-2 group-hover:text-blue-500 transition-colors">{number}</span>
        </>
      ) : (
        <>
          <span className="text-[10px] text-slate-400 font-bold mb-2 group-hover:text-blue-500 transition-colors">{number}</span>
          <SurfaceBox toothId={number} data={data} markAs={markAs} onChange={onChange} />
          <FacialTooth number={number} upper={false} data={data} markAs={markAs} onChange={onChange} />
        </>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────

const PERM = {
  upper: [18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28],
  lower: [48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38],
};

const DEC = {
  upper: [55,54,53,52,51, 61,62,63,64,65],
  lower: [85,84,83,82,81, 71,72,73,74,75],
};

export default function Odontogram({ value = {}, onChange }) {
  const [markAs, setMarkAs] = useState('Cariado');
  const [view, setView]     = useState('permanentes');

  const handleToothChange = (toothId, newData) => {
    const next = { ...value };
    if (Object.keys(newData).length === 0) delete next[toothId];
    else next[toothId] = newData;
    onChange(next);
  };

  const teethData = view === 'permanentes' ? PERM : DEC;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl w-full max-w-6xl mx-auto">
      
      {/* Selector Permanente / Deciduo */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit mx-auto mb-8 border border-slate-200">
        {['permanentes','deciduos'].map(v => (
          <button key={v} type="button" onClick={() => setView(v)}
            className={`px-8 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${view===v ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
            {v}
          </button>
        ))}
      </div>

      {/* Selector de Herramientas */}
      <div className="flex items-center gap-2 mb-10 w-full justify-center flex-wrap">
        {STATES.map(s => (
          <button key={s} type="button" onClick={() => setMarkAs(s)}
            className={`px-4 py-2 flex items-center gap-2 rounded-xl text-[10px] font-bold tracking-wider border transition-all ${markAs===s ? STATE_BTN_CLS[s] : 'border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}>
            <div className="w-2.5 h-2.5 rounded-full" style={{background: STATE_COLORS[s].fill === 'transparent' ? (s==='Extraído'?'#ef4444':'#cbd5e1') : STATE_COLORS[s].fill, border: `1px solid ${STATE_COLORS[s].stroke}` }} />
            {s.toUpperCase()}
          </button>
        ))}
        <div className="w-px h-6 bg-slate-200 mx-2" />
        <button onClick={() => onChange({})} className="text-[10px] font-bold text-red-500 hover:underline">REINICIAR</button>
      </div>

      <div className="w-full overflow-hidden flex justify-center">
        <div className="flex flex-col max-w-full bg-slate-50/30 p-4 sm:p-8 rounded-[3rem] border border-slate-100 shadow-inner">
          
          {/* Upper Arch */}
          <div className="flex justify-center gap-1 sm:gap-2 mb-4">
            <div className="flex gap-0.5 sm:gap-1 pr-2 sm:pr-4 border-r border-slate-200">
              {teethData.upper.slice(0, teethData.upper.length / 2).map((num, i) => (
                <div key={num} style={{ marginTop: `${Math.pow(i - 3.5, 2) * 1.5}px` }}>
                  <ToothWidget number={num} upper={true} markAs={markAs} data={value[num]} onChange={(d) => handleToothChange(num, d)} />
                </div>
              ))}
            </div>
            <div className="flex gap-0.5 sm:gap-1 pl-2 sm:pl-4">
              {teethData.upper.slice(teethData.upper.length / 2).map((num, i) => (
                <div key={num} style={{ marginTop: `${Math.pow(4 - i - 0.5, 2) * 1.5}px` }}>
                  <ToothWidget number={num} upper={true} markAs={markAs} data={value[num]} onChange={(d) => handleToothChange(num, d)} />
                </div>
              ))}
            </div>
          </div>

          {/* Center Separator Line */}
          <div className="w-full flex items-center gap-4 my-2 opacity-40">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-400 to-transparent"></div>
            <div className="w-2 h-2 rounded-full border border-slate-400"></div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-400 to-transparent"></div>
          </div>

          {/* Lower Arch */}
          <div className="flex justify-center gap-1 sm:gap-2 mt-4">
            <div className="flex gap-0.5 sm:gap-1 pr-2 sm:pr-4 border-r border-slate-200 items-start">
              {teethData.lower.slice(0, teethData.lower.length / 2).map((num, i) => (
                <div key={num} style={{ marginBottom: `${Math.pow(i - 3.5, 2) * 1.5}px` }}>
                  <ToothWidget number={num} upper={false} markAs={markAs} data={value[num]} onChange={(d) => handleToothChange(num, d)} />
                </div>
              ))}
            </div>
            <div className="flex gap-0.5 sm:gap-1 pl-2 sm:pl-4 items-start">
              {teethData.lower.slice(teethData.lower.length / 2).map((num, i) => (
                <div key={num} style={{ marginBottom: `${Math.pow(4 - i - 0.5, 2) * 1.5}px` }}>
                  <ToothWidget number={num} upper={false} markAs={markAs} data={value[num]} onChange={(d) => handleToothChange(num, d)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}