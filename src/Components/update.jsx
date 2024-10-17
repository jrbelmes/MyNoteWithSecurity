import { Container, Table, Form, Button, Row, Col } from "react-bootstrap";
import { useState } from "react";
import axios from "axios";

const UpdateVehicle = ({ vehicleDetails, closeModal, refreshRecords }) => {
  const mainUrl = sessionStorage.mainURL;

  const [vehicle, setVehicle] = useState({
    vehicleId: vehicleDetails.vehicleId,
    vehicleName: vehicleDetails.vehicleName,
    vehicleType: vehicleDetails.vehicleType,
    vehicleLicense: vehicleDetails.vehicleLicense,
    vehicleColor: vehicleDetails.vehicleColor,
  });

  const updateVehicle = async () => {
    const url = `${mainUrl}vehicles.php`;

    const jsonData = {
      vehicleId: vehicle.vehicleId,
      vehicleName: vehicle.vehicleName,
      vehicleType: vehicle.vehicleType,
      vehicleLicense: vehicle.vehicleLicense,
      vehicleColor: vehicle.vehicleColor,
    };

    const formData = new FormData();
    formData.append("operation", "updateVehicle");
    formData.append("json", JSON.stringify(jsonData));

    const response = await axios({
      url: url,
      method: "POST",
      data: formData,
    });

    if (response.data == 1) {
      alert("You have successfully UPDATED your vehicle!");
      refreshRecords();
    } else {
      alert("UPDATE failed!");
    }
  };

  return (
    <Container>
      <Table>
        <tbody>
          <tr>
            <td>Name</td>
            <td>
              <Form.Control
                type="text"
                value={vehicle.vehicleName}
                onChange={(e) => setVehicle({ ...vehicle, vehicleName: e.target.value })}
              />
            </td>
          </tr>
          <tr>
            <td>Type</td>
            <td>
              <Form.Control
                type="text"
                value={vehicle.vehicleType}
                onChange={(e) => setVehicle({ ...vehicle, vehicleType: e.target.value })}
              />
            </td>
          </tr>
          <tr>
            <td>License</td>
            <td>
              <Form.Control
                type="text"
                value={vehicle.vehicleLicense}
                onChange={(e) => setVehicle({ ...vehicle, vehicleLicense: e.target.value })}
              />
            </td>
          </tr>
          <tr>
            <td>Color</td>
            <td>
              <Form.Control
                type="text"
                value={vehicle.vehicleColor}
                onChange={(e) => setVehicle({ ...vehicle, vehicleColor: e.target.value })}
              />
            </td>
          </tr>
        </tbody>
      </Table>

      <Row>
        <Col lg={6} className="text-end">
          <Button variant="secondary" onClick={closeModal} className="me-2 w-75">
            Close
          </Button>
        </Col>
        <Col lg={6} className="text-start">
          <Button
            variant="primary"
            onClick={() => {
              updateVehicle();
              closeModal();
            }}
            className="ms-2 w-75"
          >
            Update
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default UpdateVehicle;
