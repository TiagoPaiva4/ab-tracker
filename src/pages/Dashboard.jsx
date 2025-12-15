import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Calendar, Users, Trophy } from 'lucide-react';

// A mesma lista para garantir que todos aparecem, mesmo com 0 presenças
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
    // 1. Alterámos aqui para trazer o 'name' dentro de attendees
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
    // Inicializar contadores a 0 para toda a gente
    const counts = {};
    GROUP_MEMBERS.forEach(member => counts[member] = 0);

    // Percorrer todos os eventos e somar presenças
    eventsData.forEach(event => {
      if (event.attendees) {
        event.attendees.forEach(att => {
          // Se o nome estiver na nossa lista e o status for Presente, soma +1
          if (att.status === 'Presente') {
            // Nota: Se alguém escrever um nome diferente manualmente, 
            // podemos usar (counts[att.name] || 0) + 1 para apanhar também.
            // Aqui forçamos a somar aos membros conhecidos ou cria novo se não existir.
            counts[att.name] = (counts[att.name] || 0) + 1;
          }
        });
      }
    });

    // Converter objeto em array e ordenar (quem tem mais fica em cima)
    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    setLeaderboard(sorted);
  };

  return (
    <div className="container">
      
      {/* Secção 1: Tabela de Presenças (Ranking) */}
      <div className="mb-8">
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
                  <th className="p-4 font-bold text-center">% Assiduidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.map((item, index) => {
                  // Cálculo simples da percentagem (presenças / total de eventos)
                  const totalEvents = events.length || 1; 
                  const percentage = Math.round((item.count / totalEvents) * 100);
                  
                  // Destaque para o Top 3
                  let rowClass = "hover:bg-slate-50 transition";
                  let badge = null;
                  if (index === 0) badge = "🥇";
                  else if (index === 1) badge = "🥈";
                  else if (index === 2) badge = "🥉";

                  return (
                    <tr key={item.name} className={rowClass}>
                      <td className="p-4 font-medium text-slate-800">
                        {badge} {item.name}
                      </td>
                      <td className="p-4 text-center font-bold text-indigo-600">
                        {item.count}
                      </td>
                      <td className="p-4 text-center text-slate-500 text-sm">
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

      {/* Secção 2: Lista de Eventos (O que já tinhas) */}
      <h1 className="text-2xl font-bold mb-6 mt-10">Eventos Recentes</h1>
      <div className="events-grid">
        {events.map((event) => {
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

                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.25rem', 
                    backgroundColor: '#e0e7ff', color: 'var(--color-primary)', 
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
  );
}