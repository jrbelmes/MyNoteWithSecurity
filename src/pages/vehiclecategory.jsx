import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import Sidebar from './Sidebar';
import { FaArrowLeft } from 'react-icons/fa'; // Import an icon for the return button
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

const VehicleCategories = () => {
  const navigate = useNavigate(); // Initialize useNavigate
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
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ operation: 'fetchVehicleCategories' }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

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
    const categoryToEdit = categories.find((category) => category.vehicle_category_id === id);
    if (categoryToEdit) {
      setFormData({ id: categoryToEdit.vehicle_category_id, name: categoryToEdit.vehicle_category_name });
      setEditMode(true);
      setShowModal(true);
    }
  };

  const handleDelete = (id) => {
    setSelectedCategoryId(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch('http://localhost/coc/gsd/delete_master.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ operation: 'deleteVehicleCategory', vehicle_category_id: selectedCategoryId }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setCategories(categories.filter(category => category.vehicle_category_id !== selectedCategoryId));
        toast.success('Vehicle category deleted successfully!');
      } else {
        toast.error(data.message || 'Failed to delete vehicle category.');
      }
    } catch (error) {
      console.error('Error deleting vehicle category:', error);
      toast.error('Error deleting vehicle category.');
    } finally {
      setShowConfirmDelete(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost/coc/gsd/update_master1.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ operation: 'updateVehicleCategory', id: formData.id, name: formData.name }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setCategories(categories.map(category => 
          category.vehicle_category_id === formData.id ? { ...category, vehicle_category_name: formData.name } : category
        ));
        toast.success('Vehicle category updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update vehicle category.');
      }
    } catch (error) {
      console.error('Error updating vehicle category:', error);
      toast.error('Error updating vehicle category.');
    } finally {
      closeModal();
    }
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
      <Sidebar /> {/* Ensure the Sidebar component is properly integrated */}
      <div className="container mx-auto p-6 flex-grow-1">
        <div className="mb-4">
          <Button variant="link" onClick={() => navigate('/Master')}>
            <FaArrowLeft className="mr-2" /> Back to Master
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-center mb-6">Vehicle Categories</h1>
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-green-500 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.vehicle_category_id} className="border-b hover:bg-gray-100">
                <td className="py-3 px-4">{category.vehicle_category_name}</td>
                <td className="py-3 px-4">
                  <Button 
                    onClick={() => handleEdit(category.vehicle_category_id)} 
                    className="bg-blue-500 text-white rounded px-4 py-2 mr-2 hover:bg-blue-600"
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleDelete(category.vehicle_category_id)} 
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
            <Modal.Title>{editMode ? 'Edit Vehicle Category' : 'Vehicle Category Details'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group controlId="formCategoryName">
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
            <p>Are you sure you want to delete this vehicle category?</p>
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

