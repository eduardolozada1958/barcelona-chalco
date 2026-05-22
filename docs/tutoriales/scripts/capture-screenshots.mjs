/**
 * Genera capturas para docs/tutoriales/img/
 * Uso: node docs/tutoriales/scripts/capture-screenshots.mjs
 *
 * Variables opcionales:
 *   TUTORIAL_BASE_URL, TUTORIAL_ADMIN_EMAIL, TUTORIAL_PARENT_EMAIL, TUTORIAL_PASSWORD
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG = path.join(__dirname, '..', 'img');
const BASE = process.env.TUTORIAL_BASE_URL || 'https://barcelona-chalco.pages.dev';
const ADMIN_EMAIL = process.env.TUTORIAL_ADMIN_EMAIL || 'admin@barcelonamty.com';
const COACH_EMAIL = process.env.TUTORIAL_COACH_EMAIL || 'entrenador@barcelonamty.com';
const PARENT_EMAIL = process.env.TUTORIAL_PARENT_EMAIL || 'padre1@email.com';
const PASSWORD = process.env.TUTORIAL_PASSWORD || 'Password123!';

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

async function shot(page, subdir, name) {
  const dir = path.join(IMG, subdir);
  ensureDir(dir);
  const file = path.join(dir, `${name}.png`);
  await page.screenshot({ path: file });
  console.log('OK', file);
}

async function dismissPopups(page) {
  const close = page.getByRole('button', { name: /Cerrar aviso/i });
  try {
    if (await close.isVisible({ timeout: 2000 })) {
      await close.click();
      await page.waitForTimeout(500);
    }
  } catch {
    /* sin popup */
  }
}

async function goto(page, route) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForTimeout(800);
  await dismissPopups(page);
  await page.waitForTimeout(400);
}

async function loginAs(page, role, emailOverride) {
  await goto(page, '/login');
  if (role === 'parent') {
    await page.getByRole('button', { name: /Entrar como Padre/i }).click({ force: true });
  } else {
    await page.getByRole('button', { name: /Entrar como Admin/i }).click({ force: true });
  }
  await page.waitForTimeout(600);
  const email =
    emailOverride ??
    (role === 'parent' ? PARENT_EMAIL : role === 'coach' ? COACH_EMAIL : ADMIN_EMAIL);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(PASSWORD);
  await page.getByRole('button', { name: /Iniciar Sesión/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 45_000 });
  await page.waitForTimeout(2000);
}

async function main() {
  ensureDir(IMG);
  const browser = await chromium.launch({ headless: true });
  const desktop = { width: 1280, height: 800 };
  const mobile = { width: 390, height: 844 };

  // --- Público ---
  {
    const ctx = await browser.newContext({ viewport: desktop });
    const page = await ctx.newPage();
    for (const [name, route] of [
      ['01-inicio', '/'],
      ['02-login-selector', '/login'],
      ['03-registro', '/register'],
      ['04-partidos', '/partidos'],
      ['05-avisos', '/avisos'],
      ['06-contacto', '/contacto'],
    ]) {
      await goto(page, route);
      await shot(page, 'publico', name);
    }
    // Formulario padre (sin enviar login)
    await goto(page, '/login');
    await page.getByRole('button', { name: /Entrar como Padre/i }).click({ force: true });
    await page.waitForTimeout(500);
    await shot(page, 'publico', '02b-login-formulario-padre');
    await goto(page, '/login');
    await page.getByRole('button', { name: /Entrar como Admin/i }).click({ force: true });
    await page.waitForTimeout(500);
    await shot(page, 'publico', '02c-login-formulario-admin');
    await ctx.close();
  }

  // --- Padre autenticado ---
  try {
    const ctx = await browser.newContext({ viewport: desktop });
    const page = await ctx.newPage();
    await loginAs(page, 'parent');
    for (const [name, route] of [
      ['10-inicio', '/dashboard'],
      ['11-guia', '/dashboard/guia'],
      ['12-mi-perfil', '/dashboard/cuenta'],
      ['13-mis-jugadores', '/dashboard/mis-jugadores'],
    ]) {
      await goto(page, route);
      await shot(page, 'padres', name);
    }
    await ctx.close();
  } catch (e) {
    console.warn('Padre autenticado (omitido):', e.message);
  }

  // --- Padre móvil ---
  try {
    const ctx = await browser.newContext({ viewport: mobile });
    const page = await ctx.newPage();
    await loginAs(page, 'parent');
    await goto(page, '/dashboard');
    await page.getByRole('button', { name: /menú/i }).click();
    await page.waitForTimeout(500);
    await shot(page, 'padres', '14-menu-movil');
    await ctx.close();
  } catch (e) {
    console.warn('Menú móvil (omitido):', e.message);
  }

  // --- Admin (o entrenador si no hay credenciales admin en producción) ---
  try {
    const ctx = await browser.newContext({ viewport: desktop });
    const page = await ctx.newPage();
    let usedCoach = false;
    try {
      await loginAs(page, 'admin');
    } catch {
      console.warn('Admin login falló; usando entrenador para capturas del panel.');
      await loginAs(page, 'coach');
      usedCoach = true;
    }
    for (const [name, route] of [
      ['20-inicio-admin', '/dashboard'],
      ['21-avisos-admin', '/dashboard/notices'],
      ['22-vinculos', '/dashboard/link-requests'],
      ['24-plantilla', '/dashboard/players'],
    ]) {
      await goto(page, route);
      await shot(page, 'admin', name);
    }
    if (!usedCoach) {
      await goto(page, '/dashboard/whatsapp');
      await shot(page, 'admin', '23-whatsapp');
    }
    await ctx.close();
  } catch (e) {
    console.warn('Panel admin (omitido):', e.message);
  }

  // --- Entrenador ---
  try {
    const ctx = await browser.newContext({ viewport: desktop });
    const page = await ctx.newPage();
    await loginAs(page, 'coach');
    for (const [name, route] of [
      ['30-inicio', '/dashboard'],
      ['31-plantilla', '/dashboard/players'],
      ['32-vinculos', '/dashboard/link-requests'],
    ]) {
      await goto(page, route);
      await shot(page, 'entrenador', name);
    }
    await ctx.close();
  } catch (e) {
    console.warn('Entrenador (omitido):', e.message);
  }

  await browser.close();
  console.log('\nListo. Imágenes en docs/tutoriales/img/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
