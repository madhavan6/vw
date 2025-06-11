import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Employee {
  id: string;
  projectId: string;
  taskId: string;
  screenshotInterval: number;
  displayName?: string;
}

interface ScreenshotData {
  id: number;
  projectID: string;
  userID: string;
  taskID: string;
  timestamp: string;
  screenshot: string;
  thumbnail: string;
  activeMemo: string;
  activeFlag: boolean;
  activeMins: number;
  activeJSON: object;
  mouseJSON: {
    clicks: number;
  };
  keyboardJSON: {
    clicks: number;
  };
}

interface DashboardProps {
  currentUser: {
    name: string;
    organization: string;
    isAdmin: boolean;
  };
}

export function Dashboard({ currentUser }: DashboardProps) {
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ScreenshotData | null>(null);
  const [activityData, setActivityData] = useState({ mouseClicks: 0, keyboardPresses: 0 });
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [groupedByHour, setGroupedByHour] = useState<Record<string, ScreenshotData[]>>({});

  useEffect(() => {
    const handleMouseClick = () => {
      setActivityData(prev => ({ ...prev, mouseClicks: prev.mouseClicks + 1 }));
    };

    const handleKeyboardPress = () => {
      setActivityData(prev => ({ ...prev, keyboardPresses: prev.keyboardPresses + 1 }));
    };

    window.addEventListener('mousedown', handleMouseClick);
    window.addEventListener('keydown', handleKeyboardPress);

    return () => {
      window.removeEventListener('mousedown', handleMouseClick);
      window.removeEventListener('keydown', handleKeyboardPress);
    };
  }, []);

  const handleScreenshotClick = async (screenshot: ScreenshotData) => {
    setSelected(screenshot);
    setActivityData({ mouseClicks: 0, keyboardPresses: 0 });
  };

  useEffect(() => {
    async function fetchScreenshots() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('http://localhost:5000/api/workdiary/all', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

        const text = await response.text();

        if (!response.ok) {
          throw new Error(text || 'Failed to fetch screenshots');
        }

        const data = JSON.parse(text);

        if (!data || !Array.isArray(data)) {
          throw new Error('Invalid screenshots data');
        }

        const screenshots = data.map((row: any) => {
          const raw = row.timestamp ?? row.screenshotTimeStamp ?? row.calcTimeStamp;
          const timestamp = raw && typeof raw === "string" ? raw : new Date().toISOString();

          const keyboardData = row.keyboardJSON || { clicks: 0 };
          const mouseData = row.mouseJSON || { clicks: 0 };
          const activeData = row.activeJSON || {};

          return {
            id: row.id,
            projectID: row.projectID,
            userID: row.userID,
            taskID: row.taskID,
            timestamp,
            screenshot: row.imageURL,
            thumbnail: row.thumbNailURL,
            mouseJSON: mouseData,
            keyboardJSON: keyboardData,
            activeMemo: row.activeMemo || '',
            activeFlag: row.activeFlag,
            activeMins: row.activeMins,
            activeJSON: activeData
          };
        });

        setScreenshots(screenshots);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch screenshots');
        setScreenshots([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchScreenshots();
  }, []);

  useEffect(() => {
    // Filter screenshots for selected date
    const filtered = screenshots.filter((screenshot) => {
      const screenshotDate = new Date(screenshot.timestamp).toISOString().split('T')[0];
      return screenshotDate === selectedDate;
    });

    // Group by hour range
    const grouped: Record<string, ScreenshotData[]> = {};

    filtered.forEach((entry) => {
      const hour = new Date(entry.timestamp).getHours();
      const label = `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`;
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(entry);
    });

    setGroupedByHour(grouped);
  }, [screenshots, selectedDate]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Employee Screenshots</h1>
            <p className="text-muted-foreground">View screenshots organized by date and time</p>
            <div className="mt-4">
              <label className="font-medium mr-2">Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border px-2 py-1 rounded dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {error && <div className="text-red-500 text-center">{error}</div>}

      {!isLoading && !error && screenshots.length === 0 && (
        <p className="text-center text-muted-foreground">No screenshots available in the database.</p>
      )}

      {!isLoading && !error && Object.keys(groupedByHour).length > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedByHour).map(([hourRange, entries]) => (
            <div key={hourRange} className="border border-gray-300 rounded-md p-4 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">{hourRange}</h2>
              <div className="flex flex-wrap gap-4">
                {entries.map((screenshot) => (
                <div
                key={screenshot.id}
                className="w-32 h-20 cursor-pointer relative rounded-md overflow-hidden border border-gray-300 dark:border-gray-600"
                onClick={() => handleScreenshotClick(screenshot)}
                title={`Screenshot at ${new Date(screenshot.timestamp).toLocaleString()}`}
              >
                <img
                  src={`http://localhost:5000${screenshot.thumbnail}`}
                  alt="Thumbnail"
                  className="w-full h-full object-cover rounded-md"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src =
                      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
                  }}
                />
              </div>
              
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-5xl max-h-[80vh] overflow-auto text-black flex gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`http://localhost:5000${selected.screenshot}`}
              alt="Screenshot"
              style={{ width: '100%', maxWidth: '500px', borderRadius: '8px' }}
            />
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">Activity Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Mouse Clicks:</span>
                  <span>{selected.mouseJSON?.clicks ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Keyboard Clicks:</span>
                  <span>{selected.keyboardJSON?.clicks ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Minutes:</span>
                  <span>{selected.activeMins ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Activity Flag:</span>
                  <span>{selected.activeFlag ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Memo:</span>
                  <span>{selected.activeMemo || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Timestamp:</span>
                  <span>{new Date(selected.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
