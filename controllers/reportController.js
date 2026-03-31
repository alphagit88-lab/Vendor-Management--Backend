const Report = require('../models/Report');

exports.getSalesSummary = async (req, res) => {
  try {
    const summary = await Report.getSalesSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getTopCustomers = async (req, res) => {
  try {
    const top = await Report.getTopCustomers();
    res.json({ success: true, data: top });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getInventoryAlerts = async (req, res) => {
  try {
    const alerts = await Report.getInventoryStatus();
    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
