import { getDatabaseStatus } from '../config/database.js';
import { responseCommon } from '../common/response.js';
import { responseCode } from '../common/constants/constants.js';

export function health(_req, res) {
  const data =  {
      service: 'backend',
      database: getDatabaseStatus(),
      timestamp: new Date().toISOString(),
    }

  return responseCommon (res, data, "Backend is running", 200, responseCode.SUCCESSED);
}
