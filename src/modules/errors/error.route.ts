import { Router } from 'express';
import { getAllErrors, getErrorById } from './error.controller';

const router = Router();

router.get('/', getAllErrors);
router.get('/:id', getErrorById);

export default router;
