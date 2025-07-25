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
  Switch,
  FormControlLabel,
  InputAdornment,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Work as WorkIcon,
  SupervisorAccount as ManagerIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Staff = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'staff',
    department: '',
    position: '',
    salary: '',
    hireDate: '',
    isActive: true
  });
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  // Fetch staff members
  const { data: staffMembers = [], isLoading, error: fetchError } = useQuery(
    'staff',
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  );

  // Fetch staff performance data
  const { data: staffPerformance = [] } = useQuery(
    ['staff-performance', selectedStaff?.id],
    async () => {
      if (!selectedStaff?.id) return [];
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/staff/${selectedStaff.id}/performance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      enabled: !!selectedStaff?.id
    }
  );

  // Create staff mutation
  const createStaffMutation = useMutation(
    async (staffData) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/staff`, staffData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('staff');
        handleCloseDialog();
        setError('');
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error creating staff member');
      }
    }
  );

  // Update staff mutation
  const updateStaffMutation = useMutation(
    async ({ id, ...staffData }) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/api/staff/${id}`, staffData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('staff');
        handleCloseDialog();
        setError('');
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error updating staff member');
      }
    }
  );

  // Delete staff mutation
  const deleteStaffMutation = useMutation(
    async (id) => {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/staff/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('staff');
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error deleting staff member');
      }
    }
  );

  const handleOpenDialog = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        username: staff.username || '',
        email: staff.email || '',
        password: '', // Don't pre-fill password for security
        firstName: staff.firstName || '',
        lastName: staff.lastName || '',
        phone: staff.phone || '',
        role: staff.role || 'staff',
        department: staff.department || '',
        position: staff.position || '',
        salary: staff.salary || '',
        hireDate: staff.hireDate || '',
        isActive: staff.isActive !== undefined ? staff.isActive : true
      });
    } else {
      setEditingStaff(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'staff',
        department: '',
        position: '',
        salary: '',
        hireDate: '',
        isActive: true
      });
    }
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStaff(null);
    setError('');
  };

  const handleOpenDetailsDialog = (staff) => {
    setSelectedStaff(staff);
    setOpenDetailsDialog(true);
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedStaff(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = () => {
    if (!formData.username || !formData.email || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      return;
    }

    if (!editingStaff && !formData.password) {
      setError('Password is required for new staff members');
      return;
    }

    const staffData = {
      ...formData,
      salary: formData.salary ? parseFloat(formData.salary) : null
    };

    // Don't send empty password for updates
    if (editingStaff && !staffData.password) {
      delete staffData.password;
    }

    if (editingStaff) {
      updateStaffMutation.mutate({ id: editingStaff.id, ...staffData });
    } else {
      createStaffMutation.mutate(staffData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      deleteStaffMutation.mutate(id);
    }
  };

  const filteredStaff = staffMembers.filter(staff =>
    `${staff.firstName} ${staff.lastName} ${staff.email} ${staff.department}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'manager': return 'warning';
      case 'staff': return 'primary';
      default: return 'default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <AdminIcon />;
      case 'manager': return <ManagerIcon />;
      case 'staff': return <WorkIcon />;
      default: return <PersonIcon />;
    }
  };

  const departments = ['Front Desk', 'Housekeeping', 'Maintenance', 'Food & Beverage', 'Security', 'Management', 'IT'];
  const roles = ['admin', 'manager', 'staff'];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading staff...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Staff Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Add Staff Member
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading staff: {fetchError.message}
        </Alert>
      )}

      {/* Staff Statistics Cards */}
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
                    {staffMembers.filter(s => s.isActive).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Staff
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
                  <AdminIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {staffMembers.filter(s => s.role === 'admin').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Administrators
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
                  <ManagerIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {staffMembers.filter(s => s.role === 'manager').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Managers
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
                  <WorkIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {departments.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Departments
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
            placeholder="Search staff by name, email, or department..."
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

      {/* Staff Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Staff Member</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Role & Department</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: getRoleColor(staff.role) + '.main' }}>
                          {staff.firstName?.[0]}{staff.lastName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {staff.firstName} {staff.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            @{staff.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box display="flex" alignItems="center" mb={0.5}>
                          <EmailIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{staff.email}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                          <PhoneIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{staff.phone || 'N/A'}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Chip
                          icon={getRoleIcon(staff.role)}
                          label={staff.role.toUpperCase()}
                          color={getRoleColor(staff.role)}
                          size="small"
                          sx={{ mb: 0.5 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {staff.department || 'No Department'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {staff.position || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={staff.isActive ? 'Active' : 'Inactive'}
                        color={staff.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          color="info"
                          onClick={() => handleOpenDetailsDialog(staff)}
                          size="small"
                        >
                          <AssessmentIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Staff">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(staff)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Staff">
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(staff.id)}
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

      {/* Add/Edit Staff Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
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
                name="username"
                label="Username"
                value={formData.username}
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
                name="password"
                label={editingStaff ? "New Password (leave blank to keep current)" : "Password"}
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                fullWidth
                required={!editingStaff}
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  label="Role"
                >
                  {roles.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  label="Department"
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="position"
                label="Position"
                value={formData.position}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="salary"
                label="Salary"
                type="number"
                value={formData.salary}
                onChange={handleInputChange}
                fullWidth
                InputProps={{
                  startAdornment: '$'
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="hireDate"
                label="Hire Date"
                type="date"
                value={formData.hireDate}
                onChange={handleInputChange}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                }
                label="Active Status"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createStaffMutation.isLoading || updateStaffMutation.isLoading}
          >
            {editingStaff ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Staff Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Staff Details - {selectedStaff?.firstName} {selectedStaff?.lastName}
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Personal Info" />
            <Tab label="Employment" />
            <Tab label="Performance" />
          </Tabs>
          
          {tabValue === 0 && selectedStaff && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Username:</Typography>
                  <Typography variant="body2" gutterBottom>@{selectedStaff.username}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Email:</Typography>
                  <Typography variant="body2" gutterBottom>{selectedStaff.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Phone:</Typography>
                  <Typography variant="body2" gutterBottom>{selectedStaff.phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Status:</Typography>
                  <Chip
                    label={selectedStaff.isActive ? 'Active' : 'Inactive'}
                    color={selectedStaff.isActive ? 'success' : 'error'}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
          
          {tabValue === 1 && selectedStaff && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Role:</Typography>
                  <Chip
                    icon={getRoleIcon(selectedStaff.role)}
                    label={selectedStaff.role.toUpperCase()}
                    color={getRoleColor(selectedStaff.role)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Department:</Typography>
                  <Typography variant="body2" gutterBottom>{selectedStaff.department || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Position:</Typography>
                  <Typography variant="body2" gutterBottom>{selectedStaff.position || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Hire Date:</Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedStaff.hireDate ? format(parseISO(selectedStaff.hireDate), 'MMM dd, yyyy') : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Salary:</Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedStaff.salary ? `$${selectedStaff.salary.toLocaleString()}` : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {tabValue === 2 && (
            <Box sx={{ mt: 2 }}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Work Schedule"
                    secondary="Monday - Friday, 9:00 AM - 5:00 PM"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <AssessmentIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Performance Rating"
                    secondary="4.5/5.0 - Excellent Performance"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Access Level"
                    secondary={`${selectedStaff?.role} - Full ${selectedStaff?.department} access`}
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Staff;