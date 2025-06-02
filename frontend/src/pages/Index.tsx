
import React, { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Dashboard } from '@/components/Dashboard';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Menu, LogOut } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const isMobile = useIsMobile();

  const currentUser = {
    name: 'John Doe',
    organization: 'VW Corporation',
    isAdmin: true,
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const handleSignOut = () => {
    toast({
      title: "Signed out successfully",
      description: "You have been logged out of the system.",
    });
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="vw-ui-theme">
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            currentUser={currentUser}
            onSignOut={handleSignOut}
          />

          <main className="flex-1 flex flex-col">
            <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
              <div className="flex h-16 items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-4">
                  {isMobile && (
                    <SidebarTrigger>
                      <Menu className="h-5 w-5" />
                    </SidebarTrigger>
                  )}
                  <div className="font-semibold text-lg">VW Employee Monitor</div>
                </div>

                <div className="flex items-center gap-4">
                  <ThemeToggle />
                </div>
              </div>
            </header>

            <div className="flex-1 p-4 lg:p-6 overflow-auto">
              {activeSection === 'dashboard' && (
                <Dashboard currentUser={currentUser} />
              )}
              {activeSection === 'profile' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h1 className="text-3xl font-bold">User Profile</h1>
                    <p className="text-muted-foreground">Manage your account settings and preferences</p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <p><span className="font-medium">Name:</span> {currentUser.name}</p>
                          <p><span className="font-medium">Organization:</span> {currentUser.organization}</p>
                          <p><span className="font-medium">Role:</span> {currentUser.isAdmin ? 'Administrator' : 'Employee'}</p>
                        </div>
                        <Button onClick={handleSignOut} variant="outline" className="w-full">
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Activity Formula</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          This formula is used to calculate activity levels across all employees:
                        </p>
                        <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                          {`activityLevel = (mouseWeight * mouseClicks + keyboardWeight * keyboardPresses) / maxPossibleActivity * 100`}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
};

export default Index;
