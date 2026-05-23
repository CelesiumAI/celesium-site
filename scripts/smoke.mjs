#!/usr/bin/env node
// Smoke test for celesium-ai-site (Wave 1 graduation gate).
// Validates: HTML parses, sitemap is well-formed and matches files,
// api/contact.js has valid JS syntax, internal hrefs resolve to real files.

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname, posix } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { DOMParser, parseHTML } from 'linkedom';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function fail(reason) {
  console.log(`SMOKE-FAIL ${reason}`);
  process.exit(1);
}

function listHtmlAtRoot() {
  return readdirSync(repoRoot, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => e.name)
    .sort();
}

function resolveInternalHref(rawHref, fromFile) {
  // Returns absolute filesystem path the href should resolve to, or null to skip.
  if (!rawHref) return null;
  const href = rawHref.trim();
  if (href === '') return null;
  if (href.startsWith('#')) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
    // Has a scheme (http, https, mailto, tel, javascript, data, etc.) — external.
    return null;
  }
  // Strip query + fragment.
  const noFragment = href.split('#')[0].split('?')[0];
  if (noFragment === '') return null;

  let rel;
  if (noFragment.startsWith('/')) {
    rel = noFragment.slice(1);
  } else {
    const fromDir = dirname(fromFile);
    rel = posix.normalize(posix.join(
      fromDir === repoRoot ? '' : fromDir.slice(repoRoot.length + 1).replaceAll('\\', '/'),
      noFragment
    ));
  }
  if (rel === '' || rel.endsWith('/')) {
    rel = posix.join(rel, 'index.html');
  }
  return resolve(repoRoot, rel);
}

// --- 1. node --check on api/contact.js -----------------------------------
const contactJs = join(repoRoot, 'api', 'contact.js');
if (!existsSync(contactJs)) fail('api/contact.js missing');
try {
  execFileSync(process.execPath, ['--check', contactJs], { stdio: 'pipe' });
} catch (err) {
  const msg = (err.stderr?.toString() || err.message || '').trim().split('\n').slice(0, 2).join(' | ');
  fail(`api/contact.js syntax error: ${msg}`);
}

// --- 2. Parse every root-level .html file --------------------------------
const htmlFiles = listHtmlAtRoot();
if (htmlFiles.length === 0) fail('no .html files at repo root');

const parsed = new Map();
for (const name of htmlFiles) {
  const abs = join(repoRoot, name);
  const src = readFileSync(abs, 'utf8');
  try {
    const { document } = parseHTML(src);
    if (!document || !document.documentElement) {
      fail(`${name}: parsed empty document`);
    }
    parsed.set(abs, document);
  } catch (err) {
    fail(`${name}: parse error: ${err.message}`);
  }
}

// --- 3. Validate sitemap.xml ---------------------------------------------
const sitemapPath = join(repoRoot, 'sitemap.xml');
if (!existsSync(sitemapPath)) fail('sitemap.xml missing');
const sitemapSrc = readFileSync(sitemapPath, 'utf8');
const sitemapDoc = new DOMParser().parseFromString(sitemapSrc, 'text/xml');
const parserError = sitemapDoc.querySelector('parsererror');
if (parserError) fail(`sitemap.xml malformed: ${parserError.textContent.trim().slice(0, 200)}`);
const locs = [...sitemapDoc.querySelectorAll('loc')].map((n) => n.textContent.trim());
if (locs.length === 0) fail('sitemap.xml has no <loc> entries');
for (const loc of locs) {
  let url;
  try {
    url = new URL(loc);
  } catch {
    fail(`sitemap.xml: invalid URL "${loc}"`);
  }
  let path = url.pathname;
  if (path === '/' || path === '') path = '/index.html';
  const fsPath = resolve(repoRoot, path.replace(/^\//, ''));
  if (!existsSync(fsPath) || !statSync(fsPath).isFile()) {
    fail(`sitemap.xml references missing file: ${loc} -> ${fsPath}`);
  }
}

// --- 4. Internal href resolution -----------------------------------------
for (const [abs, doc] of parsed) {
  const name = abs.slice(repoRoot.length + 1);
  const anchors = [...doc.querySelectorAll('[href]')];
  for (const a of anchors) {
    const raw = a.getAttribute('href');
    const target = resolveInternalHref(raw, abs);
    if (target === null) continue;
    if (!existsSync(target)) {
      fail(`${name}: href "${raw}" -> ${target} does not exist`);
    }
    if (!statSync(target).isFile()) {
      fail(`${name}: href "${raw}" -> ${target} is not a file`);
    }
  }
}

console.log(`SMOKE-PASS html=${htmlFiles.length} sitemap_urls=${locs.length}`);
process.exit(0);
