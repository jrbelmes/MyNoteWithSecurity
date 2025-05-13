import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faSearch, faPlus, faTrashAlt, faEye } from '@fortawesome/free-solid-svg-icons';
import '../vehicle.css';
import { Modal, Input, Form, TimePicker, Select, Table, Button, Image, Tooltip, Space, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion } from 'framer-motion';
import { FileUpload } from 'primereact/fileupload';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { Tag } from 'primereact/tag';
import { sanitizeInput, validateInput } from '../utils/sanitize';
import { SecureStorage } from '../utils/encryption';

const VenueEntry = () => {

    const user_level_id = localStorage.getItem('user_level_id');
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [venueName, setVenueName] = useState('');
    const [maxOccupancy, setMaxOccupancy] = useState('');
    const [venuePic, setVenuePic] = useState(null);
    const [operatingHours, setOperatingHours] = useState('');
    const [venueExists, setVenueExists] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentVenueId, setCurrentVenueId] = useState(null);
    const [operatingHoursStart, setOperatingHoursStart] = useState(null);
    const [operatingHoursEnd, setOperatingHoursEnd] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('1');
    const [statusOptions, setStatusOptions] = useState([]);
    const [viewImageModal, setViewImageModal] = useState(false);
    const [currentImage, setCurrentImage] = useState(null);
    const navigate = useNavigate();
    const user_id = SecureStorage.getSessionItem('user_id');
    const fileUploadRef = useRef(null);
    const encryptedUrl = SecureStorage.getLocalItem("url");
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 


    useEffect(() => {
        console.log("this is encryptedUserLevel", encryptedUserLevel);
        if (encryptedUserLevel !== '1' && encryptedUserLevel !== '2' && encryptedUserLevel !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [navigate]);

    useEffect(() => {
        fetchVenues();
    }, []);

    useEffect(() => {
        fetchStatusAvailability();
    }, []);

    const fetchVenues = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${encryptedUrl}/user.php`, new URLSearchParams({ operation: "fetchVenue" }));
            if (response.data.status === 'success') {
                setVenues(response.data.data);
            } else {
                toast.error("Error fetching venues: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching venues:", error);
            toast.error("An error occurred while fetching venues.");
        } finally {
            setLoading(false);
        }
    };

    const fetchStatusAvailability = async () => {
        try {
            const response = await axios.post(`${encryptedUrl}/fetchMaster.php`, 
                new URLSearchParams({
                    operation: 'fetchStatusAvailability'
                })
            );
            
            if (response.data.status === 'success') {
                setStatusOptions(response.data.data);
            } else {
                console.error("Failed to fetch status options");
            }
        } catch (error) {
            console.error("Error fetching status availability:", error);
        }
    };

    const handleAddVenue = () => {
        setVenueName('');
        setMaxOccupancy('');
        setShowModal(true);
        setEditMode(false);
        setVenueExists(false);
    };

    const getVenueDetails = async (venueId) => {
        try {
            const formData = new URLSearchParams();
            formData.append('operation', 'fetchVenueById');
            formData.append('id', venueId);
    
            const response = await axios.post(`${encryptedUrl}/fetchMaster.php`, 
                formData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
    
            console.log('Venue details response:', response.data); // Debug log
    
            if (response.data.status === 'success' && response.data.data && response.data.data.length > 0) {
                const venue = response.data.data[0];
                setVenueName(venue.ven_name);
                setMaxOccupancy(venue.ven_occupancy);
                setCurrentVenueId(venue.ven_id);
                setSelectedStatus(venue.status_availability_id);
                
                if (venue.ven_operating_hours) {
                    const [start, end] = venue.ven_operating_hours.split(' - ');
                    setOperatingHours(venue.ven_operating_hours);
                    if (start && end) {
                        setOperatingHoursStart(dayjs(start, 'HH:mm:ss'));
                        setOperatingHoursEnd(dayjs(end, 'HH:mm:ss'));
                    }
                }
                
                if (venue.ven_pic) {
                    const imageUrl = `${encryptedUrl}/${venue.ven_pic}`;
                    setPreviewUrl(imageUrl);
                    setFileList([{
                        uid: '-1',
                        name: 'venue-image.png',
                        status: 'done',
                        url: imageUrl,
                    }]);
                } else {
                    setPreviewUrl(null);
                    setFileList([]);
                }
                
                setShowModal(true);
                setEditMode(true);
            } else {
                toast.error("Failed to fetch venue details");
            }
        } catch (error) {
            console.error("Error fetching venue details:", error);
            toast.error("An error occurred while fetching venue details");
        }
    };
    

    const handleEditVenue = (venue) => {
        getVenueDetails(venue.ven_id);
    };

    const checkVenueExists = async () => {
        const response = await axios.post(`${encryptedUrl}/user.php`, new URLSearchParams({
            operation: "venueExists",
            json: JSON.stringify({ venue_name: venueName })
        }));

        if (response.data.status === 'success' && response.data.exists) {
            setVenueExists(true);
        } else {
            setVenueExists(false);
        }
    };

    const handleUpdateVenue = async () => {
       

        setLoading(true);
        try {
            let requestData = {
                operation: 'updateVenue',
                venueData: {
                    venue_id: currentVenueId,
                    venue_name: venueName,
                    max_occupancy: maxOccupancy,
                    operating_hours: operatingHours,
                    status_availability_id: parseInt(selectedStatus)
                }
            };

            // If there's a new image file
            if (venuePic instanceof File) {
                const reader = new FileReader();
                const base64Image = await new Promise((resolve) => {
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(venuePic);
                });
                requestData.venueData.ven_pic = base64Image;
            }

            const response = await axios.post(
                `${encryptedUrl}/update_master1.php`,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status === 'success') {
                toast.success("Venue successfully updated!");
                fetchVenues();
                setShowModal(false);
                resetForm();
            } else {
                toast.error(response.data.message || "Failed to update venue");
            }
        } catch (error) {
            console.error("Error updating venue:", error);
            toast.error("An error occurred while updating the venue.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setVenueName('');
        setMaxOccupancy('');
        setOperatingHours('');
        setVenuePic(null);
        setPreviewUrl(null);
        setFileList([]);
        setOperatingHoursStart(null);
        setOperatingHoursEnd(null);
    };

    const validateVenueData = () => {
        const sanitizedName = sanitizeInput(venueName);
        const sanitizedOccupancy = sanitizeInput(maxOccupancy);
        const sanitizedHours = sanitizeInput(operatingHours);

        if (!validateInput(sanitizedName) || !validateInput(sanitizedOccupancy)) {
            toast.error("Invalid input detected. Please check your entries.");
            return false;
        }

        if (!sanitizedName || !sanitizedOccupancy || !sanitizedHours) {
            toast.error("Please fill in all required fields!");
            return false;
        }

        // Validate occupancy
        if (parseInt(sanitizedOccupancy) <= 0) {
            toast.error("Maximum occupancy must be greater than zero!");
            return false;
        }

        return {
            name: sanitizedName,
            occupancy: sanitizedOccupancy,
            hours: sanitizedHours
        };
    };

    const handleSubmit = async () => {
        if (editMode) {
            await handleUpdateVenue();
        } else {
            const validatedData = validateVenueData();
            if (!validatedData) return;

            setLoading(true);
            try {
                let imageBase64 = null;
                if (venuePic) {
                    imageBase64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.readAsDataURL(venuePic);
                    });
                }

                const requestData = {
                    operation: 'saveVenue',
                    data: {
                        name: validatedData.name,
                        occupancy: validatedData.occupancy,
                        operating_hours: validatedData.hours,
                        user_admin_id: encryptedUserLevel === '1' ? user_id : null,  // Set for user admin (level 1)
                        status_availability_id: parseInt(selectedStatus),
                        ven_pic: imageBase64
                    }
                };

                console.log(requestData);

                const response = await axios.post(
                    `${encryptedUrl}/insert_master.php`,
                    requestData,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.data.status === 'success') {
                    toast.success("Venue successfully added!");
                    fetchVenues();
                    setShowModal(false);
                    resetForm();
                } else {
                    toast.error(response.data.message || "Failed to save venue");
                }
            } catch (error) {
                console.error("Error saving venue:", error);
                toast.error("An error occurred while saving the venue.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleVenueNameChange = (e) => {
        const sanitizedValue = sanitizeInput(e.target.value);
        setVenueName(sanitizedValue);
        if (!editMode) {
            checkVenueExists();
        }
    };

    const handleOccupancyChange = (e) => {
        const sanitizedValue = sanitizeInput(e.target.value);
        if (/^\d*$/.test(sanitizedValue)) { // Only allow digits
            setMaxOccupancy(sanitizedValue);
        }
    };

    const handleArchiveVenue = async (venueId) => {
        const confirmArchive = window.confirm("Are you sure you want to archive this venue?");
        if (!confirmArchive) return;

        setLoading(true);
        try {
            const response = await axios.post(
                `${encryptedUrl}/delete_master.php`,
                {
                    operation: "archiveResource",
                    resourceType: "venue",
                    resourceId: venueId
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status === 'success') {
                toast.success("Venue successfully archived!");
                fetchVenues();
            } else {
                toast.error("Failed to archive venue: " + response.data.message);
            }
        } catch (error) {
            console.error("Error archiving venue:", error);
            toast.error("An error occurred while archiving the venue.");
        } finally {
            setLoading(false);
        }
    };

    const handleTimeChange = (times, timeStrings) => {
        if (times) {
            setOperatingHoursStart(times[0]);
            setOperatingHoursEnd(times[1]);
            setOperatingHours(`${timeStrings[0]} - ${timeStrings[1]}`);
        } else {
            setOperatingHoursStart(null);
            setOperatingHoursEnd(null);
            setOperatingHours('');
        }
    };

    const handleImageUpload = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        if (newFileList.length > 0) {
            const file = newFileList[0].originFileObj;
            setVenuePic(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setVenuePic(null);
            setPreviewUrl(null);
        }
    };

    const onFileRemove = () => {
        setVenuePic(null);
        setPreviewUrl(null);
        if (fileUploadRef.current) {
            fileUploadRef.current.clear();
        }
    };

    const filteredVenues = venues.filter(venue =>
        venue.ven_name && venue.ven_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getImageUrl = (venuePic) => {
        if (!venuePic) return null;
        return `${encryptedUrl}/${venuePic}`;
    };

    const handleViewImage = (imageUrl) => {
        setCurrentImage(imageUrl);
        setViewImageModal(true);
    };

    // Table columns configuration
    const columns = [
        {
            title: 'ID',
            dataIndex: 'ven_id',
            key: 'ven_id',
            width: 80,
            sorter: (a, b) => a.ven_id - b.ven_id,
        },
        {
            title: 'Image',
            dataIndex: 'ven_pic',
            key: 'ven_pic',
            width: 100,
            render: (text, record) => {
                const imageUrl = getImageUrl(record.ven_pic);
                return (
                    <div className="flex justify-center">
                        {imageUrl ? (
                            <div className="cursor-pointer" onClick={() => handleViewImage(imageUrl)}>
                                <img 
                                    src={imageUrl} 
                                    alt={record.ven_name} 
                                    className="w-16 h-16 object-cover rounded-md shadow-sm hover:opacity-80 transition-opacity"
                                />
                            </div>
                        ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                                <i className="pi pi-image text-2xl"></i>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            title: 'Venue Name',
            dataIndex: 'ven_name',
            key: 'ven_name',
            sorter: (a, b) => a.ven_name.localeCompare(b.ven_name),
            render: (text) => <span className="font-semibold text-green-800">{text}</span>
        },
        {
            title: 'Max Occupancy',
            dataIndex: 'ven_occupancy',
            key: 'ven_occupancy',
            width: 150,
            sorter: (a, b) => a.ven_occupancy - b.ven_occupancy,
            render: (text) => <span>{text} people</span>
        },
        {
            title: 'Operating Hours',
            dataIndex: 'ven_operating_hours',
            key: 'ven_operating_hours',
            width: 180,
            render: (text) => text || 'Not specified'
        },
        {
            title: 'Status',
            dataIndex: 'status_availability_id',
            key: 'status_availability_id',
            width: 120,
            render: (statusId) => (
                <Tag 
                    value={statusId === '1' ? 'Available' : 'Not Available'} 
                    severity={statusId === '1' ? 'success' : 'danger'}
                    className="px-2 py-1 text-xs font-semibold"
                />
            ),
            filters: statusOptions.map(status => ({
                text: status.status_availability_name,
                value: status.status_availability_id,
            })),
            onFilter: (value, record) => record.status_availability_id === value,
        },
        {
            title: 'Created At',
            dataIndex: 'ven_created_at',
            key: 'ven_created_at',
            width: 170,
            sorter: (a, b) => new Date(a.ven_created_at) - new Date(b.ven_created_at),
            render: (text) => dayjs(text).format('MMM D, YYYY HH:mm')
        },
        {
            title: 'Updated At',
            dataIndex: 'ven_updated_at',
            key: 'ven_updated_at',
            width: 170,
            sorter: (a, b) => new Date(a.ven_updated_at) - new Date(b.ven_updated_at),
            render: (text) => dayjs(text).format('MMM D, YYYY HH:mm')
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Edit Venue">
                        <Button 
                            type="primary" 
                            icon={<FontAwesomeIcon icon={faEdit} />} 
                            onClick={() => handleEditVenue(record)}
                            size="small"
                            className="bg-green-500 hover:bg-green-600 border-green-500"
                        />
                    </Tooltip>
                    <Tooltip title="Archive Venue">
                        <Button 
                            icon={<FontAwesomeIcon icon={faTrashAlt} />} 
                            onClick={() => handleArchiveVenue(record.ven_id)}
                            size="small"
                            className="text-yellow-600 hover:text-yellow-700 border-yellow-300 hover:border-yellow-400"
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    return (
        <div className="flex h-screen bg-gradient-to-br from-green-100 to-white overflow-hidden">
            <div className="flex-none">
                <Sidebar />
            </div>
            <div className="flex-1 overflow-y-auto bg-white bg-opacity-60 mt-20">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="p-6 lg:p-10"
                >
                    <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-sm">Venue Management</h2>
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
                        <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                            <motion.div 
                                whileHover={{ scale: 1.05 }}
                                className="relative w-full md:w-64 mb-4 md:mb-0"
                            >
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search venues..."
                                    className="w-full pl-10 pr-4 py-2 rounded-full border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                                />
                                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
                            </motion.div>
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleAddVenue}
                                className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center shadow-md"
                            >
                                <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Venue
                            </motion.button>
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
                                    dataSource={filteredVenues}
                                    rowKey="ven_id"
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
                                    className="venue-table"
                                    style={{ backgroundColor: 'white' }}
                                    locale={{
                                        emptyText: (
                                            <div className="text-center py-8">
                                                <i className="pi pi-search text-6xl text-gray-300 mb-4"></i>
                                                <p className="text-xl text-gray-500">No venues found</p>
                                            </div>
                                        )
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Venue Modal */}
            <Modal
                title={editMode ? 'Edit Venue' : 'Add Venue'}
                open={showModal}
                onCancel={() => setShowModal(false)}
                okText={editMode ? 'Update' : 'Add'}
                onOk={handleSubmit}
                confirmLoading={loading}
            >
                <Form layout="vertical">
                    <Form.Item
                        label="Venue Name"
                        validateStatus={venueExists ? 'error' : ''}
                        help={venueExists && 'Venue already exists!'}
                    >
                        <Input
                            value={venueName}
                            onChange={handleVenueNameChange}
                            placeholder="Enter venue name"
                        />
                    </Form.Item>
                    <Form.Item label="Max Occupancy">
                        <Input
                            type="number"
                            value={maxOccupancy}
                            onChange={handleOccupancyChange}
                            placeholder="Enter maximum occupancy"
                            min="1"
                        />
                    </Form.Item>
                    <Form.Item 
                        label="Operating Hours"
                        required
                        tooltip="Select start and end time"
                    >
                        <TimePicker.RangePicker 
                            format="HH:mm:ss"
                            value={[operatingHoursStart, operatingHoursEnd]}
                            onChange={handleTimeChange}
                            className="w-full"
                            placeholder={['Start Time', 'End Time']}
                        />
                    </Form.Item>
                    <Form.Item 
                        label="Venue Picture" 
                        tooltip="Upload venue image (max 5MB, formats: jpg, png)"
                    >
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            onChange={handleImageUpload}
                            beforeUpload={() => false}
                            maxCount={1}
                        >
                            {fileList.length < 1 && (
                                <Button icon={<PlusOutlined />}>
                                    Upload
                                </Button>
                            )}
                        </Upload>
                        {previewUrl && typeof previewUrl === 'string' && previewUrl.startsWith('http') && (
                            <div className="mt-4">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-32 h-32 object-cover rounded shadow-md"
                                />
                            </div>
                        )}
                    </Form.Item>
                    <Form.Item 
                        label="Status" 
                        required
                        tooltip="Select venue availability status"
                    >
                        <Select
                            value={selectedStatus}
                            onChange={(value) => setSelectedStatus(value)}
                            className="w-full"
                        >
                            {statusOptions.map(status => (
                                <Select.Option 
                                    key={status.status_availability_id} 
                                    value={status.status_availability_id}
                                >
                                    {status.status_availability_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Image Preview Modal */}
            <Modal
                open={viewImageModal}
                footer={null}
                onCancel={() => setViewImageModal(false)}
                width={700}
                centered
            >
                {currentImage && (
                    <Image
                        src={currentImage}
                        alt="Venue"
                        className="w-full object-contain max-h-[70vh]"
                        preview={false}
                    />
                )}
            </Modal>
        </div>
    );
};

export default VenueEntry;
