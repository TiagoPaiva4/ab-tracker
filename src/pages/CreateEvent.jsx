import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckSquare, Square } from 'lucide-react';

export default function CreateEvent({ session }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [desc, setDesc] = useState('');
  const [file, setFile] = useState(null);
  
  // MUDANÇA: 'groupMembers' vem da BD, não é fixo
  const [groupMembers, setGroupMembers] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]); 
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 1. Buscar membros ao carregar a página
  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase.from('members').select('name').order('name');
      if (data) setGroupMembers(data.map(m => m.name));
    };
    fetchMembers();
  }, []);

  const toggleParticipant = (name) => {
    if (selectedParticipants.includes(name)) {
      setSelectedParticipants(prev => prev.filter(p => p !== name));
    } else {
      setSelectedParticipants(prev => [...prev, name]);
    }
  };

  const toggleAll = () => {
    if (selectedParticipants.length === groupMembers.length) {
      setSelectedParticipants([]); 
    } else {
      setSelectedParticipants([...groupMembers]); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) return alert('Apenas admin!');
    setLoading(true);

    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert([{ title, event_date: date, description: desc, user_id: session.user.id }])
        .select().single();

      if (eventError) throw eventError;
      const eventId = eventData.id;

      if (file) {
        const fileName = `${eventId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('event-photos').upload(fileName, file);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('event-photos').getPublicUrl(fileName);
          await supabase.from('events').update({ photos: [publicUrl] }).eq('id', eventId);
        }
      }

      if (selectedParticipants.length > 0) {
        const attendeesData = selectedParticipants.map(name => ({
          event_id: eventId, name: name, status: 'Presente'
        }));
        await supabase.from('attendees').insert(attendeesData);
      }

      navigate('/');
    } catch (error) {
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex-center">
      <div className="form-container" style={{ maxWidth: '600px', width: '100%' }}>
        <h1 className="text-center mb-6">Criar Novo Evento</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div><label className="text-sm font-semibold mb-1 block">Título</label><input required type="text" className="input-field" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Futebol de 5ª Feira"/></div>
          <div><label className="text-sm font-semibold mb-1 block">Data</label><input required type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} /></div>
          <div><label className="text-sm font-semibold mb-1 block">Foto de Capa</label><label className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#6b7280' }}><Upload size={20} />{file ? file.name : "Clique para carregar foto"}<input type="file" accept="image/*" hidden onChange={e => setFile(e.target.files[0])} /></label></div>

          {/* Seleção de Participantes Dinâmica */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="text-sm font-semibold block">Participantes ({selectedParticipants.length})</label>
              <button type="button" onClick={toggleAll} style={{ fontSize: '0.8rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                {groupMembers.length > 0 && selectedParticipants.length === groupMembers.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem', border: '1px solid var(--color-border)', padding: '1rem', borderRadius: '0.5rem' }}>
              {groupMembers.map(name => {
                const isSelected = selectedParticipants.includes(name);
                return (
                  <div key={name} onClick={() => toggleParticipant(name)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px', backgroundColor: isSelected ? '#e0e7ff' : 'transparent' }}>
                    {isSelected ? <CheckSquare size={18} color="var(--color-primary)" /> : <Square size={18} color="#9ca3af" />}
                    <span style={{ fontSize: '0.9rem', color: isSelected ? 'var(--color-primary-dark)' : 'inherit' }}>{name}</span>
                  </div>
                )
              })}
              {groupMembers.length === 0 && <span className="text-xs text-slate-400">A carregar membros...</span>}
            </div>
          </div>

          <div><label className="text-sm font-semibold mb-1 block">Descrição</label><textarea className="input-field" rows="3" value={desc} onChange={e => setDesc(e.target.value)} /></div>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'A criar...' : 'Criar Evento'}</button>
        </form>
      </div>
    </div>
  );
}