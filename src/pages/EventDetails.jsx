import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Upload, UserPlus, CheckCircle, XCircle, Trash2, Edit, Save, X, ArrowLeft } from 'lucide-react';

export default function EventDetails({ session }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  
  // Estados para Gestão de Participantes
  const [newAttendee, setNewAttendee] = useState('');
  
  // Estados para Edição do Evento
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Estado de Upload
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const { data: eventData } = await supabase.from('events').select('*').eq('id', id).single();
    const { data: attData } = await supabase.from('attendees').select('*').eq('event_id', id).order('name');
    
    setEvent(eventData);
    setAttendees(attData || []);

    if (eventData) {
      setEditTitle(eventData.title);
      setEditDate(eventData.event_date);
      setEditDesc(eventData.description || '');
    }
  };

  // --- FUNÇÕES DE EVENTO (EDITAR / APAGAR) ---

  const handleUpdateEvent = async () => {
    const { error } = await supabase
      .from('events')
      .update({ title: editTitle, event_date: editDate, description: editDesc })
      .eq('id', id);

    if (error) {
      alert('Erro ao atualizar: ' + error.message);
    } else {
      setEvent({ ...event, title: editTitle, event_date: editDate, description: editDesc });
      setIsEditing(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm("ATENÇÃO: Vais apagar este evento e TODAS as fotos/presenças associadas. Tens a certeza?")) return;

    const { error } = await supabase.from('events').delete().eq('id', id);

    if (error) {
      alert('Erro ao apagar: ' + error.message);
    } else {
      navigate('/');
    }
  };

  // --- FUNÇÕES DE PARTICIPANTES ---

  const addAttendee = async () => {
    if (!newAttendee.trim()) return;
    const { error } = await supabase.from('attendees').insert([{ 
        event_id: id, name: newAttendee, status: 'Presente' 
    }]);
    if (error) alert('Erro: ' + error.message);
    else { setNewAttendee(''); fetchData(); }
  };

  const deleteAttendee = async (attId) => {
    if (!window.confirm("Remover esta pessoa da lista?")) return;
    const { error } = await supabase.from('attendees').delete().eq('id', attId);
    if (!error) setAttendees(attendees.filter(a => a.id !== attId));
  };

  const toggleStatus = async (attId, currentStatus) => {
    if (!session) return; 
    const newStatus = currentStatus === 'Presente' ? 'Ausente' : 'Presente';
    setAttendees(attendees.map(a => a.id === attId ? { ...a, status: newStatus } : a));
    await supabase.from('attendees').update({ status: newStatus }).eq('id', attId);
  };

  // --- UPLOAD DE FOTOS ---

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
      if (!updateError) setEvent({ ...event, photos: [...currentPhotos, publicUrl] });
    } else {
        alert("Erro upload: " + error.message);
    }
    setUploading(false);
  };

  if (!event) return <div className="text-center py-3">A carregar...</div>;

  return (
    <div className="container">
      
      {/* ESTILOS LOCAIS PARA O BOTÃO VOLTAR */}
      <style>{`
        .btn-back {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: var(--color-text-light); /* Cinza por defeito */
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 1.5rem;
          padding: 0.5rem 0; /* Área de clique maior */
        }
        .btn-back:hover {
          color: var(--color-primary); /* Vermelho no hover */
          transform: translateX(-3px); /* Pequena animação para a esquerda */
        }
      `}</style>

      {/* BOTÃO DE VOLTAR */}
      <button onClick={() => navigate('/')} className="btn-back">
        <ArrowLeft size={20} /> Voltar
      </button>

      <div className="event-layout">
        
        {/* COLUNA ESQUERDA: Detalhes, Edição e Fotos */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          
          <div className="info-panel" style={{ position: 'relative' }}>
            
            {session && !isEditing && (
              <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setIsEditing(true)} className="status-button" style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }} title="Editar Evento">
                  <Edit size={16} />
                </button>
                <button onClick={handleDeleteEvent} className="status-button" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }} title="Apagar Evento">
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label className="text-sm font-semibold">Título</label>
                <input className="input-field" value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ marginBottom: 0 }} />
                
                <label className="text-sm font-semibold">Data</label>
                <input type="date" className="input-field" value={editDate} onChange={e => setEditDate(e.target.value)} style={{ marginBottom: 0 }} />

                <label className="text-sm font-semibold">Descrição</label>
                <textarea className="input-field" rows="3" value={editDesc} onChange={e => setEditDesc(e.target.value)} style={{ marginBottom: 0 }} />

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button onClick={handleUpdateEvent} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Save size={18} /> Guardar
                  </button>
                  <button onClick={() => setIsEditing(false)} className="btn-primary" style={{ backgroundColor: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <X size={18} /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 style={{fontSize: '2rem', marginBottom: '0.25rem', paddingRight: '4rem'}}>{event.title}</h1>
                <p style={{color: 'var(--color-primary)', fontWeight: '600', marginBottom: '1rem'}}>{new Date(event.event_date).toLocaleDateString()}</p>
                <p style={{color: '#4b5563', whiteSpace: 'pre-wrap'}}>{event.description || "Sem descrição."}</p>
              </>
            )}
          </div>

          <div className="info-panel">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                  <h3 style={{fontSize: '1.25rem'}}>Fotos</h3>
                  {session && (
                      <label className="status-button" style={{ backgroundColor: '#f3f4f6', color: '#4b5563', cursor: 'pointer' }}>
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

        {/* COLUNA DIREITA: Tabela de Presenças */}
        <div className="attendance-panel">
          <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'}}>
            Participantes 
            <span style={{fontSize: '0.75rem', backgroundColor: '#e0e7ff', color: 'var(--color-primary)', padding: '0.25rem 0.5rem', borderRadius: '9999px'}}>
              {attendees.length}
            </span>
          </h3>
          
          {session && (
              <div className="attendee-input-group">
                  <input className="input-field" style={{marginBottom: 0, flexGrow: 1}} placeholder="Adicionar extra..." value={newAttendee} onChange={e => setNewAttendee(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAttendee()} />
                  <button onClick={addAttendee} className="btn-primary" style={{width: 'auto', padding: '0.5rem', minWidth: '40px'}}><UserPlus size={20}/></button>
              </div>
          )}

          <div className="attendee-list">
              {attendees.map(att => (
                  <div key={att.id} className="attendee-item">
                      <span className="font-semibold">{att.name}</span>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button onClick={() => toggleStatus(att.id, att.status)} disabled={!session} className={`status-button ${att.status === 'Presente' ? 'status-present' : 'status-absent'}`}>
                            {att.status === 'Presente' ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                            {att.status}
                        </button>

                        {session && (
                            <button onClick={() => deleteAttendee(att.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0.25rem' }} title="Remover da lista">
                                <Trash2 size={18} className="hover:text-red-500" />
                            </button>
                        )}
                      </div>
                  </div>
              ))}
              {attendees.length === 0 && <p className="text-center text-slate-400 py-3">Ainda ninguém registado.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}