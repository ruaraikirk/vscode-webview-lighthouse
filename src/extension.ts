import * as vscode from 'vscode';
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

const opts = {
	chromeFlags: ['--show-paint-rects', '--disable-gpu','--no-sandbox', '--disable-web-security',
	'--disable-dev-shm-usage', '--headless']
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
					vscode.window.showInformationMessage("Starting the Run for Lighthouse");
					// go off and generate lemon stats
					launchChromeAndRunLighthouse('http://www.sap.com', opts)
							.then((res) => {
								panel.webview.postMessage({ results: JSON.stringify(res) })
								vscode.window.showInformationMessage("Lighthouse Run Complete");
								return;
							});
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
	opts.emulatedFormFactor = 'none';
	opts.throttlingMethod = 'provided';
	opts.disableStorageReset = 'true';
	opts.output = 'json';
    const results = await lighthouse(url, opts, config);
	await chrome.kill();
	return results;
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
					<div id="Button">Click for lighthouse</div>
					<button type=button onclick="sendMessage()">Click To Start Lighthouse run</button>
					<script>
						const vscode = acquireVsCodeApi();
						function sendMessage(){
							vscode.postMessage({command: 'GenerateLemon'})
						}

						window.addEventListener('message', event => {
							document.getElementById('container').innerHTML = "<p>See Results below</p>";
							document.getElementById('results').innerHTML = event.data.results;
						});						
					</script>
					<div id="container"></div>
					<div id="results">Results go here</div>
				</body>
			</html>`;
}