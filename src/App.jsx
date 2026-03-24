import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import PendingActivation from './pages/PendingActivation';
import Home from './pages/Home';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import ClinicalRecords from './pages/ClinicalRecords';
import Xrays from './pages/Xrays';
import Finance from './pages/Finance';
import Inventory from './pages/Inventory';
import Configuration from './pages/Configuration';
import Presentation from './pages/Presentation';

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="flex-1 h-full overflow-y-auto overflow-x-hidden"
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes({ session, status }) {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"              element={<PageWrapper><Home user={session.user} /></PageWrapper>} />
        <Route path="/pacientes"     element={<PageWrapper><Patients user={session.user} /></PageWrapper>} />
        <Route path="/citas"         element={<PageWrapper><Appointments user={session.user} /></PageWrapper>} />
        <Route path="/historias"     element={<PageWrapper><ClinicalRecords user={session.user} /></PageWrapper>} />
        <Route path="/radiografias"  element={<PageWrapper><Xrays user={session.user} /></PageWrapper>} />
        <Route path="/finanzas"      element={<PageWrapper><Finance user={session.user} /></PageWrapper>} />
        <Route path="/inventario"    element={<PageWrapper><Inventory user={session.user} /></PageWrapper>} />
        <Route path="/configuracion" element={<PageWrapper><Configuration user={session.user} /></PageWrapper>} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState(() => localStorage.getItem('dentra_status'));
  const [loading, setLoading] = useState(true);
  const checkingRef = useRef(null);
  
  const checkStatus = async (userId) => {
    if (!userId || checkingRef.current === userId) return;
    checkingRef.current = userId;
    try {
      // 1. ¿Es dueño de una clínica? (Admin principal)
      const { data: ownedClinic } = await supabase
        .from('clinics')
        .select('id, status, doctor_name')
        .eq('user_id', userId)
        .maybeSingle();

      if (ownedClinic) {
        // Forzar perfil de admin activo para el dueño
        await supabase.from('profiles').upsert([{
          user_id: userId,
          clinic_id: ownedClinic.id,
          role: 'admin',
          full_name: ownedClinic.doctor_name || 'Admin',
          status: 'active'
        }]);
        
        const finalStatus = ownedClinic.status || 'active';
        setStatus(finalStatus);
        localStorage.setItem('dentra_status', finalStatus);
        localStorage.setItem('dentra_role', 'admin');
        return;
      }

      // 2. Si no es dueño, buscar su perfil (Personal: Doctor o Recepción)
      const { data: profile } = await supabase
        .from('profiles')
        .select('status, clinic_id, role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profile) {
        const { data: clinic } = await supabase
          .from('clinics')
          .select('status')
          .eq('id', profile.clinic_id)
          .single();
        
        // Status final depende de la clínica Y del perfil
        const finalStatus = (clinic?.status !== 'active') ? (clinic?.status || 'pending') : profile.status;
        
        setStatus(finalStatus);
        localStorage.setItem('dentra_status', finalStatus);
        localStorage.setItem('dentra_role', profile.role);
      } else {
        // Sin clínica y sin perfil
        setStatus('pending');
        localStorage.setItem('dentra_status', 'pending');
      }
    } catch (err) {
      console.error('Error checking status:', err);
      if (!status) setStatus('pending');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Initial Session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user?.id) {
        checkStatus(initialSession.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Auth Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.id) {
        checkStatus(newSession.user.id);
      } else {
        setStatus(null);
        localStorage.removeItem('dentra_status');
        localStorage.removeItem('dentra_role');
        checkingRef.current = null;
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // While checking initial session, show splash
  if (loading && !session) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Dentra" className="h-10 w-auto animate-pulse" style={{filter:'brightness(0)'}}/>
          <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="w-full h-full bg-slate-800 animate-progress origin-left" />
          </div>
        </div>
      </div>
    );
  }

  // If we have a session but NO status (cached or fresh), wait a moment (prevents flicker)
  if (session && !status) return <div className="h-screen w-screen bg-slate-100" />;

  return (
    <Router>
      <Routes>
        <Route path="/presentacion" element={<Presentation />} />
        {!session ? (
          <>
            <Route path="/login" element={<Auth />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : status !== 'active' ? (
          <>
            <Route path="/pending" element={<PendingActivation onLogout={() => supabase.auth.signOut()} />} />
            <Route path="*" element={<Navigate to="/pending" replace />} />
          </>
        ) : (
          <Route path="*" element={
            <Layout user={session.user} onLogout={() => supabase.auth.signOut()}>
              <AnimatedRoutes session={session} status={status} />
            </Layout>
          } />
        )}
      </Routes>
    </Router>
  );
}

export default App;