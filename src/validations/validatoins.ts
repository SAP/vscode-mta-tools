import { Disposable } from "vscode";
import { watchMtaYamlAndDevExtFiles } from "./validationsFsWatcher";

export function registerValidation(disposables: Disposable[]): void {
  watchMtaYamlAndDevExtFiles(disposables);

  //TODO: register to WS load and validate then
  // TODO: GO over the story and the BLI

  // FROM THE SAMPLE
  // context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
  // 	if (editor) {
  // 		updateDiagnostics(editor.document, collection);
  // 	}
}
