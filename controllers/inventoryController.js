const Inventory = require('../models/Inventory');

exports.getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findAll();
    res.json({ success: true, data: inventory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { item_id, quantity_changed, type, notes } = req.body;
    
    if (!item_id || !quantity_changed || !type) {
      return res.status(400).json({ success: false, message: 'Item ID, quantity, and type are required' });
    }

    const updated = await Inventory.updateStock(item_id, quantity_changed, type, notes);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const { item_id } = req.query;
    const logs = await Inventory.getLogs(item_id);
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
