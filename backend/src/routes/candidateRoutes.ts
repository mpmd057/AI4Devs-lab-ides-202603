import { Router } from 'express';
import { postCandidate } from '../presentation/controllers/candidateController';

const candidateRoutes = Router();

candidateRoutes.post('/candidates', postCandidate);

export default candidateRoutes;
