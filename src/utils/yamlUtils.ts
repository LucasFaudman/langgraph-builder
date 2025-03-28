import yaml from 'js-yaml'
import { type Edge } from '@xyflow/react';

// YAML Types
export type YamlNode = {
  name: string;
}

export type YamlEdge = {
  from: string;
  to?: string;
  condition?: string;
  paths?: string[];
}

export type YamlConfig = {
  name: string;
  builder_name: string;
  compiled_name: string;
  config: string;
  state: string;
  input: string;
  output: string;
  implementation: string;
  language?: 'python' | 'typescript';
  nodes: YamlNode[];
  edges: YamlEdge[];
}

/**
 * Parses a YAML specification string into a YamlConfig object
 */
export function parseYamlSpec(yamlContent: string) {
  try {
    const parsed = yaml.load(yamlContent) as YamlConfig;
    return parsed;
  } catch (e) {
    console.error('Failed to parse YAML:', e);
    return null;
  }
}

/**
 * Generates a YAML specification string from the current graph
 */
export function generateSpec(
  edges: Edge[], 
  nodes: any[], 
  configValues: YamlConfig, 
  currentLanguage: 'python' | 'typescript' = 'python'
): string {
  // Step 1: Separate normal edges and animated edges
  const normalEdges: any[] = edges.filter((edge: any) => !edge.animated)
  const animatedEdges: any[] = edges.filter((edge: any) => edge.animated === true)

  // Step 2: Group animated edges by source
  const animatedEdgesBySource: Record<string, Edge[]> = {}
  animatedEdges.forEach((edge) => {
    if (!animatedEdgesBySource[edge.source]) {
      animatedEdgesBySource[edge.source] = []
    }
    animatedEdgesBySource[edge.source].push(edge)
  })

  // Step 3: Build nodes list (unique nodes from all edges, excluding source and end nodes)
  const nodeNames: Set<string> = new Set()
  edges.forEach((edge: any) => {
    const sourceNode = nodes.find((n) => n.id === edge.source)
    const targetNode = nodes.find((n) => n.id === edge.target)

    // Only add nodes that aren't source or end nodes
    if (sourceNode && sourceNode.type !== 'source' && sourceNode.type !== 'end' && sourceNode.data?.label) {
      nodeNames.add(sourceNode.data.label as string)
    }
    if (targetNode && targetNode.type !== 'source' && targetNode.type !== 'end' && targetNode.data?.label) {
      nodeNames.add(targetNode.data.label as string)
    }
  })

  // Step 4: Build YAML structure with special handling for source/end connections
  const yaml: YamlConfig = {
    ...configValues,
    nodes: Array.from(nodeNames).map((name) => ({ name })),
    edges: [
      // Handle source node connections (convert to __start__)
      ...normalEdges
        .filter((edge) => {
          const sourceNode = nodes.find((n) => n.id === edge.source)
          return sourceNode?.type === 'source'
        })
        .map((edge) => {
          const targetNode = nodes.find((n) => n.id === edge.target)
          return {
            from: '__start__',
            to: targetNode?.data?.label || '',
          } as YamlEdge
        }),

      // Handle end node connections (convert to __end__)
      ...normalEdges
        .filter((edge) => {
          const targetNode = nodes.find((n) => n.id === edge.target)
          return targetNode?.type === 'end'
        })
        .map((edge) => {
          const sourceNode = nodes.find((n) => n.id === edge.source)
          return {
            from: sourceNode?.data?.label || '',
            to: '__end__',
          } as YamlEdge
        }),

      // Handle normal edges between custom nodes
      ...normalEdges
        .filter((edge) => {
          const sourceNode = nodes.find((n) => n.id === edge.source)
          const targetNode = nodes.find((n) => n.id === edge.target)
          return sourceNode?.type !== 'source' && targetNode?.type !== 'end'
        })
        .map((edge) => {
          const sourceNode = nodes.find((n) => n.id === edge.source)
          const targetNode = nodes.find((n) => n.id === edge.target)
          return {
            from: sourceNode?.data?.label || '',
            to: targetNode?.data?.label || '',
          } as YamlEdge
        }),

      // Handle conditional edges
      ...Object.entries(animatedEdgesBySource).map(([source, edges]) => {
        const sourceNode = nodes.find((n) => n.id === source)
        // If source is the source node, use __start__ instead
        const fromNode = sourceNode?.type === 'source' ? '__start__' : sourceNode?.data?.label || ''
        return {
          from: fromNode,
          condition: String(edges[0].label || ''),
          paths: edges.map((edge) => {
            const targetNode = nodes.find((n) => n.id === edge.target)
            // If target is the end node, use __end__ instead
            return targetNode?.type === 'end' ? '__end__' : targetNode?.data?.label || ''
          }),
        } as YamlEdge
      }),
    ],
  }

  // Convert to YAML string
  const yamlString = Object.entries(yaml)
    .map(([key, value]) => {
      if (key === 'nodes' && Array.isArray(value)) {
        const nodes = value as YamlNode[]
        return `${key}:\n${nodes.map((node) => `  - name: ${node.name}`).join('\n')}`
      }
      if (key === 'edges' && Array.isArray(value)) {
        const edges = value as YamlEdge[]
        return `${key}:\n${edges
          .map((edge) => {
            if ('condition' in edge) {
              return `  - from: ${edge.from}\n    condition: ${edge.condition}\n    paths: [${edge.paths?.join(', ')}]`
            }
            return `  - from: ${edge.from}\n    to: ${edge.to}`
          })
          .join('\n')}`
      }
      if (key === 'name') {
        return `name: ${value}`
      }
      return `${key}: ${value}`
    })
    .join('\n')

  // Add descriptive comment at the top
  const fileExt = currentLanguage === 'python' ? '.py' : '.ts'
  const comment = `# This YAML was auto-generated based on an architecture 
# designed in LangGraph Builder (https://build.langchain.com).
#
# The YAML was used by langgraph-gen (https://github.com/langchain-ai/langgraph-gen-py) 
# to generate a code stub for a LangGraph application that follows the architecture.
#
# langgraph-gen is an open source CLI tool that converts YAML specifications into LangGraph code stubs.
#
# The code stub generated from this YAML can be found in stub${fileExt}.
#
# A placeholder implementation for the generated stub can be found in implementation${fileExt}.

`

  return comment + yamlString
} 