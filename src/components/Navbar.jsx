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

  // Estilo partilhado para os links de texto (Album, Dashboard, Sair)
  // Isto garante que todos ficam iguais (Branco, Bold, Alinhados)
  const navItemStyle = {
    color: 'white',
    textDecoration: 'none',
    fontWeight: '700', // Bold para destacar no vermelho
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
        
        {/* LOGO */}
        <Link to="/" className="navbar-brand">
          <img src={logo} alt="AB Logo" className="brand-logo-img" />
          <span className="brand-text">tracker</span>
        </Link>
        
        <div className="navbar-links" style={{ gap: '0.25rem', alignItems: 'center' }}>
          
          {/* 1. ÁLBUM (Visível sempre) */}
          <Link to="/album" style={navItemStyle} className="hover:opacity-80 transition-opacity">
            <Image size={18}/> 
            <span>Álbum</span>
          </Link>

          {session ? (
            <>
              {/* 2. DASHBOARD (Agora com o mesmo estilo do Álbum) */}
              <Link to="/" style={navItemStyle} className="hover:opacity-80 transition-opacity">
                <LayoutDashboard size={18}/> 
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              {/* 3. NOVO EVENTO (Botão de Destaque - Fundo Branco) */}
              <Link to="/create" className="btn-new-event" style={{ marginLeft: '0.5rem', marginRight: '0.5rem' }}>
                <PlusCircle size={18}/> 
                <span className="hidden sm:inline">Novo</span>
              </Link>
              
              {/* 4. SAIR (Agora com texto e alinhado) */}
              <button onClick={handleLogout} style={navItemStyle} className="hover:opacity-80 transition-opacity">
                <LogOut size={18}/>
                <span className="hidden sm:inline">Sair</span>
              </button>
            </>
          ) : (
            /* LOGIN (Botão Branco) */
            <Link to="/login" className="btn-new-event">
               <LogIn size={18}/> Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}