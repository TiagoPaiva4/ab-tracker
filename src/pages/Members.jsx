import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom'; // Importar Link
import { Users, Trash2, UserPlus } from 'lucide-react';

export default function Members({ session }) {
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data, error } = await supabase.from('members').select('*').order('name');
    if (error) console.error('Erro:', error);
    else setMembers(data);
    setLoading(false);
  };

  const addMember = async (e) => {
    e.preventDefault();
    if (!newMember.trim()) return;

    const { error } = await supabase.from('members').insert([{ name: newMember.trim() }]);

    if (error) {
      alert('Erro ao adicionar: ' + error.message);
    } else {
      setNewMember('');
      fetchMembers();
    }
  };

  const deleteMember = async (id) => {
    if (!window.confirm('Tens a certeza? Isto remove o membro da lista de seleção futura.')) return;

    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) alert('Erro ao apagar: ' + error.message);
    else fetchMembers();
  };

  const getInitials = (name) => {
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ['#fee2e2', '#e0e7ff', '#d1fae5', '#fef3c7', '#fae8ff', '#ecfeff'];
    return colors[name.length % colors.length];
  };

  const getAvatarTextColor = (name) => {
    const colors = ['#ef4444', '#4f46e5', '#10b981', '#d97706', '#d946ef', '#0891b2'];
    return colors[name.length % colors.length];
  };

  if (!session) return <div className="text-center py-10">Acesso restrito a Admin.</div>;

  return (
    <div className="container">
      {/* Estilos locais */}
      <style>{`
        .member-card {
          position: relative;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .member-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .btn-delete-member {
          position: absolute;
          top: 10px;
          right: 10px;
          background: white;
          border: 1px solid #fee2e2;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef4444;
          cursor: pointer;
          transition: all 0.2s;
          opacity: 0;
          transform: scale(0.8);
          z-index: 10; /* Garante que fica por cima do link */
        }
        @media (max-width: 768px) {
            .btn-delete-member { opacity: 1; transform: scale(1); }
        }
        .member-card:hover .btn-delete-member {
          opacity: 1;
          transform: scale(1);
        }
        .btn-delete-member:hover {
          background-color: #ef4444;
          color: white;
          border-color: #ef4444;
        }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Cabeçalho e Formulário */}
        <div className="mb-12 text-center">
          <h1 className="text-2xl font-bold mb-6 flex items-center justify-center gap-2">
            <Users className="text-yellow-500" /> Gestão de Equipa
          </h1>

          <form onSubmit={addMember} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-2 max-w-md mx-auto">
            <input 
              className="input-field" 
              style={{ marginBottom: 0, flexGrow: 1, border: 'none', background: '#f9fafb' }}
              placeholder="Nome do novo membro..." 
              value={newMember}
              onChange={e => setNewMember(e.target.value)}
            />
            <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={18} /> <span className="hidden sm:inline">Adicionar</span>
            </button>
          </form>
        </div>

        {/* Grelha de Membros */}
        {loading ? (
          <p className="text-center text-slate-400">A carregar a equipa...</p>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
            gap: '1.5rem',
            marginTop: '30px'
          }}>
            {members.map(member => (
              <Link 
                to={`/profile/${member.name}`}
                key={member.id} 
                className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center member-card cursor-pointer no-underline"
              >
                
                {/* Avatar */}
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: getAvatarColor(member.name),
                  color: getAvatarTextColor(member.name),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: '800',
                  marginBottom: '1rem',
                  letterSpacing: '0.05em'
                }}>
                  {getInitials(member.name)}
                </div>

                {/* Nome */}
                <span className="font-bold text-slate-700 text-center">{member.name}</span>

                {/* Botão de Apagar (com preventDefault para não abrir o perfil) */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deleteMember(member.id);
                  }}
                  className="btn-delete-member"
                  title="Remover"
                >
                  <Trash2 size={16} />
                </button>
              </Link>
            ))}
            
            {members.length === 0 && (
              <div className="col-span-full text-center py-10 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                Ainda não há membros na equipa. Adiciona o primeiro acima!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}