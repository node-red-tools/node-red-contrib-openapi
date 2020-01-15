import { Node, NodeProperties, Red } from 'node-red';

export interface Properties extends NodeProperties {
    schema: string;
    operation: string;
}

module.exports = function register(RED: Red): void {
    RED.nodes.registerType('openapi-out', function openapiOutNode(
        this: Node,
        props: Properties,
    ): void {
        RED.nodes.createNode(this, props);
    });
};
