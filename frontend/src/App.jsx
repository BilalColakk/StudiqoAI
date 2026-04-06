import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import './App.css';

import Login        from './pages/Login.jsx';
import Register     from './pages/Register.jsx';
import Dashboard    from './pages/Dashboard.jsx';
import Courses      from './pages/Courses.jsx';
import Exams        from './pages/Exams.jsx';
import StudyPlan    from './pages/StudyPlan.jsx';
import Availability from './pages/Availability.jsx';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard"    element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/courses"      element={<PrivateRoute><Courses /></PrivateRoute>} />
        <Route path="/exams"        element={<PrivateRoute><Exams /></PrivateRoute>} />
        <Route path="/study-plan"   element={<PrivateRoute><StudyPlan /></PrivateRoute>} />
        <Route path="/availability" element={<PrivateRoute><Availability /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}