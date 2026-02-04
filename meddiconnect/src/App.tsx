import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import Navigation from './components/Navigation';
import PatientAssistantChat from './components/PatientAssistantChat';
import Home from './pages/Home';
import Register from './pages/Register';
import DoctorRegister from './pages/DoctorRegister';
import Login from './pages/Login';
import PatientLogin from './pages/PatientLogin';
import DoctorLogin from './pages/DoctorLogin';
import AdminLogin from './pages/AdminLogin';
import PatientDashboard from './pages/PatientDashboard';
import PatientProfile from './pages/PatientProfile';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorProfile from './pages/DoctorProfile';
import DoctorPublicProfile from './pages/DoctorPublicProfile';
import DoctorPublicView from './pages/DoctorPublicView';
import DoctorPatients from './pages/DoctorPatients';
import DoctorAppointments from './pages/DoctorAppointments';
import DoctorSchedule from './pages/DoctorSchedule';
import DoctorOnlineAppointments from './pages/DoctorOnlineAppointments';
import DoctorPrescriptions from './pages/DoctorPrescriptions';
import FindDoctor from './pages/FindDoctor';
import DoctorAvailability from './components/DoctorAvailability';
import MenuPage from './pages/MenuPage';
import DoctorSettings from './pages/DoctorSettings';
import PatientSettings from './pages/PatientSettings';
import UserActivity from './pages/UserActivity';
import BookAppointment from './pages/BookAppointment';
import PatientAppointments from './pages/PatientAppointments';
import OnlineAppointments from './pages/OnlineAppointments';
import PatientChat from './pages/PatientChat';
import DoctorChat from './pages/DoctorChat';
import DoctorAnalytics from './pages/DoctorAnalytics';
import DoctorFeedback from './pages/DoctorFeedback';
import VideoCall from './pages/VideoCall';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AdminDashboard from './pages/AdminDashboard';
import AdminPosts from './pages/AdminPosts';
import AdminDoctors from './pages/AdminDoctors';
import AdminPatients from './pages/AdminPatients';
import AdminDoctorApprovals from './pages/AdminDoctorApprovals';

const AppContent = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Show Navigation for home, login, and registration pages
  // Hide Navigation for dashboard pages and find-doctor (they have their own navigation)
  const isLoginOrRegister = location.pathname === '/login' || 
                            location.pathname === '/patient-login' || 
                            location.pathname === '/doctor-login' ||
                            location.pathname === '/register' || 
                            location.pathname === '/doctor-register';
  
  const isDashboardPage = (location.pathname.startsWith('/doctor-') || 
                          location.pathname.startsWith('/doctor/') ||
                          location.pathname.startsWith('/patient-') ||
                          location.pathname.startsWith('/online-appointments') ||
                          location.pathname.startsWith('/doctor-online-appointments') ||
                          location.pathname.startsWith('/video-call/')) && 
                          !isLoginOrRegister;
  
  // Public pages that should show landing page navigation (only for non-logged-in users)
  const isPublicPage = location.pathname === '/find-doctor' ||
                       location.pathname.startsWith('/doctor-public-profile/') ||
                       location.pathname.startsWith('/doctor/');

  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Show landing page Navigation only for:
  // 1. Landing page (/)
  // 2. Login/Register pages
  // 3. Public pages (find-doctor, doctor-public-profile) BUT ONLY if user is NOT logged in
  //    (logged-in users will see their dashboard navigation from PatientLayout/DoctorLayout)
  const shouldShowNavigationBase = location.pathname === '/' || 
                                   isLoginOrRegister || 
                                   (isPublicPage && !isAuthenticated) ||
                                   (location.pathname !== '/user-activity' && 
                                    !location.pathname.startsWith('/book-appointment/') &&
                                    !isDashboardPage &&
                                    !isPublicPage);

  const shouldShowNavigation = !isAdminRoute && shouldShowNavigationBase;
  const isPatientArea = location.pathname.startsWith('/patient');
  const isLandingPage = location.pathname === '/';
  const shouldShowChatWidget = !isAdminRoute && (isLandingPage || isPatientArea);
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {shouldShowNavigation && <Navigation />}
      {/* Add top padding to account for fixed Navigation AppBar */}
      {shouldShowNavigation && <Box sx={{ height: 64 }} />}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/patient-login" element={<PatientLogin />} />
          <Route path="/doctor-login" element={<DoctorLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/doctor-register" element={<DoctorRegister />} />
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/patient-profile" element={<PatientProfile />} />
          <Route path="/patient-records" element={<PatientDashboard />} /> {/* Placeholder */}
          <Route path="/patient-prescriptions" element={<PatientDashboard />} /> {/* Placeholder */}
          <Route path="/patient-chat" element={<PatientChat />} />
          <Route path="/patient-favorites" element={<PatientDashboard />} /> {/* Placeholder */}
          <Route path="/patient-history" element={<PatientDashboard />} /> {/* Placeholder */}
          <Route path="/patient-notifications" element={<PatientDashboard />} /> {/* Placeholder */}
          <Route path="/patient-settings" element={<PatientSettings />} />
          <Route path="/patient-appointments" element={<PatientAppointments />} />
          <Route path="/online-appointments" element={<OnlineAppointments />} />
          <Route path="/user-activity" element={<UserActivity />} />
          <Route path="/book-appointment/:id" element={<BookAppointment />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor-profile" element={<DoctorProfile />} />
          <Route path="/doctor-public-profile" element={<DoctorPublicProfile />} />
          <Route path="/doctor-patients" element={<DoctorPatients />} />
          <Route path="/doctor-appointments" element={<DoctorAppointments />} />
          <Route path="/doctor-schedule" element={<DoctorSchedule />} />
          <Route path="/doctor-online-appointments" element={<DoctorOnlineAppointments />} />
          <Route path="/doctor-prescriptions" element={<DoctorPrescriptions />} />
          <Route path="/patient-records" element={<DoctorPatients />} />
          <Route path="/doctor-chat" element={<DoctorChat />} />
          <Route path="/doctor-analytics" element={<DoctorAnalytics />} />
          <Route path="/doctor-feedback" element={<DoctorFeedback />} />
          <Route path="/doctor-settings" element={<DoctorSettings />} />
          <Route path="/video-call/:appointmentId" element={<VideoCall />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/posts" element={<AdminPosts />} />
          <Route path="/admin/doctors" element={<AdminDoctors />} />
          <Route path="/admin/doctor-approvals" element={<AdminDoctorApprovals />} />
          <Route path="/admin/patients" element={<AdminPatients />} />
          <Route path="/find-doctor" element={<FindDoctor />} />
          <Route path="/doctor/:id" element={<DoctorPublicView />} />
          <Route path="/doctor-public-profile/:id" element={<DoctorPublicView />} />
          <Route path="/doctor/availability" element={<DoctorAvailability />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/feed" element={<div>Social Feed Page</div>} />
        </Routes>
      </Box>
      {shouldShowChatWidget && <PatientAssistantChat />}
    </Box>
  );
};

function App() {
  console.log('App component rendered');
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
