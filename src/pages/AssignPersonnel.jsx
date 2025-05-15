import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Sidebar from './Sidebar';
import { SecureStorage } from '../utils/encryption';
import { Table, Button, Tag, Space, Input, Tooltip, Modal, Select, Form, Empty, Pagination } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUserPlus, faEye, faCheckCircle, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import { toast } from 'sonner';

const AssignPersonnel = () => {
  const [activeTab, setActiveTab] = useState('Not Assigned');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [personnel, setPersonnel] = useState([]);
  const [formData, setFormData] = useState({
    personnel: '',
    checklists: []
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [reservations, setReservations] = useState([]);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [selectedChecklists, setSelectedChecklists] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const handleOpenModal = async (reservation) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost/coc/gsd/fetch2.php', {
        operation: 'getReservedById',
        reservation_id: reservation.id
      });

      if (response.data.status === 'success') {
        const { data } = response.data;
        let checklists = [];
        
        // Process venues
        if (data.venues && data.venues.length > 0) {
          data.venues.forEach(venue => {
            if (venue.checklists && venue.checklists.length > 0) {
              const venueItems = venue.checklists.map(item => ({
                id: item.checklist_venue_id,
                name: item.checklist_name,
                type: 'venue',
                reservation_venue_id: venue.reservation_venue_id
              }));
              checklists.push({
                category: `Venue: ${venue.name}`,
                items: venueItems
              });
            }
          });
        }

        // Process equipment
        if (data.equipments && data.equipments.length > 0) {
          data.equipments.forEach(equipment => {
            if (equipment.checklists && equipment.checklists.length > 0) {
              const equipmentItems = equipment.checklists.map(item => ({
                id: item.checklist_equipment_id,
                name: item.checklist_name,
                type: 'equipment',
                reservation_equipment_id: equipment.reservation_equipment_id
              }));
              checklists.push({
                category: `Equipment: ${equipment.name} (Qty: ${equipment.quantity})`,
                items: equipmentItems
              });
            }
          });
        }

        // Process vehicles
        if (data.vehicles && data.vehicles.length > 0) {
          data.vehicles.forEach(vehicle => {
            if (vehicle.checklists && vehicle.checklists.length > 0) {
              const vehicleItems = vehicle.checklists.map(item => ({
                id: item.checklist_vehicle_id,
                name: item.checklist_name,
                type: 'vehicle',
                reservation_vehicle_id: vehicle.reservation_vehicle_id
              }));
              checklists.push({
                category: `Vehicle: ${vehicle.model || 'N/A'} (License: ${vehicle.license || 'N/A'})`,
                items: vehicleItems
              });
            }
          });
        }

        setSelectedReservation(reservation);
        setFormData({
          personnel: '',
          checklists: checklists
        });
      }
    } catch (error) {
      console.error('Error fetching reservation details:', error);
      setFormData({ personnel: '', checklists: [] });
    } finally {
      setLoading(false);
    }
    setIsModalOpen(true);
  };

  const handleAssign = async () => {
    setErrorMessage('');
    if (!formData.personnel) {
      setErrorMessage('Please select a personnel');
      return;
    }

    const selectedPersonnelObj = personnel.find(p => p.full_name === formData.personnel);
    if (!selectedPersonnelObj) {
      setErrorMessage('Selected personnel not found');
      return;
    }

    setLoading(true);
    try {
      const checklistIds = [];

      formData.checklists.forEach(category => {
        category.items.forEach(item => {
          const entry = {
            type: item.type,
            checklist_id: item.id
          };

          switch (item.type) {
            case 'venue':
              entry.reservation_venue_id = item.reservation_venue_id;
              break;
            case 'equipment':
              entry.reservation_equipment_id = item.reservation_equipment_id;
              break;
            case 'vehicle':
              entry.reservation_vehicle_id = item.reservation_vehicle_id;
              break;
          }

          checklistIds.push(entry);
        });
      });

      const payload = {
        operation: 'saveChecklist',
        data: {
          admin_id: SecureStorage.getSessionItem("user_id"),
          personnel_id: selectedPersonnelObj.users_id,
          checklist_ids: checklistIds
        }
      };

      const response = await axios.post('http://localhost/coc/gsd/fetch2.php', payload);

      if (response.data.status === 'success') {
        setReservations(prev => 
          prev.map(res => 
            res.id === selectedReservation.id ? {
              ...res,
              personnel: formData.personnel,
              status: 'Assigned'
            } : res
          )
        );
        
        setIsModalOpen(false);
        setFormData({ personnel: '', checklists: [] });
        setSelectedReservation(null);
        setErrorMessage('');
        toast.success('Personnel assigned successfully!');

        if (activeTab === 'Not Assigned') {
          fetchNotAssignedReservations();
        }
      } else {
        setErrorMessage('Failed to assign personnel. Please try again.');
        toast.error('Failed to assign personnel');
      }
    } catch (error) {
      console.error('Error assigning personnel:', error);
      setErrorMessage(error.message || 'An error occurred while assigning personnel.');
      toast.error('An error occurred while assigning personnel');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (reservationId, personnelId) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost/coc/gsd/records&reports.php', {
        operation: 'updateReleaseStatus',
        json: {
          reservation_id: reservationId,
          status_checklist_id: 2 // Assuming 2 is the ID for "Completed" status
        }
      });

      if (response.data.status === 'success') {
        toast.success('Reservation marked as completed!');
        // Refresh the current tab's data
        if (activeTab === 'Assigned') {
          fetchAssignedReservations();
        }
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating release status:', error);
      toast.error('Error updating release status');
    } finally {
      setLoading(false);
    }
  };

  const toggleChecklistStatus = (reservationId, checklistIndex) => {
    setReservations(reservations.map(res => {
      if (res.id === reservationId) {
        const updatedChecklists = res.checklists.map((checklist, idx) => 
          idx === checklistIndex 
            ? { ...checklist, status: checklist.status === 'pending' ? 'completed' : 'pending' }
            : checklist
        );
        return { ...res, checklists: updatedChecklists };
      }
      return res;
    }));
  };

  const fetchPersonnel = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost/coc/gsd/fetch2.php', {
        operation: 'fetchPersonnel'
      });

      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        setPersonnel(response.data.data);
      } else {
        console.error('Invalid data format received:', response.data);
        toast.error('Failed to fetch personnel data');
      }
    } catch (error) {
      console.error('Error fetching personnel:', error);
      toast.error('Error fetching personnel data');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotAssignedReservations = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost/coc/gsd/records&reports.php', {
        operation: 'fetchNoAssignedReservation'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        const formattedData = response.data.data.map(item => ({
          id: item.reservation_id,
          type: item.venue_form_name ? 'Venue' : 'Vehicle',
          name: item.reservation_title || 'Untitled',
          details: item.venue_details || item.vehicle_details,
          personnel: 'N/A',
          checklists: [],
          status: 'Not Assigned',
          createdAt: new Date(item.reservation_created_at).toLocaleString()
        }));
        setReservations(formattedData);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Error fetching unassigned reservations');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedReservations = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost/coc/gsd/records&reports.php', {
        operation: 'fetchAssignedRelease'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        const formattedData = response.data.data.map(item => {
          const masterData = item.master_data;
          return {
            id: masterData.reservation_id,
            type: masterData.venue_form_name ? 'Venue' : 'Vehicle',
            name: masterData.venue_form_name || masterData.vehicle_form_name,
            details: '',
            personnel: personnel.find(p => p.jo_personel_id === masterData.checklist_personnel_id)?.full_name || 'Unknown',
            checklists: masterData.venue_form_name 
              ? item.venue_equipment.map(eq => ({
                  name: eq.release_checklist_name,
                  status: eq.status_checklist_name || (eq.release_isActive === '1' ? 'completed' : 'pending')
                }))
              : item.vehicle_checklist.map(vc => ({
                  name: vc.release_checklist_name,
                  status: vc.status_checklist_name || (vc.release_isActive === '1' ? 'completed' : 'pending')
                })),
            status: 'Assigned',
            createdAt: masterData.reservation_date
          };
        });
        setReservations(formattedData);
      }
    } catch (error) {
      console.error('Error fetching assigned reservations:', error);
      toast.error('Error fetching assigned reservations');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedReservations = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost/coc/gsd/records&reports.php', {
        operation: 'fetchCompletedRelease'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        const formattedData = response.data.data.map(item => {
          const masterData = item.master_data;
          return {
            id: masterData.reservation_id,
            type: masterData.venue_form_name ? 'Venue' : 'Vehicle',
            name: masterData.venue_form_name || masterData.vehicle_form_name,
            details: '',
            personnel: personnel.find(p => p.jo_personel_id === masterData.checklist_personnel_id)?.full_name || 'Unknown',
            checklists: masterData.venue_form_name 
              ? item.venue_equipment.map(eq => ({
                  name: eq.release_checklist_name,
                  status: masterData.status_checklist_name || 'Completed'
                }))
              : item.vehicle_checklist.map(vc => ({
                  name: vc.release_checklist_name,
                  status: masterData.status_checklist_name || 'Completed'
                })),
            status: 'Completed',
            createdAt: masterData.reservation_date
          };
        });
        setReservations(formattedData);
      }
    } catch (error) {
      console.error('Error fetching completed reservations:', error);
      toast.error('Error fetching completed reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  useEffect(() => {
    if (activeTab === 'Not Assigned') {
      fetchNotAssignedReservations();
    } else if (activeTab === 'Assigned') {
      fetchAssignedReservations();
    } else if (activeTab === 'Completed') {
      fetchCompletedReservations();
    }
  }, [activeTab]);

  // Filter reservations based on search term and active tab
  const filteredReservations = reservations
    .filter(res => res.status === activeTab)
    .filter(res => res.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Table columns configuration
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: true,
      sortOrder: sortField === 'id' ? sortOrder : null,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (text) => (
        <Tag color={text === 'Venue' ? 'green' : 'blue'} className="rounded-full px-2 py-1 text-xs font-medium">
          {text}
        </Tag>
      ),
      filters: [
        { text: 'Venue', value: 'Venue' },
        { text: 'Vehicle', value: 'Vehicle' },
      ],
      onFilter: (value, record) => record.type === value,
      sorter: true,
      sortOrder: sortField === 'type' ? sortOrder : null,
    },
    {
      title: 'Reservation Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true, 
      sortOrder: sortField === 'name' ? sortOrder : null,
      render: (text) => <span className="font-medium text-green-800">{text}</span>
    },
    {
      title: 'Assigned Personnel',
      dataIndex: 'personnel',
      key: 'personnel',
      sorter: true,
      sortOrder: sortField === 'personnel' ? sortOrder : null,
      render: (text) => {
        if (text === 'N/A') {
          return <span className="text-gray-500 italic">Not Assigned</span>;
        }
        return (
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-2 text-green-600 font-medium">
              {text.charAt(0)}
            </div>
            <span>{text}</span>
          </div>
        );
      }
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      sorter: true,
      sortOrder: sortField === 'createdAt' ? sortOrder : null,
      render: (text) => dayjs(text).format('MMM D, YYYY HH:mm')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      sorter: true,
      sortOrder: sortField === 'status' ? sortOrder : null,
      render: (status, record) => {
        if (status === 'Not Assigned') {
          return <Tag color="warning" className="rounded-full px-2 py-1 text-xs font-medium">Not Assigned</Tag>;
        } else if (status === 'Assigned') {
          const allCompleted = record.checklists && record.checklists.every(item => item.status === 'completed');
          return (
            <Tag color={allCompleted ? "success" : "processing"} className="rounded-full px-2 py-1 text-xs font-medium">
              {allCompleted ? 'Ready to Complete' : 'In Progress'}
            </Tag>
          );
        } else {
          return <Tag color="success" className="rounded-full px-2 py-1 text-xs font-medium">Completed</Tag>;
        }
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, record) => {
        if (record.status === 'Not Assigned') {
          return (
            <Tooltip title="Assign Personnel">
              <Button
                type="primary"
                icon={<FontAwesomeIcon icon={faUserPlus} />}
                onClick={() => handleOpenModal(record)}
                size="small"
                className="bg-green-900 hover:bg-lime-900 border-green-900"
              >
                Assign
              </Button>
            </Tooltip>
          );
        } else if (record.status === 'Assigned') {
          return (
            <Space>
              {record.checklists.length > 0 && (
                <Tooltip title="View Checklists">
                  <Button
                    icon={<FontAwesomeIcon icon={faEye} />}
                    onClick={() => {
                      setSelectedChecklists(record.checklists);
                      setIsChecklistModalOpen(true);
                    }}
                    size="small"
                    className="border-gray-300 text-gray-600"
                  >
                    Checklists
                  </Button>
                </Tooltip>
              )}
              {record.checklists.every(item => item.status === 'completed') && (
                <Tooltip title="Mark as Complete">
                  <Button
                    type="primary"
                    icon={<FontAwesomeIcon icon={faCheckCircle} />}
                    onClick={() => handleComplete(record.id, record.personnel_id)}
                    size="small"
                    className="bg-green-900 hover:bg-lime-900 border-green-900"
                  >
                    Complete
                  </Button>
                </Tooltip>
              )}
            </Space>
          );
        } else {
          return (
            <Tooltip title="View Checklists">
              <Button
                icon={<FontAwesomeIcon icon={faEye} />}
                onClick={() => {
                  setSelectedChecklists(record.checklists);
                  setIsChecklistModalOpen(true);
                }}
                size="small"
                className="border-gray-300 text-gray-600"
              >
                Checklists
              </Button>
            </Tooltip>
          );
        }
      },
    },
  ];

  const handleRefresh = () => {
    if (activeTab === 'Not Assigned') {
      fetchNotAssignedReservations();
    } else if (activeTab === 'Assigned') {
      fetchAssignedReservations();
    } else if (activeTab === 'Completed') {
      fetchCompletedReservations();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-grow p-6 sm:p-8 overflow-y-auto">
        <div className="p-[2.5rem] lg:p-12 min-h-screen">
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-2xl font-custom-font font-bold text-green-900 mt-5">
                Assign Personnel
              </h2>
            </div>
          </motion.div>
          
          {/* Tabs */}
          <div className="mb-6 bg-[#fafff4] p-2 rounded-xl shadow-md inline-flex">
            {['Not Assigned', 'Assigned', 'Completed'].map((tab) => (
              <motion.button
                key={tab}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-green-900 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{tab}</span>
                  <span className={`px-2 py-0.5 rounded-full text-sm ${
                    activeTab === tab
                      ? 'bg-white bg-opacity-30 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {reservations.filter(r => r.status === tab).length}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
          
          {/* Search & Controls */}
          <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="flex-1">
                  <Input
                    placeholder="Search reservations by name"
                    allowClear
                    prefix={<FontAwesomeIcon icon={faSearch} className="text-gray-400" />}
                    size="large"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Tooltip title="Refresh data">
                  <Button
                    icon={<FontAwesomeIcon icon={faSyncAlt} />}
                    onClick={handleRefresh}
                    size="large"
                  />
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-green-400/20 dark:bg-green-900/20 dark:text-green-900">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className="px-6 py-3"
                      onClick={() =>
                        column.sorter && handleSort(column.dataIndex)
                      }
                    >
                      <div className="flex items-center cursor-pointer hover:text-gray-900">
                        {column.title}
                        {sortField === column.dataIndex && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReservations.length > 0 ? (
                  filteredReservations
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((record) => (
                      <tr
                        key={record.id}
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        {columns.map((column) => (
                          <td
                            key={`${record.id}-${column.key}`}
                            className="px-6 py-4"
                          >
                            {column.render
                              ? column.render(record[column.dataIndex], record)
                              : record[column.dataIndex]}
                          </td>
                        ))}
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-24 text-center"
                    >
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <span className="text-gray-500 dark:text-gray-400">
                            No reservations found
                          </span>
                        }
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredReservations.length}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
                showSizeChanger={true}
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`
                }
                className="flex justify-end"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      <Modal
        title={
          <div className="text-xl font-bold text-green-900">
            Assign Personnel
            {selectedReservation && (
              <div className="text-sm font-normal text-gray-500 mt-1">
                Reservation: {selectedReservation.name}
              </div>
            )}
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={loading} 
            onClick={handleAssign}
            className="bg-green-900 hover:bg-lime-900"
          >
            Assign Personnel
          </Button>
        ]}
        width={600}
        className="assignment-modal"
        centered
      >
        <Form layout="vertical" className="mt-4">
          <Form.Item 
            label="Select Personnel" 
            validateStatus={errorMessage ? "error" : ""}
            help={errorMessage}
            required
          >
            <Select
              value={formData.personnel}
              onChange={(value) => setFormData({...formData, personnel: value})}
              placeholder="Select personnel"
              className="w-full"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {personnel.map((person) => (
                <Select.Option key={person.users_id} value={person.full_name}>
                  {person.full_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Checklists">
            <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto border border-gray-200">
              {formData.checklists.map((categoryList, categoryIndex) => (
                <div key={categoryIndex} className="mb-4">
                  <h4 className="font-medium text-green-900 sticky top-0 bg-gray-50 py-1 border-b border-gray-200 mb-2">
                    {categoryList.category}
                  </h4>
                  {categoryList.items.map((checklist, index) => (
                    <div key={index} className="flex items-center py-1.5 px-2 hover:bg-gray-100 rounded-md ml-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-700">{checklist.name}</span>
                    </div>
                  ))}
                </div>
              ))}
              {formData.checklists.length === 0 && (
                <div className="flex items-center justify-center h-20 text-gray-500 italic">
                  No checklists available
                </div>
              )}
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Checklist Modal */}
      <Modal
        title={<div className="text-xl font-bold text-green-900">Checklist Items</div>}
        open={isChecklistModalOpen}
        onCancel={() => setIsChecklistModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsChecklistModalOpen(false)}>
            Close
          </Button>
        ]}
        width={500}
        centered
      >
        <div className="mt-4 space-y-2">
          {selectedChecklists.map((checklist, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className={`text-sm flex-1 ${checklist.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {checklist.name}
              </span>
              <Tag 
                color={checklist.status === 'completed' ? 'success' : 'warning'}
                className="capitalize rounded-full px-2 py-0.5 text-xs"
              >
                {checklist.status}
              </Tag>
            </motion.div>
          ))}
          {selectedChecklists.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No checklist items available
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AssignPersonnel;