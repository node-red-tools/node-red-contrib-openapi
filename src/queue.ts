import cuid from 'cuid';
import { Handler, NextFunction, Request, Response } from 'express';

export type RequestID = string;

interface Context {
    id: RequestID;
    req: Request;
    res: Response;
    next: NextFunction;
}

const requests: {
    [id: string]: Context;
} = {};

export function enqueue(
    req: Request,
    res: Response,
    next: NextFunction,
): RequestID {
    const id = cuid();

    requests[id] = {
        id,
        req,
        res,
        next,
    };

    return id;
}

export function dequeue(id: RequestID, handler: Handler): void {
    const ctx = requests[id];

    if (!ctx) {
        throw new Error('Not found');
    }

    const { req, res, next } = ctx;

    try {
        handler(req, res, next);
    } catch (e) {
        next(e);
        console.log(e);
    } finally {
        delete requests[id];
    }
}
