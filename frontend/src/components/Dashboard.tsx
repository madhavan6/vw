import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
//import { TestConnection } from './TestConnection';



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
}

interface EmployeeSelectorProps {
  employees: Employee[];
  selectedEmployee: Employee | null;
  onSelectEmployee: (employee: Employee) => void;
  className?: string;
}

const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  employees,
  selectedEmployee,
  onSelectEmployee,
  className,
}) => (
  <select
    className={className}
    value={selectedEmployee?.id || ''}
    onChange={(e) => {
      const emp = employees.find(emp => String(emp.id) === e.target.value);
      if (emp) onSelectEmployee(emp);
    }}
  >
    <option value="" disabled>
      Select an employee
    </option>
    {employees.map(emp => (
      <option key={emp.id} value={emp.id}>
        {emp.displayName || emp.id}
      </option>
    ))}
  </select>
);

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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  useEffect(() => {
    async function fetchScreenshots() {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Attempting to fetch screenshots from:', 'http://localhost:5000/api/workdiary/all');

        const response = await fetch('http://localhost:5000/api/workdiary/all', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        const text = await response.text();
        console.log('Raw response:', text);

        if (!response.ok) {
          throw new Error(text || 'Failed to fetch screenshots');
        }

        // Try to parse the response as JSON
        try {
          const data = JSON.parse(text);
          if (!data || !Array.isArray(data)) {
            throw new Error('Invalid screenshots data');
          }

          const screenshots = data.map((row: any) => ({
            id: String(row.id),
            timestamp: row.timestamp,
            screenshot: row.imageURL,
            thumbnail: row.thumbNailURL,
          }));

          setScreenshots(screenshots);
        } catch (parseErr) {
          console.error('Failed to parse JSON:', parseErr);
          throw new Error('Invalid JSON response: ' + parseErr.message);
        }
      } catch (err) {
        console.error('Frontend error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch screenshots');
        setScreenshots([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchScreenshots();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        
        {/* <TestConnection /> */}
        
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

      {error && (
        <div className="text-red-500 text-center">{error}</div>
      )}

      {screenshots.length === 0 && !isLoading && !error && (
        <p className="text-center text-muted-foreground">No screenshots available in the database.</p>
      )}

      {screenshots.length > 0 && (
        <div className="space-y-6">
          {screenshots.map((screenshot) => (
            <Card key={screenshot.id} className="w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {formatTimestamp(screenshot.timestamp)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-[300px]">
                  <img
                    src={screenshot.thumbnail || screenshot.screenshot}
                    alt={`Screenshot at ${formatTimestamp(screenshot.timestamp)}`}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = '/placeholder.png'; // Add a fallback image
                    }}
                    onLoad={() => {
                      // Image loaded successfully
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-10 rounded-lg transition-opacity duration-300 ease-in-out hover:opacity-0"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
