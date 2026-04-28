import { Router } from 'express';
import { predictWaitTime } from '../controllers/ai.controller.js';

const router = Router();

router.post('/predict-wait-time', predictWaitTime);

export default router;
