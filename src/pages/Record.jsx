import { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './Sidebar';
import {
  Table,
  Badge,
  Input,
  Select,
  Space,
  Typography,
  Card,
  DatePicker,
  Modal,
  Button,
  Tabs,
  Timeline,
  Avatar,
  Statistic,
  Row,
  Col,
  Descriptions,
  Tag
} from 'antd';
import { EyeOutlined, UserOutlined, ClockCircleOutlined, TeamOutlined, CarOutlined, ToolOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Search } = Input;
const { Title } = Typography;

// Add theme constants
const themeColors = {
  primary: '#2E7D32', // dark green
  secondary: '#4CAF50', // medium green
  light: '#E8F5E9', // light green
  white: '#FFFFFF',
  success: '#388E3C',
  warning: '#FFA000',
  error: '#D32F2F',
  text: '#2C3E50',
  // Add new status colors
  pending: '#FFA000',
  approved: '#388E3C',
  declined: '#D32F2F',
  expired: '#9E9E9E',
  completed: '#1976D2'
};

const Record = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
        const response = await axios.post('http://localhost/coc/gsd/fetch_reserve.php', {
            operation: 'fetchRecords',
        });

        if (response.data?.status === 'success') {
            const consolidatedData = consolidateReservations(response.data.data);
            setReservations(consolidatedData);
            console.log('Consolidated reservations:', consolidatedData);
        } else { 
            toast.error('No pending reservations found.');
            setReservations([]);
        }
    } catch (error) {
        toast.error('Error fetching reservations. Please try again later.');
        setReservations([]);
    } finally {
        setLoading(false);
    }
  };

  const consolidateReservations = (data) => {
    return data.map(item => ({
      reservation_id: item.reservation_id,
      reservation_event_title: item.reservation_event_title,
      reservation_description: item.reservation_description,
      reservation_start_date: item.reservation_start_date,
      reservation_end_date: item.reservation_end_date,
      status_master_name: item.status_master_name,
      reservation_participants: item.reservation_participants
    }));
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { color: themeColors.pending, text: 'pending' },
      'approved': { color: themeColors.approved, text: 'approved' },
      'decline': { color: themeColors.declined, text: 'decline' },
      'cancelled': { color: themeColors.expired, text: 'cancelled' },
      'completed': { color: themeColors.completed, text: 'completed' }
    };
    
    return (
      <Badge
        style={{ 
          backgroundColor: statusMap[status]?.color || themeColors.pending,
          padding: '4px 12px',
          borderRadius: '12px'
        }}
        text={<span style={{ color: '#fff' }}>{status}</span>}
      />
    );
  };

  const columns = [
    {
      title: 'Event Title',
      dataIndex: 'reservation_event_title',
      sorter: (a, b) => a.reservation_event_title.localeCompare(b.reservation_event_title),
      filterable: true,
    },
    {
      title: 'Description',
      dataIndex: 'reservation_description',
      ellipsis: true,
    },
    {
      title: 'Start Date',
      dataIndex: 'reservation_start_date',
      render: (date) => moment(date).format('MMM DD, YYYY hh:mm A'),
      sorter: (a, b) => moment(a.reservation_start_date).unix() - moment(b.reservation_start_date).unix(),
    },
    {
      title: 'End Date',
      dataIndex: 'reservation_end_date',
      render: (date) => moment(date).format('MMM DD, YYYY hh:mm A'),
    },
    {
      title: 'Status',
      dataIndex: 'status_master_name',
      render: (status) => getStatusBadge(status),
      filters: [
        { text: 'pending', value: 'pending' },
        { text: 'approved', value: 'approved' },
        { text: 'decline', value: 'decline' },
        { text: 'cancelled', value: 'cancelled' },
        { text: 'completed', value: 'completed' },
      ],
      onFilter: (value, record) => record.status_master_name === value,
    },
    {
      title: 'Participants',
      dataIndex: 'reservation_participants',
      sorter: (a, b) => a.reservation_participants - b.reservation_participants,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => showModal(record)}
          size="small"
        >
          View
        </Button>
      ),
    }
  ];

  const filteredReservations = reservations.filter(reservation => {
    const searchLower = searchText.toLowerCase();
    return (
      reservation.reservation_event_title.toLowerCase().includes(searchLower) ||
      reservation.reservation_description.toLowerCase().includes(searchLower)
    );
  });

  const showModal = (record) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  const DetailModal = ({ visible, record, onClose, theme }) => {
    const [activeTab, setActiveTab] = useState('1');
    const [detailedData, setDetailedData] = useState(null);
  
    useEffect(() => {
      if (record?.reservation_id) {
        fetchDetailedData(record.reservation_id);
      }
    }, [record]);
  
    const fetchDetailedData = async (id) => {
      try {
        const response = await axios.post('http://localhost/coc/gsd/fetch_reserve.php', {
          operation: 'getReservationDetailsById',
          reservation_id: id
        });
        if (response.data?.status === 'success') {
          setDetailedData(response.data.data);
        }
      } catch (error) {
        toast.error('Error fetching details');
      }
    };

    const getUserProfilePic = (picPath) => {
      if (!picPath || picPath.endsWith('.')) return null; // Handle invalid paths ending with dot
      // Assume jpg if no extension is provided
      const path = picPath.endsWith('.') ? `${picPath}jpg` : picPath;
      return `http://localhost/coc/gsd/${path}`;
    };
  
    const items = [
      {
        key: '1',
        label: 'Basic Info',
        children: (
          <div className="p-4" style={{ backgroundColor: theme.light }}>
            <div className="flex items-center mb-4">
              <Avatar 
                size={64} 
                src={getUserProfilePic(detailedData?.reservation?.users_pic)}
                icon={<UserOutlined />}
                style={{
                  border: `2px solid ${theme.primary}`,
                  backgroundColor: theme.light
                }}
                onError={(e) => {
                  // Fallback to UserOutlined icon if image fails to load
                  const target = e.target;
                  target.onerror = null; // Prevent infinite loop
                  target.style.display = 'none';
                }}
              />
              <div className="ml-4">
                <h3 className="text-lg font-bold">{detailedData?.reservation?.users_full_name}</h3>
                <p>{detailedData?.reservation?.users_contact_number}</p>
              </div>
            </div>
            <Descriptions 
              bordered 
              column={1}
              style={{
                backgroundColor: theme.white,
                borderRadius: '8px',
                '.ant-descriptions-item-label': {
                  backgroundColor: theme.light,
                  color: theme.primary
                }
              }}
            >
              <Descriptions.Item label="Event Title">{detailedData?.reservation?.reservation_event_title}</Descriptions.Item>
              <Descriptions.Item label="Description">{detailedData?.reservation?.reservation_description}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={
                  detailedData?.reservation?.status_master_name === 'pending' ? 'gold' :
                  detailedData?.reservation?.status_master_name === 'approved' ? 'green' : 'red'
                }>
                  {detailedData?.reservation?.status_master_name}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created Date">
                {moment(detailedData?.reservation?.date_created).format('MMM DD, YYYY hh:mm A')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        ),
      },
      {
        key: '2',
        label: 'Timeline',
        children: (
          <Timeline mode="left" className="p-4">
            <Timeline.Item color="green">Created at {moment(detailedData?.reservation?.date_created).format('MMM DD, YYYY hh:mm A')}</Timeline.Item>
            <Timeline.Item color="blue">Starts at {moment(detailedData?.reservation?.reservation_start_date).format('MMM DD, YYYY hh:mm A')}</Timeline.Item>
            <Timeline.Item color="red">Ends at {moment(detailedData?.reservation?.reservation_end_date).format('MMM DD, YYYY hh:mm A')}</Timeline.Item>
          </Timeline>
        ),
      },
      {
        key: '3',
        label: 'Resources',
        children: (
          <div className="p-4">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card>
                  <Statistic title="Vehicles" value={record?.vehicles?.length || 0} prefix={<CarOutlined />} />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic title="Equipment" value={record?.equipments?.length || 0} prefix={<ToolOutlined />} />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic title="Participants" value={record?.reservation_participants || 0} prefix={<TeamOutlined />} />
                </Card>
              </Col>
            </Row>
          </div>
        ),
      },
    ];
  
    return (
      <Modal
        title={
          <span style={{ color: theme.primary }}>
            Reservation Details - {record?.reservation_event_title}
          </span>
        }
        open={visible}
        onCancel={onClose}
        width={800}
        footer={[
          <Button 
            key="close" 
            onClick={onClose}
            style={{
              backgroundColor: theme.primary,
              color: theme.white
            }}
          >
            Close
          </Button>
        ]}
        style={{
          '.ant-modal-content': {
            borderRadius: '12px',
            overflow: 'hidden'
          }
        }}
      >
        <Tabs 
          defaultActiveKey="1" 
          items={items}
          onChange={setActiveTab}
          style={{
            '.ant-tabs-tab.ant-tabs-tab-active': {
              color: theme.primary
            },
            '.ant-tabs-ink-bar': {
              backgroundColor: theme.primary
            }
          }}
        />
      </Modal>
    );
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div className="p-4" style={{ 
        backgroundColor: themeColors.light, 
        minHeight: '100vh',
        width: '100%' 
      }}>
        <Card 
          className="m-4"
          style={{ 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderRadius: '12px',
            border: 'none'
          }}
        >
          <ToastContainer />
          <div className="mb-4">
            <Title level={2} style={{ color: themeColors.primary }}>Reservation Records</Title>
            <Space className="mb-4" size="large">
              <Search
                placeholder="Search reservations..."
                allowClear
                onChange={(e) => setSearchText(e.target.value)}
                style={{ 
                  width: 300,
                  '.ant-input': { borderColor: themeColors.primary }
                }}
              />
              <Select
                defaultValue="all"
                style={{ 
                  width: 120,
                  '.ant-select-selector': { borderColor: themeColors.primary }
                }}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: '1', label: 'Pending' },
                  { value: '2', label: 'Approved' },
                  { value: '3', label: 'Rejected' },
                ]}
              />
              <DatePicker.RangePicker 
                style={{
                  borderColor: themeColors.primary
                }}
              />
            </Space>
          </div>
    
          <Table
            columns={columns}
            dataSource={filteredReservations}
            rowKey="reservation_id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} reservations`,
            }}
            scroll={{ x: 1000 }}
            style={{
              '.ant-table-thead > tr > th': {
                backgroundColor: themeColors.light,
                color: themeColors.primary
              },
              '.ant-table-tbody > tr:hover > td': {
                backgroundColor: themeColors.light
              }
            }}
          />
          <DetailModal
            visible={isModalVisible}
            record={selectedRecord}
            onClose={() => setIsModalVisible(false)}
            theme={themeColors}
          />
        </Card>
      </div>
    </div>
  );
};

export default Record;
