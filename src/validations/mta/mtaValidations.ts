import { mta } from "@sap/mta-lib";
import { pathExists } from "fs-extra";
import { keys, map } from "lodash";
import { dirname, resolve } from "path";
import { Uri, Disposable, workspace, Diagnostic } from "vscode";
import {
  clearDiagnosticCollections,
  getDiagnosticsCollection,
  getSeverity,
  getValidation,
  mtaIssueToEditorCoordinate,
} from "./mtaDiagnostic";

export const MTA_YAML = "mta.yaml";
export const DEV_MTA_EXT = "dev.mtaext";

export function watchMtaYamlAndDevExtFiles(disposables: Disposable[]): void {
  // Handles mta.yaml and dev.mtaext FILES
  const mtaFileWatcher = workspace.createFileSystemWatcher(
    `**/{${MTA_YAML},${DEV_MTA_EXT}}`
  );

  /* istanbul ignore next */
  const listener = (uri: Uri): Promise<void> =>
    updateMtaDiagnostics(uri, disposables);

  mtaFileWatcher.onDidChange(listener, undefined, disposables);

  mtaFileWatcher.onDidCreate(listener, undefined, disposables);

  // this event is fired for mta.yaml and dev.mtaext when the folder they are in is deleted in theia but not in vscode
  // https://github.com/microsoft/vscode/issues/60813
  mtaFileWatcher.onDidDelete(listener, undefined, disposables);

  // WORKSPACE folder is added or removed
  workspace.onDidChangeWorkspaceFolders(
    // At this point, files are already removed from the file system and we can not find the
    // mta.yaml files that where deleted so we delete all and revalidate
    /* istanbul ignore next */
    async (e) => validateWsMtaYamls(disposables, e.removed.length > 0),
    undefined,
    disposables
  );
}

export async function validateWsMtaYamls(
  disposables: Disposable[],
  clearExistingDiagnosticCollections = false
): Promise<void> {
  if (clearExistingDiagnosticCollections) {
    clearDiagnosticCollections();
  }
  const mtaYamlUris = await workspace.findFiles(
    `**/${MTA_YAML}`,
    "**/node_modules/**"
  );
  if (mtaYamlUris.length === 0) {
    return;
  }
  for (const mtaYamlUri of mtaYamlUris) {
    setTimeout(async function () {
      await updateMtaDiagnostics(mtaYamlUri, disposables);
    }, 200);
  }
}

export async function updateMtaDiagnostics(
  uri: Uri,
  disposables: Disposable[]
): Promise<void> {
  const projectPath = dirname(uri.fsPath);

  // Create the diagnostics collection. The collections are cached so that we can clear them in subsequent runs.
  const projectDiagnostics = getDiagnosticsCollection(
    `Diagnostics for project: ${projectPath}`,
    disposables
  );

  const collectionEntries: [Uri, Diagnostic[] | undefined][] = [];
  try {
    // Clear existing entries in this collection from previous runs
    // This is done "manually" and not via a call to clear() so that we only fire diagnostics changed event once
    projectDiagnostics.forEach((uri) =>
      collectionEntries.push([uri, undefined])
    );

    const diagnosticsByFile = await getMtaDiagnostics(projectPath);

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
    projectDiagnostics.set(collectionEntries);
  }
}

async function getMtaDiagnostics(
  modulePath: string
): Promise<Record<string, Diagnostic[]>> {
  const diagnosticsByFile: Record<string, Diagnostic[]> = {};
  const mtaPath = resolve(modulePath, MTA_YAML);
  const devMtaExtPath = resolve(modulePath, DEV_MTA_EXT);

  // no mta.yaml. clear the previous diagnostics and return no diagnostics
  if (!(await pathExists(mtaPath))) {
    return diagnosticsByFile;
  }

  // if dev.mtaext exist => validate with dev.mtaext
  const devMtaExts: string[] | undefined = (await pathExists(devMtaExtPath))
    ? [devMtaExtPath]
    : undefined;
  const validationRes: Record<string, mta.Issue[]> = await getValidation(
    modulePath,
    devMtaExts
  );

  for (const filePath of keys(validationRes)) {
    // iterate validation issues a single file
    diagnosticsByFile[filePath] = map<mta.Issue, Diagnostic>(
      validationRes[filePath],
      (issue) => {
        return {
          source: "MTA", // Should be synchronized with package.json
          message: issue.message,
          range: mtaIssueToEditorCoordinate(issue),
          severity: getSeverity(filePath, issue.severity),
        };
      }
    );
  }

  return diagnosticsByFile;
}
