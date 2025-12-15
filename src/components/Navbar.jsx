import { Link, useNavigate } from 'react-router-dom';
import { LogOut, PlusCircle, LayoutDashboard, LogIn, Image } from 'lucide-react';
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
      <div className="navbar-content container" style={{ padding: '0.5rem 1rem' }}>
        {/* LOGO */}
        <Link to="/" className="navbar-brand">
          <img src={logo} alt="AB Logo" className="brand-logo-img" />
          <span className="brand-text">tracker</span>
        </Link>
        
        <div className="navbar-links" style={{ gap: '0.5rem' }}>
          
          {/* BOTÃO ÁLBUM (Visível em Mobile e Desktop) */}
          <Link 
            to="/album" 
            className="navbar-link" 
            style={{ 
              color: 'white',
              textDecoration: 'none',
              opacity: 1,
              fontWeight: 'bold',
              marginRight: '0.5rem', // Reduzi um pouco a margem
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Image size={18}/> 
            {/* Removi o 'hidden sm:inline' - Agora o texto aparece sempre */}
            <span>Álbum</span>
          </Link>

          {session ? (
            <>
              {/* Dashboard e Novo Evento escondem texto no mobile para poupar espaço */}
              <Link to="/" className="navbar-link">
                <LayoutDashboard size={18}/> <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <Link to="/create" className="btn-new-event">
                <PlusCircle size={18}/> <span className="hidden sm:inline">Novo</span>
              </Link>
              
              <button onClick={handleLogout} className="btn-logout">
                <LogOut size={18}/>
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