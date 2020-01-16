import { Handler, IRouter } from 'express';
import { OpenAPIV3 } from 'openapi-types';
import { Unregister } from './models';

export interface Properties {
    router: IRouter;
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

export function openApiRoute(props: Properties): Unregister {
    const { router, schema, operation, handler } = props;
    const spec = getOperation(schema, operation);

    if (!spec) {
        throw new Error(`Invalid operation name: ${operation}`);
    }

    const route = (router as any)[spec.method] as any;

    if (typeof route !== 'function') {
        throw new Error(`Invalid method name: ${operation}.${spec.method}`);
    }

    const expressPath = spec.path
        .substring(1)
        .split('/')
        .map(toExpressParams)
        .join('/');

    route.call(router, `/${expressPath}`, handler);

    return () => {
        router.stack.forEach((route: any, i: any, routes: any) => {
            if (route.handle === router) {
                routes.splice(i, 1);
            }
        });
    };
}
