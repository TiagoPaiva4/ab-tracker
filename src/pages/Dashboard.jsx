import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Calendar, Users, Trophy } from 'lucide-react';

const GROUP_MEMBERS = [
  "Paiva", "André Nuno", "André Carvalho", "Gui Costa",
  "Didi", "JP", "Emídio", "Pedro",
  "Passinhas", "Adri", "Edu", "Gustavo"
];

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*, attendees(name, status)') 
      .order('event_date', { ascending: false });
      
    if (data) {
      setEvents(data);
      calculateLeaderboard(data);
    }
  };

  const calculateLeaderboard = (eventsData) => {
    const counts = {};
    // Inicializar a zero
    GROUP_MEMBERS.forEach(member => counts[member] = 0);

    // Contar presenças
    eventsData.forEach(event => {
      if (event.attendees) {
        event.attendees.forEach(att => {
          if (att.status === 'Presente') {
            counts[att.name] = (counts[att.name] || 0) + 1;
          }
        });
      }
    });

    // Ordenar
    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    setLeaderboard(sorted);
  };

  return (
    <div className="container">
      
      {/* WRAPPER NOVO: Controla o layout Esquerda/Direita via CSS (dashboard-grid) */}
      <div className="dashboard-grid">

        {/* COLUNA ESQUERDA: Tabela de Assiduidade */}
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
                    // Medalhas para o Top 3
                    if (index === 0) badge = "🥇";
                    else if (index === 1) badge = "🥈";
                    else if (index === 2) badge = "🥉";

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

        {/* COLUNA DIREITA: Lista de Eventos */}
        <div>
          <h1 className="text-2xl font-bold mb-6">Eventos Recentes</h1>
          <div className="events-grid">
            {events.map((event) => {
              // Contar quantos estão "Presente" neste evento
              const presentCount = event.attendees 
                ? event.attendees.filter(a => a.status === 'Presente').length 
                : 0;

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

                      {/* Contador de Presenças com a cor do tema */}
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.25rem', 
                        backgroundColor: 'var(--color-primary-light)', // Vermelho claro do tema
                        color: 'var(--color-primary)', // Vermelho escuro do tema
                        padding: '0.25rem 0.5rem', borderRadius: '999px',
                        fontSize: '0.75rem', fontWeight: 'bold'
                      }}>
                        <Users size={14} />
                        <span>{presentCount}</span>
                      </div>
                    </div>

                    <Link to={`/event/${event.id}`} className="btn-details">
                      Ver Detalhes
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}