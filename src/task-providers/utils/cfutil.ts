import { includes } from "lodash";
import { homedir } from "os";
import { execCommand } from "./common";
import { commands } from "vscode";
import { taskProvidersMessages } from "../../i18n/messages";
import { getLogger } from "../../logger/logger-wrapper";

const CF_COMMAND = "cf";
const CF_LOGIN_COMMAND = "cf.login";
const homeDir = homedir();

export async function isCFPluginInstalled(): Promise<boolean> {
  const response = await execCommand(CF_COMMAND, ["plugins", "--checksum"], {
    cwd: homeDir,
  });
  return includes(response.stdout, "multiapps");
}

export async function loginToCF(): Promise<void> {
  const allCommands = await commands.getCommands(true);
  if (includes(allCommands, CF_LOGIN_COMMAND)) {
    await commands.executeCommand(CF_LOGIN_COMMAND);
  } else {
    getLogger().error(taskProvidersMessages.LOGIN_VIA_CLI);
  }
}