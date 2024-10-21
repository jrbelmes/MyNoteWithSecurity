import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { FiUserPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const Personnel = () => {
    const [personnel, setPersonnel] = useState([]);
    const [positions, setPositions] = useState([]);
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

    return (
        <div className="flex h-screen bg-[#F4CE14] bg-opacity-10">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F4CE14] bg-opacity-10">
                    <div className="container mx-auto px-6 py-8">
                        <h3 className="text-gray-700 text-3xl font-medium">Personnel Management</h3>
                        
                        <div className="mt-8">
                            <div className="flex flex-col lg:flex-row items-center justify-between mb-4">
                                <div className="relative w-full max-w-xs mb-4 lg:mb-0">
                                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by Full Name..."
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full"
                                    />
                                </div>
                                <Button 
                                    variant="primary" 
                                    onClick={() => setModalState({ isOpen: true, type: 'add', user: null })}
                                    className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                                >
                                    <FiUserPlus className="mr-2" /> Add Personnel
                                </Button>
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                {loading ? (
                                    <div className="flex justify-center py-10">
                                        <div className="loader"></div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredPersonnel.map((person, index) => (
                                                    <tr key={index}>
                                                        <td className="px-6 py-4 whitespace-nowrap">{person.jo_personel_fname} {person.jo_personel_lname}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">{person.jo_personel_contact}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">{person.username}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">{person.position_name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <button onClick={() => setModalState({ isOpen: true, type: 'edit', user: person })} className="text-indigo-600 hover:text-indigo-900 mr-2">
                                                                <FiEdit />
                                                            </button>
                                                            <button onClick={() => setModalState({ isOpen: true, type: 'delete', user: person })} className="text-red-600 hover:text-red-900">
                                                                <FiTrash2 />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

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
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (type === 'delete') {
        return (
            <Modal show={show} onHide={onHide}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete this personnel?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>Cancel</Button>
                    <Button variant="danger" onClick={() => onDelete(user.jo_personel_id)}>Delete</Button>
                </Modal.Footer>
            </Modal>
        );
    }

    return (
        <Modal show={show} onHide={onHide}>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>{type === 'add' ? 'Add Personnel' : 'Update Personnel'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>First Name</Form.Label>
                        <Form.Control type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Last Name</Form.Label>
                        <Form.Control type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Contact</Form.Label>
                        <Form.Control type="text" name="contact" value={formData.contact} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Username</Form.Label>
                        <Form.Control type="text" name="username" value={formData.username} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" name="password" value={formData.password} onChange={handleChange} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Position</Form.Label>
                        <Form.Select name="positionId" value={formData.positionId} onChange={handleChange} required>
                            <option value="">Select Position</option>
                            {positions.map((position) => (
                                <option key={position.position_id} value={position.position_id}>
                                    {position.position_name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>Close</Button>
                    <Button variant="primary" type="submit">
                        {type === 'add' ? 'Add Personnel' : 'Update Personnel'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default Personnel;
