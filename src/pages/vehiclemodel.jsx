import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import Sidebar from './Sidebar';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

const VehicleCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: '', name: '' });
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost/coc/gsd/fetchMaster.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ operation: 'fetchModels' }), // Adjusted to fetch models
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        if (data.status === 'success') {
          setCategories(data.data);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error('Error fetching vehicle categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleEdit = (id) => {
    const categoryToEdit = categories.find((category) => category.vehicle_model_id === id);
    if (categoryToEdit) {
      setFormData({ id: categoryToEdit.vehicle_model_id, name: categoryToEdit.vehicle_model_name });
=======
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

const VehicleModels = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState([]);
  const [makes, setMakes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: '', name: '', makeId: '', categoryId: '' });
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);

  const fetchMakes = async () => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/fetchMaster.php', {
        operation: 'fetchMakes',
      });
      const data = response.data;

      if (data.status === 'success') {
        setMakes(data.data);
      } else {
        setMessage(`Error fetching makes: ${data.message}`);
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage('Error fetching makes.');
      setIsSuccess(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/fetchMaster.php', {
        operation: 'fetchVehicleCategories',
      });
      const data = response.data;

      if (data.status === 'success') {
        setCategories(data.data);
      } else {
        setMessage(`Error fetching categories: ${data.message}`);
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage('Error fetching categories.');
      setIsSuccess(false);
    }
  };

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.post('http://localhost/coc/gsd/fetchMaster.php', {
          operation: 'fetchModels',
        });

        if (response.data.status === 'success') {
          setModels(response.data.data);
        } else {
          console.error(response.data.message);
        }
      } catch (error) {
        console.error('Error fetching vehicle models:', error);
      }
    };

    fetchModels();
    fetchMakes();       // Fetch vehicle makes
    fetchCategories();  // Fetch vehicle categories
  }, []);

  const handleEdit = (id) => {
    const modelToEdit = models.find(model => model.vehicle_model_id === id);
    if (modelToEdit) {
      setFormData({
        id: modelToEdit.vehicle_model_id,
        name: modelToEdit.vehicle_model_name,
        makeId: modelToEdit.vehicle_model_vehicle_make_id,
        categoryId: modelToEdit.vehicle_category_id
      });
>>>>>>> 054698c93fec072ffdfe11e06169d2313e26e271
      setEditMode(true);
      setShowModal(true);
    }
  };

  const handleDelete = (id) => {
<<<<<<< HEAD
    setSelectedCategoryId(id);
=======
    setSelectedModelId(id);
>>>>>>> 054698c93fec072ffdfe11e06169d2313e26e271
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
<<<<<<< HEAD
    // Implement deletion logic here...
  };

  const handleSave = async () => {
    // Implement save logic here...
=======
    try {
      const response = await axios.post('http://localhost/coc/gsd/delete_master.php', {
        operation: 'deleteModel',
        model_id: selectedModelId,
      });

      if (response.data.status === 'success') {
        setModels(models.filter(model => model.vehicle_model_id !== selectedModelId));
        toast.success('Vehicle model deleted successfully!');
      } else {
        toast.error(response.data.message || 'Failed to delete vehicle model.');
      }
    } catch (error) {
      console.error('Error deleting vehicle model:', error);
      toast.error('Error deleting vehicle model.');
    } finally {
      setShowConfirmDelete(false);
    }
  };

  const handleSave = async () => {
    const url = editMode ? 'http://localhost/coc/gsd/update_master1.php' : 'http://localhost/coc/gsd/create_master.php';
    const operation = editMode ? 'updateModel' : 'createModel';

    try {
      const response = await axios.post(url, {
        operation,
        id: formData.id,
        name: formData.name,
        makeId: formData.makeId,
        categoryId: formData.categoryId
      });

      if (response.data.status === 'success') {
        if (editMode) {
          setModels(models.map(model => 
            model.vehicle_model_id === formData.id ? { ...model, vehicle_model_name: formData.name, vehicle_model_vehicle_make_id: formData.makeId, vehicle_category_id: formData.categoryId } : model
          ));
          toast.success('Vehicle model updated successfully!');
        } else {
          setModels([...models, { vehicle_model_id: response.data.data.id, vehicle_model_name: formData.name, vehicle_model_vehicle_make_id: formData.makeId, vehicle_category_id: formData.categoryId }]);
          toast.success('Vehicle model created successfully!');
        }
      } else {
        toast.error(response.data.message || 'Failed to save vehicle model.');
      }
    } catch (error) {
      console.error('Error saving vehicle model:', error);
      toast.error('Error saving vehicle model.');
    } finally {
      closeModal();
    }
>>>>>>> 054698c93fec072ffdfe11e06169d2313e26e271
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
<<<<<<< HEAD
    setFormData({ id: '', name: '' });
  };

  if (loading) {
    return <div className="text-center text-xl">Loading...</div>;
  }
=======
    setFormData({ id: '', name: '', makeId: '', categoryId: '' });
  };


>>>>>>> 054698c93fec072ffdfe11e06169d2313e26e271

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container mx-auto p-6 flex-grow-1">
        <div className="mb-4">
          <Button variant="link" onClick={() => navigate('/Master')}>
            <FaArrowLeft className="mr-2" /> Back to Master
          </Button>
        </div>
<<<<<<< HEAD
        <h1 className="text-2xl font-bold text-center mb-6">Vehicle Models</h1>
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-green-500 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Model Name</th>
              <th className="py-3 px-4 text-left">Make Name</th>
              <th className="py-3 px-4 text-left">Category Name</th>
=======
        <h1 className="text-2xl font-bold text-center mb-6">Vehicle Models Master</h1>
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-green-500 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Name</th>
>>>>>>> 054698c93fec072ffdfe11e06169d2313e26e271
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
<<<<<<< HEAD
            {categories.map((category) => (
              <tr key={category.vehicle_model_id} className="border-b hover:bg-gray-100">
                <td className="py-3 px-4">{category.vehicle_model_name}</td>
                <td className="py-3 px-4">{category.vehicle_make_name}</td> {/* Ensure this field exists in the fetched data */}
                <td className="py-3 px-4">{category.vehicle_category_name}</td> {/* Ensure this field exists in the fetched data */}
                <td className="py-3 px-4">
                  <Button
                    onClick={() => handleEdit(category.vehicle_model_id)}
=======
            {models.map((model) => (
              <tr key={model.vehicle_model_id} className="border-b hover:bg-gray-100">
                <td className="py-3 px-4">{model.vehicle_model_name}</td>
                <td className="py-3 px-4">
                  <Button 
                    onClick={() => handleEdit(model.vehicle_model_id)} 
>>>>>>> 054698c93fec072ffdfe11e06169d2313e26e271
                    className="bg-blue-500 text-white rounded px-4 py-2 mr-2 hover:bg-blue-600"
                  >
                    Edit
                  </Button>
<<<<<<< HEAD
                  <Button
                    onClick={() => handleDelete(category.vehicle_model_id)}
=======
                  <Button 
                    onClick={() => handleDelete(model.vehicle_model_id)} 
>>>>>>> 054698c93fec072ffdfe11e06169d2313e26e271
                    className="bg-red-500 text-white rounded px-4 py-2 hover:bg-red-600"
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Modal show={showModal} onHide={closeModal}>
          <Modal.Header closeButton>
            <Modal.Title>{editMode ? 'Edit Vehicle Model' : 'Vehicle Model Details'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group controlId="formModelName">
                <Form.Label>Name:</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Form.Group>
<<<<<<< HEAD
=======
              <Form.Group controlId="formMakeSelect">
                <Form.Label>Select Make:</Form.Label>
                <Form.Control as="select" value={formData.makeId} onChange={(e) => setFormData({ ...formData, makeId: e.target.value })}>
                  <option value="">Select a make...</option>
                  {makes.map((make) => (
                    <option key={make.vehicle_make_id} value={make.vehicle_make_id}>
                      {make.vehicle_make_name}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
              <Form.Group controlId="formCategorySelect">
                <Form.Label>Select Category:</Form.Label>
                <Form.Control as="select" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}>
                  <option value="">Select a category...</option>
                  {categories.map((category) => (
                    <option key={category.vehicle_category_id} value={category.vehicle_category_id}>
                      {category.vehicle_category_name}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
>>>>>>> 054698c93fec072ffdfe11e06169d2313e26e271
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              Close
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showConfirmDelete} onHide={() => setShowConfirmDelete(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Deletion</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to delete this vehicle model?</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>

        <ToastContainer />
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default VehicleCategories;
=======
export default VehicleModels;
>>>>>>> 054698c93fec072ffdfe11e06169d2313e26e271
