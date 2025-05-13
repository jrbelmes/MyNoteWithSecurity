import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
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
  Tag,
  Spin,
  Alert,
  Tooltip
} from 'antd';
import { 
  EyeOutlined, 
  UserOutlined, 
  ClockCircleOutlined, 
  TeamOutlined, 
  CarOutlined, 
  ToolOutlined, 
  BuildOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEye } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import moment from 'moment';
import dayjs from 'dayjs';

const { Search } = Input;
const { Title, Text } = Typography;

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

// Add this style block
const styles = {
  searchInput: {
    borderColor: themeColors.primary
  }
};

// Add this function before DetailModal
const getStatusColor = (status) => {
  switch(status?.toLowerCase()) {
    case 'approve':
    case 'approved':
      return 'green';
    case 'pending':
      return 'gold';
    case 'decline':
    case 'declined':
      return 'red';
    case 'reserved':
      return 'blue';
    case 'cancelled':
      return 'gray';
    default:
      return 'default';
  }
};

// Helper for formatting date ranges
const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const isSameDay = start.toDateString() === end.toDateString();
  const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
  ];

  const formatTime = (date) => {
      return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
      });
  };

  if (isSameDay) {
      return `${monthNames[start.getMonth()]} ${start.getDate()} ${formatTime(start)} to ${formatTime(end)}`;
  } else {
      return `${monthNames[start.getMonth()]} ${start.getDate()}-${end.getDate()}\n${formatTime(start)} to ${formatTime(end)}`;
  }
};

// Move DetailModal outside of Record component
const DetailModal = ({ visible, record, onClose, theme }) => {
  const [modalData, setModalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (visible && record?.reservation_id) {
        setIsLoading(true);
        try {
          const response = await axios.post('http://localhost/coc/gsd/records&reports.php', {
            operation: 'getReservationDetailsById',
            json: {
              reservation_id: record.reservation_id
            }
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (response.data?.status === 'success') {
            setModalData(response.data.data);
          }
        } catch (error) {
          toast.error('Error fetching details');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [visible, record]);

  // Resource table columns definitions
  const columns = {
    venue: [
      {
        title: 'Venue Name',
        dataIndex: 'venue_name',
        key: 'venue_name',
        render: (text) => (
          <div className="flex items-center">
            <BuildOutlined className="mr-2 text-purple-500" />
            <span className="font-medium">{text}</span>
          </div>
        )
      }
    ],
    vehicle: [
      {
        title: 'Vehicle',
        dataIndex: 'vehicle_name',
        key: 'vehicle_name',
        render: (text, record) => (
          <div className="flex items-center">
            <CarOutlined className="mr-2 text-blue-500" />
            <span className="font-medium">
              {record.vehicle_make && record.vehicle_model 
                ? `${record.vehicle_make} ${record.vehicle_model}` 
                : text}
            </span>
          </div>
        )
      },
      {
        title: 'License Plate',
        dataIndex: 'vehicle_license',
        key: 'vehicle_license',
        render: (text, record) => (
          <Tag color="blue">{text || record.plate_number || 'N/A'}</Tag>
        )
      },
      {
        title: 'Driver',
        dataIndex: 'driver_name',
        key: 'driver_name',
        render: (text) => (
          <div className="flex items-center">
            <UserOutlined className="mr-2 text-green-500" />
            <span className="font-medium">
              {text || <Tag color="orange">Trip Ticket Request</Tag>}
            </span>
          </div>
        )
      }
    ],
    equipment: [
      {
        title: 'Equipment',
        dataIndex: 'equipment_name',
        key: 'equipment_name',
        render: (text) => (
          <div className="flex items-center">
            <ToolOutlined className="mr-2 text-orange-500" />
            <span className="font-medium">{text}</span>
          </div>
        )
      },
      {
        title: 'Quantity',
        dataIndex: 'quantity',
        key: 'quantity',
        render: (text) => <Tag color="orange">Qty: {text || '1'}</Tag>
      }
    ],
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button 
          key="close-button"
          onClick={onClose}
          style={{
            backgroundColor: theme.primary,
            color: theme.white
          }}
        >
          Close
        </Button>
      ]}
      className="reservation-detail-modal"
      bodyStyle={{ padding: '0' }}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <div className="p-0">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-green-500 p-6 rounded-t-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white m-0">
                    {modalData?.reservation_title}
                  </h2>
                  <Tag color={getStatusColor(modalData?.status_request)} className="text-sm px-3 py-1">
                    {modalData?.status_request}
                  </Tag>
                </div>
              </div>
              <div className="text-white text-right">
                <p className="text-white opacity-90 text-sm">Created on</p>
                <p className="font-semibold">
                  {modalData?.reservation_created_at 
                    ? new Date(modalData.reservation_created_at).toLocaleString() 
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
                  <UserOutlined className="text-blue-600" />
                  Reservation Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Requester Information */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium mb-4 text-gray-800">Requester Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <UserOutlined className="text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="font-medium">{modalData?.full_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TeamOutlined className="text-green-500" />
                        <div>
                          <p className="text-sm text-gray-500">Department</p>
                          <p className="font-medium">{modalData?.department_name}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium mb-4 text-gray-800">Schedule</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CalendarOutlined className="text-orange-500" />
                        <div>
                          <p className="text-sm text-gray-500">Date & Time</p>
                          <p className="font-medium">
                            {modalData?.reservation_start_date && modalData?.reservation_end_date 
                              ? formatDateRange(modalData.reservation_start_date, modalData.reservation_end_date)
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {modalData?.reservation_participants && (
                        <div className="flex items-center gap-2">
                          <TeamOutlined className="text-purple-500" />
                          <div>
                            <p className="text-sm text-gray-500">Participants</p>
                            <p className="font-medium">{modalData.reservation_participants}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resources Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">Reserved Resources</h3>
                  <div className="space-y-4">
                    {/* Venues */}
                    {modalData?.venues?.length > 0 && (
                      <Table 
                        title={() => (
                          <div className="flex items-center gap-2">
                            <BuildOutlined className="text-purple-600" />
                            <span>Venues</span>
                          </div>
                        )}
                        dataSource={modalData.venues} 
                        columns={columns.venue}
                        pagination={false}
                        size="small"
                        rowKey="venue_id"
                      />
                    )}

                    {/* Vehicles */}
                    {modalData?.vehicles?.length > 0 && (
                      <Table 
                        title={() => (
                          <div className="flex items-center gap-2">
                            <CarOutlined className="text-blue-600" />
                            <span>Vehicles</span>
                          </div>
                        )}
                        dataSource={modalData.vehicles} 
                        columns={columns.vehicle}
                        pagination={false}
                        size="small"
                        rowKey="vehicle_id"
                      />
                    )}

                    {/* Equipment */}
                    {modalData?.equipment?.length > 0 && (
                      <Table 
                        title={() => (
                          <div className="flex items-center gap-2">
                            <ToolOutlined className="text-orange-600" />
                            <span>Equipment</span>
                          </div>
                        )}
                        dataSource={modalData.equipment} 
                        columns={columns.equipment}
                        pagination={false}
                        size="small"
                        rowKey="equipment_id"
                      />
                    )}
                  </div>
                </div>

                {/* Description */}
                {modalData?.reservation_description && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2 text-gray-800">Description</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-gray-700">{modalData.reservation_description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

const Record = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost/coc/gsd/records&reports.php', {
        operation: 'fetchRecord',
        json: {}
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
        const uniqueData = [...new Map(response.data.data.map(item => [item.reservation_id, item])).values()];
        const consolidatedData = consolidateReservations(uniqueData);
        setReservations(consolidatedData);
      } else { 
        toast.error('No reservations found.');
        setReservations([]);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Error fetching reservations. Please try again later.');
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const consolidateReservations = (data) => {
    return data.map(item => ({
      key: item.reservation_id,
      reservation_id: item.reservation_id,
      title: item.reservation_title,
      description: item.reservation_description,
      start_date: item.reservation_start_date,
      end_date: item.reservation_end_date,
      status: item.reservation_status_name,
      requester: item.user_full_name
    }));
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'reservation_id',
      key: 'reservation_id',
      width: 80,
      sorter: (a, b) => a.reservation_id - b.reservation_id,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (text) => <span className="font-semibold text-green-800">{text}</span>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 250,
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 170,
      render: (date) => moment(date).format('MMM DD, YYYY hh:mm A'),
      sorter: (a, b) => moment(a.start_date).unix() - moment(b.start_date).unix(),
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 170,
      render: (date) => moment(date).format('MMM DD, YYYY hh:mm A'),
      sorter: (a, b) => moment(a.end_date).unix() - moment(b.end_date).unix(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
      filters: [
        { text: 'Reserved', value: 'Reserved' },
        { text: 'Decline', value: 'Decline' },
        { text: 'Completed', value: 'Completed' }
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Requester',
      dataIndex: 'requester',
      key: 'requester',
      width: 150,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="primary" 
              icon={<EyeOutlined />} 
              onClick={() => showModal(record)}
              size="small"
              className="bg-green-500 hover:bg-green-600 border-green-500"
            />
          </Tooltip>
        </Space>
      ),
    }
  ];

  const getFilteredReservations = () => {
    return reservations.filter(reservation => {
      const searchLower = searchText.toLowerCase();
      return (
        reservation.title?.toLowerCase().includes(searchLower) ||
        reservation.description?.toLowerCase().includes(searchLower) ||
        reservation.requester?.toLowerCase().includes(searchLower)
      );
    });
  };

  const showModal = (record) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-100 to-white overflow-hidden">
      <div className="flex-none">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white to-green-100 mt-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6 lg:p-10"
        >
          <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-sm">Reservation Records</h2>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
            <div className="flex flex-col md:flex-row items-center justify-between mb-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="relative w-full md:w-64 mb-4 md:mb-0"
              >
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search reservations..."
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                />
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
              </motion.div>
            </div>

            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center items-center h-64"
              >
                <div className="loader"></div>
              </motion.div>
            ) : (
              <div className="overflow-x-auto">
                <Table 
                  columns={columns} 
                  dataSource={getFilteredReservations()}
                  rowKey="reservation_id"
                  pagination={{
                    pageSize: pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50'],
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                    onChange: (page, pageSize) => {
                      setPageSize(pageSize);
                    }
                  }}
                  scroll={{ x: 1300 }}
                  bordered
                  size="middle"
                  className="record-table"
                  style={{ backgroundColor: 'white' }}
                  locale={{
                    emptyText: (
                      <div className="text-center py-8">
                        <SearchOutlined style={{ fontSize: 48 }} className="text-gray-300 mb-4" />
                        <p className="text-xl text-gray-500">No reservations found</p>
                      </div>
                    )
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <DetailModal
        visible={isModalVisible}
        record={selectedRecord}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedRecord(null);
        }}
        theme={themeColors}
      />
      <ToastContainer />
    </div>
  );
};

export default Record;
