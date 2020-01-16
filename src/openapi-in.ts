import express, { NextFunction, Request, Response } from 'express';
import { Node, NodeProperties, Red } from 'node-red';
import { findSchema } from './helpers';
import { Message } from './models';
import { enqueue } from './queue';
import { openApiServer } from './server';

export interface Properties {
    schema: string;
    operation: string;
}

module.exports = function register(RED: Red): void {
    const app = express();

    if (RED.httpNode != null) {
        RED.httpNode.use(app);
    }

    RED.nodes.registerType('openapi-in', function openapiNode(
        this: Node & Properties,
        props: NodeProperties & Properties,
    ): void {
        RED.nodes.createNode(this, props);

        if (!props.schema) {
            this.error('Schema not set');

            return;
        }

        if (!props.operation) {
            this.error('Operation not set');

            return;
        }

        this.schema = props.schema;
        this.operation = props.operation;

        const spec = findSchema(RED, this.schema);

        if (!spec) {
            this.error(`Schema not found: ${this.schema}`);

            return;
        }

        this.on(
            'close',
            openApiServer({
                app,
                schema: spec.content,
                operation: this.operation,
                handler: (req: Request, res: Response, next: NextFunction) => {
                    const id = enqueue(req, res, next);
                    const msg: Message = {
                        ___openapiReqID: id,
                        cookies: req.cookies,
                        headers: req.headers,
                        params: req.params,
                        path: req.path,
                        payload: req.body,
                        query: req.query,
                        url: req.url,
                    };

                    this.send(msg);
                },
            }),
        );
    });
};
