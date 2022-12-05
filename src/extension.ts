import { Uri, ExtensionContext, commands, tasks } from "vscode";
import { MtaBuildCommand } from "./commands/mtaBuildCommand";
import { MtarDeployCommand } from "./commands/mtarDeployCommand";
import { AddModuleCommand } from "./commands/addModuleCommand";
import { messages } from "./i18n/messages";
import { createExtensionLoggerAndSubscribeToLogSettingsChanges } from "./logger/logger-wrapper";
import { registerValidation } from "./validations/validations";
import { DEPLOY_MTA, BUILD_MTA } from "./task-providers/definitions";
import { BuildMtaTaskProvider } from "./task-providers/task-build/buildTask";
import { DeployMtaTaskProvider } from "./task-providers/task-deploy/deployTask";
import {
  ConfiguredTask,
  TaskEditorContributionAPI,
  TaskEditorContributorExtensionAPI,
} from "@sap_oss/task_contrib_types";
import { BuildTaskContributionAPI } from "./task-providers/task-build/taskExplorerContributer";
import { DeployTaskContributionAPI } from "./task-providers/task-deploy/taskExplorerContributer";

export async function activate(
  context: ExtensionContext
): Promise<TaskEditorContributorExtensionAPI<ConfiguredTask>> {
  initializeLogger(context);

  // initSWA(swa);

  context.subscriptions.push(
    commands.registerCommand("extension.mtaBuildCommand", mtaBuildCommand)
  );
  context.subscriptions.push(
    commands.registerCommand("extension.mtarDeployCommand", mtarDeployCommand)
  );
  context.subscriptions.push(
    commands.registerCommand("extension.addModuleCommand", addModuleCommand)
  );

  const extensionPath = context.extensionPath;

  const deployTaskProvider = new DeployMtaTaskProvider(context);
  context.subscriptions.push(
    tasks.registerTaskProvider(DEPLOY_MTA, deployTaskProvider)
  );

  const buildTaskProvider = new BuildMtaTaskProvider(context);
  context.subscriptions.push(
    tasks.registerTaskProvider(BUILD_MTA, buildTaskProvider)
  );

  await registerValidation(context.subscriptions);

  return {
    getTaskEditorContributors() {
      const contributors = new Map<
        string,
        TaskEditorContributionAPI<ConfiguredTask>
      >();
      const deployContributor = new DeployTaskContributionAPI(extensionPath);
      const buildContributor = new BuildTaskContributionAPI(extensionPath);

      contributors.set(DEPLOY_MTA, deployContributor);
      contributors.set(BUILD_MTA, buildContributor);

      return contributors;
    },
  };
}

export async function mtaBuildCommand(
  selected: Uri | undefined
): Promise<void> {
  const command: MtaBuildCommand = new MtaBuildCommand();
  return command.mtaBuildCommand(selected);
}

export async function mtarDeployCommand(
  selected: Uri | undefined
): Promise<void> {
  const command: MtarDeployCommand = new MtarDeployCommand();
  return command.mtarDeployCommand(selected);
}

export async function addModuleCommand(
  selected: Uri | undefined
): Promise<void> {
  const command: AddModuleCommand = new AddModuleCommand();
  return command.addModuleCommand(selected);
}

function initializeLogger(context: ExtensionContext): void {
  try {
    createExtensionLoggerAndSubscribeToLogSettingsChanges(context);
  } catch (error) {
    console.error(messages.ERROR_ACTIVATION_FAILED, error.message);
  }
}
