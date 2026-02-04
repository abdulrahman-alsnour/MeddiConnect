import React from 'react';
import { useNavigate } from 'react-router-dom';
import SocialFeed from '../components/SocialFeed';
import PatientLayout from '../components/PatientLayout';



const PatientDashboard = () => {
  const navigate = useNavigate();

  return (
    <PatientLayout 
      title="Healthcare Feed" 
      subtitle="Stay updated with medical insights and health tips from healthcare professionals"
    >
      <SocialFeed />
    </PatientLayout>
  );
};

export default PatientDashboard;
