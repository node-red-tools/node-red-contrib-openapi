import { IRouter } from 'express';
import { Node } from 'node-red';
import { OpenAPIV3 } from 'openapi-types';
import { RequestID } from './queue';

export type LazyRouter = (r: Register) => void;
export type Register = (router: IRouter) => void;
export type Unregister = () => void;

export interface ConfigNode extends Node {
    schema: ConfigSchema;
    router: LazyRouter;
}

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
