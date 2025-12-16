import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Calendar, Users, Trophy, ChevronDown, Moon, Beer, Plus, RotateCcw } from 'lucide-react';

const GROUP_MEMBERS = [
  "Paiva", "André Nuno", "André Carvalho", "Gui Costa",
  "Didi", "JP", "Emídio", "Pedro",
  "Passinhas", "Adri", "Edu", "Gustavo"
];

export default function Dashboard({ session }) {
  const [events, setEvents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [allMembers, setAllMembers] = useState([]); 
  const [visibleCount, setVisibleCount] = useState(9);
  
  // Estados para o Gustavo
  const [gustavoHours, setGustavoHours] = useState(0); 
  const [gustavoShots, setGustavoShots] = useState(0); 

  useEffect(() => {
    fetchData();
    fetchFunStats();
  }, []);

  const fetchData = async () => {
    const { data: members } = await supabase.from('members').select('*').order('name');
    const memberNames = members ? members.map(m => m.name) : [];
    if (members) setAllMembers(members);

    const { data: eventsData } = await supabase
      .from('events')
      .select('*, attendees(name, status)') 
      .order('event_date', { ascending: false });
      
    if (eventsData) {
      setEvents(eventsData);
      calculateLeaderboard(eventsData, memberNames.length > 0 ? memberNames : GROUP_MEMBERS);
    }
  };

  const fetchFunStats = async () => {
    const { data } = await supabase.from('fun_stats').select('id, value');
    if (data) {
      const hours = data.find(i => i.id === 'gustavo_hours')?.value || 0;
      const shots = data.find(i => i.id === 'gustavo_shots')?.value || 0;
      setGustavoHours(hours);
      setGustavoShots(shots);
    }
  };

  const handleAction = async (action) => {
    if (!session) return;

    let newHours = gustavoHours;
    let newShots = gustavoShots;

    if (action === 'SLEEP') {
      newHours += 1;
    } else if (action === 'DRINK') {
      if (newHours > 0) newHours -= 1;
      newShots += 1;
    } else if (action === 'UNDO_SLEEP') {
       newHours -= 1;
    } else if (action === 'UNDO_DRINK') {
       newHours += 1;
       newShots -= 1;
    }

    setGustavoHours(newHours);
    setGustavoShots(newShots);

    await supabase.from('fun_stats').upsert([
      { id: 'gustavo_hours', value: newHours },
      { id: 'gustavo_shots', value: newShots }
    ]);
  };

  const calculateLeaderboard = (eventsData, allMemberNames) => {
    const counts = {};
    allMemberNames.forEach(name => counts[name] = 0);
    eventsData.forEach(event => {
      if (event.attendees) {
        event.attendees.forEach(att => {
          if (att.status === 'Presente') counts[att.name] = (counts[att.name] || 0) + 1;
        });
      }
    });
    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    setLeaderboard(sorted);
  };

  const loadMore = () => setVisibleCount(prev => prev + 9);
  
  const getInitials = (n) => {
    const names = n.trim().split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };
  const getAvatarColor = (n) => ['#fee2e2', '#e0e7ff', '#d1fae5', '#fef3c7', '#fae8ff', '#ecfeff'][n.length % 6];
  const getAvatarTextColor = (n) => ['#ef4444', '#4f46e5', '#10b981', '#d97706', '#d946ef', '#0891b2'][n.length % 6];

  return (
    <div className="container">
      <style>{`
        .member-link-item:hover { background-color: #f8fafc; transform: translateX(4px); }
        
        /* ESTILO DOS CARTÕES */
        .counter-card {
            position: relative;
            overflow: hidden;
            border-radius: 1rem;
            padding: 1rem; /* Compacto */
            color: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        
        .bg-sleep { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
        .bg-shots { background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); }
        
        .counter-value { font-size: 2.5rem; font-weight: 800; line-height: 1; }
        .counter-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9; font-weight: bold; margin-bottom: 0.5rem;}
        
        /* Ícone de fundo subtil */
        .icon-bg { position: absolute; right: -10px; bottom: -10px; opacity: 0.15; transform: rotate(-15deg); }

        /* BOTÕES ESTILIZADOS MAS PEQUENOS */
        .btn-glass-small {
            background: rgba(255, 255, 255, 0.25);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 0.4rem 0.8rem;
            border-radius: 0.5rem;
            font-weight: 600;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 0.4rem;
        }
        .btn-glass-small:hover {
            background: rgba(255, 255, 255, 0.4);
            transform: translateY(-1px);
        }
        .btn-glass-small:active {
            transform: scale(0.98);
        }

        .btn-icon-only {
            padding: 0.4rem;
            background: rgba(0,0,0,0.15);
            border: none;
            border-radius: 0.5rem;
            color: rgba(255,255,255,0.8);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        .btn-icon-only:hover {
            background: rgba(0,0,0,0.3);
            color: white;
        }
      `}</style>

      <div className="dashboard-grid">
        
        {/* COLUNA 1: Tabela + CONTADORES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Tabela de Assiduidade */}
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
                          <td className="p-4 font-medium text-slate-800 text-sm">{badge} {item.name}</td>
                          <td className="p-4 text-center font-bold" style={{ color: 'var(--color-primary)' }}>{item.count}</td>
                          <td className="p-4 text-center text-slate-500 text-xs">{percentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* CONTADORES GUSTAVO */}
          <div>
            {/* TÍTULO COM MARGIN BOTTOM (Separado das boxs) */}
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-800 border-b border-slate-200 pb-2">
              😴 Banco do Gustavo
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                
                {/* 1. CARTÃO SONO */}
                <div className="counter-card bg-sleep">
                    <Moon size={60} className="icon-bg" />
                    
                    <div className="z-10">
                        <div className="counter-label">Dívida (Horas)</div>
                        <div className="counter-value">{gustavoHours}h</div>
                    </div>
                    
                    {session && (
                        <div className="mt-4 flex gap-2 z-10">
                             <button onClick={() => handleAction('SLEEP')} className="btn-glass-small" style={{ flex: 1, justifyContent: 'center' }}>
                                <Plus size={16} /> Dormiu
                             </button>
                             <button onClick={() => handleAction('UNDO_SLEEP')} className="btn-icon-only" title="Corrigir (-1)">
                                <RotateCcw size={14} />
                             </button>
                        </div>
                    )}
                </div>

                {/* 2. CARTÃO SHOTS */}
                <div className="counter-card bg-shots">
                    <Beer size={60} className="icon-bg" />
                    
                    <div className="z-10">
                        <div className="counter-label">Shots Pagos</div>
                        <div className="counter-value">{gustavoShots}</div>
                    </div>

                    {session && (
                        <div className="mt-4 flex gap-2 z-10">
                             <button onClick={() => handleAction('DRINK')} className="btn-glass-small" style={{ flex: 1, justifyContent: 'center' }}>
                                <Plus size={16} /> Shot
                             </button>
                             <button onClick={() => handleAction('UNDO_DRINK')} className="btn-icon-only" title="Corrigir (-1)">
                                <RotateCcw size={14} />
                             </button>
                        </div>
                    )}
                </div>

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
                  {event.photos && event.photos[0] && (<img src={event.photos[0]} alt="capa" className="event-card-image" />)}
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
              <button onClick={loadMore} className="btn-primary" style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '2rem', paddingRight: '2rem' }}>Ver Mais Eventos <ChevronDown size={18}/></button>
            </div>
          )}
        </div>

        {/* COLUNA 3: Lista de Membros */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="text-blue-500" /> Membros
          </h2>
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden p-4">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {allMembers.map((member) => (
                <Link 
                  key={member.id} 
                  to={`/profile/${member.name}`}
                  className="member-link-item"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    textDecoration: 'none', color: '#1f2937', padding: '0.5rem',
                    borderRadius: '0.5rem', transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '50px', height: '50px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: getAvatarColor(member.name), color: getAvatarTextColor(member.name),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', fontWeight: '800'
                  }}>
                    {getInitials(member.name)}
                  </div>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{member.name}</span>
                </Link>
              ))}
              {allMembers.length === 0 && <p className="text-center text-xs text-slate-400 p-2">A carregar...</p>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}