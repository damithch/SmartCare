import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, getRoleLandingPath, useAppContext } from './context/AppContext';
import { TopBar as HomeTopBar } from './components/Home/TopBar';
import { Navbar as HomeNavbar } from './components/Home/Navbar';
import { HeroSection } from './components/Home/HeroSection';
import { WelcomeSection } from './components/Home/WelcomeSection';
import { FeaturesGrid } from './components/Home/FeaturesGrid';
import { ServicesCarousel } from './components/Home/ServicesCarousel';
import { StatsSection } from './components/Home/StatsSection';
import { DoctorShowcase } from './components/Home/DoctorShowcase';
import { TestimonialsSection } from './components/Home/TestimonialsSection';
import { SocialBar } from './components/Home/SocialBar';
import { Footer } from './components/Home/Footer';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { AppointmentBooking } from './pages/patient/AppointmentBooking';
import { MyAppointments } from './pages/patient/MyAppointments';
import { MedicalHistory } from './pages/patient/MedicalHistory';
import { MedicinePayments } from './pages/patient/MedicinePayments';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { MySchedule } from './pages/doctor/MySchedule';
import { AvailabilityManager } from './pages/doctor/AvailabilityManager';
import { ConsultationPage } from './pages/doctor/ConsultationPage';
import { AppointmentRequests } from './pages/doctor/AppointmentRequests';
import { PharmacistDashboard } from './pages/pharmacist/PharmacistDashboard';
import { PrescriptionQueue } from './pages/pharmacist/PrescriptionQueue';
import { InventoryPage } from './pages/pharmacist/InventoryPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { PaymentManagement } from './pages/admin/PaymentManagement';
import { ProfilePage } from './pages/profile/ProfilePage';

const HomePage = () => (
  <div className="min-h-screen bg-white font-sans text-[#1A1A2E] selection:bg-[#00BCD4] selection:text-white">
    <HomeTopBar />
    <HomeNavbar />
    <main>
      <HeroSection />
      <WelcomeSection />
      <FeaturesGrid />
      <ServicesCarousel />
      <StatsSection />
      <DoctorShowcase />
      <TestimonialsSection />
      <SocialBar />
    </main>
    <Footer />
  </div>
);

const pageComponents = {
  'patient-dashboard': PatientDashboard,
  'book-appointment': AppointmentBooking,
  'my-appointments': MyAppointments,
  'medical-history': MedicalHistory,
  'medicine-payments': MedicinePayments,
  'doctor-dashboard': DoctorDashboard,
  approvals: AppointmentRequests,
  'my-schedule': MySchedule,
  availability: AvailabilityManager,
  consultations: ConsultationPage,
  'pharmacist-dashboard': PharmacistDashboard,
  prescriptions: PrescriptionQueue,
  inventory: InventoryPage,
  'admin-dashboard': AdminDashboard,
  'user-management': AdminDashboard,
  'payment-management': PaymentManagement,
  profile: ProfilePage
};

const AppShell = () => {
  const { user } = useAppContext();
  const dashboardPath = user ? getRoleLandingPath(user.role) : '/';

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={user ? <Navigate to={dashboardPath} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={dashboardPath} replace /> : <RegisterPage />} />

      {Object.entries(pageComponents).map(([path, Component]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            user ? (
              <DashboardLayout>
                <Component />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Toaster position="top-right" />
        <AppShell />
      </AppProvider>
    </BrowserRouter>
  );
}
