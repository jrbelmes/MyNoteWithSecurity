import React from 'react';
import { Modal, Result } from 'antd';

const NotFound = ({ isVisible, onClose }) => {
  return (
    <Modal
      open={isVisible}
      onCancel={onClose}
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
