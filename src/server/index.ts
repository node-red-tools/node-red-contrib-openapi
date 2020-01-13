import { Red } from 'node-red';
import {} from 'openapi-request-validator';
import { OpenAPI } from 'openapi-types';

export interface Properties {
    operation: string;
    schema: OpenAPI.Document;
}

export function openApiServer(RED: Red, props: Properties): void {
    return;
}
