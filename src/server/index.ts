import { Handler, NextFunction, Request, Response, Router } from 'express';
import { OpenApiValidator } from 'express-openapi-validator';
import { OpenAPIV3 } from 'openapi-types';

export interface Properties {
    app: Router;
    operation: string;
    schema: OpenAPIV3.Document;
    handler: Handler;
}

interface Operation {
    method: string;
    path: string;
    expressPath: string;
    pathSchema: OpenAPIV3.PathItemObject;
    schema: OpenAPIV3.OperationObject;
}

export type DestroyFn = () => void;

function toExpressParams(part: string): string {
    return part.replace(/\{([^}]+)}/g, ':$1');
}

function getOperation(
    schema: OpenAPIV3.Document,
    op: string,
): Operation | undefined {
    let res: Operation | undefined;
    let found = false;

    for (const pathKey in schema.paths) {
        if (found) {
            break;
        }

        const pathObject: OpenAPIV3.PathItemObject = schema.paths[pathKey];

        for (const method in pathObject) {
            const definition: OpenAPIV3.OperationObject = (pathObject as any)[
                method
            ];

            if (definition.operationId === op) {
                res = {
                    method,
                    schema: definition,
                    path: pathKey,
                    expressPath: toExpressParams(pathKey),
                    pathSchema: pathObject,
                };

                found = true;
            }
        }
    }

    return res;
}

function truncateSchema(
    schema: OpenAPIV3.Document,
    op: Operation,
): OpenAPIV3.Document {
    return {
        info: schema.info,
        openapi: schema.openapi,
        components: schema.components,
        tags: schema.tags,
        servers: schema.servers,
        security: schema.security,
        externalDocs: schema.externalDocs,
        paths: {
            [op.path]: {
                $ref: op.pathSchema.$ref,
                summary: op.pathSchema.summary,
                description: op.pathSchema.description,
                parameters: op.pathSchema.parameters,
                servers: op.pathSchema.servers,
                [op.method]: op.schema,
            },
        },
    };
}

export function openApiServer(props: Properties): DestroyFn {
    const router = Router();
    const op = getOperation(props.schema, props.operation);

    if (!op) {
        throw new Error(`Invalid operation name: ${props.operation}`);
    }

    const schema = truncateSchema(props.schema, op);
    const validator = new OpenApiValidator({
        apiSpec: schema,
        validateRequests: true,
        validateResponses: true,
    });

    validator
        .install(router)
        .then(() => {
            const route = (router as any)[op.method] as any;

            if (typeof route !== 'function') {
                throw new Error(
                    `Invalid method name: ${props.operation}.${op.method}`,
                );
            }

            const expressPath = op.path
                .substring(1)
                .split('/')
                .map(toExpressParams)
                .join('/');

            route.call(router, `/${expressPath}`, props.handler);
            router.use(
                (
                    err: Error & any,
                    req: Request & any,
                    res: Response,
                    next: NextFunction,
                ) => {
                    // it's an error from the middleware
                    if (err.status === 404 && req.openapi != null) {
                        return next();
                    }

                    // format error
                    res.status(err.status || 500).json({
                        message: err.message,
                        errors: err.errors,
                    });
                },
            );

            props.app.use(router);
        })
        .catch(err => console.log(err));

    return () => {
        router.stack.length = 0;

        props.app.stack.forEach((route: any, i: any, routes: any) => {
            if (route.handle === router) {
                routes.splice(i, 1);
            }
        });
    };
}
