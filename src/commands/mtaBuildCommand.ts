import { replace, trimStart } from "lodash";
import {
  Uri,
  window,
  workspace,
  ShellExecution,
  ShellExecutionOptions
} from "vscode";
import { Utils } from "../utils/utils";
import { SelectionItem } from "../utils/selectionItem";
import { messages } from "../i18n/messages";
import { getClassLogger } from "../logger/logger-wrapper";
import { IChildLogger } from "@vscode-logging/logger";
import { SWATracker } from "@sap/swa-for-sapbas-vsx";

const MBT_COMMAND = "mbt";
const homeDir = require("os").homedir();

export class MtaBuildCommand {
  // Logger
  private readonly logger: IChildLogger = getClassLogger(MtaBuildCommand.name);

  public async mtaBuildCommand(
    selected: Uri | undefined,
    swa: SWATracker
  ): Promise<void> {
    // check that mbt is installed in the environment
    if (
      !(await Utils.isCliToolInstalled(
        MBT_COMMAND,
        messages.INSTALL_MBT,
        this.logger
      ))
    ) {
      return;
    }
    let path;
    if (selected) {
      // Command called from context menu, add usage analytics
      swa.track(messages.EVENT_TYPE_BUILD_MTA, [
        messages.CUSTOM_EVENT_CONTEXT_MENU
      ]);
      path = selected.path;
    } else {
      // Command is called from command pallet, add usage analytics
      swa.track(messages.EVENT_TYPE_BUILD_MTA, [
        messages.CUSTOM_EVENT_COMMAND_PALETTE
      ]);
      const mtaYamlFilesPaths = await workspace.findFiles(
        "**/mta.yaml",
        "**/node_modules/**"
      );
      const len = mtaYamlFilesPaths.length;
      if (len === 0) {
        window.showErrorMessage(messages.NO_PROJECT_DESCRIPTOR);
        return;
      } else if (len === 1) {
        path = mtaYamlFilesPaths[0].path;
      } else {
        const inputRequest = messages.SELECT_PROJECT_DESCRIPTOR;
        const selectionItems: SelectionItem[] = await SelectionItem.getSelectionItems(
          mtaYamlFilesPaths
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

    const options: ShellExecutionOptions = { cwd: homeDir };
    const execution = new ShellExecution(
      MBT_COMMAND +
        " build -s " +
        "'" +
        replace(path, "/mta.yaml", "") +
        "'; sleep 2;",
      options
    );
    this.logger.info(`Build MTA starts`);
    Utils.execTask(execution, messages.BUILD_MTA);
  }
}
