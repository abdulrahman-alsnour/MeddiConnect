import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  InputAdornment,
  Avatar,
  CircularProgress,
  Alert,
  Rating,
  Container,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { useAuth } from '../context/AuthContext';
import PatientLayout from '../components/PatientLayout';
import DoctorLayout from '../components/DoctorLayout';
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

interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  specializations: string[];
  city: string;
  clinicName: string;
  consultationFee: number;
  insuranceAccepted: string[];
  bio: string;
  rating: number;
}

const FindDoctor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [searchName, setSearchName] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchSpecialty, setSearchSpecialty] = useState('');
  const [searchInsurance, setSearchInsurance] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState('');
  const [minRating, setMinRating] = useState<number | null>(0);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);

  // Load all doctors on initial mount (works for both logged-in and non-logged-in users)
  useEffect(() => {
    if (initialLoad) {
      handleSearch();
      setInitialLoad(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async () => {
    setLoading(true);
    setError('');

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
      setError('Failed to search doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (doctorId: number) => {
    navigate(`/doctor-public-profile/${doctorId}`);
  };

  const formatSpecialization = (spec: string) => {
    return spec.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Only use layout if user is logged in, otherwise render without sidebar
  const Layout = user?.token 
    ? (user?.type === 'doctor' ? DoctorLayout : PatientLayout)
    : ({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) => (
        <Box>
          <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 2, mb: 4 }}>
            <Container maxWidth="lg">
              <Typography variant="h4" component="h1" gutterBottom>
                {title || 'Find a Doctor'}
              </Typography>
              {subtitle && (
                <Typography variant="body1">
                  {subtitle}
                </Typography>
              )}
            </Container>
          </Box>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            {children}
          </Container>
        </Box>
      );

  const content = (
    <Box>

      {/* Search Filters */}
      <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
        <Typography variant="h6" gutterBottom>
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
                    <LocationOnIcon />
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
                    <LocalHospitalIcon />
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
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search Doctors'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Search Results */}
      {!loading && (
        <>
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
                          {doctor.specializations?.map((spec, idx) => (
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
                        <LocationOnIcon sx={{ fontSize: 16, mr: 0.5 }} /> 
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
                            {doctor.insuranceAccepted.slice(0, 3).map((ins, idx) => (
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
        </>
      )}
    </Box>
  );

  return (
    <Layout
      title="Find a Doctor"
      subtitle="Search for healthcare professionals based on your preferences"
    >
      {content}
    </Layout>
  );
};

export default FindDoctor;
