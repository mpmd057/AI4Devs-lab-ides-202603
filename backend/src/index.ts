import express from 'express';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import candidateRoutes from './routes/candidateRoutes';

dotenv.config();

export const app = express();

const port = 3010;

app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Hello LTI!');
});

app.use(candidateRoutes);
app.use(errorHandler);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}
