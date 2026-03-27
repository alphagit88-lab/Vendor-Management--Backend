const Item = require('../models/Item');

exports.getItems = async (req, res) => {
  try {
    const items = await Item.findAll();
    res.json({ success: true, data: items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.createItem = async (req, res) => {
  try {
    const { name, price, description } = req.body;
    
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
    }

    const newItem = await Item.create({
      name,
      price,
      description: description || null
    });

    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
