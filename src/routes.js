/*
  Centraliza Todas as rotas da aplicação
*/

import { Router } from 'express'; // const Router = require('express').Router;
import multer from 'multer';
import multerConfig from './config/multer';

// Import Controllers
import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import authMiddlewares from './app/middlewares/auth';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProviderController';
import AppointmentController from './app/controllers/AppointmentController';
import ScheduleController from './app/controllers/ScheduleController';

const routes = new Router();
const uploads = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

// Rotas que necessitam de autenticação
routes.use(authMiddlewares);
routes.put('/users', UserController.update);
routes.post('/files', uploads.single('file'), FileController.store);
routes.get('/providers', ProviderController.index);
routes.post('/appointments', AppointmentController.store);
routes.get('/appointments', AppointmentController.index);
routes.get('/schedule', ScheduleController.index);

export default routes;
