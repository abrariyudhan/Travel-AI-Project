import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Container, Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import { FaUser, FaSave } from 'react-icons/fa';
import api from '../apis/client';
import axios from 'axios';
import Swal from 'sweetalert2';
import showError from '../helpers/error';

export default function ProfileCreatePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    citizen: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    checkExistingProfile();
    fetchCountries();
  }, []);

  // Check if profile already exists
  const checkExistingProfile = async () => {
    try {
      await api.get('/profiles');
      // If profile exists, redirect to profile page
      navigate('/profile');
    } catch (error) {
      // If 404, profile doesn't exist - stay on create page
      if (error.response?.status !== 404) {
        showError(error);
      }
    }
  };

  // Fetch countries for dropdown
  const fetchCountries = async () => {
    try {
      setIsLoadingCountries(true);
      const { data } = await axios.get('https://countriesnow.space/api/v0.1/countries');
      const sorted = data.data.sort((a, b) => a.country.localeCompare(b.country));
      setCountries(sorted);
    } catch (error) {
      console.error("Failed to load countries", error);
      // Fallback countries
      setCountries([
        { country: 'Indonesia' },
        { country: 'Malaysia' },
        { country: 'Singapore' },
        { country: 'Thailand' },
        { country: 'United States' },
        { country: 'United Kingdom' }
      ]);
    } finally {
      setIsLoadingCountries(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post('/profiles', {
        name: formData.name,
        age: Number(formData.age),
        gender: formData.gender,
        citizen: formData.citizen
      });

      await Swal.fire({
        icon: 'success',
        title: 'Profile Created! 🎉',
        text: 'Your profile has been created successfully',
        timer: 2000,
        showConfirmButton: false
      });

      navigate('/profile');
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      paddingTop: '80px',
      paddingBottom: '50px'
    }}>
      <Container>
        <Row className="justify-content-center">
          <Col lg={8} xl={6}>
            <Card className="border-0 shadow-lg rounded-4">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: '80px', height: '80px' }}>
                    <FaUser size={40} />
                  </div>
                  <h2 className="fw-bold">Create Your Profile</h2>
                  <p className="text-muted">Let's set up your travel profile</p>
                </div>

                <Form onSubmit={handleSubmit}>
                  {/* Full Name */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Full Name <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </Form.Group>

                  <Row>
                    {/* Age */}
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                          Age <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleInputChange}
                          placeholder="Enter your age"
                          min="1"
                          max="120"
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Gender */}
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                          Gender <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Nationality */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">
                      Nationality <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      name="citizen"
                      value={formData.citizen}
                      onChange={handleInputChange}
                      disabled={isLoadingCountries}
                      required
                    >
                      <option value="">Select nationality</option>
                      {isLoadingCountries ? (
                        <option disabled>Loading countries...</option>
                      ) : countries.length === 0 ? (
                        <option disabled>No countries available</option>
                      ) : (
                        countries.map((c, index) => (
                          <option key={index} value={c.country}>
                            {c.country}
                          </option>
                        ))
                      )}
                    </Form.Select>
                    {isLoadingCountries && (
                      <div className="mt-2 text-center">
                        <Spinner animation="border" size="sm" variant="primary" />
                        <small className="text-muted ms-2">Loading countries...</small>
                      </div>
                    )}
                  </Form.Group>

                  {/* Submit Button */}
                  <div className="d-grid gap-2 mt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="rounded-3"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Creating Profile...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" />
                          Create Profile
                        </>
                      )}
                    </Button>
                  </div>
                </Form>

                <div className="text-center mt-3">
                  <small className="text-muted">
                    You can update your profile anytime
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}