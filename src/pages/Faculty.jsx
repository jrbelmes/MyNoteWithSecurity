import React, { useState, useEffect } from 'react';
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
    const adminLevel = localStorage.getItem('adminLevel');

    useEffect(() => {
        if (adminLevel !== '100') {
            localStorage.clear();
            navigate('/');
        } else {
            fetchUsers();
            fetchDepartments();
        }
    }, [adminLevel, navigate]);

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

    const handleSubmit = async (userData) => {
        const operation = userData.users_id ? "updateUser" : "saveUser";
        setLoading(true);
        try {
            const url = operation === 'saveUser' ? "http://localhost/coc/gsd/insert_master.php" : "http://localhost/coc/gsd/update_master1.php";
            const response = await axios.post(url, 
                new URLSearchParams({ 
                    operation: operation,
                    json: JSON.stringify(userData)
                }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            if (response.data.status === 'success') {
                toast.success(`Faculty successfully ${userData.users_id ? 'updated' : 'added'}!`);
                fetchUsers();
                setModalState({ isOpen: false, type: '', user: null });
            } else {
                throw new Error(response.data.message || "Unknown error");
            }
        } catch (error) {
            toast.error(`Failed to ${userData.users_id ? 'update' : 'add'} faculty: ${error.message}`);
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
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
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

    const filteredUsers = users.filter(user =>
        user.users_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-white to-green-500">
            <Sidebar />
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-grow p-6 lg:p-10"
            >
                <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-lg">Faculty Management</h2>
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
        users_name: '',
        users_school_id: '',
        users_contact_number: '',
        departments_name: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                users_id: user.users_id || '',
                users_name: user.users_name || '',
                users_school_id: user.users_school_id || '',
                users_contact_number: user.users_contact_number || '',
                departments_name: user.departments_name || '',
            });
        } else {
            setFormData({
                users_id: '',
                users_name: '',
                users_school_id: '',
                users_contact_number: '',
                departments_name: '',
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="bg-green-600 text-white">
                <Modal.Title><FontAwesomeIcon icon={faUser} className="mr-2" /> {type === 'add' ? 'Add Faculty' : type === 'edit' ? 'Edit Faculty' : 'Confirm Deletion'}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-green-50">
                {type === 'delete' ? (
                    <p>Are you sure you want to delete this faculty member?</p>
                ) : (
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control type="text" name="users_name" value={formData.users_name} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>School ID</Form.Label>
                            <Form.Control type="text" name="users_school_id" value={formData.users_school_id} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Contact Number</Form.Label>
                            <Form.Control type="text" name="users_contact_number" value={formData.users_contact_number} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Department</Form.Label>
                            <Form.Select name="departments_name" value={formData.departments_name} onChange={handleChange} required>
                                <option value="">Select Department</option>
                                {departments.map((department) => (
                                    <option key={department.department_id} value={department.department_name}>
                                        {department.department_name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
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
