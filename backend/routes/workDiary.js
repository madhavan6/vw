const express = require("express");
const router = express.Router();
const db = require("../db");


router.get('/all', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id,
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
        thumbNailURL,
        createdAt,
        modifiedAt
      FROM workDiary
    `);

    res.json(rows); // Send the full result
  } catch (error) {
    console.error('Error fetching workDiary:', error);
    res.status(500).json({ error: 'Database fetch error' });
  }
});
// Simple test route to verify basic functionality
router.get("/ping", (req, res) => {
  res.json({ status: "ok", message: "WorkDiary routes are working" });
});
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { upload } = require("../server"); // Import global multer instance

// Helper: Convert buffer to base64
function toBase64(fileBuffer) {
  return fileBuffer.toString("base64");
}

// Helper: Save base64 image to filesystem
function saveBase64Image(base64String, options = {}) {
  const {
    rootFolder = "public/images",
    projectID = "unknownProject",
    taskID = "unknownTask",
    timestamp = new Date().toISOString(),
  } = options;

  console.log("Saving image with options:", { 
    rootFolder,
    projectID,
    taskID,
    timestamp
  });

  // Validate base64 string
  const matches = base64String.match(/^data:(image\/png);base64,(.+)$/);
  if (!matches) {
    console.error("Invalid base64 string:", base64String);
    throw new Error("Invalid base64 string");
  }

  // Extract and validate data
  const [_, mimeType, data] = matches;
  if (mimeType !== 'image/png') {
    console.error("Invalid image type:", mimeType);
    throw new Error("Only PNG images are supported");
  }

  // Always use PNG format for screenshots
  const ext = "png";
  const fileName = `${uuidv4()}.${ext}`;
  const date = new Date(timestamp).toISOString().split("T")[0]; // YYYY-MM-DD

  // Create full path using Windows path separators
  const folderPath = path.join(
    __dirname, // Use absolute path from current file
    rootFolder,
    `ProjectID_${projectID}`,
    `TaskID_${taskID}`,
    date
  );

  console.log("Creating folder path:", folderPath);

  // Create directories with proper permissions
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true, mode: 0o755 });
  }

  const filePath = path.join(folderPath, fileName);
  console.log("Saving to file path:", filePath);

  // Validate file size
  const decodedData = Buffer.from(data, 'base64');
  if (decodedData.length > 10 * 1024 * 1024) { // 10MB limit
    console.error("File too large:", decodedData.length);
    throw new Error("File size exceeds 10MB limit");
  }

  // Write to file
  try {
    fs.writeFileSync(filePath, decodedData);
    console.log("File saved successfully");
  } catch (err) {
    console.error("Error saving file:", err);
    throw err;
  }

  // Return path relative to public folder, ensuring Windows path separators
  const relativePath = path.relative(
    path.join(__dirname, rootFolder),
    filePath
  ).replace(/\\/g, '/'); // Normalize to forward slashes for URLs

  console.log("Returning relative path:", relativePath);
  return relativePath;
}

// Helper: Fetch image URL (incl. Google Drive) as base64
async function fetchImageAsBase64(imageURL) {
  try {
    let downloadURL = imageURL;

    if (imageURL.includes("drive.google.com")) {
      const fileIdMatch = imageURL.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]+)/);
      const fileId = fileIdMatch?.[1];
      if (fileId) {
        downloadURL = `https://drive.google.com/uc?export=download&id=${fileId}`;
      } else {
        throw new Error("Invalid Google Drive link");
      }
    }

    const response = await axios.get(downloadURL, {
      responseType: "arraybuffer",
    });
    return toBase64(response.data);
  } catch (err) {
    console.error("Image fetch error:", err.message);
    throw new Error("Failed to fetch image from URL");
  }
}

// Helper: Format ISO timestamp for MySQL
function formatDatetimeForMySQL(datetime) {
  return datetime.replace("T", " ").split(".")[0];
}

// Helper: Parse JSON safely
function tryParseJson(data) {
  try {
    return typeof data === "string"
      ? JSON.stringify(JSON.parse(data))
      : JSON.stringify(data);
  } catch (e) {
    return JSON.stringify({});
  }
}

// POST route to insert workDiary entry
router.post(
  "/",
  upload.fields([
    { name: "screenshot", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        projectID,
        userID,
        taskID,
        screenshotTimeStamp,
        calcTimeStamp,
        mouseClicks,
        keyboardClicks,
        activeJSON,
        activeFlag,
        activeMins,
        deletedFlag,
        activeMemo,
        imageURL,
        thumbNailURL,
      } = req.body;

      // Ensure click counts are numbers
      const mouseClicksNum = parseInt(mouseClicks || "0") || 0;
      const keyboardClicksNum = parseInt(keyboardClicks || "0") || 0;

      // Format click counts as JSON objects and convert to strings
      const mouseJSON = JSON.stringify({ clicks: mouseClicksNum });
      const keyboardJSON = JSON.stringify({ clicks: keyboardClicksNum });

      console.log("Storing click counts:", {
        mouseClicksNum,
        keyboardClicksNum,
      });
      console.log("JSON strings:", { mouseJSON, keyboardJSON });

      if (
        !projectID ||
        !userID ||
        !taskID ||
        !screenshotTimeStamp ||
        !calcTimeStamp
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const screenshotTimeStampFormatted =
        formatDatetimeForMySQL(screenshotTimeStamp);
      const calcTimeStampFormatted = formatDatetimeForMySQL(calcTimeStamp);

      let imageURLToStore = null;
      let thumbNailURLToStore = null;

      // Process images
      // ... (rest of the image processing code)

      // Update sanitizedData with formatted timestamps and image URLs
      const sanitizedData = {
        projectID,
        userID,
        taskID,
        mouseJSON,
        keyboardJSON,
        activeJSON: tryParseJson(activeJSON),
        activeFlag: activeFlag || null,
        activeMins: activeMins || 0,
        deletedFlag: deletedFlag || 0,
        activeMemo: activeMemo || "",
      };

      sanitizedData.screenshotTimeStamp = screenshotTimeStampFormatted;
      sanitizedData.calcTimeStamp = calcTimeStampFormatted;
      sanitizedData.imageURL = imageURLToStore;
      sanitizedData.thumbNailURL = thumbNailURLToStore;

      // Ensure image URLs are properly formatted and cleaned before saving
      const cleanPath = (path) => {
        if (!path) return null;
        // Remove any trailing quotes
        path = path.replace(/['"]+$/g, '');
        // Normalize slashes
        path = path.replace(/\\+/g, '/');
        // Remove leading slash if it exists
        path = path.replace(/^\/+/, '');
        return path;
      };

      // Clean up paths before saving
      sanitizedData.imageURL = cleanPath(imageURLToStore);
      sanitizedData.thumbNailURL = cleanPath(thumbNailURLToStore);

      // Screenshot
      if (req.files?.["screenshot"]) {
        const base64 = toBase64(req.files["screenshot"][0].buffer);
        imageURLToStore = saveBase64Image(`data:image/png;base64,${base64}`, {
          projectID,
          taskID,
          timestamp: screenshotTimeStamp,
        });
      } else if (imageURL?.startsWith("data:image")) {
        imageURLToStore = saveBase64Image(imageURL, {
          projectID,
          taskID,
          timestamp: screenshotTimeStamp,
        });
      } else if (imageURL) {
        const base64 = await fetchImageAsBase64(imageURL);
        imageURLToStore = saveBase64Image(`data:image/png;base64,${base64}`, {
          projectID,
          taskID,
          timestamp: screenshotTimeStamp,
        });
      }

      // Thumbnail
      if (req.files?.["thumbnail"]) {
        const base64 = toBase64(req.files["thumbnail"][0].buffer);
        thumbNailURLToStore = saveBase64Image(
          `data:image/png;base64,${base64}`,
          {
            projectID,
            taskID,
            timestamp: screenshotTimeStamp,
          }
        );
      } else if (thumbNailURL?.startsWith("data:image")) {
        thumbNailURLToStore = saveBase64Image(thumbNailURL, {
          projectID,
          taskID,
          timestamp: screenshotTimeStamp,
        });
      } else if (thumbNailURL) {
        const base64 = await fetchImageAsBase64(thumbNailURL);
        thumbNailURLToStore = saveBase64Image(
          `data:image/png;base64,${base64}`,
          {
            projectID,
            taskID,
            timestamp: screenshotTimeStamp,
          }
        );
      }

      sanitizedData.imageURL = cleanPath(imageURLToStore);
      sanitizedData.thumbNailURL = cleanPath(thumbNailURLToStore);

      // Update sanitizedData with click counts
      sanitizedData.mouseJSON = mouseJSON;
      sanitizedData.keyboardJSON = keyboardJSON;

      console.log("Final sanitizedData:", sanitizedData);

      // Insert into database
      console.log("Inserting data:", {
        projectID: sanitizedData.projectID,
        userID: sanitizedData.userID,
        taskID: sanitizedData.taskID,
        screenshotTimeStamp: sanitizedData.screenshotTimeStamp,
        calcTimeStamp: sanitizedData.calcTimeStamp,
        mouseJSON: sanitizedData.mouseJSON,
        keyboardJSON: sanitizedData.keyboardJSON,
        activeJSON: sanitizedData.activeJSON,
        activeFlag: sanitizedData.activeFlag,
        activeMins: sanitizedData.activeMins,
        deletedFlag: sanitizedData.deletedFlag,
        activeMemo: sanitizedData.activeMemo,
        imageURL: sanitizedData.imageURL,
        thumbNailURL: sanitizedData.thumbNailURL
      });

      const [result] = await db.execute(
        "INSERT INTO workDiary (projectID, userID, taskID, screenshotTimeStamp, calcTimeStamp, keyboardJSON, mouseJSON, activeJSON, activeFlag, activeMins, deletedFlag, activeMemo, imageURL, thumbNailURL) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          sanitizedData.projectID,
          sanitizedData.userID,
          sanitizedData.taskID,
          sanitizedData.screenshotTimeStamp,
          sanitizedData.calcTimeStamp,
          sanitizedData.keyboardJSON,
          sanitizedData.mouseJSON,
          sanitizedData.activeJSON,
          sanitizedData.activeFlag,
          sanitizedData.activeMins,
          sanitizedData.deletedFlag,
          sanitizedData.activeMemo,
          sanitizedData.imageURL,
          sanitizedData.thumbNailURL,
        ]
      );

      console.log("Database insert result:", result);

      res
        .status(201)
        .json({ message: "Work diary entry created", id: result.insertId });
    } catch (err) {
      console.error("WorkDiary insert error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Test endpoint to verify connection
router.get("/test", (req, res) => {
  res.json({
    status: "ok",
    message: "API is working",
  });
});

// Test endpoint to verify image URL
router.get("/test-image-url", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, imageURL, thumbNailURL, mouseJSON, keyboardJSON, activeMemo FROM workDiary WHERE deletedFlag = 0 LIMIT 1"
    );
    if (!rows || rows.length === 0) {
      return res.json({ error: "No screenshots found" });
    }

    const screenshot = rows[0];
    res.json({
      id: screenshot.id,
      imageURL: screenshot.imageURL,
      thumbNailURL: screenshot.thumbNailURL,
      formattedImageURL: screenshot.imageURL?.startsWith("http")
        ? screenshot.imageURL
        : `http://localhost:5000${screenshot.imageURL}`,
      formattedThumbNailURL: screenshot.thumbNailURL?.startsWith("http")
        ? screenshot.thumbNailURL
        : `http://localhost:5000${screenshot.thumbNailURL}`,
    });
  } catch (err) {
    console.error("Test image URL error:", err);
    res.status(500).json({ error: "Failed to fetch image URL" });
  }
});

// GET all screenshots
router.get("/all", async (req, res) => {
  try {
    console.log("Fetching all data from workDiary table...");
    const [rows] = await db.execute(
      "SELECT * FROM workDiary WHERE deletedFlag = 0 ORDER BY screenshotTimeStamp DESC"
    );
    
    console.log("Raw database rows:", rows);

    // Format the response data
    const formattedData = rows.map((row) => {
      // Use the objects directly if they exist, otherwise create default objects
      const mouseJSON = row.mouseJSON || { clicks: 0 };
      const keyboardJSON = row.keyboardJSON || { clicks: 0 };
      const activeJSON = row.activeJSON || { apps: [] };
      
      // Check if image files exist locally
      const checkLocalImage = (relativePath) => {
        if (!relativePath) return null;
        const localPath = path.join(__dirname, 'public/images', relativePath.replace(/^\/+/, ''));
        return fs.existsSync(localPath) ? localPath : null;
      };

      const localScreenshot = checkLocalImage(row.imageURL);
      const localThumbnail = checkLocalImage(row.thumbNailURL);

      console.log('Image file check:', {
        localScreenshot,
        localThumbnail,
        screenshotExists: !!localScreenshot,
        thumbnailExists: !!localThumbnail
      });

      // Format URLs
      const screenshot = localScreenshot ? 
        `http://localhost:5000/images/${path.relative(path.join(__dirname, 'public/images'), localScreenshot).replace(/\\/g, '/')}` : 
        null;

      const thumbnail = localThumbnail ? 
        `http://localhost:5000/images/${path.relative(path.join(__dirname, 'public/images'), localThumbnail).replace(/\\/g, '/')}` : 
        null;
      
      return {
        id: row.id,
        projectID: row.projectID,
        userID: row.userID,
        taskID: row.taskID,
        screenshotTimeStamp: row.screenshotTimeStamp,
        calcTimeStamp: row.calcTimeStamp,
        timestamp: row.screenshotTimeStamp,
        screenshot,
        thumbnail,
        activeMemo: row.activeMemo || "",
        activeFlag: row.activeFlag || false,
        activeMins: row.activeMins || 0,
        activeJSON,
        mouseJSON,
        keyboardJSON,
        mouseClicks: mouseJSON.clicks || 0,
        keyboardClicks: keyboardJSON.clicks || 0,
        deletedFlag: row.deletedFlag,
        imageURL: row.imageURL,
        thumbNailURL: row.thumbNailURL,
        createdAt: row.createdAt,
        modifiedAt: row.modifiedAt
      };
    });

    console.log("Formatted data sample:", {
      first: formattedData[0],
      last: formattedData[formattedData.length - 1]
    });
    
    res.json(formattedData);
  } catch (err) {
    console.error("Detailed error:", err);
    console.error("Error message:", err.message);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ error: "Failed to fetch screenshots" });
  }
});

module.exports = router;
