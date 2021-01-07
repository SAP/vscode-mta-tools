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

// For testing purposes
export function clearCurrentDiagnosticCollections(): void {
  diagnosticCollections = {};
}
