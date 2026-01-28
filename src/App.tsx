// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { AuthProvider } from "@/hooks/useAuth";
// import ProtectedRoute from "@/components/ProtectedRoute";

// // Pages
// import Index from "./pages/Index";
// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";
// import BrowseCourses from "./pages/BrowseCourses";
// import CourseDetails from "./pages/CourseDetails";
// import CoursePlayer from "./pages/CoursePlayer";
// import MyLearning from "./pages/MyLearning";
// import MyCourses from "./pages/MyCourses";
// import Settings from "./pages/Settings";
// import NotFound from "./pages/NotFound";

// // Org Admin Pages
// import OrgOverview from "./pages/org/OrgOverview";
// import OrgCourses from "./pages/org/OrgCourses";
// import OrgUsers from "./pages/org/OrgUsers";

// // Instructor Pages
// import InstructorDashboard from "./pages/instructor/InstructorDashboard";
// import InstructorCourses from "./pages/instructor/InstructorCourses";
// import CreateCourse from "./pages/instructor/CreateCourse";
// import EditCourse from "./pages/instructor/EditCourse";
// import CourseContentBuilder from "./pages/instructor/CourseContentBuilder";

// // Admin Pages
// import AdminDashboard from "./pages/admin/AdminDashboard";

// // Manager Pages
// import ManagerDashboard from "./pages/manager/ManagerDashboard";

// // Student Pages
// import StudentDashboard from "./pages/student/StudentDashboard";

// // Certificate Pages
// import VerifyCertificate from "./pages/VerifyCertificate";

// // Internship Pages
// import InternshipListPage from "./pages/internships/InternshipListPage";
// import CreateInternship from "./pages/internships/CreateInternship";
// import InternshipDetail from "./pages/internships/InternshipDetail";
// import MyInternships from "./pages/internships/MyInternships";

// // Job & Placement Pages
// import JobListPage from "./pages/jobs/JobListPage";
// import MyApplications from "./pages/jobs/MyApplications";
// import EmployerDashboardPage from "./pages/jobs/EmployerDashboardPage";
// import PlacementReportsPage from "./pages/jobs/PlacementReportsPage";

// // Franchise Pages
// import FranchiseDashboardPage from "./pages/franchise/FranchiseDashboardPage";
// import FranchiseAdminPage from "./pages/franchise/FranchiseAdminPage";

// // Payment Pages
// import PaymentsPage from "./pages/payments/PaymentsPage";
// import SubscriptionPlansPage from "./pages/payments/SubscriptionPlansPage";
// import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage";

// // Notification Pages
// import NotificationsPage from "./pages/NotificationsPage";
// import AdminCommunicationsPage from "./pages/admin/AdminCommunicationsPage";

// // Analytics Pages
// import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";

// // Security Pages
// import AdminSecurityPage from "./pages/admin/AdminSecurityPage";

// // Admin Controls Pages
// import AdminControlsPage from "./pages/admin/AdminControlsPage";

// // Legal Pages
// import TermsPage from "./pages/legal/TermsPage";
// import PrivacyPage from "./pages/legal/PrivacyPage";
// import RefundPage from "./pages/legal/RefundPage";
// import AdminLegalPage from "./pages/admin/AdminLegalPage";

// // Instructor Panel Pages
// import InstructorAnalytics from "./pages/instructor/InstructorAnalytics";
// import InstructorStudents from "./pages/instructor/InstructorStudents";
// import InstructorLiveClasses from "./pages/instructor/InstructorLiveClasses";
// import InstructorAssignments from "./pages/instructor/InstructorAssignments";
// import AdminCertificates from "./pages/admin/AdminCertificates";
// import AdminRolesPage from "./pages/admin/AdminRolesPage";

// // Advanced Features Pages
// import CareerToolsPage from "./pages/CareerToolsPage";
// import CorporateDashboardPage from "./pages/corporate/CorporateDashboardPage";

// const queryClient = new QueryClient();

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <TooltipProvider>
//       <Toaster />
//       <Sonner />
//       <BrowserRouter>
//         <AuthProvider>
//           <Routes>
//             <Route path="/" element={<Index />} />
//             <Route path="/login" element={<Login />} />
            
//             {/* Common Protected Routes */}
//             <Route path="/dashboard" element={
//               <ProtectedRoute>
//                 <Dashboard />
//               </ProtectedRoute>
//             } />
//             <Route path="/settings" element={
//               <ProtectedRoute>
//                 <Settings />
//               </ProtectedRoute>
//             } />

//             {/* Student Routes */}
//             <Route path="/student/dashboard" element={
//               <ProtectedRoute allowedRoles={['student']}>
//                 <StudentDashboard />
//               </ProtectedRoute>
//             } />
//             <Route path="/courses" element={
//               <ProtectedRoute allowedRoles={['student', 'corporate_hr', 'franchise', 'distributor', 'super_distributor', 'affiliate']}>
//                 <BrowseCourses />
//               </ProtectedRoute>
//             } />
//             <Route path="/courses/:id" element={
//               <ProtectedRoute>
//                 <CourseDetails />
//               </ProtectedRoute>
//             } />
//             <Route path="/courses/:courseId/learn" element={
//               <ProtectedRoute>
//                 <CoursePlayer />
//               </ProtectedRoute>
//             } />
//             <Route path="/my-learning" element={
//               <ProtectedRoute allowedRoles={['student', 'corporate_hr']}>
//                 <MyLearning />
//               </ProtectedRoute>
//             } />
//             <Route path="/career-tools" element={
//               <ProtectedRoute allowedRoles={['student']}>
//                 <CareerToolsPage />
//               </ProtectedRoute>
//             } />

//             {/* Instructor Routes (Trainers & Mentors) */}
//             <Route path="/my-courses" element={
//               <ProtectedRoute allowedRoles={['trainer', 'mentor']}>
//                 <MyCourses />
//               </ProtectedRoute>
//             } />
//             <Route path="/instructor/dashboard" element={
//               <ProtectedRoute allowedRoles={['trainer', 'mentor']}>
//                 <InstructorDashboard />
//               </ProtectedRoute>
//             } />
//             <Route path="/instructor/courses" element={
//               <ProtectedRoute allowedRoles={['trainer', 'mentor']}>
//                 <InstructorCourses />
//               </ProtectedRoute>
//             } />
//             <Route path="/instructor/courses/create" element={
//               <ProtectedRoute allowedRoles={['trainer']}>
//                 <CreateCourse />
//               </ProtectedRoute>
//             } />
//             <Route path="/instructor/courses/:id/edit" element={
//               <ProtectedRoute allowedRoles={['trainer', 'mentor']}>
//                 <EditCourse />
//               </ProtectedRoute>
//             } />
//             <Route path="/instructor/courses/:id/content" element={
//               <ProtectedRoute allowedRoles={['trainer', 'mentor']}>
//                 <CourseContentBuilder />
//               </ProtectedRoute>
//             } />
//             <Route path="/instructor/analytics" element={
//               <ProtectedRoute allowedRoles={['trainer', 'mentor']}>
//                 <InstructorAnalytics />
//               </ProtectedRoute>
//             } />
//             <Route path="/instructor/students" element={
//               <ProtectedRoute allowedRoles={['trainer', 'mentor']}>
//                 <InstructorStudents />
//               </ProtectedRoute>
//             } />
//             <Route path="/instructor/live-classes" element={
//               <ProtectedRoute allowedRoles={['trainer', 'mentor']}>
//                 <InstructorLiveClasses />
//               </ProtectedRoute>
//             } />
//             <Route path="/instructor/assignments" element={
//               <ProtectedRoute allowedRoles={['trainer', 'mentor']}>
//                 <InstructorAssignments />
//               </ProtectedRoute>
//             } />
            
//             {/* Internship Routes */}
//             <Route path="/internships" element={
//               <ProtectedRoute>
//                 <InternshipListPage />
//               </ProtectedRoute>
//             } />
//             <Route path="/internships/create" element={
//               <ProtectedRoute allowedRoles={['super_admin', 'admin', 'trainer', 'mentor']}>
//                 <CreateInternship />
//               </ProtectedRoute>
//             } />
//             <Route path="/internships/:id" element={
//               <ProtectedRoute>
//                 <InternshipDetail />
//               </ProtectedRoute>
//             } />
//             <Route path="/my-internships" element={
//               <ProtectedRoute allowedRoles={['student']}>
//                 <MyInternships />
//               </ProtectedRoute>
//             } />

//             {/* Job & Placement Routes */}
//             <Route path="/jobs" element={
//               <ProtectedRoute>
//                 <JobListPage />
//               </ProtectedRoute>
//             } />
//             <Route path="/my-applications" element={
//               <ProtectedRoute allowedRoles={['student']}>
//                 <MyApplications />
//               </ProtectedRoute>
//             } />
//             <Route path="/employer/dashboard" element={
//               <ProtectedRoute>
//                 <EmployerDashboardPage />
//               </ProtectedRoute>
//             } />
//             <Route path="/admin/placements" element={
//               <ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}>
//                 <PlacementReportsPage />
//               </ProtectedRoute>
//             } />

//             {/* Franchise Routes */}
//             <Route path="/franchise/dashboard" element={
//               <ProtectedRoute allowedRoles={['franchise', 'distributor', 'super_distributor', 'affiliate']}>
//                 <FranchiseDashboardPage />
//               </ProtectedRoute>
//             } />
//             <Route path="/admin/partners" element={
//               <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
//                 <FranchiseAdminPage />
//               </ProtectedRoute>
//             } />

//             {/* Payment Routes */}
//             <Route path="/payments" element={
//               <ProtectedRoute>
//                 <PaymentsPage />
//               </ProtectedRoute>
//             } />
//             <Route path="/subscriptions" element={
//               <ProtectedRoute>
//                 <SubscriptionPlansPage />
//               </ProtectedRoute>
//             } />
//             <Route path="/admin/payments" element={
//               <ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}>
//                 <AdminPaymentsPage />
//               </ProtectedRoute>
//             } />

//             {/* Notification Routes */}
//             <Route path="/notifications" element={
//               <ProtectedRoute>
//                 <NotificationsPage />
//               </ProtectedRoute>
//             } />
//             <Route path="/admin/communications" element={
//               <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
//                 <AdminCommunicationsPage />
//               </ProtectedRoute>
//             } />
//             <Route path="/admin/analytics" element={
//               <ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}>
//                 <AdminAnalyticsPage />
//               </ProtectedRoute>
//             } />
//             <Route path="/admin/security" element={
//               <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
//                 <AdminSecurityPage />
//               </ProtectedRoute>
//             } />
//             <Route path="/admin/controls" element={
//               <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
//                 <AdminControlsPage />
//               </ProtectedRoute>
//             } />
//             <Route path="/admin/legal" element={
//               <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
//                 <AdminLegalPage />
//               </ProtectedRoute>
//             } />
//             <Route path="/admin/roles" element={
//               <ProtectedRoute allowedRoles={['super_admin']}>
//                 <AdminRolesPage />
//               </ProtectedRoute>
//             } />
            
//             {/* Public Legal Pages */}
//             <Route path="/terms" element={<TermsPage />} />
//             <Route path="/privacy" element={<PrivacyPage />} />
//             <Route path="/refund" element={<RefundPage />} />
            
//             {/* Public Certificate Verification */}
//             <Route path="/verify/:id" element={<VerifyCertificate />} />
            
//             {/* Admin Certificate Management */}
//             <Route path="/admin/certificates" element={
//               <ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin', 'trainer']}>
//                 <AdminCertificates />
//               </ProtectedRoute>
//             } />

//             {/* Admin Routes */}
//             <Route path="/admin/dashboard" element={
//               <ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}>
//                 <AdminDashboard />
//               </ProtectedRoute>
//             } />
//             <Route path="/admin/courses" element={
//               <ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}>
//                 <OrgCourses />
//               </ProtectedRoute>
//             } />
//             <Route path="/admin/users" element={
//               <ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}>
//                 <OrgUsers />
//               </ProtectedRoute>
//             } />

//             {/* Corporate HR / Manager Routes */}
//             <Route path="/manager/dashboard" element={
//               <ProtectedRoute allowedRoles={['corporate_hr']}>
//                 <ManagerDashboard />
//               </ProtectedRoute>
//             } />
//             <Route path="/corporate/dashboard" element={
//               <ProtectedRoute allowedRoles={['corporate_hr', 'super_admin', 'admin']}>
//                 <CorporateDashboardPage />
//               </ProtectedRoute>
//             } />

//             {/* Legacy Org Admin Routes (redirect to admin routes) */}
//             <Route path="/org/overview" element={
//               <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
//                 <OrgOverview />
//               </ProtectedRoute>
//             } />
//             <Route path="/org/courses" element={
//               <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
//                 <OrgCourses />
//               </ProtectedRoute>
//             } />
//             <Route path="/org/users" element={
//               <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
//                 <OrgUsers />
//               </ProtectedRoute>
//             } />

//             {/* Catch-all */}
//             <Route path="*" element={<NotFound />} />
//           </Routes>
//         </AuthProvider>
//       </BrowserRouter>
//     </TooltipProvider>
//   </QueryClientProvider>
// );

// export default App;
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BrowseCourses from "./pages/BrowseCourses";
import CourseDetails from "./pages/CourseDetails";
import CoursePlayer from "./pages/CoursePlayer";
import MyLearning from "./pages/MyLearning";
import MyCourses from "./pages/MyCourses";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Org Admin Pages
import OrgOverview from "./pages/org/OrgOverview";
import OrgCourses from "./pages/org/OrgCourses";
import OrgUsers from "./pages/org/OrgUsers";

// Instructor Pages
import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import InstructorCourses from "./pages/instructor/InstructorCourses";
import CreateCourse from "./pages/instructor/CreateCourse";
import EditCourse from "./pages/instructor/EditCourse";
import CourseContentBuilder from "./pages/instructor/CourseContentBuilder";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";

// Manager Pages
import ManagerDashboard from "./pages/manager/ManagerDashboard";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";

// Certificate Pages
import VerifyCertificate from "./pages/VerifyCertificate";

// Internship Pages
import InternshipListPage from "./pages/internships/InternshipListPage";
import CreateInternship from "./pages/internships/CreateInternship";
import InternshipDetail from "./pages/internships/InternshipDetail";
import MyInternships from "./pages/internships/MyInternships";

// Job & Placement Pages
import JobListPage from "./pages/jobs/JobListPage";
import MyApplications from "./pages/jobs/MyApplications";
import EmployerDashboardPage from "./pages/jobs/EmployerDashboardPage";
import PlacementReportsPage from "./pages/jobs/PlacementReportsPage";

// Franchise Pages
import FranchiseDashboardPage from "./pages/franchise/FranchiseDashboardPage";
import FranchiseAdminPage from "./pages/franchise/FranchiseAdminPage";

// Payment Pages
import PaymentsPage from "./pages/payments/PaymentsPage";
import SubscriptionPlansPage from "./pages/payments/SubscriptionPlansPage";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage";

// Notification Pages
import NotificationsPage from "./pages/NotificationsPage";
import AdminCommunicationsPage from "./pages/admin/AdminCommunicationsPage";

// Analytics Pages
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";

// Security Pages
import AdminSecurityPage from "./pages/admin/AdminSecurityPage";

// Admin Controls Pages
import AdminControlsPage from "./pages/admin/AdminControlsPage";
import SuperAdminPage from "./pages/admin/SuperAdminPage";

// Legal Pages
import TermsPage from "./pages/legal/TermsPage";
import PrivacyPage from "./pages/legal/PrivacyPage";
import RefundPage from "./pages/legal/RefundPage";
import AdminLegalPage from "./pages/admin/AdminLegalPage";

// Instructor Panel Pages
import InstructorAnalytics from "./pages/instructor/InstructorAnalytics";
import InstructorStudents from "./pages/instructor/InstructorStudents";
import InstructorLiveClasses from "./pages/instructor/InstructorLiveClasses";
import InstructorAssignments from "./pages/instructor/InstructorAssignments";
import AdminCertificates from "./pages/admin/AdminCertificates";
import AdminRolesPage from "./pages/admin/AdminRolesPage";
import InviteUsersPage from "./pages/admin/InviteUsersPage";

// Advanced Features Pages
import CareerToolsPage from "./pages/CareerToolsPage";
import CorporateDashboardPage from "./pages/corporate/CorporateDashboardPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            {/* Common Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />

            {/* Student Routes */}
            <Route path="/student/dashboard" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/courses" element={
              <ProtectedRoute allowedRoles={['student', 'corporate_hr', 'franchise', 'distributor', 'super_distributor', 'affiliate']}>
                <BrowseCourses />
              </ProtectedRoute>
            } />
            <Route path="/courses/:id" element={
              <ProtectedRoute>
                <CourseDetails />
              </ProtectedRoute>
            } />
            <Route path="/courses/:courseId/learn" element={
              <ProtectedRoute>
                <CoursePlayer />
              </ProtectedRoute>
            } />
            <Route path="/my-learning" element={
              <ProtectedRoute allowedRoles={['student', 'corporate_hr']}>
                <MyLearning />
              </ProtectedRoute>
            } />
            <Route path="/career-tools" element={
              <ProtectedRoute allowedRoles={['student']}>
                <CareerToolsPage />
              </ProtectedRoute>
            } />

            {/* Instructor Routes (Trainers & Mentors) */}
            <Route path="/my-courses" element={
              <ProtectedRoute allowedRoles={['trainer', 'mentor']}>
                <MyCourses />
              </ProtectedRoute>
            } />
            <Route path="/instructor/dashboard" element={
              <ProtectedRoute allowedRoles={['trainer', 'mentor']}>
                <InstructorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/instructor/courses" element={
              <ProtectedRoute allowedRoles={['trainer', 'mentor']}>
                <InstructorCourses />
              </ProtectedRoute>
            } />
            <Route path="/instructor/courses/create" element={
              <ProtectedRoute allowedRoles={['trainer']}>
                <CreateCourse />
              </ProtectedRoute>
            } />
            <Route path="/instructor/courses/:id/edit" element={
              <ProtectedRoute allowedRoles={['trainer', 'mentor']}>
                <EditCourse />
              </ProtectedRoute>
            } />
            <Route path="/instructor/courses/:id/content" element={
              <ProtectedRoute allowedRoles={['trainer', 'mentor']}>
                <CourseContentBuilder />
              </ProtectedRoute>
            } />
            <Route path="/instructor/analytics" element={
              <ProtectedRoute allowedRoles={['trainer', 'mentor']}>
                <InstructorAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/instructor/students" element={
              <ProtectedRoute allowedRoles={['trainer', 'mentor']}>
                <InstructorStudents />
              </ProtectedRoute>
            } />
            <Route path="/instructor/live-classes" element={
              <ProtectedRoute allowedRoles={['trainer', 'mentor']}>
                <InstructorLiveClasses />
              </ProtectedRoute>
            } />
            <Route path="/instructor/assignments" element={
              <ProtectedRoute allowedRoles={['trainer', 'mentor']}>
                <InstructorAssignments />
              </ProtectedRoute>
            } />
            
            {/* Internship Routes */}
            <Route path="/internships" element={
              <ProtectedRoute>
                <InternshipListPage />
              </ProtectedRoute>
            } />
            <Route path="/internships/create" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'trainer', 'mentor']}>
                <CreateInternship />
              </ProtectedRoute>
            } />
            <Route path="/internships/:id" element={
              <ProtectedRoute>
                <InternshipDetail />
              </ProtectedRoute>
            } />
            <Route path="/my-internships" element={
              <ProtectedRoute allowedRoles={['student']}>
                <MyInternships />
              </ProtectedRoute>
            } />

            {/* Job & Placement Routes */}
            <Route path="/jobs" element={
              <ProtectedRoute>
                <JobListPage />
              </ProtectedRoute>
            } />
            <Route path="/my-applications" element={
              <ProtectedRoute allowedRoles={['student']}>
                <MyApplications />
              </ProtectedRoute>
            } />
            {/* Note: Employer Portal removed - admins use Invite Users instead */}
            <Route path="/admin/placements" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}>
                <PlacementReportsPage />
              </ProtectedRoute>
            } />

            {/* Franchise Routes */}
            <Route path="/franchise/dashboard" element={
              <ProtectedRoute allowedRoles={['franchise', 'distributor', 'super_distributor', 'affiliate']}>
                <FranchiseDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/partners" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <FranchiseAdminPage />
              </ProtectedRoute>
            } />

            {/* Payment Routes */}
            <Route path="/payments" element={
              <ProtectedRoute>
                <PaymentsPage />
              </ProtectedRoute>
            } />
            <Route path="/subscriptions" element={
              <ProtectedRoute>
                <SubscriptionPlansPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/payments" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}>
                <AdminPaymentsPage />
              </ProtectedRoute>
            } />

            {/* Notification Routes */}
            <Route path="/notifications" element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/communications" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <AdminCommunicationsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}>
                <AdminAnalyticsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/security" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <AdminSecurityPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/controls" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <AdminControlsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/legal" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <AdminLegalPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/roles" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminRolesPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/invite-users" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}>
                <InviteUsersPage />
              </ProtectedRoute>
            } />
            <Route path="/super-admin" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdminPage />
              </ProtectedRoute>
            } />
            
            {/* Public Legal Pages */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/refund" element={<RefundPage />} />
            
            {/* Public Certificate Verification */}
            <Route path="/verify/:id" element={<VerifyCertificate />} />
            
            {/* Admin Certificate Management */}
            <Route path="/admin/certificates" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin', 'trainer']}>
                <AdminCertificates />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/courses" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}>
                <OrgCourses />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}>
                <OrgUsers />
              </ProtectedRoute>
            } />

            {/* Corporate HR / Manager Routes */}
            <Route path="/manager/dashboard" element={
              <ProtectedRoute allowedRoles={['corporate_hr']}>
                <ManagerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/corporate/dashboard" element={
              <ProtectedRoute allowedRoles={['corporate_hr', 'super_admin', 'admin']}>
                <CorporateDashboardPage />
              </ProtectedRoute>
            } />

            {/* Legacy Org Admin Routes (redirect to admin routes) */}
            <Route path="/org/overview" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <OrgOverview />
              </ProtectedRoute>
            } />
            <Route path="/org/courses" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <OrgCourses />
              </ProtectedRoute>
            } />
            <Route path="/org/users" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <OrgUsers />
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
