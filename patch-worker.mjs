import fs from 'node:fs';
import path from 'node:path';

// Note: In monolithic mode, OpenNext-Cloudflare 1.x still uses server-functions/default

console.log('Pruning heavy dependencies from server-functions/default...');

const defaultModulesPath = path.join('.open-next', 'server-functions', 'default', 'node_modules');

if (fs.existsSync(defaultModulesPath)) {
    const prunablePatterns = [
        '.prisma/client/libquery_engine-*',
        '.prisma/client/query-engine-*',
        'prisma/libquery_engine-*',
        '@prisma/engines',
        'better-sqlite3/build',
        '@prisma/client/runtime/query_compiler_*',
        '@prisma/client/runtime/*.wasm-base64.*',
        '@prisma/client/runtime/index-browser.js',
        '@prisma/client/runtime/edge-runtime.js.map',
        'next/dist/server/capsize-font-metrics.json',
        'next/dist/server/load-components.js.map',
        'next/dist/server/next-server.js.map',
        'next/dist/compiled/next-server/pages-turbo.runtime.prod.js',
        'next/dist/compiled/next-server/app-page-turbo-experimental.runtime.prod.js',
        'react-dom/cjs/react-dom-server.node.production.js',
        'react-dom/cjs/react-dom-server.browser.production.js',
        'react-dom/cjs/react-dom-server-legacy.node.production.js',
        'react-dom/cjs/react-dom-server-legacy.browser.production.js'
    ];

    for (const pattern of prunablePatterns) {
        const fullPattern = path.join(defaultModulesPath, pattern);
        try {
            if (pattern.includes('*')) {
                const parentDir = path.dirname(fullPattern);
                if (fs.existsSync(parentDir)) {
                    const files = fs.readdirSync(parentDir);
                    const basePattern = path.basename(pattern).replace('*', '');
                    for (const file of files) {
                        if (file.startsWith(basePattern)) {
                            fs.rmSync(path.join(parentDir, file), { recursive: true, force: true });
                        }
                    }
                }
            } else if (fs.existsSync(fullPattern)) {
                fs.rmSync(fullPattern, { recursive: true, force: true });
            }
        } catch (e) {
            console.warn(`Pruning failed for ${pattern}: ${e.message}`);
        }
    }
}

// Scrubbing phase: Replace missing optional dependencies with empty objects in built code
function scrubFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let code = fs.readFileSync(filePath, 'utf8');
    const missingDeps = ['critters', '@opentelemetry/api', '@opentelemetry/sdk-trace-node', '@opentelemetry/sdk-trace-web'];
    let changed = false;
    for (const dep of missingDeps) {
        const regexNode = new RegExp(`require\\(['"]${dep}['"]\\)`, 'g');
        if (regexNode.test(code)) {
            code = code.replace(regexNode, '{}');
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(filePath, code);
    }
}

function walkAndScrub(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkAndScrub(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs')) {
            scrubFile(fullPath);
        }
    }
}

console.log('Scrubbing missing optional dependencies...');
walkAndScrub(path.join('.open-next', 'server-functions', 'default'));
console.log('Successfully scrubbed missing dependencies.');

// Final recursive cleanup of all .map files
function deleteMaps(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            deleteMaps(fullPath);
        } else if (file.endsWith('.map')) {
            fs.unlinkSync(fullPath);
        }
    }
}
console.log('Final cleanup of .map files...');
deleteMaps(path.join('.open-next', 'server-functions', 'default'));
console.log('Successfully deleted all .map files.');

// Content-stripping phase: Remove exceptionally long base64 strings from handler.mjs
function stripLongLines(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    // Targeting massive base64 strings (over 500k characters for safety)
    const regex = /[a-zA-Z0-9+/]{500000,}/g;
    const originalLength = content.length;
    content = content.replace(regex, '');
    if (content.length !== originalLength) {
        fs.writeFileSync(filePath, content);
        console.log(`Pruned massive base64 from ${filePath}, saving ${Math.round((originalLength - content.length) / 1024 / 1024 * 10) / 10} MB.`);
    }
}

console.log('Stripping exceptionally long lines from bundled handlers...');
stripLongLines(path.join('.open-next', 'server-functions', 'default', 'handler.mjs'));
console.log('Monolith patch and prune complete.');
