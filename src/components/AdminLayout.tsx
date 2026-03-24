import { LayoutDashboard, Users, CalendarDays, Armchair, FileBarChart, Bell, Settings, LogOut, Database, UserCheck, ClipboardCheck } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Outlet } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Hall Management", url: "/admin/halls", icon: Armchair },
  { title: "Student Enrollment", url: "/admin/students", icon: Users },
  { title: "Faculty Management", url: "/admin/faculty", icon: UserCheck },
  { title: "Master Data", url: "/admin/master-data", icon: Database },
  { title: "Exam Schedules", url: "/admin/schedules", icon: CalendarDays },
  { title: "Seating Allotments", url: "/admin/allocation", icon: Armchair },
  { title: "Exam Attendance", url: "/admin/attendance", icon: ClipboardCheck },
  { title: "Reports", url: "/admin/reports", icon: FileBarChart },
];

function AdminSidebarContent() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, role, signOut } = useAuth();

  const filteredNavItems = navItems.filter((item) => {
    if (role === 'admin') return true; // Admins see everything
    if (role === 'faculty') {
      // Faculty only see Dashboard, Master Data, and Exam Attendance
      return item.url === '/admin' || item.url === '/admin/attendance' || item.url === '/admin/master-data';
    }
    return false; // Hide until role is determined
  });

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary">
          <Armchair className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && <span className="text-lg font-semibold text-primary">HallPlanner</span>}
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.url || (item.url === "/admin" && location.pathname === "/admin");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/admin"}
                        className={`relative flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent ${isActive ? "bg-sidebar-accent font-medium text-primary" : "text-sidebar-foreground"}`}
                        activeClassName=""
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                        )}
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {!collapsed && (
        <div className="mt-auto border-t border-sidebar-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user?.email?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col max-w-[120px]">
                <span className="text-sm font-medium truncate" title={user?.email || "Admin"}>
                  {user?.email ? user.email.split('@')[0] : "Admin"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {role === 'admin' ? "System Admin" : role === 'faculty' ? "Faculty Member" : "User"}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => signOut()} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Sidebar>
  );
}

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebarContent />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex h-14 items-center justify-between border-b px-3 sm:px-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <SidebarTrigger />
              <div className="relative hidden sm:block">
                <input
                  type="text"
                  placeholder="Search halls, students, schedules..."
                  className="h-9 w-56 md:w-80 rounded-sm border bg-secondary/50 px-3 pl-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-3">
              <button className="relative rounded-sm p-2 hover:bg-secondary transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
              </button>
              <button className="rounded-sm p-2 hover:bg-secondary transition-colors hidden sm:block">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background p-3 sm:p-6">
            <Outlet />
          </main>
          <footer className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t px-4 sm:px-6 py-3 text-xs text-muted-foreground gap-1 sm:gap-0">
            <span>© 2024 Automated Exam Hall Allocation System • v2.1.0</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" />
                System Online
              </span>
              <span>Server Latency: 24ms</span>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
