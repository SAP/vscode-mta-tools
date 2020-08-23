import * as _ from "lodash";
import * as vscode from "vscode"; // NOSONAR
import { messages, messagesYeoman } from "../i18n/messages";
import { getClassLogger } from "../logger/logger-wrapper";
import { IChildLogger } from "@vscode-logging/logger";
import { Utils } from "../utils/utils";
import { SWATracker } from "@sap/swa-for-sapbas-vsx";

interface IMtaData {
  mtaFilePath: string;
  mtaFilesPathsList: string;
}

const CLOUD_MTA_COMMAND = "mta";
const ORIGINAL_DESCRIPTION = messagesYeoman.select_generator_description;

export class AddModuleCommand {
  private mtaFilePath: string;
  private mtaFilesPathsList: string;

  // Logger
  private readonly logger: IChildLogger = getClassLogger(AddModuleCommand.name);

  public async addModuleCommand(
    selected: vscode.Uri,
    swa: SWATracker
  ): Promise<void> {
    // check that cloud-mta is installed in the environment
    if (
      !(await Utils.isCliToolInstalled(
        CLOUD_MTA_COMMAND,
        messages.INSTALL_MTA,
        this.logger
      ))
    ) {
      return;
    }

    if (selected) {
      // Command called from context menu, add usage analytics
      swa.track(messages.EVENT_TYPE_ADD_MODULE, [
        messages.CUSTOM_EVENT_CONTEXT_MENU
      ]);
      this.mtaFilePath = selected.path;
      this.mtaFilePath = Utils.isWindows()
        ? _.trimStart(this.mtaFilePath, "/")
        : this.mtaFilePath;
      this.logger.info(`The user selection file path: ${this.mtaFilePath}`);
      // add mta.yaml path info to template description
      messagesYeoman.select_generator_description =
        ORIGINAL_DESCRIPTION +
        `\n\n${messagesYeoman.select_mtaFile_hint} ${this.mtaFilePath}`;
    } else {
      // Command is called from command pallet, add usage analytics
      swa.track(messages.EVENT_TYPE_ADD_MODULE, [
        messages.CUSTOM_EVENT_COMMAND_PALETTE
      ]);
      messagesYeoman.select_generator_description = ORIGINAL_DESCRIPTION;
      const mtaYamlFilesPaths = await vscode.workspace.findFiles(
        "**/mta.yaml",
        "**/node_modules/**"
      );
      const len = mtaYamlFilesPaths.length;
      if (len === 0) {
        this.mtaFilesPathsList = undefined;
        this.logger.error(messages.NO_MTA_FILE);
        vscode.window.showErrorMessage(messages.NO_MTA_FILE);
        return;
      } else {
        const mtaYamlFilesPathsNormalized = Utils.getFilePaths(
          mtaYamlFilesPaths
        );
        this.mtaFilesPathsList = mtaYamlFilesPathsNormalized.join(",");
        this.logger.info(
          `The file paths available for selection are: ${this.mtaFilesPathsList}`
        );
      }
    }

    const mtaData: IMtaData = {
      mtaFilePath: this.mtaFilePath,
      mtaFilesPathsList: this.mtaFilesPathsList
    };

    try {
      await vscode.commands.executeCommand("loadYeomanUI", {
        filter: { types: ["mta.module"] },
        messages: messagesYeoman,
        data: mtaData
      });
    } catch (err) {
      this.logger.error(err.message);
      vscode.window.showErrorMessage(err.message);
    }
  }
}
