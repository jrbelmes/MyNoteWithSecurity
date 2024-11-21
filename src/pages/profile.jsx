import React, { useState } from 'react';
import {
  Box,
  Card,
  Avatar,
  Typography,
  IconButton,
  Paper,
  TextField,
  Stack,
  Fade,
  Divider,
  useTheme,
  styled,
  Grid  // Add this import
} from '@mui/material';
import { 
  Edit as EditIcon,
  PhotoCamera,
  Save as SaveIcon
} from '@mui/icons-material';
import Sidebar from './Sidebar';

// Custom styled components
const StyledCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)'
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset': {
      borderColor: '#2e7d32',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#2e7d32',
    }
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#2e7d32'
  }
}));

const Profile = () => {
  const [profileImage, setProfileImage] = useState('https://via.placeholder.com/150');
  const [editMode, setEditMode] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    firstName: 'John',
    middleName: 'Doe',
    lastName: 'Smith',
    schoolId: '2023-1234',
    email: 'john.smith@school.edu',
    phoneNumber: '+1 234 567 890'
  });

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setProfileImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleInfoChange = (field) => (event) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const fields = [
    { id: 'firstName', label: 'First Name' },
    { id: 'middleName', label: 'Middle Name' },
    { id: 'lastName', label: 'Last Name' },
    { id: 'schoolId', label: 'School ID' },
    { id: 'email', label: 'Email Address' },
    { id: 'phoneNumber', label: 'Phone Number' }
  ];

  const theme = useTheme();

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Box
          sx={{
            p: 3,
            maxWidth: 1000,
            margin: '0 auto',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
          }}
        >
          <StyledCard elevation={0} sx={{ p: 4, mb: 3 }}>
            <Box sx={{ 
              position: 'relative', 
              mb: 6,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -24,
                left: -32,
                right: -32,
                height: 200,
                background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                borderRadius: '16px',
                zIndex: 0
              }
            }}>
              <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', pt: 3 }}>
                <Avatar
                  src={profileImage}
                  sx={{
                    width: 180,
                    height: 180,
                    margin: '0 auto',
                    border: '6px solid white',
                    boxShadow: 3,
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                />
                <input
                  type="file"
                  accept="image/*"
                  id="icon-button-file"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                <label htmlFor="icon-button-file">
                  <IconButton
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: '50%',
                      transform: 'translateX(80px)',
                      backgroundColor: 'white',
                      boxShadow: 1,
                      '&:hover': { backgroundColor: '#f5f5f5' }
                    }}
                  >
                    <PhotoCamera />
                  </IconButton>
                </label>
              </Box>
            </Box>

            <Box sx={{ position: 'relative' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                mb: 4,
                alignItems: 'center' 
              }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#1b5e20',
                    '&::after': {
                      content: '""',
                      display: 'block',
                      width: '40%',
                      height: '3px',
                      background: 'linear-gradient(90deg, #4caf50 0%, transparent 100%)',
                      marginTop: '4px'
                    }
                  }}
                >
                  Personal Information
                </Typography>
                <IconButton 
                  onClick={toggleEditMode}
                  sx={{
                    backgroundColor: editMode ? '#4caf50' : 'transparent',
                    color: editMode ? 'white' : '#4caf50',
                    '&:hover': {
                      backgroundColor: editMode ? '#2e7d32' : 'rgba(76, 175, 80, 0.1)'
                    }
                  }}
                >
                  {editMode ? <SaveIcon /> : <EditIcon />}
                </IconButton>
              </Box>

              <Grid container spacing={4}>
                {fields.map((field) => (
                  <Grid item xs={12} sm={6} key={field.id}>
                    <Fade in={true} timeout={500}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(76, 175, 80, 0.05)'
                          }
                        }}
                      >
                        {editMode ? (
                          <StyledTextField
                            fullWidth
                            label={field.label}
                            value={personalInfo[field.id]}
                            onChange={handleInfoChange(field.id)}
                            variant="outlined"
                          />
                        ) : (
                          <Box>
                            <Typography 
                              color="textSecondary" 
                              variant="subtitle2" 
                              sx={{ mb: 1, color: '#2e7d32' }}
                            >
                              {field.label}
                            </Typography>
                            <Typography 
                              variant="body1"
                              sx={{ 
                                fontWeight: 500,
                                color: '#333'
                              }}
                            >
                              {personalInfo[field.id]}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Fade>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </StyledCard>
        </Box>
      </div>
    </div>
  );
};

export default Profile;