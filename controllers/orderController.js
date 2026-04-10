const Order = require('../models/Order');
const { generateOrderBill } = require('../utils/billGenerator');

const buildBill = async (orderId) => {
  const billOrder = await Order.findBillById(orderId);

  if (!billOrder) {
    return null;
  }

  const bill = await generateOrderBill(billOrder);

  return {
    order_id: billOrder.id,
    order_number: billOrder.order_number,
    customer_name: billOrder.dba || billOrder.customer_name,
    ...bill,
  };
};

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
    console.log(`[orders] fetching detail: ${id}`);
    const order = await Order.findById(id);
    if (!order) {
      console.warn(`[orders] not found: ${id}`);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    console.log(`[orders] retrieved: ${id}`);
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('[orders] get error details:', {
      message: error.message,
      stack: error.stack,
      id: req.params.id,
    });
    res.status(500).json({ success: false, message: 'Server Error', detail: error.message, stack: error.stack });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { customer_id, user_id, items, notes, load_number, total_credits, total_deposit } = req.body;
    const orderItems = Array.isArray(items) ? items : [];

    const order_number = `ORD-${Date.now().toString().slice(-8)}`;
    const total_amount = orderItems.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);

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
      items: orderItems,
    });

    let bill = null;
    let bill_generation_error = null;

    try {
      bill = await buildBill(newOrder.id);
    } catch (billError) {
      console.error('[orders] bill generation error:', billError);
      bill_generation_error = 'Order created successfully, but bill generation failed';
    }

    res.status(201).json({
      success: true,
      data: newOrder,
      bill,
      ...(bill_generation_error ? { bill_generation_error } : {}),
    });
  } catch (error) {
    console.error('[orders] create error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      detail: error.message,
      stack: error.stack,
    });
  }
};

exports.generateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findBillById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role !== 'admin' && Number(order.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const bill = await generateOrderBill(order);

    res.json({
      success: true,
      data: {
        order_id: order.id,
        order_number: order.order_number,
        customer_name: order.dba || order.customer_name,
        ...bill,
      },
    });
  } catch (error) {
    console.error('[orders] bill generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate bill',
      detail: error.message,
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
