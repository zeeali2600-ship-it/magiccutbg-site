// Backend proxy for ClippingMagic API
// DO NOT put secrets in code. Set env vars: CLIPPINGMAGIC_ID, CLIPPINGMAGIC_SECRET
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
app.use(cors({ origin: true })); // adjust origin in production

const upload = multer(); // memory storage
const CLIPPING_API_UPLOAD = 'https://clippingmagic.com/api/v1/images';

// Health
app.get('/api/ping', (req,res)=>res.json({ok:true}));

// Remove background (upload + forward). Depending on ClippingMagic workflow you may need extra steps.
app.post('/api/remove', upload.single('image'), async (req,res) => {
  try {
    if(!req.file) return res.status(400).json({error:'No image uploaded'});

    const form = new FormData();
    form.append('image', req.file.buffer, { filename: req.file.originalname });

    const response = await axios.post(CLIPPING_API_UPLOAD, form, {
      auth: {
        username: process.env.CLIPPINGMAGIC_ID,
        password: process.env.CLIPPINGMAGIC_SECRET
      },
      headers: form.getHeaders(),
      timeout: 60000
    });

    // If response includes an id and requires further processing (e.g. polling), we will add that later.
    res.json(response.data);
  } catch (e) {
    console.error('ClippingMagic error:', e.response ? e.response.data : e.message);
    res.status(500).json({ error: 'Processing failed', details: e.response ? e.response.data : e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log('MagicCutBG backend running on port ' + port));
