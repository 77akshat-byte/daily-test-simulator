/**
 * Optimized build script for memory-constrained environments
 * This script runs the Astro build with memory optimizations
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nodeOptions = [
  '--max-old-space-size=4096',
  '--max-semi-space-size=64',
  '--conditions=workerd,worker,browser',
].join(' ');

console.log('Starting optimized build with memory settings:', nodeOptions);

// Use npx to run astro, which handles the loader properly
const build = spawn('npx', ['astro', 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: nodeOptions,
  },
  shell: true,
  cwd: __dirname,
});

build.on('close', (code) => {
  process.exit(code || 0);
});

build.on('error', (err) => {
  console.error('Build process error:', err);
  process.exit(1);
});
