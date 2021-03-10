import { mkdirs, writeJson, readJson } from "fs-extra";
import { dirname, resolve, relative } from "path";
import { map } from "lodash";

export const WORKSPACE_PATH = resolve(
  __dirname,
  "..",
  "testWorkspace",
  "test.code-workspace"
);
export const WORKSPACE_FOLDERS_PATH = resolve(
  __dirname,
  "..",
  "..",
  "..",
  "test",
  "workspaceFolders"
);

/**
 * Set the folder paths in the workspace file.
 * Note: this function does NOT wait for the workspace to be updated in vscode. To wait from inside a vscode context
 * use changeWorkspaceFolders from workspaceUtils.
 * @param paths - folder names, relative to the workspaceFolders folder.
 */
export async function setWorkspaceFolders(...paths: string[]): Promise<void> {
  await mkdirs(dirname(WORKSPACE_PATH));
  const workspace = {
    folders: map(paths, (path) => ({
      path: resolve(WORKSPACE_FOLDERS_PATH, path),
    })),
  };
  await writeJson(WORKSPACE_PATH, workspace, { spaces: 2 });
}

export async function getWorkspaceFolders(): Promise<string[]> {
  const workspace = await readJson(WORKSPACE_PATH);
  return map(workspace.folders, (folder: { path: string }) =>
    relative(WORKSPACE_FOLDERS_PATH, folder.path)
  );
}
