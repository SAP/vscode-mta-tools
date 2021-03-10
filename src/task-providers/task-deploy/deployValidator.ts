import { existsSync } from "fs";
import { isEmpty } from "lodash";
import { taskProvidersMessages } from "../../i18n/messages";

export function validateExtPath(value: string): string {
  // valid empty path
  if (isEmpty(value)) {
    return "";
  }
  // validate file exists
  const result = existsSync(value);
  if (!result) {
    return taskProvidersMessages.MTAEXT_PATH_VALIDATION_ERR;
  }
  return "";
}
