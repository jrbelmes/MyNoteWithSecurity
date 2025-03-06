import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Typography, Grid, Paper, Container } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Table, Button, Space, Popconfirm, message, Tag } from 'antd';
import { UndoOutlined } from '@ant-design/icons';
import Sidebar from './Sidebar';
import axios from 'axios';
import { toast } from 'react-toastify';

// Enhanced styled components
const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: '1px solid #e8e8e8',
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: '3px',
  },
  '& .MuiTab-root': {
    textTransform: 'none',
    fontSize: '1rem',
    fontWeight: 500,
    minWidth: 120,
    '&.Mui-selected': {
      color: theme.palette.primary.main,
    },
  },
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  height: '100vh',
  overflow: 'auto',
  backgroundColor: theme.palette.grey[100],
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
  '& .ant-table-wrapper': {
    border: 'none',
    borderRadius: theme.spacing(1),
    overflow: 'hidden',
  },
  '& .ant-table-thead > tr > th': {
    backgroundColor: theme.palette.grey[50],
    color: theme.palette.text.primary,
    fontWeight: 600,
  },
  '& .ant-table-tbody > tr > td': {
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
  },
  '& .ant-tag': {
    borderRadius: '4px',
    padding: '2px 8px',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '6px',
  boxShadow: 'none',
  '&:hover': {
    opacity: 0.9,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
}));

const TabPanel = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`archive-tabpanel-${index}`}
      aria-labelledby={`archive-tab-${index}`}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Container maxWidth="lg">
            <Grid container spacing={3}>
              {children}
            </Grid>
          </Container>
        </Box>
      )}
    </div>
  );
};

const Archive = () => {
  const [value, setValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [venues, setVenues] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const convertUserType = (userType) => {
    const typeMapping = {
      'Dean': 'dept',
      'Admin': 'admin',
      'Driver': 'driver',
      'Personnel': 'personel',
      'User': 'user'
    };
    return typeMapping[userType] || userType.toLowerCase();
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost/coc/gsd/delete_master.php",
        { operation: "fetchAllUserTypes" },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data.status === 'success') {
        const allUsers = response.data.data.map(user => ({
          users_id: user.id,
          users_fname: user.fname,
          users_mname: user.mname,
          users_lname: user.lname,
          users_email: user.email,
          users_school_id: user.school_id,
          users_contact_number: user.contact_number,
          users_pic: user.pic,
          departments_name: user.departments_name,
          user_level_name: user.user_level_name,
          role: convertUserType(user.user_level_desc), // Convert the user type
          user_type: user.type
        }));
        setUsers(allUsers);
      } else {
        toast.error("Error fetching users: " + response.data.message);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error("An error occurred while fetching users.");
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost/coc/gsd/delete_master.php",
        { operation: "fetchAllVehicles" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        setVehicles(response.data.data);
      }
    } catch (error) {
      toast.error("Error fetching vehicles");
    } finally {
      setLoading(false);
    }
  };

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost/coc/gsd/delete_master.php",
        { operation: "fetchVenue" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        setVenues(response.data.data);
      }
    } catch (error) {
      toast.error("Error fetching venues");
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost/coc/gsd/delete_master.php",
        { operation: "fetchEquipmentsWithStatus" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        setEquipment(response.data.data);
      }
    } catch (error) {
      toast.error("Error fetching equipment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchVehicles();
    fetchVenues();
    fetchEquipment();
  }, []);

  const handleRestoreUser = async (record) => {
    try {
      const response = await axios.post("http://localhost/coc/gsd/delete_master.php", {
        operation: "unarchiveUser",
        userType: convertUserType(record.user_level_name),
        userId: record.users_id
      });

      if (response.data.status === 'success') {
        message.success(`User restored successfully`);
        fetchUsers();
      } else {
        message.error(`Failed to restore user`);
      }
    } catch (error) {
      console.error('Error restoring user:', error);
      message.error(`An error occurred while restoring user`);
    }
  };

  const handleRestoreVehicle = async (record) => {
    try {
      const response = await axios.post("http://localhost/coc/gsd/delete_master.php", {
        operation: "unarchiveResource",
        resourceType: "vehicle",
        resourceId: record.vehicle_id
      });

      if (response.data.status === 'success') {
        message.success(`Vehicle restored successfully`);
        fetchVehicles();
      } else {
        message.error(`Failed to restore vehicle`);
      }
    } catch (error) {
      console.error('Error restoring vehicle:', error);
      message.error(`An error occurred while restoring vehicle`);
    }
  };

  const handleRestoreVenue = async (record) => {
    try {
      const response = await axios.post("http://localhost/coc/gsd/delete_master.php", {
        operation: "unarchiveResource",
        resourceType: "venue",
        resourceId: record.ven_id
      });

      if (response.data.status === 'success') {
        message.success(`Venue restored successfully`);
        fetchVenues();
      } else {
        message.error(`Failed to restore venue`);
      }
    } catch (error) {
      console.error('Error restoring venue:', error);
      message.error(`An error occurred while restoring venue`);
    }
  };

  const handleRestoreEquipment = async (record) => {
    try {
      const response = await axios.post("http://localhost/coc/gsd/delete_master.php", {
        operation: "unarchiveResource",
        resourceType: "equipment",
        resourceId: record.equip_id
      });

      if (response.data.status === 'success') {
        message.success(`Equipment restored successfully`);
        fetchEquipment();
      } else {
        message.error(`Failed to restore equipment`);
      }
    } catch (error) {
      console.error('Error restoring equipment:', error);
      message.error(`An error occurred while restoring equipment`);
    }
  };

  const userColumns = [
    { title: 'School ID', dataIndex: 'users_school_id', key: 'school_id' },
    {
      title: 'Name',
      key: 'name',
      render: (text, record) => `${record.users_fname} ${record.users_mname} ${record.users_lname}`
    },
    { title: 'Email', dataIndex: 'users_email', key: 'email' },
    {
      title: 'Department',
      dataIndex: 'departments_name',
      key: 'department',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'User Level',
      dataIndex: 'user_level_name',
      key: 'userLevel',
      render: (text) => <Tag color="green">{text}</Tag>
    },
    { title: 'Contact', dataIndex: 'users_contact_number', key: 'contact' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Are you sure you want to restore this user?"
            onConfirm={() => handleRestoreUser(record)}
            okText="Yes"
            cancelText="No"
          >
            <StyledButton type="primary" icon={<UndoOutlined />}>
              Restore
            </StyledButton>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const vehicleColumns = [
    { title: 'License', dataIndex: 'vehicle_license', key: 'license' },
    { title: 'Make', dataIndex: 'vehicle_make_name', key: 'make' },
    { title: 'Model', dataIndex: 'vehicle_model_name', key: 'model' },
    { title: 'Category', dataIndex: 'vehicle_category_name', key: 'category' },
    { title: 'Year', dataIndex: 'year', key: 'year' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Are you sure you want to restore this vehicle?"
            onConfirm={() => handleRestoreVehicle(record)}
            okText="Yes"
            cancelText="No"
          >
            <StyledButton type="primary" icon={<UndoOutlined />}>
              Restore
            </StyledButton>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  const venueColumns = [
    { title: 'Name', dataIndex: 'ven_name', key: 'name' },
    { title: 'Occupancy', dataIndex: 'ven_occupancy', key: 'occupancy' },
    { title: 'Operating Hours', dataIndex: 'ven_operating_hours', key: 'hours' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Are you sure you want to restore this venue?"
            onConfirm={() => handleRestoreVenue(record)}
            okText="Yes"
            cancelText="No"
          >
            <StyledButton type="primary" icon={<UndoOutlined />}>
              Restore
            </StyledButton>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  const equipmentColumns = [
    { title: 'Name', dataIndex: 'equip_name', key: 'name' },
    { title: 'Quantity', dataIndex: 'equip_quantity', key: 'quantity' },
    { title: 'Created At', dataIndex: 'equip_created_at', key: 'created' },
    { title: 'Updated At', dataIndex: 'equip_updated_at', key: 'updated' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Are you sure you want to restore this equipment?"
            onConfirm={() => handleRestoreEquipment(record)}
            okText="Yes"
            cancelText="No"
          >
            <StyledButton type="primary" icon={<UndoOutlined />}>
              Restore
            </StyledButton>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <ContentWrapper>
        <StyledPaper elevation={0} sx={{ width: '100%', bgcolor: 'background.paper' }}>
          <StyledTabs
            value={value}
            onChange={handleChange}
            centered
            aria-label="archive sections"
          >
            <Tab label="Users" id="archive-tab-0" aria-controls="archive-tabpanel-0" />
            <Tab label="Vehicles" id="archive-tab-1" aria-controls="archive-tabpanel-1" />
            <Tab label="Venues" id="archive-tab-2" aria-controls="archive-tabpanel-2" />
            <Tab label="Equipment" id="archive-tab-3" aria-controls="archive-tabpanel-3" />
          </StyledTabs>

          <TabPanel value={value} index={0}>
            <Grid item xs={12}>
              <StyledPaper elevation={2} sx={{ p: 2 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600,
                    color: (theme) => theme.palette.text.primary,
                    mb: 3
                  }}
                >
                  Users Archive
                </Typography>
                <Table
                  columns={userColumns}
                  dataSource={users}
                  loading={loading}
                  rowKey="users_id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} items`,
                    style: { marginTop: '16px' }
                  }}
                  scroll={{ x: true }}
                />
              </StyledPaper>
            </Grid>
          </TabPanel>

          <TabPanel value={value} index={1}>
            <Grid item xs={12}>
              <StyledPaper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Vehicles Archive</Typography>
                <Table
                  columns={vehicleColumns}
                  dataSource={vehicles}
                  loading={loading}
                  rowKey="vehicle_id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} items`
                  }}
                />
              </StyledPaper>
            </Grid>
          </TabPanel>

          <TabPanel value={value} index={2}>
            <Grid item xs={12}>
              <StyledPaper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Venues Archive</Typography>
                <Table
                  columns={venueColumns}
                  dataSource={venues}
                  loading={loading}
                  rowKey="ven_id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} items`
                  }}
                />
              </StyledPaper>
            </Grid>
          </TabPanel>

          <TabPanel value={value} index={3}>
            <Grid item xs={12}>
              <StyledPaper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Equipment Archive</Typography>
                <Table
                  columns={equipmentColumns}
                  dataSource={equipment}
                  loading={loading}
                  rowKey="equip_id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} items`
                  }}
                />
              </StyledPaper>
            </Grid>
          </TabPanel>
        </StyledPaper>
      </ContentWrapper>
    </Box>
  );
};

export default Archive;
