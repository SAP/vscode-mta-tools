import * as _ from "lodash";
import * as vscode from "vscode"; // NOSONAR
import { messages } from "../i18n/messages";
import { getClassLogger } from "../logger/logger-wrapper";
import { IChildLogger } from "@vscode-logging/logger";
import { Utils } from "../utils/utils";

interface IMtaData {
  mtaFilePath: string;
  mtaFilesPathsList: string;
}

const CLOUD_MTA_COMMAND = "mta";

export class AddModuleCommand {
  private mtaFilePath: string;
  private mtaFilesPathsList: string;

  // Logger
  private readonly logger: IChildLogger = getClassLogger(AddModuleCommand.name);

  public async addModuleCommand(selected: vscode.Uri): Promise<void> {
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
      this.mtaFilePath = selected.path;
      this.mtaFilePath = Utils.isWindows()
        ? _.trimStart(this.mtaFilePath, "/")
        : this.mtaFilePath;
      this.logger.info(`The user selection file path: ${this.mtaFilePath}`);
      // add mta.yaml path info to template description
      messages.select_generator_description =
        messages.select_generator_description +
        `\n\n${messages.select_mtaFile_hint} ${this.mtaFilePath}`;
    } else {
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
        messages,
        data: mtaData
      });
    } catch (err) {
      this.logger.error(err.message);
      vscode.window.showErrorMessage(err.message);
    }
  }
}
