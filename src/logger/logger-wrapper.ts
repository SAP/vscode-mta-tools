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

/**
 * A Simple Wrapper to hold the state of our "singleton" (per extension) IVSCodeExtLogger
 * implementation.
 */

export const ERROR_LOGGER_NOT_INITIALIZED =
  "Logger has not yet been initialized!";

/**
 * @type {IVSCodeExtLogger}
 */
let logger: IVSCodeExtLogger | undefined;

function isInitialized(): boolean {
  return logger !== undefined ? true : false;
}

/**
 * Note the use of a getter function so the value would be lazy resolved on each use.
 * This enables concise and simple consumption of the Logger throughout our Extension.
 *
 * @returns { IVSCodeExtLogger }
 */
export function getLogger(): IVSCodeExtLogger {
  if (isInitialized() === false) {
    throw Error(ERROR_LOGGER_NOT_INITIALIZED);
  }
  // logger can't be undefined because isInitialized() already checks it
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return logger!;
}

export function getClassLogger(className: string): IChildLogger | undefined {
  return getLogger()?.getChildLogger({ label: className });
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

  const extensionLoggerOpts: getExtensionLoggerOpts = {
    extName: "vscode-mta-tools", //If the extension name changes, change this too
    level: logLevelSetting,
    logPath: contextLogPath,
    sourceLocationTracking: sourceLocationTrackingSettings,
    logOutputChannel: window.createOutputChannel(messages.CHANNEL_NAME),
  };

  // The Logger must first be initialized before any logging commands may be invoked.
  const extensionLogger = getExtensionLogger(extensionLoggerOpts);
  // Update the logger-wrapper with a reference to the extLogger.
  initLoggerWrapper(extensionLogger);
  logLoggerDetails(context, logLevelSetting);
}
