import { getDatabaseStatus } from '../config/database.js';

export function health(_req, res) {
  res.json({
    success: true,
    message: 'Backend is running',
    data: {
      service: 'backend',
      database: getDatabaseStatus(),
      timestamp: new Date().toISOString(),
    },
  });
}
