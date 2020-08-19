import * as vscode from "vscode"; // NOSONAR
import { MtaBuildCommand } from "./commands/mtaBuildCommand";
import { MtarDeployCommand } from "./commands/mtarDeployCommand";
import { AddModuleCommand } from "./commands/addModuleCommand";
import { messages } from "./i18n/messages";
import { createExtensionLoggerAndSubscribeToLogSettingsChanges } from "./logger/logger-wrapper";
import { SWATracker } from "@sap/swa-for-sapbas-vsx";

export function mtaBuildCommand(selected: vscode.Uri) {
  const command: MtaBuildCommand = new MtaBuildCommand();
  return command.mtaBuildCommand(selected);
}

export function mtarDeployCommand(selected: vscode.Uri) {
  const command: MtarDeployCommand = new MtarDeployCommand();
  return command.mtarDeployCommand(selected);
}

export function addModuleCommand(selected: vscode.Uri, swa: SWATracker) {
  const command: AddModuleCommand = new AddModuleCommand();
  return command.addModuleCommand(selected, swa);
}

export function activate(context: vscode.ExtensionContext) {
  try {
    createExtensionLoggerAndSubscribeToLogSettingsChanges(context);
  } catch (error) {
    console.error(messages.ERROR_ACTIVATION_FAILED, error.message);
    return;
  }

  const swa = new SWATracker(
    "SAPSE",
    "vscode-mta-tools",
    (err: string | number) => {
      console.log(err);
    }
  ); // Todo, where to add console.log?

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.mtaBuildCommand",
      mtaBuildCommand
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.mtarDeployCommand",
      mtarDeployCommand
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.addModuleCommand", selected =>
      addModuleCommand(selected, swa)
    )
  );
}
