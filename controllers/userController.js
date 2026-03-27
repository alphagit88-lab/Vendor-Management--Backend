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
    const { name, phone, email, password, role } = req.body;
    
    const existingUser = await User.findByPhone(phone);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Phone already registered' });
    }

    const newUser = await User.create({
      name,
      phone,
      email,
      role: role || 'staff',
      password
    });

    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
