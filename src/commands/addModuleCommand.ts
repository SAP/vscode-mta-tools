import { trimStart } from "lodash";
import { Uri, window, workspace, commands } from "vscode";
import { messages, messagesYeoman } from "../i18n/messages";
import { getClassLogger } from "../logger/logger-wrapper";
import { IChildLogger } from "@vscode-logging/logger";
import { Utils } from "../utils/utils";
import { SWATracker } from "@sap/swa-for-sapbas-vsx";

interface IMtaData {
  mtaFilePath: string | undefined;
  mtaFilesPathsList: string | undefined;
}

const CLOUD_MTA_COMMAND = "mta";
const ORIGINAL_DESCRIPTION = messagesYeoman.select_generator_description;

export class AddModuleCommand {
  private mtaFilePath: string | undefined;
  private mtaFilesPathsList: string | undefined;

  // Logger
  private readonly logger: IChildLogger = getClassLogger(AddModuleCommand.name);

  public async addModuleCommand(
    selected: Uri | undefined,
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
        messages.CUSTOM_EVENT_CONTEXT_MENU,
      ]);
      this.mtaFilePath = selected.path;
      this.mtaFilePath = Utils.isWindows()
        ? trimStart(this.mtaFilePath, "/")
        : this.mtaFilePath;
      this.logger.info(`The user selection file path: ${this.mtaFilePath}`);
      // add mta.yaml path info to template description
      messagesYeoman.select_generator_description =
        ORIGINAL_DESCRIPTION +
        `\n\n${messagesYeoman.select_mtaFile_hint} ${this.mtaFilePath}`;
    } else {
      // Command is called from command pallet, add usage analytics
      swa.track(messages.EVENT_TYPE_ADD_MODULE, [
        messages.CUSTOM_EVENT_COMMAND_PALETTE,
      ]);
      messagesYeoman.select_generator_description = ORIGINAL_DESCRIPTION;
      const mtaYamlFilesPaths = await workspace.findFiles(
        "**/mta.yaml",
        "**/node_modules/**"
      );
      const len = mtaYamlFilesPaths.length;
      if (len === 0) {
        this.mtaFilesPathsList = undefined;
        this.logger.error(messages.NO_MTA_FILE);
        void window.showErrorMessage(messages.NO_MTA_FILE);
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
      mtaFilesPathsList: this.mtaFilesPathsList,
    };

    try {
      await commands.executeCommand("loadYeomanUI", {
        filter: { types: ["mta.module"] },
        messages: messagesYeoman,
        data: mtaData,
      });
    } catch (err) {
      this.logger.error(err.message);
      void window.showErrorMessage(err.message);
    }
  }
}
