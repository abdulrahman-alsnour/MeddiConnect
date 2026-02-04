import React from 'react';
import { Link, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface DoctorNameLinkProps {
  doctorId: number;
  doctorName: string;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption';
  fontWeight?: 'normal' | 'bold' | number;
  color?: string;
  sx?: any;
}

const DoctorNameLink: React.FC<DoctorNameLinkProps> = ({
  doctorId,
  doctorName,
  variant = 'body1',
  fontWeight = 'bold',
  color = 'primary',
  sx = {}
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If the doctor clicks their own name, take them to their editable profile
    // Otherwise, take them to the read-only public view
    if (user?.id === doctorId && user?.type === 'doctor') {
      navigate('/doctor-public-profile');
    } else {
      navigate(`/doctor-public-profile/${doctorId}`);
    }
  };

  return (
    <Typography
      component={Link}
      variant={variant}
      fontWeight={fontWeight}
      color={color}
      onClick={handleClick}
      sx={{
        cursor: 'pointer',
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
          color: 'primary.dark'
        },
        ...sx
      }}
    >
      {doctorName}
    </Typography>
  );
};

export default DoctorNameLink;
