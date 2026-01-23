import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import api from '../apis/client';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaPlaneDeparture, FaGlobeAmericas, FaCity, FaCalendarAlt, FaClock, FaWallet } from 'react-icons/fa';

export default function CreateTrip() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const [form, setForm] = useState({
    title: '',
    country: '',
    city: '',
    departureDate: '',
    duration: '',
    budgetLevel: 'Economy'
  });

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get('https://countriesnow.space/api/v0.1/countries');
        const sortedCountries = response.data.data.sort((a, b) =>
          a.country.localeCompare(b.country)
        );
        setCountries(sortedCountries);
      } catch (err) {
        console.error("Gagal memuat daftar negara", err);
      }
    };
    fetchCountries();
  }, []);

  const handleCountryChange = async (e) => {
    const selectedCountry = e.target.value;

    // Reset city di form dan list cities
    setForm({ ...form, country: selectedCountry, city: '' });
    setCities([]);

    if (selectedCountry) {
      setLoadingCities(true);
      try {
        const response = await axios.post('https://countriesnow.space/api/v0.1/countries/cities', {
          country: selectedCountry
        });
        setCities(response.data.data.sort());
      } catch (err) {
        console.error("Gagal memuat daftar kota", err);
      } finally {
        setLoadingCities(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      Swal.fire({ title: 'Please wait...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      const response = await api.post('/trips', form);

      Swal.fire('Success', 'Trip itinerary has been created!', 'success');
      navigate(`/`);
    } catch (err) {
      Swal.fire('Failed', err.response?.data?.message || 'An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 mb-5">
      <div className="card trip-card p-4 shadow-lg mx-auto" style={{ maxWidth: '650px', background: '#ffffff' }}>
        <div className="text-center mb-4">
          <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
            <FaPlaneDeparture size={30} />
          </div>
          <h2 className="fw-bold" style={{ color: '#2c3e50' }}>Plan Your Adventure</h2>
          <p className="text-muted">Fill in the details to generate your perfect travel itinerary</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Trip Title */}
          <div className="mb-4">
            <label className="form-label fw-bold">
              <FaPlaneDeparture className="me-2 text-success" />Trip Title
            </label>
            <input type="text" className="form-control" placeholder="e.g. Magical Winter in Sapporo"
              onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>

          <div className="row">
            {/* Country */}
            <div className="col-md-6 mb-4">
              <label className="form-label fw-bold">
                <FaGlobeAmericas className="me-2 text-success" />Country
              </label>
              <select
                className="form-select"
                value={form.country}
                onChange={handleCountryChange}
                required
              >
                <option value="">-- Select Country --</option>
                {countries.map((item, index) => (
                  <option key={index} value={item.country}>{item.country}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div className="col-md-6 mb-4">
              <label className="form-label fw-bold">
                <FaCity className="me-2 text-success" />City
              </label>
              <select
                className="form-select"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                disabled={!form.country || loadingCities}
                required
              >
                <option value="">
                  {loadingCities ? 'Searching cities...' : '-- Select City --'}
                </option>
                {cities.map((city, index) => (
                  <option key={index} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="row">
            {/* Departure Date */}
            <div className="col-md-6 mb-4">
              <label className="form-label fw-bold">
                <FaCalendarAlt className="me-2 text-success" />Departure Date
              </label>
              <input type="date" className="form-control"
                onChange={e => setForm({ ...form, departureDate: e.target.value })} required />
            </div>

            {/* Duration */}
            <div className="col-md-6 mb-4">
              <label className="form-label fw-bold">
                <FaClock className="me-2 text-success" />Duration (Days)
              </label>
              <input type="number" className="form-control" min="1" placeholder="0"
                onChange={e => setForm({ ...form, duration: e.target.value })} required />
            </div>
          </div>

          {/* Budget Level */}
          <div className="mb-4">
            <label className="form-label fw-bold">
              <FaWallet className="me-2 text-success" />Budget Level
            </label>
            <div className="d-flex gap-2">
              {['Economy', 'Medium', 'Luxury'].map((level) => (
                <div key={level} className="flex-grow-1">
                  <input
                    type="radio"
                    className="btn-check"
                    name="budgetLevel"
                    id={`level-${level}`}
                    value={level}
                    checked={form.budgetLevel === level}
                    onChange={e => setForm({ ...form, budgetLevel: e.target.value })}
                  />
                  <label className="btn btn-outline-success w-100 rounded-3 py-2" htmlFor={`level-${level}`}>
                    {level}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-success btn-create w-100 shadow-sm mt-3" disabled={loading}>
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Creating...</>
            ) : 'Create Itinerary Now'}
          </button>
        </form>
      </div>
    </div>
  );
}