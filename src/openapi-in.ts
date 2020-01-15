import { Node, NodeProperties, Red } from 'node-red';
import { ConfigSchema, Message } from './models';
// import { findSchema } from './openapi-schema';
import { enqueue } from './queue';
import { openApiServer } from './server';

export interface Properties {
    schema: string;
    operation: string;
}

function findSchema(RED: Red, configId: string): ConfigSchema | undefined {
    const node = RED.nodes.getNode(configId) as any;

    if (node && node.schema) {
        return node.schema;
    }

    return undefined;
}

module.exports = function register(RED: Red): void {
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
                app: RED.httpNode,
                schema: spec.content,
                operation: this.operation,
                handler: (req, res) => {
                    const id = enqueue(req, res);
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
