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
  Fab,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Hotel as HotelIcon,
  Bed as BedIcon,
  CleaningServices as CleaningIcon,
  Build as MaintenanceIcon,
  CheckCircle as AvailableIcon,
  Cancel as OccupiedIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Rooms = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    number: '',
    type: '',
    price: '',
    capacity: '',
    description: '',
    amenities: '',
    status: 'available'
  });
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  // Fetch rooms
  const { data: rooms = [], isLoading, error: fetchError } = useQuery(
    'rooms',
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  );

  // Create room mutation
  const createRoomMutation = useMutation(
    async (roomData) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/rooms`, roomData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rooms');
        handleCloseDialog();
        setError('');
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error creating room');
      }
    }
  );

  // Update room mutation
  const updateRoomMutation = useMutation(
    async ({ id, ...roomData }) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/api/rooms/${id}`, roomData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rooms');
        handleCloseDialog();
        setError('');
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error updating room');
      }
    }
  );

  // Delete room mutation
  const deleteRoomMutation = useMutation(
    async (id) => {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/rooms/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rooms');
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error deleting room');
      }
    }
  );

  const handleOpenDialog = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        number: room.number || '',
        type: room.type || '',
        price: room.price || '',
        capacity: room.capacity || '',
        description: room.description || '',
        amenities: room.amenities || '',
        status: room.status || 'available'
      });
    } else {
      setEditingRoom(null);
      setFormData({
        number: '',
        type: '',
        price: '',
        capacity: '',
        description: '',
        amenities: '',
        status: 'available'
      });
    }
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRoom(null);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.number || !formData.type || !formData.price) {
      setError('Please fill in all required fields');
      return;
    }

    const roomData = {
      ...formData,
      price: parseFloat(formData.price),
      capacity: parseInt(formData.capacity) || 1
    };

    if (editingRoom) {
      updateRoomMutation.mutate({ id: editingRoom.id, ...roomData });
    } else {
      createRoomMutation.mutate(roomData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      deleteRoomMutation.mutate(id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'occupied': return 'error';
      case 'maintenance': return 'warning';
      case 'cleaning': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <AvailableIcon />;
      case 'occupied': return <OccupiedIcon />;
      case 'maintenance': return <MaintenanceIcon />;
      case 'cleaning': return <CleaningIcon />;
      default: return <HotelIcon />;
    }
  };

  const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Presidential', 'Family', 'Business'];
  const roomStatuses = ['available', 'occupied', 'maintenance', 'cleaning'];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading rooms...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Room Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Add Room
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading rooms: {fetchError.message}
        </Alert>
      )}

      {/* Room Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <AvailableIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {rooms.filter(room => room.status === 'available').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available
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
                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                  <OccupiedIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {rooms.filter(room => room.status === 'occupied').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Occupied
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
                  <MaintenanceIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {rooms.filter(room => room.status === 'maintenance').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Maintenance
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
                  <CleaningIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {rooms.filter(room => room.status === 'cleaning').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cleaning
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Rooms Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Room Number</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Amenities</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <BedIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        {room.number}
                      </Box>
                    </TableCell>
                    <TableCell>{room.type}</TableCell>
                    <TableCell>${room.price}</TableCell>
                    <TableCell>{room.capacity} guests</TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(room.status)}
                        label={room.status}
                        color={getStatusColor(room.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {room.amenities && room.amenities.split(',').map((amenity, index) => (
                        <Chip
                          key={index}
                          label={amenity.trim()}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit Room">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(room)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Room">
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(room.id)}
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

      {/* Add/Edit Room Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRoom ? 'Edit Room' : 'Add New Room'}
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
                name="number"
                label="Room Number"
                value={formData.number}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Room Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  label="Room Type"
                >
                  {roomTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="price"
                label="Price per Night"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: '$'
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="capacity"
                label="Capacity"
                type="number"
                value={formData.capacity}
                onChange={handleInputChange}
                fullWidth
                InputProps={{
                  endAdornment: 'guests'
                }}
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
                  {roomStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="amenities"
                label="Amenities (comma-separated)"
                value={formData.amenities}
                onChange={handleInputChange}
                fullWidth
                placeholder="WiFi, TV, Mini Bar, Air Conditioning"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={formData.description}
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
            disabled={createRoomMutation.isLoading || updateRoomMutation.isLoading}
          >
            {editingRoom ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Rooms;