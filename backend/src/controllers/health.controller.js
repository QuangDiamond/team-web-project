import { getDatabaseStatus } from '../config/database.js';
import { responseCommon } from '../common/response.js';
import { responseCode } from '../common/constants/constants.js';

export function health(_req, res) {
  const data =  {
      service: 'backend',
      databaseConnection: getDatabaseStatus(),
      databaseType: process.env.NODE_ENV === "development" ? "mongodb":"mongodb+srv",
      timestamp: new Date().toISOString(),
    }

  return responseCommon (res, data, "Backend is running", 200, responseCode.SUCCESSED);
}
