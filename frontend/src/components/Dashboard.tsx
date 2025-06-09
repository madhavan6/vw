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
  id: string;
  screenshot: string;
  timestamp: string;
  thumbnail?: string;
  mouseClicks?: number;       // add these fields in your fetched data if not present yet
  keyboardClicks?: number;
  activeMemo?: string;
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
  const raw = row.screenshotTimeStamp ?? row.timestamp ?? row.calcTimeStamp;
  const timestamp = raw && typeof raw === "string" ? raw : new Date().toISOString();

  let mouseClicks = 0;
  let keyboardClicks = 0;

  try {
    const mouseData = row.mouseJSON ? JSON.parse(row.mouseJSON) : null;
    const keyboardData = row.keyboardJSON ? JSON.parse(row.keyboardJSON) : null;
    mouseClicks = mouseData?.clicks ?? 0;
    keyboardClicks = keyboardData?.keypresses ?? 0;
  } catch (e) {
    console.error("Error parsing JSON:", e);
  }

  return {
    id: String(row.id),
    timestamp,
    screenshot: row.imageURL,
    thumbnail: row.thumbNailURL,
    mouseClicks,
    keyboardClicks,
    activeMemo: row.activeMemo ?? '',
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
          onClick={() => setSelected(screenshot)}
          title={`Screenshot at ${new Date(screenshot.timestamp).toLocaleString()}`}
        >
          <img
            src={screenshot.thumbnail || screenshot.screenshot}
            alt={`Screenshot at ${new Date(screenshot.timestamp).toLocaleString()}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.png';
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
        src={selected.screenshot}
        alt={`Full screenshot ${selected.id}`}
        className="max-w-[60%] max-h-[70vh] object-contain rounded"
      />

      {/* Details on the right side */}
      <div className="flex flex-col justify-start gap-2 max-w-[40%]">
        <p><strong>ID:</strong> {selected.id}</p>
        <p><strong>Timestamp:</strong> {new Date(selected.timestamp).toLocaleString()}</p>
       <p><strong>Mouse Clicks:</strong> {selected.mouseClicks ?? "N/A"}</p>
<p><strong>Keyboard Clicks:</strong> {selected.keyboardClicks ?? "N/A"}</p>
<p><strong>Active Memo:</strong> {selected.activeMemo || "None"}</p>

        <button
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded w-max"
          onClick={() => setSelected(null)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
}
