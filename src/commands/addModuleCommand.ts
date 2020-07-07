import * as _ from "lodash";
import * as vscode from "vscode"; // NOSONAR
import { platform } from "os";
import { messages } from "../i18n/messages";
import { getClassLogger } from "../logger/logger-wrapper";
import { IChildLogger } from "@vscode-logging/logger";

const isWindows = platform().indexOf("win") > -1;

export class AddModuleCommand {
  private mtaFilePath: string;
  private mtaFilesPathsList: string;

  // Logger
  private readonly logger: IChildLogger = getClassLogger(AddModuleCommand.name);

  public async addModuleCommand(selected: any): Promise<void> {
    if (selected) {
      this.mtaFilePath = selected.path;
    } else {
      const mtaYamlFilesPaths = await vscode.workspace.findFiles(
        "**/mta.yaml",
        "**/node_modules/**"
      );
      const len = mtaYamlFilesPaths.length;
      if (len === 0) {
        this.mtaFilesPathsList = undefined;
        vscode.window.showErrorMessage(messages.NO_MTA_FILE);
        return;
      } else {
        this.mtaFilesPathsList = mtaYamlFilesPaths.join(",");
        this.logger.info(
          `The user selection file path: ${this.mtaFilesPathsList}`
        );
      }
    }

    this.mtaFilePath = isWindows
      ? _.trimStart(this.mtaFilePath, "/")
      : this.mtaFilePath;
    this.mtaFilesPathsList = isWindows
      ? _.trimStart(this.mtaFilesPathsList, "/")
      : this.mtaFilesPathsList;

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
      this.logger.error(err);
      vscode.window.showErrorMessage(err.message);
    }
  }
}
