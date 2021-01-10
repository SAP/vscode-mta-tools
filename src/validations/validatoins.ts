import { Disposable } from "vscode";
import {
  validateWsMtaYamls,
  watchMtaYamlAndDevExtFiles,
} from "./mtaValidations";

export async function registerValidation(
  disposables: Disposable[]
): Promise<void> {
  watchMtaYamlAndDevExtFiles(disposables);

  await validateWsMtaYamls(disposables);
}
