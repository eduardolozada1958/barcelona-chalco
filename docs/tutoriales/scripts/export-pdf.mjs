/**
 * Genera PDF con imágenes incrustadas.
 * Requiere: pandoc en PATH, playwright (npm install en raíz del repo).
 *
 * Uso: node docs/tutoriales/scripts/export-pdf.mjs
 */
import { execSync } from 'child_process';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TUTORIALS = path.join(__dirname, '..');
const PDF_DIR = path.join(TUTORIALS, 'pdf');

const FILES = [
  ['TUTORIAL_PADRES.md', 'Tutorial-Padres.pdf', 'Tutorial Padres'],
  ['INSTALAR_APP.md', 'Instalar-App.pdf', 'Instalar app'],
  ['TUTORIAL_ADMIN.md', 'Tutorial-Admin.pdf', 'Tutorial Admin'],
  ['TUTORIAL_ENTRENADOR.md', 'Tutorial-Entrenador.pdf', 'Tutorial Entrenador'],
];

function pandocHtml(mdFile, htmlFile, title) {
  const cmd = [
    'pandoc',
    `"${mdFile}"`,
    '-o',
    `"${htmlFile}"`,
    '--standalone',
    '--embed-resources',
    '--resource-path=.',
    `--metadata title="${title}"`,
  ].join(' ');
  execSync(cmd, { cwd: TUTORIALS, stdio: 'inherit', shell: true });
}

async function htmlToPdf(page, htmlFile, pdfFile) {
  const url = 'file:///' + htmlFile.replace(/\\/g, '/');
  await page.goto(url, { waitUntil: 'load', timeout: 120_000 });
  await page.waitForTimeout(800);
  await page.pdf({
    path: pdfFile,
    format: 'A4',
    printBackground: true,
    margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
  });
}

async function main() {
  try {
    execSync('pandoc --version', { stdio: 'pipe' });
  } catch {
    console.error('Instala Pandoc primero: winget install JohnMacFarlane.Pandoc');
    process.exit(1);
  }

  fs.mkdirSync(PDF_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const [md, pdfName, title] of FILES) {
    const mdPath = path.join(TUTORIALS, md);
    const htmlPath = path.join(PDF_DIR, pdfName.replace('.pdf', '.html'));
    const pdfPath = path.join(PDF_DIR, pdfName);

    console.log('\n→', md);
    pandocHtml(mdPath, htmlPath, title);
    await htmlToPdf(page, htmlPath, pdfPath);
    console.log('OK', pdfPath);
  }

  await browser.close();
  console.log('\nListo. PDFs en docs/tutoriales/pdf/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
