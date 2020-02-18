import * as Ajv from 'ajv';
import { NextFunction, Request, Response, Router } from 'express';
import { OpenApiValidator } from 'express-openapi-validator';
import { NodeProperties, Red } from 'node-red';
import createHash from 'object-hash';
import OpenAPISchemaValidator from 'openapi-schema-validator';
import { OpenAPIV3 } from 'openapi-types';
import { findSchema } from './helpers';
import { ConfigNode, ConfigSchema, Register } from './models';

export interface Properties extends NodeProperties {
    schema?: ConfigSchema;
}

module.exports = function register(RED: Red): void {
    const schemaValidator = new OpenAPISchemaValidator({
        version: 3,
    });
    const mainRouter = Router();

    if (RED.httpNode) {
        RED.httpNode.use(mainRouter);
    }

    RED.nodes.registerType('openapi-schema', function openapiSchemaNode(
        this: ConfigNode,
        props: Properties,
    ): void {
        RED.nodes.createNode(this, props);

        if (props.schema == null) {
            return;
        }

        const schema: OpenAPIV3.Document = props.schema;
        const result = schemaValidator.validate(schema);

        if (result.errors.length > 0) {
            this.error('Invalid OpenAPI schema:');

            result.errors.forEach((err: Ajv.ErrorObject) => {
                this.error('    ', err.message);
            });

            return;
        }

        const router = Router();
        const routes: Register[] = [];

        this.schema = props.schema;
        this.router = (fn: Register) => {
            routes.push(fn);
        };

        mainRouter.use(router);

        const validator = new OpenApiValidator({
            apiSpec: schema,
            validateRequests: true,
            validateResponses: true,
        });

        validator.install(router).then(() => {
            routes.forEach(r => r(router));
            routes.length = 0;

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
        });

        this.on('close', () => {
            router.stack.length = 0;

            mainRouter.stack.forEach((route: any, i: any, routes: any) => {
                if (route.handle === router) {
                    routes.splice(i, 1);
                }
            });
        });
    });

    if (RED.httpAdmin != null) {
        RED.httpAdmin.get(
            '/openapi/:id/paths',
            (req: Request, res: Response) => {
                const schema = findSchema(RED, req.params.id);

                if (!schema) {
                    return res.status(404).end();
                }

                return res.status(200).send(schema.paths);
            },
        );

        RED.httpAdmin.post(
            '/openapi/compare',
            (req: Request, res: Response) => {
                if (!req.body) {
                    return res.status(400).end();
                }


                const { current, next }  = req.body;

                if (!current || !next) {
                    return res.status(400).end();
                }

                const currentHash = createHash(current);
                const otherHash = createHash(next);

                return res.status(200).send(currentHash === otherHash);
            }
        );

        RED.httpAdmin.post(
            '/openapi/validate',
            (req: Request, res: Response) => {
                const schema = req.body;

                if (!schema) {
                    return res.status(400).end();
                }

                return res.json(schemaValidator.validate(schema));
            },
        );
    }
};
