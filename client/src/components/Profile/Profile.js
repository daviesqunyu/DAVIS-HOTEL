import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Avatar,
  Alert,
  Tabs,
  Tab,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Profile = () => {
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: false,
    language: 'en'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: user, isLoading } = useQuery(
    'profile',
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        setProfileData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          department: data.department || '',
          position: data.position || ''
        });
      }
    }
  );

  // Fetch user activity log
  const { data: activityLog = [] } = useQuery(
    'user-activity',
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/auth/activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    async (data) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/api/auth/profile`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('profile');
        setEditMode(false);
        setSuccess('Profile updated successfully!');
        setError('');
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error updating profile');
        setSuccess('');
      }
    }
  );

  // Change password mutation
  const changePasswordMutation = useMutation(
    async (data) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/api/auth/change-password`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setSuccess('Password changed successfully!');
        setError('');
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error changing password');
        setSuccess('');
      }
    }
  );

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSettingsChange = (e) => {
    const { name, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSaveProfile = () => {
    if (!profileData.firstName || !profileData.lastName || !profileData.email) {
      setError('Please fill in all required fields');
      return;
    }
    updateProfileMutation.mutate(profileData);
  };

  const handleChangePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setProfileData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      department: user?.department || '',
      position: user?.position || ''
    });
    setError('');
    setSuccess('');
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading profile...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Profile Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Overview Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '3rem'
                }}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
              <Typography variant="h6" gutterBottom>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user?.role?.toUpperCase()} • {user?.department}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Member since {user?.createdAt ? format(parseISO(user.createdAt), 'MMM yyyy') : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
                <Tab icon={<PersonIcon />} label="Personal Info" />
                <Tab icon={<SecurityIcon />} label="Security" />
                <Tab icon={<SettingsIcon />} label="Preferences" />
                <Tab icon={<HistoryIcon />} label="Activity" />
              </Tabs>

              {/* Personal Information Tab */}
              {tabValue === 0 && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">Personal Information</Typography>
                    {!editMode ? (
                      <Button
                        startIcon={<EditIcon />}
                        onClick={() => setEditMode(true)}
                        variant="outlined"
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <Box>
                        <Button
                          startIcon={<SaveIcon />}
                          onClick={handleSaveProfile}
                          variant="contained"
                          sx={{ mr: 1 }}
                          disabled={updateProfileMutation.isLoading}
                        >
                          Save
                        </Button>
                        <Button
                          startIcon={<CancelIcon />}
                          onClick={handleCancelEdit}
                          variant="outlined"
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="firstName"
                        label="First Name"
                        value={profileData.firstName}
                        onChange={handleProfileInputChange}
                        fullWidth
                        disabled={!editMode}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="lastName"
                        label="Last Name"
                        value={profileData.lastName}
                        onChange={handleProfileInputChange}
                        fullWidth
                        disabled={!editMode}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="email"
                        label="Email"
                        type="email"
                        value={profileData.email}
                        onChange={handleProfileInputChange}
                        fullWidth
                        disabled={!editMode}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="phone"
                        label="Phone Number"
                        value={profileData.phone}
                        onChange={handleProfileInputChange}
                        fullWidth
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="department"
                        label="Department"
                        value={profileData.department}
                        onChange={handleProfileInputChange}
                        fullWidth
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="position"
                        label="Position"
                        value={profileData.position}
                        onChange={handleProfileInputChange}
                        fullWidth
                        disabled={!editMode}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Security Tab */}
              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Change Password
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        name="currentPassword"
                        label="Current Password"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={handlePasswordInputChange}
                        fullWidth
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="newPassword"
                        label="New Password"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="confirmPassword"
                        label="Confirm New Password"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordInputChange}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        onClick={handleChangePassword}
                        disabled={changePasswordMutation.isLoading}
                      >
                        Change Password
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Preferences Tab */}
              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Notification Preferences
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <NotificationsIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email Notifications"
                        secondary="Receive notifications via email"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            name="emailNotifications"
                            checked={settings.emailNotifications}
                            onChange={handleSettingsChange}
                          />
                        }
                        label=""
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <NotificationsIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Push Notifications"
                        secondary="Receive push notifications in browser"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            name="pushNotifications"
                            checked={settings.pushNotifications}
                            onChange={handleSettingsChange}
                          />
                        }
                        label=""
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <SettingsIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Dark Mode"
                        secondary="Use dark theme for the interface"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            name="darkMode"
                            checked={settings.darkMode}
                            onChange={handleSettingsChange}
                          />
                        }
                        label=""
                      />
                    </ListItem>
                  </List>
                </Box>
              )}

              {/* Activity Tab */}
              {tabValue === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Recent Activity
                  </Typography>
                  <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
                    <List>
                      {activityLog.length > 0 ? (
                        activityLog.map((activity, index) => (
                          <React.Fragment key={index}>
                            <ListItem>
                              <ListItemText
                                primary={activity.action || 'System Activity'}
                                secondary={
                                  <Box>
                                    <Typography variant="body2">
                                      {activity.description || 'No description available'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {activity.timestamp ? 
                                        format(parseISO(activity.timestamp), 'MMM dd, yyyy HH:mm') : 
                                        'Unknown time'
                                      }
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                            {index < activityLog.length - 1 && <Divider />}
                          </React.Fragment>
                        ))
                      ) : (
                        <ListItem>
                          <ListItemText
                            primary="No recent activity"
                            secondary="Your activity will appear here"
                          />
                        </ListItem>
                      )}
                    </List>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;