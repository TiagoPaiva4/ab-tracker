import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import CreateEvent from './pages/CreateEvent';
import EventDetails from './pages/EventDetails';
import Album from './pages/Album';
import Members from './pages/Members'; // <--- IMPORTAR

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 pb-10">
        <Navbar session={session} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/album" element={<Album />} />
          <Route path="/members" element={session ? <Members session={session} /> : <Navigate to="/login" />} /> {/* <--- NOVA ROTA */}
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          <Route path="/create" element={session ? <CreateEvent session={session} /> : <Navigate to="/login" />} />
          <Route path="/event/:id" element={<EventDetails session={session} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;