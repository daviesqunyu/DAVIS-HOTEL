import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Profile = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        User Profile
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Profile Features
          </Typography>
          <Typography variant="body1" paragraph>
            • Edit personal information and contact details
          </Typography>
          <Typography variant="body1" paragraph>
            • Change password and security settings
          </Typography>
          <Typography variant="body1" paragraph>
            • View account activity and login history
          </Typography>
          <Typography variant="body1" paragraph>
            • Notification preferences
          </Typography>
          <Typography variant="body1" paragraph>
            • Profile picture upload
          </Typography>
          <Typography variant="body1" paragraph>
            • Two-factor authentication setup
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This component will include profile forms, security settings, and user preferences.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;