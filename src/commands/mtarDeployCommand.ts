import * as os from "os";
import { includes, trimStart } from "lodash";
import {
  Uri,
  window,
  workspace,
  commands,
  ShellExecution,
  ShellExecutionOptions,
} from "vscode";
import { Utils } from "../utils/utils";
import { SelectionItem } from "../utils/selectionItem";
import { messages } from "../i18n/messages";
import { getClassLogger } from "../logger/logger-wrapper";
import { IChildLogger } from "@vscode-logging/logger";
import { getSWA } from "../utils/swa";

const CF_COMMAND = "cf";
const CF_LOGIN_COMMAND = "cf.login.weak";
const homeDir = os.homedir();

export class MtarDeployCommand {
  // Logger
  private readonly logger: IChildLogger = getClassLogger(
    MtarDeployCommand.name
  );

  public async mtarDeployCommand(selected: Uri | undefined): Promise<void> {
    const response = await Utils.execCommand(
      CF_COMMAND,
      ["plugins", "--checksum"],
      { cwd: homeDir }
    );
    if (!includes(response.stdout, "multiapps")) {
      void window.showErrorMessage(messages.INSTALL_MTA_CF_CLI);
      return;
    }

    let path;

    if (selected) {
      // Command called from context menu, add usage analytics
      getSWA().track(messages.EVENT_TYPE_DEPLOY_MTAR, [
        messages.CUSTOM_EVENT_CONTEXT_MENU,
      ]);
      path = selected.path;
    } else {
      // Command is called from command pallet, add usage analytics
      getSWA().track(messages.EVENT_TYPE_DEPLOY_MTAR, [
        messages.CUSTOM_EVENT_COMMAND_PALETTE,
      ]);
      const mtarFilesPaths = await workspace.findFiles("**/*.mtar", null);
      const len = mtarFilesPaths.length;
      if (len === 0) {
        this.logger.error(messages.NO_MTA_ARCHIVE);
        void window.showErrorMessage(messages.NO_MTA_ARCHIVE);
        return;
      } else if (len === 1) {
        path = mtarFilesPaths[0].path;
      } else {
        const inputRequest = messages.SELECT_MTA_ARCHIVE;
        const selectionItems: SelectionItem[] = SelectionItem.getSelectionItems(
          mtarFilesPaths
        );
        const userSelection = await Utils.displayOptions(
          inputRequest,
          selectionItems
        );
        if (userSelection === undefined) {
          // selection canceled
          return;
        }
        this.logger.info(
          `The user selection file path: ${userSelection.label}`
        );
        path = userSelection.label;
      }
    }
    path = Utils.isWindows() ? trimStart(path, "/") : path;

    if (await this.ensureLoggedInToCF()) {
      await this.execDeployCmd(path);
    }
  }

  // returns true if the user is logged in
  private async ensureLoggedInToCF(): Promise<boolean> {
    // check if the user is logged in to CF
    const isLoggedIin = await Utils.isLoggedInToCfWithProgress();
    if (isLoggedIin) {
      return true;
    }

    // connect the user to CF
    const allCommands = await commands.getCommands(true);
    if (includes(allCommands, CF_LOGIN_COMMAND)) {
      const result = await commands.executeCommand<string>(CF_LOGIN_COMMAND);
      // "OK" is returned by "cf.login" command if the login was successful.
      // undefined is returned when the user cancels (user pressed Esc for example)
      // empty string is returned when login fails. The notification error is displayed by the cf tools extension
      return result ? true : false;
    } else {
      void window.showErrorMessage(messages.LOGIN_VIA_CLI);
    }
    return false;
  }

  private async execDeployCmd(path: string): Promise<void> {
    const options: ShellExecutionOptions = { cwd: homeDir };
    const execution = new ShellExecution(
      CF_COMMAND + ' deploy "' + path + '"',
      options
    );
    this.logger.info(`Deploy MTA Archive starts`);
    Utils.execTask(execution, messages.DEPLOY_MTAR);
  }
}
