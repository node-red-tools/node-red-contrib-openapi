import { OpenAPIV3 } from 'openapi-types';

export interface ConfigSchema {
    hash: number;
    content: OpenAPIV3.Document;
}
