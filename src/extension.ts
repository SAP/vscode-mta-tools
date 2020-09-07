import { Uri, ExtensionContext, commands } from "vscode";
import { partial } from "lodash";
import { MtaBuildCommand } from "./commands/mtaBuildCommand";
import { MtarDeployCommand } from "./commands/mtarDeployCommand";
import { AddModuleCommand } from "./commands/addModuleCommand";
import { messages } from "./i18n/messages";
import {
  createExtensionLoggerAndSubscribeToLogSettingsChanges,
  getLogger,
} from "./logger/logger-wrapper";
import { SWATracker } from "@sap/swa-for-sapbas-vsx";

export async function mtaBuildCommand(
  swa: SWATracker,
  selected: Uri | undefined
): Promise<void> {
  const command: MtaBuildCommand = new MtaBuildCommand();
  return command.mtaBuildCommand(selected, swa);
}

export async function mtarDeployCommand(
  swa: SWATracker,
  selected: Uri | undefined
): Promise<void> {
  const command: MtarDeployCommand = new MtarDeployCommand();
  return command.mtarDeployCommand(selected, swa);
}

export async function addModuleCommand(
  swa: SWATracker,
  selected: Uri | undefined
): Promise<void> {
  const command: AddModuleCommand = new AddModuleCommand();
  return command.addModuleCommand(selected, swa);
}

export function activate(context: ExtensionContext): void {
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
      /* istanbul ignore next */
      logger.error(err.toString());
    }
  );

  context.subscriptions.push(
    commands.registerCommand(
      "extension.mtaBuildCommand",
      partial(mtaBuildCommand, swa)
    )
  );
  context.subscriptions.push(
    commands.registerCommand(
      "extension.mtarDeployCommand",
      partial(mtarDeployCommand, swa)
    )
  );
  context.subscriptions.push(
    commands.registerCommand(
      "extension.addModuleCommand",
      partial(addModuleCommand, swa)
    )
  );
}
