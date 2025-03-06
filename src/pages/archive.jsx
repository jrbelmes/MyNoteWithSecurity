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
  const [loading, setLoading] = useState(false);

  const handleChange = (event, newValue) => {
    setValue(newValue);
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
          users_user_level_id: user.user_level_desc,
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRestore = async (record, type) => {
    try {
      const response = await axios.post("http://localhost/coc/gsd/restore_master.php", {
        operation: `restore${type}`,
        id: record.id
      });

      if (response.data.status === 'success') {
        message.success(`${type} restored successfully`);
        fetchUsers(); // Refresh the data
      } else {
        message.error(`Failed to restore ${type}`);
      }
    } catch (error) {
      console.error(`Error restoring ${type}:`, error);
      message.error(`An error occurred while restoring ${type}`);
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
            onConfirm={() => handleRestore(record, 'User')}
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
                  columns={[]} // Add vehicle columns here
                  dataSource={[]}
                  loading={loading}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true
                  }}
                />
              </StyledPaper>
            </Grid>
          </TabPanel>

          <TabPanel value={value} index={2}>
            <Grid item xs={12}>
              <StyledPaper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Venues Archive</Typography>
                {/* Add your venues archive content here */}
              </StyledPaper>
            </Grid>
          </TabPanel>

          <TabPanel value={value} index={3}>
            <Grid item xs={12}>
              <StyledPaper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Equipment Archive</Typography>
                {/* Add your equipment archive content here */}
              </StyledPaper>
            </Grid>
          </TabPanel>
        </StyledPaper>
      </ContentWrapper>
    </Box>
  );
};

export default Archive;
