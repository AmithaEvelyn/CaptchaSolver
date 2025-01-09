
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const svgCaptcha = require('svg-captcha');
const svg2img = require('svg2img');
const Jimp = require('jimp'); 
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(cors());

let currentCaptcha = '';

app.get('/api/captcha', (req, res) => {
  
  const captchaSize = Math.floor(Math.random() * 3) + 4;  
  const captcha = svgCaptcha.create({
    size: captchaSize, 
    ignoreChars: '01lABCDEFGHIJKLMNOPQRSTUVWXYZ',
    noise: 3, 
    color: false, 
    width: "150"
  });

  currentCaptcha = captcha.text.toLowerCase();

  svg2img(captcha.data, { format: 'png' }, async (error, buffer) => {
    if (error) {
      console.error('Error converting SVG to PNG:', error);
      return res.status(500).json({ success: false, message: 'Failed to generate CAPTCHA.' });
    }

    try {
     
      const image = await Jimp.read(buffer);

      const captchaImage = new Jimp(image.bitmap.width, image.bitmap.height, 0xffffffff); 
      captchaImage.composite(image, 0, 0);

      const captchaPath = path.join(__dirname, 'captcha.png');
      await captchaImage.writeAsync(captchaPath);
      
      res.json({ url: `${req.protocol}://${req.get('host')}/captcha.png` });
    } catch (jimpError) {
      console.error('Error processing CAPTCHA image with Jimp:', jimpError);
      res.status(500).json({ success: false, message: 'Failed to process CAPTCHA image.' });
    }
  });
});

app.use('/captcha.png', (req, res) => {
  const captchaPath = path.join(__dirname, 'captcha.png');
  res.sendFile(captchaPath);
});

app.post('/api/verify-captcha', (req, res) => {
  const { inputCaptcha } = req.body;

  if (!inputCaptcha) {
    console.log('no text');
    return res.status(400).json({ success: false, message: 'Input is required.' });
  }

  if (inputCaptcha.toLowerCase() === currentCaptcha) {
    currentCaptcha = ''; 

    const captchaPath = path.join(__dirname, 'captcha.png');
    if (fs.existsSync(captchaPath)) {
      fs.unlinkSync(captchaPath);
    }

    return res.status(200).json({ success: true, message: 'Verification Successful!' });
  } else {
    return res.status(400).json({ success: false, message: 'Verification Failed. Try Again!' });
  }
});

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
