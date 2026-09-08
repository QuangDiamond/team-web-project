import app from './app.js';
import { env } from './config/environment.js';
import { connectDatabase } from './config/database.js';

await connectDatabase();

app.listen(env.port, () => {
  console.log(`Backend running at http://localhost:${env.port}`);
});
