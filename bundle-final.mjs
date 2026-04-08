import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

async function build() {
    console.log("Starting custom bundling of OpenNext worker...");
    
    // Cloudflare environments use node: prefixed imports for built-ins.
    // We treat them as external so esbuild leaves them alone.
    const nodeBuiltIns = [
        'async_hooks', 'fs', 'path', 'os', 'crypto', 'events', 'util', 
        'stream', 'buffer', 'http', 'https', 'url', 'zlib', 'net', 'tls',
        'vm', 'module'
    ];
    
    const externalList = [
        'node:*',
        'cloudflare:*',
        '*.wasm',
        '*.wasm?module',
        ...nodeBuiltIns
    ];

    await esbuild.build({
        entryPoints: ['.open-next/worker.js'],
        bundle: true,
        outfile: '.cloudflare-pages/_worker.js',
        format: 'esm',
        target: 'es2022',
        platform: 'neutral',
        minify: true,
        external: externalList,
        conditions: ['workerd', 'worker', 'browser'],
        alias: {
            // Force unprefixed node builtins to resolve to node: prefixed ones
            ...Object.fromEntries(nodeBuiltIns.map(b => [b, `node:${b}`]))
        },
        mainFields: ['module', 'main'],
        logLevel: 'info'
    });

    console.log("Successfully created flat bundle.");

    // Prepare Pages Functions structure
    console.log("Preparing Cloudflare Pages deployment structure...");
    const pagesDir = '.cloudflare-pages';
    const functionsDir = path.join(pagesDir, 'functions');
    
    if (!fs.existsSync(functionsDir)) {
        fs.mkdirSync(functionsDir, { recursive: true });
    }

    // Move the worker to functions/[[path]].js to force ESM
    fs.renameSync(path.join(pagesDir, '_worker.js'), path.join(functionsDir, '[[path]].js'));

    // Copy static assets from open-next
    const assetsDir = path.join('.open-next', 'assets');
    if (fs.existsSync(assetsDir)) {
        copyRecursiveSync(assetsDir, pagesDir);
    }
    
    console.log("Deployment directory .cloudflare-pages is ready!");
}

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

build().catch((err) => {
    console.error("Bundling failed", err);
    process.exit(1);
});
