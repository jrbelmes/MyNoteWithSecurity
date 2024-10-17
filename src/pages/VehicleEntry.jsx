import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { FaPlus, FaTrash } from 'react-icons/fa';
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
        const results = vehicles.filter(vehicle =>
            vehicle.vehicle_model_name && vehicle.vehicle_model_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredVehicles(results);
        setCurrentPage(1);
    }, [searchTerm, vehicles]);

    const fetchVehicles = async () => {
        setLoading(true);
        const jsonData = { operation: "fetchAllVehicles" };

        try {
            const response = await axios.post(BASE_URL, new URLSearchParams(jsonData));
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
        const jsonData = { operation: "fetchMake" };
        try {
            const response = await axios.post(BASE_URL, new URLSearchParams(jsonData));
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
        const jsonData = { operation: "fetchCategoriesAndModels", make_id: makeId };

        try {
            const response = await axios.post(BASE_URL, new URLSearchParams(jsonData));
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

    useEffect(() => {
        fetchVehicles();
        fetchMakes();
    }, []);

    const handleAddVehicle = () => {
        resetForm();
        setShowAddModal(true);
    };

    const handleDeleteVehicle = async (vehicle) => {
        if (window.confirm("Are you sure you want to delete this vehicle?")) {
            // Logic for deleting the vehicle if needed
            toast.success("Vehicle successfully deleted!");
            // Fetch updated vehicles here if needed
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
            admin_id: "4" // Replace with actual admin ID, perhaps from a user context or state
        };

        setIsSubmitting(true);

        try {
            const response = await axios.post("http://localhost/coc/gsd/insert_master.php", new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                toast.success(response.data.message);
                resetForm();
                setShowAddModal(false);
                fetchVehicles(); // Refresh the vehicle list
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
        <div className="flex flex-col lg:flex-row">
            <Sidebar />
            <div className="flex-grow ml-0 lg:ml-10 p-6">
                <h2 className="text-2xl font-bold mb-4">Vehicle Entry</h2>
                <div className="mb-4">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search by model name"
                        className="border border-gray-300 p-2 rounded w-full"
                    />
                </div>
                <div className="mb-4">
                    <Button variant="primary" onClick={handleAddVehicle}>
                        <FaPlus /> Add Vehicle
                    </Button>
                </div>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <table className="table-auto w-full border-collapse border border-gray-300">
                        <thead>
                            <tr>
                                <th className="border border-gray-300 p-2">Make Name</th>
                                <th className="border border-gray-300 p-2">Category</th>
                                <th className="border border-gray-300 p-2">Model</th>
                                <th className="border border-gray-300 p-2">License</th>
                                <th className="border border-gray-300 p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentVehicles.map((vehicle, index) => (
                                <tr key={`${vehicle.vehicle_make_name}-${vehicle.vehicle_model_name}-${index}`}>
                                    <td className="border border-gray-300 p-2">{vehicle.vehicle_make_name || 'N/A'}</td>
                                    <td className="border border-gray-300 p-2">{vehicle.vehicle_category_name || 'N/A'}</td>
                                    <td className="border border-gray-300 p-2">{vehicle.vehicle_model_name || 'N/A'}</td>
                                    <td className="border border-gray-300 p-2">{vehicle.vehicle_license || 'N/A'}</td>
                                    <td className="border border-gray-300 p-2">
                                        <Button variant="danger" onClick={() => handleDeleteVehicle(vehicle)}>
                                            <FaTrash /> Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {/* Pagination */}
                <div className="mt-4">
                    {Array.from({ length: totalPages }, (_, index) => (
                        <Button key={index} onClick={() => setCurrentPage(index + 1)}>
                            {index + 1}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Add Vehicle Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add Vehicle</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-1">Vehicle Make</label>
                        <select
                            value={makeId}
                            onChange={handleMakeChange}
                            className="form-select"
                            required
                        >
                            <option value="">Select Make</option>
                            {makes.map(make => (
                                <option key={make.vehicle_make_id} value={make.vehicle_make_id}>
                                    {make.vehicle_make_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {makeId && (
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1">Vehicle Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="form-select"
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.vehicle_category_id} value={cat.vehicle_category_id}>
                                        {cat.vehicle_category_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {category && (
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1">Vehicle Model</label>
                            <select
                                value={vehicleModelId}
                                onChange={(e) => setVehicleModelId(e.target.value)}
                                className="form-select"
                                required
                            >
                                <option value="">Select Model</option>
                                {modelsByCategory[category]?.map(model => (
                                    <option key={model.vehicle_model_id} value={model.vehicle_model_id}>
                                        {model.vehicle_model_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-1">Vehicle License</label>
                        <input
                            type="text"
                            value={vehicleLicensed}
                            onChange={(e) => setVehicleLicensed(e.target.value)}
                            className="border border-gray-300 p-2 rounded w-full"
                            required
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleSubmitAdd}>
                        Save Vehicle
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default VehicleEntry;
