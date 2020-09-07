import { ExtensionContext, workspace } from "vscode";
import { getLogger } from "./logger-wrapper";
import {
  LOGGING_LEVEL_CONFIG_PROP,
  SOURCE_TRACKING_CONFIG_PROP,
  getLoggingLevelSetting,
  getSourceLocationTrackingSetting,
} from "./settings";
import { LogLevel } from "@vscode-logging/logger";

export function logLoggerDetails(
  context: ExtensionContext,
  configLogLevel: string
): void {
  getLogger()?.info(`Start Logging in Log Level: <${configLogLevel}>`);
  getLogger()?.info(
    `Full Logs can be found in the <${context.logPath}> folder.`
  );
}

/**
 * @param {ExtensionContext} context
 */
export function listenToLogSettingsChanges(context: ExtensionContext): void {
  // To enable dynamic logging level we must listen to VSCode configuration changes
  // on our `loggingLevelConfigProp` configuration setting.
  context.subscriptions.push(
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(LOGGING_LEVEL_CONFIG_PROP)) {
        const logLevel: LogLevel = getLoggingLevelSetting();

        getLogger()?.changeLevel(logLevel);
        logLoggerDetails(context, logLevel);
      }
    })
  );

  // Enable responding to changes in the sourceLocationTracking setting
  context.subscriptions.push(
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(SOURCE_TRACKING_CONFIG_PROP)) {
        const newSourceLocationTracking = getSourceLocationTrackingSetting();
        getLogger()?.changeSourceLocationTracking(newSourceLocationTracking);
      }
    })
  );
}
