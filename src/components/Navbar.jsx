import { Link, useNavigate } from 'react-router-dom';
import { LogOut, PlusCircle, LayoutDashboard } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Navbar({ session }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content container">
        <Link to="/" className="navbar-logo">ABtracker</Link>
        
        <div className="navbar-links">
          {session ? (
            <>
              <Link to="/" className="navbar-link">
                <LayoutDashboard size={18}/> Dashboard
              </Link>
              <Link to="/create" className="btn-new-event">
                <PlusCircle size={18}/> Novo Evento
              </Link>
              <button onClick={handleLogout} className="btn-logout">
                <LogOut size={18}/> Sair
              </button>
            </>
          ) : (
            <Link to="/login" className="navbar-link">Admin Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}