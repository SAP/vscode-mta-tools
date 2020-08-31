import { workspace } from "vscode";

/**
 * Note that the values of these configuration properties must match those defined in the package.json
 */
export const LOGGING_LEVEL_CONFIG_PROP = "MTA Tools.loggingLevel";
export const SOURCE_TRACKING_CONFIG_PROP = "MTA Tools.sourceLocationTracking";

/**
 * @returns {LogLevel}
 */
export function getLoggingLevelSetting(): string {
  return workspace.getConfiguration().get(LOGGING_LEVEL_CONFIG_PROP) ?? "error";
}

/**
 * @returns {boolean}
 */
export function getSourceLocationTrackingSetting(): boolean {
  return workspace.getConfiguration().get(SOURCE_TRACKING_CONFIG_PROP) ?? false;
}

module.exports = {
  LOGGING_LEVEL_CONFIG_PROP,
  SOURCE_TRACKING_CONFIG_PROP,
  getLoggingLevelSetting,
  getSourceLocationTrackingSetting
};
