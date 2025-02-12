import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faSearch, faPlus, faUser } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion, AnimatePresence } from 'framer-motion';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import "primereact/resources/themes/lara-light-indigo/theme.css";  // theme
import "primereact/resources/primereact.css";     // core css
import "primeicons/primeicons.css";               // icons
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { Chip } from 'primereact/chip';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';

const generateAvatarColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
        '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
        '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
        '#f1c40f', '#e67e22', '#e74c3c', '#95a5a6', '#f39c12',
        '#d35400', '#c0392b', '#7f8c8d'
    ];
    return colors[Math.abs(hash) % colors.length];
};

const Faculty = () => {
    const user_level_id = localStorage.getItem('user_level_id');
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [userLevels, setUserLevels] = useState([]); // Add this new state for user levels
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalState, setModalState] = useState({ isOpen: false, type: '', user: null });
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        'users_fname': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        'users_lname': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        'departments_name': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'users_school_id': { value: null, matchMode: FilterMatchMode.CONTAINS },
    });

    // Add this new state for role filter
    const [selectedRole, setSelectedRole] = useState('');

    // Add this function to filter by role
    const handleRoleFilter = (role) => {
        setSelectedRole(role);
    };

    const navigate = useNavigate();
    const user_id = localStorage.getItem('user_id');

  

    useEffect(() => {
        if (user_level_id !== '1' && user_level_id !== '2' && user_level_id !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_level_id, navigate]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.post("http://localhost/coc/gsd/user.php", 
                { operation: "fetchAllUser" },  // Changed to use JSON
                { 
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (response.data.status === 'success') {
                // Transform the data to ensure all user types are included
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

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const response = await axios({
                method: 'post',
                url: 'http://localhost/coc/gsd/fetchMaster.php',
                data: new URLSearchParams({
                    operation: 'fetchDepartments'
                }).toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
    
            console.log('Department response:', response.data); // Debug log
    
            if (response.data && Array.isArray(response.data.data)) {
                setDepartments(response.data.data);
            } else {
                console.error('Invalid department data:', response.data);
                toast.error("Invalid department data format");
            }
        } catch (error) {
            console.error('Department fetch error:', error);
            toast.error(error.response?.data?.message || "Failed to fetch departments");
        } finally {
            setLoading(false);
        }
    };
    
    // Add this new function after other fetch functions
    const fetchUserLevels = async () => {
        try {
            const response = await axios({
                method: 'post',
                url: 'http://localhost/coc/gsd/fetchMaster.php',
                data: new URLSearchParams({
                    operation: 'fetchUserLevels'
                }).toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.data && Array.isArray(response.data.data)) {
                setUserLevels(response.data.data);
            } else {
                console.error('Invalid user level data:', response.data);
                toast.error("Invalid user level data format");
            }
        } catch (error) {
            console.error('User level fetch error:', error);
            toast.error("Failed to fetch user levels");
        }
    };

    const getUserDetails = async (userId) => {
        try {
            // Try fetching driver first
            const driverResponse = await axios.post(
                'http://localhost/coc/gsd/fetchMaster.php',
                JSON.stringify({
                    operation: 'fetchDriverById',
                    id: userId
                }),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (driverResponse.data.status === 'success' && driverResponse.data.data.length > 0) {
                const driverData = driverResponse.data.data[0];
                return {
                    users_id: driverData.driver_id,
                    users_fname: driverData.driver_full_name.split(' ')[0],
                    users_mname: driverData.driver_full_name.split(' ')[1] || '',
                    users_lname: driverData.driver_full_name.split(' ')[2] || '',
                    users_email: driverData.driver_email,
                    users_school_id: driverData.driver_school_id,
                    users_contact_number: driverData.driver_contact_number,
                    users_user_level_id: driverData.driver_user_level_id,
                    departments_name: driverData.departments_name,
                    user_level_name: driverData.user_level_name,
                    users_pic: driverData.driver_pic,
                    type: 'driver'
                };
            }

            // If no driver found, continue with existing admin, dean/secretary, and user checks
            // Try fetching admin first
            const adminResponse = await axios.post(
                'http://localhost/coc/gsd/fetchMaster.php',
                JSON.stringify({
                    operation: 'fetchAdminById',
                    id: userId
                }),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (adminResponse.data.status === 'success' && adminResponse.data.data.length > 0) {
                const adminData = adminResponse.data.data[0];
                return {
                    users_id: adminData.admin_id,
                    users_fname: adminData.admin_fname,
                    users_mname: adminData.admin_mname,
                    users_lname: adminData.admin_lname,
                    users_email: adminData.admin_email,
                    users_school_id: adminData.admin_school_id,
                    users_contact_number: adminData.admin_contact_number,
                    users_user_level_id: adminData.admin_user_level_id,
                    departments_name: adminData.departments_name,
                    user_level_name: adminData.user_level_name,
                    users_pic: adminData.admin_pic,
                    type: 'admin'
                };
            }

            // If no admin found, try fetching dean/secretary
            const deanSecResponse = await axios.post(
                'http://localhost/coc/gsd/fetchMaster.php',
                JSON.stringify({
                    operation: 'fetchDeanSecById',
                    id: userId
                }),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (deanSecResponse.data.status === 'success' && deanSecResponse.data.data.length > 0) {
                const deanData = deanSecResponse.data.data[0];
                return {
                    users_id: deanData.dept_id,
                    users_fname: deanData.dept_fname,
                    users_mname: deanData.dept_mname,
                    users_lname: deanData.dept_lname,
                    users_email: deanData.dept_email,
                    users_school_id: deanData.dept_school_id,
                    users_contact_number: deanData.dept_contact_number,
                    users_user_level_id: deanData.dept_user_level_id,
                    departments_name: deanData.departments_name,
                    user_level_name: deanData.user_level_name,
                    users_pic: deanData.dept_pic,
                    type: 'dean'
                };
            }

            // If no dean/secretary found, try fetching regular users
            const userResponse = await axios.post(
                'http://localhost/coc/gsd/fetchMaster.php',
                JSON.stringify({
                    operation: 'fetchUsersById',
                    id: userId
                }),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (userResponse.data.status === 'success' && userResponse.data.data.length > 0) {
                const userData = userResponse.data.data[0];
                return {
                    type: 'user',
                    ...userData
                };
            }

            throw new Error('User not found');
        } catch (error) {
            console.error('Error fetching user details:', error);
            toast.error("Failed to fetch user details");
            return null;
        }
    };

    // Add to useEffect
    useEffect(() => {
        fetchDepartments();
        fetchUsers();
        fetchUserLevels(); // Add this line
    }, []);

    useEffect(() => {
        fetchUsers();
    }, []); // Add this useEffect to fetch users on mount

    const handleSubmit = async (jsonData) => {
        const operation = jsonData.data.users_id ? "updateUser" : "saveUser";
        setLoading(true);
        try {
            const url = "http://localhost/coc/gsd/insert_master.php";
            
            const response = await axios.post(url, jsonData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Server Response:', response.data);

            if (response.data.status === 'success') {
                toast.success(`Faculty successfully ${operation === 'updateUser' ? 'updated' : 'added'}!`);
                fetchUsers();
                setModalState({ isOpen: false, type: '', user: null });
            } else {
                throw new Error(response.data.message || "Unknown error");
            }
        } catch (error) {
            console.error('Error details:', error);
            toast.error(`Failed to ${operation === 'updateUser' ? 'update' : 'add'} faculty: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (userId) => {
        try {
            const response = await axios.post("http://localhost/coc/gsd/delete_master.php", 
                new URLSearchParams({ 
                    operation: "deleteUser",
                    user_id: userId
                }),
                { headers: { 'Content-Type': 'application/json' } }
            );
            if (response.data.status === 'success') {
                toast.success("Faculty deleted successfully!");
                fetchUsers();
            } else {
                toast.error("Error deleting faculty: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while deleting the faculty.");
        } finally {
            setModalState({ isOpen: false, type: '', user: null });
        }
    };

    const filteredUsers = users?.filter(user =>
        (user?.users_fname + ' ' + user?.users_lname)?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];  // Add null checks and provide empty array fallback

    const imageBodyTemplate = (rowData) => {
        if (rowData.users_pic) {
            return (
                <div className="relative w-12 h-12">
                    <img 
                        src={`http://localhost/coc/gsd/${rowData.users_pic}`}
                        alt={rowData.users_name}
                        className="w-full h-full rounded-full object-cover"
                        onError={() => {
                            const initials = `${rowData.users_fname?.[0] || ''}${rowData.users_lname?.[0] || ''}`.toUpperCase();
                            const bgColor = generateAvatarColor(initials);
                            const imgElement = document.getElementById(`user-img-${rowData.users_id}`);
                            if (imgElement) {
                                imgElement.style.display = 'none';
                                const parent = imgElement.parentElement;
                                const fallbackDiv = document.createElement('div');
                                fallbackDiv.className = 'w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg';
                                fallbackDiv.style.backgroundColor = bgColor;
                                fallbackDiv.textContent = initials;
                                parent.appendChild(fallbackDiv);
                            }
                        }}
                        id={`user-img-${rowData.users_id}`}
                    />
                </div>
            );
        }
    
        const initials = `${rowData.users_fname?.[0] || ''}${rowData.users_lname?.[0] || ''}`.toUpperCase();
        const bgColor = generateAvatarColor(initials);
    
        return (
            <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: bgColor }}
            >
                {initials}
            </div>
        );
    };

    const actionsBodyTemplate = (rowData) => {
        const handleEditClick = async () => {
            console.log('Clicked row data:', rowData); // Log initial row data

            const userDetails = await getUserDetails(rowData.users_id);
            console.log('Fetched user details:', userDetails); // Log fetched user details
            
            if (userDetails) {
                setModalState({ isOpen: true, type: 'edit', user: userDetails });
            }
        };

        return (
            <div className="flex gap-2">
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleEditClick}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-full"
                >
                    <FontAwesomeIcon icon={faEdit} />
                </motion.button>
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setModalState({ isOpen: true, type: 'delete', user: rowData })}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full"
                >
                    <FontAwesomeIcon icon={faTrashAlt} />
                </motion.button>
            </div>
        );
    };

    const userLevelTemplate = (rowData) => {
        const levelConfig = {
            'Admin': { color: 'bg-purple-500', icon: 'pi pi-star' },
            'Dean': { color: 'bg-orange-500', icon: 'pi pi-briefcase' },
            'Secretary': { color: 'bg-pink-500', icon: 'pi pi-inbox' },
            'Personnel': { color: 'bg-blue-500', icon: 'pi pi-user' },
            'user': { color: 'bg-green-500', icon: 'pi pi-users' }
        };
        
        const config = levelConfig[rowData.user_level_name] || { color: 'bg-gray-500', icon: 'pi pi-user' };
        
        return (
            <Chip
                icon={`${config.icon}`}
                label={rowData.user_level_name}
                className={`${config.color} text-white`}
            />
        );
    };

    const departmentTemplate = (rowData) => {
        return (
            <Chip
                icon="pi pi-building"
                label={rowData.departments_name}
                className="bg-teal-500 text-white"
            />
        );
    };

    const header = (
        <div className="flex flex-col gap-6">
            {/* Header Title Section */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-50 rounded-full">
                        <FontAwesomeIcon icon={faUser} className="text-2xl text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 m-0">Faculty Management</h2>
                        <p className="text-gray-500 text-sm mt-1">Manage your faculty members here</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Role Filter Dropdown */}
                    <select
                        className="p-2 border rounded-lg"
                        value={selectedRole}
                        onChange={(e) => handleRoleFilter(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        <option value="Admin">Admin</option>
                        <option value="Faculty">Faculty</option>
                        <option value="Staff">Staff</option>
                    </select>
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setModalState({ isOpen: true, type: 'add', user: null })}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center gap-2 shadow-sm transition-all"
                    >
                        <FontAwesomeIcon icon={faPlus} className="text-sm" />
                        <span>Add Faculty</span>
                    </motion.button>
                </div>
            </div>

            <Divider className="my-0" />

            
        </div>
    );

    // Modify the DataTable value prop to include role filtering
    const filteredData = selectedRole 
        ? users.filter(user => user.user_level_name === selectedRole)
        : users;

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
            <Sidebar />
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-grow p-6 lg:p-8 overflow-hidden"
            >
                <Card className="shadow-md border-0">
                    <DataTable
                        value={filteredData}
                        paginator
                        rows={10}
                        dataKey="users_id"
                        filters={filters}
                        filterDisplay="row"
                        loading={loading}
                        header={header}
                        emptyMessage={
                            <div className="text-center py-8">
                                <i className="pi pi-search text-gray-300 text-4xl mb-4"></i>
                                <p className="text-gray-500">No faculty members found</p>
                            </div>
                        }
                        className="p-datatable-users"
                        responsiveLayout="scroll"
                        showGridlines
                        stripedRows
                        size="small"
                        tableStyle={{ minWidth: '50rem' }}
                        rowClassName="hover:bg-gray-50 transition-colors duration-200"
                    >
                        <Column 
                            header="Photo" 
                            body={imageBodyTemplate} 
                            style={{ width: '100px' }}
                            className="text-center"
                        />
                        <Column 
                            field="users_school_id" 
                            header="School ID" 
                            filter 
                            filterPlaceholder="Search ID"
                            sortable 
                            className="font-semibold"
                        />
                        <Column 
                            field="users_fname" 
                            header="First Name" 
                            filter 
                            filterPlaceholder="Search first name"
                            sortable 
                        />
                        <Column 
                            field="users_lname" 
                            header="Last Name" 
                            filter 
                            filterPlaceholder="Search last name"
                            sortable 
                        />
                        <Column 
                            field="departments_name" 
                            header="Department" 
                            body={departmentTemplate}
                            filter 
                            filterPlaceholder="Search department"
                            sortable 
                        />
                        <Column 
                            field="user_level_name" 
                            header="Role" 
                            body={userLevelTemplate}
                            sortable 
                            style={{ width: '150px' }}
                        />
                        <Column 
                            field="users_contact_number" 
                            header="Contact" 
                            sortable 
                            body={(rowData) => (
                                <div className="flex items-center gap-2">
                                    <i className="pi pi-phone text-green-500" />
                                    {rowData.users_contact_number}
                                </div>
                            )}
                        />
                        <Column 
                            header="Actions" 
                            body={actionsBodyTemplate} 
                            style={{ width: '150px' }}
                            className="text-center"
                        />
                    </DataTable>
                </Card>
            </motion.div>

            <FacultyModal 
                show={modalState.isOpen} 
                onHide={() => setModalState({ isOpen: false, type: '', user: null })}
                type={modalState.type}
                user={modalState.user}
                departments={departments}
                onSubmit={handleSubmit}
                onDelete={deleteUser}
                userLevels={userLevels} // Pass userLevels to FacultyModal
                getUserDetails={getUserDetails} // Add this line
                generateAvatarColor={generateAvatarColor} // Add this prop
                fetchUsers={fetchUsers} // Add this prop
            />
        </div>
    );
};

const FacultyModal = ({ 
    show, 
    onHide, 
    type, 
    user, 
    departments, 
    onSubmit, 
    onDelete, 
    userLevels,
    getUserDetails,
    generateAvatarColor,
    fetchUsers // Add this to props
}) => {
    const timeoutRef = useRef(null); // Add this line at the top with other state declarations
    const [currentUserData, setCurrentUserData] = useState(null); // Add currentUserData state
    const [formData, setFormData] = useState({
        users_id: '',
        users_firstname: '',
        users_middlename: '',
        users_lastname: '',
        users_school_id: '',
        users_contact_number: '',
        users_email: '',
        departments_name: '',
        users_password: '',
        users_role: '',
    });

    // Add imageUrl state
    const [imageUrl, setImageUrl] = useState('');

    // Add validation state
    const [errors, setErrors] = useState({});
    const [touchedFields, setTouchedFields] = useState({});

    // Password validation regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    // Modified validation rules
    const validateField = (name, value) => {
        // Skip email and school ID validation in edit mode
        if (type === 'edit' && (name === 'users_email' || name === 'users_school_id')) {
            return '';
        }

        switch (name) {
            case 'users_firstname':
            case 'users_middlename':
            case 'users_lastname':
                if (!value.trim()) {
                    return 'This field is required';
                }
                if (/\d/.test(value)) {
                    return 'Name cannot contain numbers';
                }
                if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
                    return 'Name can only contain letters and spaces';
                }
                return '';
            case 'users_email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Invalid email address';
            case 'users_school_id':
                if (!value.trim()) {
                    return 'School ID is required';
                }
                if (!/^[0-9-]+$/.test(value)) {
                    return 'School ID can only contain numbers and minus sign (-)';
                }
                return '';
            case 'users_contact_number':
                return /^\d{11}$/.test(value) ? '' : 'Contact number must be 11 digits';
            case 'users_password':
                if (type === 'add' || (type === 'edit' && value)) {
                    if (!passwordRegex.test(value)) {
                        return 'Password must contain at least 8 characters, including 1 uppercase, 1 lowercase, 1 number, and 1 special character';
                    }
                }
                return '';
            case 'users_role':
                return value ? '' : 'Please select a role';
            case 'departments_name':
                return value ? '' : 'Please select a department';
            default:
                return '';
        }
    };

    // Handle field blur
    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouchedFields(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));

        // Check duplicates only when field loses focus
        if ((name === 'users_email' || name === 'users_school_id') && value) {
            checkDuplicates(name === 'users_email' ? 'email' : 'schoolId', value);
        }
    };

    // Modified handleChange to include validation
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Check for duplicates when email or school ID changes
        if (name === 'users_email') {
            checkDuplicates('email', value);
        } else if (name === 'users_school_id') {
            checkDuplicates('schoolId', value);
        }

        if (touchedFields[name]) {
            const error = validateField(name, value);
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            if (user && type === 'edit') {
                console.log('Modal user prop:', user);
                
                let userDetails;
                if (user.type === 'driver') {
                    // Fetch driver details
                    const response = await axios.post(
                        'http://localhost/coc/gsd/fetchMaster.php',
                        new URLSearchParams({
                            operation: 'fetchDriverById',
                            id: user.users_id
                        }),
                        {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        }
                    );
                    
                    if (response.data.status === 'success') {
                        userDetails = response.data.data[0];
                        // Map driver data to form fields
                        const nameParts = userDetails.driver_full_name.split(' ');
                        const formDataToSet = {
                            users_id: userDetails.driver_id,
                            users_firstname: nameParts[0] || '',
                            users_middlename: nameParts[1] || '',
                            users_lastname: nameParts[2] || '',
                            users_school_id: userDetails.driver_school_id,
                            users_contact_number: userDetails.driver_contact_number,
                            users_email: userDetails.driver_email,
                            departments_name: userDetails.departments_name,
                            users_password: '',
                            users_role: userDetails.driver_user_level_id
                        };
                        setFormData(formDataToSet);
                    }
                } else {
                    // Handle regular user data
                    userDetails = await getUserDetails(user.users_id);
                    if (userDetails) {
                        const formDataToSet = {
                            users_id: userDetails.users_id,
                            users_firstname: userDetails.users_fname,
                            users_middlename: userDetails.users_mname,
                            users_lastname: userDetails.users_lname,
                            users_school_id: userDetails.users_school_id,
                            users_contact_number: userDetails.users_contact_number,
                            users_email: userDetails.users_email,
                            departments_name: userDetails.departments_name,
                            users_password: '',
                            users_role: userDetails.users_user_level_id
                        };
                        setFormData(formDataToSet);
                    }
                }

                // Set image URL if available
                if (userDetails && userDetails.driver_pic) {
                    setImageUrl(`http://localhost/coc/gsd/${userDetails.driver_pic}`);
                }
            } else {
                // Reset form for new user
                setFormData({
                    users_id: '',
                    users_firstname: '',
                    users_middlename: '',
                    users_lastname: '',
                    users_school_id: '',
                    users_contact_number: '',
                    users_email: '',
                    departments_name: '',
                    users_password: '',
                    users_role: '',
                });
                setImageUrl('');
            }
        };

        fetchUserData();
    }, [user, type, getUserDetails]);

    // Add function to check unique email and school ID
    const checkUniqueEmailAndSchoolId = async (email, schoolId) => {
        try {
            const response = await axios.post(
                'http://localhost/coc/gsd/user.php',
                {
                    operation: 'checkUniqueEmailAndSchoolId',
                    email: email,
                    schoolId: schoolId
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error checking unique email and school ID:', error);
            throw error;
        }
    };

    // Modified handleSubmit
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Email format validation
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(formData.users_email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        // School ID validation (numbers only)
        

        // Name validation
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!nameRegex.test(formData.users_firstname) || 
            (formData.users_middlename && !nameRegex.test(formData.users_middlename)) || 
            !nameRegex.test(formData.users_lastname)) {
            toast.error('Names can only contain letters and spaces');
            return;
        }

        // Rest of the handleSubmit function remains the same
        // Check unique email and school ID
        const uniqueCheckResult = await checkUniqueEmailAndSchoolId(
            formData.users_email,
            formData.users_school_id
        );

       
        // Validate all fields
        const newErrors = {};
        Object.keys(formData).forEach(key => {
            if (key !== 'users_middlename') {
                const error = validateField(key, formData[key]);
                if (error) newErrors[key] = error;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setTouchedFields(
                Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {})
            );
            toast.error('Please fix the validation errors');
            return;
        }

        const selectedDepartment = departments.find(
            dept => dept.departments_name === formData.departments_name
        );
        
        if (!selectedDepartment) {
            console.error('Department not found:', formData.departments_name);
            return;
        }

        let jsonData;
        if (type === 'edit') {
            // Handle update
            let userType;
            switch (formData.users_role) {
                case '1':
                    userType = 'admin';
                    break;
                case '5':
                case '6':
                    userType = 'dean_sec';
                    break;
                case '13':
                    userType = 'driver';
                    break;
                default:
                    userType = 'user';
            }

            jsonData = {
                operation: 'updateUsers',
                type: userType,
                id: user.users_id,
                fname: formData.users_firstname,
                mname: formData.users_middlename || '',
                lname: formData.users_lastname,
                email: formData.users_email,
                school_id: formData.users_school_id,
                contact: formData.users_contact_number,
                user_level_id: formData.users_role,
                department_id: selectedDepartment?.departments_id,
                pic: user.users_pic || '',
                is_active: 1
            };

            if (formData.users_password) {
                jsonData.password = formData.users_password;
            }
        } else {
            // Handle insert (existing code for new user)
            let operation;
            switch (formData.users_role) {
                case '1':
                    operation = 'saveAdmin';
                    break;
                case '5':
                    operation = 'saveDean';
                    break;
                case '13':
                    operation = 'saveDriver';
                    break;
                default:
                    operation = 'saveUser';
            }

            if (formData.users_role === '13') {
                jsonData = {
                    operation: operation,
                    data: {
                        fullName: `${formData.users_firstname} ${formData.users_middlename} ${formData.users_lastname}`.trim(),
                        email: formData.users_email,
                        schoolId: formData.users_school_id,
                        contact: formData.users_contact_number,
                        userLevelId: formData.users_role,
                        password: formData.users_password,
                        departmentId: selectedDepartment.departments_id,
                        pic: ""
                    }
                };
            } else {
                jsonData = {
                    operation: operation,
                    data: {
                        fname: formData.users_firstname,
                        mname: formData.users_middlename,
                        lname: formData.users_lastname,
                        email: formData.users_email,
                        schoolId: formData.users_school_id,
                        contact: formData.users_contact_number,
                        userLevelId: formData.users_role,
                        password: formData.users_password,
                        departmentId: selectedDepartment.departments_id
                    }
                };
            }
        }

        console.log('Sending data:', jsonData);
        try {
            let response;
            if (type === 'edit') {
                response = await axios.post(
                    'http://localhost/coc/gsd/update_master.php',
                    jsonData,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
            } else {
                response = await onSubmit(jsonData);
            }

            if (response && response.data.status === 'success') {
                toast.success(response.data.message || 'Operation successful');
                onHide();
                fetchUsers(); // Now using the prop
            } else {
                throw new Error(response.data.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Failed to save user data: ' + (error.message || 'Unknown error'));
        }
    };

    // Add new state for duplicate checks
    const [duplicateFields, setDuplicateFields] = useState({
        email: false,
        schoolId: false
    });

    // Modified checkDuplicates function
    const checkDuplicates = async (field, value) => {
        // Skip validation in edit mode
        if (type === 'edit') {
            setDuplicateFields(prev => ({
                ...prev,
                [field]: false
            }));
            return;
        }

        // Don't check if the field is empty
        if (!value) {
            setDuplicateFields(prev => ({
                ...prev,
                [field]: false
            }));
            return;
        }

        // Create a timeout to wait for user to finish typing
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
            try {
                const response = await axios.post(
                    'http://localhost/coc/gsd/user.php',
                    {
                        operation: 'checkUniqueEmailAndSchoolId',
                        email: field === 'email' ? value : '',
                        schoolId: field === 'schoolId' ? value : ''
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.data.status === 'success') {
                    const isDuplicate = response.data.exists;
                    setErrors(prev => ({
                        ...prev,
                        [field === 'email' ? 'users_email' : 'users_school_id']: 
                            isDuplicate ? `This ${field} is already in use` : ''
                    }));
                    setDuplicateFields(prev => ({
                        ...prev,
                        [field]: isDuplicate
                    }));
                }
            } catch (error) {
                console.error('Error checking duplicates:', error);
            }
        }, 500);
    };

    // Add handleInputChange for better input handling
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear any existing errors while typing
        setErrors(prev => ({
            ...prev,
            [name]: ''
        }));
        
        // Reset duplicate fields while typing
        if (name === 'users_email' || name === 'users_school_id') {
            setDuplicateFields(prev => ({
                ...prev,
                [name === 'users_email' ? 'email' : 'schoolId']: false
            }));
        }
    };

    // Clean up the timeout on component unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <Modal show={show} onHide={onHide} centered size="lg" className="rounded-xl">
            <Modal.Header closeButton className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                <Modal.Title className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUser} className="text-xl" />
                    <span className="font-bold">
                        {type === 'add' ? 'Add New Faculty' : type === 'edit' ? 'Edit Faculty Details' : 'Confirm Deletion'}
                    </span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-green-50 px-4 py-4">
                {type === 'delete' ? (
                    <p>Are you sure you want to delete this faculty member?</p>
                ) : (
                    <Form onSubmit={handleSubmit} noValidate>
                        {/* Add image preview at the top of the form */}
                        {type === 'edit' && (
                            <div className="flex justify-center mb-6">
                                <div className="relative w-32 h-32">
                                    {imageUrl ? (
                                        <div className="w-full h-full">
                                            <img
                                                src={imageUrl}
                                                alt="Profile"
                                                className="w-full h-full rounded-full object-cover border-4 border-green-500"
                                                onError={() => {
                                                    const initials = `${formData.users_firstname?.[0] || ''}${formData.users_lastname?.[0] || ''}`.toUpperCase();
                                                    const bgColor = generateAvatarColor(initials);
                                                    const container = document.getElementById('profile-image-container');
                                                    if (container) {
                                                        container.innerHTML = `
                                                            <div
                                                                class="w-full h-full rounded-full border-4 border-green-500 flex items-center justify-center text-white font-bold text-3xl"
                                                                style="background-color: ${bgColor}"
                                                            >
                                                                ${initials}
                                                            </div>
                                                        `;
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="w-full h-full rounded-full border-4 border-green-500 flex items-center justify-center text-white font-bold text-3xl"
                                            style={{ 
                                                backgroundColor: generateAvatarColor(
                                                    `${formData.users_firstname?.[0] || ''}${formData.users_lastname?.[0] || ''}`
                                                )
                                            }}
                                        >
                                            {`${formData.users_firstname?.[0] || ''}${formData.users_lastname?.[0] || ''}`.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Rest of your form groups remain unchanged */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <Form.Group>
                                <Form.Label>First Name <span className="text-red-500">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    name="users_firstname"
                                    value={formData.users_firstname}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={touchedFields.users_firstname && errors.users_firstname}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.users_firstname}
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Middle Name</Form.Label>
                                <Form.Control type="text" name="users_middlename" value={formData.users_middlename} onChange={handleChange} />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Last Name <span className="text-red-500">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    name="users_lastname"
                                    value={formData.users_lastname}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={touchedFields.users_lastname && errors.users_lastname}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.users_lastname}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Group>
                                <Form.Label>School ID <span className="text-red-500">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    name="users_school_id"
                                    value={formData.users_school_id}
                                    onChange={handleInputChange}
                                    onBlur={(e) => checkDuplicates('schoolId', e.target.value)}
                                    isInvalid={!!errors.users_school_id}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.users_school_id}
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Phone Number <span className="text-red-500">*</span></Form.Label>
                                <Form.Control
                                    type="tel"
                                    name="users_contact_number"
                                    value={formData.users_contact_number}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={touchedFields.users_contact_number && errors.users_contact_number}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.users_contact_number}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <Form.Group>
                                <Form.Label>Email Address <span className="text-red-500">*</span></Form.Label>
                                <Form.Control
                                    type="email"
                                    name="users_email"
                                    value={formData.users_email}
                                    onChange={handleInputChange}
                                    onBlur={(e) => checkDuplicates('email', e.target.value)}
                                    isInvalid={!!errors.users_email}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.users_email}
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Role <span className="text-red-500">*</span></Form.Label>
                                <Form.Select
                                    name="users_role"
                                    value={formData.users_role}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={touchedFields.users_role && errors.users_role}
                                    required
                                >
                                    <option value="">Select Role</option>
                                    {userLevels.map((level) => (
                                        <option key={level.user_level_id} value={level.user_level_id}>
                                            {level.user_level_name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.users_role}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <Form.Group>
                                <Form.Label>Department <span className="text-red-500">*</span></Form.Label>
                                <Form.Select
                                    name="departments_name"
                                    value={formData.departments_name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={touchedFields.departments_name && errors.departments_name}
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {departments && departments.map((department) => (
                                        <option key={department.departments_id} value={department.departments_name}>
                                            {department.departments_name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.departments_name}
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>{type === 'edit' ? 'New Password (leave blank to keep current)' : 'Password'} {type === 'add' && <span className="text-red-500">*</span>}</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="users_password"
                                    value={formData.users_password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={touchedFields.users_password && errors.users_password}
                                    required={type === 'add'}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.users_password}
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    Password must contain at least 8 characters, including 1 uppercase, 1 lowercase, 
                                    1 number, and 1 special character.
                                </Form.Text>
                            </Form.Group>
                        </div>
                    </Form>
                )}
            </Modal.Body>
            <Modal.Footer className="bg-green-50">
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
                {type === 'delete' ? (
                    <Button variant="danger" onClick={() => onDelete(user.users_id)}>
                        Delete
                    </Button>
                ) : (
                    <Button 
                        variant="primary" 
                        onClick={handleSubmit} 
                        className="bg-green-600 hover:bg-green-700"
                        disabled={duplicateFields.email || duplicateFields.schoolId}
                    >
                        {type === 'add' ? 'Add Faculty' : 'Save Changes'}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default Faculty;
