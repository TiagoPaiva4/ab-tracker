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
    // 1. Buscar Membros
    const { data: memberData } = await supabase.from('members').select('name').order('name');
    setMembers(memberData || []);

    // 2. Buscar Histórico
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
    data.forEach(night => {
      if (night.night_entries) {
        night.night_entries.forEach(entry => {
          counts[entry.name] = (counts[entry.name] || 0) + entry.drinks;
        });
      }
    });

    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

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
    const newAmount = Math.max(0, currentDrinks + delta);

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
    calculateLeaderboard(updatedNights);

    const { data: existing } = await supabase.from('night_entries').select('id').eq('night_out_id', nightId).eq('name', memberName).single();
    
    if (existing) {
      await supabase.from('night_entries').update({ drinks: newAmount }).eq('id', existing.id);
    } else {
      await supabase.from('night_entries').insert({ night_out_id: nightId, name: memberName, drinks: newAmount });
    }
  };

  const getMedal = (index) => {
    if (index === 0) return '👑';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="container">
      <style>{`
        /* ESTILO GERAL */
        .page-header { text-align: center; margin-bottom: 2.5rem; }
        .page-title { font-size: 2rem; font-weight: 900; color: #1e293b; display: flex; align-items: center; justify-content: center; gap: 0.75rem; }
        
        /* RANKING CARD */
        .ranking-scroll-container {
            display: flex; gap: 1rem; overflow-x: auto; padding: 1rem 0.5rem; scroll-behavior: smooth;
        }
        .rank-card {
            flex-shrink: 0; display: flex; flex-direction: column; items-align: center; justify-content: center;
            background: white; border: 1px solid #e2e8f0; border-radius: 1rem;
            width: 110px; padding: 1rem 0.5rem; text-align: center;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: transform 0.2s;
        }
        .rank-card:hover { transform: translateY(-3px); border-color: #f59e0b; }
        .rank-medal { font-size: 2rem; margin-bottom: 0.25rem; }
        .rank-name { font-weight: 700; color: #334155; font-size: 0.9rem; margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
        .rank-value { font-weight: 900; color: #d97706; font-size: 1.25rem; }

        /* NIGHT CARD */
        .night-card {
            background: white; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
            border: 1px solid #e2e8f0; margin-bottom: 1.5rem; overflow: hidden;
        }
        .night-header {
            padding: 1.25rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;
        }
        .night-header:hover { background: #f8fafc; }
        .night-title { font-size: 1.1rem; font-weight: 800; color: #1e293b; }
        .night-meta { font-size: 0.85rem; color: #64748b; margin-top: 0.25rem; display: flex; align-items: center; gap: 0.5rem; }
        
        /* DRINK CONTROLS */
        .drink-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; padding: 1.25rem; background: #f8fafc; border-top: 1px solid #e2e8f0;
        }
        .member-drink-card {
            background: white; padding: 0.75rem; border-radius: 0.75rem; border: 1px solid #e2e8f0;
            display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
        }
        .btn-control {
            width: 32px; height: 32px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;
        }
        .btn-plus { background: #dbeafe; color: #2563eb; } .btn-plus:hover { background: #2563eb; color: white; }
        .btn-minus { background: #f1f5f9; color: #64748b; } .btn-minus:hover { background: #cbd5e1; color: #334155; }
        
        .drink-count-badge {
            font-size: 1.25rem; font-weight: 800; color: #d97706; min-width: 30px; text-align: center;
        }
    
        /* FORMULÁRIO */
        .new-night-form { background: #fffbeb; border: 1px solid #fcd34d; padding: 1.5rem; border-radius: 1rem; margin-bottom: 2rem; }
      `}</style>

      {/* HEADER */}
      <div className="page-header">
        <h1 className="page-title">
          <Beer size={36} className="text-amber-500" /> Liga Rei do Álcool
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Maior bêbado do AB</p>
      </div>

      {/* RANKING (SCROLL HORIZONTAL) */}
      <div className="mb-10">
        <h2 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2">
            🏆 Classificação Geral
        </h2>
        <div className="ranking-scroll-container">
            {leaderboard.length > 0 ? leaderboard.map((item, index) => (
              <div key={item.name} className="rank-card">
                <div className="rank-medal">{getMedal(index)}</div>
                <div className="rank-name">{item.name}</div>
                <div className="rank-value">{item.count}</div>
              </div>
            )) : <p className="text-slate-400 w-full text-center py-4 bg-white rounded-xl border border-dashed border-slate-300">Ainda ninguém bebeu...</p>}
        </div>
      </div>

      {/* HISTÓRICO DE SAÍDAS */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             📅 Histórico de Saídas
          </h2>
          {session && (
            <button 
              onClick={() => setIsCreating(!isCreating)} 
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition shadow-sm"
            >
              <Plus size={18} /> Nova Saída
            </button>
          )}
        </div>

        {/* Formulário de Criação */}
        {isCreating && session && (
          <form onSubmit={createNight} className="new-night-form shadow-md">
            <h3 className="font-bold text-amber-800 mb-4">Adicionar Nova Noitada</h3>
            <div className="flex flex-col gap-3">
              <input 
                placeholder="Título (Ex: Jantar de Natal)" 
                className="input-field" style={{background: 'white'}}
                value={newTitle} onChange={e => setNewTitle(e.target.value)} required
              />
              <input 
                type="date" 
                className="input-field" style={{background: 'white'}}
                value={newDate} onChange={e => setNewDate(e.target.value)} required
              />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary" style={{backgroundColor: '#f59e0b', border: 'none'}}>Criar</button>
                <button type="button" onClick={() => setIsCreating(false)} className="btn-primary" style={{backgroundColor: '#e2e8f0', color: '#475569'}}>Cancelar</button>
              </div>
            </div>
          </form>
        )}

        {/* Lista de Noites */}
        <div className="flex flex-col">
          {nights.map(night => {
            const isExpanded = expandedNight === night.id;
            const totalDrinks = night.night_entries ? night.night_entries.reduce((acc, curr) => acc + curr.drinks, 0) : 0;

            return (
              <div key={night.id} className="night-card">
                
                {/* Cabeçalho Clicável */}
                <div 
                  className="night-header"
                  onClick={() => setExpandedNight(isExpanded ? null : night.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-100 text-amber-600 p-3 rounded-full">
                       <Calendar size={20} />
                    </div>
                    <div>
                      <h3 className="night-title">{night.title}</h3>
                      <p className="night-meta">
                        {new Date(night.night_date).toLocaleDateString('pt-PT')} • 
                        <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded text-xs">{totalDrinks} Copos</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-slate-400">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* Área de Bebidas (Expandida) */}
                {isExpanded && (
                  <div>
                    <div className="drink-grid">
                      {members.map(member => {
                        const entry = night.night_entries?.find(e => e.name === member.name);
                        const drinks = entry ? entry.drinks : 0;

                        return (
                          <div key={member.name} className="member-drink-card">
                            <span className="text-xs font-bold text-slate-500 uppercase">{member.name}</span>
                            
                            {session ? (
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); updateDrinks(night.id, member.name, drinks, -1); }}
                                  className="btn-control btn-minus"
                                >
                                  <Minus size={16} />
                                </button>
                                
                                <span className="drink-count-badge">{drinks}</span>
                                
                                <button 
                                  onClick={(e) => { e.stopPropagation(); updateDrinks(night.id, member.name, drinks, 1); }}
                                  className="btn-control btn-plus"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            ) : (
                              <span className="drink-count-badge">{drinks}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {session && (
                      <div className="bg-slate-50 p-3 text-right border-t border-slate-200">
                         <button onClick={(e) => { e.stopPropagation(); deleteNight(night.id); }} className="text-red-400 text-xs hover:text-red-600 font-bold flex items-center gap-1 justify-end w-full">
                            <Trash2 size={14}/> Apagar este registo
                         </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {nights.length === 0 && (
             <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400 font-medium">Ainda não há registo de noitadas.</p>
                <p className="text-sm text-slate-300 mt-1">Clica em "Nova Saída" para começar a contagem!</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}