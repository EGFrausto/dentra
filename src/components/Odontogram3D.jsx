import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';

// Material premium tipo "Apple Glass / Cerámica"
const toothMaterial = new THREE.MeshPhysicalMaterial({
  color: '#f8fafc',
  metalness: 0.1,
  roughness: 0.2,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  transmission: 0.1, // Ligeramente translúcido
  thickness: 2.0,
});

const statusMaterial = {
  Cariado: new THREE.MeshPhysicalMaterial({ color: '#f59e0b', roughness: 0.4, clearcoat: 0.5 }), // Ambar
  Extraído: new THREE.MeshPhysicalMaterial({ color: '#ef4444', roughness: 0.8, transparent: true, opacity: 0.3 }), // Rojo translúcido
  Tratado: new THREE.MeshPhysicalMaterial({ color: '#3b82f6', roughness: 0.2, clearcoat: 1.0 }), // Azul
};

const STATES = ['Sano','Cariado','Extraído','Tratado'];
const STATE_BTN_CLS = {
  Sano:     'border-slate-300 text-slate-500 hover:border-slate-400',
  Cariado:  'border-amber-400 bg-amber-50 text-amber-700',
  Extraído: 'border-red-400 bg-red-50 text-red-600',
  Tratado:  'border-blue-400 bg-blue-50 text-blue-700',
};

function Tooth({ id, position, rotation, status, onClick }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Animación de "respiración"
  useFrame((state) => {
    if (hovered) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 6) * 0.03;
      meshRef.current.scale.set(scale, scale, scale);
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  // Determinar material
  let currentMaterial = toothMaterial;
  if (status && status !== 'Sano' && statusMaterial[status]) currentMaterial = statusMaterial[status];

  return (
    <group position={position} rotation={rotation}>
      <mesh
        ref={meshRef}
        material={currentMaterial}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
        onClick={(e) => { e.stopPropagation(); onClick(id); }}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.3, 0.2, 0.8, 32, 1, false]} />
      </mesh>
      
      {/* Etiqueta del diente */}
      <Text
        position={[0, 0.65, 0]}
        fontSize={0.25}
        color={hovered ? "#38bdf8" : "#94a3b8"}
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI/4, 0, 0]}
      >
        {id}
      </Text>
    </group>
  );
}

function Arch({ type = 'upper', activeTeethIDs, value, onToggleTooth }) {
  const teeth = useMemo(() => {
    const list = [];
    const radius = 3.5;
    const isUpper = type === 'upper';
    
    // Obtener las 2 listas (cuadrante izq y der) de los IDs activos
    const quadRightIds = activeTeethIDs.slice(0, 8).reverse(); // ej: 18..11 -> 11..18 para recorrer desde centro a extremo
    const quadLeftIds  = activeTeethIDs.slice(8, 16); // 21..28

    const angles = [0.15, 0.35, 0.55, 0.8, 1.1, 1.4, 1.8, 2.2];

    // Lado derecho (desde centro hacia atrás)
    for (let i = 0; i < quadRightIds.length; i++) {
      const id = quadRightIds[i]; 
      const angle = angles[i] * (isUpper ? -1 : -1); 
      const x = Math.sin(angle) * (radius + (i > 3 ? 0.4 : 0)) * -1;
      const z = Math.cos(angle) * (radius - (i > 3 ? 0.2 : 0)) * (isUpper ? 1 : 1);
      const position = [x, isUpper ? 0.6 : -0.6, z];
      const rotation = [isUpper ? Math.PI : 0, -angle, 0];
      list.push({ id, position, rotation });
    }

    // Lado izquierdo 
    for (let i = 0; i < quadLeftIds.length; i++) {
      const id = quadLeftIds[i]; 
      const angle = angles[i]; 
      const x = Math.sin(angle) * (radius + (i > 3 ? 0.4 : 0));
      const z = Math.cos(angle) * (radius - (i > 3 ? 0.2 : 0)) * (isUpper ? 1 : 1);
      const position = [x, isUpper ? 0.6 : -0.6, z];
      const rotation = [isUpper ? Math.PI : 0, Math.PI * 2 - angle, 0];
      list.push({ id, position, rotation });
    }

    return list;
  }, [type, activeTeethIDs]);

  return (
    <group position={[0, type === 'upper' ? 1 : -1, 0]}>
      {teeth.map((t) => (
        <Tooth
          key={t.id}
          id={t.id}
          position={t.position}
          rotation={t.rotation}
          status={value[t.id]}
          onClick={onToggleTooth}
        />
      ))}
    </group>
  );
}

const PERM = {
  upper: [18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28],
  lower: [48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38],
};
const DEC = {
  upper: [55,54,53,52,51, 61,62,63,64,65],
  lower: [85,84,83,82,81, 71,72,73,74,75],
};

export default function Odontogram3D({ value = {}, onChange }) {
  const [markAs, setMarkAs] = useState('Cariado');
  const [view, setView]     = useState('permanentes');

  const teethData = view === 'permanentes' ? PERM : DEC;

  const toggleTooth = (id) => {
    const next = { ...value };
    if (next[id] === markAs) delete next[id];
    else next[id] = markAs;
    onChange(next);
  };

  return (
    <div className="border border-slate-100 rounded-2xl p-5 bg-white flex flex-col gap-4">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Odontograma 3D</p>
        <div className="flex gap-0.5 bg-slate-100 p-1 rounded-xl">
          {['permanentes','deciduos'].map(v => (
            <button key={v} type="button" onClick={() => setView(v)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${view===v?'bg-white text-slate-800 shadow-sm':'text-slate-400 hover:text-slate-600'}`}>
              {v === 'permanentes' ? 'Permanentes' : 'Decíduos'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400 font-medium">Marcar pieza como:</span>
        {STATES.map(s => (
          <button key={s} type="button" onClick={() => setMarkAs(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${markAs===s ? STATE_BTN_CLS[s] : 'border-transparent text-slate-400 hover:border-slate-200'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* 3D Canvas wrapper */}
      <div className="w-full h-[450px] relative bg-slate-900 rounded-3xl overflow-hidden shadow-inner group">
        <Canvas
          camera={{ position: [0, 8, 12], fov: 40 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 2]} 
        >
          <color attach="background" args={['#0f172a']} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow />
          <directionalLight position={[-10, 10, -10]} intensity={0.5} />
          <Environment preset="city" />
          
          <group position={[0, 0, -2]}>
              <Arch type="upper" activeTeethIDs={teethData.upper} value={value} onToggleTooth={toggleTooth} />
              <Arch type="lower" activeTeethIDs={teethData.lower} value={value} onToggleTooth={toggleTooth} />
          </group>

          <ContactShadows position={[0, -2.5, 0]} opacity={0.7} scale={25} blur={2} far={10} />

          <OrbitControls
            enablePan={false}
            minDistance={4}
            maxDistance={15}
            maxPolarAngle={Math.PI / 1.8}
            autoRotate
            autoRotateSpeed={0.5}
            makeDefault
          />
        </Canvas>
        
        {/* Helper Badge */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-800/60 backdrop-blur-md rounded-full border border-white/10 text-white/80 text-xs tracking-wide pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          Arrastra para rotar • Clic para marcar pieza
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-5 mt-2 justify-center flex-wrap">
        {STATES.map(s => {
          const colorMap = { 'Sano': '#d1d5db', 'Cariado': '#f59e0b', 'Extraído': '#ef4444', 'Tratado': '#3b82f6' };
          return (
            <div key={s} className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-3 h-3 rounded-full border-2" style={{borderColor:colorMap[s],background:s==='Sano'?'white':colorMap[s]}}/>
              {s}
            </div>
          );
        })}
      </div>
    </div>
  );
}
