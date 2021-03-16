import { homedir } from "os";
import { dirname, relative } from "path";
import {
  TaskProvider,
  Task,
  ShellExecution,
  ShellExecutionOptions,
  ExtensionContext,
  WorkspaceFolder,
  window,
} from "vscode";
import { taskProvidersMessages } from "../../i18n/messages";
import { getLogger } from "../../logger/logger-wrapper";
import {
  isCFPluginInstalled,
  loginToCF,
  isLoggedInToCF,
} from "../utils/cfutil";
import {
  createTask,
  getWorkspaceFolders,
  getWSFolderPath,
  getFilesInWorkspace,
} from "../utils/common";
import { DEPLOY_MTA, DeployTaskDefinitionType } from "../definitions";

const CF_COMMAND = "cf";
const homeDir = homedir();
const TASK_NAME_PREFIX = "Template: Deploy";
const TASK_TYPE_DEPLOY = "Deploy";

export class DeployMtaTaskProvider implements TaskProvider {
  private cfInstalled = false;
  constructor(private readonly context: ExtensionContext) {}

  public async provideTasks(): Promise<Task[]> {
    return getDeployTasks();
  }

  public async resolveTask(_task: Task): Promise<Task | undefined> {
    const workspaceFolders = getWorkspaceFolders();
    if (
      workspaceFolders === undefined ||
      _task.definition.type !== DEPLOY_MTA
    ) {
      return undefined;
    }

    if (!_task.definition.mtarPath) {
      getLogger().error(
        taskProvidersMessages.MTAR_PROPERTY_MISSING_LOG(_task.name)
      );
      return undefined;
    }

    // check cf deploy plugin is installed
    const cfInstalled = await this.checkCFPluginInstalled();
    if (!cfInstalled) {
      return undefined;
    }

    // check cf login
    if (!(await isLoggedInToCF())) {
      await loginToCF();
    }
    if (!(await isLoggedInToCF())) {
      getLogger().debug(taskProvidersMessages.CF_LOGIN_FAIL);
    }

    //execute cf deploy
    const options: ShellExecutionOptions = { cwd: homeDir };
    const basicScript = `${CF_COMMAND} deploy "${_task.definition.mtarPath}"`;
    const extOpt = _task.definition.extPath
      ? ` -e "${_task.definition.extPath}"`
      : "";
    const execScript = `${basicScript}${extOpt}; sleep 2;`;

    // resolveTask requires that the same definition object be used.
    const taskExecution = new ShellExecution(execScript, options);
    return createTask(
      _task.definition,
      _task.scope,
      _task.name,
      DEPLOY_MTA,
      taskExecution
    );
  }

  private async checkCFPluginInstalled(): Promise<boolean> {
    // note: the following scenario not supported: user uninstalls cf plugin during his work.
    if (this.cfInstalled) {
      return true;
    }
    if (!(await isCFPluginInstalled())) {
      await window.showErrorMessage(taskProvidersMessages.INSTALL_MTA_CF_CLI);
    } else {
      this.cfInstalled = true;
    }
    return this.cfInstalled;
  }
}

interface MtarInfo {
  mtarRelPath: string;
  mtarWsFolder: WorkspaceFolder;
}

async function getDeployTasks(): Promise<Task[]> {
  const workspaceFolders = getWorkspaceFolders();
  const result: Task[] = [];

  if (!workspaceFolders || workspaceFolders.length === 0) {
    return result;
  }
  // find mtars
  const mtarFilesPaths = await getFilesInWorkspace("mtar", "**/*.mtar");

  try {
    for (const mtarFile of mtarFilesPaths) {
      const mtarInfo = getMtarInfo(mtarFile, workspaceFolders);
      if (mtarInfo === undefined) {
        continue;
      }

      const taskName = `${TASK_NAME_PREFIX} ${mtarInfo.mtarRelPath}`;
      const wsFolder = mtarInfo.mtarWsFolder;
      const kind: DeployTaskDefinitionType = {
        type: DEPLOY_MTA,
        label: taskName,
        taskType: TASK_TYPE_DEPLOY,
        mtarPath: mtarFile,
      };

      // deploy execution of auto detected tasks is always without -e option
      const options: ShellExecutionOptions = { cwd: homeDir };
      const taskExecution = new ShellExecution(
        `${CF_COMMAND} deploy "${mtarFile}"; sleep 2;`,
        options
      );

      const task = createTask(
        kind,
        wsFolder,
        taskName,
        DEPLOY_MTA,
        taskExecution
      );
      result.push(task);
    }
  } catch (err) {
    getLogger().error(
      taskProvidersMessages.AUTO_DETECT_MTA_DEPLOY_FAILURE,
      err
    );
  }

  return result;
}

function getMtarInfo(
  mtarFile: string,
  workspaceFolders: WorkspaceFolder[]
): MtarInfo | undefined {
  for (const workspaceFolder of workspaceFolders) {
    const wsFolderPath = getWSFolderPath(workspaceFolder);
    const wsRootPath = dirname(wsFolderPath);
    if (mtarFile.startsWith(wsFolderPath)) {
      const relPath = relative(wsRootPath, mtarFile);
      return { mtarRelPath: relPath, mtarWsFolder: workspaceFolder };
    }
  }
  getLogger().error(taskProvidersMessages.NO_WS_LOG(mtarFile));
  return undefined;
}
