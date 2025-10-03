import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithCorrelation extends Request {
  correlationId: string;
}

export class CorrelationMiddleware {
  static handle(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    (req as any).correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);

    next();
  }
}
