import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import Sidebar from './Sidebar';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

const UserLevels = () => {
  const navigate = useNavigate();
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: '', name: '', desc: '' });
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchUserLevels = async () => {
      try {
        const response = await fetch('http://localhost/coc/gsd/fetchMaster.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ operation: 'fetchUserLevels' }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        if (data.status === 'success') {
          setLevels(data.data);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error('Error fetching user levels:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserLevels();
  }, []);

  const handleEdit = (id) => {
    const levelToEdit = levels.find((level) => level.user_level_id === id);
    if (levelToEdit) {
      setFormData({ id: levelToEdit.user_level_id, name: levelToEdit.user_level_name, desc: levelToEdit.user_level_desc });
      setEditMode(true);
      setShowModal(true);
    }
  };

  const handleDelete = (id) => {
    setSelectedLevelId(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch('http://localhost/coc/gsd/delete_master.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ operation: 'deleteUserLevel', user_level_id: selectedLevelId }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setLevels(levels.filter(level => level.user_level_id !== selectedLevelId));
        toast.success('User level deleted successfully!');
      } else {
        toast.error(data.message || 'Failed to delete user level.');
      }
    } catch (error) {
      console.error('Error deleting user level:', error);
      toast.error('Error deleting user level.');
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
        body: new URLSearchParams({ operation: 'updateUserLevel', id: formData.id, name: formData.name, desc: formData.desc }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setLevels(levels.map(level => 
          level.user_level_id === formData.id ? { ...level, user_level_name: formData.name, user_level_desc: formData.desc } : level
        ));
        toast.success('User level updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update user level.');
      }
    } catch (error) {
      console.error('Error updating user level:', error);
      toast.error('Error updating user level.');
    } finally {
      closeModal();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setFormData({ id: '', name: '', desc: '' });
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
        <h1 className="text-2xl font-bold text-center mb-6">User Levels Master</h1>
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-green-500 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Description</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((level) => (
              <tr key={level.user_level_id} className="border-b hover:bg-gray-100">
                <td className="py-3 px-4">{level.user_level_name}</td>
                <td className="py-3 px-4">{level.user_level_desc}</td>
                <td className="py-3 px-4">
                  <Button 
                    onClick={() => handleEdit(level.user_level_id)} 
                    className="bg-blue-500 text-white rounded px-4 py-2 mr-2 hover:bg-blue-600"
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleDelete(level.user_level_id)} 
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
            <Modal.Title>{editMode ? 'Edit User Level' : 'User Level Details'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group controlId="formLevelName">
                <Form.Label>Name:</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Form.Group>
              <Form.Group controlId="formLevelDesc">
                <Form.Label>Description:</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
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
            <p>Are you sure you want to delete this user level?</p>
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
export default UserLevels;
=======
export default UserLevels;
>>>>>>> 054698c93fec072ffdfe11e06169d2313e26e271
