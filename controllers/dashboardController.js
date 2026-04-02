const pool = require('../config/database');

exports.getStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const queries = [
      // Total Users (Excluding Admin)
      pool.query('SELECT COUNT(*) FROM users WHERE role != $1', ['admin']),
      // Users from 30 days ago
      pool.query('SELECT COUNT(*) FROM users WHERE role != $1 AND created_at < $2', ['admin', thirtyDaysAgo]),

      // Total Customers
      pool.query('SELECT COUNT(*) FROM customers'),
      // Customers from 30 days ago
      pool.query('SELECT COUNT(*) FROM customers WHERE created_at < $1', [thirtyDaysAgo]),

      // Total Items
      pool.query('SELECT COUNT(*) FROM items'),
      // Items from 30 days ago
      pool.query('SELECT COUNT(*) FROM items WHERE created_at < $1', [thirtyDaysAgo]),

      // Total Orders
      pool.query('SELECT COUNT(*) FROM orders'),
      // Orders from 30 days ago
      pool.query('SELECT COUNT(*) FROM orders WHERE created_at < $1', [thirtyDaysAgo])
    ];

    const results = await Promise.all(queries);

    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    const stats = {
      users: {
        value: parseInt(results[0].rows[0].count),
        change: calculateChange(parseInt(results[0].rows[0].count), parseInt(results[1].rows[0].count))
      },
      shops: {
        value: parseInt(results[2].rows[0].count),
        change: calculateChange(parseInt(results[2].rows[0].count), parseInt(results[3].rows[0].count))
      },
      items: {
        value: parseInt(results[4].rows[0].count),
        change: calculateChange(parseInt(results[4].rows[0].count), parseInt(results[5].rows[0].count))
      },
      orders: {
        value: parseInt(results[6].rows[0].count),
        change: calculateChange(parseInt(results[6].rows[0].count), parseInt(results[7].rows[0].count))
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
