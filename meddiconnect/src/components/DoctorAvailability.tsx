import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Stack,
  styled,
} from '@mui/material';
import DoctorLayout from './DoctorLayout';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  day: string;
  timeSlot: TimeSlot;
}

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'white',
    '& fieldset': {
      borderColor: '#e0e0e0',
    },
    '&:hover fieldset': {
      borderColor: '#2196f3',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#2196f3',
    },
  },
  '& .MuiInputBase-input': {
    padding: '10px 14px',
    fontSize: '16px',
  },
});

const DayContainer = styled(Box)({
  marginBottom: '24px',
});

const DayLabel = styled(Typography)({
  fontWeight: 500,
  marginBottom: '12px',
  color: '#333',
});

const TimeContainer = styled(Box)({
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
});

const TimeLabel = styled(Typography)({
  fontSize: '14px',
  color: '#666',
  marginBottom: '4px',
});

const DoctorAvailability = () => {
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { day: 'Monday', timeSlot: { startTime: '', endTime: '' } },
    { day: 'Tuesday', timeSlot: { startTime: '', endTime: '' } },
    { day: 'Wednesday', timeSlot: { startTime: '', endTime: '' } },
    { day: 'Thursday', timeSlot: { startTime: '', endTime: '' } },
    { day: 'Friday', timeSlot: { startTime: '', endTime: '' } },
    { day: 'Saturday', timeSlot: { startTime: '', endTime: '' } },
  ]);

  const handleTimeChange = (day: string, type: 'startTime' | 'endTime', value: string) => {
    setSchedule(prevSchedule =>
      prevSchedule.map(daySchedule =>
        daySchedule.day === day
          ? {
              ...daySchedule,
              timeSlot: {
                ...daySchedule.timeSlot,
                [type]: value,
              },
            }
          : daySchedule
      )
    );
  };

  return (
    <DoctorLayout title="Availability" subtitle="Manage your availability schedule">
      <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto', bgcolor: '#f8f9fa' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 4, color: '#333' }}>
          Set Your Availability
        </Typography>
        
        <Stack spacing={2}>
          {schedule.map((daySchedule) => (
            <DayContainer key={daySchedule.day}>
              <DayLabel variant="h6">
                {daySchedule.day}
              </DayLabel>
              <TimeContainer>
                <Box sx={{ flex: 1 }}>
                  <TimeLabel>
                    Start Time
                  </TimeLabel>
                  <StyledTextField
                    fullWidth
                    type="time"
                    value={daySchedule.timeSlot.startTime}
                    onChange={(e) =>
                      handleTimeChange(daySchedule.day, 'startTime', e.target.value)
                    }
                    InputProps={{
                      inputProps: {
                        style: { paddingLeft: '8px' }
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <TimeLabel>
                    End Time
                  </TimeLabel>
                  <StyledTextField
                    fullWidth
                    type="time"
                    value={daySchedule.timeSlot.endTime}
                    onChange={(e) =>
                      handleTimeChange(daySchedule.day, 'endTime', e.target.value)
                    }
                    InputProps={{
                      inputProps: {
                        style: { paddingLeft: '8px' }
                      }
                    }}
                  />
                </Box>
              </TimeContainer>
            </DayContainer>
          ))}
        </Stack>
      </Paper>
    </DoctorLayout>
  );
};

export default DoctorAvailability; 