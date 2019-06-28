import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { eventNames } from 'cluster';
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');


const opts = {
	chromeFlags: ['--show-paint-rects', '--disable-gpu','--no-sandbox', '--disable-web-security',
	'--disable-dev-shm-usage', '--window-size=1900,1200', '--headless']
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
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'out'))]
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
					return launchChromeAndRunLighthouse('http://www.google.com', opts)
							.then((res) => {
								let htmlStatic;
								// Get path to resource on disk
								const onDiskPath = vscode.Uri.file(
									path.join(context.extensionPath, 'out', 'report.html')
								);
								  
								
								
								// And get the special URI to use with the webview
								const output = onDiskPath.with({ scheme: 'vscode-resource' });

								const reportFile = res.report.replace('body class="lh-root lh-vars"', 'body class="lh-root lh-vars dark"');

								fs.writeFileSync(output.path, reportFile);
								vscode.window.showInformationMessage("Lighthouse Run Complete");

								ssr(output.path).then(html => {
									htmlStatic = html
									const staticPath = vscode.Uri.file(
										path.join(context.extensionPath, 'out', 'static.html')
									);
									const stat = staticPath.with({ scheme: 'vscode-resource' });

									fs.writeFileSync(stat.path, htmlStatic);
									
								});
								
								  
								panel.webview.postMessage({ results: res.lhr, file: htmlStatic, report: reportFile});													
								
								// // Launch 2nd Tab with report beside original
								// const report = vscode.window.createWebviewPanel(
								// 	'lighthouse Report',
								// 	'Lighthouse Report Webview',
								// 	vscode.ViewColumn.Two,
								// 	{
								// 		// Enable scripts in the webview
								// 		enableScripts: true,
								// 		retainContextWhenHidden: true,
								// 		localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'out'))]
										
								// 	}
								// );
								// report.webview.html = reportFile;


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

async function ssr(url: any) {
	console.log(`file://${url}`);
	const browser = await puppeteer.launch({headless: true});
	const page = await browser.newPage();
	await page.goto(`file://${url}`, {waitUntil: 'networkidle0'});
	const html = await page.content(); // serialized HTML of page DOM.
	await browser.close();
	return html;
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
							document.getElementById('container').innerHTML = "<p>See Results below for " + event.data.results.requestedUrl + "</p>";
							

							console.log(event.data.file)
							



						});						
					</script>
					<div id="container"></div>
					<div id="link"></div>

					<p>Frame is here</p>
					<iframe id="iframe1" height="80%" width="100%">
					</iframe>
				</body>
			</html>`;
}