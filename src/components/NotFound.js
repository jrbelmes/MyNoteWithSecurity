import React from 'react';
import { Modal, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

const NotFound = ({ isVisible, onClose }) => {
  const navigate = useNavigate();

  const handleClose = () => {
    onClose();
    navigate(-1);
  };

  return (
    <Modal
      open={isVisible}
      onCancel={handleClose}
      footer={null}
      closable={true}
      maskClosable={false}
    >
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
      />
    </Modal>
  );
};

export default NotFound;
