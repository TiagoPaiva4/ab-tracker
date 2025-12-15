import { Link, useNavigate } from 'react-router-dom';
import { LogOut, PlusCircle, LayoutDashboard, LogIn } from 'lucide-react'; // Adicionei LogIn
import { supabase } from '../lib/supabaseClient';
import logo from '../assets/logo-ab.png';

export default function Navbar({ session }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content container">
        {/* LOGO + TRACKER (Vertical) */}
        <Link to="/" className="navbar-brand">
          <img src={logo} alt="AB Logo" className="brand-logo-img" />
          <span className="brand-text">tracker</span>
        </Link>
        
        <div className="navbar-links">
          {session ? (
            <>
              <Link to="/" className="navbar-link">
                <LayoutDashboard size={18}/> <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link to="/create" className="btn-new-event">
                <PlusCircle size={18}/> <span className="hidden sm:inline">Novo Evento</span>
              </Link>
              <button onClick={handleLogout} className="btn-logout">
                <LogOut size={18}/>
              </button>
            </>
          ) : (
            /* BOTÃO LOGIN ALTERADO */
            <Link to="/login" className="btn-new-event">
               <LogIn size={18}/> Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}