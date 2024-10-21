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
    const [showModal, setShowModal] = useState(false);
    const [vehicleLicensed, setVehicleLicensed] = useState('');
    const [makeId, setMakeId] = useState('');
    const [vehicleModelId, setVehicleModelId] = useState('');
    const [category, setCategory] = useState('');
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const BASE_URL = "http://localhost/coc/gsd/user.php";

    useEffect(() => {
        fetchVehicles();
        fetchMakes();
    }, []);

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const response = await axios.post(BASE_URL, new URLSearchParams({ operation: "fetchAllVehicles" }));
            if (response.data.status === 'success') {
                setVehicles(response.data.data);
                setFilteredVehicles(response.data.data);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
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
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const getVehicleById = async (id) => {
        try {
            const response = await axios.post("http://localhost/coc/gsd/fetchMaster.php", new URLSearchParams({ operation: "fetchVehicleById", id }));
            if (response.data.status === 'success') {
                const vehicle = response.data.data[0];
                setVehicleLicensed(vehicle.vehicle_license);
                setMakeId(vehicle.vehicle_model_vehicle_make_id);
                setVehicleModelId(vehicle.vehicle_model_id);
                setCategory(vehicle.vehicle_category_id);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleEditVehicle = (vehicle) => {
        setSelectedVehicleId(vehicle.vehicle_id);
        getVehicleById(vehicle.vehicle_id);
        setShowModal(true);
    };

    const handleAddVehicle = () => {
        resetForm();
        setSelectedVehicleId(null);
        setShowModal(true);
    };

    const resetForm = () => {
        setVehicleLicensed('');
        setMakeId('');
        setVehicleModelId('');
        setCategory('');
    };

    const handleSubmit = async () => {
        if (!vehicleModelId || !vehicleLicensed) {
            toast.error("Please fill in all required fields.");
            return;
        }

        const jsonData = {
            operation: selectedVehicleId ? "updateVehicle" : "saveVehicle",
            vehicle_model_id: vehicleModelId,
            vehicle_license: vehicleLicensed,
            admin_id: "4",
            vehicle_id: selectedVehicleId || undefined,
        };

        setIsSubmitting(true);

        try {
            const response = await axios.post("http://localhost/coc/gsd/insert_master.php", new URLSearchParams(jsonData));
            if (response.data.status === 'success') {
                toast.success(response.data.message);
                resetForm();
                setShowModal(false);
                fetchVehicles();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteVehicle = async (vehicle) => {
        if (window.confirm("Are you sure you want to delete this vehicle?")) {
            try {
                const response = await axios.post(BASE_URL, new URLSearchParams({
                    operation: "deleteVehicle",
                    vehicle_id: vehicle.vehicle_id,
                }));
                if (response.data.status === 'success') {
                    toast.success("Vehicle successfully deleted!");
                    fetchVehicles();
                } else {
                    toast.error(response.data.message);
                }
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    const handleMakeChange = (e) => {
        const selectedMakeId = e.target.value;
        setMakeId(selectedMakeId);
        fetchCategoriesAndModels(selectedMakeId);
    };

    const fetchCategoriesAndModels = async (makeId) => {
        if (!makeId) return;
        try {
            const response = await axios.post(BASE_URL, new URLSearchParams({ operation: "fetchCategoriesAndModels", make_id: makeId }));
            if (response.data.status === 'success') {
                setCategories(response.data.data.categories);
                setModelsByCategory(response.data.data.modelsByCategory);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleSearchChange = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const results = vehicles.filter(vehicle =>
            vehicle.vehicle_model_name && vehicle.vehicle_model_name.toLowerCase().includes(searchTerm)
        );
        setFilteredVehicles(results);
    };

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
                                    {filteredVehicles.map((vehicle) => (
                                        <tr key={vehicle.vehicle_id} className="border-b border-gray-200 hover:bg-gray-100">
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
                                                <Button 
                                                    variant="primary" 
                                                    onClick={() => handleEditVehicle(vehicle)}
                                                    className="ml-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-full transition duration-300 ease-in-out"
                                                >
                                                    Edit
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Vehicle Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{selectedVehicleId ? 'Edit Vehicle' : 'Add Vehicle'}</Modal.Title>
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
                                {makes.map(make => (
                                    <option key={make.vehicle_make_id} value={make.vehicle_make_id}>
                                        {make.vehicle_make_name}
                                    </option>
                                ))}
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
                                {categories.map(cat => (
                                    <option key={cat.vehicle_category_id} value={cat.vehicle_category_id}>
                                        {cat.vehicle_category_name}
                                    </option>
                                ))}
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
                                {modelsByCategory[category]?.map(model => (
                                    <option key={model.vehicle_model_id} value={model.vehicle_model_id}>
                                        {model.vehicle_model_name}
                                    </option>
                                ))}
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
                            />
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default VehicleEntry;