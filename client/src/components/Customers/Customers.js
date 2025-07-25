import React, { useState } from 'react';
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
  Chip,
  InputAdornment,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Search as SearchIcon,
  History as HistoryIcon,
  Star as StarIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Customers = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    dateOfBirth: '',
    nationality: '',
    idNumber: '',
    preferences: ''
  });
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customers = [], isLoading, error: fetchError } = useQuery(
    'customers',
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  );

  // Fetch customer bookings
  const { data: customerBookings = [] } = useQuery(
    ['customer-bookings', selectedCustomer?.id],
    async () => {
      if (!selectedCustomer?.id) return [];
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/customers/${selectedCustomer.id}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      enabled: !!selectedCustomer?.id
    }
  );

  // Create customer mutation
  const createCustomerMutation = useMutation(
    async (customerData) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/customers`, customerData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        handleCloseDialog();
        setError('');
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error creating customer');
      }
    }
  );

  // Update customer mutation
  const updateCustomerMutation = useMutation(
    async ({ id, ...customerData }) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/api/customers/${id}`, customerData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        handleCloseDialog();
        setError('');
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error updating customer');
      }
    }
  );

  // Delete customer mutation
  const deleteCustomerMutation = useMutation(
    async (id) => {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error deleting customer');
      }
    }
  );

  const handleOpenDialog = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        country: customer.country || '',
        dateOfBirth: customer.dateOfBirth || '',
        nationality: customer.nationality || '',
        idNumber: customer.idNumber || '',
        preferences: customer.preferences || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        dateOfBirth: '',
        nationality: '',
        idNumber: '',
        preferences: ''
      });
    }
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
    setError('');
  };

  const handleOpenHistoryDialog = (customer) => {
    setSelectedCustomer(customer);
    setOpenHistoryDialog(true);
  };

  const handleCloseHistoryDialog = () => {
    setOpenHistoryDialog(false);
    setSelectedCustomer(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }

    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer.id, ...formData });
    } else {
      createCustomerMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteCustomerMutation.mutate(id);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    `${customer.firstName} ${customer.lastName} ${customer.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getCustomerStats = (customer) => {
    const bookings = customerBookings.filter(b => b.customerId === customer.id);
    const totalBookings = bookings.length;
    const totalSpent = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    const lastVisit = bookings.length > 0 ? 
      Math.max(...bookings.map(b => new Date(b.checkOut).getTime())) : null;
    
    return { totalBookings, totalSpent, lastVisit };
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading customers...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Customer Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Add Customer
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading customers: {fetchError.message}
        </Alert>
      )}

      {/* Customer Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {customers.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Customers
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
                  <StarIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {customers.filter(c => c.isVip).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    VIP Customers
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
                  <BusinessIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {customers.filter(c => c.type === 'business').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Business Customers
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
                  <HistoryIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {customers.filter(c => {
                      const lastVisit = new Date(c.lastVisit || 0);
                      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                      return lastVisit > thirtyDaysAgo;
                    }).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recent Visitors
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search customers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Visit</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {customer.firstName?.[0]}{customer.lastName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {customer.firstName} {customer.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {customer.idNumber || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box display="flex" alignItems="center" mb={0.5}>
                          <EmailIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{customer.email}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                          <PhoneIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{customer.phone || 'N/A'}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {customer.city ? `${customer.city}, ${customer.country}` : customer.country || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {customer.isVip && (
                          <Chip
                            icon={<StarIcon />}
                            label="VIP"
                            color="warning"
                            size="small"
                            sx={{ mb: 0.5 }}
                          />
                        )}
                        {customer.type === 'business' && (
                          <Chip
                            icon={<BusinessIcon />}
                            label="Business"
                            color="info"
                            size="small"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {customer.lastVisit ? 
                          format(parseISO(customer.lastVisit), 'MMM dd, yyyy') : 
                          'Never'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View History">
                        <IconButton
                          color="info"
                          onClick={() => handleOpenHistoryDialog(customer)}
                          size="small"
                        >
                          <HistoryIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Customer">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(customer)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Customer">
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(customer.id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Phone Number"
                value={formData.phone}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Address"
                value={formData.address}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="city"
                label="City"
                value={formData.city}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="country"
                label="Country"
                value={formData.country}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="dateOfBirth"
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="nationality"
                label="Nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="idNumber"
                label="ID Number"
                value={formData.idNumber}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="preferences"
                label="Preferences & Notes"
                value={formData.preferences}
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
            disabled={createCustomerMutation.isLoading || updateCustomerMutation.isLoading}
          >
            {editingCustomer ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer History Dialog */}
      <Dialog open={openHistoryDialog} onClose={handleCloseHistoryDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Customer History - {selectedCustomer?.firstName} {selectedCustomer?.lastName}
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Booking History" />
            <Tab label="Customer Details" />
          </Tabs>
          
          {tabValue === 0 && (
            <Box sx={{ mt: 2 }}>
              {customerBookings.length > 0 ? (
                <List>
                  {customerBookings.map((booking, index) => (
                    <React.Fragment key={booking.id}>
                      <ListItem>
                        <ListItemText
                          primary={`Booking #${booking.id} - Room ${booking.roomNumber}`}
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                {format(parseISO(booking.checkIn), 'MMM dd, yyyy')} - {format(parseISO(booking.checkOut), 'MMM dd, yyyy')}
                              </Typography>
                              <Typography variant="body2">
                                Status: {booking.status} | Total: ${booking.totalAmount}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < customerBookings.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography>No booking history found.</Typography>
              )}
            </Box>
          )}
          
          {tabValue === 1 && selectedCustomer && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Email:</Typography>
                  <Typography variant="body2" gutterBottom>{selectedCustomer.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Phone:</Typography>
                  <Typography variant="body2" gutterBottom>{selectedCustomer.phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Address:</Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedCustomer.address ? 
                      `${selectedCustomer.address}, ${selectedCustomer.city}, ${selectedCustomer.country}` :
                      'N/A'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Nationality:</Typography>
                  <Typography variant="body2" gutterBottom>{selectedCustomer.nationality || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">ID Number:</Typography>
                  <Typography variant="body2" gutterBottom>{selectedCustomer.idNumber || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Preferences:</Typography>
                  <Typography variant="body2">{selectedCustomer.preferences || 'None'}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistoryDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;