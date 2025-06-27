import { Router, Request, Response } from 'express';
import userRouter from './user.routes';
import accountRouter from './account.routes';
import mediaRouter from './media.routes';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the API!' });
});

router.use('/users', userRouter);
router.use('/account', accountRouter);
router.use('/media', mediaRouter);

export default router;