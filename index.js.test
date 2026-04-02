const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Minimal test server is running' });
});

// Fallback
app.use((req, res) => {
  res.status(404).json({ message: 'Minimal server: Route not found' });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Minimal server on ${PORT}`));
}

module.exports = app;
