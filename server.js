const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// 启用 CORS
app.use(cors());

// AbuseIPDB 代理端点
app.get('/api/abuseipdb', async (req, res) => {
  try {
    const { ipAddress, maxAgeInDays } = req.query;
    const response = await axios.get('https://api.abuseipdb.com/api/v2/check', {
      params: {
        ipAddress,
        maxAgeInDays
      },
      headers: {
        'Key': process.env.ABUSEIPDB_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// IP2Location 代理端点
app.get('/api/ip2location', async (req, res) => {
  try {
    const { ip } = req.query;
    const response = await axios.get('https://api.ip2location.io/', {
      params: {
        ip,
        key: process.env.IP2LOCATION_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`代理服务器运行在端口 ${PORT}`);
}); 