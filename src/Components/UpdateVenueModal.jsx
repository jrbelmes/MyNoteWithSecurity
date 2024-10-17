import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

const UpdateVenueModal = ({ venue, isOpen, onClose, fetchVenues }) => {
    const [venueName, setVenueName] = useState(venue?.ven_name || '');
    const [maxOccupancy, setMaxOccupancy] = useState(venue?.ven_occupancy || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (venue) {
            setVenueName(venue.ven_name);
            setMaxOccupancy(venue.ven_occupancy);
        }
    }, [venue]);

    const handleSubmit = async () => {
        if (!venueName || !maxOccupancy) {
            toast.error("All fields are required!");
            return;
        }

        const updatedVenue = {
            venue_id: venue.ven_id,
            venue_name: venueName,
            max_occupancy: maxOccupancy,
        };

        setLoading(true);
        try {
            const url = "http://localhost/gsd/update_master.php";
            const response = await axios.post(url, new URLSearchParams({
                operation: 'updateVenueData',
                json: JSON.stringify(updatedVenue)
            }));

            if (response.data.status === 'success') {
                toast.success("Venue successfully updated!");
                fetchVenues(); // Refresh the venue list
                onClose();
            } else {
                toast.warning("Failed to update venue: " + (response.data.message || "Unknown error"));
            }
        } catch (error) {
            console.error("Error updating venue:", error);
            toast.error("An error occurred while updating the venue.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded shadow-lg w-96">
                <h3 className="text-lg font-bold mb-4">Update Venue</h3>
                <input
                    type="text"
                    placeholder="Venue Name"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    className="border border-gray-300 p-2 rounded w-full mb-4"
                />
                <input
                    type="number"
                    placeholder="Max Occupancy"
                    value={maxOccupancy}
                    onChange={(e) => setMaxOccupancy(e.target.value)}
                    className="border border-gray-300 p-2 rounded w-full mb-4"
                />
                <div className="flex justify-end">
                    <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={onClose} className="ml-2 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateVenueModal;
