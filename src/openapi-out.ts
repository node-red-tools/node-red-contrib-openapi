import { Response } from 'express';
import { Node, NodeProperties, Red } from 'node-red';
import { Message } from './models';
import { dequeue } from './queue';

export interface Properties {
    statusCode: number;
}

module.exports = function register(RED: Red): void {
    RED.nodes.registerType('openapi-out', function openapiOutNode(
        this: Node & Properties,
        props: NodeProperties & Properties,
    ): void {
        RED.nodes.createNode(this, props);

        this.statusCode = props.statusCode || 200;

        this.on('input', (msg: Message) => {
            const id = msg.___openapiReqID;

            if (!id) {
                this.error('Request ID not found');

                return;
            }

            try {
                dequeue(id, (_, res: Response) => {
                    const statusCode = this.statusCode || 200;
                    res.status(statusCode).send(msg.payload);
                });
            } catch (err) {
                this.error(err);
            }
        });
    });
};
