
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityCard } from './ActivityCard';
import { ScreenshotModal } from './ScreenshotModal';
import { EmployeeSelector } from './EmployeeSelector';
import { IntervalSelector } from './IntervalSelector';
import { AdminConfigPanel } from './AdminConfigPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '../pages/ErrorBoundary';

interface Employee {
  id: string;
  name: string;
  email: string;
  screenshotInterval: number;
}

interface ActivityData {
  id: string;
  screenshot: string;
  activityLevel: number;
  mouseClicks: number;
  keyboardPresses: number;
  timeRange: string;
  timestamp: string;
  hour: number;
}

interface AdminConfig {
  maxPossibleActivity: number;
  mouseWeight: number;
  keyboardWeight: number;
}

interface DashboardProps {
  currentUser: {
    name: string;
    organization: string;
    isAdmin: boolean;
  };
}

// Mock data


const mockScreenshots = [
  'photo-1649972904349-6e44c42644a7',
  'photo-1488590528505-98d2b5aba04b',
  'photo-1461749280684-dccba630e2f6',
  'photo-1486312338219-ce68d2c6f44d',
  'photo-1581091226825-a6a2a5aee158',
  'photo-1531297484001-80022131f5a1',
  'photo-1487058792275-0ad4aaf24ca7'
];





const formatHourRange = (hour: number) => {
  const startTime = hour === 12 ? '12:00 PM' : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`;
  const endHour = hour + 1;
  const endTime = endHour === 12 ? '12:00 PM' : endHour > 12 ? `${endHour - 12}:00 PM` : `${endHour}:00 AM`;
  return `${startTime} - ${endTime}`;
};

export function Dashboard({ currentUser }: DashboardProps) {
  const [mockEmployees, setMockEmployees] = useState<Employee[]>([
    { id: '1', name: 'John Doe', email: 'john@vw.com', screenshotInterval: 10 },
    { id: '2', name: 'Jane Smith', email: 'jane@vw.com', screenshotInterval: 15 },
    { id: '3', name: 'Mike Johnson', email: 'mike@vw.com', screenshotInterval: 5 },
    { id: '4', name: 'Sarah Wilson', email: 'sarah@vw.com', screenshotInterval: 20 },
  ]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(mockEmployees[0]);
  const [selectedActivity, setSelectedActivity] = useState<ActivityData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminConfig, setAdminConfig] = useState({
    maxPossibleActivity: 500,
    mouseWeight: 1,
    keyboardWeight: 1.5,
  });
  const generateMockActivities = useCallback((employeeId: string, interval: number): ActivityData[] => {
    const activities: ActivityData[] = [];
    const startHour = 9;
    const endHour = 17;

    for (let hour = startHour; hour < endHour; hour++) {
      const activitiesPerHour = 60 / interval;

      for (let i = 0; i < activitiesPerHour; i++) {
        const minute = Math.floor(i * interval);
        const endMinute = Math.min(minute + interval, 60);
        const timeRange = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} - ${hour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

        const mouseClicks = Math.floor(Math.random() * 200) + 50;
        const keyboardPresses = Math.floor(Math.random() * 300) + 100;

        // Make sure to use the current adminConfig values
        const activityLevel = Math.min(
          ((adminConfig.mouseWeight * mouseClicks) +
            (adminConfig.keyboardWeight * keyboardPresses)) /
          adminConfig.maxPossibleActivity * 100,
          100
        );

        activities.push({
          id: `${employeeId}-${hour}-${i}`,
          screenshot: mockScreenshots[Math.floor(Math.random() * mockScreenshots.length)],
          activityLevel: Math.round(activityLevel),
          mouseClicks,
          keyboardPresses,
          timeRange,
          timestamp: new Date().toISOString(),
          hour,
        });
      }
    }

    return activities;
  }, [adminConfig]); // Make sure adminConfig is in the dependency array
  const groupActivitiesByHour = (activities: ActivityData[]) => {
    const grouped: { [key: number]: ActivityData[] } = {};

    activities.forEach(activity => {
      if (!grouped[activity.hour]) {
        grouped[activity.hour] = [];
      }
      grouped[activity.hour].push(activity);
    });

    return grouped;
  };
  const activities = useMemo(() => {
    return selectedEmployee
      ? generateMockActivities(selectedEmployee.id, selectedEmployee.screenshotInterval)
      : [];
  }, [selectedEmployee, generateMockActivities, adminConfig]); // Add adminConfig here

  const groupedActivities = groupActivitiesByHour(activities);

  const handleActivityClick = (activity: ActivityData) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };
  const handleConfigChange = (newConfig: AdminConfig) => {
    setAdminConfig({
      maxPossibleActivity: Number(newConfig.maxPossibleActivity),
      mouseWeight: Number(newConfig.mouseWeight),
      keyboardWeight: Number(newConfig.keyboardWeight)
    });
  };
  const handleIntervalChange = (newInterval: number) => {
    if (selectedEmployee) {
      const updatedEmployee = {
        ...selectedEmployee,
        screenshotInterval: newInterval
      };
      setSelectedEmployee(updatedEmployee);

      // Update the employee in the mockEmployees array
      setMockEmployees(prev =>
        prev.map(emp =>
          emp.id === selectedEmployee.id ? updatedEmployee : emp
        )
      );
    }
  };


  // Make sure this is inside the Dashboard component, not outside
  const averageActivity = activities.length > 0
    ? Math.round(activities.reduce((sum, activity) => sum + activity.activityLevel, 0) / activities.length)
    : 0;

  const totalClicks = activities.reduce((sum, activity) => sum + activity.mouseClicks, 0);
  const totalKeyboard = activities.reduce((sum, activity) => sum + activity.keyboardPresses, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Employee Activity Dashboard</h1>
          <p className="text-muted-foreground">Monitor and track employee activity levels</p>
        </div>
      </div>
      <ErrorBoundary>
        <AdminConfigPanel
          config={adminConfig}
          onConfigChange={handleConfigChange}
        />
      </ErrorBoundary>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageActivity}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Mouse Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Keyboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalKeyboard.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Screenshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <EmployeeSelector
          employees={mockEmployees}
          selectedEmployee={selectedEmployee}
          onSelectEmployee={setSelectedEmployee}
          className="w-[300px]"
        />
        <IntervalSelector
          value={selectedEmployee?.screenshotInterval || 10}
          onChange={handleIntervalChange}
          isAdmin={currentUser.isAdmin}
          disabled={!selectedEmployee}
        />
        {selectedEmployee && (
          <Badge variant="secondary">
            Interval: {selectedEmployee.screenshotInterval} minutes
          </Badge>
        )}
      </div>

      {selectedEmployee && (
        <div className="space-y-6">
          {Object.keys(groupedActivities)
            .map(Number)
            .sort((a, b) => a - b)
            .map(hour => (
              <Card key={hour}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{formatHourRange(hour)} - {selectedEmployee.name}</span>
                    <Badge variant="outline">
                      {groupedActivities[hour].length} screenshots
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {groupedActivities[hour].map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        screenshot={activity.screenshot}
                        activityLevel={activity.activityLevel}
                        mouseClicks={activity.mouseClicks}
                        keyboardPresses={activity.keyboardPresses}
                        timeRange={activity.timeRange}
                        onClick={() => handleActivityClick(activity)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {selectedActivity && (
        <ScreenshotModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          screenshot={selectedActivity.screenshot}
          timeRange={selectedActivity.timeRange}
          activityLevel={selectedActivity.activityLevel}
          mouseClicks={selectedActivity.mouseClicks}
          keyboardPresses={selectedActivity.keyboardPresses}
        />
      )}
    </div>
  );
}
