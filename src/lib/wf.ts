export function getWebflow(): WebflowDesignerAPI | undefined {
  const w = (window as any);
  return w.webflow ?? w.parent?.webflow ?? undefined;
}
