
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8080;
const HOST = 'localhost';

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'font/woff',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'font/otf',
        '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                fs.readFile('./404.html', (error, content) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

async function run() {
    const args = process.argv.slice(2);
    const pageArg = args.find(arg => arg.startsWith('--page='));
    const screenshotArg = args.find(arg => arg.startsWith('--screenshot='));

    if (!pageArg || !screenshotArg) {
        console.error('Usage: node verify.js --page=<page_name> --screenshot=<screenshot_path>');
        process.exit(1);
    }

    const pageName = pageArg.split('=')[1];
    const screenshotPath = screenshotArg.split('=')[1];

    server.listen(PORT, HOST, () => console.log(`Server running at http://${HOST}:${PORT}/`));

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(`http://${HOST}:${PORT}/${pageName}.html`);
    await page.screenshot({ path: screenshotPath });
    await browser.close();
    server.close();
}

run();
