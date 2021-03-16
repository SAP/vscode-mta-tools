import { ExtensionContext, window } from "vscode";
import {
  getExtensionLogger,
  getExtensionLoggerOpts,
  IChildLogger,
  IVSCodeExtLogger,
  LogLevel,
} from "@vscode-logging/logger";
import {
  listenToLogSettingsChanges,
  logLoggerDetails,
} from "./settings-changes-handler";
import {
  getLoggingLevelSetting,
  getSourceLocationTrackingSetting,
} from "./settings";
import { messages } from "../i18n/messages";
import { EMPTY_LOGGER } from "./empty-logger";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * A Simple Wrapper to hold the state of our "singleton" (per extension) IVSCodeExtLogger
 * implementation.
 */

const PACKAGE_JSON = "package.json";

/**
 * @type {IVSCodeExtLogger}
 */
let logger: IVSCodeExtLogger = EMPTY_LOGGER;

/**
 * Note the use of a getter function so the value would be lazy resolved on each use.
 * This enables concise and simple consumption of the Logger throughout our Extension.
 *
 * @returns { IVSCodeExtLogger }
 */
export function getLogger(): IVSCodeExtLogger {
  return logger;
}

export function getClassLogger(className: string): IChildLogger {
  return getLogger().getChildLogger({ label: className });
}

export function createExtensionLoggerAndSubscribeToLogSettingsChanges(
  context: ExtensionContext
): void {
  createExtensionLogger(context);
  // Subscribe to Logger settings changes.
  listenToLogSettingsChanges(context);
}

/**
 * This function should be invoked after the Logger has been initialized in the Extension's `activate` function.
 * @param {IVSCodeExtLogger} newLogger
 */
function initLoggerWrapper(newLogger: IVSCodeExtLogger): void {
  logger = newLogger;
}

function createExtensionLogger(context: ExtensionContext): void {
  const contextLogPath = context.logPath;
  const logLevelSetting: LogLevel = getLoggingLevelSetting();
  const sourceLocationTrackingSettings: boolean = getSourceLocationTrackingSetting();

  const meta = JSON.parse(
    readFileSync(resolve(context.extensionPath, PACKAGE_JSON), "utf8")
  );

  const extensionLoggerOpts: getExtensionLoggerOpts = {
    extName: meta.name,
    level: logLevelSetting,
    logConsole: true,
    logPath: contextLogPath,
    logOutputChannel: window.createOutputChannel(messages.CHANNEL_NAME),
    sourceLocationTracking: sourceLocationTrackingSettings,
  };

  // The Logger must first be initialized before any logging commands may be invoked.
  const extensionLogger = getExtensionLogger(extensionLoggerOpts);
  // Update the logger-wrapper with a reference to the extLogger.
  initLoggerWrapper(extensionLogger);
  logLoggerDetails(context, logLevelSetting);
}
