import dns from 'dns';

/** Render y otros PaaS sin egress IPv6: Node 17+ prefiere AAAA y falla SMTP a Gmail. */
dns.setDefaultResultOrder('ipv4first');

import { createApp } from './app';
import { env } from '@config/env';
import { logger } from '@shared/utils/logger';
import { checkJwtRotationOnStartup } from '@shared/utils/jwt-secrets';
import { verifyEmailOnStartup } from '@shared/services/email.service';
import { WhatsAppService } from '@modules/whatsapp/whatsapp.service';
import {
  startScheduledPublishRunner,
  stopScheduledPublishRunner,
} from '@shared/services/scheduled-publish.service';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Academia Barcelona API corriendo en puerto ${env.PORT}`);
  logger.info(`📡 Ambiente: ${env.NODE_ENV}`);
  logger.info(`🔗 Prefijo: ${env.API_PREFIX}`);
  checkJwtRotationOnStartup();
  verifyEmailOnStartup();
  void WhatsAppService.startup().catch((e) => {
    logger.warn('WhatsApp no inició al arranque', { err: e });
  });
  startScheduledPublishRunner();
});

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info(`${signal} recibido. Cerrando servidor...`);
  stopScheduledPublishRunner();
  void WhatsAppService.shutdown().finally(() => {
    server.close(() => {
      logger.info('Servidor cerrado.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default server;
