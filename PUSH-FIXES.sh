#!/bin/bash

echo "🔧 Setting up and pushing fixes to GitHub..."
echo ""

# Remove .github workflow folder (not needed for Cloudflare)
echo "📝 Removing unnecessary GitHub workflows..."
rm -rf .github
echo "✅ Removed .github folder"
echo ""

# Initialize git if not already done
if [ ! -d .git ]; then
    echo "📝 Initializing git repository..."
    git init
    git branch -M main
    echo "✅ Git initialized"
    echo ""
fi

# Remove any existing origin
git remote remove origin 2>/dev/null

# Set up the correct remote
echo "📝 Setting up GitHub remote..."
echo "   Your GitHub repo: https://github.com/77akshat-byte/daily-test-simulator"
git remote add origin "https://github.com/77akshat-byte/daily-test-simulator.git"
echo "✅ Remote added"
echo ""

# Fix astro.config.mjs - remove import.meta.env.PROD check
echo "📝 Fixing astro.config.mjs..."
cat > astro.config.mjs << 'EOF'
import {defineConfig} from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

function patchViteErrorOverlay() {
  return {
    name: 'patch-vite-error-overlay',
    transform(code, id) {
      if (id.includes('vite/dist/client/client.mjs')) {
        return code.replace(
          /const editorLink = this\.createLink\(`Open in editor\${[^}]*}\`, void 0\);[\s\S]*?codeHeader\.appendChild\(editorLink\);/g,
          ''
        );
      }
    },
  };
}

function injectDevScript(options = {}) {
  const {scriptPath} = options;
  if (!scriptPath) {
    throw new Error('injectDevScript requires a scriptPath');
  }
  return {
    name: 'inject-dev-script',
    hooks: {
      'astro:config:setup': ({injectScript, command, logger}) => {
        if (command === 'dev') {
          logger.info(`Injecting dev script: ${scriptPath}`);
          injectScript('page', `import "${scriptPath}";`);
        }
      },
    },
  };
}

export default defineConfig({
  base: '',
  output: 'server',
  devToolbar: {
    enabled: false,
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true,
  },
  adapter: cloudflare({
    mode: 'directory',
    functionPerRoute: false,
  }),
  integrations: [
    react(),
    injectDevScript({scriptPath: '/generated/dev-only.js'}),
  ],
  vite: {
    plugins: [tailwindcss(), patchViteErrorOverlay()],
    ssr: {
      noExternal: ['@astrojs/cloudflare'],
      external: [
        'googleapis',
        'google-auth-library',
        'googleapis-common',
        'gaxios',
        'gcp-metadata',
        'gtoken',
        'jws',
        'jwa',
      ],
    },
    build: {
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('@radix-ui')) {
                const match = id.match(/@radix-ui\/([^/]+)/);
                if (match) return `radix-${match[1]}`;
                return 'radix-ui';
              }
              if (id.includes('react-dom')) return 'react-dom';
              if (id.includes('react')) return 'react';
              if (id.includes('@supabase')) return 'supabase';
              if (id.includes('recharts')) return 'recharts';
              if (id.includes('lucide-react')) return 'lucide';
              if (id.includes('src/components/ui')) return 'ui-components';
              return 'vendor';
            }
          },
        },
      },
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
    server: {
      watch: {
        usePolling: true,
        interval: 1000,
        ignored: [
          '**/lost+found/**',
          '**/dist/**',
          '**/node_modules/**',
          '**/src/site-components/**',
          '**/*.md',
          /[/\\]webflow\.json$/
        ],
      },
    },
    resolve: {
      alias: {
        'react-dom/server': 'react-dom/server.edge',
      },
    },
  },
});
EOF

echo "✅ Fixed astro.config.mjs"
echo ""
echo "🚀 Committing all files..."

# Add all files
git add .

# Commit
git commit -m "Fix: Remove import.meta.env.PROD check to prevent cloudflare: protocol error"

echo ""
echo "📤 Pushing to GitHub (force push to overwrite)..."
echo "   Enter your GitHub Personal Access Token:"
read -s GITHUB_TOKEN
echo ""

# Force push with credentials
git push --force https://$GITHUB_TOKEN@github.com/77akshat-byte/daily-test-simulator.git main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎉 Next steps:"
    echo "   1. Go to: https://dash.cloudflare.com"
    echo "   2. Navigate to: Workers & Pages → daily-test-simulator"
    echo "   3. Watch the build logs (auto-deploy in ~2 minutes)"
    echo ""
    echo "   Your app will be live at: https://daily-test-simulator.pages.dev"
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "   - Your GitHub token is valid"
    echo "   - The repository exists: https://github.com/77akshat-byte/daily-test-simulator"
    exit 1
fi
