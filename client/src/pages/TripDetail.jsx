import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import api from '../apis/client';
import showError from '../helpers/error';
import ReactMarkdown from 'react-markdown';
import Navbar from '../components/Navbar'

export default function TripDetail() {
  const { id } = useParams(); 
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTripDetail = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/trips/${id}`);
      setTrip(data);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetail();
  }, [id]);

  if (loading) return <div className="text-center mt-5"><div className="spinner-border"></div></div>;
  if (!trip) return <div className="text-center mt-5">Trip tidak ditemukan.</div>;

  return (
    <div className="container">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
          <li className="breadcrumb-item active">{trip.title}</li>
        </ol>
      </nav>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <h1 className="fw-bold text-primary mb-2">{trip.title}</h1>
          <p className="lead text-muted">📍 {trip.city}, {trip.country}</p>
          
          <div className="d-flex gap-3 mb-4">
            <span className="badge bg-info p-2">📅 {new Date(trip.departureDate).toLocaleDateString()}</span>
            <span className="badge bg-secondary p-2">⏱️ {trip.duration} Hari</span>
            <span className="badge bg-success p-2">💰 Budget: {trip.budgetLevel}</span>
          </div>

          <hr />

          <h3 className="fw-bold mb-3">Rencana Perjalanan (AI Generated)</h3>
          <div className="itinerary-content bg-light p-4 rounded">
            <ReactMarkdown>{trip.itinerary}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}