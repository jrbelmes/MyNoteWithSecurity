import React, { useState, useEffect } from 'react';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Grid,
  useTheme,
  styled,
} from '@mui/material';
import { 
  EditOutlined,
  CameraOutlined,
  SaveOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Modal, Input, message, Spin, Tooltip } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';

const StyledInput = styled(Input)`
  &.ant-input-affix-wrapper {
    border-radius: 8px;
    border: 1px solid #d9d9d9;
    padding: 8px 12px;
    
    &:hover, &:focus {
      border-color: #4caf50;
      box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
    }
  }
`;

const ProfileModal = ({ visible, onClose }) => {
  const [profileImage, setProfileImage] = useState('https://via.placeholder.com/150');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    schoolId: '',
    email: '',
    phoneNumber: '',
    department: '',
    userLevel: ''
  });

  useEffect(() => {
    if (visible) {
      fetchAdminData();
    }
  }, [visible]);

  const fetchAdminData = async () => {
    try {
      const response = await fetch('http://localhost/coc/gsd/fetchMaster.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'fetchUsersById',
          id: localStorage.getItem('user_id')
        })
      });

      const result = await response.json();
      
      if (result.status === 'success' && result.data.length > 0) {
        const userData = result.data[0];
        setPersonalInfo({
          firstName: userData.users_fname,
          middleName: userData.users_mname,
          lastName: userData.users_lname,
          schoolId: userData.users_school_id,
          email: userData.users_email,
          phoneNumber: userData.users_contact_number || '',
          department: userData.departments_name,
          userLevel: userData.user_level_name
        });
        if (userData.users_pic) {
          setProfileImage(`data:image/jpeg;base64,${userData.users_pic}`);
        }
      }
    } catch (err) {
      message.error('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setProfileImage(e.target.result);
      reader.readAsDataURL(file);
      message.success('Profile picture updated successfully');
    }
  };

  const handleSave = () => {
    message.success('Profile updated successfully');
    setEditMode(false);
  };

  const handleInfoChange = (field, e) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const modalContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <Avatar
            src={profileImage}
            size={180}
            style={{
              border: '6px solid white',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}
          />
          <Tooltip title="Change Profile Picture">
            <label htmlFor="profile-upload" className="absolute bottom-2 right-2">
              <div className="bg-green-500 p-2 rounded-full cursor-pointer hover:bg-green-600 transition-colors">
                <CameraOutlined style={{ color: 'white', fontSize: '20px' }} />
              </div>
              <input
                type="file"
                id="profile-upload"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          </Tooltip>
        </div>
        
        <Typography variant="h5" className="mt-4 font-semibold text-gray-800">
          {`${personalInfo.firstName} ${personalInfo.lastName}`}
        </Typography>
        <Typography variant="body2" className="text-gray-500">
          {personalInfo.department} - {personalInfo.userLevel}
        </Typography>
      </div>

      <Grid container spacing={3}>
        {[
          { icon: <UserOutlined />, label: 'First Name', value: personalInfo.firstName },
          { icon: <UserOutlined />, label: 'Middle Name', value: personalInfo.middleName },
          { icon: <UserOutlined />, label: 'Last Name', value: personalInfo.lastName },
          { icon: <IdcardOutlined />, label: 'School ID', value: personalInfo.schoolId },
          { icon: <MailOutlined />, label: 'Email', value: personalInfo.email },
          { icon: <PhoneOutlined />, label: 'Phone', value: personalInfo.phoneNumber },
        ].map((field, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-white rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="text-green-500">{field.icon}</div>
                <div className="flex-1">
                  <Typography variant="caption" className="text-gray-500">
                    {field.label}
                  </Typography>
                  {editMode ? (
                    <StyledInput
                      value={field.value}
                      onChange={(e) => handleInfoChange(field.label.toLowerCase(), e)}
                    />
                  ) : (
                    <Typography variant="body1" className="font-medium">
                      {field.value}
                    </Typography>
                  )}
                </div>
              </div>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </motion.div>
  );

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      width={800}
      footer={null}
      title={
        <div className="flex justify-between items-center">
          <Typography variant="h6" className="text-gray-800">
            Profile Information
          </Typography>
          <Tooltip title={editMode ? "Save Changes" : "Edit Profile"}>
            <IconButton
              onClick={() => editMode ? handleSave() : setEditMode(true)}
              style={{ color: editMode ? '#4caf50' : '#666' }}
            >
              {editMode ? <SaveOutlined /> : <EditOutlined />}
            </IconButton>
          </Tooltip>
        </div>
      }
      centered
    >
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Spin size="large" />
        </div>
      ) : (
        modalContent
      )}
    </Modal>
  );
};

export default ProfileModal;