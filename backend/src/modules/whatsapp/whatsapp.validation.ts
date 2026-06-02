import { z } from 'zod';

export const whatsappBatchIdParamSchema = z.object({
  id: z.string().uuid('ID de envío inválido'),
});
