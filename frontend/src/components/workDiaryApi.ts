import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const workDiaryApi = {
  addScreenshot: async (data: {
    projectID: string;
    userID: string;
    taskID: string;
    screenshotTimeStamp: string;
    calcTimeStamp: string;
    screenshot: string;
    thumbnail: string;
    activeMemo?: string;
    mouseClicks?: number;
    keyboardClicks?: number;
  }) => {
    try {
      // Format click counts as JSON objects
      const mouseJSON = data.mouseClicks ? { clicks: data.mouseClicks } : null;
      const keyboardJSON = data.keyboardClicks ? { clicks: data.keyboardClicks } : null;

      // Send the data to the backend
      const response = await axios.post(`${API_BASE_URL}/api/workdiary`, {
        ...data,
        mouseJSON,
        keyboardJSON,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      });

      console.log('Screenshot added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding screenshot:', error);
      throw error;
    }
  },

  // Add a test function to verify click counts are working
  testClickCounts: async (projectID: string, userID: string, taskID: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/workdiary`, {
        projectID,
        userID,
        taskID,
        screenshotTimeStamp: new Date().toISOString(),
        calcTimeStamp: new Date().toISOString(),
        screenshot: 'test-screenshot',
        thumbnail: 'test-thumbnail',
        mouseClicks: 600,
        keyboardClicks: 100,
      });
      return response.data;
    } catch (error) {
      console.error('Error testing click counts:', error);
      throw error;
    }
  },
};
