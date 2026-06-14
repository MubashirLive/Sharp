import { lazy, Suspense } from "react";
import "@/i18n/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AuthPage from "./pages/Auth.tsx";
import AuthSuperAdmin from "./pages/AuthSuperAdmin.tsx";
import AuthRoleLogin from "./pages/AuthRoleLogin.tsx";
import ChangePasswordPage from "./pages/ChangePassword.tsx";
import ForcedPasswordChange from "./pages/ForcedPasswordChange.tsx";
import ForcedPINSetup from "./pages/ForcedPINSetup.tsx";
import AccountLocked from "./pages/AccountLocked.tsx";
import PrincipalRecovery from "./pages/PrincipalRecovery.tsx";
import StaffRecovery from "./pages/StaffRecovery.tsx";
import StudentRecovery from "./pages/StudentRecovery.tsx";

// Heavy pages: lazy-loaded to shrink the initial bundle
const SuperAdmin = lazy(() => import("./pages/SuperAdmin.tsx"));
const SchoolPage = lazy(() => import("./pages/SchoolPage.tsx"));
const MyStaff = lazy(() => import("./pages/MyStaff.tsx"));
const Students = lazy(() => import("./pages/Students.tsx"));
const StudentDetailPage = lazy(() => import("./pages/StudentDetailPage.tsx"));
const SchoolOnboarding = lazy(() => import("./pages/SchoolOnboarding.tsx"));
const RoleManager = lazy(() => import("./pages/RoleManager"));
const Calendar = lazy(() => import("./pages/Calendar.tsx"));
const SchoolSetupCalendar = lazy(() => import("./pages/SchoolSetupCalendar.tsx"));
const MessengerPage = lazy(() => import("./pages/Messenger.tsx"));
const Attendance = lazy(() => import("./pages/Attendance.tsx"));
const Homework = lazy(() => import("./pages/Homework.tsx"));

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen w-full">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/superadmin" element={<AuthSuperAdmin />} />
              <Route path="/auth/principal" element={<AuthRoleLogin kind="principal" />} />
              <Route path="/auth/staff" element={<AuthRoleLogin kind="staff" />} />
              <Route path="/auth/student" element={<AuthRoleLogin kind="student" />} />
              <Route path="/auth/forced-password-change" element={<ForcedPasswordChange />} />
              <Route path="/auth/forced-pin-setup" element={<ForcedPINSetup />} />
              <Route path="/auth/locked" element={<AccountLocked />} />
              <Route path="/auth/principal/recover" element={<PrincipalRecovery />} />
              <Route path="/auth/staff/recover" element={<StaffRecovery />} />
              <Route path="/auth/student/recover" element={<StudentRecovery />} />
              <Route path="/super-admin" element={<ProtectedRoute allowedRoles={["superadmin"]}><SuperAdmin /></ProtectedRoute>} />
              <Route path="/school" element={<ProtectedRoute allowedRoles={["principal","admin"]}><SchoolPage /></ProtectedRoute>} />
              <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
              <Route path="/school/onboarding" element={<ProtectedRoute allowedRoles={["principal","admin"]}><SchoolOnboarding /></ProtectedRoute>} />
              <Route path="/people" element={<ProtectedRoute allowedRoles={["principal","master_admin","admin"]}><MyStaff /></ProtectedRoute>} />
              <Route path="/my-staff" element={<ProtectedRoute allowedRoles={["principal","master_admin","admin"]}><MyStaff /></ProtectedRoute>} />
              <Route path="/students" element={<ProtectedRoute allowedRoles={["principal","admin"]}><Students /></ProtectedRoute>} />
              <Route path="/students/:id" element={<ProtectedRoute allowedRoles={["principal","admin"]}><StudentDetailPage /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
              <Route path="/attendance" element={<ProtectedRoute allowedRoles={["class_teacher","coordinator","principal","master_admin","admin"]}><Attendance /></ProtectedRoute>} />
              <Route path="/school/setup/calendar" element={<ProtectedRoute allowedRoles={["principal","admin"]}><SchoolSetupCalendar /></ProtectedRoute>} />
              <Route path="/role-manager" element={<ProtectedRoute allowedRoles={["principal","master_admin","admin"]}><RoleManager /></ProtectedRoute>} />
              <Route path="/messenger" element={<ProtectedRoute><MessengerPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
