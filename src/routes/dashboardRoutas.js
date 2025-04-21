import exprees from 'express';
import { getDashboardController } from '../controllers/dashboardController.js'

const router = exprees.Router();

router.get('/dashboard/:id', getDashboardController);

export default router;