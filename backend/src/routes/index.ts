import { Router } from 'express';
import { register, login, logout } from '../controllers/auth.controller';
import { createAppointment, cancelAppointment, getServices, getAdminAppointments } from '../controllers/appointment.controller';
import { clientManageAppointment, getClientAppointments, getProfile, updateProfile } from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middlewares/auth';
import { updateAppointment, adminCancelAppointment } from '../controllers/appointment.controller';

export const routes = Router();

// Auth
routes.post('/auth/register', register);
routes.post('/auth/login', login);
routes.post('/auth/logout', logout);

// User
routes.get('/user/profile', authenticate, getProfile);
routes.put('/user/profile', authenticate, updateProfile);
routes.get('/user/appointments', authenticate, getClientAppointments);
routes.put('/user/appointments/:id', authenticate, clientManageAppointment);

// Services
routes.get('/services', getServices);

// Appointments
routes.post('/appointments', authenticate, createAppointment);
routes.delete('/appointments/:id', authenticate, cancelAppointment);

// Admin
routes.get('/admin/appointments', authenticate, requireAdmin, getAdminAppointments);
routes.put('/admin/appointments/:id', authenticate, requireAdmin, updateAppointment);
routes.delete('/admin/appointments/:id', authenticate, requireAdmin, adminCancelAppointment);
