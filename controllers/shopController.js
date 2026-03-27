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
    const { name, address, contact } = req.body;
    
    if (!name || !address) {
      return res.status(400).json({ success: false, message: 'Name and address are required' });
    }

    const newShop = await Shop.create({
      name,
      address,
      contact: contact || null
    });

    res.status(201).json({ success: true, data: newShop });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
