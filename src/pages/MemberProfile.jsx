import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Calendar, Trophy, Flame, ArrowLeft, History, CheckCircle } from 'lucide-react';

export default function MemberProfile() {
  const { name } = useParams();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ total: 0, present: 0, streak: 0, percentage: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemberData();
  }, [name]);

  const fetchMemberData = async () => {
    // 1. Buscar eventos com FOTOS
    const { data: allEvents } = await supabase
      .from('events')
      .select('id, title, event_date, photos')
      .order('event_date', { ascending: false });

    // 2. Buscar presenças
    const { data: memberAttendance } = await supabase
      .from('attendees')
      .select('event_id, status')
      .eq('name', name);

    if (allEvents && memberAttendance) {
      processStats(allEvents, memberAttendance);
    }
    setLoading(false);
  };

  const processStats = (events, attendance) => {
    const attendanceMap = {};
    attendance.forEach(a => attendanceMap[a.event_id] = a.status);

    let streak = 0;
    let streakBroken = false;
    let presentCount = 0;
    const historyList = [];

    events.forEach(event => {
      const status = attendanceMap[event.id] || 'N/A'; 
      
      // Calcular estatísticas (baseado em TODOS os eventos)
      if (status === 'Presente') presentCount++;

      if (!streakBroken) {
        if (status === 'Presente') {
          streak++;
        } else {
          streakBroken = true;
        }
      }

      // FILTRO: Só adicionar à lista visual se estiver "Presente"
      if (status === 'Presente') {
        historyList.push({
          id: event.id,
          title: event.title,
          date: event.event_date,
          photos: event.photos,
          status: status
        });
      }
    });

    setStats({
      total: events.length,
      present: presentCount,
      percentage: events.length > 0 ? Math.round((presentCount / events.length) * 100) : 0,
      streak: streak
    });

    setHistory(historyList);
  };

  // Funções Visuais (Avatar)
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

  if (loading) return <div className="text-center py-10">A carregar perfil...</div>;

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      
      <style>{`
        .btn-back {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: var(--color-text-light);
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 1.5rem;
          padding: 0.5rem 0;
        }
        .btn-back:hover {
          color: var(--color-primary);
          transform: translateX(-3px);
        }
        .stats-container {
            display: flex;
            width: 100%;
            justify-content: space-around;
            padding: 1rem 0;
        }
        .stat-item {
            text-align: center;
            flex: 1;
            padding: 0 1rem;
            border-right: 1px solid #f1f5f9;
        }
        .stat-item:last-child {
            border-right: none;
        }
      `}</style>

      {/* Botão Voltar */}
      <button onClick={() => navigate(-1)} className="btn-back">
        <ArrowLeft size={20} /> Voltar
      </button>

      {/* Cartão de Perfil */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden mb-10">
        <div className="bg-slate-50 p-8 flex flex-col items-center border-b border-slate-100">
          
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            backgroundColor: getAvatarColor(name), color: getAvatarTextColor(name),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            {getInitials(name)}
          </div>
          
          <h1 className="text-3xl font-bold text-slate-800">{name}</h1>
          <p className="text-slate-500 font-medium">Membro do Grupo</p>
        </div>

        {/* Estatísticas */}
        <div className="stats-container">
          <div className="stat-item">
            <div className="flex justify-center mb-2 text-yellow-500"><Trophy size={28} /></div>
            <div className="text-2xl font-bold text-slate-800">{stats.present}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Presenças</div>
          </div>
          
          <div className="stat-item">
            <div className="flex justify-center mb-2 text-orange-500"><Flame size={28} /></div>
            <div className="text-2xl font-bold text-slate-800">{stats.streak}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Streak Atual</div>
          </div>

          <div className="stat-item">
            <div className="flex justify-center mb-2 text-blue-500"><History size={28} /></div>
            <div className="text-2xl font-bold text-slate-800">{stats.percentage}%</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Assiduidade</div>
          </div>
        </div>
      </div>

      {/* Histórico de Eventos (FILTRADO: Só mostra "Presente") */}
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Calendar className="text-slate-400" /> Eventos Participados
      </h2>
      
      {history.length > 0 ? (
        <div className="events-grid">
          {history.map((event) => (
            <div key={event.id} className="event-card">
              
              {/* Imagem do Evento */}
              {event.photos && event.photos[0] && (
                  <img src={event.photos[0]} alt="capa" className="event-card-image" />
              )}
              
              <div className="event-card-content">
                <h3 className="event-card-title">{event.title}</h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div className="event-card-date" style={{ marginBottom: 0 }}>
                    <Calendar size={16} className="mr-2" />
                    {new Date(event.date).toLocaleDateString('pt-PT')}
                  </div>

                  {/* Badge de Status (Sempre Verde agora, pois só mostramos os presentes) */}
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.25rem', 
                    backgroundColor: '#d1fae5', 
                    color: '#065f46', 
                    padding: '0.25rem 0.75rem', borderRadius: '999px',
                    fontSize: '0.75rem', fontWeight: 'bold'
                  }}>
                    <CheckCircle size={14}/>
                    <span>Presente</span>
                  </div>
                </div>

                <Link to={`/event/${event.id}`} className="btn-details">
                  Ver Detalhes do Evento
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-slate-400 py-10">Este membro ainda não participou em nenhum evento.</p>
      )}
    </div>
  );
}