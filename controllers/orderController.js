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
    console.log(`🔍 FETCHING ORDER DETAIL: ${id}`);
    const order = await Order.findById(id);
    if (!order) {
      console.warn(`⚠️ ORDER NOT FOUND: ${id}`);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    console.log(`✅ ORDER RETRIEVED: ${id}`);
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('🔴 GET ORDER ERROR details:', {
      message: error.message,
      stack: error.stack,
      id: req.params.id
    });
    res.status(500).json({ success: false, message: 'Server Error', detail: error.message, stack: error.stack });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { customerId, customer_id, user_id, items, notes, load_number, total_credits, total_deposit } = req.body;
    
    // Simple order number generation (e.g., ORD-timestamp)
    const order_number = `ORD-${Date.now().toString().slice(-8)}`;

    const total_amount = items.reduce((acc, item) => acc + parseFloat(item.subtotal || 0), 0);

    const newOrder = await Order.create({
      order_number,
      customer_id: customer_id || customerId,
      user_id: user_id || req.user.id,
      total_amount,
      total_credits: total_credits || 0,
      total_deposit: total_deposit || 0,
      status: 'pending',
      notes,
      load_number,
      items
    });

    // --- Generate Bill PDF ---
    let billUrl = null;
    try {
      const { generateBill } = require('../utils/billGenerator');
      
      // Fetch full order with customer details for the bill
      const fullOrder = await Order.findById(newOrder.id);
      
      const fileName = await generateBill({
        order: fullOrder,
        customer: {
          name: fullOrder.customer_name,
          address: fullOrder.customer_address || 'Address not available',
          phone: fullOrder.customer_phone || '',
          account_id: fullOrder.account_id,
          tobacco_permit_number: fullOrder.tobacco_permit_number
        },
        items: fullOrder.items,
        salesperson: { name: fullOrder.user_name },
        shop: {} // Will use defaults in generator
      });

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      billUrl = `${baseUrl}/uploads/bills/${fileName}`;
      console.log(`📄 BILL GENERATED: ${billUrl}`);
    } catch (billError) {
      console.error('⚠️ Bill Generation failed:', billError.message);
    }

    res.status(201).json({ 
      success: true, 
      data: newOrder,
      bill: billUrl ? {
        url: billUrl,
        file_name: `bill_${order_number}.pdf`
      } : null,
      bill_generation_error: billUrl ? null : 'Failed to generate receipt'
    });
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
