import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminLayout from "@/components/AdminLayout";
import DashboardPage from "@/pages/admin/DashboardPage";
import HallManagementPage from "@/pages/admin/HallManagementPage";
import StudentEnrollmentPage from "@/pages/admin/StudentEnrollmentPage";
import ExamSchedulesPage from "@/pages/admin/ExamSchedulesPage";
import SeatingMatrixPage from "@/pages/admin/SeatingMatrixPage";
import ReportsPage from "@/pages/admin/ReportsPage";
import MasterDataPage from "@/pages/admin/MasterDataPage";
import FacultyManagementPage from "@/pages/admin/FacultyManagementPage";
import AttendancePage from "@/pages/admin/AttendancePage";
import StudentPortalPage from "@/pages/StudentPortalPage";
import LoginPage from "@/pages/LoginPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ProtectedRoute><ResetPasswordPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="halls" element={<ProtectedRoute allowedRoles={['admin']}><HallManagementPage /></ProtectedRoute>} />
            <Route path="students" element={<ProtectedRoute allowedRoles={['admin']}><StudentEnrollmentPage /></ProtectedRoute>} />
            <Route path="master-data" element={<MasterDataPage />} />
            <Route path="faculty" element={<ProtectedRoute allowedRoles={['admin']}><FacultyManagementPage /></ProtectedRoute>} />
            <Route path="schedules" element={<ProtectedRoute allowedRoles={['admin']}><ExamSchedulesPage /></ProtectedRoute>} />
            <Route path="allocation" element={<ProtectedRoute allowedRoles={['admin']}><SeatingMatrixPage /></ProtectedRoute>} />
            <Route path="allocation/:id" element={<ProtectedRoute allowedRoles={['admin']}><SeatingMatrixPage /></ProtectedRoute>} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="reports" element={<ProtectedRoute allowedRoles={['admin']}><ReportsPage /></ProtectedRoute>} />
          </Route>
          <Route path="/portal" element={<StudentPortalPage />} />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
