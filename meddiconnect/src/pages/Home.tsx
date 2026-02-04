import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  TextField,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Rating,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  CalendarToday as CalendarIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  Psychology as PsychologyIcon,
  Article as ArticleIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
  Search as SearchIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { INSURANCE_PROVIDERS } from '../constants/insuranceProviders';

// Specialty types - must match backend SpecializationType enum exactly
const specialties = [
  'INTERNAL_MEDICINE',
  'GENERAL_SURGERY',
  'PEDIATRICS',
  'OBSTETRICS_GYNECOLOGY',
  'FAMILY_MEDICINE',
  'PSYCHIATRY',
  'EMERGENCY_MEDICINE',
  'ANESTHESIOLOGY',
  'RADIOLOGY',
  'PATHOLOGY',
  'ORTHOPEDIC_SURGERY',
  'NEUROSURGERY',
  'CARDIOLOGY',
  'DERMATOLOGY',
  'NEUROLOGY',
  'UROLOGY',
  'PLASTIC_SURGERY',
  'OPHTHALMOLOGY',
];

const formatSpecialization = (spec: string) => {
  return spec.replace(/_/g, ' ').toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const features = [
  {
    icon: <PersonIcon sx={{ fontSize: 40 }} />,
    title: 'Patient Profiles',
    description: 'Manage your medical records and track appointments',
  },
  {
    icon: <HospitalIcon sx={{ fontSize: 40 }} />,
    title: 'Doctor Profiles',
    description: 'View doctor ratings, reviews, and professional experience',
  },
  {
    icon: <CalendarIcon sx={{ fontSize: 40 }} />,
    title: 'Easy Appointments',
    description: 'Book appointments online with your preferred doctors',
  },
  {
    icon: <PsychologyIcon sx={{ fontSize: 40 }} />,
    title: 'Mental Health Support',
    description: 'Connect with licensed mental health professionals for online therapy sessions',
  },
  {
    icon: <ArticleIcon sx={{ fontSize: 40 }} />,
    title: 'Healthcare Media',
    description: 'View posts and media from doctors about healthcare topics, tips, and medical insights',
  },
  {
    icon: <ShareIcon sx={{ fontSize: 40 }} />,
    title: 'Share Experiences',
    description: 'Rate and review your healthcare experiences',
  },
];

// Mock data for doctor posts
const mockPosts = [
  {
    id: 1,
    doctorName: 'Dr. Sarah Johnson',
    specialty: 'Primary Care',
    avatar: 'SJ',
    content: 'Important reminder: Regular check-ups are essential for maintaining good health. Schedule your annual physical today!',
    likes: 24,
    comments: 8,
    timestamp: '2 hours ago',
    isLiked: false,
  },
  {
    id: 2,
    doctorName: 'Dr. Michael Chen',
    specialty: 'Cardiology',
    avatar: 'MC',
    content: 'New research shows that 30 minutes of daily exercise can significantly reduce the risk of heart disease. Stay active, stay healthy!',
    likes: 42,
    comments: 15,
    timestamp: '5 hours ago',
    isLiked: true,
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [posts, setPosts] = React.useState(mockPosts);
  const [newComment, setNewComment] = React.useState('');
  const [videoStatus, setVideoStatus] = React.useState('Loading...');
  const videoRef = React.useRef<HTMLVideoElement>(null);
  
  // Search filters state
  const [searchName, setSearchName] = React.useState('');
  const [searchCity, setSearchCity] = React.useState('');
  const [searchSpecialty, setSearchSpecialty] = React.useState('');
  const [searchInsurance, setSearchInsurance] = React.useState<string | null>(null);
  const [priceRange, setPriceRange] = React.useState('');
  const [minRating, setMinRating] = React.useState<number | null>(0);
  
  // Doctor search results state
  const [doctors, setDoctors] = React.useState<any[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [searchError, setSearchError] = React.useState('');
  const [hasSearched, setHasSearched] = React.useState(false);

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleComment = (postId: number) => {
    if (newComment.trim()) {
      // TODO: Implement comment functionality
      setNewComment('');
    }
  };

  // Try to play video when component mounts
  React.useEffect(() => {
    const playVideo = async () => {
      if (videoRef.current) {
        try {
          console.log('Attempting to play video...');
          // Force load the video first
          videoRef.current.load();
          
          // Wait a bit for the video to load
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Try to play
          await videoRef.current.play();
          console.log('Video playing successfully');
        } catch (error) {
          console.log('Autoplay blocked, video will play on user interaction:', error);
          setVideoStatus('Click to play');
        }
      }
    };
    
    // Try multiple times with increasing delays
    setTimeout(playVideo, 500);
    setTimeout(playVideo, 2000);
    setTimeout(playVideo, 5000);
  }, []);

  // Handle click to play video if autoplay is blocked
  const handleVideoClick = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        console.log('Video started playing on click');
      } catch (error) {
        console.error('Error playing video:', error);
      }
    }
  };

  // Handle search - fetch doctors from API
  const handleSearch = async () => {
    setSearchLoading(true);
    setSearchError('');
    setHasSearched(true);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      // Clean search name - remove "Dr." prefix if present
      const cleanedName = searchName ? searchName.replace(/^dr\.?\s*/i, '').trim() : '';
      if (cleanedName) params.append('name', cleanedName);
      if (searchCity) params.append('city', searchCity);
      if (searchSpecialty) params.append('specialty', searchSpecialty);
      if (searchInsurance) params.append('insurance', searchInsurance);
      if (minRating && minRating > 0) params.append('minRating', minRating.toString());
      
      // Handle price range
      if (priceRange) {
        if (priceRange === 'under100') {
          params.append('maxFee', '100');
        } else if (priceRange === '100-200') {
          params.append('minFee', '100');
          params.append('maxFee', '200');
        } else if (priceRange === 'over200') {
          params.append('minFee', '200');
        }
      }

      // Build headers - only include Authorization if user is logged in
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add token only if user is logged in (optional for public search)
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const response = await fetch(`http://localhost:8080/healthprovider/search?${params.toString()}`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch doctors: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Search results:', data);
      setDoctors(data);
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Failed to search doctors. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleViewProfile = (doctorId: number) => {
    navigate(`/doctor-public-profile/${doctorId}`);
  };

  if (!isAuthenticated) {
    return (
      <Box>
        {/* Hero Section */}
        <Box
          sx={{
            position: 'relative',
            color: 'white',
            py: 8,
            mb: 6,
            overflow: 'hidden',
            cursor: 'pointer',
          }}
          onClick={handleVideoClick}
        >
          {/* Video Background */}
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: -2,
            }}
            onLoadStart={() => {
              console.log('Video loading started');
              setVideoStatus('Loading...');
            }}
            onCanPlay={() => {
              console.log('Video can play');
              setVideoStatus('Ready to play');
            }}
            onPlay={() => {
              console.log('Video started playing');
              setVideoStatus('Playing');
            }}
            onPause={() => {
              setVideoStatus('Paused');
            }}
            onError={(e) => {
              console.error('Video error:', e);
              setVideoStatus('Error - using fallback');
            }}
          >
            <source src="/videos/5867211-uhd_4096_2160_25fps.mp4" type="video/mp4" />
            <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
            <source src="https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4" type="video/mp4" />
            {/* Fallback for browsers that don't support video */}
            Your browser does not support the video tag.
          </video>
          
          {/* Fallback blue background */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              bgcolor: 'primary.main',
              zIndex: -3,
            }}
          />
          
          {/* Dark overlay for better text readability */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(25, 118, 210, 0.7)',
              zIndex: -1,
            }}
          />
          
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography 
                  variant="h2" 
                  component="h1" 
                  gutterBottom
                  sx={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
                  }}
                >
                  Connect with Healthcare Professionals
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 4,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                  }}
                >
                  Find the right doctor, book appointments, and manage your healthcare journey
                </Typography>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Get Started
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                {/* Add hero image here */}
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Search Filters Section */}
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Card sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              Search Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Search by Name"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Search by City"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Specialty</InputLabel>
                  <Select
                    value={searchSpecialty}
                    label="Specialty"
                    onChange={(e) => setSearchSpecialty(e.target.value)}
                    startAdornment={
                      <InputAdornment position="start">
                        <HospitalIcon />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="">All Specialties</MenuItem>
                    {specialties.map((specialty) => (
                      <MenuItem key={specialty} value={specialty}>
                        {formatSpecialization(specialty)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Insurance Provider</InputLabel>
                  <Select
                    value={searchInsurance || ''}
                    label="Insurance Provider"
                    onChange={(e) => setSearchInsurance(e.target.value || null)}
                  >
                    <MenuItem value="">All Insurance Providers</MenuItem>
                    {INSURANCE_PROVIDERS.map((insurance) => (
                      <MenuItem key={insurance} value={insurance}>
                        {insurance}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Price Range</InputLabel>
                  <Select
                    value={priceRange}
                    label="Price Range"
                    onChange={(e) => setPriceRange(e.target.value)}
                    startAdornment={
                      <InputAdornment position="start">
                        <AttachMoneyIcon />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="">All Prices</MenuItem>
                    <MenuItem value="under100">Under $100</MenuItem>
                    <MenuItem value="100-200">$100 - $200</MenuItem>
                    <MenuItem value="over200">Over $200</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '56px' }}>
                  <Typography component="legend" sx={{ minWidth: '120px' }}>Minimum Rating:</Typography>
                  <Rating
                    value={minRating}
                    onChange={(_, newValue) => setMinRating(newValue)}
                    precision={0.5}
                    size="medium"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleSearch}
                  startIcon={<SearchIcon />}
                  fullWidth
                  sx={{ height: '56px' }}
                  disabled={searchLoading}
                >
                  {searchLoading ? 'Searching...' : 'Search Doctors'}
                </Button>
              </Grid>
            </Grid>
          </Card>

          {/* Error Message */}
          {searchError && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {searchError}
            </Alert>
          )}

          {/* Loading State */}
          {searchLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Search Results */}
          {!searchLoading && hasSearched && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Search Results ({doctors.length} {doctors.length === 1 ? 'doctor' : 'doctors'} found)
              </Typography>
              
              {doctors.length === 0 ? (
                <Alert severity="info">
                  No doctors found matching your criteria. Try adjusting your search filters.
                </Alert>
              ) : (
                <Grid container spacing={3}>
                  {doctors.map((doctor) => (
                    <Grid item xs={12} md={6} key={doctor.id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar
                              src={doctor.profilePicture}
                              sx={{ width: 60, height: 60, mr: 2 }}
                            >
                              {doctor.firstName?.charAt(0)}{doctor.lastName?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="h6">
                                Dr. {doctor.firstName} {doctor.lastName}
                              </Typography>
                              <Typography color="textSecondary" variant="body2">
                                {doctor.clinicName || 'Private Practice'}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Specializations:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {doctor.specializations?.map((spec: string, idx: number) => (
                                <Chip 
                                  key={idx} 
                                  label={formatSpecialization(spec)} 
                                  size="small" 
                                  color="primary"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>

                          <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                            <LocationIcon sx={{ fontSize: 16, mr: 0.5 }} /> 
                            {doctor.city || 'Location not specified'}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Consultation Fee: ${doctor.consultationFee || 'N/A'}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Rating value={doctor.rating} readOnly precision={0.1} size="small" />
                            <Typography variant="body2" color="text.secondary">
                              ({doctor.rating?.toFixed(1)})
                            </Typography>
                          </Box>

                          {doctor.insuranceAccepted && doctor.insuranceAccepted.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Accepted Insurance:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {doctor.insuranceAccepted.slice(0, 3).map((ins: string, idx: number) => (
                                  <Chip 
                                    key={idx} 
                                    label={ins} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                ))}
                                {doctor.insuranceAccepted.length > 3 && (
                                  <Chip 
                                    label={`+${doctor.insuranceAccepted.length - 3} more`} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            color="primary"
                            onClick={() => handleViewProfile(doctor.id)}
                          >
                            View Profile
                          </Button>
                          {/* Show "Book Appointment" - enabled for patients, disabled for doctors/admins, sign up for non-logged-in */}
                          {user?.token && user?.type === 'patient' ? (
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="primary"
                              onClick={() => navigate(`/book-appointment/${doctor.id}`)}
                            >
                              Book Appointment
                            </Button>
                          ) : user?.token && (user?.type === 'doctor' || user?.type === 'admin') ? (
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="primary"
                              disabled
                              sx={{
                                cursor: 'not-allowed',
                              }}
                            >
                              Book Appointment
                            </Button>
                          ) : (
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="primary"
                              onClick={() => navigate('/register')}
                            >
                              Sign Up to Book
                            </Button>
                          )}
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </Container>

        {/* Features Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" component="h2" align="center" gutterBottom>
            Why Choose MeddieConnect?
          </Typography>
          <Grid container spacing={4} sx={{ mt: 4 }}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6,
                      backgroundColor: 'primary.50',
                      '& .feature-icon': {
                        transform: 'scale(1.2) rotate(5deg)',
                      },
                      '& .feature-title': {
                        color: 'primary.main',
                      },
                    },
                  }}
                >
                  <CardContent>
                    <Box 
                      className="feature-icon"
                      sx={{ 
                        color: 'primary.main', 
                        mb: 2,
                        transition: 'transform 0.3s ease-in-out',
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography 
                      className="feature-title"
                      variant="h5" 
                      component="h3" 
                      gutterBottom
                      sx={{
                        transition: 'color 0.3s ease-in-out',
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* CTA Section */}
        <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
          <Container maxWidth="md">
            <Typography variant="h3" component="h2" align="center" gutterBottom>
              Ready to Get Started?
            </Typography>
            <Typography variant="h6" align="center" color="text.secondary" paragraph>
              Join thousands of patients who have found their perfect healthcare match through MeddieConnect
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
              <Button
                variant="text"
                color="primary"
                onClick={() => navigate('/register')}
              >
                Register as Patient
              </Button>
              <Button
                variant="text"
                color="primary"
                onClick={() => navigate('/doctor-register')}
              >
                Register as Doctor
              </Button>
            </Box>
          </Container>
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            py: 6,
            mt: 8,
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              {/* Company Info */}
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  MeddieConnect
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                  Connecting patients with healthcare professionals for better health outcomes.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <IconButton
                    size="small"
                    sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}
                  >
                    <FacebookIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}
                  >
                    <TwitterIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}
                  >
                    <LinkedInIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}
                  >
                    <InstagramIcon />
                  </IconButton>
                </Box>
              </Grid>

              {/* Quick Links */}
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Quick Links
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    color="inherit"
                    onClick={() => navigate('/find-doctor')}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none', opacity: 0.9, '&:hover': { opacity: 1 } }}
                  >
                    Find a Doctor
                  </Button>
                  <Button
                    color="inherit"
                    onClick={() => navigate('/register')}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none', opacity: 0.9, '&:hover': { opacity: 1 } }}
                  >
                    Register as Patient
                  </Button>
                  <Button
                    color="inherit"
                    onClick={() => navigate('/doctor-register')}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none', opacity: 0.9, '&:hover': { opacity: 1 } }}
                  >
                    Register as Doctor
                  </Button>
                  <Button
                    color="inherit"
                    onClick={() => navigate('/patient-login')}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none', opacity: 0.9, '&:hover': { opacity: 1 } }}
                  >
                    Login
                  </Button>
                  <Button
                    color="inherit"
                    onClick={() => navigate('/admin/login')}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none', opacity: 0.9, '&:hover': { opacity: 1 } }}
                  >
                    Admin Login
                  </Button>
                </Box>
              </Grid>

              {/* Services */}
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Services
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Online Appointments
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Mental Health Support
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Medical Records
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Doctor Reviews
                  </Typography>
                </Box>
              </Grid>

              {/* Contact Info */}
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Contact Us
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon sx={{ fontSize: 20, opacity: 0.9 }} />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      support@meddiconnect.com
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon sx={{ fontSize: 20, opacity: 0.9 }} />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      07981589012
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <LocationIcon sx={{ fontSize: 20, opacity: 0.9, mt: 0.5 }} />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      123 Healthcare Ave<br />
                      Medical District, MD 12345
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 4, bgcolor: 'rgba(255, 255, 255, 0.2)' }} />

            {/* Copyright */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                © {new Date().getFullYear()} MeddieConnect. All rights reserved.
              </Typography>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Button
                  color="inherit"
                  size="small"
                  sx={{ textTransform: 'none', opacity: 0.8, '&:hover': { opacity: 1 } }}
                >
                  Privacy Policy
                </Button>
                <Button
                  color="inherit"
                  size="small"
                  sx={{ textTransform: 'none', opacity: 0.8, '&:hover': { opacity: 1 } }}
                >
                  Terms of Service
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Healthcare Feed
      </Typography>
      
      {posts.map((post) => (
        <Card key={post.id} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ mr: 2 }}>{post.avatar}</Avatar>
              <Box>
                <Typography variant="subtitle1" component="div">
                  {post.doctorName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {post.specialty}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body1" paragraph>
              {post.content}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {post.timestamp}
            </Typography>
          </CardContent>
          <Divider />
          <CardActions>
            <IconButton onClick={() => handleLike(post.id)}>
              {post.isLiked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              {post.likes}
            </Typography>
            <IconButton>
              <CommentIcon />
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              {post.comments}
            </Typography>
            <IconButton>
              <ShareIcon />
            </IconButton>
          </CardActions>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <IconButton color="primary" onClick={() => handleComment(post.id)}>
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Card>
      ))}
    </Container>
  );
};

export default Home; 