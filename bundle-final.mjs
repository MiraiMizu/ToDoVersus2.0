import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

function copyRecursiveSync(src, dest) {
    if (!fs.existsSync(src)) return;
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach((child) => copyRecursiveSync(path.join(src, child), path.join(dest, child)));
    } else {
        fs.copyFileSync(src, dest);
    }
}

async function build() {
    if (fs.existsSync('.cloudflare-pages')) fs.rmSync('.cloudflare-pages', { recursive: true, force: true });
    fs.mkdirSync('.cloudflare-pages');
    
    // Copy assets
    const assetsDir = path.join('.open-next', 'assets');
    if (fs.existsSync(assetsDir)) copyRecursiveSync(assetsDir, '.cloudflare-pages');

    // Copy wasm files for satori/og-image
    const wasmFiles = [
        'node_modules/next/dist/compiled/@vercel/og/yoga.wasm',
        'node_modules/next/dist/compiled/@vercel/og/resvg.wasm'
    ];
    wasmFiles.forEach(f => {
        const dest = path.join('.cloudflare-pages', path.basename(f));
        if (fs.existsSync(f)) fs.copyFileSync(f, dest);
    });

    console.log("Bundling worker...");

    await esbuild.build({
        entryPoints: ['.open-next/worker.js'],
        bundle: true,
        outfile: '.cloudflare-pages/_worker.js',
        format: 'esm',
        target: 'es2022',
        platform: 'node',
        define: {
            'process.env.NODE_ENV': '"production"'
        },

        minify: true,
        external: [
            'cloudflare:*', 
            '*.wasm', 
            '*.wasm?module',
            'critters',
            '@opentelemetry/api',
            'canvas',
            'sharp',
            'node:*',
            'fs', 'path', 'os', 'url', 'vm', 'crypto', 'stream', 'util', 'module', 'http', 'https', 'async_hooks', 'process', 'events', 'buffer', 'string_decoder', 'punycode', 'querystring', 'zlib'
        ]


    });

    console.log("Build success");
}

build();
