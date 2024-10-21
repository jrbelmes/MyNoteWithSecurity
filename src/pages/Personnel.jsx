import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faSearch, faPlus, faUser, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion, AnimatePresence } from 'framer-motion';

const Personnel = () => {
    const [personnel, setPersonnel] = useState([]);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalState, setModalState] = useState({ isOpen: false, type: '', user: null });
    const navigate = useNavigate();
    const adminLevel = localStorage.getItem('adminLevel');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    useEffect(() => {
        if (adminLevel !== '100') {
            localStorage.clear();
            navigate('/');
        } else {
            fetchPersonnel();
            fetchPositions();
        }
    }, [adminLevel, navigate]);

    const fetchPersonnel = async () => {
        setLoading(true);
        try {
            const response = await axios.post("http://localhost/coc/gsd/user.php", 
                new URLSearchParams({ operation: "fetchPersonnel" }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            if (response.data.status === 'success') {
                setPersonnel(response.data.data);
            } else {
                toast.error("Error fetching personnel: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while fetching personnel.");
        } finally {
            setLoading(false);
        }
    };

    const fetchPositions = async () => {
        try {
            const response = await axios.post("http://localhost/coc/gsd/user.php", 
                new URLSearchParams({ operation: "fetchPositions" }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            if (response.data.status === 'success') {
                setPositions(response.data.data);
            } else {
                toast.error("Error fetching positions: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while fetching positions.");
        }
    };

    const handleSubmit = async (userData) => {
        const operation = userData.id ? "updatePersonnel" : "savePersonnel";
        setLoading(true);
        try {
            const response = await axios.post("http://localhost/coc/gsd/insert_master.php", 
                new URLSearchParams({ 
                    operation: operation,
                    json: JSON.stringify(userData)
                }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            if (response.data.status === 'success') {
                toast.success(`Personnel successfully ${userData.id ? 'updated' : 'added'}!`);
                fetchPersonnel();
                setModalState({ isOpen: false, type: '', user: null });
            } else {
                throw new Error(response.data.message || "Unknown error");
            }
        } catch (error) {
            toast.error(`Failed to ${userData.id ? 'update' : 'add'} personnel: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (personnelId) => {
        try {
            const response = await axios.post("http://localhost/coc/gsd/delete_master.php", 
                new URLSearchParams({ 
                    operation: "deletePersonnel",
                    personnel_id: personnelId
                }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            if (response.data.status === 'success') {
                toast.success("Personnel deleted successfully!");
                fetchPersonnel();
            } else {
                toast.error("Error deleting personnel: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while deleting the personnel.");
        } finally {
            setModalState({ isOpen: false, type: '', user: null });
        }
    };

    const filteredPersonnel = personnel.filter(person =>
        (person.jo_personel_fname && person.jo_personel_fname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (person.jo_personel_lname && person.jo_personel_lname.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const sortedPersonnel = React.useMemo(() => {
        let sortableItems = [...filteredPersonnel];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredPersonnel, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-white to-green-500">
            <Sidebar />
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-grow p-6 lg:p-10"
            >
                <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-lg">Personnel Management</h2>
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
                                placeholder="Search by Full Name..."
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
                            <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Personnel
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
                                        <th className="py-3 px-4 text-left rounded-tl-lg">Full Name</th>
                                        <th className="py-3 px-4 text-left">Contact</th>
                                        <th className="py-3 px-4 text-left">Username</th>
                                        <th className="py-3 px-4 text-left">Position</th>
                                        <th className="py-3 px-4 text-center rounded-tr-lg">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-600 text-sm font-light">
                                    <AnimatePresence>
                                        {sortedPersonnel.map((person, index) => (
                                            <motion.tr 
                                                key={index}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="border-b border-green-200 hover:bg-green-50 transition-colors duration-200"
                                            >
                                                <td className="py-3 px-4">{person.jo_personel_fname} {person.jo_personel_lname}</td>
                                                <td className="py-3 px-4">{person.jo_personel_contact}</td>
                                                <td className="py-3 px-4">{person.username}</td>
                                                <td className="py-3 px-4">{person.position_name}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => setModalState({ isOpen: true, type: 'edit', user: person })}
                                                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-full transition duration-300 ease-in-out mr-2"
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </motion.button>
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => setModalState({ isOpen: true, type: 'delete', user: person })}
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

            <PersonnelModal 
                show={modalState.isOpen} 
                onHide={() => setModalState({ isOpen: false, type: '', user: null })}
                type={modalState.type}
                user={modalState.user}
                positions={positions}
                onSubmit={handleSubmit}
                onDelete={deleteUser}
            />
        </div>
    );
};

const PersonnelModal = ({ show, onHide, type, user, positions, onSubmit, onDelete }) => {
    const [formData, setFormData] = useState({
        id: '',
        firstName: '',
        lastName: '',
        contact: '',
        username: '',
        password: '',
        positionId: '',
    });

    const [passwordCriteria, setPasswordCriteria] = useState({
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
        hasMinLength: false,
    });

    useEffect(() => {
        if (user) {
            setFormData({
                id: user.jo_personel_id || '',
                firstName: user.jo_personel_fname || '',
                lastName: user.jo_personel_lname || '',
                contact: user.jo_personel_contact || '',
                username: user.username || '',
                password: '',
                positionId: positions.find(p => p.position_name === user.position_name)?.position_id || '',
            });
        } else {
            setFormData({
                id: '',
                firstName: '',
                lastName: '',
                contact: '',
                username: '',
                password: '',
                positionId: '',
            });
        }
    }, [user, positions]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'password') {
            setPasswordCriteria({
                hasUpperCase: /[A-Z]/.test(value),
                hasLowerCase: /[a-z]/.test(value),
                hasNumber: /[0-9]/.test(value),
                hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
                hasMinLength: value.length >= 8,
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    const validateForm = () => {
        if (type !== 'delete' && formData.password) {
            const isPasswordValid = Object.values(passwordCriteria).every(Boolean);
            if (!isPasswordValid) {
                toast.error("Password does not meet all criteria.");
                return false;
            }
        }
        return true;
    };

    const renderPasswordCriteria = () => (
        <div className="mt-2">
            <p className="text-sm font-semibold mb-1">Password must contain:</p>
            {Object.entries(passwordCriteria).map(([key, met]) => (
                <div key={key} className="flex items-center text-sm">
                    <FontAwesomeIcon 
                        icon={met ? faCheck : faTimes} 
                        className={met ? "text-green-500 mr-2" : "text-red-500 mr-2"} 
                    />
                    {key === 'hasUpperCase' && 'Uppercase letter'}
                    {key === 'hasLowerCase' && 'Lowercase letter'}
                    {key === 'hasNumber' && 'Number'}
                    {key === 'hasSpecialChar' && 'Special character'}
                    {key === 'hasMinLength' && 'At least 8 characters'}
                </div>
            ))}
        </div>
    );

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="bg-green-600 text-white">
                <Modal.Title><FontAwesomeIcon icon={faUser} className="mr-2" /> {type === 'add' ? 'Add Personnel' : type === 'edit' ? 'Edit Personnel' : 'Confirm Deletion'}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-green-50">
                {type === 'delete' ? (
                    <p>Are you sure you want to delete this personnel?</p>
                ) : (
                    <Form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-4">
                            <div>
                                <Form.Label className="font-semibold">First Name</Form.Label>
                                <Form.Control type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div>
                                <Form.Label className="font-semibold">Last Name</Form.Label>
                                <Form.Control type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div>
                                <Form.Label className="font-semibold">Contact</Form.Label>
                                <Form.Control type="text" name="contact" value={formData.contact} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div>
                                <Form.Label className="font-semibold">Username</Form.Label>
                                <Form.Control type="text" name="username" value={formData.username} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div>
                                <Form.Label className="font-semibold">Password</Form.Label>
                                <Form.Control 
                                    type="password" 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" 
                                />
                                {renderPasswordCriteria()}
                            </div>
                            <div>
                                <Form.Label className="font-semibold">Position</Form.Label>
                                <Form.Select name="positionId" value={formData.positionId} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                                    <option value="">Select Position</option>
                                    {positions.map((position) => (
                                        <option key={position.position_id} value={position.position_id}>
                                            {position.position_name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>
                        </div>
                    </Form>
                )}
            </Modal.Body>
            <Modal.Footer className="bg-green-50">
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
                {type === 'delete' ? (
                    <Button variant="danger" onClick={() => onDelete(user.jo_personel_id)}>
                        Delete
                    </Button>
                ) : (
                    <Button variant="primary" onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                        {type === 'add' ? 'Add Personnel' : 'Save Changes'}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default Personnel;
