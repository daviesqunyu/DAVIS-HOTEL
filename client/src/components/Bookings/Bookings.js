import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Avatar,
  Autocomplete
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Login as CheckInIcon,
  Logout as CheckOutIcon,
  Book as BookIcon,
  Person as PersonIcon,
  Hotel as HotelIcon,
  Payment as PaymentIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Bookings = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [formData, setFormData] = useState({
    customerId: '',
    roomId: '',
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    guests: 1,
    totalAmount: 0,
    status: 'confirmed',
    notes: ''
  });
  const [error, setError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const queryClient = useQueryClient();

  // Fetch bookings
  const { data: bookings = [], isLoading, error: fetchError } = useQuery(
    'bookings',
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  );

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery(
    'customers',
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  );

  // Fetch rooms for dropdown
  const { data: rooms = [] } = useQuery(
    'rooms',
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  );

  // Create booking mutation
  const createBookingMutation = useMutation(
    async (bookingData) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/bookings`, bookingData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('bookings');
        queryClient.invalidateQueries('dashboard');
        handleCloseDialog();
        setError('');
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error creating booking');
      }
    }
  );

  // Update booking mutation
  const updateBookingMutation = useMutation(
    async ({ id, ...bookingData }) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/api/bookings/${id}`, bookingData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('bookings');
        queryClient.invalidateQueries('dashboard');
        handleCloseDialog();
        setError('');
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error updating booking');
      }
    }
  );

  // Delete booking mutation
  const deleteBookingMutation = useMutation(
    async (id) => {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('bookings');
        queryClient.invalidateQueries('dashboard');
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error deleting booking');
      }
    }
  );

  // Check-in mutation
  const checkInMutation = useMutation(
    async (id) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/api/bookings/${id}/checkin`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('bookings');
        queryClient.invalidateQueries('dashboard');
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error checking in');
      }
    }
  );

  // Check-out mutation
  const checkOutMutation = useMutation(
    async (id) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/api/bookings/${id}/checkout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('bookings');
        queryClient.invalidateQueries('dashboard');
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error checking out');
      }
    }
  );

  const handleOpenDialog = (booking = null) => {
    if (booking) {
      setEditingBooking(booking);
      const customer = customers.find(c => c.id === booking.customerId);
      const room = rooms.find(r => r.id === booking.roomId);
      
      setSelectedCustomer(customer || null);
      setSelectedRoom(room || null);
      
      setFormData({
        customerId: booking.customerId || '',
        roomId: booking.roomId || '',
        checkIn: booking.checkIn ? parseISO(booking.checkIn) : new Date(),
        checkOut: booking.checkOut ? parseISO(booking.checkOut) : new Date(),
        guests: booking.guests || 1,
        totalAmount: booking.totalAmount || 0,
        status: booking.status || 'confirmed',
        notes: booking.notes || ''
      });
    } else {
      setEditingBooking(null);
      setSelectedCustomer(null);
      setSelectedRoom(null);
      setFormData({
        customerId: '',
        roomId: '',
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000),
        guests: 1,
        totalAmount: 0,
        status: 'confirmed',
        notes: ''
      });
    }
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBooking(null);
    setSelectedCustomer(null);
    setSelectedRoom(null);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
    
    // Calculate total amount when dates or room change
    if (name === 'checkIn' || name === 'checkOut') {
      calculateTotal(selectedRoom, name === 'checkIn' ? date : formData.checkIn, name === 'checkOut' ? date : formData.checkOut);
    }
  };

  const handleCustomerChange = (event, newValue) => {
    setSelectedCustomer(newValue);
    setFormData(prev => ({
      ...prev,
      customerId: newValue ? newValue.id : ''
    }));
  };

  const handleRoomChange = (event, newValue) => {
    setSelectedRoom(newValue);
    setFormData(prev => ({
      ...prev,
      roomId: newValue ? newValue.id : ''
    }));
    
    // Calculate total amount
    calculateTotal(newValue, formData.checkIn, formData.checkOut);
  };

  const calculateTotal = (room, checkIn, checkOut) => {
    if (room && checkIn && checkOut) {
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const total = nights * room.price;
      setFormData(prev => ({
        ...prev,
        totalAmount: total
      }));
    }
  };

  const handleSubmit = () => {
    if (!formData.customerId || !formData.roomId || !formData.checkIn || !formData.checkOut) {
      setError('Please fill in all required fields');
      return;
    }

    const bookingData = {
      ...formData,
      checkIn: format(formData.checkIn, 'yyyy-MM-dd'),
      checkOut: format(formData.checkOut, 'yyyy-MM-dd'),
      guests: parseInt(formData.guests),
      totalAmount: parseFloat(formData.totalAmount)
    };

    if (editingBooking) {
      updateBookingMutation.mutate({ id: editingBooking.id, ...bookingData });
    } else {
      createBookingMutation.mutate(bookingData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      deleteBookingMutation.mutate(id);
    }
  };

  const handleCheckIn = (id) => {
    if (window.confirm('Check in this guest?')) {
      checkInMutation.mutate(id);
    }
  };

  const handleCheckOut = (id) => {
    if (window.confirm('Check out this guest?')) {
      checkOutMutation.mutate(id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'primary';
      case 'checked-in': return 'success';
      case 'checked-out': return 'info';
      case 'cancelled': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <BookIcon />;
      case 'checked-in': return <CheckInIcon />;
      case 'checked-out': return <CheckOutIcon />;
      case 'cancelled': return <CancelIcon />;
      case 'pending': return <PendingIcon />;
      default: return <BookIcon />;
    }
  };

  const bookingStatuses = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading bookings...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            Bookings Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="large"
          >
            New Booking
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {fetchError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error loading bookings: {fetchError.message}
          </Alert>
        )}

        {/* Booking Statistics Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <BookIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {bookings.filter(booking => booking.status === 'confirmed').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Confirmed
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <CheckInIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {bookings.filter(booking => booking.status === 'checked-in').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Checked In
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                    <CheckOutIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {bookings.filter(booking => booking.status === 'checked-out').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Checked Out
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                    <PendingIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {bookings.filter(booking => booking.status === 'pending').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Bookings Table */}
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Booking ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>Check-in</TableCell>
                    <TableCell>Check-out</TableCell>
                    <TableCell>Guests</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => {
                    const customer = customers.find(c => c.id === booking.customerId);
                    const room = rooms.find(r => r.id === booking.roomId);
                    
                    return (
                      <TableRow key={booking.id}>
                        <TableCell>#{booking.id}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            {customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown'}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <HotelIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            {room ? `${room.number} (${room.type})` : 'Unknown'}
                          </Box>
                        </TableCell>
                        <TableCell>{format(parseISO(booking.checkIn), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{format(parseISO(booking.checkOut), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{booking.guests}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <PaymentIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            ${booking.totalAmount}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(booking.status)}
                            label={booking.status}
                            color={getStatusColor(booking.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {booking.status === 'confirmed' && (
                            <Tooltip title="Check In">
                              <IconButton
                                color="success"
                                onClick={() => handleCheckIn(booking.id)}
                                size="small"
                              >
                                <CheckInIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {booking.status === 'checked-in' && (
                            <Tooltip title="Check Out">
                              <IconButton
                                color="info"
                                onClick={() => handleCheckOut(booking.id)}
                                size="small"
                              >
                                <CheckOutIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Edit Booking">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenDialog(booking)}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Booking">
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(booking.id)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Add/Edit Booking Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingBooking ? 'Edit Booking' : 'New Booking'}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  value={selectedCustomer}
                  onChange={handleCustomerChange}
                  options={customers}
                  getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Customer"
                      required
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  value={selectedRoom}
                  onChange={handleRoomChange}
                  options={rooms.filter(room => room.status === 'available')}
                  getOptionLabel={(option) => `${option.number} - ${option.type} ($${option.price}/night)`}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Room"
                      required
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Check-in Date"
                  value={formData.checkIn}
                  onChange={(date) => handleDateChange('checkIn', date)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Check-out Date"
                  value={formData.checkOut}
                  onChange={(date) => handleDateChange('checkOut', date)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="guests"
                  label="Number of Guests"
                  type="number"
                  value={formData.guests}
                  onChange={handleInputChange}
                  fullWidth
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="totalAmount"
                  label="Total Amount"
                  type="number"
                  value={formData.totalAmount}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{
                    startAdornment: '$'
                  }}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    label="Status"
                  >
                    {bookingStatuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={createBookingMutation.isLoading || updateBookingMutation.isLoading}
            >
              {editingBooking ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Bookings;