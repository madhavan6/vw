import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Select from 'react-select';

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

  // ✅ Add these optional fields
  userName?: string;
  projectName?: string;
  taskName?: string;
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
  
  type SelectOption = { label: string; value: string };

  const [selectedUser, setSelectedUser] = useState<SelectOption | null>(null);
  const [userOptions, setUserOptions] = useState<SelectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<SelectOption | null>(null);
  const [projectOptions, setProjectOptions] = useState<SelectOption[]>([]);

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

    const response = await fetch('https://vw.aisrv.in/node_backend/getProjectsV6', {

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
const raw = row.screenshotTimeStamp;
const utcDate = raw && typeof raw === "string" ? new Date(raw) : new Date();
const timestampISO = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)).toISOString(); // IST offset

  let parsedActive: number[][] = [];
try {
  parsedActive = Array.isArray(row.activeJSON)
    ? row.activeJSON
    : row.activeJSON
    ? JSON.parse(row.activeJSON)
    : [];
} catch {
  parsedActive = [];
}

// ✅ Sum mouse and keyboard clicks from activeJSON
const totalMouseClicks = parsedActive.reduce((sum, entry) => sum + (entry[0] || 0), 0);
const totalKeyboardClicks = parsedActive.reduce((sum, entry) => sum + (entry[1] || 0), 0);

 return {
  id: row.id,
  projectID: row.projectID,
  userID: row.userID,
  taskID: row.taskID,
  timestamp: timestampISO,
  screenshot: row.imageURL,
  thumbnail: row.thumbNailURL,
  activeJSON: parsedActive,
  activeFlag: row.activeFlag ?? false,
  activeMins: row.activeMins ?? 0,
  activeMemo: row.activeMemo ?? '',
  userName: row.userName ?? 'N/A',
  projectName: row.projectName ?? 'N/A',
  taskName: row.taskName ?? 'N/A',
  // ✅ Use computed values
  mouseJSON: { clicks: totalMouseClicks },
  keyboardJSON: { clicks: totalKeyboardClicks },
};

});
      setScreenshots(screenshots);

      // ✅ STEP 2: Generate user options for dropdown
      const uniqueUsers = Array.from(
        new Set(screenshots.map((s) => s.userName).filter(Boolean))
      );

      setUserOptions(
        uniqueUsers.map((name) => ({ label: name!, value: name! }))
      );
       
      // ✅ STEP 3: Generate project options for dropdown
      const uniqueProjects = Array.from(new Set(screenshots.map(s => s.projectName)));
setProjectOptions(uniqueProjects.map(p => ({ label: p, value: p })));
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
      const dateMatch = screenshotDate === selectedDate;
      const userMatch = selectedUser ? screenshot.userName === selectedUser.value : true;
      const projectMatch = selectedProject ? screenshot.projectName === selectedProject.value : true;
      return dateMatch && userMatch && projectMatch;
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
  }, [screenshots, selectedDate, selectedUser, selectedProject]);// ✅ now reacts to user change too
useEffect(() => {
  setSelected(null); // Close the modal if it's open
}, [selectedDate, selectedUser]);


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Employee Screenshots</h1>
            <p className="text-muted-foreground">View screenshots organized by date and time</p>
            <div className="mt-4 space-y-2">
  {/* User Name and Project in same row */}
  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
    {/* User Name */}
    <div className="flex items-center gap-2">
      <label className="font-medium text-sm dark:text-white">User Name:</label>
      <div className="w-[200px]">
        <Select
          options={userOptions}
          value={selectedUser}
          onChange={setSelectedUser}
          isClearable
          placeholder="Select User"
          className="text-sm"
          styles={{
            control: (base, state) => ({
              ...base,
              height: '36px',
              backgroundColor: '#1a202c',
              borderColor: state.isFocused ? '#4a5568' : '#2d3748',
              color: '#fff',
              boxShadow: 'none',
            }),
            input: (base) => ({ ...base, color: '#fff' }),
            placeholder: (base) => ({ ...base, color: '#a0aec0' }),
            singleValue: (base) => ({ ...base, color: '#fff' }),
            menu: (base) => ({ ...base, backgroundColor: '#1a202c', color: '#fff' }),
            option: (base, { isFocused }) => ({
              ...base,
              backgroundColor: isFocused ? '#2d3748' : '#1a202c',
              color: '#fff',
            }),
          }}
        />
      </div>
    </div>

    {/* Project Name */}
    <div className="flex items-center gap-2">
      <label className="font-medium text-sm dark:text-white">Project Name:</label>
      <select
        value={selectedProject?.value || ''}
        onChange={(e) => {
          const value = e.target.value;
          const selected = projectOptions.find(opt => opt.value === value) || null;
          setSelectedProject(selected);
        }}
        className="border px-2 py-[6px] rounded dark:bg-gray-800 dark:text-white dark:border-gray-600 w-[200px] h-[36px]"
      >
        <option value="">All Projects</option>
        {projectOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  </div>

  {/* Date Picker below */}
  <div className="mt-2">
    <label className="font-medium text-sm dark:text-white mr-2">Select Date:</label>
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
  className="w-32 cursor-pointer"
  onClick={() => handleScreenshotClick(screenshot)}
  title={`Screenshot at ${new Date(screenshot.timestamp).toLocaleString()}`}
>
  {/* Thumbnail Container */}
  <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
    <img
      src={
        screenshot.thumbnail.startsWith('http')
          ? screenshot.thumbnail
          : `https://vw.aisrv.in/node_backend${screenshot.thumbnail}`
      }
      alt="Thumbnail"
      className="w-full h-20 object-cover"
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        img.src =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
      }}
    />
  </div>

  {/* Activity Line BELOW the thumbnail */}
  {Array.isArray(screenshot.activeJSON) && (
    <div className="flex justify-between items-center gap-[1px] mt-1 px-[2px]">
      {screenshot.activeJSON.slice(0, 10).map((entry: any, index: number) => (
        <div
          key={index}
          className={`h-[4px] flex-1 rounded-sm ${
            entry[2] === 1 ? 'bg-green-500' : 'bg-gray-300'
          }`}
        ></div>
      ))}
    </div>
  )}
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
    className="bg-white rounded-lg p-6 w-[95vw] max-w-[1300px] max-h-[95vh] overflow-y-auto text-black"
    onClick={(e) => e.stopPropagation()}
  >
    {/* Row: Screenshot + Details */}
    <div className="flex flex-col lg:flex-row gap-6 mb-6">
      {/* Screenshot */}
      <div className="w-full lg:w-1/2 flex-shrink-0">
        <img
          src={
            selected.screenshot.startsWith('http')
              ? selected.screenshot
              : `https://vw.aisrv.in/node_backend${selected.screenshot}`
          }
          alt="Screenshot"
          className="w-full h-auto rounded-md max-h-[70vh]"
        />
      </div>

      {/* Activity Details */}
      <div className="w-full lg:w-1/2 text-sm space-y-3">
        <h3 className="text-xl font-semibold mb-2">Activity Details</h3>
        <div className="flex justify-between">
          <span>User Name:</span>
          <span>{selected.userName || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span>Project Name:</span>
          <span>{selected.projectName || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span>Task Name:</span>
          <span>{selected.taskName || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span>Mouse Clicks:</span>
          <span>
            {Array.isArray(selected.activeJSON)
              ? selected.activeJSON.reduce((sum, entry) => sum + (entry[0] || 0), 0)
              : selected.mouseJSON?.clicks ?? 0}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Keyboard Clicks:</span>
          <span>
            {Array.isArray(selected.activeJSON)
              ? selected.activeJSON.reduce((sum, entry) => sum + (entry[1] || 0), 0)
              : selected.keyboardJSON?.clicks ?? 0}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Active Minutes:</span>
          <span>{selected.activeMins ?? 0}</span>
        </div>
        <div className="flex justify-between">
          <span>Active Memo:</span>
          <span>{selected.activeMemo || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span>Timestamp:</span>
          <span>
            {new Date(selected.timestamp).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
            })}
          </span>
        </div>
      </div>
    </div>

    {/* Table */}
    {Array.isArray(selected.activeJSON) && selected.activeJSON.length > 0 && (
      <div className="overflow-x-auto mb-6">
        <h4 className="text-lg font-semibold mb-2">Minute-wise Activity (Last 10 mins)</h4>
        <table className="w-full text-xs border-collapse border border-gray-300 dark:border-gray-600">
         <thead className="bg-gray-200 dark:bg-gray-300">
            <tr>
              <th className="border px-1 py-1 text-left">Metric</th>
              {selected.activeJSON.map((_, index) => (
                <th key={index} className="border px-1 py-1 text-center">Min {index + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-1 py-1 font-medium">Mouse Clicks</td>
              {selected.activeJSON.map((entry: any, index: number) => (
                <td key={index} className="border px-1 py-1 text-center">{entry[0]}</td>
              ))}
            </tr>
            <tr>
              <td className="border px-1 py-1 font-medium">Keyboard Clicks</td>
              {selected.activeJSON.map((entry: any, index: number) => (
                <td key={index} className="border px-1 py-1 text-center">{entry[1]}</td>
              ))}
            </tr>
            <tr>
              <td className="border px-1 py-1 font-medium">Active</td>
              {selected.activeJSON.map((entry: any, index: number) => (
                <td key={index} className="border px-1 py-1 text-center">
                  {entry[2] === 1 ? (
                    <span className="text-green-600 font-medium">Yes</span>
                  ) : (
                    <span className="text-red-500 font-medium">No</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    )}

    {/* Close Button */}
    <div className="flex justify-end">
      <button
        onClick={() => setSelected(null)}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
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

export default Dashboard;