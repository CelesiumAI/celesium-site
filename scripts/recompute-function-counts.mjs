#!/usr/bin/env node
// Recompute the celesium.ai role-finder per-function tile counts from the
// storefront's catalog.json, mirroring src/lib/functions.ts.
import { readFileSync } from 'node:fs';

const CATALOG_PATH =
  process.argv[2] || 'C:/projects/celesium-engine-demo/public/catalog.json';

const FUNCTIONS = [
  {
    slug: 'compliance-risk',
    name: 'Compliance & Risk',
    rx: /(compliance officer|risk officer|bsa|aml|sanctions|fair lending|fair housing|tprm|third-?party risk|vendor risk|corporate compliance|regulatory compliance|insurance.*compliance|payments compliance|mortgage compliance|cra\b|resilience|continuity|operational risk)/i,
  },
  {
    slug: 'legal-counsel',
    name: 'Legal Counsel',
    rx: /(counsel|attorney|partner|litigation|discovery|edisco|patent|trademark|intellectual property|\bip\b|contract.*counsel|disputes|case strategist|hold counsel|defense|prosecution|legal officer|chief legal)/i,
  },
  {
    slug: 'hr-people',
    name: 'HR & People',
    rx: /(\bhr\b|human resources|employment|labor|workforce|chief people|benefits administrator|erisa|eeo\b|vp hr)/i,
  },
  {
    slug: 'finance-accounting',
    name: 'Finance & Accounting',
    rx: /(controller|treasury|tax\b|technical accounting|\bcfo\b|revenue accounting|gaap|fasb|sec reporting|financial reporting|derivatives accounting)/i,
  },
  {
    slug: 'internal-audit',
    name: 'Internal Audit',
    rx: /(audit (?:director|manager|executive|partner)|cae\b|internal audit|chief audit|sox\b.*audit|sox.*controls|sox.*pmo|sox.*compliance|it audit|internal controls|controls manager)/i,
  },
  {
    slug: 'regulatory-affairs-quality',
    name: 'Regulatory Affairs & Quality',
    rx: /(regulatory affairs|\bra\b manager|\bqa\b|quality (?:assurance|director|manager|officer|lead)|stability|document control|laboratory director|\bqc\b)/i,
  },
  {
    slug: 'clinical-drug-safety',
    name: 'Clinical & Drug Safety',
    rx: /(pharmacovig|drug safety|clinical pharmac|clinical research|physician (?:advisor|reviewer)|utilization (?:management|review)|\bcdi\b|him\b|medical director|nursing|pharmacist|qppv|appeals.*clinical|hospitalist|clinical documentation)/i,
  },
  {
    slug: 'revenue-integrity',
    name: 'Revenue Integrity',
    rx: /(revenue integrity|revenue cycle|appeals (?:specialist|director|coordinator|officer|nurse|counsel)|claims compliance|chargeback|reimbursement|hospital appeals)/i,
  },
  {
    slug: 'trade-export',
    name: 'Trade & Export',
    rx: /(export compliance|empowered official|export control|itar|trade compliance|trade counsel|sanctions compliance|customs|research[- ]?security|trade.*compliance)/i,
  },
  {
    slug: 'procurement-contracts',
    name: 'Procurement & Contracts',
    rx: /(contracting officer|contracts officer|contracts counsel|procurement (?:counsel|officer)|source selection|small business specialist|competition advocate|protest counsel|government contracts|acquisition)/i,
  },
  {
    slug: 'security-safety',
    name: 'Security & Safety',
    rx: /(security officer|\bfso\b|insider threat|physical security|site safety|safety officer|safety director|ehs\b|environmental health|construction safety|prequalification|surety|bank security|\bicam\b)/i,
  },
  {
    slug: 'esg-sustainability',
    name: 'ESG & Sustainability',
    rx: /(esg\b|sustainability|net-?zero|climate|ghg\b|scope[- ][123]|sbti|corporate disclosure)/i,
  },
  {
    slug: 'underwriting-claims',
    name: 'Underwriting & Claims',
    rx: /(underwrit|claims adjuster|cat portfolio|case management|disputes.*chargeback|workers'? comp.*claims|tpa medical|nurse|payer)/i,
  },
];

const raw = readFileSync(CATALOG_PATH, 'utf-8');
const cat = JSON.parse(raw);
const sales = cat.engines.filter((e) => e.salesStatus === 'sales-ready');
console.log('sales-ready total:', sales.length);

const counts = Object.fromEntries(FUNCTIONS.map((f) => [f.slug, 0]));
for (const e of sales) {
  const txt = [e.buyerRole, e.sector, e.displayName, e.tagline].filter(Boolean).join(' | ');
  for (const f of FUNCTIONS) {
    if (f.rx.test(txt)) counts[f.slug]++;
  }
}

for (const f of FUNCTIONS) {
  console.log(`${f.slug.padEnd(30)} ${f.name.padEnd(32)} ${counts[f.slug]}`);
}
