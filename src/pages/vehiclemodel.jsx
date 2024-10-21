import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import Sidebar from './Sidebar';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
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
      setEditMode(true);
      setShowModal(true);
    }
  };

  const handleDelete = (id) => {
    setSelectedCategoryId(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    // Implement deletion logic here...
  };

  const handleSave = async () => {
    // Implement save logic here...
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setFormData({ id: '', name: '' });
  };

  if (loading) {
    return <div className="text-center text-xl">Loading...</div>;
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container mx-auto p-6 flex-grow-1">
        <div className="mb-4">
          <Button variant="link" onClick={() => navigate('/Master')}>
            <FaArrowLeft className="mr-2" /> Back to Master
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-center mb-6">Vehicle Models</h1>
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-green-500 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Model Name</th>
              <th className="py-3 px-4 text-left">Make Name</th>
              <th className="py-3 px-4 text-left">Category Name</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.vehicle_model_id} className="border-b hover:bg-gray-100">
                <td className="py-3 px-4">{category.vehicle_model_name}</td>
                <td className="py-3 px-4">{category.vehicle_make_name}</td> {/* Ensure this field exists in the fetched data */}
                <td className="py-3 px-4">{category.vehicle_category_name}</td> {/* Ensure this field exists in the fetched data */}
                <td className="py-3 px-4">
                  <Button
                    onClick={() => handleEdit(category.vehicle_model_id)}
                    className="bg-blue-500 text-white rounded px-4 py-2 mr-2 hover:bg-blue-600"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(category.vehicle_model_id)}
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

export default VehicleCategories;
