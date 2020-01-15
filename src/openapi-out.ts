import { NextFunction, Response } from 'express';
import { Node, NodeProperties, Red } from 'node-red';
import { Message } from './models';
import { dequeue } from './queue';

export interface Properties {
    statusCode: string;
}

module.exports = function register(RED: Red): void {
    RED.nodes.registerType('openapi-out', function openapiOutNode(
        this: Node & Properties,
        props: NodeProperties & Properties,
    ): void {
        RED.nodes.createNode(this, props);

        this.statusCode = props.statusCode || '200';

        this.on('input', (msg: Message) => {
            const id = msg.___openapiReqID;

            if (!id) {
                this.error('Request ID not found');

                return;
            }

            try {
                dequeue(id, (_, res: Response & any, __: NextFunction) => {
                    const statusCode = this.statusCode || '200';
                    const body = msg.payload;

                    if (typeof res.validateResponse === 'function') {
                        // tslint:disable-next-line: max-line-length
                        const validation = res.validateResponse(
                            statusCode,
                            body,
                        ) || { message: undefined, errors: undefined };

                        if (validation.errors) {
                            const errorList = Array.from(validation.errors)
                                .map((e: any) => e.message)
                                .join(',');

                            this.error(`Invalid response for status code ${res.statusCode}: ${errorList}`);

                            return res
                                .status(501)
                                .end();
                        }
                    }

                    res.status(parseFloat(statusCode)).send(body);
                });
            } catch (err) {
                this.error(err);
            }
        });
    });
};
