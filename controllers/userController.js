const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, phone, email, password, role, inventory_location } = req.body;
    
    const existingUser = await User.findByPhone(phone);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Phone already registered' });
    }

    const newUser = await User.create({
      name,
      phone,
      email,
      role: role || 'staff',
      password,
      inventory_location
    });

    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, inventory_location } = req.body;
    const updatedUser = await User.update(id, { name, email, role, inventory_location });
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.delete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
