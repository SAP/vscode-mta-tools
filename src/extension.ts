import * as vscode from "vscode"; // NOSONAR
import { MtaBuildCommand } from "./commands/mtaBuildCommand";
import { MtarDeployCommand } from "./commands/mtarDeployCommand";

export function mtaBuildCommand(selected: vscode.Uri) {
	const command: MtaBuildCommand = new MtaBuildCommand();
	return command.mtaBuildCommand(selected);
}

export function mtarDeployCommand(selected: vscode.Uri) {
	const command: MtarDeployCommand = new MtarDeployCommand();
	return command.mtarDeployCommand(selected);
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand("extension.mtaBuildCommand", mtaBuildCommand));
	context.subscriptions.push(vscode.commands.registerCommand("extension.mtarDeployCommand", mtarDeployCommand));
}