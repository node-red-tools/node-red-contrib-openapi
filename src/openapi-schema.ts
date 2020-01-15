import * as Ajv from 'ajv';
import { Request, Response } from 'express';
import { Node, NodeProperties, Red } from 'node-red';
import OpenAPISchemaValidator from 'openapi-schema-validator';
import { OpenAPI } from 'openapi-types';
import { ConfigSchema } from './models';

export interface Properties extends NodeProperties {
    schema?: ConfigSchema;
}

export function findSchema(RED: Red, configId: string): ConfigSchema | undefined {
    const node = RED.nodes.getNode(configId) as Properties;

    if (node && node.schema) {
        return node.schema;
    }

    return undefined;
}

module.exports = function register(RED: Red): void {
    RED.nodes.registerType('openapi-schema', function openapiSchemaNode(
        this: Node & Properties,
        props: Properties,
    ): void {
        RED.nodes.createNode(this, props);

        if (props.schema == null) {
            return;
        }

        const schema: OpenAPI.Document = props.schema.content;

        const schemaValidator = new OpenAPISchemaValidator({
            version: 3,
        });

        const result = schemaValidator.validate(schema);

        if (result.errors.length > 0) {
            this.error('Invalid OpenAPI schema:');

            result.errors.forEach((err: Ajv.ErrorObject) => {
                this.error('    ', err.message);
            });

            return;
        }

        this.schema = props.schema;
    });

    if (RED.httpAdmin != null) {
        RED.httpAdmin.get(
            '/openapi/:id/paths',
            (req: Request, res: Response) => {
                const schema = findSchema(RED, req.params.id);

                if (!schema) {
                    return res.status(404).end();
                }

                return res.status(200).send(schema.content.paths);
            },
        );
    }
};
