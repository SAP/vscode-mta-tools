import { forEach } from "lodash";
import { DiagnosticCollection, Disposable, languages } from "vscode";

let diagnosticCollections: Record<string, DiagnosticCollection> = {};

export function getDiagnosticsCollection(
  name: string,
  disposables: Disposable[]
): DiagnosticCollection {
  let collection: DiagnosticCollection = diagnosticCollections[name];
  if (collection === undefined) {
    collection = languages.createDiagnosticCollection(name);
    disposables.push(collection);
    diagnosticCollections[name] = collection;
  }
  return collection;
}

// diagnostics changed event is fired then using clear. Use this function only on uncommon scenarios
export function clearDiagnosticCollections(): void {
  forEach(diagnosticCollections, (collection) => collection.clear());
}

// For testing purposes
export function clearCurrentDiagnosticCollections(): void {
  diagnosticCollections = {};
}
