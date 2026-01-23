import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import api from '../apis/client';
import Swal from 'sweetalert2';
import showError from '../helpers/error';
import { Container, Row, Col, Form, Button, InputGroup, ProgressBar } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaLock, FaPlane, FaCheckCircle } from 'react-icons/fa';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    return strength;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Passwords do not match!',
      });
      return;
    }

    if (formData.password.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Weak Password',
        text: 'Password must be at least 6 characters long!',
      });
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/register', {
        email: formData.email,
        password: formData.password
      });

      await Swal.fire({
        icon: 'success',
        title: 'Registration Successful! 🎉',
        text: 'Please login to continue',
        showConfirmButton: false,
        timer: 2000,
        customClass: {
          popup: 'animated-popup'
        }
      });

      navigate('/login');
    } catch (err) {
      showError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return 'danger';
    if (passwordStrength <= 50) return 'warning';
    if (passwordStrength <= 75) return 'info';
    return 'success';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  return (
    <div className="register-page" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '40px 20px'
    }}>
      <Row className="shadow-lg rounded-4 overflow-hidden bg-white" style={{ 
        maxWidth: '1100px', 
        width: '100%',
        margin: '0 auto'
      }}>
        
        {/* Left Side - Hero Section */}
        <Col md={5} className="d-none d-md-flex align-items-center justify-content-center text-white p-5" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          position: 'relative'
        }}>
          <div className="text-center position-relative" style={{ zIndex: 2 }}>
            <div className="mb-4 register-icon" style={{ fontSize: '100px' }}>
              ✈️
            </div>
            <h2 className="fw-bold mb-3">Start Your Journey</h2>
            <p className="opacity-75 mb-5" style={{ fontSize: '17px' }}>
              Join thousands of travelers planning their perfect trips with AI
            </p>
            
            {/* Benefits List */}
            <div className="text-start mx-auto" style={{ maxWidth: '350px' }}>
              <div className="d-flex align-items-center mb-3">
                <FaCheckCircle size={20} className="me-3 flex-shrink-0" />
                <span>AI-powered itinerary generation</span>
              </div>
              <div className="d-flex align-items-center mb-3">
                <FaCheckCircle size={20} className="me-3 flex-shrink-0" />
                <span>Personalized travel recommendations</span>
              </div>
              <div className="d-flex align-items-center mb-3">
                <FaCheckCircle size={20} className="me-3 flex-shrink-0" />
                <span>Budget planning and tracking</span>
              </div>
              <div className="d-flex align-items-center">
                <FaCheckCircle size={20} className="me-3 flex-shrink-0" />
                <span>Save and manage multiple trips</span>
              </div>
            </div>

            {/* Decorative Stats */}
            <div className="d-flex justify-content-center gap-4 mt-5 pt-4 border-top border-white border-opacity-25">
              <div>
                <h4 className="fw-bold mb-0">1000+</h4>
                <p className="opacity-50 mb-0 small">Travelers</p>
              </div>
              <div className="vr opacity-50"></div>
              <div>
                <h4 className="fw-bold mb-0">50+</h4>
                <p className="opacity-50 mb-0 small">Countries</p>
              </div>
              <div className="vr opacity-50"></div>
              <div>
                <h4 className="fw-bold mb-0">24/7</h4>
                <p className="opacity-50 mb-0 small">AI Support</p>
              </div>
            </div>
          </div>

          {/* Decorative Circles */}
          <div
            style={{
              position: 'absolute',
              bottom: '-80px',
              right: '-80px',
              width: '300px',
              height: '300px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              filter: 'blur(60px)',
              zIndex: 1
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              left: '-100px',
              width: '350px',
              height: '350px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              filter: 'blur(80px)',
              zIndex: 1
            }}
          />
        </Col>

        {/* Right Side - Registration Form */}
        <Col md={7} className="p-5 d-flex flex-column justify-content-center">
          <div className="w-100 mx-auto" style={{ maxWidth: '450px' }}>
            {/* Logo & Title */}
            <div className="text-center mb-4">
              <div className="d-md-none mb-3">
                <FaPlane size={40} className="text-primary" />
              </div>
              <h2 className="fw-bold mb-2">Create Your Account</h2>
              <p className="text-muted">Start planning your dream trips today</p>
            </div>

            {/* Registration Form */}
            <Form onSubmit={handleRegister}>
              {/* Email */}
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-secondary">
                  Email Address
                </Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-light border-end-0">
                    <FaEnvelope className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="border-start-0 ps-0 bg-light"
                  />
                </InputGroup>
              </Form.Group>

              {/* Password */}
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-secondary">
                  Password
                </Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-light border-end-0">
                    <FaLock className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="border-start-0 border-end-0 ps-0 bg-light"
                  />
                  <InputGroup.Text
                    className="bg-light border-start-0 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ cursor: 'pointer' }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </InputGroup.Text>
                </InputGroup>
                {formData.password && (
                  <div className="mt-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <small className="text-muted">Password Strength:</small>
                      <small className={`fw-semibold text-${getPasswordStrengthColor()}`}>
                        {getPasswordStrengthText()}
                      </small>
                    </div>
                    <ProgressBar
                      now={passwordStrength}
                      variant={getPasswordStrengthColor()}
                      style={{ height: '4px' }}
                    />
                  </div>
                )}
              </Form.Group>

              {/* Confirm Password */}
              <Form.Group className="mb-4">
                <Form.Label className="small fw-semibold text-secondary">
                  Confirm Password
                </Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-light border-end-0">
                    <FaLock className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="border-start-0 border-end-0 ps-0 bg-light"
                  />
                  <InputGroup.Text
                    className="bg-light border-start-0 cursor-pointer"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ cursor: 'pointer' }}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </InputGroup.Text>
                </InputGroup>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <small className="text-danger">
                    Passwords do not match
                  </small>
                )}
              </Form.Group>

              {/* Terms & Conditions */}
              <Form.Group className="mb-4">
                <Form.Check
                  type="checkbox"
                  label={
                    <small className="text-muted">
                      I agree to the{' '}
                      <Link to="/terms" className="text-decoration-none">
                        Terms and Conditions
                      </Link>
                      {' '}and{' '}
                      <Link to="/privacy" className="text-decoration-none">
                        Privacy Policy
                      </Link>
                    </small>
                  }
                  required
                />
              </Form.Group>

              {/* Register Button */}
              <Button
                variant="primary"
                type="submit"
                className="w-100 py-3 fw-semibold rounded-3 mb-3 border-0"
                disabled={isLoading || (formData.password && formData.password !== formData.confirmPassword)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontSize: '16px'
                }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <FaPlane className="me-2" />
                    Create Account
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="text-center my-3 position-relative">
                <hr />
                <span className="position-absolute top-50 start-50 translate-middle bg-white px-2 text-muted small">
                  OR
                </span>
              </div>

              {/* Social Register */}
              <Button
                variant="outline-secondary"
                className="w-100 py-2 rounded-3 small d-flex align-items-center justify-content-center"
                disabled
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  width="16"
                  className="me-2"
                />
                Sign up with Google
              </Button>
            </Form>

            {/* Login Link */}
            <p className="text-center mt-4 text-muted small">
              Already have an account?{' '}
              <Link
                to="/login"
                className="fw-semibold text-decoration-none"
                style={{ color: '#667eea' }}
              >
                Login here
              </Link>
            </p>
          </div>
        </Col>
      </Row>

      <style>{`
        .register-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .register-icon {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        .form-control:focus,
        .input-group-text:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
          transition: all 0.3s ease;
        }

        .cursor-pointer:hover {
          opacity: 0.7;
        }

        .animated-popup {
          animation: fadeInUp 0.3s ease;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .progress {
          border-radius: 10px;
          background-color: #e9ecef;
        }

        .progress-bar {
          transition: width 0.3s ease;
        }
      `}</style>
    </div>
  );
}