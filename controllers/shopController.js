const Shop = require('../models/Shop');

exports.getShops = async (req, res) => {
  try {
    const shops = await Shop.findAll();
    res.json({ success: true, data: shops });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.createShop = async (req, res) => {
  try {
    const { name, address, contact, account_id, permit_numbers } = req.body;
    
    if (!name || !address) {
      return res.status(400).json({ success: false, message: 'Name and address are required' });
    }

    const newShop = await Shop.create({
      name,
      address,
      contact: contact || null,
      account_id: account_id || null,
      permit_numbers: permit_numbers || null
    });

    res.status(201).json({ success: true, data: newShop });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, contact, account_id, permit_numbers } = req.body;
    const updatedShop = await Shop.update(id, { name, address, contact, account_id, permit_numbers });
    if (!updatedShop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }
    res.json({ success: true, data: updatedShop });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.deleteShop = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Shop.delete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }
    res.json({ success: true, message: 'Shop deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
