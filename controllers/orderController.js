const Order = require('../models/Order');

exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const orders = await Order.findAll(userId);
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { customer_id, user_id, items, notes, load_number, total_credits, total_deposit } = req.body;
    
    // Simple order number generation (e.g., ORD-timestamp)
    const order_number = `ORD-${Date.now().toString().slice(-8)}`;

    const total_amount = items.reduce((acc, item) => acc + item.subtotal, 0);

    const newOrder = await Order.create({
      order_number,
      customer_id,
      user_id: user_id || req.user.id,
      total_amount,
      total_credits: total_credits || 0,
      total_deposit: total_deposit || 0,
      status: 'pending',
      notes,
      load_number,
      items
    });

    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    console.error('🔴 CREATE ORDER ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      detail: error.message,
      stack: error.stack 
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedOrder = await Order.updateStatus(id, status);
    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Order.delete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
