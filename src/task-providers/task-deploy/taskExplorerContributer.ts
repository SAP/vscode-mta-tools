import { join } from "path";
import {
  FormProperty,
  TaskEditorContributionAPI,
  TaskUserInput,
} from "@sap_oss/task_contrib_types";
import { getImage } from "../utils/common";
import { validateExtPath } from "./deployValidator";
import { taskProvidersMessages } from "../../i18n/messages";
import { DeployTaskDefinitionType } from "../definitions";
import { getSWA } from "../../utils/swa";

export class DeployTaskContributionAPI
  implements TaskEditorContributionAPI<DeployTaskDefinitionType> {
  private taskImage = "";

  constructor(private readonly extensionPath: string) {
    this.taskImage = getImage(
      join(this.extensionPath, "src/task-providers/images", "deployMTA.svg")
    );
  }

  async init(): Promise<void> {
    return;
  }

  convertTaskToFormProperties(): FormProperty[] {
    return [
      {
        type: "label",
      },
      {
        taskProperty: "mtarPath",
        type: "file",
        hint: taskProvidersMessages.MTAR_PATH_HINT,
        readonly: true,
      },
      {
        taskProperty: "extPath",
        type: "file",
        hint: taskProvidersMessages.MTAEXT_PATH_HINT,
        isValid: validateExtPath,
        optional: true,
      },
    ];
  }

  updateTask(
    task: DeployTaskDefinitionType,
    inputs: TaskUserInput
  ): DeployTaskDefinitionType {
    return { ...task, ...inputs };
  }

  getTaskImage(): string {
    return this.taskImage;
  }

  onSave(task: DeployTaskDefinitionType): void {
    const mtaExtParam = task.extPath
      ? taskProvidersMessages.SWA_MTA_WITH_EXT_PARAM
      : taskProvidersMessages.SWA_MTA_WITHOUT_EXT_PARAM;
    getSWA().track(taskProvidersMessages.SWA_MTA_DEPLOY_EVENT, [mtaExtParam]);
  }
}
