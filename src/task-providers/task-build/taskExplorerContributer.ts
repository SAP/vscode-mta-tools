import { dirname, join, resolve } from "path";
import { concat, isEmpty, map } from "lodash";
import Mta from "@sap/mta-lib";
import {
  FormProperty,
  TaskEditorContributionAPI,
  TaskUserInput,
} from "../types";
import { getImage } from "../utils/common";
import { taskProvidersMessages } from "../../i18n/messages";
import {
  validateExtPath,
  validateModules,
  validateTargetFolder,
} from "./buildValidator";
import {
  BuildTaskDefinitionType,
  Build_MTA_Project,
  Build_MTA_Module,
  BUILD_MODULE_WITH_DEPS,
} from "../definitions";
import { getSWA } from "../../utils/swa";

export class BuildTaskContributionAPI
  implements TaskEditorContributionAPI<BuildTaskDefinitionType> {
  private modules: string[] = [];
  private buildTypeOptions: string[] = [];
  private taskImage = "";

  constructor(private readonly extensionPath: string) {
    this.taskImage = getImage(
      join(this.extensionPath, "src/task-providers/images", "buildMTA.svg")
    );
  }

  async init(wsFolder: string, task: BuildTaskDefinitionType): Promise<void> {
    const mta = new Mta(resolve(dirname(task["mtaFilePath"])));
    const modules = await mta.getModules();
    this.modules = map(modules, (_) => _.name);
    this.buildTypeOptions = isEmpty(this.modules)
      ? [Build_MTA_Project]
      : [Build_MTA_Project, Build_MTA_Module];
  }

  convertTaskToFormProperties(task: BuildTaskDefinitionType): FormProperty[] {
    let formResult: FormProperty[] = [];
    const commonFormParts: FormProperty[] = [
      {
        type: "label",
      },
      {
        taskProperty: "mtaFilePath",
        type: "input",
        readonly: true,
        optional: true, //TODO: remove with new version of task explorer
      },
      {
        taskProperty: "buildType",
        type: "combobox",
        list: this.buildTypeOptions,
        optional: true,
      },
    ];

    const buildArchiveParts: FormProperty[] = [
      {
        taskProperty: "mtarTargetPath",
        type: "folder",
        optional: true,
        hint: taskProvidersMessages.TARGET_FOLDER_PATH_HINT,
        isValid: validateTargetFolder,
      },
      {
        taskProperty: "mtarName",
        type: "input",
        hint: taskProvidersMessages.MTAR_FILE_NAME,
        optional: true,
      },
      {
        taskProperty: "extPath",
        type: "file",
        optional: true,
        hint: taskProvidersMessages.MTAEXT_PATH_HINT,
        isValid: validateExtPath,
      },
    ];

    const buildModuleParts: FormProperty[] = [
      {
        taskProperty: "modules",
        type: "checkbox",
        list: this.modules,
        isValid: validateModules,
      },
      {
        taskProperty: "dependencies",
        type: "checkbox",
        list: [BUILD_MODULE_WITH_DEPS],
        hint: taskProvidersMessages.BUILD_WITH_DEPS_HINT,
      },
      {
        taskProperty: "targetFolderPath",
        type: "folder",
        optional: true,
        hint: taskProvidersMessages.MODULE_TARGET_FOLDER_PATH_HINT,
        isValid: validateTargetFolder,
      },
      {
        taskProperty: "extPath",
        type: "file",
        optional: true,
        hint: taskProvidersMessages.MTAEXT_PATH_HINT,
        isValid: validateExtPath,
      },
    ];

    if (task.buildType === Build_MTA_Project) {
      formResult = concat(commonFormParts, buildArchiveParts);
    } else {
      formResult = concat(commonFormParts, buildModuleParts);
    }

    return formResult;
  }

  updateTask(
    task: BuildTaskDefinitionType,
    changes: TaskUserInput
  ): BuildTaskDefinitionType {
    const updatedTask = { ...task };
    updatedTask.buildType = changes.buildType;
    updatedTask.label = changes.label;
    updatedTask.mtarTargetPath = changes.mtarTargetPath;
    updatedTask.mtarName = changes.mtarName;
    updatedTask.modules = changes.modules;
    updatedTask.dependencies = changes.dependencies;
    updatedTask.targetFolderPath = changes.targetFolderPath;
    updatedTask.extPath = changes.extPath;
    return updatedTask;
  }

  getTaskImage(): string {
    return this.taskImage;
  }

  onSave(task: BuildTaskDefinitionType): void {
    const buildTypeParam =
      task.buildType === Build_MTA_Project
        ? taskProvidersMessages.SWA_MTA_BUILD_PROJECT_PARAM
        : taskProvidersMessages.SWA_MTA_BUILD_MODULE_PARAM;
    const mtaExtParam = task.extPath
      ? taskProvidersMessages.SWA_MTA_WITH_EXT_PARAM
      : taskProvidersMessages.SWA_MTA_WITHOUT_EXT_PARAM;
    const mtarPathParam =
      task.mtarTargetPath || task.targetFolderPath
        ? taskProvidersMessages.SWA_CUSTOM_TARGET_PATH_PARAM
        : taskProvidersMessages.SWA_DEFAULT_TARGET_PATH_PARAM;
    getSWA().track(taskProvidersMessages.SWA_MTA_BUILD_EVENT, [
      buildTypeParam,
      mtaExtParam,
      mtarPathParam,
    ]);
  }
}
