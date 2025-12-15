import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Upload, UserPlus, CheckCircle, XCircle } from 'lucide-react';

export default function EventDetails({ session }) {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [newAttendee, setNewAttendee] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const { data: eventData } = await supabase.from('events').select('*').eq('id', id).single();
    const { data: attData } = await supabase.from('attendees').select('*').eq('event_id', id).order('name');
    setEvent(eventData);
    setAttendees(attData || []);
  };

  const addAttendee = async () => {
    if (!newAttendee.trim()) return;
    await supabase.from('attendees').insert([{ event_id: id, name: newAttendee, status: 'Ausente' }]);
    setNewAttendee('');
    fetchData();
  };

  const toggleStatus = async (attId, currentStatus) => {
    if (!session) return; 
    const newStatus = currentStatus === 'Presente' ? 'Ausente' : 'Presente';
    await supabase.from('attendees').update({ status: newStatus }).eq('id', attId);
    // Optimistic update
    setAttendees(attendees.map(a => a.id === attId ? { ...a, status: newStatus } : a));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !session) return;
    setUploading(true);

    const fileName = `${id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('event-photos').upload(fileName, file);

    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('event-photos').getPublicUrl(fileName);
      const currentPhotos = event.photos || [];
      const { error: updateError } = await supabase.from('events').update({ photos: [...currentPhotos, publicUrl] }).eq('id', id);
      
      if (!updateError) {
          setEvent({ ...event, photos: [...currentPhotos, publicUrl] });
      }
    }
    setUploading(false);
  };

  if (!event) return <div className="text-center py-3">A carregar...</div>;

  return (
    <div className="container">
      <div className="event-layout">
        {/* Coluna Esquerda: Info e Fotos */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          <div className="info-panel">
              <h1 style={{fontSize: '2rem', marginBottom: '0.25rem'}}>{event.title}</h1>
              <p style={{color: 'var(--color-primary)', fontWeight: '600', marginBottom: '1rem'}}>{new Date(event.event_date).toLocaleDateString()}</p>
              <p style={{color: '#4b5563'}}>{event.description || "Sem descrição."}</p>
          </div>

          {/* Galeria */}
          <div className="info-panel">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                  <h3 style={{fontSize: '1.25rem'}}>Fotos</h3>
                  {session && (
                      <label className="status-button" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', cursor: 'pointer' }}>
                          <Upload size={16}/> {uploading ? 'A enviar...' : 'Upload'}
                          <input type="file" style={{display: 'none'}} onChange={handlePhotoUpload} accept="image/*" disabled={uploading}/>
                      </label>
                  )}
              </div>
              <div className="gallery">
                  {event.photos?.map((url, idx) => (
                      <img key={idx} src={url} className="gallery-img" alt="evento" />
                  ))}
                  {(!event.photos || event.photos.length === 0) && <p className="text-sm text-slate-400">Sem fotos ainda.</p>}
              </div>
          </div>
        </div>

        {/* Coluna Direita: Tabela de Presenças */}
        <div className="attendance-panel">
          <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'}}>
            Participantes 
            <span style={{fontSize: '0.75rem', backgroundColor: '#e0e7ff', color: 'var(--color-primary)', padding: '0.25rem 0.5rem', borderRadius: '9999px'}}>
              {attendees.length}
            </span>
          </h3>
          
          {session && (
              <div className="attendee-input-group">
                  <input 
                      className="input-field" 
                      style={{marginBottom: 0, flexGrow: 1}}
                      placeholder="Nome do participante" 
                      value={newAttendee}
                      onChange={e => setNewAttendee(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addAttendee()}
                  />
                  <button onClick={addAttendee} className="btn-primary" style={{width: 'auto', padding: '0.5rem', minWidth: '40px'}}><UserPlus size={20}/></button>
              </div>
          )}

          <div className="attendee-list">
              {attendees.map(att => (
                  <div key={att.id} className="attendee-item">
                      <span className="font-semibold">{att.name}</span>
                      <button 
                          onClick={() => toggleStatus(att.id, att.status)}
                          disabled={!session}
                          className={`status-button ${att.status === 'Presente' ? 'status-present' : 'status-absent'}`}
                      >
                          {att.status === 'Presente' ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                          {att.status}
                      </button>
                  </div>
              ))}
              {attendees.length === 0 && <p className="text-center text-slate-400 py-3">Ainda ninguém registado.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}