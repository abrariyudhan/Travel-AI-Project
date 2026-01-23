import { Link, useNavigate } from 'react-router';
import { Navbar as BSNavbar, Container, Nav, Button, Dropdown } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';
import { FaPlane, FaUser, FaSignOutAlt, FaHome, FaPlusCircle } from 'react-icons/fa';

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <BSNavbar 
      bg="white" 
      expand="lg" 
      className="shadow-sm fixed-top"
      style={{ zIndex: 1000 }}
    >
      <Container>
        <BSNavbar.Brand 
          as={Link} 
          to="/" 
          className="fw-bold d-flex align-items-center"
          style={{ fontSize: '1.5rem' }}
        >
          <FaPlane className="me-2 text-primary" size={28} />
          <span style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Travel AI
          </span>
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle aria-controls="navbar-nav" />
        
        <BSNavbar.Collapse id="navbar-nav">
          <Nav className="ms-auto align-items-lg-center gap-2">
            <Nav.Link 
              as={Link} 
              to="/" 
              className="d-flex align-items-center px-3"
            >
              <FaHome className="me-2" />
              Dashboard
            </Nav.Link>
            
            <Nav.Link 
              as={Link} 
              to="/trips/create" 
              className="d-flex align-items-center px-3"
            >
              <FaPlusCircle className="me-2" />
              Create Trip
            </Nav.Link>
            
            <Nav.Link 
              as={Link} 
              to="/profile" 
              className="d-flex align-items-center px-3"
            >
              <FaUser className="me-2" />
              Profile
            </Nav.Link>
            
            <Button 
              variant="outline-danger" 
              size="sm" 
              className="d-flex align-items-center ms-lg-2"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="me-2" />
              Logout
            </Button>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
}