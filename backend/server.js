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

// Upload screenshot and insert into DB
app.post('/postProjectV1', async (req, res) => {
  try {
    const {
      projectID,
      userID,
      taskID,
      screenshotTimeStamp,
      calcTimeStamp,
      activeJSON,
      activeMins,
      deletedFlag,
      activeMemo,
      imageURL,
      thumbNailURL
    } = req.body;

    if (!imageURL || !thumbNailURL || !projectID || !userID || !taskID) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

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

    const formattedScreenshotTime = new Date(screenshotTimeStamp).toISOString().replace('T', ' ').slice(0, 19);
    const formattedCalcTime = new Date(calcTimeStamp).toISOString().replace('T', ' ').slice(0, 19);

    await db.execute(
      `INSERT INTO workDiary (
        projectID, userID, taskID, screenshotTimeStamp, calcTimeStamp,
        activeJSON, activeMins, deletedFlag, activeMemo,
        imageURL, thumbNailURL
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectID,
        userID,
        taskID,
        formattedScreenshotTime,
        formattedCalcTime,
        JSON.stringify(activeJSON),
        activeMins,
        deletedFlag,
        activeMemo,
        savedImageURL,
        savedThumbURL
      ]
    );

    res.status(200).json({
      message: 'Screenshot and activity data saved successfully',
      imageURL: savedImageURL,
      thumbNailURL: savedThumbURL
    });
  } catch (error) {
    console.error('❌ Error processing request:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// GET route with joined names (latest version)
app.get('/getProjectsV6', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        wd.id, wd.projectID, wd.userID, wd.taskID,
        wd.screenshotTimeStamp,
        wd.activeJSON, wd.activeMins, wd.deletedFlag, wd.activeMemo,
        wd.imageURL, wd.thumbNailURL, wd.createdAt, wd.modifiedAt,
        u.name AS userName,
        p.name AS projectName,
        t.name AS taskName
      FROM workDiary wd
      LEFT JOIN users u ON wd.userID = u.id
      LEFT JOIN projects p ON wd.projectID = p.id
      LEFT JOIN tasks t ON wd.taskID = t.id
      WHERE wd.deletedFlag = 0
      ORDER BY wd.screenshotTimeStamp DESC
    `);

    const data = rows.map((row) => {
      let parsedActiveJSON = [];

      try {
        const raw = Array.isArray(row.activeJSON) ? row.activeJSON : [];
        parsedActiveJSON = raw.map(item => [
          item.mouse ?? 0,
          item.keyboard ?? 0,
          item.active ?? 0
        ]);
      } catch (e) {
        console.warn('  Error processing activeJSON for ID:', row.id, e.message);
      }

      return {
        id: row.id,
        projectID: row.projectID,
        userID: row.userID,
        taskID: row.taskID,
        screenshotTimeStamp: row.screenshotTimeStamp,
        activeJSON: parsedActiveJSON,
        activeMins: row.activeMins,
        deletedFlag: row.deletedFlag,
        activeMemo: row.activeMemo,
        imageURL: row.imageURL,
        thumbNailURL: row.thumbNailURL,
        createdAt: row.createdAt,
        modifiedAt: row.modifiedAt,
        userName: row.userName ?? 'N/A',
        projectName: row.projectName ?? 'N/A',
        taskName: row.taskName ?? 'N/A'
      };
    });

    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Error fetching activity data:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Supporting routes for fetching data
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


app.listen(port, () => {
  console.log(`✅ Server running on http://0.0.0.0:${port}`);
});
