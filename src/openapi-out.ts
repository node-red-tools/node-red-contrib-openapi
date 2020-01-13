import { Node, NodeProperties, Red } from 'node-red';

export interface Settings {
    schema: any;
}

export interface Properties extends NodeProperties {
    operation: string;
}

export function register(RED: Red): void {
    RED.nodes.registerType(
        'openapi-out',
        function openapiOutNode(this: Node, props: Properties): void {
            RED.nodes.createNode(this, props);

        },
        {
            settings: {
                schema: {},
            },
        },
    );
}
