import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': import.meta.env.VITE_API_KEY || '5a4c5612be62e5f4d90f33a71fd654d610e4636fbb9faf9a808cb1e542387e44',
  },
});

export const workDiaryApi = {
  testConnection: async () => {
    try {
      const response = await api.get('/api/test');
      console.log('Test connection response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error testing API connection:', error);
      throw error;
    }
  },
  getEmployees: async () => {
    try {
      const response = await api.get('/api/employees');
      console.log('Employees response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },
  getWorkDiary: async (userID: string, date: string) => {
    try {
      console.log('Fetching screenshots for user:', userID, 'date:', date);
      const response = await api.get('/api/screenshots', {
        params: {
          userID,
          date,
        },
      });
      console.log('API Response:', response);
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from API');
      }

      // Validate each screenshot entry
      const validatedData = response.data.map((item: any) => {
        if (!item.screenshotTimeStamp || !item.imageURL || !item.thumbNailURL) {
          throw new Error('Invalid screenshot data format');
        }
        return item;
      });

      return validatedData;
    } catch (error) {
      console.error('Error fetching screenshots:', error);
      throw error;
    }
  },
};
