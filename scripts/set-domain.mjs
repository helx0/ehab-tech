import { readFileSync, writeFileSync } from 'node:fs';

const domain = process.argv[2];
if (!domain || !/^https?:\/\/[^\s"'<>]+$/.test(domain)) {
  console.error('Usage: node scripts/set-domain.mjs https://your-real-domain.com');
  process.exit(1);
}
const origin = domain.replace(/\/$/, '');
const placeholder = /https:\/\/ehabtech\.example|https:\/\/your-real-domain\.com|https:\/\/[^/\s"'<>]*example[^/\s"'<>]*/g;

writeFileSync('.env.local', `VITE_SITE_URL=${origin}\n`);
writeFileSync('.env.example', `# Absolute site origin used for canonical URLs, sitemap and social sharing.\nVITE_SITE_URL=${origin}\n`);
console.log('Updated .env.local and .env.example');

for (const file of ['index.html', 'public/robots.txt', 'public/sitemap.xml']) {
  const source = readFileSync(file, 'utf8');
  writeFileSync(file, source.replace(placeholder, origin));
  console.log(`Updated ${file} -> ${origin}`);
}
console.log('Now run: npm run build');
