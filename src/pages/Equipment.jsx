import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { FaPlus, FaSearch, FaEdit, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const EquipmentEntry = () => {
    const adminId = localStorage.getItem('adminId') || '';
    const [equipments, setEquipments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEquipmentName, setNewEquipmentName] = useState('');
    const [newEquipmentQuantity, setNewEquipmentQuantity] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [editingEquipment, setEditingEquipment] = useState(null);
    const navigate = useNavigate();
    const adminLevel = localStorage.getItem('adminLevel');

    useEffect(() => {
        if (adminLevel !== '100') {
            localStorage.clear();
            navigate('/');
        }
    }, [adminLevel, navigate]);

    useEffect(() => {
        fetchEquipments();
        fetchCategories();
    }, []);

    const fetchEquipments = async () => {
        setLoading(true);
        const url = "http://localhost/coc/gsd/user.php";
        const jsonData = { operation: "fetchEquipmentsWithStatus" };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                setEquipments(response.data.data);
            } else {
                toast.error("Error fetching equipments: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching equipments:", error);
            toast.error("An error occurred while fetching equipments.");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        setLoading(true);
        const url = "http://localhost/coc/gsd/user.php";
        const jsonData = { operation: "fetchCategories" };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                setCategories(response.data.data);
            } else {
                toast.error("Error fetching categories: " + response.data.message);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast.error("An error occurred while fetching categories.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!newEquipmentName || !newEquipmentQuantity || !selectedCategory) {
            toast.error("All fields are required!");
            return;
        }

        const equipmentData = {
            name: newEquipmentName,
            quantity: newEquipmentQuantity,
            category_id: selectedCategory
        };

        let url = "http://localhost/coc/gsd/insert_master.php";
        let operation = "saveEquipment";

        if (editingEquipment) {
            equipmentData.equip_id = editingEquipment.equip_id;
            url = "http://localhost/coc/gsd/update_master1.php";
            operation = "updateEquipment";
        }

        const formData = new FormData();
        formData.append("operation", operation);
        formData.append("json", JSON.stringify(equipmentData));

        setLoading(true);
        try {
            const response = await axios.post(url, formData);
            if (response.data.status === 'success') {
                toast.success(`Equipment successfully ${editingEquipment ? "updated" : "added"}!`);
                fetchEquipments();
                resetForm();
            } else {
                toast.error(`Failed to ${editingEquipment ? "update" : "add"} equipment: ` + (response.data.message || "Unknown error"));
            }
        } catch (error) {
            toast.error(`An error occurred while ${editingEquipment ? "updating" : "adding"} equipment.`);
            console.error("Error saving equipment:", error);
        } finally {
            setLoading(false);
            setIsModalOpen(false);
        }
    };

    const resetForm = () => {
        setNewEquipmentName('');
        setNewEquipmentQuantity('');
        setSelectedCategory('');
        setEditingEquipment(null);
    };

    const handleEditClick = (equipment) => {
        setNewEquipmentName(equipment.equip_name);
        setNewEquipmentQuantity(equipment.equip_quantity);
        setSelectedCategory(equipment.category_id);
        setEditingEquipment(equipment);
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (equip_id) => {
        const confirmation = window.confirm("Are you sure you want to delete this equipment?");
        if (!confirmation) return;

        const jsonData = { operation: "deleteEquipment", equipment_id: equip_id };
        setLoading(true);
        try {
            const url = "http://localhost/coc/gsd/delete_master.php";
            const response = await axios.post(url, new URLSearchParams(jsonData));

            if (response.data.status === 'success') {
                toast.success("Equipment deleted successfully!");
                fetchEquipments();
            } else {
                toast.error("Failed to delete equipment: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while deleting equipment: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredEquipments = equipments.filter(equipment =>
        equipment.equip_name && equipment.equip_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastEquipment = currentPage * entriesPerPage;
    const indexOfFirstEquipment = indexOfLastEquipment - entriesPerPage;
    const currentEquipments = filteredEquipments.slice(indexOfFirstEquipment, indexOfLastEquipment);
    const totalPages = Math.ceil(filteredEquipments.length / entriesPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="flex flex-col lg:flex-row">
            <Sidebar />
            <div className="flex-grow ml-0 lg:ml-10 p-6">
                <h2 className="text-2xl font-bold">Equipment Entry</h2>
                <div className="flex flex-col lg:flex-row items-center mb-4">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        className="border border-gray-300 p-2 rounded w-full max-w-xs"
                    />
                    <button onClick={fetchEquipments} className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ml-4">
                        <FaSearch className="mr-2" /> Search
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-4">
                        <FaPlus className="mr-2" /> Add Equipment
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="loader"></div>
                    </div>
                ) : (
                    <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                        <thead>
                            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">No.</th>
                                <th className="py-3 px-6 text-left">Equipment Name</th>
                                <th className="py-3 px-6 text-left">Equipment Quantity</th>
                                <th className="py-3 px-6 text-left">Status</th>
                                <th className="py-3 px-6 text-left">Equipment Created</th>
                                <th className="py-3 px-6 text-left">Equipment Updated</th>
                                <th className="py-3 px-6 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                            {currentEquipments.length > 0 ? (
                                currentEquipments.map((equipment, index) => (
                                    <tr key={equipment.equip_id} className="border-b border-gray-200 hover:bg-gray-100">
                                        <td className="py-3 px-6">{indexOfFirstEquipment + index + 1}</td>
                                        <td className="py-3 px-6">{equipment.equip_name}</td>
                                        <td className="py-3 px-6">{equipment.equip_quantity}</td>
                                        <td className="py-3 px-6">{equipment.equip_status}</td>
                                        <td className="py-3 px-6">{equipment.equip_created_at}</td>
                                        <td className="py-3 px-6">{equipment.equip_updated_at}</td>
                                        <td className="py-3 px-6">
                                            <button className="text-blue-500" onClick={() => handleEditClick(equipment)}>
                                                <FaEdit />
                                            </button>
                                            <button className="text-red-500 ml-2" onClick={() => handleDeleteClick(equipment.equip_id)}>
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-3 px-6 text-center">No equipment found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                <div className="flex justify-center mt-4">
                    {Array.from({ length: totalPages }, (_, index) => (
                        <button
                            key={index}
                            onClick={() => paginate(index + 1)}
                            className={`mx-1 px-3 py-1 rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>

                <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editingEquipment ? "Edit Equipment" : "Add Equipment"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="mb-3">
                            <label className="form-label">Equipment Name</label>
                            <input
                                type="text"
                                className="form-control"
                                value={newEquipmentName}
                                onChange={(e) => setNewEquipmentName(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Equipment Quantity</label>
                            <input
                                type="number"
                                className="form-control"
                                value={newEquipmentQuantity}
                                onChange={(e) => setNewEquipmentQuantity(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Select Category</label>
                            <select
                                className="form-select"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="">Select a category</option>
                                {categories.map(category => (
                                    <option key={category.equipments_category_id} value={category.equipments_category_id}>
                                        {category.equipments_category_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleSubmit}>
                            {editingEquipment ? "Update Equipment" : "Add Equipment"}
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default EquipmentEntry;
