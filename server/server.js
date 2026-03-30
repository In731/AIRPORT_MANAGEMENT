require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Mount routes
app.use('/api/flights', require('./routes/flights'));
app.use('/api/passengers', require('./routes/passengers'));
app.use('/api/boarding', require('./routes/boarding'));
app.use('/api/staff', require('./routes/staff'));
// Login Route
app.post('/api/login', (req, res) => {
    const { id, password } = req.body;
    const adminId = process.env.ADMIN_ID || 'MNG-001';
    const adminPass = process.env.ADMIN_PASS || 'admin123';
    
    if (id === adminId && password === adminPass) {
        res.json({ success: true, token: 'mng-validated-token-' + Date.now() });
    } else {
        res.status(401).json({ success: false, error: 'Invalid Management ID or Password' });
    }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
