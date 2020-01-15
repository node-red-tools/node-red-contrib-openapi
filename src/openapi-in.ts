// import * as Ajv from 'ajv';
import { Node, NodeProperties, Red } from 'node-red';
// import OpenAPISchemaValidator from 'openapi-schema-validator';
// import { OpenAPI } from 'openapi-types';
// import { openApiServer } from './server';

export interface Settings {
    schema: any;
}

export interface Properties extends NodeProperties {
    schema: string;
    operation: string;
}

module.exports = function register(RED: Red): void {
    RED.nodes.registerType('openapi-in', function openapiNode(
        this: Node,
        props: Properties,
    ): void {
        RED.nodes.createNode(this, props);

        // const schema: OpenAPI.Document = RED.settings.schema;

        // if (schema == null) {
        //     return;
        // }

        // const schemaValidator = new OpenAPISchemaValidator({
        //     version: 3,
        // });

        // const result = schemaValidator.validate(schema);

        // if (result.errors.length > 0) {
        //     this.error('Invalid OpenAPI schema:');
        //     result.errors.forEach((err: Ajv.ErrorObject) => {
        //         this.error('    ', err.message);
        //     });

        //     return;
        // }

        // this.warn(`schema ${schema.info.title}`);

        // openApiServer(RED, {
        //     schema,
        //     operation: props.operation,
        // });
    });
};
