#!/usr/bin/env node
// ENV-086 — Build-time generator for the public Library / Platform page.
//
// Input: an inline source-of-truth list of production engines, derived
// from the fleet library's marketing cards (engine-envelope-workdir/
// _env082/marketing_cards.json, status='production' only).
//
// Output:
//   - data/library.json  — sanitized public catalog (safe-subset)
//
// SAFE-SUBSET RULE (locked):
// Per production engine the public catalog exposes ONLY:
//   - displayName
//   - sector  (canonical 14-sector taxonomy)
//   - purpose (one-line benefit statement; no methodology, no
//              authorities, no proof-hook internals, no slugs, no URLs)
// All other fields (engineSlug, demoUrl, proofHook, buyerRole,
// envelopeId, simulate flags, build provenance, examples) are DROPPED.
//
// Run with: node scripts/build-library.mjs
// (Also invoked by `npm run build`.)

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Canonical 14-sector taxonomy — mirrors fleet/services/console/src/lib/marketing.ts
// (ENV-085). Order matters for the encyclopedia frame on the public page.
const CANONICAL_SECTORS = [
  'HR',
  'Legal',
  'Accounting/Finance',
  'Healthcare',
  'Security/Physical',
  'Insurance',
  'Construction/Safety',
  'Real Estate',
  'Banking/Compliance',
  'Education/Higher-Ed',
  'Manufacturing/Quality',
  'Energy/Utilities',
  'Government/Procurement',
  'Export Controls & Trade Compliance',
];

// Production engines — safe-subset projection of the fleet library.
// Each entry is { displayName, sector, purpose }. NOTHING ELSE.
// Source: engine-envelope-workdir/_env082/marketing_cards.json
// (15 prior shelf) + ENV-085 graduating cohort of 6 newly-promoted
// engines from env084-orchestrator/hopper.tsv (sbti-target-validation,
// scope-3-classification, ghg-emissions-accounting,
// financial-statement-controls, continuous-control-monitoring,
// sentiment-hot-document). Production count = 21 across 8 of the
// canonical 14 sectors (Healthcare, Legal, Banking/Compliance,
// Insurance, Export Controls & Trade Compliance, Education/Higher-Ed
// + Energy/Utilities + Accounting/Finance). Sanitized to remove
// regulatory-authority and methodology references.
const ENGINES = [
  // Healthcare
  { displayName: 'Medical Necessity & Level-of-Care Reviewer',
    sector: 'Healthcare',
    purpose: 'Decides whether a hospital stay meets level-of-care defensibility, for utilization-review nurses and physician advisors.' },
  { displayName: 'Inpatient vs Observation Status Reviewer',
    sector: 'Healthcare',
    purpose: 'Calls inpatient versus observation status for utilization-review teams under the Two-Midnight benchmark.' },
  { displayName: 'Principal-Diagnosis Sequencing Reviewer',
    sector: 'Healthcare',
    purpose: 'Sequences principal diagnoses for clinical documentation integrity and HIM teams.' },
  { displayName: 'RAC & UPIC Overpayment Defense Analyzer',
    sector: 'Healthcare',
    purpose: 'Builds defensible responses to overpayment demands for hospital appeals teams.' },

  // Insurance
  { displayName: 'Wildfire Catastrophe-Zone Insurability Reviewer',
    sector: 'Insurance',
    purpose: 'Calls wildfire-zone insurability and moratorium decisions for property underwriters and compliance.' },

  // Export Controls & Trade Compliance
  { displayName: 'EAR License-Exception Eligibility Reviewer',
    sector: 'Export Controls & Trade Compliance',
    purpose: 'Determines license-exception eligibility for export-compliance officers shipping controlled goods.' },
  { displayName: 'Technology Control Plan Adequacy Reviewer',
    sector: 'Export Controls & Trade Compliance',
    purpose: 'Reviews technology control plans for foreign-national access at universities and defense contractors.' },
  { displayName: 'Deemed-Export License Determination Analyzer',
    sector: 'Export Controls & Trade Compliance',
    purpose: 'Flags deemed-export license triggers for HR and export-control teams hiring foreign-national talent on controlled technology.' },
  { displayName: 'ITAR vs EAR Jurisdiction Classifier',
    sector: 'Export Controls & Trade Compliance',
    purpose: 'Classifies products and technology as ITAR versus EAR for export-control engineers and trade-compliance counsel.' },

  // Banking/Compliance
  { displayName: 'SAR Filing Determination Analyzer',
    sector: 'Banking/Compliance',
    purpose: 'Calls suspicious-activity-report filing decisions for BSA and AML officers.' },
  { displayName: 'AML Program Adequacy Analyzer',
    sector: 'Banking/Compliance',
    purpose: 'Assesses anti-money-laundering program adequacy for BSA officers and AML auditors.' },

  // Legal
  { displayName: 'Auto-Renewal Clause Enforceability Reviewer',
    sector: 'Legal',
    purpose: 'Tests automatic-renewal clauses for enforceability for in-house commercial-contracts counsel.' },
  { displayName: 'DPA Adequacy Reviewer',
    sector: 'Legal',
    purpose: 'Reviews data-processing agreements for adequacy for privacy counsel and data protection officers.' },
  { displayName: 'Near-Duplicate Email eDiscovery Defensibility Analyzer',
    sector: 'Legal',
    purpose: 'Defends near-duplicate email production decisions for eDiscovery counsel and review managers.' },

  // Education/Higher-Ed
  { displayName: 'Research-Security Disclosure Defensibility Reviewer',
    sector: 'Education/Higher-Ed',
    purpose: 'Reviews federally-funded research-security disclosures for university research-compliance offices.' },

  // Energy/Utilities (ENV-085 cohort)
  { displayName: 'SBTi Target Validation Reviewer',
    sector: 'Energy/Utilities',
    purpose: 'Reviews corporate net-zero target submissions for science-based-targets readiness, for sustainability officers.' },
  { displayName: 'Scope-3 Category Classification Reviewer',
    sector: 'Energy/Utilities',
    purpose: 'Classifies indirect value-chain emissions into their fifteen categories for sustainability-accounting teams.' },
  { displayName: 'GHG Emissions Accounting Reviewer',
    sector: 'Energy/Utilities',
    purpose: 'Reviews Scope-1 and Scope-2 emissions accounting for corporate sustainability-reporting teams.' },

  // Accounting/Finance (ENV-085 cohort)
  { displayName: 'Financial-Reporting Controls Mapping Reviewer',
    sector: 'Accounting/Finance',
    purpose: 'Maps internal controls to financial-reporting risks for SOX programs and external audit teams.' },
  { displayName: 'Continuous Control Monitoring Reviewer',
    sector: 'Accounting/Finance',
    purpose: 'Flags anomalies in continuous-control-monitoring data for internal-audit and SOX teams.' },

  // Legal (ENV-085 cohort)
  { displayName: 'Sentiment Hot-Document Reviewer',
    sector: 'Legal',
    purpose: 'Surfaces sentiment-driven hot documents in eDiscovery review for litigation teams.' },
];

// Hard guards — fail the build if anything forbidden slips into a
// public field. Belt-and-braces; the spec rules out slugs, URLs,
// methodology, authorities, internal flags.
const FORBIDDEN = [
  /\bhttps?:\/\//i,
  /\b[a-z0-9-]+\.celesium\.com\b/i,
  /\bengineSlug\b/,
  /\bdemoUrl\b/,
  /\bproofHook\b/,
  /\benvelopeId\b/,
  /\bsimulate\b/,
];

function assertSafe(value, label) {
  for (const rx of FORBIDDEN) {
    if (rx.test(value)) {
      throw new Error(`forbidden token in ${label}: ${value} (matched ${rx})`);
    }
  }
}

for (const e of ENGINES) {
  if (!e.displayName || !e.sector || !e.purpose) {
    throw new Error(`engine missing required field: ${JSON.stringify(e)}`);
  }
  if (!CANONICAL_SECTORS.includes(e.sector)) {
    throw new Error(`engine sector not in canonical 14: ${e.sector}`);
  }
  const keys = Object.keys(e).sort().join(',');
  if (keys !== 'displayName,purpose,sector') {
    throw new Error(`engine has extra/missing keys: ${keys}`);
  }
  assertSafe(e.displayName, 'displayName');
  assertSafe(e.purpose, 'purpose');
}

const bySector = {};
for (const s of CANONICAL_SECTORS) bySector[s] = [];
for (const e of ENGINES) bySector[e.sector].push({ displayName: e.displayName, purpose: e.purpose });

const sectors = CANONICAL_SECTORS.map((name) => ({
  name,
  status: bySector[name].length > 0 ? 'populated' : 'in_development',
  engines: bySector[name].map((e) => ({ displayName: e.displayName, purpose: e.purpose })),
}));

const out = {
  version: 1,
  generatedAt: new Date().toISOString().slice(0, 10),
  sectorCount: CANONICAL_SECTORS.length,
  engineCount: ENGINES.length,
  sectors,
};

const target = resolve(repoRoot, 'data', 'library.json');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify(out, null, 2) + '\n', 'utf8');

console.log(`build-library OK sectors=${CANONICAL_SECTORS.length} engines=${ENGINES.length} -> ${target}`);
