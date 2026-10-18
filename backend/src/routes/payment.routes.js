import Router from 'express';
import { paymentUrl } from '../controllers/payment.controller.js';

export const paymentRoutes = Router();

paymentRoutes.get('/get-payment-url', paymentUrl);