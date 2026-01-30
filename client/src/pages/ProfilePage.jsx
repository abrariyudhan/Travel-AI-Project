import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import api from '../apis/client';
import Swal from 'sweetalert2';
import { Card, Button, Form, Spinner } from 'react-bootstrap';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
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
    fetchProfile();
  }, []);

  // Fetch countries
  const fetchCountries = async () => {
    try {
      setIsLoadingCountries(true);
      const { data } = await axios.get('https://countriesnow.space/api/v0.1/countries');
      const sorted = data.data.sort((a, b) => a.country.localeCompare(b.country));
      setCountries(sorted);
    } catch (error) {
      console.error("Failed to load countries", error);
      setCountries([
        { country: 'Indonesia' },
        { country: 'Malaysia' },
        { country: 'Singapore' }
      ]);
    } finally {
      setIsLoadingCountries(false);
    }
  };

  // ✅ FIX: Fetch profile
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Fetching profile...');
      const { data } = await api.get('/profiles/me');
      console.log('✅ Profile data:', data);
      
      if (!data.profile) {
        console.log('⚠️ No profile found, redirecting to create...');
        navigate('/profile/create', { replace: true });
        return;
      }

      setProfile(data.profile);
      setPreviewUrl(data.profile.profilePict);
      setFormData({
        name: data.profile.name || '',
        age: data.profile.age || '',
        gender: data.profile.gender || '',
        citizen: data.profile.citizen || ''
      });
    } catch (error) {
      console.error('❌ Fetch profile error:', error);
      console.error('Error response:', error.response);
      
      if (error.response?.status === 404) {
        console.log('⚠️ 404: Profile not found, redirecting...');
        navigate('/profile/create', { replace: true });
        return;
      }
      
      const errorMessage = error.response?.data?.message || 'Failed to load profile';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        Swal.fire('Error', 'Please select an image file', 'error');
        e.target.value = '';
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire('Error', 'File size must be less than 5MB', 'error');
        e.target.value = '';
        return;
      }

      setSelectedFile(file);
      
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(profile?.profilePict);
    document.getElementById('photoInput').value = '';
  };

  // ✅ FIX: Handle upload photo
  const handleUploadPhoto = async () => {
    if (!profile?.id) {
      Swal.fire('Error', 'Profile data not found', 'error');
      return;
    }

    if (!selectedFile) {
      Swal.fire('Error', 'Please select a photo first', 'error');
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('profilePict', selectedFile);

    setIsUploading(true);

    try {
      const { data } = await api.patch(
        `/profiles/${profile.id}/profilePict`,
        formDataUpload,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      await Swal.fire({
        icon: 'success',
        title: 'Photo Updated! 📸',
        text: 'Your profile picture has been updated successfully',
        timer: 2000,
        showConfirmButton: false
      });

      setProfile({ ...profile, profilePict: data.profilePictUrl || data.profilePict });
      setPreviewUrl(data.profilePictUrl || data.profilePict);
      setSelectedFile(null);
      
      const photoInput = document.getElementById('photoInput');
      if (photoInput) photoInput.value = '';

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload photo';
      
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: errorMessage
      });
      
      setPreviewUrl(profile.profilePict);
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.put(`/profiles/${profile.id}`, formData);
      
      await Swal.fire({
        icon: 'success',
        title: 'Profile Updated! ✅',
        text: 'Your profile has been updated successfully',
        timer: 2000,
        showConfirmButton: false
      });
      
      setProfile(data.profileFound);
      setIsEditing(false);
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      citizen: profile.citizen
    });
    setIsEditing(false);
  };

  // ✅ FIX: Loading state
  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  // ✅ FIX: Null profile handling
  if (!profile) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      paddingTop: '80px',
      paddingBottom: '50px'
    }}>
      <Container>
        <Row className="justify-content-center">
          <Col lg={10}>
            <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
              <Card.Body className="p-5">
                <h2 className="fw-bold mb-4 text-center">
                  <FaUser className="me-2 text-primary" />
                  My Profile
                </h2>

                <Row>
                  {/* Left Side - Profile Picture */}
                  <Col md={4} className="text-center mb-4 mb-md-0">
                    <div className="position-relative d-inline-block">
                      {previewUrl ? (
                        <Image
                          src={previewUrl}
                          roundedCircle
                          className="shadow"
                          style={{
                            width: '200px',
                            height: '200px',
                            objectFit: 'cover',
                            border: '5px solid white'
                          }}
                        />
                      ) : (
                        <div
                          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow"
                          style={{ width: '200px', height: '200px', fontSize: '80px' }}
                        >
                          {profile?.name?.charAt(0) || '?'}
                        </div>
                      )}
                      
                      <label
                        htmlFor="photoInput"
                        className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-3 shadow cursor-pointer"
                        style={{ cursor: 'pointer' }}
                      >
                        <FaCamera size={20} />
                      </label>
                      <input
                        id="photoInput"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                    </div>

                    {selectedFile && (
                      <div className="mt-3">
                        <p className="small text-muted mb-2">{selectedFile.name}</p>
                        <div className="d-flex gap-2 justify-content-center">
                          <Button
                            variant="primary"
                            size="sm"
                            className="rounded-3"
                            onClick={handleUploadPhoto}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Uploading...
                              </>
                            ) : (
                              'Upload Photo'
                            )}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-3"
                            onClick={handleCancelUpload}
                            disabled={isUploading}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </Col>

                  {/* Right Side - Profile Info */}
                  <Col md={8}>
                    <div className="bg-light rounded-3 p-4">
                      {!isEditing ? (
                        /* VIEW MODE */
                        <>
                          <div className="mb-4">
                            <label className="small fw-semibold text-secondary mb-2">Full Name</label>
                            <p className="h5 mb-0">{profile?.name || 'Not set'}</p>
                          </div>

                          <Row>
                            <Col md={6}>
                              <div className="mb-4">
                                <label className="small fw-semibold text-secondary mb-2">Age</label>
                                <p className="h5 mb-0">
                                  {profile?.age ? `${profile.age} years old` : 'Not set'}
                                </p>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="mb-4">
                                <label className="small fw-semibold text-secondary mb-2">Gender</label>
                                <p className="h5 mb-0">{profile?.gender || 'Not set'}</p>
                              </div>
                            </Col>
                          </Row>

                          <div className="mb-4">
                            <label className="small fw-semibold text-secondary mb-2">Nationality</label>
                            <p className="h5 mb-0">{profile?.citizen || 'Not set'}</p>
                          </div>

                          <div className="d-grid gap-2 mt-4">
                            <Button variant="primary" className="rounded-3" onClick={() => setIsEditing(true)}>
                              <FaEdit className="me-2" />
                              Edit Profile
                            </Button>
                          </div>
                        </>
                      ) : (
                        /* EDIT MODE */
                        <>
                          <Form>
                            <Form.Group className="mb-3">
                              <Form.Label className="small fw-semibold text-secondary">Full Name</Form.Label>
                              <Form.Control
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter your name"
                              />
                            </Form.Group>

                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label className="small fw-semibold text-secondary">Age</Form.Label>
                                  <Form.Control
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleInputChange}
                                    min="1"
                                    max="120"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label className="small fw-semibold text-secondary">Gender</Form.Label>
                                  <Form.Select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                  >
                                    <option value="">Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                  </Form.Select>
                                </Form.Group>
                              </Col>
                            </Row>

                            <Form.Group className="mb-4">
                              <Form.Label className="small fw-semibold text-secondary">
                                Nationality
                              </Form.Label>
                              <Form.Select
                                name="citizen"
                                value={formData.citizen}
                                onChange={handleInputChange}
                                disabled={isLoadingCountries}
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
                            </Form.Group>

                            <Row className="mt-4">
                              <Col>
                                <Button variant="success" className="w-100 rounded-3" onClick={handleSaveProfile}>
                                  <FaSave className="me-2" />
                                  Save Changes
                                </Button>
                              </Col>
                              <Col>
                                <Button variant="secondary" className="w-100 rounded-3" onClick={handleCancelEdit}>
                                  <FaTimes className="me-2" />
                                  Cancel
                                </Button>
                              </Col>
                            </Row>
                          </Form>
                        </>
                      )}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}