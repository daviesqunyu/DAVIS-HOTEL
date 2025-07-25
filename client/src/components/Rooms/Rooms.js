import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Rooms = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Room Management
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Room Features
          </Typography>
          <Typography variant="body1" paragraph>
            • Room inventory management with visual floor plans
          </Typography>
          <Typography variant="body1" paragraph>
            • Room type configuration and pricing
          </Typography>
          <Typography variant="body1" paragraph>
            • Real-time room status tracking
          </Typography>
          <Typography variant="body1" paragraph>
            • Room availability calendar
          </Typography>
          <Typography variant="body1" paragraph>
            • Maintenance scheduling
          </Typography>
          <Typography variant="body1" paragraph>
            • Housekeeping status management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This component will feature room grids, status boards, and room configuration forms.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Rooms;