import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const UserManagement = () => {
    const adminId = localStorage.getItem('adminId') || '';
    const [personnel, setPersonnel] = useState([]);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState({
        id: '',
        firstName: '',
        lastName: '',
        contact: '',
        username: '',
        password: '',
        positionId: '',
    });
    const [userToDelete, setUserToDelete] = useState(null);
    const navigate = useNavigate();
    const adminLevel = localStorage.getItem('adminLevel');

    useEffect(() => {
        if (adminLevel !== '100') {
            localStorage.clear();
            navigate('/');
        }
    }, [adminLevel, navigate]);

    useEffect(() => {
        fetchPersonnel();
        fetchPositions();
    }, []);

    const fetchPersonnel = async () => {
        setLoading(true);
        const url = "http://localhost/coc/gsd/user.php";

        try {
            const response = await axios.post(url, new URLSearchParams({ operation: "fetchPersonnel" }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            if (response.data.status === 'success') {
                setPersonnel(response.data.data);
            } else {
                toast.error("Error fetching personnel: " + response.data.message);
            }
        } catch {
            toast.error("An error occurred while fetching personnel.");
        } finally {
            setLoading(false);
        }
    };

    const fetchPositions = async () => {
        const url = "http://localhost/coc/gsd/user.php";

        try {
            const response = await axios.post(url, new URLSearchParams({ operation: "fetchPositions" }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            if (response.data.status === 'success') {
                setPositions(response.data.data);
            } else {
                toast.error("Error fetching positions: " + response.data.message);
            }
        } catch {
            toast.error("An error occurred while fetching positions.");
        }
    };

    const getPersonnelDetails = async (personId) => {
        const url = "http://localhost/coc/gsd/update_master1.php";

        try {
            const response = await axios.post(url, new URLSearchParams({
                operation: "getPersonnelDetails",
                json: JSON.stringify({ personId })
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            if (response.data.status === 'success') {
                const userDetails = response.data.data;
                setSelectedUser({
                    id: userDetails.jo_personel_id,
                    firstName: userDetails.jo_personel_fname,
                    lastName: userDetails.jo_personel_lname,
                    contact: userDetails.jo_personel_contact,
                    username: userDetails.username,
                    password: '', // Don't show password for edit
                    positionId: positions.find(position => position.position_name === userDetails.position_name)?.position_id || '',
                });
                setIsUpdateModalOpen(true);
            } else {
                toast.error("Error fetching personnel details: " + response.data.message);
            }
        } catch {
            toast.error("An error occurred while fetching personnel details.");
        }
    };

    const handleSubmit = async () => {
        const { firstName, lastName, contact, username, password, positionId } = selectedUser;

        if (!firstName || !lastName || !contact || !username || !positionId) {
            toast.error("All fields except password are required!");
            return;
        }

        const userData = { id: selectedUser.id, firstName, lastName, contact, username, positionId };
        if (password) userData.password = password; // Only include if provided

        const operation = selectedUser.id ? "updatePersonnel" : "savePersonnel";

        const formData = new URLSearchParams();
        formData.append("operation", operation);
        formData.append("json", JSON.stringify(userData));

        setLoading(true);
        const url = "http://localhost/coc/gsd/insert_master.php";
        try {
            const response = await axios.post(url, formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            if (response.data.status === 'success') {
                toast.success(`Personnel successfully ${selectedUser.id ? 'updated' : 'added'}!`);
                fetchPersonnel();
                resetForm();
            } else {
                toast.error("Failed to add/update personnel: " + (response.data.message || "Unknown error"));
            }
        } catch {
            toast.error("An error occurred while adding/updating personnel.");
        } finally {
            setLoading(false);
            setIsAddModalOpen(false);
            setIsUpdateModalOpen(false);
        }
    };

    const resetForm = () => {
        setSelectedUser({
            id: '',
            firstName: '',
            lastName: '',
            contact: '',
            username: '',
            password: '',
            positionId: '',
        });
    };

    const openAddModal = () => {
        resetForm();
        setIsAddModalOpen(true);
    };

    const openEditModal = (person) => {
        getPersonnelDetails(person.jo_personel_id);
    };

    const confirmDeleteUser = (personId) => {
        setUserToDelete(personId);
        setIsDeleteModalOpen(true);
    };

    const deleteUser = async (personnelId) => {
        const url = "http://localhost/coc/gsd/delete_master.php";

        try {
            const response = await axios.post(url, new URLSearchParams({ 
                operation: "deletePersonnel",
                personnel_id: personnelId
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            if (response.data.status === 'success') {
                toast.success("Personnel deleted successfully!");
                fetchPersonnel(); // Refresh the personnel list
            } else {
                toast.error("Error deleting personnel: " + response.data.message);
            }
        } catch {
            toast.error("An error occurred while deleting the personnel.");
        } finally {
            setIsDeleteModalOpen(false); // Close the delete modal
        }
    };

    const filteredPersonnel = personnel.filter(person =>
        person.jo_personel_fname && person.jo_personel_fname.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col lg:flex-row">
            <Sidebar />
            <div className="flex-grow ml-0 lg:ml-10 p-6">
                <h2 className="text-2xl font-bold">Personnel Management</h2>
                <div className="flex flex-col lg:flex-row items-center mb-4">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by Full Name..."
                        className="border border-gray-300 p-2 rounded w-full max-w-xs"
                    />
                    <Button variant="primary" onClick={openAddModal} className="ml-4">
                        <FaPlus /> Add Personnel
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="loader"></div>
                    </div>
                ) : (
                    <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                        <thead>
                            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">Full Name</th>
                                <th className="py-3 px-6 text-left">Contact</th>
                                <th className="py-3 px-6 text-left">Username</th>
                                <th className="py-3 px-6 text-left">Position</th>
                                <th className="py-3 px-6 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                            {filteredPersonnel.length > 0 ? (
                                filteredPersonnel.map((person, index) => (
                                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                                        <td className="py-3 px-6">{person.jo_personel_fname} {person.jo_personel_lname}</td>
                                        <td className="py-3 px-6">{person.jo_personel_contact}</td>
                                        <td className="py-3 px-6">{person.username}</td>
                                        <td className="py-3 px-6">{person.position_name}</td>
                                        <td className="py-3 px-6">
                                            <Button variant="warning" onClick={() => openEditModal(person)}>
                                                <FaEdit /> Edit
                                            </Button>
                                            <Button variant="danger" onClick={() => confirmDeleteUser(person.jo_personel_id)}>
                                                <FaTrash /> Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-3">No personnel found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

<Modal show={isAddModalOpen} onHide={() => setIsAddModalOpen(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add Personnel</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="mb-3">
                            <label>First Name</label>
                            <input
                                type="text"
                                value={selectedUser.firstName}
                                onChange={(e) => setSelectedUser({ ...selectedUser, firstName: e.target.value })}
                                className="form-control"
                            />
                        </div>
                        <div className="mb-3">
                            <label>Last Name</label>
                            <input
                                type="text"
                                value={selectedUser.lastName}
                                onChange={(e) => setSelectedUser({ ...selectedUser, lastName: e.target.value })}
                                className="form-control"
                            />
                        </div>
                        <div className="mb-3">
                            <label>Contact</label>
                            <input
                                type="text"
                                value={selectedUser.contact}
                                onChange={(e) => setSelectedUser({ ...selectedUser, contact: e.target.value })}
                                className="form-control"
                            />
                        </div>
                        <div className="mb-3">
                            <label>Username</label>
                            <input
                                type="text"
                                value={selectedUser.username}
                                onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
                                className="form-control"
                            />
                        </div>
                        <div className="mb-3">
                            <label>Password</label>
                            <input
                                type="password"
                                value={selectedUser.password}
                                onChange={(e) => setSelectedUser({ ...selectedUser, password: e.target.value })}
                                className="form-control"
                            />
                        </div>
                        <div className="mb-3">
                            <label>Position</label>
                            <select
                                value={selectedUser.positionId}
                                onChange={(e) => setSelectedUser({ ...selectedUser, positionId: e.target.value })}
                                className="form-control"
                            >
                                <option value="">Select Position</option>
                                {positions.map((position) => (
                                    <option key={position.position_id} value={position.position_id}>
                                        {position.position_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>Close</Button>
                        <Button variant="primary" onClick={handleSubmit}>Save Personnel</Button>
                    </Modal.Footer>
                </Modal>

                {/* Update Personnel Modal */}
                <Modal show={isUpdateModalOpen} onHide={() => setIsUpdateModalOpen(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Update Personnel</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="mb-3">
                            <label>First Name</label>
                            <input
                                type="text"
                                value={selectedUser.firstName}
                                onChange={(e) => setSelectedUser({ ...selectedUser, firstName: e.target.value })}
                                className="form-control"
                            />
                        </div>
                        <div className="mb-3">
                            <label>Last Name</label>
                            <input
                                type="text"
                                value={selectedUser.lastName}
                                onChange={(e) => setSelectedUser({ ...selectedUser, lastName: e.target.value })}
                                className="form-control"
                            />
                        </div>
                        <div className="mb-3">
                            <label>Contact</label>
                            <input
                                type="text"
                                value={selectedUser.contact}
                                onChange={(e) => setSelectedUser({ ...selectedUser, contact: e.target.value })}
                                className="form-control"
                            />
                        </div>
                        <div className="mb-3">
                            <label>Username</label>
                            <input
                                type="text"
                                value={selectedUser.username}
                                onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
                                className="form-control"
                            />
                        </div>
                        <div className="mb-3">
                            <label>Password</label>
                            <input
                                type="password"
                                value={selectedUser.password}
                                onChange={(e) => setSelectedUser({ ...selectedUser, password: e.target.value })}
                                className="form-control"
                            />
                        </div>
                        <div className="mb-3">
                            <label>Position</label>
                            <select
                                value={selectedUser.positionId}
                                onChange={(e) => setSelectedUser({ ...selectedUser, positionId: e.target.value })}
                                className="form-control"
                            >
                                {positions.map((position) => (
                                    <option key={position.position_id} value={position.position_id}>
                                        {position.position_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setIsUpdateModalOpen(false)}>Close</Button>
                        <Button variant="primary" onClick={handleSubmit}>Update Personnel</Button>
                    </Modal.Footer>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal show={isDeleteModalOpen} onHide={() => setIsDeleteModalOpen(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Confirm Deletion</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        Are you sure you want to delete this personnel?
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={() => deleteUser(userToDelete)}>Delete</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default UserManagement;
