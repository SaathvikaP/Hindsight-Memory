import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chatRoutes from './routes/chat.routes.js';
import healthRoutes from './routes/health.js';
import memoryRoutes from './routes/memory.routes.js';
import demoRoutes from './routes/demo.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api', chatRoutes);
app.use('/api', memoryRoutes);
app.use('/api', demoRoutes);

app.listen(PORT, () => {
  console.log(`RecallDesk AI server listening on http://localhost:${PORT}`);
});
