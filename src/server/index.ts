import express, {
    Application,
    Handler,
    NextFunction,
    Request,
    Response,
} from 'express';
import { initialize } from 'express-openapi';
import { IOpenAPIRequestValidator } from 'openapi-request-validator';
import { OpenAPIV3 } from 'openapi-types';

export interface Properties {
    app: Application;
    operation: string;
    schema: OpenAPIV3.Document;
    handler: Handler;
}

export type DestroyFn = () => void;

function truncateSchema(
    schema: OpenAPIV3.Document,
    op: string,
): OpenAPIV3.Document {
    const paths: OpenAPIV3.PathsObject = {};
    const next: OpenAPIV3.Document = {
        paths,
        info: schema.info,
        openapi: schema.openapi,
        components: schema.components,
        tags: schema.tags,
        servers: schema.servers,
        security: schema.security,
        externalDocs: schema.externalDocs,
    };

    let found = false;

    for (const pathKey in schema.paths) {
        if (found) {
            break;
        }

        const pathObject: OpenAPIV3.PathItemObject = schema.paths[pathKey];

        for (const methodName in pathObject) {
            const method: OpenAPIV3.OperationObject = (pathObject as any)[
                methodName
            ];

            if (method.operationId === op) {
                paths[pathKey] = {
                    $ref: pathObject.$ref,
                    summary: pathObject.summary,
                    description: pathObject.description,
                    parameters: pathObject.parameters,
                    servers: pathObject.servers,
                    [methodName]: method,
                };

                found = true;
            }
        }
    }

    return next;
}

export function openApiServer(props: Properties): DestroyFn {
    const schema = truncateSchema(props.schema, props.operation);
    const sub = express();

    initialize({
        app: sub,
        apiDoc: schema,
        operations: {
            [props.operation]: (
                req: Request & IOpenAPIRequestValidator,
                res: Response,
                next: NextFunction,
            ) => {
                console.log(req.validateRequest);

                return props.handler(req, res, next);
            },
        },
        enableObjectCoercion: true,
    });

    props.app.use(sub);

    return () => {
        const index = props.app.stack.findIndex(i => i === sub);

        if (index === -1) {
            return;
        }

        props.app.stack.splice(index, 1);
    };
}
