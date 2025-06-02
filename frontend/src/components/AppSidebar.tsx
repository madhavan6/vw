
import React from 'react';
import { BarChart3, User, Menu } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const menuItems = [
  {
    title: 'Dashboard',
    icon: BarChart3,
    id: 'dashboard',
  },
  {
    title: 'User Profile',
    icon: User,
    id: 'profile',
  },
];

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  currentUser: {
    name: string;
    organization: string;
    isAdmin: boolean;
  };
  onSignOut: () => void;
}

export function AppSidebar({ activeSection, onSectionChange, currentUser, onSignOut }: AppSidebarProps) {
  const isMobile = useIsMobile();

  return (
    <Sidebar className="border-r bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <span className="text-white font-bold text-xl">VW</span>
          </div>
          {isMobile && (
            <SidebarTrigger>
              <Button variant="ghost" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SidebarTrigger>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    isActive={activeSection === item.id}
                    className="w-full"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="text-xs text-muted-foreground text-center">
          VW Monitor v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
