import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('lighthouse.start', () => {
		// Create and show panel
		const panel = vscode.window.createWebviewPanel(
			'lighthouse',
			'Lighthouse Webview',
			vscode.ViewColumn.One,
			{
				// Enable scripts in the webview
				enableScripts: true
			}
		);

		// And set its HTML content
		panel.webview.html = getWebviewContent();
		
		panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
				case "Hello":
					vscode.window.showInformationMessage("Message recieved from webview!");
					return;
				}
			},
			undefined,
			context.subscriptions
		);
		})
	);
}

function getWebviewContent() {
	return `<!DOCTYPE html>
			<html lang="en">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Cat Coding</title>
				</head>
				<body>
					<img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
					<button type=button onclick="sendMessage()">Click me!</button>
					<script>
						const vscode = acquireVsCodeApi();
						function sendMessage(){
						vscode.postMessage({command: 'Hello'})
						}
					</script>
				</body>
			</html>`;
}