import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faSearch, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion, AnimatePresence } from 'framer-motion';

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
    const user_level = localStorage.getItem('user_level');
    const [filteredEquipments, setFilteredEquipments] = useState([]);

    const user_id = localStorage.getItem('user_id');

    useEffect(() => {
        if (user_id !== '100' && user_id !== '1' && user_id !== '4') {
            localStorage.clear();
            navigate('/gsd');
        }
    }, [user_id, navigate]);

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
        <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-white to-green-500">
            <Sidebar />
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-grow p-6 lg:p-10"
            >
                <h2 className="text-4xl font-bold mb-6 text-green-800 drop-shadow-lg">Equipment Management</h2>
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
                                placeholder="Search equipment..."
                                className="w-full pl-10 pr-4 py-2 rounded-full border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                            />
                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
                        </motion.div>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsAddModalOpen(true)}
                            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center shadow-md"
                        >
                            <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Equipment
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
                                        <th className="py-3 px-4 text-left rounded-tl-lg">No.</th>
                                        <th className="py-3 px-4 text-left">Equipment Name</th>
                                        <th className="py-3 px-4 text-left">Quantity</th>
                                        
                                        <th className="py-3 px-4 text-left">Created At</th>
                                        <th className="py-3 px-4 text-left">Updated At</th>
                                        <th className="py-3 px-4 text-center rounded-tr-lg">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-600 text-sm font-light">
                                    <AnimatePresence>
                                        {currentEquipments.map((equipment, index) => (
                                            <motion.tr 
                                                key={equipment.equip_id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="border-b border-green-200 hover:bg-green-50 transition-colors duration-200"
                                            >
                                                <td className="py-3 px-4">{indexOfFirstEquipment + index + 1}</td>
                                                <td className="py-3 px-4">{equipment.equip_name}</td>
                                                <td className="py-3 px-4">{equipment.equip_quantity}</td>
                                                
                                                <td className="py-3 px-4">{equipment.equip_created_at}</td>
                                                <td className="py-3 px-4">{equipment.equip_updated_at}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleEditClick(equipment)}
                                                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-full transition duration-300 ease-in-out mr-2"
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </motion.button>
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleDeleteClick(equipment.equip_id)}
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

                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => paginate(i + 1)}
                                    className={`mx-1 px-4 py-2 rounded-md ${currentPage === i + 1 ? 'bg-green-600 text-white' : 'bg-green-200 text-green-800 hover:bg-green-300'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Equipment Modal */}
            <Modal show={isAddModalOpen || isEditModalOpen} onHide={() => {setIsAddModalOpen(false); setIsEditModalOpen(false);}} centered>
                <Modal.Header closeButton className="bg-green-600 text-white">
                    <Modal.Title>{isEditModalOpen ? 'Edit Equipment' : 'Add Equipment'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-green-50">
                    <div className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="equipmentName" className="block mb-2 font-semibold">Equipment Name</label>
                            <input
                                type="text"
                                id="equipmentName"
                                value={newEquipmentName}
                                onChange={(e) => setNewEquipmentName(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="equipmentQuantity" className="block mb-2 font-semibold">Equipment Quantity</label>
                            <input
                                type="number"
                                id="equipmentQuantity"
                                value={newEquipmentQuantity}
                                onChange={(e) => setNewEquipmentQuantity(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="category" className="block mb-2 font-semibold">Category</label>
                            <select
                                id="category"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="">Select a category</option>
                                {categories.map(category => (
                                    <option key={category.equipments_category_id} value={category.equipments_category_id}>
                                        {category.equipments_category_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="bg-green-50">
                    <Button variant="secondary" onClick={() => {setIsAddModalOpen(false); setIsEditModalOpen(false);}}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                        {isEditModalOpen ? 'Update' : 'Add'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default EquipmentEntry;
