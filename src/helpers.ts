import { Red } from 'node-red';
import { ConfigSchema } from './models';

export function findSchema(
    RED: Red,
    configId: string,
): ConfigSchema | undefined {
    const node = RED.nodes.getNode(configId) as { schema?: ConfigSchema };

    if (node && node.schema) {
        return node.schema;
    }

    return undefined;
}
