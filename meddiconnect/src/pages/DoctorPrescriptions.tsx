import React from 'react';
import { Typography, Box, Card, CardContent, Alert } from '@mui/material';
import { Medication as MedicationIcon } from '@mui/icons-material';
import DoctorLayout from '../components/DoctorLayout';

const DoctorPrescriptions = () => {
  return (
    <DoctorLayout title="Prescriptions" subtitle="Write and manage prescriptions">
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <MedicationIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Prescriptions
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            This feature is coming soon. You'll be able to write and manage prescriptions here.
          </Typography>
          <Alert severity="info">
            Prescription management functionality will be implemented in a future update.
          </Alert>
        </CardContent>
      </Card>
    </DoctorLayout>
  );
};

export default DoctorPrescriptions;
