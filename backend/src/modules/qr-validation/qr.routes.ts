import { Router } from 'express';
import { QrController } from './qr.controller';

export const qrRouter = Router();

// Validar QR públicamente (escaneo desde celular)
qrRouter.get('/validate/:token', QrController.validate);

// Generar imagen QR de un jugador
qrRouter.get('/player/:id/image', QrController.getImage);
