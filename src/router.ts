import { Handler, Request, Response } from "express";
import nanoid from 'nanoid';

export type RequestID = string;

interface Context {
    id: RequestID;
    req: Request;
    res: Response;
}

const requests: {
    [id: string]: Context
} = {};

export function enqueue(req: Request, res: Response): RequestID {
    const id = nanoid();

    requests[id] = {
        id,
        req,
        res
    };

    return id;
}

export function dequeue(id: RequestID, handler: Handler): void {
    const ctx = requests[id];

    if (!ctx) {
        throw new Error('Not found');
    }

    const { req, res } = ctx;

    try {
        handler(req, res, () => {});
    } catch (e) {
        ctx.res.status(500).end();
        console.log(e);
    } finally {
        delete requests[id];
    }
}