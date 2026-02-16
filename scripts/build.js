const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Clean dist
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// Bundle background script
esbuild.buildSync({
  entryPoints: [path.join(ROOT, 'src/background/background.js')],
  bundle: true,
  outfile: path.join(DIST, 'background.js'),
  format: 'iife',
  target: ['firefox115'],
});

// Bundle content script
esbuild.buildSync({
  entryPoints: [path.join(ROOT, 'src/content/content-script.js')],
  bundle: true,
  outfile: path.join(DIST, 'content-script.js'),
  format: 'iife',
  target: ['firefox115'],
});

// Bundle popup script
esbuild.buildSync({
  entryPoints: [path.join(ROOT, 'src/popup/popup.js')],
  bundle: true,
  outfile: path.join(DIST, 'popup/popup.js'),
  format: 'iife',
  target: ['firefox115'],
});

// Copy popup.html (remove type="module" from script tag)
const popupHtml = fs
  .readFileSync(path.join(ROOT, 'src/popup/popup.html'), 'utf8')
  .replace(' type="module"', '');
fs.writeFileSync(path.join(DIST, 'popup/popup.html'), popupHtml);

// Copy popup.css
fs.copyFileSync(
  path.join(ROOT, 'src/popup/popup.css'),
  path.join(DIST, 'popup/popup.css')
);

// Copy icons
const iconsDir = path.join(DIST, 'icons');
fs.mkdirSync(iconsDir, { recursive: true });
for (const file of fs.readdirSync(path.join(ROOT, 'icons'))) {
  fs.copyFileSync(
    path.join(ROOT, 'icons', file),
    path.join(iconsDir, file)
  );
}

// Generate manifest.json with updated paths
const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8')
);
manifest.background = { scripts: ['background.js'] };
manifest.content_scripts[0].js = ['content-script.js'];
manifest.browser_action.default_popup = 'popup/popup.html';
// web_accessible_resources no longer needed (everything is bundled)
delete manifest.web_accessible_resources;
fs.writeFileSync(
  path.join(DIST, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);

console.log('Build complete → dist/');
