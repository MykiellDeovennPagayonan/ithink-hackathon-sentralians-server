import express from 'express';
import cors from 'cors';

import corsOptions from './config/corsConfig';
import uploadRoutes from './routes/uploadRoutes';

const app = express();

app.use(cors(corsOptions));

app.use(express.json());

app.use('/api/uploadthing', uploadRoutes());

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

export default app;
