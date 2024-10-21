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
        <div className="flex h-screen  bg-[#F4CE14] bg-opacity-10">
            <Sidebar />
<<<<<<< HEAD
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F4CE14] bg-opacity-10">
                    <div className="container mx-auto px-6 py-8">
                        <h3 className="text-gray-700 text-3xl font-medium">User Management</h3>
                        <div className="mt-8">
                            <div className="flex flex-col mt-6">
                                <div className="-my-2 py-2 overflow-x-auto sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                                    <div className="align-middle inline-block min-w-full shadow overflow-hidden sm:rounded-lg border-b border-gray-200">
                                        <div className="flex justify-between items-center bg-white px-4 py-3">
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Search by Name..."
                                                className="form-input w-full max-w-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <button
                                                onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                            >
                                                <FaPlus className="inline-block mr-2" /> Add User
                                            </button>
                                        </div>
                                        <table className="min-w-full">
                                            <thead>
                                                <tr>
                                                    <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                    <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">School ID</th>
                                                    <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                                    <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                                    <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white">
                                                {filteredUsers.length > 0 ? (
                                                    filteredUsers.map((user) => (
                                                        <tr key={user.users_id}>
                                                            <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">{user.users_name}</td>
                                                            <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">{user.users_school_id}</td>
                                                            <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">{user.users_contact_number}</td>
                                                            <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">{user.departments_name}</td>
                                                            <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200 text-sm leading-5 font-medium">
                                                                <button onClick={() => fetchUserDetails(user.users_id)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                                                    <FaEdit />
                                                                </button>
                                                                <button onClick={() => deleteUser(user.users_id)} className="text-red-600 hover:text-red-900">
                                                                    <FaTrash />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-6 py-4 whitespace-no-wrap border-b border-gray-200 text-center">No users found.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Add User Modal */}
            <Modal show={isAddModalOpen} onHide={() => setIsAddModalOpen(false)} className="modal-lg">
                <Modal.Header closeButton>
                    <Modal.Title>Add User</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="grid grid-cols-2 gap-4">
=======
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
>>>>>>> 054698c93fec072ffdfe11e06169d2313e26e271
                        {Object.keys(newUser).map((key) => (
                            key !== 'departmentId' && (
                                <div className="mb-3" key={key}>
                                    <label htmlFor={key} className="block text-sm font-medium text-gray-700">{key.replace(/_/g, ' ').toUpperCase()}</label>
                                    <input
                                        type={key === 'password' ? 'password' : 'text'}
                                        id={key}
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                        value={newUser[key]}
                                        onChange={(e) => setNewUser({ ...newUser, [key]: e.target.value })}
                                    />
                                </div>
                            )
                        ))}
                        <div className="mb-3">
                            <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700">Department</label>
                            <select
                                id="departmentId"
                                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
<<<<<<< HEAD
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
            <Modal show={isUpdateModalOpen} onHide={() => setIsUpdateModalOpen(false)} className="modal-lg">
                <Modal.Header closeButton>
                    <Modal.Title>Update User</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.keys(newUser).map((key) => (
                            key !== 'departmentId' && (
                                <div className="mb-3" key={key}>
                                    <label htmlFor={key} className="block text-sm font-medium text-gray-700">{key.replace(/_/g, ' ').toUpperCase()}</label>
                                    <input
                                        type={key === 'password' ? 'password' : 'text'}
                                        id={key}
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
=======
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
>>>>>>> 054698c93fec072ffdfe11e06169d2313e26e271
                                        value={newUser[key]}
                                        onChange={(e) => setNewUser({ ...newUser, [key]: e.target.value })}
                                    />
                                </div>
                            )
                        ))}
                        <div className="mb-3">
<<<<<<< HEAD
                            <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700">Department</label>
                            <select
                                id="departmentId"
                                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
=======
                            <label htmlFor="departmentId" className="form-label">Department</label>
                            <select
                                id="departmentId"
                                className="form-control"
>>>>>>> 054698c93fec072ffdfe11e06169d2313e26e271
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
<<<<<<< HEAD
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
=======
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
>>>>>>> 054698c93fec072ffdfe11e06169d2313e26e271
        </div>
    );
};

export default UserManagement;
