import { Router } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdminOrCoach } from '@middlewares/role.middleware';
import { validateBody, validateQuery } from '@middlewares/validate.middleware';
import { AttendanceController } from './attendance.controller';
import { attendancePeriodQuerySchema, attendanceUpsertBodySchema } from './attendance.validation';

export const attendanceRouter = Router();

attendanceRouter.use(authMiddleware, requireAdminOrCoach);

attendanceRouter.get('/', validateQuery(attendancePeriodQuerySchema), AttendanceController.getGrid);
attendanceRouter.put('/', validateBody(attendanceUpsertBodySchema), AttendanceController.upsert);
