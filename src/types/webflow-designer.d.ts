// Minimal types for Webflow Designer Extensions Variables API used here
// This is intentionally partial to cover only what's used.

declare global {
  interface VariableMode { id: string; name: string; slug?: string }
  interface Variable {
    id: string;
    type: 'Color' | string;
    getName(): Promise<string>;
    get(options?: { mode?: VariableMode; customValues?: boolean }): Promise<string | Variable | { type: 'custom'; value: string }>;
    set(value: string | Variable | { type: 'custom'; value: string }, options?: { mode?: VariableMode }): Promise<null>;
  }
  interface VariableCollection {
    id: string;
  getName?: () => Promise<string>;
    getAllVariables(): Promise<Variable[]>;
    getVariableByName(name: string): Promise<Variable | null>;
    createColorVariable(name: string, value: string): Promise<Variable>;
    getAllVariableModes(): Promise<VariableMode[]>;
    createVariableMode(name: string): Promise<VariableMode>;
  }
  interface WebflowDesignerAPI {
    getAllVariableCollections(): Promise<VariableCollection[]>;
    createVariableCollection(name: string): Promise<VariableCollection>;
    getDefaultVariableCollection(): Promise<VariableCollection | null>;
  getVariableCollectionByName?: (name: string) => Promise<VariableCollection | null>;
  getVariableCollectionById?: (id: string) => Promise<VariableCollection | null>;
  }
  var webflow: WebflowDesignerAPI | undefined;
}

export {};
