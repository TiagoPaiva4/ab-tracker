import { Link, useNavigate } from 'react-router-dom';
import { LogOut, PlusCircle, LayoutDashboard, LogIn, Image, Users, Beer } from 'lucide-react'; // Adicionado 'Beer'
import { supabase } from '../lib/supabaseClient';
import logo from '../assets/logo-ab.png';

export default function Navbar({ session }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItemStyle = {
    color: 'white', 
    textDecoration: 'none', 
    fontWeight: '700', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px', 
    fontSize: '0.9rem', 
    background: 'transparent', 
    border: 'none', 
    cursor: 'pointer', 
    padding: '0.5rem'
  };

  return (
    <nav className="navbar">
      <div className="navbar-content container" style={{ padding: '0.5rem 1rem' }}>
        <Link to="/" className="navbar-brand">
          <img src={logo} alt="AB Logo" className="brand-logo-img" />
          <span className="brand-text">tracker</span>
        </Link>
        
        <div className="navbar-links" style={{ gap: '0.25rem', alignItems: 'center' }}>
          
          {/* Link para o Álbum */}
          <Link to="/album" style={navItemStyle} className="hover:opacity-80 transition-opacity">
            <Image size={18}/> <span>Álbum</span>
          </Link>

          {/* NOVO: Link para a Liga dos Copos (Noitadas) */}
          <Link to="/night" style={navItemStyle} className="hover:opacity-80 transition-opacity">
            <Beer size={18}/> <span className="hidden sm:inline">Copos</span>
          </Link>

          {session ? (
            <>
              <Link to="/" style={navItemStyle} className="hover:opacity-80 transition-opacity">
                <LayoutDashboard size={18}/> <span className="hidden sm:inline">Dashboard</span>
              </Link>

              {/* Link para Gestão de Membros */}
              <Link to="/members" style={navItemStyle} className="hover:opacity-80 transition-opacity">
                <Users size={18}/> <span className="hidden sm:inline">Membros</span>
              </Link>

              <Link to="/create" className="btn-new-event" style={{ marginLeft: '0.5rem', marginRight: '0.5rem' }}>
                <PlusCircle size={18}/> <span className="hidden sm:inline">Novo</span>
              </Link>
              
              <button onClick={handleLogout} style={navItemStyle} className="hover:opacity-80 transition-opacity">
                <LogOut size={18}/> <span className="hidden sm:inline">Sair</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-new-event">
               <LogIn size={18}/> Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}