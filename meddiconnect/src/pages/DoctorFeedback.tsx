/**
 * Doctor Feedback Page
 * 
 * Displays all reviews and ratings received by the doctor.
 * Shows average rating, total reviews, and individual review details.
 * 
 * Features:
 * - Average rating display with stars
 * - Total review count
 * - List of all reviews with patient names, ratings, and notes
 * - Sortable by date (newest first)
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Rating,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Star,
  RateReview,
  Person,
  CalendarToday,
} from '@mui/icons-material';
import DoctorLayout from '../components/DoctorLayout';
import { useAuth } from '../context/AuthContext';

// Review interface
interface Review {
  id: number;
  appointmentId: number;
  patientName: string;
  rating: number;
  notes: string | null;
  createdAt: string;
  appointmentDate?: string;
}

const DoctorFeedback: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user?.token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('http://localhost:8080/reviews/doctor', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch reviews' }));
          throw new Error(errorData.message || 'Failed to fetch reviews');
        }

        const data = await response.json();

        if (data.status === 'success') {
          setReviews(data.data || []);
          setAverageRating(data.averageRating || 0);
          setTotalReviews(data.totalReviews || 0);
        }
      } catch (error: any) {
        console.error('Error fetching reviews:', error);
        setError(error.message || 'Failed to fetch reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [user?.token]);

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  /**
   * Format date and time for display
   */
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <DoctorLayout title="Feedback & Reviews" subtitle="View patient feedback and ratings">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout title="Feedback & Reviews" subtitle="View patient feedback and ratings">
      <Box>
        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Average Rating Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Your Overall Rating
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Rating value={averageRating} readOnly precision={0.1} size="large" />
                  <Typography variant="h4" fontWeight="bold">
                    {averageRating.toFixed(1)}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    out of 5.0
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" color="text.secondary">
                  Total Reviews
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="primary">
                  {totalReviews}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <RateReview sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Reviews Yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You haven't received any reviews from patients yet. Reviews will appear here after patients complete appointments.
            </Typography>
          </Paper>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Patient Reviews ({reviews.length})
            </Typography>
            {reviews.map((review, index) => (
              <Card key={review.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* Patient Avatar */}
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {review.patientName.split(' ').map(n => n[0]).join('')}
                    </Avatar>

                    {/* Review Content */}
                    <Box sx={{ flex: 1 }}>
                      {/* Patient Name and Rating */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                        <Box>
                          <Typography variant="h6">{review.patientName}</Typography>
                          {review.appointmentDate && (
                            <Typography variant="body2" color="text.secondary">
                              Appointment: {formatDate(review.appointmentDate)}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating value={review.rating} readOnly size="small" />
                          <Typography variant="body2" fontWeight="bold">
                            {review.rating}/5
                          </Typography>
                        </Box>
                      </Box>

                      {/* Review Notes */}
                      {review.notes && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="body1">{review.notes}</Typography>
                        </Box>
                      )}

                      {/* Review Date */}
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Reviewed on {formatDateTime(review.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </DoctorLayout>
  );
};

export default DoctorFeedback;

