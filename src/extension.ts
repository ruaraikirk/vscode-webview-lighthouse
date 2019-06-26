import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { eventNames } from 'cluster';
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
		// panel.webview.html = fs.readFileSync(path.resolve('/Users/i311186/Documents', `output.html`), 'utf8');
		
		panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
				case "GenerateLemon":
					vscode.window.showInformationMessage("Starting the Run for Lighthouse");
					// go off and generate lemon stats
					return launchChromeAndRunLighthouse('http://www.sap.com', opts)
							.then((res) => {
								const filePath = path.resolve('/Users/i311186/Documents/lighthouse', `output.html`);
								fs.writeFileSync(filePath, res.report);
								const jsonFile = path.resolve('/Users/i311186/Documents/lighthouse', `output.json`);
								fs.writeFileSync(jsonFile, JSON.stringify(res.lhr.categories));
								vscode.window.showInformationMessage("Lighthouse Run Complete");

								const results = { results: res.lhr.categories, link: filePath}

								console.log(results);
								return setTimeout(function() {
									panel.webview.postMessage({ results: res.lhr.categories, link: `<a href=file://${filePath}>Link Path to Lighthouse Report</a>`})
									// panel.webview.html = res.report;
								}, 3000)
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
	opts.output = 'html';
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
							document.getElementById('link').innerHTML = event.data.link;
							// document.getElementById('accessibilty').innerHTML = JSON.stringify(event.data.results.accessibility);
							// document.getElementById('pwacontainer').innerHTML = "<p>See PWA Results below</p>";
							// document.getElementById('pwa').innerHTML = JSON.stringify(event.data.results.pwa);
							// document.getElementById('performancecontainer').innerHTML = "<p>See Perf Results below</p>";
							// document.getElementById('performance').innerHTML = JSON.stringify(event.data.results.performance);
							// document.getElementById('best-practicescontainer').innerHTML = "<p>See Best-Practices Results below</p>";
							// document.getElementById('best-practices').innerHTML = JSON.stringify(event.data.results.best-practices);
							// document.getElementById('seocontainer').innerHTML = "<p>See SEO Results below</p>";
							// document.getElementById('seo').innerHTML = JSON.stringify(event.data.results.seo);

						});						
					</script>
					<div id="container"></div>
					<div id="link"></div>
					<div id="jsonresult"></div>
					



					<div id="accessibilitycontainer"></div>
					<div id="accessibilty"></div>
					<div id="pwacontainer"></div>
					<div id="pwa"></div>
					<div id="performancecontainer"></div>
					<div id="performance"></div>
					<div id="best-practicescontainer"></div>
					<div id="best-practices"></div>
					<div id="seocontainer"></div>
					<div id="seo"></div>
					
				</body>
			</html>`;
}