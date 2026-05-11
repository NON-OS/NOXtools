import { namespaceHash, namespaceType, normalizeNamespace } from "../../core/namespace.js";

export class NamespaceSurface {
  hash(name: string): string { return namespaceHash(name); }
  normalize(name: string): string { return normalizeNamespace(name); }
  type(name: string) { return namespaceType(name); }
}
