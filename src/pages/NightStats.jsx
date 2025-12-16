import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Beer, Plus, Calendar, Trash2, ChevronDown, ChevronUp, Minus } from 'lucide-react';

export default function NightStats({ session }) {
  const [nights, setNights] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [members, setMembers] = useState([]);
  
  // Criar nova saída
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Controlo de UI
  const [expandedNight, setExpandedNight] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // 1. Buscar Membros (para saber quem pode beber)
    const { data: memberData } = await supabase.from('members').select('name').order('name');
    setMembers(memberData || []);

    // 2. Buscar Histórico de Noitadas e Bebidas
    const { data: nightsData } = await supabase
      .from('night_outs')
      .select('*, night_entries(name, drinks)')
      .order('night_date', { ascending: false });

    if (nightsData) {
      setNights(nightsData);
      calculateLeaderboard(nightsData);
    }
  };

  const calculateLeaderboard = (data) => {
    const counts = {};
    // Buscar todos os drinks de todas as noites
    data.forEach(night => {
      if (night.night_entries) {
        night.night_entries.forEach(entry => {
          counts[entry.name] = (counts[entry.name] || 0) + entry.drinks;
        });
      }
    });

    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // Ordenar por quem bebeu mais

    setLeaderboard(sorted);
  };

  const createNight = async (e) => {
    e.preventDefault();
    if (!session || !newTitle) return;

    const { data, error } = await supabase
      .from('night_outs')
      .insert([{ title: newTitle, night_date: newDate || new Date() }])
      .select()
      .single();

    if (!error) {
      // Inicializar todos os membros com 0 bebidas para facilitar
      const entries = members.map(m => ({ night_out_id: data.id, name: m.name, drinks: 0 }));
      await supabase.from('night_entries').insert(entries);
      
      setNewTitle('');
      setNewDate('');
      setIsCreating(false);
      fetchData();
    }
  };

  const deleteNight = async (id) => {
    if (!confirm('Apagar esta saída?')) return;
    await supabase.from('night_outs').delete().eq('id', id);
    fetchData();
  };

  const updateDrinks = async (nightId, memberName, currentDrinks, delta) => {
    if (!session) return;
    
    // Calcular novo valor (nunca negativo)
    const newAmount = Math.max(0, currentDrinks + delta);

    // Atualizar UI Localmente (Optimistic Update)
    const updatedNights = nights.map(n => {
      if (n.id === nightId) {
        const updatedEntries = n.night_entries.map(e => 
          e.name === memberName ? { ...e, drinks: newAmount } : e
        );
        return { ...n, night_entries: updatedEntries };
      }
      return n;
    });
    setNights(updatedNights);
    calculateLeaderboard(updatedNights); // Recalcular ranking em tempo real

    // Atualizar na Base de Dados
    // Primeiro verificamos se já existe entrada
    const { data: existing } = await supabase.from('night_entries').select('id').eq('night_out_id', nightId).eq('name', memberName).single();
    
    if (existing) {
      await supabase.from('night_entries').update({ drinks: newAmount }).eq('id', existing.id);
    } else {
      await supabase.from('night_entries').insert({ night_out_id: nightId, name: memberName, drinks: newAmount });
    }
  };

  const getMedal = (index) => {
    if (index === 0) return '👑'; // Rei do Copo
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="container">
      <style>{`
        .glass-panel { background: white; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0; }
        .night-card { background: white; border-radius: 0.75rem; border: 1px solid #e2e8f0; padding: 1rem; margin-bottom: 0.75rem; transition: all 0.2s; }
        .night-card:hover { border-color: #cbd5e1; }
        .drink-btn { width: 28px; height: 28px; border-radius: 6px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; font-weight: bold; transition: 0.2s; }
        .btn-plus { background: #dbeafe; color: #2563eb; } .btn-plus:hover { background: #2563eb; color: white; }
        .btn-minus { background: #f1f5f9; color: #64748b; } .btn-minus:hover { background: #cbd5e1; }
      `}</style>

      {/* TÍTULO */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-slate-800 flex items-center justify-center gap-2">
          <Beer size={32} className="text-amber-500" /> Liga dos Copos
        </h1>
        <p className="text-slate-500">Registo oficial de jantares e noitadas</p>
      </div>

      {/* RANKING (REI DO COPO) */}
      <div className="mb-10">
        <h2 className="text-lg font-bold mb-4 text-slate-700">🏆 Classificação Geral</h2>
        <div className="glass-panel p-4">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {leaderboard.length > 0 ? leaderboard.map((item, index) => (
              <div key={item.name} className="flex-shrink-0 flex flex-col items-center p-3 rounded-xl bg-slate-50 min-w-[100px] border border-slate-100">
                <span className="text-2xl mb-1">{getMedal(index)}</span>
                <span className="font-bold text-slate-700 text-sm">{item.name}</span>
                <span className="text-amber-600 font-black text-lg">{item.count} 🍺</span>
              </div>
            )) : <p className="text-slate-400 w-full text-center">Ainda ninguém bebeu...</p>}
          </div>
        </div>
      </div>

      {/* LISTA DE NOITADAS */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-700">📅 Histórico de Saídas</h2>
          {session && (
            <button 
              onClick={() => setIsCreating(!isCreating)} 
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition"
            >
              <Plus size={18} /> Nova Saída
            </button>
          )}
        </div>

        {/* Formulário de Criação */}
        {isCreating && session && (
          <form onSubmit={createNight} className="bg-amber-50 p-4 rounded-xl mb-6 border border-amber-100">
            <div className="flex flex-col gap-3">
              <input 
                placeholder="Título (Ex: Jantar de Natal)" 
                className="p-2 rounded border border-amber-200"
                value={newTitle} onChange={e => setNewTitle(e.target.value)} required
              />
              <input 
                type="date" 
                className="p-2 rounded border border-amber-200"
                value={newDate} onChange={e => setNewDate(e.target.value)} required
              />
              <div className="flex gap-2">
                <button type="submit" className="bg-amber-500 text-white font-bold py-2 px-4 rounded flex-1">Criar</button>
                <button type="button" onClick={() => setIsCreating(false)} className="bg-slate-200 text-slate-600 font-bold py-2 px-4 rounded">Cancelar</button>
              </div>
            </div>
          </form>
        )}

        {/* Lista */}
        <div className="flex flex-col gap-3">
          {nights.map(night => {
            const isExpanded = expandedNight === night.id;
            const totalDrinks = night.night_entries ? night.night_entries.reduce((acc, curr) => acc + curr.drinks, 0) : 0;

            return (
              <div key={night.id} className="night-card">
                {/* Cabeçalho do Cartão */}
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => setExpandedNight(isExpanded ? null : night.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 text-amber-600 p-2.5 rounded-full">
                       <Calendar size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{night.title}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        {new Date(night.night_date).toLocaleDateString('pt-PT')} • 
                        <span className="text-amber-600 font-bold">{totalDrinks} Copos</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-slate-400">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* Conteúdo Expandido (Lista de Quem Bebeu) */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {members.map(member => {
                        // Encontrar a contagem deste membro nesta noite
                        const entry = night.night_entries?.find(e => e.name === member.name);
                        const drinks = entry ? entry.drinks : 0;

                        return (
                          <div key={member.name} className="flex flex-col items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-sm font-bold text-slate-700 mb-2">{member.name}</span>
                            
                            {session ? (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); updateDrinks(night.id, member.name, drinks, -1); }}
                                  className="drink-btn btn-minus"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="font-black text-amber-600 w-5 text-center">{drinks}</span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); updateDrinks(night.id, member.name, drinks, 1); }}
                                  className="drink-btn btn-plus"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            ) : (
                              <span className="font-black text-amber-600 text-lg">{drinks}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {session && (
                      <div className="mt-4 text-right">
                         <button onClick={(e) => { e.stopPropagation(); deleteNight(night.id); }} className="text-red-400 text-xs hover:text-red-600 underline">Apagar Saída</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {nights.length === 0 && <div className="text-center py-10 text-slate-400">Ainda não há registo de noitadas.</div>}
        </div>
      </div>
    </div>
  );
}