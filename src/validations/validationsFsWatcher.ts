import { mta, Mta } from "@sap/mta-lib";
import { keys, map } from "lodash";
import { dirname, resolve } from "path";
import {
  Uri,
  Disposable,
  workspace,
  Diagnostic,
  DiagnosticSeverity,
  Range,
  Position,
} from "vscode";
import { getDiagnosticsCollection } from "../utils/diagnosticUtils";
import { DEV_MTA_EXT, MTA_YAML } from "../utils/utils";

export function watchMtaYamlAndDevExtFiles(disposables: Disposable[]): void {
  const fileWatcher = workspace.createFileSystemWatcher(
    `**/{${MTA_YAML},${DEV_MTA_EXT}}`,
    false, // Do not ignore when files have been created
    false, // Do not ignore when files have been changed.
    false // Do not ignore when files have been deleted.
  );

  fileWatcher.onDidChange(
    (uri) => addModuleDiagnostics(uri, disposables),
    undefined,
    disposables
  );

  fileWatcher.onDidCreate(
    (uri) => addModuleDiagnostics(uri, disposables),
    undefined,
    disposables
  );

  fileWatcher.onDidDelete(
    (uri) => addModuleDiagnostics(uri, disposables),
    undefined,
    disposables
  );

  async function addModuleDiagnostics(
    uri: Uri,
    disposables: Disposable[]
  ): Promise<void> {
    const modulePath = dirname(uri.fsPath);

    // Create the diagnostics collection. The collections are cached so that we can clear them in subsequent runs.
    const moduleDiagnostics = getDiagnosticsCollection(
      `Diagnostics for module: ${modulePath}`,
      disposables
    );

    const collectionEntries: [Uri, Diagnostic[] | undefined][] = [];
    try {
      // Clear existing entries in this collection from previous runs
      // This is done "manually" and not via a call to clear() so that we only fire diagnostics changed event once
      moduleDiagnostics.forEach((uri) =>
        collectionEntries.push([uri, undefined])
      );

      const diagnosticsByFile = await getMtaDiagnostics(modulePath);

      const newCollectionEntries = map(
        diagnosticsByFile,
        (fileDiagnostics, filePath): [Uri, Diagnostic[]] => [
          Uri.file(filePath),
          fileDiagnostics,
        ]
      );
      collectionEntries.push(...newCollectionEntries);
    } finally {
      // Add the diagnostics to the collection. This updates the problems view.
      moduleDiagnostics.set(collectionEntries);
    }
  }

  async function getMtaDiagnostics(
    modulePath: string
  ): Promise<Record<string, Diagnostic[]>> {
    const diagnosticsByFile: Record<string, Diagnostic[]> = {};
    const devMtaExtPath = resolve(modulePath, DEV_MTA_EXT);

    const mta = new Mta(modulePath, false, [devMtaExtPath]); // temp file is not relevant in our scenario

    const validationRes: Record<string, mta.Issue[]> = await mta.validate();

    for (const filePath of keys(validationRes)) {
      diagnosticsByFile[filePath] = diagnosticsByFile[filePath] ?? [];

      for (const issue of validationRes[filePath]) {
        const position = new Position(issue.line, issue.column);
        diagnosticsByFile[filePath].push({
          message: issue.message,
          range: new Range(position, position),
          severity:
            issue.severity === "error"
              ? DiagnosticSeverity.Error
              : DiagnosticSeverity.Warning,
        });
      }
    }
    return diagnosticsByFile;
  }
}
