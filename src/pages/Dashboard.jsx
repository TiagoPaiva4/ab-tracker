import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Calendar, Users, Trophy, ChevronDown } from 'lucide-react';

const GROUP_MEMBERS = [
  "Paiva", "André Nuno", "André Carvalho", "Gui Costa",
  "Didi", "JP", "Emídio", "Pedro",
  "Passinhas", "Adri", "Edu", "Gustavo"
];

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [allMembers, setAllMembers] = useState([]); // Nova lista para a barra lateral
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // 1. Buscar membros (para o Ranking e para a Lista Lateral)
    const { data: members } = await supabase.from('members').select('*').order('name');
    const memberNames = members ? members.map(m => m.name) : [];
    
    if (members) setAllMembers(members); // Guardar a lista completa com IDs

    // 2. Buscar Eventos e Participantes
    const { data: eventsData } = await supabase
      .from('events')
      .select('*, attendees(name, status)') 
      .order('event_date', { ascending: false });
      
    if (eventsData) {
      setEvents(eventsData);
      calculateLeaderboard(eventsData, memberNames.length > 0 ? memberNames : GROUP_MEMBERS);
    }
  };

  const calculateLeaderboard = (eventsData, allMemberNames) => {
    const counts = {};
    allMemberNames.forEach(name => counts[name] = 0);

    eventsData.forEach(event => {
      if (event.attendees) {
        event.attendees.forEach(att => {
          if (att.status === 'Presente') {
            counts[att.name] = (counts[att.name] || 0) + 1;
          }
        });
      }
    });

    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    setLeaderboard(sorted);
  };

  const loadMore = () => {
    setVisibleCount(prev => prev + 9);
  };

  // Funções Visuais para os Avatares (Iguais às outras páginas)
  const getInitials = (n) => {
    const names = n.trim().split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const getAvatarColor = (n) => {
    const colors = ['#fee2e2', '#e0e7ff', '#d1fae5', '#fef3c7', '#fae8ff', '#ecfeff'];
    return colors[n.length % colors.length];
  };

  const getAvatarTextColor = (n) => {
    const colors = ['#ef4444', '#4f46e5', '#10b981', '#d97706', '#d946ef', '#0891b2'];
    return colors[n.length % colors.length];
  };

  return (
    <div className="container">
      <div className="dashboard-grid">
        
        {/* COLUNA 1: Tabela de Ranking */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-500" /> Tabela de Assiduidade
          </h2>
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
                    <th className="p-4 font-bold">Membro</th>
                    <th className="p-4 font-bold text-center">Presenças</th>
                    <th className="p-4 font-bold text-center">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderboard.map((item, index) => {
                    const totalEvents = events.length || 1; 
                    const percentage = Math.round((item.count / totalEvents) * 100);
                    let rowClass = "hover:bg-slate-50 transition";
                    let badge = null;
                    if (index === 0) badge = "🥇"; else if (index === 1) badge = "🥈"; else if (index === 2) badge = "🥉";

                    return (
                      <tr key={item.name} className={rowClass}>
                        <td className="p-4 font-medium text-slate-800 text-sm">
                          {badge} {item.name}
                        </td>
                        <td className="p-4 text-center font-bold" style={{ color: 'var(--color-primary)' }}>
                          {item.count}
                        </td>
                        <td className="p-4 text-center text-slate-500 text-xs">
                          {percentage}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* COLUNA 2: Lista de Eventos */}
        <div>
          <h1 className="text-2xl font-bold mb-6">Eventos Recentes</h1>
          <div className="events-grid">
            {events.slice(0, visibleCount).map((event) => {
              const presentCount = event.attendees ? event.attendees.filter(a => a.status === 'Presente').length : 0;
              return (
                <div key={event.id} className="event-card">
                  {event.photos && event.photos[0] && (
                      <img src={event.photos[0]} alt="capa" className="event-card-image" />
                  )}
                  <div className="event-card-content">
                    <h3 className="event-card-title">{event.title}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div className="event-card-date" style={{ marginBottom: 0 }}>
                        <Calendar size={16} className="mr-2" />
                        {new Date(event.event_date).toLocaleDateString('pt-PT')}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        <Users size={14} /><span>{presentCount}</span>
                      </div>
                    </div>
                    <Link to={`/event/${event.id}`} className="btn-details">Ver Detalhes</Link>
                  </div>
                </div>
              );
            })}
          </div>
          {visibleCount < events.length && (
            <div className="text-center mt-8">
              <button onClick={loadMore} className="btn-primary" style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
                Ver Mais Eventos <ChevronDown size={18}/>
              </button>
            </div>
          )}
        </div>

        {/* COLUNA 3: Lista de Membros (NOVA) */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="text-blue-500" /> Membros
          </h2>
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden p-2">
            <div className="flex flex-col gap-1">
              {allMembers.map((member) => (
                <Link 
                  key={member.id} 
                  to={`/profile/${member.name}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 hover:text-slate-900 no-underline"
                >
                  {/* Avatar Pequeno */}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: getAvatarColor(member.name), color: getAvatarTextColor(member.name),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: '800'
                  }}>
                    {getInitials(member.name)}
                  </div>
                  
                  {/* Nome */}
                  <span className="font-medium text-sm truncate">{member.name}</span>
                </Link>
              ))}
              
              {allMembers.length === 0 && (
                <p className="text-center text-xs text-slate-400 p-2">A carregar...</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}