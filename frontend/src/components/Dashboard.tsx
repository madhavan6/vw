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
    // Add other mouse-related properties if needed
  };
  keyboardJSON: {
    clicks: number;
    // Add other keyboard-related properties if needed
  };
}

interface DashboardProps {
  currentUser: {
    name: string;
    organization: string;
    isAdmin: boolean;
  };
}

interface GroupedScreenshots {
  [date: string]: ScreenshotData[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB'); // format dd/mm/yyyy
}

export function Dashboard({ currentUser }: DashboardProps) {
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ScreenshotData | null>(null);
  const [activityData, setActivityData] = useState({ mouseClicks: 0, keyboardPresses: 0 });

  // Track mouse and keyboard activity
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

  // Handle screenshot click
  const handleScreenshotClick = async (screenshot: ScreenshotData) => {
    setSelected(screenshot);
    // Reset activity counter when a screenshot is clicked
    setActivityData({ mouseClicks: 0, keyboardPresses: 0 });
  };

  // Fetch screenshots
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
        console.log("Fetched screenshot data:", text);

        if (!response.ok) {
          throw new Error(text || 'Failed to fetch screenshots');
        }

        const data = JSON.parse(text);

        if (!data || !Array.isArray(data)) {
          throw new Error('Invalid screenshots data');
        }

        console.log("Fetched screenshot data:", data);
        const screenshots = data.map((row: any) => {
          const raw = row.timestamp ?? row.screenshotTimeStamp ?? row.calcTimeStamp;
          const timestamp = raw && typeof raw === "string" ? raw : new Date().toISOString();

          // Get all JSON fields with fallbacks
          const keyboardData = row.keyboardJSON || { clicks: 0 };
          const mouseData = row.mouseJSON || { clicks: 0 };
          const activeData = row.activeJSON || {};

          console.log('Keyboard data:', keyboardData);
          console.log('Mouse data:', mouseData);
          console.log('Active data:', activeData);

          // Get click counts
          const keyboardClicks = keyboardData.clicks || 0;
          const mouseClicks = mouseData.clicks || 0;

          console.log('Keyboard clicks:', keyboardClicks);
          console.log('Mouse clicks:', mouseClicks);

          return {
            id: row.id,
            projectID: row.projectID,
            userID: row.userID,
            taskID: row.taskID,
            timestamp,
            screenshot: row.imageURL,
            thumbnail: row.thumbNailURL,
            mouseClicks,
            keyboardClicks,
            activeMemo: row.activeMemo || '',
            activeFlag: row.activeFlag,
            activeMins: row.activeMins,
            activeJSON: activeData,
            mouseJSON: mouseData,
            keyboardJSON: keyboardData
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

  // Group screenshots by date
  const groupedScreenshots: GroupedScreenshots = screenshots.reduce((groups, screenshot) => {
    const dateKey = formatDate(screenshot.timestamp);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(screenshot);
    return groups;
  }, {} as GroupedScreenshots);

  // Sort date keys descending (most recent first)
  const sortedDates = Object.keys(groupedScreenshots).sort((a, b) => {
    const [da, ma, ya] = a.split('/').map(Number);
    const [db, mb, yb] = b.split('/').map(Number);
    const dateA = new Date(2000 + ya, ma - 1, da);
    const dateB = new Date(2000 + yb, mb - 1, db);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Employee Screenshots</h1>
            <p className="text-muted-foreground">View screenshots organized by date and time</p>
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

      {!isLoading && !error && screenshots.length > 0 && (
        <div className="space-y-8">
          {sortedDates.map((date) => (
            <div
              key={date}
              className="border border-gray-300 rounded-md p-4 shadow-sm"
            >
              <h2 className="text-xl font-semibold mb-4">{date}</h2>
              <div className="flex flex-wrap gap-4">
                {groupedScreenshots[date].map((screenshot) => (
                  <div
                    key={screenshot.id}
                    className="w-32 h-20 cursor-pointer relative rounded-md overflow-hidden border border-gray-300"
                    onClick={() => handleScreenshotClick(screenshot)}
                    title={`Screenshot at ${new Date(screenshot.timestamp).toLocaleString()}`}
                  >
                    <img
                      src={`http://localhost:5000${screenshot.thumbnail}`}
                      alt="Thumbnail"
                      style={{ width: '120px', height: 'auto', borderRadius: '6px' }}
                      
                    
                    
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      console.error('Image failed to load:', img.src);
                      img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
                    }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Popup */}
      {selected && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-5xl max-h-[80vh] overflow-auto text-black flex gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Screenshot Image */}
            <img
              src={`http://localhost:5000${selected.screenshot}`}
              alt="Screenshot"
              style={{ width: '100%', maxWidth: '500px', borderRadius: '8px' }}
            />


            {/* Activity Details */}
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
