import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import './App.css';

import Login          from './pages/Login.jsx';
import Register       from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword  from './pages/ResetPassword.jsx';
import VerifyEmail    from './pages/VerifyEmail.jsx';
import Dashboard      from './pages/Dashboard.jsx';
import Courses        from './pages/Courses.jsx';
import Exams          from './pages/Exams.jsx';
import StudyPlan      from './pages/StudyPlan.jsx';
import Availability   from './pages/Availability.jsx';
import Profile        from './pages/Profile.jsx';
import Analytics      from './pages/Analytics.jsx';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* Private Routes */}
        <Route path="/dashboard"    element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/courses"      element={<PrivateRoute><Courses /></PrivateRoute>} />
        <Route path="/exams"        element={<PrivateRoute><Exams /></PrivateRoute>} />
        <Route path="/study-plan"   element={<PrivateRoute><StudyPlan /></PrivateRoute>} />
        <Route path="/availability" element={<PrivateRoute><Availability /></PrivateRoute>} />
        <Route path="/profile"      element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/analytics"    element={<PrivateRoute><Analytics /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}