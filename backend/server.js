const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const cors = require('cors');

const app = express();
const port = 3101;

app.use(cors({ origin: '*', methods: '*' }));
app.use(express.json({ limit: '10mb' }));

const imageDir = path.join(__dirname, 'public/images');
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}
app.use('/images', express.static(imageDir));

// Test route
app.post('/test', (req, res) => {
  res.send({ status: 'success' });
});

// Screenshot upload + DB insert route
app.post('/postProjectV1', async (req, res) => {
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
      imageURL,         // contains base64 image
      thumbNailURL,     // contains base64 thumbnail
    } = req.body;

    // Validate required fields
    if (!imageURL || !thumbNailURL || !projectID || !userID || !taskID) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Decode and save screenshot
    const screenshotMatch = imageURL.match(/^data:image\/(png|jpeg|jpg);base64,(.*)$/);
    const thumbnailMatch = thumbNailURL.match(/^data:image\/(png|jpeg|jpg);base64,(.*)$/);

    if (!screenshotMatch || !thumbnailMatch) {
      return res.status(400).json({ error: 'Invalid base64 image format' });
    }

    const screenshotExt = screenshotMatch[1];
     const screenshotBuffer = Buffer.from(screenshotMatch[2], 'base64');
    const screenshotFileName = `screenshot_${Date.now()}.${screenshotExt}`;
    const screenshotPath = path.join(imageDir, screenshotFileName);
    fs.writeFileSync(screenshotPath, screenshotBuffer);
    const savedImageURL = `/images/${screenshotFileName}`;

    const thumbExt = thumbnailMatch[1];
    const thumbBuffer = Buffer.from(thumbnailMatch[2], 'base64');
    const thumbFileName = `thumb_${Date.now()}.${thumbExt}`;
    const thumbPath = path.join(imageDir, thumbFileName);
    fs.writeFileSync(thumbPath, thumbBuffer);
    const savedThumbURL = `/images/${thumbFileName}`;

    // Insert into DB
await db.query(
  `INSERT INTO workDiary (
    projectID, userID, taskID, screenshotTimeStamp, calcTimeStamp,
    keyboardJSON, mouseJSON, activeJSON, activeFlag, activeMins,
    deletedFlag, activeMemo, imageURL, thumbNailURL,
    createdAt, modifiedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
  [
    projectID, userID, taskID, new Date(screenshotTimeStamp).toISOString().slice(0, 19).replace('T', ' '),
  new Date(calcTimeStamp).toISOString().slice(0, 19).replace('T', ' '),
    JSON.stringify(keyboardJSON), JSON.stringify(mouseJSON), JSON.stringify(activeJSON),
    activeFlag, activeMins, deletedFlag, activeMemo,
    savedImageURL, savedThumbURL
 ]
);


    res.status(200).json({
      message: 'Screenshot and thumbnail saved successfully',
      imageURL: savedImageURL,
      thumbNailURL: savedThumbURL,
    });
  } catch (error) {
    console.error('❌ Error processing request:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});


// Fix your GET routes (close the brackets properly)
app.get('/getProjectsV2', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM projects');
    res.status(200).json(rows);
  } catch (error) {
    console.error('❌ Error fetching projects:', error.message);
    res.status(500).json({ error: 'Failed to fetch projects', details: error.message });
  }
});

app.get('/getProjectsV3', async (req, res) => {
  try {
      const [rows] = await db.query('SELECT * FROM tasks');
    res.status(200).json(rows);
  } catch (error) {
    console.error('❌ Error fetching tasks:', error.message);
    res.status(500).json({ error: 'Failed to fetch tasks', details: error.message });
  }
});

app.get('/getProjectsV4', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM workDiary');
    res.status(200).json(rows);
  } catch (error) {
    console.error('❌ Error fetching workDiary:', error.message);
    res.status(500).json({ error: 'Failed to fetch workDiary', details: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`✅ Server running on http://0.0.0.0:${port}`);
});