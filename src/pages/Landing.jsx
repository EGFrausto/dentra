import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function Landing({ onEnter }) {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const particles = useRef([]);
  const animRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => { setTimeout(() => setReady(true), 300); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    const onMove = e => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMove);

    particles.current = Array.from({ length: 120 }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-.5)*.4, vy: (Math.random()-.5)*.4,
      r: Math.random()*1.5+.5, opacity: Math.random()*.4+.1,
    }));

    const draw = () => {
      ctx.clearRect(0,0,W,H);
      const mx=mouse.current.x, my=mouse.current.y;
      particles.current.forEach(p => {
        const dx=p.x-mx, dy=p.y-my, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<120) { const f=(120-dist)/120; p.vx+=(dx/dist)*f*.3; p.vy+=(dy/dist)*f*.3; }
        p.vx*=.97; p.vy*=.97;
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(148,163,184,${p.opacity})`; ctx.fill();
      });
      particles.current.forEach((p,i) => {
        particles.current.slice(i+1).forEach(q => {
          const dx=p.x-q.x, dy=p.y-q.y, dist=Math.sqrt(dx*dx+dy*dy);
          if(dist<100) { ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.strokeStyle=`rgba(100,116,139,${(1-dist/100)*.12})`; ctx.lineWidth=.5; ctx.stroke(); }
        });
        const dx=p.x-mx, dy=p.y-my, dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<150) { ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(mx,my); ctx.strokeStyle=`rgba(148,163,184,${(1-dist/150)*.3})`; ctx.lineWidth=.8; ctx.stroke(); }
      });
      animRef.current=requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize',resize); window.removeEventListener('mousemove',onMove); cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0"/>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-slate-800/20 rounded-full blur-[120px]"/>
      </div>
      <div className={`relative z-10 flex flex-col items-center justify-center h-full text-center px-6 transition-all duration-1000 ${ready?'opacity-100 translate-y-0':'opacity-0 translate-y-4'}`}>
        <img src="/logo.png" alt="Dentra" className="h-12 w-auto mb-10" style={{filter:'brightness(0) invert(1) opacity(0.9)'}}/>
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-4 leading-none">
          Gestión dental<br/><span className="text-slate-400">reinventada.</span>
        </h1>
        <p className="text-slate-500 text-lg md:text-xl mt-6 mb-12 max-w-xl leading-relaxed">
          Todo lo que tu consultorio necesita, en un solo lugar. Simple, rápido y poderoso.
        </p>
        <button onClick={onEnter}
          className="group flex items-center gap-3 bg-white text-slate-900 font-bold px-8 py-4 rounded-2xl text-base transition-all hover:bg-slate-100 hover:scale-105 active:scale-95 shadow-2xl">
          Ingresar al sistema
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
        </button>
        <p className="text-slate-700 text-xs mt-10 tracking-widest uppercase">
          Powered by <span className="text-slate-500 font-semibold">Atlara</span>
        </p>
      </div>
    </div>
  );
}