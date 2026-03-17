import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import ClinicalRecords from './pages/ClinicalRecords';
import Xrays from './pages/Xrays';
import Finance from './pages/Finance';
import Inventory from './pages/Inventory';
import Configuration from './pages/Configuration';

function App() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('dentra_session')); } catch { return null; }
  });
  const handleLogin  = s => { sessionStorage.setItem('dentra_session', JSON.stringify(s)); setSession(s); };
  const handleLogout = () => { sessionStorage.removeItem('dentra_session'); setSession(null); };

  if (!session) return <Login onLogin={handleLogin}/>;

  return (
    <Router>
      <Layout onLogout={handleLogout} session={session}>
        <Routes>
          <Route path="/"               element={<Home />} />
          <Route path="/pacientes"      element={<Patients />} />
          <Route path="/citas"          element={<Appointments />} />
          <Route path="/historias"      element={<ClinicalRecords />} />
          <Route path="/radiografias"   element={<Xrays />} />
          <Route path="/finanzas"       element={<Finance />} />
          <Route path="/inventario"     element={<Inventory />} />
          <Route path="/configuracion"  element={<Configuration />} />
          <Route path="*"               element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}
export default App;