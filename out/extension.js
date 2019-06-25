"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const opts = {
    chromeFlags: ['--show-paint-rects', '--disable-gpu', '--no-sandbox', '--disable-web-security',
        '--disable-dev-shm-usage', '--headless']
};
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('lighthouse.start', () => {
        // Create and show panel
        const panel = vscode.window.createWebviewPanel('lighthouse', 'Lighthouse Webview', vscode.ViewColumn.One, {
            // Enable scripts in the webview
            enableScripts: true
        });
        // And set its HTML content
        panel.webview.html = getWebviewContent();
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case "GenerateLemon":
                    vscode.window.showInformationMessage("Starting the Run for Lighthouse");
                    // go off and generate lemon stats
                    launchChromeAndRunLighthouse('http://www.sap.com', opts)
                        .then((res) => {
                        panel.webview.postMessage({ results: JSON.stringify(res) });
                        vscode.window.showInformationMessage("Lighthouse Run Complete");
                        return;
                    });
            }
        }, undefined, context.subscriptions);
    }));
}
exports.activate = activate;
function launchChromeAndRunLighthouse(url, opts, config = null) {
    return __awaiter(this, void 0, void 0, function* () {
        const chrome = yield chromeLauncher.launch({ chromeFlags: opts.chromeFlags });
        opts.port = chrome.port;
        opts.emulatedFormFactor = 'none';
        opts.throttlingMethod = 'provided';
        opts.disableStorageReset = 'true';
        opts.output = 'json';
        const results = yield lighthouse(url, opts, config);
        yield chrome.kill();
        return results;
    });
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
//# sourceMappingURL=extension.js.map