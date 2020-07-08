import * as _ from "lodash";
import * as vscode from "vscode"; // NOSONAR
import { platform } from "os";
import { messages } from "../i18n/messages";
import { getClassLogger } from "../logger/logger-wrapper";
import { IChildLogger } from "@vscode-logging/logger";
import { Utils } from "../utils/utils";

const isWindows = platform().indexOf("win") > -1;
const CLOUD_MTA_COMMAND = "mta";
const homeDir = require("os").homedir();

export class AddModuleCommand {
  private mtaFilePath: string;
  private mtaFilesPathsList: string;

  // Logger
  private readonly logger: IChildLogger = getClassLogger(AddModuleCommand.name);

  public async addModuleCommand(selected: any): Promise<void> {
    // check that cloud-mta is installed in the environment
    const response = await Utils.execCommand(CLOUD_MTA_COMMAND, ["-v"], {
      cwd: homeDir
    });
    if (response.exitCode === "ENOENT") {
      this.logger.error(
        `The Cloud MTA Tool is not installed in the environment`
      );
      vscode.window.showErrorMessage(messages.INSTALL_MTA);
      return;
    }

    if (selected) {
      this.mtaFilePath = selected.path;
      this.mtaFilePath = isWindows
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

    const mtaData: any = {
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
