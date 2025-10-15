import { Router, Request, Response } from 'express';
import accountRouter from './account.routes';



const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the API!' });
});

router.use('/account', accountRouter);


export default router;