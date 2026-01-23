import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { FaPlus, FaMapMarkedAlt, FaTrash } from 'react-icons/fa';
import api from '../apis/client';
import showError from '../helpers/error';
import Swal from 'sweetalert2';

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkProfile();
    fetchTrips();
  }, []);

  // ✅ Check if user has profile
  const checkProfile = async () => {
    try {
      await api.get('/profiles');
      setHasProfile(true);
    } catch (error) {
      if (error.response?.status === 404) {
        setHasProfile(false);
      }
    }
  };

  const fetchTrips = async () => {
    try {
      const { data } = await api.get('/trips');
      setTrips(data);
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (tripId, tripTitle) => {
    const result = await Swal.fire({
      title: 'Delete Trip?',
      text: `Are you sure you want to delete "${tripTitle}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/trips/${tripId}`);
        
        // Update trips state
        setTrips(trips.filter(trip => trip.id !== tripId));
        
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Trip has been deleted.',
          showConfirmButton: false,
          timer: 1500
        });
      } catch (error) {
        showError(error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      paddingTop: '80px',
      paddingBottom: '50px'
    }}>
      <Container>
        {/* ✅ Show alert if no profile */}
        {!hasProfile && (
          <Alert variant="warning" className="mb-4 shadow-sm">
            <Alert.Heading>👋 Complete Your Profile!</Alert.Heading>
            <p>Please create your profile to get personalized travel recommendations.</p>
            <Button variant="warning" size="sm" onClick={() => navigate('/profile/create')}>
              Create Profile Now
            </Button>
          </Alert>
        )}

        {/* Header */}
        <div className="text-white mb-5">
          <h1 className="display-4 fw-bold mb-2">My Travel Plans</h1>
          <p className="lead">Plan your next adventure with AI assistance</p>
        </div>

        {/* Create Trip Button */}
        <div className="mb-4">
          <Button
            variant="light"
            size="lg"
            className="rounded-3 shadow"
            onClick={() => navigate('/trips/create')}
          >
            <FaPlus className="me-2" />
            Create New Trip
          </Button>
        </div>

        {/* Trips Grid */}
        <Row>
          {trips.length === 0 ? (
            <Col>
              <Card className="border-0 shadow-sm text-center p-5">
                <Card.Body>
                  <FaMapMarkedAlt size={60} className="text-muted mb-3" />
                  <h4>No trips yet</h4>
                  <p className="text-muted">Start planning your next adventure!</p>
                  <Button variant="primary" onClick={() => navigate('/trips/create')}>
                    Create Your First Trip
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ) : (
            trips.map((trip) => (
              <Col key={trip.id} md={6} lg={4} className="mb-4">
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <Card.Title>{trip.title}</Card.Title>
                    <Card.Text>
                      📍 {trip.city}, {trip.country}<br />
                      📅 {trip.duration} days
                    </Card.Text>
                    <div className="d-flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/trips/${trip.id}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(trip.id, trip.title)}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          )}
        </Row>
      </Container>
    </div>
  );
}