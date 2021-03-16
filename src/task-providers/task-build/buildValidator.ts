import * as fs from "fs";
import { isEmpty } from "lodash";
import { taskProvidersMessages } from "../../i18n/messages";

export async function validateExtPath(extPath: string): Promise<string> {
  return validatePath(
    extPath,
    taskProvidersMessages.MTAEXT_PATH_VALIDATION_ERR
  );
}

export async function validateModules(modules: string[]): Promise<string> {
  if (isEmpty(modules)) {
    return taskProvidersMessages.MODULES_VALIDATION_ERR;
  }

  return "";
}

export async function validateTargetFolder(
  targetFolderPath: string
): Promise<string> {
  return validatePath(
    targetFolderPath,
    taskProvidersMessages.TARGET_FOLDER_PATH_VALIDATION_ERR
  );
}

async function validatePath(path: string, errMessage: string): Promise<string> {
  // validate file exists or empty path provided
  const result = fs.existsSync(path);
  if (result || path === "") {
    return "";
  }

  return errMessage;
}
