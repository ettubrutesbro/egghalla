import { createContext, useContext, type ReactNode } from 'react';
import type { Graph } from '../../schema/types';
import { placeholderGraph } from './placeholderGraph';

const GraphContext = createContext<Graph>(placeholderGraph);

/** Blocks carry refs, not data; any component can resolve them through this. */
export function GraphProvider({ graph, children }: { graph: Graph; children: ReactNode }) {
  return <GraphContext.Provider value={graph}>{children}</GraphContext.Provider>;
}

export const useGraph = () => useContext(GraphContext);
