import * as Ajv from 'ajv';
import { Request, Response } from 'express';
import { Node, NodeProperties, Red } from 'node-red';
import OpenAPISchemaValidator from 'openapi-schema-validator';
import { OpenAPI } from 'openapi-types';
import { openApiServer } from './server';

export interface Settings {
    schema: any;
}

export interface Properties extends NodeProperties {
    operation: string;
}

export function register(RED: Red): void {
    RED.nodes.registerType(
        'openapi-config',
        function openapiConfigNode(this: Node, props: Properties): void {
            RED.nodes.createNode(this, props);
        },
        {
            settings: {
                schema: null,
            },
        },
    );
}
