import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { FaPlus, FaSearch, FaPencilAlt, FaTrashAlt } from 'react-icons/fa';
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
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newEquipmentName, setNewEquipmentName] = useState('');
    const [newEquipmentQuantity, setNewEquipmentQuantity] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [editingEquipment, setEditingEquipment] = useState(null);
    const navigate = useNavigate();
    const adminLevel = localStorage.getItem('adminLevel');
    const [filteredEquipments, setFilteredEquipments] = useState([]);

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

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            const filtered = equipments.filter(equipment =>
                equipment.equip_name && equipment.equip_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredEquipments(filtered);
            setCurrentPage(1);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, equipments]);

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
            categoryId: selectedCategory, // Updated to match the JSON structure
        };
    
        let url = "http://localhost/coc/gsd/insert_master.php";
        let operation = "saveEquipment";
    
        if (editingEquipment) {
            equipmentData.equipmentId = editingEquipment.equip_id; // Update to match PHP
            url = "http://localhost/coc/gsd/update_master1.php";
            operation = "updateEquipment";
        }
    
        const formData = new FormData();
        formData.append("operation", operation);
        formData.append("json", JSON.stringify(equipmentData)); // No need to add equipmentId separately
    
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
            if (editingEquipment) {
                setIsEditModalOpen(false);
            } else {
                setIsAddModalOpen(false);
            }
        }
    };
    
    

    const resetForm = () => {
        setNewEquipmentName('');
        setNewEquipmentQuantity('');
        setSelectedCategory('');
        setEditingEquipment(null);
    };

    const handleEditClick = async (equipment) => {
        await getEquipmentDetails(equipment.equip_id);
        setIsEditModalOpen(true);
    };

    const getEquipmentDetails = async (equip_id) => {
        const url = "http://localhost/coc/gsd/fetchMaster.php";
        const jsonData = { operation: "fetchEquipmentById", id: equip_id };

        try {
            const response = await axios.post(url, new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                const equipment = response.data.data[0];
                setNewEquipmentName(equipment.equip_name);
                setNewEquipmentQuantity(equipment.equip_quantity);
                setSelectedCategory(equipment.equipment_equipment_category_id);
                setEditingEquipment(equipment);
            } else {
                toast.error("Error fetching equipment details: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while fetching equipment details.");
            console.error("Error fetching equipment details:", error);
        }
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

    const indexOfLastEquipment = currentPage * entriesPerPage;
    const indexOfFirstEquipment = indexOfLastEquipment - entriesPerPage;
    const currentEquipments = filteredEquipments.slice(indexOfFirstEquipment, indexOfLastEquipment);
    const totalPages = Math.ceil(filteredEquipments.length / entriesPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-[#F4CE14] bg-opacity-10">
            <Sidebar />
            <div className="flex-grow p-8">
                <h2 className="text-3xl font-bold text-[#495E57] mb-6">Equipment Management</h2>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                        <div className="relative w-full md:w-96 mb-4 md:mb-0">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search equipment..."
                                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className="text-gray-400" />
                            </div>
                        </div>
                        <button onClick={() => setIsAddModalOpen(true)} className="bg-[#495E57] text-white px-4 py-2 rounded-lg hover:bg-[#3a4a45] transition duration-300 flex items-center">
                            <FaPlus className="mr-2" />
                            Add Equipment
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="loader"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[#495E57] text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        <th className="px-6 py-3">No.</th>
                                        <th className="px-6 py-3">Equipment Name</th>
                                        <th className="px-6 py-3">Quantity</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Created At</th>
                                        <th className="px-6 py-3">Updated At</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-[#495E57] divide-opacity-20">
                                    {currentEquipments.length > 0 ? (
                                        currentEquipments.map((equipment, index) => (
                                            <tr key={equipment.equip_id} className="hover:bg-[#F4CE14] hover:bg-opacity-10 transition-all">
                                                <td className="px-6 py-4 whitespace-nowrap">{indexOfFirstEquipment + index + 1}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{equipment.equip_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{equipment.equip_quantity}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{equipment.equip_status}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{equipment.equip_created_at}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{equipment.equip_updated_at}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button className="text-[#495E57] hover:text-[#3a4a45] mr-3" onClick={() => handleEditClick(equipment)}>
                                                        <FaPencilAlt />
                                                    </button>
                                                    <button className="text-red-600 hover:text-red-800" onClick={() => handleDeleteClick(equipment.equip_id)}>
                                                        <FaTrashAlt />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-4 text-center text-[#495E57]">
                                                No equipment found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => paginate(i + 1)}
                                    className={`mx-1 px-4 py-2 rounded-md ${currentPage === i + 1 ? 'bg-[#495E57] text-white' : 'bg-[#F4CE14] text-[#495E57] hover:bg-[#f3d44a]'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add Equipment Modal */}
                <Modal show={isAddModalOpen} onHide={() => setIsAddModalOpen(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title className="text-[#495E57]">Add Equipment</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#495E57] mb-2">Equipment Name</label>
                            <input
                                type="text"
                                value={newEquipmentName}
                                onChange={(e) => setNewEquipmentName(e.target.value)}
                                className="w-full px-3 py-2 border border-[#495E57] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F4CE14]"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#495E57] mb-2">Equipment Quantity</label>
                            <input
                                type="number"
                                value={newEquipmentQuantity}
                                onChange={(e) => setNewEquipmentQuantity(e.target.value)}
                                className="w-full px-3 py-2 border border-[#495E57] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F4CE14]"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#495E57] mb-2">Select Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-[#495E57] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F4CE14]"
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
                        <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleSubmit}>
                            Add Equipment
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Update Equipment Modal */}
                <Modal show={isEditModalOpen} onHide={() => setIsEditModalOpen(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title className="text-[#495E57]">Edit Equipment</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#495E57] mb-2">Equipment Name</label>
                            <input
                                type="text"
                                value={newEquipmentName}
                                onChange={(e) => setNewEquipmentName(e.target.value)}
                                className="w-full px-3 py-2 border border-[#495E57] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F4CE14]"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#495E57] mb-2">Equipment Quantity</label>
                            <input
                                type="number"
                                value={newEquipmentQuantity}
                                onChange={(e) => setNewEquipmentQuantity(e.target.value)}
                                className="w-full px-3 py-2 border border-[#495E57] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F4CE14]"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#495E57] mb-2">Select Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-[#495E57] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F4CE14]"
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
                        <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleSubmit}>
                            Update Equipment
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default EquipmentEntry;
