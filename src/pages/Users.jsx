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

const Faculty = () => {
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalState, setModalState] = useState({ isOpen: false, type: '', user: null });
    const navigate = useNavigate();
    const user_id = localStorage.getItem('user_id');

    useEffect(() => {
        if (user_id !== '100' && user_id !== '1' && user_id !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_id, navigate]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.post("http://localhost/coc/gsd/user.php", 
                new URLSearchParams({ operation: "fetchUsers" }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            if (response.data.status === 'success') {
                setUsers(response.data.data);
            } else {
                toast.error("Error fetching users: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while fetching users.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await axios.post("http://localhost/coc/gsd/user.php", 
                new URLSearchParams({ operation: "fetchDepartments" }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            if (response.data.status === 'success') {
                setDepartments(response.data.data);
            } else {
                toast.error("Error fetching departments: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while fetching departments.");
        }
    };

    useEffect(() => {
        fetchDepartments();
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
        user?.users_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];  // Add null checks and provide empty array fallback

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-green-100 to-white">
            <Sidebar />
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-grow p-6 lg:p-10"
            >
                <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-lg">Users Management</h2>
                <div className="bg-white bg-opacity-90 rounded-lg shadow-xl p-6 mb-6 backdrop-filter backdrop-blur-lg">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="relative w-full md:w-64 mb-4 md:mb-0"
                        >
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by Name..."
                                className="w-full pl-10 pr-4 py-2 rounded-full border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                            />
                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
                        </motion.div>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setModalState({ isOpen: true, type: 'add', user: null })}
                            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center shadow-md"
                        >
                            <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Faculty
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
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="bg-green-600 text-white">
                                        <th className="py-3 px-4 text-left rounded-tl-lg">Name</th>
                                        <th className="py-3 px-4 text-left">School ID</th>
                                        <th className="py-3 px-4 text-left">Contact Number</th>
                                        <th className="py-3 px-4 text-left">Department</th>
                                        <th className="py-3 px-4 text-center rounded-tr-lg">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-600 text-sm font-light">
                                    <AnimatePresence>
                                        {filteredUsers.map((user, index) => (
                                            <motion.tr 
                                                key={user.users_id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="border-b border-green-200 hover:bg-green-50 transition-colors duration-200"
                                            >
                                                <td className="py-3 px-4">{user.users_name}</td>
                                                <td className="py-3 px-4">{user.users_school_id}</td>
                                                <td className="py-3 px-4">{user.users_contact_number}</td>
                                                <td className="py-3 px-4">{user.departments_name}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => setModalState({ isOpen: true, type: 'edit', user: user })}
                                                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-full transition duration-300 ease-in-out mr-2"
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </motion.button>
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => setModalState({ isOpen: true, type: 'delete', user: user })}
                                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full transition duration-300 ease-in-out"
                                                    >
                                                        <FontAwesomeIcon icon={faTrashAlt} />
                                                    </motion.button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </motion.div>

            <FacultyModal 
                show={modalState.isOpen} 
                onHide={() => setModalState({ isOpen: false, type: '', user: null })}
                type={modalState.type}
                user={modalState.user}
                departments={departments}
                onSubmit={handleSubmit}
                onDelete={deleteUser}
            />
        </div>
    );
};

const FacultyModal = ({ show, onHide, type, user, departments, onSubmit, onDelete }) => {
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
        users_image: null,
        // Removed users_username
    });
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            setFormData({
                users_id: user.users_id || '',
                users_firstname: user.users_firstname || '',
                users_middlename: user.users_middlename || '',
                users_lastname: user.users_lastname || '',
                users_school_id: user.users_school_id || '',
                users_contact_number: user.users_contact_number || '',
                users_email: user.users_email || '',
                departments_name: user.departments_name || '',
                users_password: '',
                users_role: user.users_role || '',
                users_image: user.users_image || null,
                // Removed users_username
            });
            setImagePreview(user.users_image || null);
        } else {
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
                users_image: null,
            });
            setImagePreview(null);
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setFormData({ ...formData, users_image: file });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Map role to user_level_id
        let userLevelId;
        switch (formData.users_role) {
            case 'admin':
                userLevelId = '1';
                break;
            case 'faculty':
                userLevelId = '2';
                break;
            case 'staff':
                userLevelId = '3';
                break;
            default:
                userLevelId = '2'; // default to faculty
        }
        
        // Get department ID from departments array
        const selectedDepartment = departments.find(
            dept => dept.departments_name === formData.departments_name
        );
        
        if (!selectedDepartment) {
            console.error('Department not found:', formData.departments_name);
            return;
        }

        // Prepare the JSON data
        const jsonData = {
            operation: "saveUser",
            data: {
                fname: formData.users_firstname,
                mname: formData.users_middlename,
                lname: formData.users_lastname,
                schoolId: formData.users_school_id,
                contact: formData.users_contact_number,
                userLevelId: userLevelId,
                password: formData.users_password,
                departmentId: selectedDepartment.departments_id,
                pic: imagePreview // This will be the base64 string if an image was selected
            }
        };

        // Debug log
        console.log('Sending data:', jsonData);

        onSubmit(jsonData);
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="bg-green-600 text-white">
                <Modal.Title><FontAwesomeIcon icon={faUser} className="mr-2" /> {type === 'add' ? 'Add Faculty' : type === 'edit' ? 'Edit Faculty' : 'Confirm Deletion'}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-green-50 px-4 py-4">
                {type === 'delete' ? (
                    <p>Are you sure you want to delete this faculty member?</p>
                ) : (
                    <Form onSubmit={handleSubmit}>
                        <div className="flex flex-col items-center mb-4">
                            <div className="relative w-32 h-32 mb-2">
                                <div 
                                    className="w-full h-full rounded-full border-4 border-green-500 overflow-hidden bg-gray-200 flex items-center justify-center cursor-pointer"
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    {imagePreview ? (
                                        <img 
                                            src={imagePreview} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <FontAwesomeIcon icon={faUser} className="text-4xl text-gray-400" />
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </div>
                            <button
                                type="button"
                                className="text-green-600 hover:text-green-700 text-sm font-semibold"
                                onClick={() => fileInputRef.current.click()}
                            >
                                {imagePreview ? 'Change Photo' : 'Upload Photo'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <Form.Group>
                                <Form.Label>First Name</Form.Label>
                                <Form.Control type="text" name="users_firstname" value={formData.users_firstname} onChange={handleChange} required />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Middle Name</Form.Label>
                                <Form.Control type="text" name="users_middlename" value={formData.users_middlename} onChange={handleChange} />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Last Name</Form.Label>
                                <Form.Control type="text" name="users_lastname" value={formData.users_lastname} onChange={handleChange} required />
                            </Form.Group>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Group>
                                <Form.Label>School ID</Form.Label>
                                <Form.Control type="text" name="users_school_id" value={formData.users_school_id} onChange={handleChange} required />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Phone Number</Form.Label>
                                <Form.Control type="tel" name="users_contact_number" value={formData.users_contact_number} onChange={handleChange} required />
                            </Form.Group>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <Form.Group>
                                <Form.Label>Email Address</Form.Label>
                                <Form.Control type="email" name="users_email" value={formData.users_email} onChange={handleChange} required />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Role</Form.Label>
                                <Form.Select name="users_role" value={formData.users_role} onChange={handleChange} required>
                                    <option value="">Select Role</option>
                                    <option value="admin">Admin</option>
                                    <option value="faculty">Faculty</option>
                                    <option value="staff">Staff</option>
                                </Form.Select>
                            </Form.Group>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <Form.Group>
                                <Form.Label>Department</Form.Label>
                                <Form.Select 
                                    name="departments_name" 
                                    value={formData.departments_name} 
                                    onChange={handleChange} 
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {departments && departments.map((department) => (
                                        <option 
                                            key={department.departments_id} 
                                            value={department.departments_name}
                                        >
                                            {department.departments_name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {/* Only password field remains */}
                            <Form.Group>
                                <Form.Label>{type === 'edit' ? 'New Password (leave blank to keep current)' : 'Password'}</Form.Label>
                                <Form.Control type="password" name="users_password" value={formData.users_password} onChange={handleChange} required={type === 'add'} />
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
                    <Button variant="primary" onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                        {type === 'add' ? 'Add Faculty' : 'Save Changes'}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default Faculty;
