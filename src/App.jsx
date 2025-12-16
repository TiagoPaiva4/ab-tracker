import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'; 
import { supabase } from './lib/supabaseClient';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import CreateEvent from './pages/CreateEvent';
import EventDetails from './pages/EventDetails';
import Album from './pages/Album';
import Members from './pages/Members';
import MemberProfile from './pages/MemberProfile';
import NightStats from './pages/NightStats'; 

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 pb-10">
        <Navbar session={session} />
        <Routes>
          <Route path="/" element={<Dashboard session={session} />} />
          <Route path="/album" element={<Album />} />
          <Route path="/members" element={session ? <Members session={session} /> : <Navigate to="/login" />} />
          <Route path="/profile/:name" element={<MemberProfile />} /> {/* <--- 2. NOVA ROTA */}
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          <Route path="/create" element={session ? <CreateEvent session={session} /> : <Navigate to="/login" />} />
          <Route path="/event/:id" element={<EventDetails session={session} />} />
          <Route path="/nightstats" element={<NightStats session={session} />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;