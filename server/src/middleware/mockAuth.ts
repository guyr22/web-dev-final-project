import { Request, Response, NextFunction } from 'express';

export const mockAuth = (req: Request, res: Response, next: NextFunction) => {
    // Hardcoded mock user
    (req as any).user = { 
        _id: "123456789012345678901234", 
        username: "testuser", 
        email: "test@example.com" 
    };
    next();
};
