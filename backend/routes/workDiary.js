const express = require('express');
const router = express.Router();
const db = require('../db');

// Simple test route to verify basic functionality
router.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'WorkDiary routes are working' });
});
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { upload } = require('../server'); // Import global multer instance

// Helper: Convert buffer to base64
function toBase64(fileBuffer) {
  return fileBuffer.toString('base64');
}

// Helper: Save base64 image to filesystem
function saveBase64Image(base64String, options = {}) {
  const {
    rootFolder = 'public/images',
    projectID = 'unknownProject',
    taskID = 'unknownTask',
    timestamp = new Date().toISOString()
  } = options;

  const matches = base64String.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid base64 string');

  const ext = matches[1].split('/')[1];
  const data = matches[2];
  const fileName = `${uuidv4()}.${ext}`;
  const date = new Date(timestamp).toISOString().split('T')[0]; // YYYY-MM-DD

  const folderPath = path.join(rootFolder, `ProjectID_${projectID}`, `TaskID_${taskID}`, date);
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

  const filePath = path.join(folderPath, fileName);
  fs.writeFileSync(filePath, data, { encoding: 'base64' });

  return filePath.replace(/^public/, '').replace(/\\/g, '/');
}

// Helper: Fetch image URL (incl. Google Drive) as base64
async function fetchImageAsBase64(imageURL) {
  try {
    let downloadURL = imageURL;

    if (imageURL.includes('drive.google.com')) {
      const fileIdMatch = imageURL.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]+)/);
      const fileId = fileIdMatch?.[1];
      if (fileId) {
        downloadURL = `https://drive.google.com/uc?export=download&id=${fileId}`;
      } else {
        throw new Error('Invalid Google Drive link');
      }
    }

    const response = await axios.get(downloadURL, { responseType: 'arraybuffer' });
    return toBase64(response.data);
  } catch (err) {
    console.error('Image fetch error:', err.message);
    throw new Error('Failed to fetch image from URL');
  }
}

// Helper: Format ISO timestamp for MySQL
function formatDatetimeForMySQL(datetime) {
  return datetime.replace('T', ' ').split('.')[0];
}

// Helper: Parse JSON safely
function tryParseJson(data) {
  try {
    return typeof data === 'string' ? JSON.stringify(JSON.parse(data)) : JSON.stringify(data);
  } catch (e) {
    return JSON.stringify({});
  }
}

// POST route to insert workDiary entry
router.post(
  '/',
  upload.fields([
    { name: 'screenshot', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        projectID,
        userID,
        taskID,
        screenshotTimeStamp,
        calcTimeStamp,
        keyboardJSON,
        mouseJSON,
        activeJSON,
        activeFlag,
        activeMins,
        deletedFlag,
        activeMemo,
        imageURL,
        thumbNailURL
      } = req.body;

      if (!projectID || !userID || !taskID || !screenshotTimeStamp || !calcTimeStamp) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const screenshotTimeStampFormatted = formatDatetimeForMySQL(screenshotTimeStamp);
      const calcTimeStampFormatted = formatDatetimeForMySQL(calcTimeStamp);

      let imageURLToStore = null;
      let thumbNailURLToStore = null;

      // Screenshot
      if (req.files?.['screenshot']) {
        const base64 = toBase64(req.files['screenshot'][0].buffer);
        imageURLToStore = saveBase64Image(`data:image/png;base64,${base64}`, {
          projectID,
          taskID,
          timestamp: screenshotTimeStamp
        });
      } else if (imageURL?.startsWith('data:image')) {
        imageURLToStore = saveBase64Image(imageURL, {
          projectID,
          taskID,
          timestamp: screenshotTimeStamp
        });
      } else if (imageURL) {
        const base64 = await fetchImageAsBase64(imageURL);
        imageURLToStore = saveBase64Image(`data:image/png;base64,${base64}`, {
          projectID,
          taskID,
          timestamp: screenshotTimeStamp
        });
      }

      // Thumbnail
      if (req.files?.['thumbnail']) {
        const base64 = toBase64(req.files['thumbnail'][0].buffer);
        thumbNailURLToStore = saveBase64Image(`data:image/png;base64,${base64}`, {
          projectID,
          taskID,
          timestamp: screenshotTimeStamp
        });
      } else if (thumbNailURL?.startsWith('data:image')) {
        thumbNailURLToStore = saveBase64Image(thumbNailURL, {
          projectID,
          taskID,
          timestamp: screenshotTimeStamp
        });
      } else if (thumbNailURL) {
        const base64 = await fetchImageAsBase64(thumbNailURL);
        thumbNailURLToStore = saveBase64Image(`data:image/png;base64,${base64}`, {
          projectID,
          taskID,
          timestamp: screenshotTimeStamp
        });
      }

      const sanitizedData = {
        projectID,
        userID,
        taskID,
        screenshotTimeStamp: screenshotTimeStampFormatted,
        calcTimeStamp: calcTimeStampFormatted,
        keyboardJSON: tryParseJson(keyboardJSON),
        mouseJSON: tryParseJson(mouseJSON),
        activeJSON: tryParseJson(activeJSON),
        activeFlag: activeFlag || null,
        activeMins: activeMins || null,
        deletedFlag: deletedFlag !== undefined ? deletedFlag : 0,
        activeMemo: activeMemo || null,
        imageURL: imageURLToStore,
        thumbNailURL: thumbNailURLToStore
      };

      const [result] = await db.execute(
        `INSERT INTO workDiary 
        (projectID, userID, taskID, screenshotTimeStamp, calcTimeStamp, keyboardJSON, mouseJSON, activeJSON, activeFlag, activeMins, deletedFlag, activeMemo, imageURL, thumbNailURL)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        Object.values(sanitizedData)
      );

      res.status(201).json({ message: 'Work diary entry created', id: result.insertId });
    } catch (err) {
      console.error('WorkDiary insert error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Test endpoint to verify connection
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend is working',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to verify image URL
router.get('/test-image-url', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, imageURL, thumbNailURL FROM workDiary WHERE deletedFlag = 0 LIMIT 1'
    );
    if (!rows || rows.length === 0) {
      return res.json({ error: 'No screenshots found' });
    }
    
    const screenshot = rows[0];
    res.json({
      id: screenshot.id,
      imageURL: screenshot.imageURL,
      thumbNailURL: screenshot.thumbNailURL,
      formattedImageURL: screenshot.imageURL?.startsWith('http') 
        ? screenshot.imageURL 
        : `http://localhost:5000${screenshot.imageURL}`,
      formattedThumbNailURL: screenshot.thumbNailURL?.startsWith('http') 
        ? screenshot.thumbNailURL 
        : `http://localhost:5000${screenshot.thumbNailURL}`
    });
  } catch (err) {
    console.error('Test image URL error:', err);
    res.status(500).json({ error: 'Failed to fetch image URL' });
  }
});

// GET all screenshots
router.get('/all', async (req, res) => {
  try {
    console.log('Fetching screenshots from database...');
    const [rows] = await db.execute(
      'SELECT id, screenshotTimeStamp as timestamp, imageURL, thumbNailURL FROM workDiary WHERE deletedFlag = 0 ORDER BY screenshotTimeStamp DESC'
    );
    console.log('Found screenshots:', rows.length);
    
    // Ensure we have valid data
    if (!rows || !Array.isArray(rows)) {
      throw new Error('Invalid data format from database');
    }

    // Transform the data to ensure it's properly formatted
    const screenshots = rows.map(row => {
      // Ensure URLs are properly formatted
      const imageURL = row.imageURL?.startsWith('http') 
        ? row.imageURL 
        : `http://localhost:5000${row.imageURL}`;
      const thumbNailURL = row.thumbNailURL?.startsWith('http') 
        ? row.thumbNailURL 
        : `http://localhost:5000${row.thumbNailURL}`;
      
      return {
        id: row.id,
        timestamp: row.timestamp,
        imageURL,
        thumbNailURL
      };
    });

    // For debugging: send as plain text
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(JSON.stringify(screenshots, null, 2));
  } catch (err) {
    console.error('Detailed error:', err);
    console.error('Error message:', err.message);
    console.error('Stack trace:', err.stack);
    
    // For debugging: send as plain text
    res.setHeader('Content-Type', 'text/plain');
    res.status(500).send(`Error: ${err.message}\nStack: ${err.stack}`);
  }
});

// Optional test route
router.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'API is working' });
});

module.exports = router;
