import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import api from '../apis/client';
import { useAuth } from '../hooks/useAuth';
import Swal from 'sweetalert2';
import showError from '../helpers/error';
import { Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import { FaEnvelope, FaLock, FaPlane } from 'react-icons/fa';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Regular email/password login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data } = await api.post('/login', { email, password });
      login(data.access_token);
      
      await Swal.fire({
        icon: 'success',
        title: 'Welcome Back! ✈️',
        text: 'Login successful!',
        showConfirmButton: false,
        timer: 1500,
        background: '#fff',
        customClass: {
          popup: 'animated-popup'
        }
      });
      
      navigate('/');
    } catch (err) {
      showError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login Success Handler
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      
      console.log('Google credential:', credentialResponse);

      // Decode JWT token dari Google
      const decoded = jwtDecode(credentialResponse.credential);
      console.log('Decoded user info:', decoded);

      // Send token to backend
      const { data } = await api.post(
        '/google-login',
        {},
        {
          headers: {
            token: credentialResponse.credential
          }
        }
      );

      // Save access token
      login(data.access_token);

      await Swal.fire({
        icon: 'success',
        title: 'Welcome! 🎉',
        text: `Hello, ${decoded.name}!`,
        showConfirmButton: false,
        timer: 2000,
        customClass: {
          popup: 'animated-popup'
        }
      });

      navigate('/');
    } catch (error) {
      console.error('Google login error:', error);
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login Error Handler
  const handleGoogleError = () => {
    Swal.fire({
      icon: 'error',
      title: 'Login Failed',
      text: 'Google login failed. Please try again.',
    });
  };

  return (
    <div className="login-page" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      <Row className="shadow-lg rounded-4 overflow-hidden bg-white" style={{ 
        maxWidth: '1000px', 
        width: '100%',
        margin: '0 auto'
      }}>
        
        {/* Sisi Kiri - Login Form */}
        <Col md={6} className="p-5 d-flex flex-column justify-content-center">
          <div className="w-100 mx-auto" style={{ maxWidth: '380px' }}>
            {/* Logo & Title */}
            <div className="text-center mb-4">
              <div className="login-icon mb-3">
                <FaPlane size={45} className="text-primary" />
              </div>
              <h2 className="fw-bold mb-1">Welcome Back!</h2>
              <p className="text-muted small">Login to plan your next adventure</p>
            </div>

            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-secondary">Email Address</Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-light border-end-0">
                    <FaEnvelope className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-start-0 ps-0 bg-light"
                  />
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-secondary">Password</Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-light border-end-0">
                    <FaLock className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              </Form.Group>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <Form.Check type="checkbox" label="Remember me" className="text-muted small" />
                <Link to="/forgot-password" className="text-decoration-none small">Forgot Password?</Link>
              </div>

              <Button
                variant="primary"
                type="submit"
                className="w-100 py-2 fw-semibold rounded-3 mb-3 border-0"
                disabled={isLoading}
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>

              <div className="text-center my-3 position-relative">
                <hr />
                <span className="position-absolute top-50 start-50 translate-middle bg-white px-2 text-muted small">OR</span>
              </div>

              {/* Google Login Button */}
              <div className="d-flex justify-content-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  logo_alignment="left"
                  width="100%"
                />
              </div>
            </Form>

            <p className="text-center mt-4 text-muted small">
              Don't have an account? <Link to="/register" className="fw-semibold text-decoration-none" style={{ color: '#667eea' }}>Sign up</Link>
            </p>
          </div>
        </Col>

        {/* Sisi Kanan - Hero Section */}
        <Col md={6} className="d-none d-md-flex align-items-center justify-content-center text-white p-5" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}>
          <div className="text-center">
            <div className="mb-4" style={{ fontSize: '80px' }}>✈️</div>
            <h2 className="fw-bold mb-3">Travel Smart with AI</h2>
            <p className="opacity-75 mb-4">Plan your perfect trip with AI-powered itineraries</p>
            <div className="d-flex justify-content-center gap-3 mt-4 small">
              <div><h5 className="fw-bold mb-0">1000+</h5><p className="opacity-50 mb-0">Travelers</p></div>
              <div className="vr"></div>
              <div><h5 className="fw-bold mb-0">50+</h5><p className="opacity-50 mb-0">Countries</p></div>
            </div>
          </div>
        </Col>
      </Row>

      <style>{`
        .login-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .login-icon {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
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
      `}</style>
    </div>
  );
}