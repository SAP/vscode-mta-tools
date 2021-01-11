import { mta, Mta } from "@sap/mta-lib";
import { pathExists } from "fs-extra";
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
import {
  clearDiagnosticCollections,
  getDiagnosticsCollection,
} from "./mtaDiagnostic";
import { DEV_MTA_EXT, MTA_YAML } from "../../utils/utils";

export function watchMtaYamlAndDevExtFiles(disposables: Disposable[]): void {
  // Handles mta.yaml and dev.mtaext FILES
  const mtaFileWatcher = workspace.createFileSystemWatcher(
    `**/{${MTA_YAML},${DEV_MTA_EXT}}`,
    false, // Do not ignore when files have been created
    false, // Do not ignore when files have been changed.
    false // Do not ignore when files have been deleted.
  );

  mtaFileWatcher.onDidChange(
    (uri) => addModuleDiagnostics(uri, disposables),
    undefined,
    disposables
  );

  mtaFileWatcher.onDidCreate(
    (uri) => addModuleDiagnostics(uri, disposables),
    undefined,
    disposables
  );

  // this event is fired for FOLDERS which contain mta.yaml and dev.mtaext on theia but NOT on vs code
  mtaFileWatcher.onDidDelete(
    (uri) => addModuleDiagnostics(uri, disposables),
    undefined,
    disposables
  );

  // WORKSPACE folder is added or removed
  workspace.onDidChangeWorkspaceFolders(
    async (e) => {
      if (e.removed.length > 0) {
        clearDiagnosticCollections();
      }
      await validateWsMtaYamls(disposables);
    },
    undefined,
    disposables
  );
}

export async function validateWsMtaYamls(
  disposables: Disposable[]
): Promise<void> {
  const mtaYamlUris = await workspace.findFiles(
    `**/${MTA_YAML}`,
    "**/node_modules/**"
  );
  await Promise.all(
    map(
      mtaYamlUris,
      async (mtaYamlUri: Uri) =>
        await addModuleDiagnostics(mtaYamlUri, disposables)
    )
  );
}

export async function addModuleDiagnostics(
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
  const mtaPath = resolve(modulePath, MTA_YAML);
  const devMtaExtPath = resolve(modulePath, DEV_MTA_EXT);

  // no mta.yaml
  if ((await pathExists(mtaPath)) === false) {
    return diagnosticsByFile;
  }

  // validate with/without dev.mtaext
  const devMtaExts: string[] | undefined =
    (await pathExists(devMtaExtPath)) === true ? [devMtaExtPath] : undefined;
  const mta = new Mta(modulePath, false, devMtaExts); // temp file is not relevant in our scenario

  const validationRes: Record<string, mta.Issue[]> = await mta.validate();

  for (const filePath of keys(validationRes)) {
    diagnosticsByFile[filePath] = diagnosticsByFile[filePath] ?? [];

    for (const issue of validationRes[filePath]) {
      const position = new Position(issue.line, issue.column);
      diagnosticsByFile[filePath].push({
        source: "MTA", // Should be synchronized with package.json
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
