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
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [newUser, setNewUser] = useState({
        name: '',
        schoolId: '',
        contact: '',
        username: '',
        password: '',
        departmentId: '',
    });
    const navigate = useNavigate();
    const adminLevel = localStorage.getItem('adminLevel');

    useEffect(() => {
        if (adminLevel !== '100') {
            localStorage.clear();
            navigate('/');
        }
    }, [adminLevel, navigate]);

    useEffect(() => {
        fetchUsers();
        fetchDepartments();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const url = "http://localhost/coc/gsd/user.php";

        try {
            const response = await axios.post(url, new URLSearchParams({ operation: "fetchUsers" }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
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
        const url = "http://localhost/coc/gsd/user.php";

        try {
            const response = await axios.post(url, new URLSearchParams({ operation: "fetchDepartments" }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            if (response.data.status === 'success') {
                setDepartments(response.data.data);
            } else {
                toast.error("Error fetching departments: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while fetching departments.");
        }
    };

    const fetchUserDetails = async (userId) => {
        const url = "http://localhost/coc/gsd/update_master1.php";

        try {
            const response = await axios.post(url, new URLSearchParams({ 
                operation: "getUserDetails", 
                json: JSON.stringify({ userId }) 
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            if (response.data.status === 'success') {
                const userDetails = response.data.data;
                setNewUser({
                    name: userDetails.users_name,
                    schoolId: userDetails.users_school_id,
                    contact: userDetails.users_contact_number,
                    username: userDetails.users_username,
                    password: userDetails.users_password,
                    departmentId: departments.find(department => department.departments_name === userDetails.departments_name)?.departments_id || '',
                });
                setSelectedUserId(userId);
                setIsUpdateModalOpen(true);
            } else {
                toast.error("Error fetching user details: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while fetching user details.");
        }
    };

    const deleteUser = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            const url = "http://localhost/coc/gsd/delete_master.php";

            try {
                const response = await axios.post(url, new URLSearchParams({ 
                    operation: "deleteUser", 
                    user_id: userId 
                }), {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                });
                if (response.data.status === 'success') {
                    toast.success("User deleted successfully!");
                    fetchUsers(); // Refresh the user list
                } else {
                    toast.error("Error deleting user: " + response.data.message);
                }
            } catch (error) {
                toast.error("An error occurred while deleting the user.");
            }
        }
    };

    const handleUserSubmit = async (operation) => {
        const { name, schoolId, contact, username, password, departmentId } = newUser;

        if (!name || !schoolId || !contact || !username || !password || !departmentId) {
            toast.error("All fields are required!");
            return;
        }

        const userData = { name, schoolId, contact, username, password, departmentId };
        const formData = new FormData();
        formData.append("operation", operation);
        formData.append("json", JSON.stringify({ ...userData, userId: selectedUserId }));

        setLoading(true);
        try {
            const url = operation === 'saveUser' ? "http://localhost/coc/gsd/insert_master.php" : "http://localhost/coc/gsd/update_master1.php";
            const response = await axios.post(url, formData);
            if (response.data.status === 'success') {
                toast.success(`User successfully ${operation === 'saveUser' ? 'added' : 'updated'}!`);
                fetchUsers();
                resetForm();
            } else {
                toast.error(`Failed to ${operation === 'saveUser' ? 'add' : 'update'} user: ` + (response.data.message || "Unknown error"));
            }
        } catch (error) {
            toast.error(`An error occurred while ${operation === 'saveUser' ? 'adding' : 'updating'} user.`);
        } finally {
            setLoading(false);
            setIsAddModalOpen(false);
            setIsUpdateModalOpen(false);
        }
    };

    const handleAddUserSubmit = () => handleUserSubmit('saveUser');
    const handleUpdateUserSubmit = () => handleUserSubmit('updateUser');

    const resetForm = () => {
        setNewUser({
            name: '',
            schoolId: '',
            contact: '',
            username: '',
            password: '',
            departmentId: '',
        });
        setSelectedUserId(null);
    };

    const filteredUsers = users.filter(user =>
        user.users_name && user.users_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col lg:flex-row">
            <Sidebar />
            <div className="flex-grow ml-0 lg:ml-10 p-6">
                <h2 className="text-2xl font-bold">User Management</h2>
                <div className="flex justify-between mb-4">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by Name..."
                        className="border border-gray-300 p-2 rounded w-full max-w-xs"
                    />
                    <Button variant="primary" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
                        <FaPlus /> Add User
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
                                <th className="py-3 px-6 text-left">Name</th>
                                <th className="py-3 px-6 text-left">School ID</th>
                                <th className="py-3 px-6 text-left">Contact</th>
                                <th className="py-3 px-6 text-left">Department</th>
                                <th className="py-3 px-6 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.users_id} className="border-b border-gray-200 hover:bg-gray-100">
                                        <td className="py-3 px-6">{user.users_name}</td>
                                        <td className="py-3 px-6">{user.users_school_id}</td>
                                        <td className="py-3 px-6">{user.users_contact_number}</td>
                                        <td className="py-3 px-6">{user.departments_name}</td> {/* Updated this line */}
                                        <td className="py-3 px-6">
                                            <button className="text-blue-500" onClick={() => fetchUserDetails(user.users_id)}>
                                                <FaEdit />
                                            </button>
                                            <button className="text-red-500 ml-2" onClick={() => deleteUser(user.users_id)}>
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>

                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-3 px-6 text-center">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                {/* Add User Modal */}
                <Modal show={isAddModalOpen} onHide={() => setIsAddModalOpen(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add User</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {Object.keys(newUser).map((key) => (
                            key !== 'departmentId' && (
                                <div className="mb-3" key={key}>
                                    <label htmlFor={key} className="form-label">{key.replace(/_/g, ' ').toUpperCase()}</label>
                                    <input
                                        type={key === 'password' ? 'password' : 'text'}
                                        id={key}
                                        className="form-control"
                                        value={newUser[key]}
                                        onChange={(e) => setNewUser({ ...newUser, [key]: e.target.value })}
                                    />
                                </div>
                            )
                        ))}
                        <div className="mb-3">
                            <label htmlFor="departmentId" className="form-label">Department</label>
                            <select
                                id="departmentId"
                                className="form-control"
                                value={newUser.departmentId}
                                onChange={(e) => setNewUser({ ...newUser, departmentId: e.target.value })}
                            >
                                <option value="">Select Department</option>
                                {departments.map((department) => (
                                    <option key={department.departments_id} value={department.departments_id}>
                                        {department.departments_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleAddUserSubmit}>
                            Submit
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Update User Modal */}
                <Modal show={isUpdateModalOpen} onHide={() => setIsUpdateModalOpen(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Update User</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {Object.keys(newUser).map((key) => (
                            key !== 'departmentId' && (
                                <div className="mb-3" key={key}>
                                    <label htmlFor={key} className="form-label">{key.replace(/_/g, ' ').toUpperCase()}</label>
                                    <input
                                        type={key === 'password' ? 'password' : 'text'}
                                        id={key}
                                        className="form-control"
                                        value={newUser[key]}
                                        onChange={(e) => setNewUser({ ...newUser, [key]: e.target.value })}
                                    />
                                </div>
                            )
                        ))}
                        <div className="mb-3">
                            <label htmlFor="departmentId" className="form-label">Department</label>
                            <select
                                id="departmentId"
                                className="form-control"
                                value={newUser.departmentId}
                                onChange={(e) => setNewUser({ ...newUser, departmentId: e.target.value })}
                            >
                                {departments.map((department) => (
                                    <option key={department.departments_id} value={department.departments_id}>
                                        {department.departments_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setIsUpdateModalOpen(false)}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleUpdateUserSubmit}>
                            Submit
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default UserManagement;
