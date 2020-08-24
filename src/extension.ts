import * as vscode from "vscode"; // NOSONAR
import { MtaBuildCommand } from "./commands/mtaBuildCommand";
import { MtarDeployCommand } from "./commands/mtarDeployCommand";
import { AddModuleCommand } from "./commands/addModuleCommand";
import { messages } from "./i18n/messages";
import {
  createExtensionLoggerAndSubscribeToLogSettingsChanges,
  getLogger
} from "./logger/logger-wrapper";
import { SWATracker } from "@sap/swa-for-sapbas-vsx";
import * as _ from "lodash";

export function mtaBuildCommand(selected: vscode.Uri, swa: SWATracker) {
  const command: MtaBuildCommand = new MtaBuildCommand();
  return command.mtaBuildCommand(selected, swa);
}

export function mtarDeployCommand(selected: vscode.Uri, swa: SWATracker) {
  const command: MtarDeployCommand = new MtarDeployCommand();
  return command.mtarDeployCommand(selected, swa);
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

  const logger = getLogger();
  const swa = new SWATracker(
    "SAPSE",
    "vscode-mta-tools",
    (err: string | number) => {
      logger ? logger.error(err) : console.error(err);
    }
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.mtaBuildCommand",
      _.partialRight(mtaBuildCommand, swa)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.mtarDeployCommand",
      _.partialRight(mtarDeployCommand, swa)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.addModuleCommand",
      _.partialRight(addModuleCommand, swa)
    )
  );
}
