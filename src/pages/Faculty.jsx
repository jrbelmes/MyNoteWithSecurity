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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        schoolId: '',
        contact: '',
        username: '',
        password: '',
        departmentId: '',
        isActive: true,
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
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
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
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
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

    const handleSubmit = async () => {
        console.log("Submitting:", newUser); // Log to check the values
    
        const { name, schoolId, contact, username, password, departmentId } = newUser;
    
        // Check if all required fields are filled
        if (!name || !schoolId || !contact || !username || !password || !departmentId) {
            toast.error("All fields are required!");
            return;
        }
    
        // Create the userData object
        const userData = {
            name: name,
            schoolId: schoolId,
            contact: contact,
            username: username,
            password: password,
            departmentId: departmentId,
            isActive: newUser.isActive, // Include active status
            userLevel: 'users' // Set user level to 'users'
        };
    
        const formData = new FormData();
        formData.append("operation", "saveUser");
        formData.append("json", JSON.stringify(userData));
    
        setLoading(true);
        try {
            const url = "http://localhost/coc/gsd/insert_master.php";
            const response = await axios.post(url, formData);
    
            if (response.data.status === 'success') {
                toast.success("User successfully added!");
                fetchUsers();
                resetForm();
            } else {
                toast.error("Failed to add user: " + (response.data.message || "Unknown error"));
            }
        } catch (error) {
            toast.error("An error occurred while adding user.");
        } finally {
            setLoading(false);
            setIsModalOpen(false);
        }
    };
    
    

    const resetForm = () => {
        setNewUser({
            name: '',
            schoolId: '',
            contact: '',
            username: '',
            password: '',
            departmentId: '',
            isActive: true,
        });
    };

    const filteredUsers = users.filter(user =>
        user.users_name && user.users_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col lg:flex-row">
            <Sidebar />
            <div className="flex-grow ml-0 lg:ml-10 p-6">
                <h2 className="text-2xl font-bold">User Management</h2>
                <div className="flex flex-col lg:flex-row items-center mb-4">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by Name..."
                        className="border border-gray-300 p-2 rounded w-full max-w-xs"
                    />
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
                                <th className="py-3 px-6 text-left">Username</th>
                                <th className="py-3 px-6 text-left">Department ID</th>
                               
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
                                        <td className="py-3 px-6">{user.users_username}</td>
                                        <td className="py-3 px-6">{user.users_department_id}</td>
                                        
                                        <td className="py-3 px-6">
                                            <button className="text-blue-500" onClick={() => {/* editUser logic */}}>
                                                <FaEdit />
                                            </button>
                                            <button className="text-red-500 ml-2" onClick={() => {/* deleteUser logic */}}>
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center py-3">NO USERS FOUND</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add User</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {Object.keys(newUser).map((key) => (
                            key !== 'userLevel' && key !== 'departmentId' && (
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
                        <div className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                checked={newUser.isActive}
                                onChange={(e) => setNewUser({ ...newUser, isActive: e.target.checked })}
                            />
                            <label className="form-check-label">Active</label>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleSubmit}>
                            Submit
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default UserManagement;
