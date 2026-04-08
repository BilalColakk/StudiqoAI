import api from './api.js';

// Auth
export const registerUser  = (data) => api.post('/register', data);
export const loginUser     = (data) => api.post('/login',    data);
export const forgotPassword = (data) => api.post('/forgot-password', data);
export const resetPassword = (data) => api.post('/reset-password', data);
export const verifyEmail   = (token) => api.post(`/verify-email?token=${token}`);
export const getMe         = ()     => api.get('/me');
export const updateMe      = (data) => api.put('/me', data);

// Courses
export const getCourses    = ()     => api.get('/courses/my-courses');
export const createCourse  = (data) => api.post('/courses/', data);
export const updateCourse  = (id, data) => api.put(`/courses/${id}/difficulty`, data);
export const deleteCourse  = (id)   => api.delete(`/courses/${id}`);

// Exams
export const getExams      = ()     => api.get('/exams/my-exams');
export const createExam    = (data) => api.post('/exams/', data);
export const updateExam    = (id, data) => api.put(`/exams/${id}`, data);
export const deleteExam    = (id)   => api.delete(`/exams/${id}`);

// Availability
export const getAvailability  = ()     => api.get('/availabilities/my');
export const setAvailability  = (data) => api.post('/availabilities/set', data);

// Plans
export const generatePlan     = (data) => api.post('/plans/generate', data);
export const regenerateAdaptive = (data) => api.post('/plans/regenerate-adaptive', data);
export const getLatestPlan    = ()     => api.get('/plans/latest');
export const getPlanProgress  = ()     => api.get('/plans/progress/latest');
export const completeEntry    = (id, data)   => api.patch(`/plans/entries/${id}/complete`, data);
export const skipEntry        = (id)   => api.patch(`/plans/entries/${id}/skip`);
export const getProductivityStats = () => api.get('/plans/stats/productivity');
