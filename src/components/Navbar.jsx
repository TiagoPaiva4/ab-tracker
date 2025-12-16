import { Link, useNavigate } from 'react-router-dom';
import { LogOut, PlusCircle, LogIn, Image, Users, Beer } from 'lucide-react'; 
import { supabase } from '../lib/supabaseClient';
import logo from '../assets/logo-ab.png';

export default function Navbar({ session }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Erro ao sair:', error);
    navigate('/login');
    window.location.reload(); 
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
      {/* Padding ajustado para alinhar com o conteúdo da página */}
      <div className="navbar-content container" style={{ padding: '0.5rem 1.5rem' }}>
        
        {/* LOGÓTIPO: Agora visível em todos os ecrãs */}
        <Link to="/" className="navbar-brand">
          <img src={logo} alt="AB Logo" className="brand-logo-img" />
          <span className="brand-text">tracker</span>
        </Link>
        
        {/* LINKS: Alinhados à direita automaticamente pelo CSS flexbox */}
        <div className="navbar-links" style={{ gap: '0.25rem', alignItems: 'center' }}>
          
          <Link to="/album" style={navItemStyle} className="hover:opacity-80 transition-opacity">
            <Image size={18}/> <span>Álbum</span>
          </Link>

          <Link to="/night" style={navItemStyle} className="hover:opacity-80 transition-opacity">
            <Beer size={18}/> <span className="hidden sm:inline">Noites</span>
          </Link>

          {session ? (
            <>
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