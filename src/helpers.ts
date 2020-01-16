import { Red } from 'node-red';
import { ConfigNode, ConfigSchema, LazyRouter } from './models';

export function findSchema(
    RED: Red,
    configId: string,
): ConfigSchema | undefined {
    const node = RED.nodes.getNode(configId) as ConfigNode | null;

    return node ? node.schema : undefined;
}

export function findRouter(RED: Red, configId: string): LazyRouter | undefined {
    const node = RED.nodes.getNode(configId) as ConfigNode | null;

    return node ? node.router : undefined;
}
