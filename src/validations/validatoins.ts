import { Disposable } from "vscode";
import { watchMtaYamlAndDevExtFiles } from "./validationsFsWatcher";

export function registerValidation(disposables: Disposable[]): void {
  watchMtaYamlAndDevExtFiles(disposables);

  // FROM THE SAMPLE
  // context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
  // 	if (editor) {
  // 		updateDiagnostics(editor.document, collection);
  // 	}
}
