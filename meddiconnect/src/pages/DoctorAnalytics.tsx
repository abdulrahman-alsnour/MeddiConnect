import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Visibility,
  ThumbUp,
  Comment,
  CalendarToday,
  People,
  Assessment,
  Favorite,
  PostAdd,
} from '@mui/icons-material';
import DoctorLayout from '../components/DoctorLayout';
import { useAuth } from '../context/AuthContext';

interface AnalyticsData {
  // Profile views
  profileViews: number;
  profileViewsThisMonth: number;
  profileViewsLastMonth: number;
  profileViewsChange: number;
  
  // Post statistics
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalEngagement: number;
  avgEngagementPerPost: number;
  postEngagementData: Array<{
    postId: number;
    likes: number;
    comments: number;
    engagement: number;
    createdAt: string;
  }>;
  
  // Appointment statistics
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  rescheduledAppointments: number;
  monthlyAppointmentTrends: Array<{
    month: string;
    count: number;
  }>;
  
  // Patient growth
  totalPatients: number;
  newPatientsThisMonth: number;
  
  // Engagement trends
  monthlyPostEngagement: Array<{
    month: string;
    likes: number;
    comments: number;
    total: number;
  }>;
  
  // Key metrics
  conversionRate: number;
  completionRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Custom Line Chart Component
const SimpleLineChart: React.FC<{ data: Array<{ month: string; value: number }>; height?: number }> = ({ data, height = 300 }) => {
  if (!data || data.length === 0) {
    return <Typography color="text.secondary">No data available</Typography>;
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartWidth = 600;
  const chartHeight = height - 60;
  const padding = 40;
  const pointRadius = 4;
  const strokeWidth = 2;

  const getX = (index: number) => padding + (index * (chartWidth - 2 * padding)) / (data.length - 1 || 1);
  const getY = (value: number) => chartHeight + padding - (value / maxValue) * chartHeight;

  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

  return (
    <Box sx={{ width: '100%', height: height }}>
      <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} style={{ maxWidth: '100%' }}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = padding + (chartHeight / 4) * i;
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={chartWidth - padding}
              y2={y}
              stroke="#e0e0e0"
              strokeDasharray="3 3"
            />
          );
        })}
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#0088FE"
          strokeWidth={strokeWidth}
        />
        
        {/* Points */}
        {data.map((d, i) => (
          <g key={i}>
            <circle
              cx={getX(i)}
              cy={getY(d.value)}
              r={pointRadius}
              fill="#0088FE"
            />
            <title>{`${d.month}: ${d.value}`}</title>
          </g>
        ))}
        
        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={getX(i)}
            y={chartHeight + padding + 20}
            textAnchor="middle"
            fontSize="12"
            fill="#666"
          >
            {d.month}
          </text>
        ))}
        
        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4].map(i => {
          const value = Math.round((maxValue / 4) * (4 - i));
          const y = padding + (chartHeight / 4) * i;
          return (
            <text
              key={i}
              x={padding - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="12"
              fill="#666"
            >
              {value}
            </text>
          );
        })}
      </svg>
    </Box>
  );
};

// Custom Bar Chart Component
const SimpleBarChart: React.FC<{ data: Array<{ month: string; value: number }>; height?: number; color?: string }> = ({ 
  data, 
  height = 300,
  color = '#00C49F'
}) => {
  if (!data || data.length === 0) {
    return <Typography color="text.secondary">No data available</Typography>;
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartWidth = 600;
  const chartHeight = height - 60;
  const padding = 40;
  const barWidth = (chartWidth - 2 * padding) / data.length - 10;

  const getX = (index: number) => padding + index * ((chartWidth - 2 * padding) / data.length);
  const getHeight = (value: number) => (value / maxValue) * chartHeight;

  return (
    <Box sx={{ width: '100%', height: height }}>
      <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} style={{ maxWidth: '100%' }}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = padding + (chartHeight / 4) * i;
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={chartWidth - padding}
              y2={y}
              stroke="#e0e0e0"
              strokeDasharray="3 3"
            />
          );
        })}
        
        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = getHeight(d.value);
          const x = getX(i);
          const y = chartHeight + padding - barHeight;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx={4}
              />
              <title>{`${d.month}: ${d.value}`}</title>
            </g>
          );
        })}
        
        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={getX(i) + barWidth / 2}
            y={chartHeight + padding + 20}
            textAnchor="middle"
            fontSize="12"
            fill="#666"
          >
            {d.month}
          </text>
        ))}
        
        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4].map(i => {
          const value = Math.round((maxValue / 4) * (4 - i));
          const y = padding + (chartHeight / 4) * i;
          return (
            <text
              key={i}
              x={padding - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="12"
              fill="#666"
            >
              {value}
            </text>
          );
        })}
      </svg>
    </Box>
  );
};

// Custom Pie Chart Component using Progress Bars
const SimplePieChart: React.FC<{ data: Array<{ name: string; value: number; color: string }> }> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return <Typography color="text.secondary">No data available</Typography>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      {data.map((item, index) => {
        const percentage = (item.value / total) * 100;
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: item.color,
                  }}
                />
                <Typography variant="body2" fontWeight="medium">
                  {item.name}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {item.value} ({percentage.toFixed(1)}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{
                height: 12,
                borderRadius: 1,
                backgroundColor: 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: item.color,
                  borderRadius: 1,
                },
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
};

const DoctorAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:8080/analytics/doctor', {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch analytics' }));
          throw new Error(errorData.message || 'Failed to fetch analytics');
        }

        const data = await response.json();
        if (data.status === 'success' && data.data) {
          setAnalytics(data.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error: any) {
        console.error('Error fetching analytics:', error);
        setError(error.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user?.token]);

  if (loading) {
    return (
      <DoctorLayout title="Analytics" subtitle="Track your performance and engagement">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </DoctorLayout>
    );
  }

  if (error || !analytics) {
    return (
      <DoctorLayout title="Analytics" subtitle="Track your performance and engagement">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Failed to load analytics data'}
        </Alert>
      </DoctorLayout>
    );
  }

  // Prepare data for charts
  const appointmentStatusData = [
    { name: 'Completed', value: analytics.completedAppointments, color: COLORS[1] },
    { name: 'Confirmed', value: analytics.confirmedAppointments, color: COLORS[0] },
    { name: 'Pending', value: analytics.pendingAppointments, color: COLORS[2] },
    { name: 'Rescheduled', value: analytics.rescheduledAppointments, color: COLORS[3] },
    { name: 'Cancelled', value: analytics.cancelledAppointments, color: COLORS[4] },
  ].filter(item => item.value > 0);

  // Format monthly data for better display
  const formatMonthlyData = (data: Array<{ month: string; count?: number; total?: number }>) => {
    return data.map(item => ({
      month: item.month.split('-').reverse().join('/'),
      value: item.count || item.total || 0,
    }));
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: number;
    subtitle?: string;
    color?: string;
  }> = ({ title, value, icon, change, subtitle, color = 'primary' }) => (
    <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold" color={`${color}.main`}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color: `${color}.main` }}>{icon}</Box>
        </Box>
        {change !== undefined && (
          <Box display="flex" alignItems="center" mt={1}>
            {change >= 0 ? (
              <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
            ) : (
              <TrendingDown sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
            )}
            <Typography
              variant="body2"
              color={change >= 0 ? 'success.main' : 'error.main'}
              fontWeight="medium"
            >
              {Math.abs(change).toFixed(1)}% {change >= 0 ? 'increase' : 'decrease'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DoctorLayout title="Analytics" subtitle="Track your performance and engagement">
      <Box>
        {/* Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Profile Views"
              value={analytics.profileViews.toLocaleString()}
              icon={<Visibility />}
              change={analytics.profileViewsChange}
              subtitle={`${analytics.profileViewsThisMonth} this month`}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Engagement"
              value={analytics.totalEngagement.toLocaleString()}
              icon={<Favorite />}
              subtitle={`${analytics.totalLikes} likes, ${analytics.totalComments} comments`}
              color="error"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Appointments"
              value={analytics.totalAppointments}
              icon={<CalendarToday />}
              subtitle={`${analytics.completedAppointments} completed`}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Patients"
              value={analytics.totalPatients}
              icon={<People />}
              subtitle={`${analytics.newPatientsThisMonth} new this month`}
              color="info"
            />
          </Grid>
        </Grid>

        {/* Engagement Metrics */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Posts
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {analytics.totalPosts}
                    </Typography>
                  </Box>
                  <PostAdd sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Avg Engagement/Post
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {analytics.avgEngagementPerPost.toFixed(1)}
                    </Typography>
                  </Box>
                  <Assessment sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Conversion Rate
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {analytics.conversionRate.toFixed(1)}%
                    </Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: 40, color: 'info.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Completion Rate
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {analytics.completionRate.toFixed(1)}%
                    </Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: 40, color: 'warning.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          {/* Monthly Appointments Trend */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Appointments Trend (Last 6 Months)
              </Typography>
              <SimpleLineChart data={formatMonthlyData(analytics.monthlyAppointmentTrends)} height={300} />
            </Paper>
          </Grid>

          {/* Monthly Post Engagement */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Post Engagement Trend (Last 6 Months)
              </Typography>
              <SimpleBarChart data={formatMonthlyData(analytics.monthlyPostEngagement)} height={300} color="#00C49F" />
            </Paper>
          </Grid>

          {/* Appointment Status Distribution */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Appointment Status Distribution
              </Typography>
              <SimplePieChart data={appointmentStatusData} />
            </Paper>
          </Grid>

          {/* Post Engagement Breakdown */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Post Engagement Breakdown
              </Typography>
              <Box display="flex" justifyContent="center" alignItems="center" gap={4} sx={{ mt: 3 }}>
                <Box textAlign="center">
                  <ThumbUp sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {analytics.totalLikes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Likes
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Comment sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {analytics.totalComments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Comments
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <PostAdd sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {analytics.totalPosts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Posts
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Appointment Status Summary */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold" mb={2}>
                Appointment Status Summary
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Chip
                  icon={<CalendarToday />}
                  label={`Pending: ${analytics.pendingAppointments}`}
                  color="warning"
                  variant="outlined"
                  sx={{ fontSize: '0.95rem', p: 2 }}
                />
                <Chip
                  icon={<CalendarToday />}
                  label={`Confirmed: ${analytics.confirmedAppointments}`}
                  color="info"
                  variant="outlined"
                  sx={{ fontSize: '0.95rem', p: 2 }}
                />
                <Chip
                  icon={<CalendarToday />}
                  label={`Completed: ${analytics.completedAppointments}`}
                  color="success"
                  variant="outlined"
                  sx={{ fontSize: '0.95rem', p: 2 }}
                />
                <Chip
                  icon={<CalendarToday />}
                  label={`Cancelled: ${analytics.cancelledAppointments}`}
                  color="error"
                  variant="outlined"
                  sx={{ fontSize: '0.95rem', p: 2 }}
                />
                <Chip
                  icon={<CalendarToday />}
                  label={`Rescheduled: ${analytics.rescheduledAppointments}`}
                  color="default"
                  variant="outlined"
                  sx={{ fontSize: '0.95rem', p: 2 }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </DoctorLayout>
  );
};

export default DoctorAnalytics;
