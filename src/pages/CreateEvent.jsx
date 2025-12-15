import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function CreateEvent({ session }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [desc, setDesc] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) return alert('Apenas admin!');

    const { error } = await supabase.from('events').insert([
      { title, event_date: date, description: desc, user_id: session.user.id }
    ]);

    if (error) alert('Erro ao criar evento');
    else navigate('/');
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
      <div className="form-container" style={{ maxWidth: '600px', width: '100%' }}>
        <h1 style={{fontSize: '1.5rem', marginBottom: '1rem'}}>Criar Novo Evento</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="text-sm font-semibold" style={{display: 'block', marginBottom: '0.25rem'}}>Título</label>
            <input required type="text" className="input-field" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold" style={{display: 'block', marginBottom: '0.25rem'}}>Data</label>
            <input required type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold" style={{display: 'block', marginBottom: '0.25rem'}}>Descrição</label>
            <textarea className="input-field" rows="4" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary">Guardar Evento</button>
        </form>
      </div>
    </div>
  );
}