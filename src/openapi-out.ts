import { NextFunction, Response } from 'express';
import { Node, NodeProperties, Red } from 'node-red';
import { Message } from './models';
import { dequeue } from './queue';

export interface Properties {
    statusCode: string;
    fromMessage: boolean;
}

module.exports = function register(RED: Red): void {
    RED.nodes.registerType('openapi-out', function openapiOutNode(
        this: Node & Properties,
        props: NodeProperties & Properties,
    ): void {
        RED.nodes.createNode(this, props);

        this.statusCode = props.statusCode || '500';
        this.fromMessage = props.fromMessage || false;

        this.on('input', (msg: Message & { statusCode?: number | string }) => {
            const id = msg.___openapiReqID;

            if (!id) {
                this.error('Request ID not found');

                return;
            }

            try {
                dequeue(id, (_, res: Response, __: NextFunction) => {
                    let statusCode = '500';

                    if (this.fromMessage && msg.statusCode) {
                        statusCode = msg.statusCode.toString();
                    } else {
                        statusCode = this.statusCode;
                    }

                    res.status(parseFloat(statusCode));

                    if (typeof msg.payload !== 'undefined') {
                        res.send(msg.payload);
                    } else {
                        res.end();
                    }
                });
            } catch (err) {
                this.error(err);
            }
        });
    });
};
