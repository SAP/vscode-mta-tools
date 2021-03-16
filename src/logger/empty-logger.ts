/* eslint @typescript-eslint/no-unused-vars: 0 */
/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint  @typescript-eslint/no-empty-function: 0 */

import { IVSCodeExtLogger, IChildLogger } from "@vscode-logging/logger";

export const EMPTY_LOGGER: IVSCodeExtLogger = {
  changeLevel(newLevel: string): void {},
  changeSourceLocationTracking(newSourceLocation: boolean): void {},
  debug(msg: string, ...args: any[]): void {},
  error(msg: string, ...args: any[]): void {},
  fatal(msg: string, ...args: any[]): void {},
  getChildLogger(opts: { label: string }): IChildLogger {
    return this;
  },
  info(msg: string, ...args: any[]): void {},
  trace(msg: string, ...args: any[]): void {},
  warn(msg: string, ...args: any[]): void {},
};

Object.freeze(EMPTY_LOGGER);
