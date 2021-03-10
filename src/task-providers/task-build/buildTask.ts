import { dirname, relative } from "path";
import { isEmpty } from "lodash";
import {
  TaskProvider,
  Task,
  ShellExecution,
  ShellExecutionOptions,
  ExtensionContext,
  WorkspaceFolder,
  window,
} from "vscode";
import { messages, taskProvidersMessages } from "../../i18n/messages";
import { getLogger } from "../../logger/logger-wrapper";
import {
  createTask,
  getWorkspaceFolders,
  getWSFolderPath,
  getFilesInWorkspace
} from "../utils/common";
import { BUILD_MTA, BuildTaskDefinitionType } from "../definitions";
import { Utils } from "../../utils/utils";

const TASK_NAME_PREFIX = "Template: Build MTA based on";
const BUILD_MTA_ARCHIVE = "Build MTA Project";
const BUILD_MTA_MODULE = "Build MTA Module";
const MBT_COMMAND = "mbt";
const TASK_TYPE_BUILD = "Build";

export class BuildMtaTaskProvider implements TaskProvider {
  private mbtInstalled = false;

  constructor(private readonly context: ExtensionContext) {}

  public async provideTasks(): Promise<Task[]> {
    return getBuildTasks();
  }

  public async resolveTask(_task: Task): Promise<Task | undefined> {
    const workspaceFolders = getWorkspaceFolders();
    if (
      workspaceFolders === undefined ||
      workspaceFolders.length === 0 ||
      _task.definition.type !== BUILD_MTA
    ) {
      return undefined;
    }

    if (!_task.definition.mtaFilePath) {
      getLogger().error(taskProvidersMessages.MTA_PROPERTY_MISSING(_task.name));
      return undefined;
    }

    if (!_task.definition.buildType) {
      getLogger().error(taskProvidersMessages.BUILD_TYPE_PROPERTY_MISSING(_task.name));
      return undefined;
    }

    if (
      _task.definition.buildType === BUILD_MTA_MODULE &&
      _task.definition.modules === undefined
    ) {
      getLogger().error(taskProvidersMessages.MODULES_PROPERTY_MISSING(_task.name));
      return undefined;
    }

    const mbtInstalled = await this.checkMBTToolInstalled();
    if (!mbtInstalled) {
      return undefined;
    }

    const options: ShellExecutionOptions = {
      cwd: dirname(_task.definition.mtaFilePath),
    };
    const execScript = getExecutionScript(_task);

    // resolveTask requires that the same definition object be used.
    const taskExecution = new ShellExecution(execScript, options);
    return createTask(
      _task.definition,
      _task.scope,
      _task.name,
      BUILD_MTA,
      taskExecution
    );
  }

  private async checkMBTToolInstalled(): Promise<boolean> {
    // note: the following scenario not supported: user uninstalls mbt during his work.
    if (this.mbtInstalled) {
      return true;
    }
    // check if mbt cli is installed
    if (!(await Utils.isCliToolInstalled(MBT_COMMAND, messages.INSTALL_MTA, getLogger()))) {
      await window.showErrorMessage(taskProvidersMessages.INSTALL_MBT());
    } else {
      this.mbtInstalled = true;
    }
    return this.mbtInstalled;
  }
}

interface MtaInfo {
  mtaFileRelPath: string;
  mtaWsFolder: WorkspaceFolder;
}

async function getBuildTasks(): Promise<Task[]> {
  const workspaceFolders = getWorkspaceFolders();
  const result: Task[] = [];

  if (!workspaceFolders || workspaceFolders.length === 0) {
    return result;
  }
  // find mta.yaml files
  const mtaFiles = await getFilesInWorkspace("mta.yaml", "**/mta.yaml");

  try {
    for (const mtaFile of mtaFiles) {
      const mtaInfo = getMtaInfo(mtaFile, workspaceFolders);
      if (mtaInfo === undefined) {
        continue;
      }

      const taskName = `${TASK_NAME_PREFIX} ${mtaInfo.mtaFileRelPath}`;
      const wsFolder = mtaInfo.mtaWsFolder;
      const taskDefinition: BuildTaskDefinitionType = {
        type: BUILD_MTA,
        label: taskName,
        taskType: TASK_TYPE_BUILD,
        mtaFilePath: mtaFile,
        buildType: BUILD_MTA_ARCHIVE,
      };

      const options: ShellExecutionOptions = { cwd: dirname(mtaFile) };
      const taskExecution = new ShellExecution(
        `${MBT_COMMAND} build -s "${dirname(mtaFile)}"; sleep 2;`,
        options
      );

      const task = createTask(
        taskDefinition,
        wsFolder,
        taskName,
        BUILD_MTA,
        taskExecution
      );
      result.push(task);
    }
  } catch (err) {
    getLogger().error(taskProvidersMessages.AUTO_DETECT_MTA_BUILD_FAILURE, err);
  }

  return result;
}

function getMtaInfo(
  mtaFile: string,
  workspaceFolders: WorkspaceFolder[]
): MtaInfo | undefined {
  for (const workspaceFolder of workspaceFolders) {
    const wsFolderPath = getWSFolderPath(workspaceFolder);
    const wsRootPath = dirname(wsFolderPath);
    if (mtaFile.startsWith(wsFolderPath)) {
      const relPath = relative(wsRootPath, mtaFile);
      return {
        mtaFileRelPath: relPath,
        mtaWsFolder: workspaceFolder,
      };
    }
  }

  getLogger().error(taskProvidersMessages.NO_WS_LOG(mtaFile));
  return undefined;
}

function getExecutionScript(task: Task): string {
  const projectMtaFolderPath = dirname(task.definition.mtaFilePath);
  if (task.definition.buildType === BUILD_MTA_ARCHIVE) {
    return getBuildProjectScript(task, projectMtaFolderPath);
  } else {
    return getBuildModuleScript(task, projectMtaFolderPath);
  }
}

function getBuildProjectScript(task: Task, projectMtaFilePath: string): string {
  const execScript = `${MBT_COMMAND} build -s "${projectMtaFilePath}"`;
  const mtarTargetPathOpt = task.definition.mtarTargetPath
    ? ` -t "${task.definition.mtarTargetPath}"`
    : "";
  const mtarNameOpt = task.definition.mtarName
    ? ` --mtar "${task.definition.mtarName}"`
    : "";
  const extPathOpt = task.definition.extPath
    ? ` -e "${task.definition.extPath}"`
    : "";
  return `${execScript}${mtarTargetPathOpt}${mtarNameOpt}${extPathOpt}; sleep 2;`;
}

function getBuildModuleScript(
  task: Task,
  projectMtaFolderPath: string
): string {
  const modulesString = task.definition.modules.join(",");
  const execScript = `${MBT_COMMAND} module-build -m "${modulesString}" -s "${projectMtaFolderPath}" -g`;
  const dependencies = isEmpty(task.definition.dependencies) ? "" : " -a";
  const targetFolderPathOpt = task.definition.targetFolderPath
    ? ` -t "${task.definition.targetFolderPath}"`
    : "";
  const extPathOpt = task.definition.extPath
    ? ` -e "${task.definition.extPath}"`
    : "";
  return `${execScript}${dependencies}${targetFolderPathOpt}${extPathOpt}; sleep 2;`;
}
