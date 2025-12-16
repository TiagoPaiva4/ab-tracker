import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Calendar, Trophy, Flame, ArrowLeft, History, XCircle, CheckCircle } from 'lucide-react';

export default function MemberProfile() {
  const { name } = useParams(); // Vamos buscar o nome pelo link (URL)
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ total: 0, present: 0, streak: 0, percentage: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemberData();
  }, [name]);

  const fetchMemberData = async () => {
    // 1. Buscar todos os eventos (para ter a ordem cronológica)
    const { data: allEvents } = await supabase
      .from('events')
      .select('id, title, event_date')
      .order('event_date', { ascending: false }); // Do mais recente para o antigo

    // 2. Buscar todas as presenças deste membro
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
    // Criar um mapa rápido: ID do Evento -> Status ("Presente"/"Ausente")
    const attendanceMap = {};
    attendance.forEach(a => attendanceMap[a.event_id] = a.status);

    let streak = 0;
    let streakBroken = false;
    let presentCount = 0;
    const historyList = [];

    events.forEach(event => {
      const status = attendanceMap[event.id] || 'N/A'; // Se não estiver na lista, conta como N/A
      
      // Contar totais
      if (status === 'Presente') presentCount++;

      // Calcular Streak (só conta se for consecutivo a partir de hoje)
      if (!streakBroken) {
        if (status === 'Presente') {
          streak++;
        } else {
          // Se faltou ou não estava inscrito no evento mais recente, quebra a streak
          streakBroken = true;
        }
      }

      // Adicionar ao histórico visual
      historyList.push({
        event: event.title,
        date: event.event_date,
        status: status
      });
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
    <div className="container" style={{ maxWidth: '800px' }}>
      
      {/* Botão Voltar */}
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition font-medium">
        <ArrowLeft size={20} /> Voltar
      </button>

      {/* Cartão de Perfil */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden mb-8">
        <div className="bg-slate-50 p-8 flex flex-col items-center border-b border-slate-100">
          
          {/* Avatar Grande */}
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
        <div className="grid grid-cols-3 divide-x divide-slate-100">
          <div className="p-6 text-center">
            <div className="flex justify-center mb-2 text-yellow-500"><Trophy size={28} /></div>
            <div className="text-2xl font-bold text-slate-800">{stats.present}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Presenças</div>
          </div>
          
          <div className="p-6 text-center">
            <div className="flex justify-center mb-2 text-orange-500"><Flame size={28} /></div>
            <div className="text-2xl font-bold text-slate-800">{stats.streak}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Streak Atual</div>
          </div>

          <div className="p-6 text-center">
            <div className="flex justify-center mb-2 text-blue-500"><History size={28} /></div>
            <div className="text-2xl font-bold text-slate-800">{stats.percentage}%</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Assiduidade</div>
          </div>
        </div>
      </div>

      {/* Histórico de Eventos */}
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Calendar className="text-slate-400" /> Histórico de Eventos
      </h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {history.map((item, index) => (
            <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
              <div>
                <p className="font-semibold text-slate-700">{item.event}</p>
                <p className="text-sm text-slate-400">{new Date(item.date).toLocaleDateString('pt-PT')}</p>
              </div>
              
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                item.status === 'Presente' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-50 text-red-400'
              }`}>
                {item.status === 'Presente' ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                {item.status === 'N/A' ? 'Não Registado' : item.status}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}