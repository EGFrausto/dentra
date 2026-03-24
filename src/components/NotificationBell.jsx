import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Sparkles, Play, Clock, User, ChevronRight, AlertTriangle, Package, X, Trash2 } from 'lucide-react';
import { appointments as aStore, patients as pStore, records as rStore, profile as profStore, inventory as iStore, supabase } from '../lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBell({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [apptCount, setApptCount] = useState(0);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [patient, setPatient] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    const s = localStorage.getItem(`dismissed_${user.id}`);
    return s ? JSON.parse(s) : [];
  });
  const bellRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(`dismissed_${user.id}`, JSON.stringify(dismissed));
  }, [dismissed]);

  const fetchAll = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Appointments
    const allApts = await aStore.get();
    const pendingToday = allApts.filter(a => 
      a.date === today && 
      a.status !== 'Cancelada' && 
      a.status !== 'Completada' &&
      !dismissed.includes(`apt_${a.id}_${a.time}_${a.treatment}`)
    );
    
    // Inventory
    const allInv = await iStore.get();
    const low = allInv.filter(i => 
      Number(i.quantity) <= Number(i.min_stock || 5) &&
      !dismissed.includes(`inv_${i.id}_${i.quantity}`)
    );
    setLowStockItems(low);

    setApptCount(pendingToday.length + low.length);

    const next = pendingToday
      .sort((a, b) => a.time.localeCompare(b.time))[0];
    
    if (next) {
      if (!nextAppointment || next.id !== nextAppointment.id || next.time !== nextAppointment.time) {
        setNextAppointment(next);
        setBriefing(null); // Reset briefing for new next appt
        const pts = await pStore.get();
        const p = pts.find(pt => pt.id === next.patient_id);
        setPatient(p);
      }
    } else {
      setNextAppointment(null);
      setPatient(null);
      setBriefing(null);
    }
  }, [dismissed, nextAppointment]);

  useEffect(() => {
    fetchAll();

    const interval = setInterval(fetchAll, 30000); // Poll every 30s
    
    // "Pre-load" voices for TTS
    window.speechSynthesis.getVoices();
    const handleVoices = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', handleVoices);

    // Real-time subscriptions
    const appointmentsSub = supabase.channel('bell-apts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchAll)
      .subscribe();
    
    const inventorySub = supabase.channel('bell-inv')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, fetchAll)
      .subscribe();

    const handler = e => { if (bellRef.current && !bellRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handler);
    
    return () => {
      clearInterval(interval);
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoices);
      supabase.removeChannel(appointmentsSub);
      supabase.removeChannel(inventorySub);
      document.removeEventListener('mousedown', handler);
    };
  }, [fetchAll]);

  const dismiss = (id) => setDismissed(d => [...d, id]);
  const clearAll = () => {
    const ids = [];
    if (nextAppointment) ids.push(`apt_${nextAppointment.id}_${nextAppointment.time}_${nextAppointment.treatment}`);
    lowStockItems.forEach(i => ids.push(`inv_${i.id}_${i.quantity}`));
    setDismissed(d => [...new Set([...d, ...ids])]);
  };

  const generateBriefing = async () => {
    if (!nextAppointment || !patient || briefing) return;
    setLoading(true);
    try {
      const history = await rStore.get();
      const pHistory = history
        .filter(r => r.patient_id === nextAppointment.patient_id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 2);

      const clinicData = await profStore.get();
      const docPrefix = clinicData?.doctor_prefix || 'Doctor';
      let docName = clinicData?.doctor_name || '';
      
      if (docName.toLowerCase().startsWith(docPrefix.toLowerCase())) {
        docName = docName.substring(docPrefix.length).trim();
      }
      docName = docName.split(' ')[0];

      const name = patient.name.split(' ')[0];
      const treatment = nextAppointment.treatment.toLowerCase();
      const lastRec = pHistory[0];
      const lastNote = lastRec?.notes || '';
      
      // Lógica de tiempo
      let timeContext = '';
      if (lastRec) {
        const diff = Math.floor((new Date() - new Date(lastRec.date)) / (1000 * 60 * 60 * 24));
        if (diff < 7) timeContext = 'Lo vimos hace unos días.';
        else if (diff < 30) timeContext = `Viene de su consulta de hace ${diff} días.`;
        else if (diff < 365) timeContext = `Su última visita fue hace ${Math.floor(diff/30)} meses.`;
        else timeContext = 'No pasaba por aquí hace más de un año.';
      }

      // Composición de Saludo Inteligente
      const hour = new Date().getHours();
      const timeGreeting = hour < 12 ? 'Buenos días' : (hour < 19 ? 'Buenas tardes' : 'Buenas noches');
      
      const openers = [
        `${timeGreeting}, ${docPrefix} ${docName}.`,
        `${docPrefix} ${docName}, ${timeGreeting.toLowerCase()}.`,
        `Hola de nuevo, ${docPrefix} ${docName}.`
      ];
      const actions = [
        `Prosigamos con la agenda.`,
        `Todo listo para el siguiente paciente.`,
        `Aquí tienes el resumen para esta cita.`,
        `Vamos a revisar el caso de hoy.`
      ];
      
      const opener = openers[Math.floor(Math.random() * openers.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const greeting = `${opener} ${action}`;

      // Tips Clínicos Dinámicos
      let tip = '';
      if (treatment.includes('limpieza')) tip = 'No olvides recordarle la técnica de cepillado si ves placa.';
      else if (treatment.includes('extracción') || treatment.includes('cirugía')) tip = 'Hay que estar atentos a la cicatrización hoy.';
      else if (treatment.includes('ortodoncia')) tip = 'Hoy toca ajustar la presión de los brackets.';
      else tip = 'Recuerda validar el progreso general de su plan dental.';

      // Construcción fluida
      let fluentText = `${greeting} Tu siguiente paciente es ${name}, por una ${treatment}. ${timeContext} `;
      if (lastNote) fluentText += `En su última visita anotaste que: ${lastNote}. `;
      else fluentText += `Es una buena oportunidad para actualizar sus notas clínicas hoy. `;
      fluentText += `Un consejo: ${tip}`;

      setBriefing({ points: [], fluentText }); // Ya no necesitamos los points estáticos
    } catch (err) {
      console.error('Error generating briefing:', err);
    } finally {
      setLoading(false);
    }
  };

  const speak = () => {
    if (!briefing) return;
    const synth = window.speechSynthesis;
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(briefing.fluentText);
    const voices = synth.getVoices();
    
    // Mejoramos la selección de voz para que sea inmediata y preferente
    const preferredVoice = 
      voices.find(v => v.name.includes('Google') && v.lang.startsWith('es')) || 
      voices.find(v => v.name.includes('Mónica') && v.lang.startsWith('es')) || 
      voices.find(v => v.name.includes('Paulina') && v.lang.startsWith('es')) || 
      voices.find(v => v.lang.startsWith('es'));
    
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.05; // Un poco más natural
    utterance.pitch = 1.0; 

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    synth.speak(utterance);
  };

  return (
    <div className="relative" ref={bellRef}>
      <button 
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) generateBriefing(); }}
        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all tooltip-trigger tooltip-bottom ${isOpen ? 'bg-slate-800 text-white shadow-lg shadow-slate-200' : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-200 shadow-sm'}`}
        data-tip="Notificaciones"
      >
        <Bell size={18} />
        {apptCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#ff3b30] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-red-200">
            {apptCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] z-50 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-50 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">Notificaciones</h3>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {nextAppointment && (
                  <motion.div 
                    key={`apt_${nextAppointment.id}_${nextAppointment.time}_${nextAppointment.treatment}`}
                    layout
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -200 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="group relative bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm transition-all hover:border-slate-200"
                  >
                    <button 
                      onClick={() => dismiss(`apt_${nextAppointment.id}_${nextAppointment.time}_${nextAppointment.treatment}`)}
                      className="absolute top-3 right-3 p-1 text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all z-10 tooltip-trigger tooltip-bottom"
                      data-tip="Ocultar"
                    >
                      <X size={14} />
                    </button>
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Próxima Visita</p>
                        <p className="text-sm font-bold text-slate-800">{patient?.name}</p>
                        <p className="text-xs text-slate-500">{nextAppointment.time.substring(0,5)} · {nextAppointment.treatment}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm relative overflow-hidden">
                      {loading ? (
                        <div className="py-4 flex flex-col items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-slate-100 border-t-slate-800 rounded-full animate-spin" />
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Preparando briefing...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-[11px] text-slate-400 text-center px-2">La IA ha analizado el historial para tu consulta de hoy.</p>
                          <button 
                            onClick={speak}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${isSpeaking ? 'bg-slate-100 text-slate-600' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-200'}`}
                          >
                            <Play size={12} fill={isSpeaking ? 'currentColor' : 'none'} />
                            {isSpeaking ? 'Detener lectura' : 'Escuchar briefing'}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {lowStockItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest px-1">Stock Bajo</p>
                    <AnimatePresence>
                      {lowStockItems.map(item => (
                        <motion.div 
                          key={`inv_${item.id}_${item.quantity}`}
                          layout
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -200 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                          className="group relative flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-2xl shadow-sm transition-all hover:border-red-200"
                        >
                          <button 
                            onClick={() => dismiss(`inv_${item.id}_${item.quantity}`)}
                            className="absolute top-2 right-2 p-1 text-red-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
                          >
                            <X size={12} />
                          </button>
                          <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center text-white shrink-0">
                            <AlertTriangle size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                            <p className="text-[10px] text-red-600 font-bold">Quedan {item.quantity} {item.unit}</p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </AnimatePresence>

              {!nextAppointment && lowStockItems.length === 0 && (
                <div className="py-12 text-center text-slate-200">
                  <Bell size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-medium">Sin alertas pendientes</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 px-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sugerencias</p>
                <ChevronRight size={12} className="text-slate-300" />
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                 <p className="text-[11px] text-slate-500">Recuerda registrar la firma del consentimiento informado para nuevos pacientes.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
