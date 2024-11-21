import React, { useState } from 'react';
import { Form, Input, Select, DatePicker, Upload, Button, Card, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

const TicketForm = () => {
  const [form] = Form.useForm();

  const ticketCategories = [
    'Venue Reservation',
    'Equipment Request',
    'Vehicle Booking',
    'Combined Reservation'
  ];

  const priorityLevels = [
    'Low',
    'Medium',
    'High',
    'Urgent'
  ];

  const onFinish = (values) => {
    console.log('Form values:', values);
    // Handle form submission
  };

  return (
    <Card title="Event Support Ticket" className="ticket-form">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item name="category" label="Ticket Category" rules={[{ required: true }]}>
          <Select placeholder="Select category">
            {ticketCategories.map(cat => (
              <Option key={cat} value={cat}>{cat}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="priority" label="Priority Level" rules={[{ required: true }]}>
          <Select placeholder="Select priority">
            {priorityLevels.map(level => (
              <Option key={level} value={level}>{level}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="eventDate" label="Event Date" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="venue" label="Venue Details">
          <TextArea rows={3} placeholder="Specify venue requirements and location" />
        </Form.Item>

        <Form.Item name="equipment" label="Equipment Required">
          <TextArea rows={3} placeholder="List required equipment and specifications" />
        </Form.Item>

        <Form.Item name="vehicle" label="Vehicle Requirements">
          <TextArea rows={3} placeholder="Specify vehicle type and capacity needed" />
        </Form.Item>

        <Form.Item name="description" label="Additional Details" rules={[{ required: true }]}>
          <TextArea rows={4} placeholder="Provide any additional information" />
        </Form.Item>

        <Form.Item name="attachments" label="Attachments">
          <Upload>
            <Button icon={<UploadOutlined />}>Upload Files</Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Submit Ticket
            </Button>
            <Button onClick={() => form.resetFields()}>
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default TicketForm;
