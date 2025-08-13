export function getWebflow(): WebflowDesignerAPI | undefined {
  const w = (window as any);
  return w.webflow ?? w.parent?.webflow ?? undefined;
}

export async function setPreferredSize() {
  const wf = getWebflow() as any;
  try {
    if (wf && typeof wf.setExtensionSize === 'function') {
      await wf.setExtensionSize('comfortable');
    }
  } catch {}
}
