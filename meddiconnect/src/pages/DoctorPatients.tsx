import React from 'react';
import { Typography, Box, Card, CardContent, Alert } from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';
import DoctorLayout from '../components/DoctorLayout';

const DoctorPatients = () => {
  return (
    <DoctorLayout title="My Patients" subtitle="View and manage your patient list">
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <PeopleIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            My Patients
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            This feature is coming soon. You'll be able to view and manage your patient list here.
          </Typography>
          <Alert severity="info">
            Patient management functionality will be implemented in a future update.
          </Alert>
        </CardContent>
      </Card>
    </DoctorLayout>
  );
};

export default DoctorPatients;
