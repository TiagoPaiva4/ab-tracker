import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Image, Calendar } from 'lucide-react';

export default function Album() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    // 1. Buscar todos os eventos que tenham fotos (não nulas)
    const { data, error } = await supabase
      .from('events')
      .select('id, title, event_date, photos')
      .not('photos', 'is', null) // Garante que não traz eventos sem fotos
      .order('event_date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar fotos:', error);
    } else {
      // 2. "Aplanar" os dados: O Supabase devolve eventos, nós queremos uma lista simples de fotos
      const allPhotos = [];
      
      data.forEach(event => {
        if (event.photos && Array.isArray(event.photos)) {
          event.photos.forEach(url => {
            allPhotos.push({
              url: url,
              date: event.event_date,
              eventId: event.id,
              title: event.title // Opcional, caso queiras usar no "alt" da imagem
            });
          });
        }
      });

      setPhotos(allPhotos);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Image className="text-yellow-500" /> Álbum de Família
      </h1>

      {loading ? (
        <p className="text-center text-slate-400">A carregar memórias...</p>
      ) : (
        <div className="events-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
          {photos.map((photo, index) => (
            <div key={index} className="event-card group" style={{ position: 'relative', overflow: 'hidden' }}>
              
              {/* A Imagem */}
              <img 
                src={photo.url} 
                alt="Memória" 
                className="event-card-image" 
                style={{ height: '250px', width: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
              />
              
              {/* Efeito Hover (Zoom) */}
              <style>{`
                .group:hover img { transform: scale(1.05); }
              `}</style>

              {/* A Data (Overlay no fundo da imagem) */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  backdropFilter: 'blur(4px)'
                }}>
                  <Calendar size={14} />
                  {new Date(photo.date).toLocaleDateString('pt-PT')}
                </div>
              </div>

            </div>
          ))}
          
          {photos.length === 0 && (
            <div className="text-center col-span-full py-10 text-slate-400">
              Ainda não há fotos no álbum.
            </div>
          )}
        </div>
      )}
    </div>
  );
}