import { useState, useEffect } from 'react';
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

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="flex-1 h-full overflow-hidden"
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
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = async (userId) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('status')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      setStatus(data?.status || 'pending');
    } catch (err) {
      console.error('Error checking status:', err);
      setStatus('pending');
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        checkStatus(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        checkStatus(session.user.id).then(() => setLoading(false));
      } else {
        setStatus(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
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

  return (
    <Router>
      {!session ? (
        <Routes>
          <Route path="/login" element={<Auth onLogin={setSession} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : status !== 'active' ? (
        <Routes>
          <Route path="/pending" element={<PendingActivation onLogout={() => supabase.auth.signOut()} />} />
          <Route path="*" element={<Navigate to="/pending" replace />} />
        </Routes>
      ) : (
        <Layout user={session.user} onLogout={() => supabase.auth.signOut()}>
          <AnimatedRoutes session={session} status={status} />
        </Layout>
      )}
    </Router>
  );
}

export default App;