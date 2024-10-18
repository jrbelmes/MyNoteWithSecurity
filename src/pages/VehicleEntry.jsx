import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { FaPlus, FaTrash, FaSearch } from 'react-icons/fa';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../vehicle.css';

const VehicleEntry = () => {
    const [vehicles, setVehicles] = useState([]);
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [makes, setMakes] = useState([]);
    const [modelsByCategory, setModelsByCategory] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [vehicleLicensed, setVehicleLicensed] = useState('');
    const [makeId, setMakeId] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [vehicleModelId, setVehicleModelId] = useState('');
    const [category, setCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const BASE_URL = "http://localhost/coc/gsd/user.php";

    useEffect(() => {
        fetchVehicles();
        fetchMakes();
    }, []);

    useEffect(() => {
        const results = vehicles.filter(vehicle =>
            vehicle.vehicle_model_name && vehicle.vehicle_model_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredVehicles(results);
        setCurrentPage(1);
    }, [searchTerm, vehicles]);

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const response = await axios.post(BASE_URL, new URLSearchParams({ operation: "fetchAllVehicles" }));
            if (response.data.status === 'success') {
                setVehicles(response.data.data);
                setFilteredVehicles(response.data.data);
            } else {
                toast.error("Error fetching vehicles: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while fetching vehicles: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchMakes = async () => {
        try {
            const response = await axios.post(BASE_URL, new URLSearchParams({ operation: "fetchMake" }));
            if (response.data.status === 'success') {
                setMakes(response.data.data);
            } else {
                toast.error("Error fetching makes: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while fetching makes: " + error.message);
        }
    };

    const fetchCategoriesAndModels = async (makeId) => {
        if (!makeId) return;
        try {
            const response = await axios.post(BASE_URL, new URLSearchParams({ operation: "fetchCategoriesAndModels", make_id: makeId }));
            if (response.data.status === 'success') {
                setCategories(response.data.data.categories);
                setModelsByCategory(response.data.data.modelsByCategory);
            } else {
                toast.error("Error fetching categories and models: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while fetching categories and models: " + error.message);
        }
    };

    const handleAddVehicle = () => {
        resetForm();
        setShowAddModal(true);
    };

    const handleDeleteVehicle = async (vehicle) => {
        if (window.confirm("Are you sure you want to delete this vehicle?")) {
            // Implement delete logic here
            toast.success("Vehicle successfully deleted!");
        }
    };

    const handleSubmitAdd = async () => {
        if (!vehicleModelId || !vehicleLicensed) {
            toast.error("Please fill in all required fields.");
            return;
        }

        const jsonData = {
            operation: "saveVehicle",
            vehicle_model_id: vehicleModelId,
            vehicle_license: vehicleLicensed,
            admin_id: "4"
        };

        setIsSubmitting(true);

        try {
            const response = await axios.post("http://localhost/coc/gsd/insert_master.php", new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                toast.success(response.data.message);
                resetForm();
                setShowAddModal(false);
                fetchVehicles();
            } else {
                toast.error("Error adding vehicle: " + response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred while adding the vehicle: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setVehicleLicensed('');
        setMakeId('');
        setVehicleModelId('');
        setCategory('');
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleMakeChange = (e) => {
        const selectedMakeId = e.target.value;
        setMakeId(selectedMakeId);
        fetchCategoriesAndModels(selectedMakeId);
    };

    const indexOfLastVehicle = currentPage * itemsPerPage;
    const indexOfFirstVehicle = indexOfLastVehicle - itemsPerPage;
    const currentVehicles = filteredVehicles.slice(indexOfFirstVehicle, indexOfLastVehicle);
    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-[#F4CE14] bg-opacity-10">
            <Sidebar />
            <div className="flex-grow p-6 lg:p-10">
                <h2 className="text-3xl font-bold mb-6 text-gray-800">Vehicle Entry</h2>
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                        <div className="relative w-full md:w-64 mb-4 md:mb-0">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Search by model name"
                                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                        <Button 
                            variant="primary" 
                            onClick={handleAddVehicle}
                            className="w-full md:w-auto bg-[#495E57] hover:bg-[#3a4a45] text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center"
                        >
                            <FaPlus className="mr-2" /> Add Vehicle
                        </Button>
                    </div>
                    {loading ? (
                        <p className="text-center text-gray-600">Loading...</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="hover:bg-[#F4CE14] hover:bg-opacity-20 transition-all">
                                        <th className="py-3 px-4 text-left">Make Name</th>
                                        <th className="py-3 px-4 text-left">Category</th>
                                        <th className="py-3 px-4 text-left">Model</th>
                                        <th className="py-3 px-4 text-left">License</th>
                                        <th className="py-3 px-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-600 text-sm font-light">
                                    {currentVehicles.map((vehicle, index) => (
                                        <tr key={`${vehicle.vehicle_make_name}-${vehicle.vehicle_model_name}-${index}`} className="border-b border-gray-200 hover:bg-gray-100">
                                            <td className="py-3 px-4">{vehicle.vehicle_make_name || 'N/A'}</td>
                                            <td className="py-3 px-4">{vehicle.vehicle_category_name || 'N/A'}</td>
                                            <td className="py-3 px-4">{vehicle.vehicle_model_name || 'N/A'}</td>
                                            <td className="py-3 px-4">{vehicle.vehicle_license || 'N/A'}</td>
                                            <td className="py-3 px-4 text-center">
                                                <Button 
                                                    variant="danger" 
                                                    onClick={() => handleDeleteVehicle(vehicle)}
                                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full transition duration-300 ease-in-out"
                                                >
                                                    <FaTrash />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {/* Pagination */}
                    <div className="mt-4 flex justify-center">
                        {Array.from({ length: totalPages }, (_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentPage(index + 1)}
                                className={`px-4 py-2 mx-1 rounded-lg ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add Vehicle Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add Vehicle</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="make" className="block mb-2 font-semibold">Make</label>
                            <select
                                id="make"
                                value={makeId}
                                onChange={handleMakeChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select Make</option>
                                {makes.length > 0 ? (
                                    makes.map(make => (
                                        <option key={make.make_id} value={make.make_id}>
                                            {make.make_name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="">No makes available</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="category" className="block mb-2 font-semibold">Category</label>
                            <select
                                id="category"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select Category</option>
                                {categories.length > 0 ? (
                                    categories.map(cat => (
                                        <option key={cat.vehicle_category_id} value={cat.vehicle_category_id}>
                                            {cat.vehicle_category_name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="">No categories available</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="model" className="block mb-2 font-semibold">Model</label>
                            <select
                                id="model"
                                value={vehicleModelId}
                                onChange={e => setVehicleModelId(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select Model</option>
                                {modelsByCategory[category]?.length > 0 ? (
                                    modelsByCategory[category].map(model => (
                                        <option key={model.vehicle_model_id} value={model.vehicle_model_id}>
                                            {model.vehicle_model_name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="">No models available</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="license" className="block mb-2 font-semibold">License</label>
                            <input
                                type="text"
                                id="license"
                                value={vehicleLicensed}
                                onChange={e => setVehicleLicensed(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter license number"
                            />
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                        Close
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmitAdd}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Vehicle'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default VehicleEntry;
