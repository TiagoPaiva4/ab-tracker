import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

export default function Dashboard() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false });
    setEvents(data);
  };

  return (
    <div className="container">
      <h1>Eventos Recentes</h1>
      <div className="events-grid">
        {events.map((event) => (
          <div key={event.id} className="event-card">
             {event.photos && event.photos[0] && (
                <img src={event.photos[0]} alt="capa" className="event-card-image" />
             )}
            <div className="event-card-content">
              <h3 className="event-card-title">{event.title}</h3>
              <div className="event-card-date">
                <Calendar size={16} className="mr-2" />
                {new Date(event.event_date).toLocaleDateString('pt-PT')}
              </div>
              <Link to={`/event/${event.id}`} className="btn-details">
                Ver Detalhes
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}