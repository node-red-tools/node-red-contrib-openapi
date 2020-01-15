import { OpenAPIV3 } from 'openapi-types';
import { RequestID } from './queue';

export interface ConfigSchema {
    hash: number;
    content: OpenAPIV3.Document;
}

export interface Message {
    ___openapiReqID: RequestID;
    cookies: any;
    headers: any;
    params: any;
    path: any;
    payload: any;
    query: any;
    url: string;
}
