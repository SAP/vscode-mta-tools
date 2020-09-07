import * as os from "os";
import { includes, trimStart, get, isEmpty } from "lodash";
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
import { SWATracker } from "@sap/swa-for-sapbas-vsx";

const CF_COMMAND = "cf";
const CF_LOGIN_COMMAND = "cf.login";
const homeDir = os.homedir();

export class MtarDeployCommand {
  // Logger
  private readonly logger: IChildLogger = getClassLogger(
    MtarDeployCommand.name
  );

  public async mtarDeployCommand(
    selected: Uri | undefined,
    swa: SWATracker
  ): Promise<void> {
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
      swa.track(messages.EVENT_TYPE_DEPLOY_MTAR, [
        messages.CUSTOM_EVENT_CONTEXT_MENU,
      ]);
      path = selected.path;
    } else {
      // Command is called from command pallet, add usage analytics
      swa.track(messages.EVENT_TYPE_DEPLOY_MTAR, [
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

    if (await this.isLoggedInToCF()) {
      await this.execDeployCmd(path);
    } else {
      this.logger.info(`User is not logged in to Cloud Foundry`);
      await this.loginToCF();
      if (await this.isLoggedInToCF()) {
        await this.execDeployCmd(path);
      }
    }
  }

  private async execDeployCmd(path: string): Promise<void> {
    const options: ShellExecutionOptions = { cwd: homeDir };
    const execution = new ShellExecution(
      CF_COMMAND + " deploy " + path,
      options
    );
    this.logger.info(`Deploy MTA Archive starts`);
    Utils.execTask(execution, messages.DEPLOY_MTAR);
  }

  private async isLoggedInToCF(): Promise<boolean> {
    const results = await Promise.all([
      Utils.getConfigFileField("OrganizationFields", this.logger),
      Utils.getConfigFileField("SpaceFields", this.logger),
    ]);
    const orgField = get(results, "[0].Name");
    const spaceField = get(results, "[1].Name");
    return !(isEmpty(orgField) && isEmpty(spaceField));
  }

  private async loginToCF(): Promise<void> {
    const allCommands = await commands.getCommands(true);
    if (includes(allCommands, CF_LOGIN_COMMAND)) {
      await commands.executeCommand(CF_LOGIN_COMMAND);
    } else {
      void window.showErrorMessage(messages.LOGIN_VIA_CLI);
    }
  }
}
