import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Hotel as HotelIcon,
  People as PeopleIcon,
  BookOnline as BookOnlineIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  Login as CheckInIcon,
  Logout as CheckOutIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

const Dashboard = () => {
  // Fetch dashboard data
  const { data: overview, isLoading: overviewLoading } = useQuery(
    'dashboard-overview',
    () => axios.get('/dashboard/overview').then(res => res.data)
  );

  const { data: recentBookings } = useQuery(
    'recent-bookings',
    () => axios.get('/dashboard/recent-bookings?limit=5').then(res => res.data)
  );

  const { data: upcomingActivities } = useQuery(
    'upcoming-activities',
    () => axios.get('/dashboard/upcoming-activities?days=3').then(res => res.data)
  );

  const { data: revenueAnalytics } = useQuery(
    'revenue-analytics',
    () => axios.get('/dashboard/revenue-analytics?period=7').then(res => res.data)
  );

  const { data: roomStatus } = useQuery(
    'room-status',
    () => axios.get('/dashboard/room-status').then(res => res.data)
  );

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'primary';
      case 'checked_in': return 'success';
      case 'checked_out': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getRoomStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'occupied': return 'error';
      case 'maintenance': return 'warning';
      case 'cleaning': return 'info';
      default: return 'default';
    }
  };

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Rooms',
      value: overview?.rooms?.total || 0,
      subtitle: `${overview?.rooms?.available || 0} available`,
      icon: <HotelIcon />,
      color: 'primary',
      progress: overview?.rooms?.total ? (overview.rooms.available / overview.rooms.total) * 100 : 0
    },
    {
      title: 'Occupancy Rate',
      value: `${overview?.rooms?.occupancy_rate || 0}%`,
      subtitle: `${overview?.rooms?.occupied || 0} occupied`,
      icon: <TrendingUpIcon />,
      color: 'success',
      progress: parseFloat(overview?.rooms?.occupancy_rate || 0)
    },
    {
      title: 'Total Customers',
      value: overview?.customers?.total || 0,
      subtitle: 'Registered customers',
      icon: <PeopleIcon />,
      color: 'info'
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(overview?.revenue?.monthly || 0),
      subtitle: 'This month',
      icon: <AttachMoneyIcon />,
      color: 'warning'
    }
  ];

  if (overviewLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard Overview
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="h6">
                      {card.title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.subtitle}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: `${card.color}.main`,
                      width: 56,
                      height: 56
                    }}
                  >
                    {card.icon}
                  </Avatar>
                </Box>
                {card.progress !== undefined && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={card.progress}
                      color={card.color}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Revenue Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Revenue Trend (Last 7 Days)
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={revenueAnalytics?.daily_revenue || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#1976d2"
                      strokeWidth={3}
                      dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Room Type Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Revenue by Room Type
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={revenueAnalytics?.revenue_by_room_type || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="revenue"
                    >
                      {(revenueAnalytics?.revenue_by_room_type || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2 }}>
                {(revenueAnalytics?.revenue_by_room_type || []).map((item, index) => (
                  <Box key={index} display="flex" alignItems="center" sx={{ mb: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        bgcolor: COLORS[index % COLORS.length],
                        mr: 1,
                        borderRadius: '50%'
                      }}
                    />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(item.revenue)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Bookings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Recent Bookings
              </Typography>
              <List>
                {(recentBookings || []).map((booking, index) => (
                  <React.Fragment key={booking.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={`${booking.first_name} ${booking.last_name}`}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Room {booking.room_number} • {booking.room_type_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box textAlign="right">
                        <Chip
                          label={booking.status}
                          color={getStatusColor(booking.status)}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(booking.total_amount)}
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < recentBookings.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Today's Activities */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Today's Activities
              </Typography>
              
              {/* Check-ins */}
              <Box sx={{ mb: 3 }}>
                <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                  <CheckInIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Check-ins ({overview?.bookings?.todays_checkins || 0})
                  </Typography>
                </Box>
                <List dense>
                  {(upcomingActivities?.upcoming_checkins || [])
                    .filter(item => new Date(item.check_in_date).toDateString() === new Date().toDateString())
                    .slice(0, 3)
                    .map((checkin, index) => (
                    <ListItem key={index} sx={{ pl: 4 }}>
                      <ListItemText
                        primary={`${checkin.first_name} ${checkin.last_name}`}
                        secondary={`Room ${checkin.room_number} • ${checkin.adults + checkin.children} guests`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              {/* Check-outs */}
              <Box>
                <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                  <CheckOutIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Check-outs ({overview?.bookings?.todays_checkouts || 0})
                  </Typography>
                </Box>
                <List dense>
                  {(upcomingActivities?.upcoming_checkouts || [])
                    .filter(item => new Date(item.check_out_date).toDateString() === new Date().toDateString())
                    .slice(0, 3)
                    .map((checkout, index) => (
                    <ListItem key={index} sx={{ pl: 4 }}>
                      <ListItemText
                        primary={`${checkout.first_name} ${checkout.last_name}`}
                        secondary={`Room ${checkout.room_number} • ${checkout.adults + checkout.children} guests`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Room Status Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Room Status Overview
              </Typography>
              <Grid container spacing={2}>
                {(roomStatus || []).slice(0, 12).map((room) => (
                  <Grid item xs={6} sm={4} md={2} key={room.id}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        border: 1,
                        borderColor: `${getRoomStatusColor(room.status)}.main`,
                        bgcolor: `${getRoomStatusColor(room.status)}.light`,
                        color: `${getRoomStatusColor(room.status)}.contrastText`
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        {room.room_number}
                      </Typography>
                      <Typography variant="body2">
                        Floor {room.floor}
                      </Typography>
                      <Chip
                        label={room.status}
                        color={getRoomStatusColor(room.status)}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                      {room.current_booking && (
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          {room.current_booking.customer_name}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;