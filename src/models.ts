import { OpenAPI } from 'openapi-types';

export interface ConfigSchema {
    hash: number;
    content: OpenAPI.Document;
}
