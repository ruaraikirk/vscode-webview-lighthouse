import * as vscode from 'vscode';
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

const opts = {
    chromeFlags: ['--show-paint-rects']
  };

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
				case "GenerateLemon":
					vscode.window.showInformationMessage("Message recieved from webview!");
						// go off and generate lemon stats
						launchChromeAndRunLighthouse('http://www.sap.com', opts).then(function(results) {
							panel.webview.postMessage({ results: 'DONE!!' });
						})
					return;
				}
			},
			undefined,
			context.subscriptions
		);
		})
	);
}



async function launchChromeAndRunLighthouse(url: string, opts: any, config: any = null) {
    const chrome = await chromeLauncher.launch({chromeFlags: opts.chromeFlags});
    opts.port = chrome.port;
    const results = await lighthouse(url, opts, config);
    await chrome.kill();
    console.log(results);
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
							vscode.postMessage({command: 'GenerateLemon'})
						}

						window.addEventListener('message', event => {
							document.getElementById('results').innerHTML = event.data.results;
						});						
					</script>
					<div id="results">Results go here</div>
				</body>
			</html>`;
}