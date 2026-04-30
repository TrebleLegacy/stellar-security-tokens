#!/usr/bin/env node
/**
 * generate-service-docs.mjs
 *
 * AST-based documentation generator for all 31 backend services.
 * Uses acorn (already in backend/node_modules) to parse every service file
 * and extract ground-truth method signatures directly from the syntax tree.
 *
 * ZERO LLM interpretation. ZERO memory. ZERO drift.
 * If a method isn't in the file, it won't appear in the docs.
 *
 * Usage:
 *   node scripts/generate-service-docs.mjs           → writes 09_service_internals.md
 *   node scripts/generate-service-docs.mjs --stats   → prints method count table only
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

// acorn is already installed in backend/node_modules — no extra deps needed
const { parse } = require('../backend/node_modules/acorn');

const SERVICES_DIR = join(__dirname, '../backend/src/services');
const OUTPUT_FILE  = join(__dirname, '../docs/Project_Bible/09_service_internals.md');
const STATS_ONLY   = process.argv.includes('--stats');

// ─── Ordered service list (matches Project Bible numbering) ───────────────────
const SERVICE_FILES = [
  'KeyManager.js',
  'config.service.js',
  'transactionManager.service.js',
  'alert.service.js',
  'alertRouter.service.js',
  'backup.service.js',
  'toml.service.js',
  'sorobanMetrics.service.js',
  'notification.service.js',
  'maintenance.service.js',
  'walletMonitor.service.js',
  'yieldPaymentReconciler.js',
  'ipfs.service.js',
  'depositRelay.service.js',
  'sorobanEventIndexer.js',
  'sorobanReconciler.js',
  'webauthn.service.js',
  'investmentMetrics.service.js',
  'collateralDistribution.service.js',
  'paymentMonitor.service.js',
  'paymentReminder.service.js',
  'payment.service.js',
  'offer.service.js',
  'yieldDistributor.service.js',
  'companyPayment.service.js',
  'multiSigTransaction.service.js',
  'passkeyWallet.service.js',
  'email.service.js',
  'stellar.service.js',
  'sorobanSale.service.js',
  'sorobanSettlement.service.js',
];

// ─── Param reconstruction ─────────────────────────────────────────────────────

function reconstructDefault(node) {
  if (!node) return '?';
  switch (node.type) {
    case 'Literal':           return JSON.stringify(node.value);
    case 'Identifier':        return node.name;
    case 'UnaryExpression':   return `${node.operator}${reconstructDefault(node.argument)}`;
    case 'ArrayExpression':   return '[]';
    case 'ObjectExpression':  return '{}';
    case 'TemplateLiteral':   return '`...`';
    case 'NullLiteral':       return 'null';
    case 'MemberExpression':  return `${reconstructDefault(node.object)}.${node.property?.name ?? '?'}`;
    case 'CallExpression':    return `${reconstructDefault(node.callee)}(...)`;
    case 'NewExpression':     return `new ${reconstructDefault(node.callee)}(...)`;
    case 'BinaryExpression':  return `${reconstructDefault(node.left)} ${node.operator} ${reconstructDefault(node.right)}`;
    default:                  return '…';
  }
}

function reconstructParam(node) {
  if (!node) return '?';
  switch (node.type) {
    case 'Identifier':
      return node.name;

    case 'AssignmentPattern':
      return `${reconstructParam(node.left)} = ${reconstructDefault(node.right)}`;

    case 'ObjectPattern': {
      const props = node.properties.map(p => {
        if (p.type === 'RestElement') return `...${reconstructParam(p.argument)}`;
        const key = p.key?.name ?? p.key?.value ?? '?';
        return p.shorthand ? key : `${key}: ${reconstructParam(p.value)}`;
      });
      return `{ ${props.join(', ')} }`;
    }

    case 'RestElement':
      return `...${reconstructParam(node.argument)}`;

    case 'ArrayPattern': {
      const elems = node.elements.map(e => e ? reconstructParam(e) : '');
      return `[${elems.join(', ')}]`;
    }

    default:
      return '…';
  }
}

// ─── JSDoc extraction ─────────────────────────────────────────────────────────

/**
 * Find the JSDoc block comment immediately preceding a node.
 * Returns the first non-empty, non-@tag line (the summary sentence).
 */
function findLeadingJSDoc(comments, nodeStart) {
  // Walk backwards through comments to find the closest block comment
  for (let i = comments.length - 1; i >= 0; i--) {
    const c = comments[i];
    if (c.type !== 'Block' || !c.value.startsWith('*')) continue;
    if (c.end > nodeStart) continue;
    // Must be within 400 chars (accounts for blank lines, decorators)
    if (nodeStart - c.end > 400) break;

    const lines = c.value
      .split('\n')
      .map(l => l.replace(/^\s*\*\s?/, '').trim())
      .filter(l => l.length > 0 && !l.startsWith('@'));

    return lines[0] ?? null;
  }
  return null;
}

// ─── Method extraction from class body ───────────────────────────────────────

function extractClassMembers(classBody, comments) {
  const members = [];

  for (const member of classBody.body) {
    // Static property fields (e.g., `static TTL_THRESHOLD = 50000`)
    if (member.type === 'PropertyDefinition') {
      const isFunc = member.value?.type === 'FunctionExpression'
                  || member.value?.type === 'ArrowFunctionExpression';
      const isPrivate = member.key.type === 'PrivateIdentifier';
      const name = isPrivate ? `#${member.key.name}` : (member.key.name ?? member.key.value ?? '?');

      if (!isFunc) {
        members.push({
          kind: 'field',
          name,
          isStatic: member.static ?? false,
          isPrivate,
          value: reconstructDefault(member.value),
          line: member.loc.start.line,
          jsdoc: null,
        });
      } else {
        // Arrow function property — treat as method
        const funcNode = member.value;
        members.push({
          kind: 'method',
          name,
          isStatic: member.static ?? false,
          isPrivate,
          isAsync: funcNode.async ?? false,
          params: (funcNode.params ?? []).map(reconstructParam),
          line: member.loc.start.line,
          jsdoc: findLeadingJSDoc(comments, member.start),
        });
      }
      continue;
    }

    // Regular methods
    if (member.type === 'MethodDefinition') {
      const isPrivate = member.key.type === 'PrivateIdentifier';
      const name = isPrivate ? `#${member.key.name}` : (member.key.name ?? member.key.value ?? '?');
      const funcNode = member.value;

      members.push({
        kind: member.kind === 'constructor' ? 'constructor' : 'method',
        name,
        isStatic: member.static ?? false,
        isPrivate,
        isAsync: funcNode?.async ?? false,
        params: (funcNode?.params ?? []).map(reconstructParam),
        line: member.loc.start.line,
        jsdoc: findLeadingJSDoc(comments, member.start),
      });
    }
  }

  return members;
}

// ─── Method extraction from plain object export ───────────────────────────────

function extractObjectMembers(objExpr, comments) {
  const members = [];
  for (const prop of objExpr.properties) {
    if (prop.type === 'SpreadElement') continue;
    const name = prop.key?.name ?? prop.key?.value ?? '?';
    const val  = prop.value;
    if (!val) continue;

    const isFunc = val.type === 'FunctionExpression'
                || val.type === 'ArrowFunctionExpression';
    if (!isFunc) continue;

    members.push({
      kind: 'method',
      name,
      isStatic: false,
      isPrivate: false,
      isAsync: val.async ?? false,
      params: (val.params ?? []).map(reconstructParam),
      line: prop.loc.start.line,
      jsdoc: findLeadingJSDoc(comments, prop.start),
    });
  }
  return members;
}

// ─── File parser ──────────────────────────────────────────────────────────────

function parseFile(filename) {
  const filepath = join(SERVICES_DIR, filename);
  let source;
  try {
    source = readFileSync(filepath, 'utf-8');
  } catch (e) {
    return { filename, error: `File not found: ${e.message}`, lines: 0, exports: [], standaloneExports: [] };
  }

  const lineCount = source.split('\n').length;
  const comments  = [];
  let ast;

  try {
    ast = parse(source, {
      ecmaVersion: 2022,
      sourceType:  'module',
      locations:   true,
      onComment(isBlock, text, start, end) {
        comments.push({ type: isBlock ? 'Block' : 'Line', value: text, start, end });
      },
    });
  } catch (err) {
    return { filename, error: `Parse error: ${err.message}`, lines: lineCount, exports: [], standaloneExports: [] };
  }

  // First pass: collect all class declarations (exported or not)
  const classMap = new Map(); // className → { members[] }
  // Also collect module-level function declarations (BackupService/WalletMonitor pattern)
  const moduleFunctions = new Map(); // fnName → { isAsync, params, line, jsdoc }

  for (const node of ast.body) {
    let classNode = null;
    if (node.type === 'ClassDeclaration') {
      classNode = node;
    } else if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'ClassDeclaration') {
      classNode = node.declaration;
    } else if (node.type === 'ExportDefaultDeclaration' && node.declaration?.type === 'ClassDeclaration') {
      classNode = node.declaration;
    }
    if (classNode) {
      const name = classNode.id?.name ?? 'Anonymous';
      classMap.set(name, {
        name,
        members: extractClassMembers(classNode.body, comments),
      });
    }

    // Collect module-scope function declarations
    if (node.type === 'FunctionDeclaration' && node.id) {
      moduleFunctions.set(node.id.name, {
        name: node.id.name,
        isAsync: node.async ?? false,
        params: (node.params ?? []).map(reconstructParam),
        line: node.loc.start.line,
        jsdoc: findLeadingJSDoc(comments, node.start),
      });
    }
    // async function foo() {} (same as above, just explicit)
    if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'FunctionDeclaration') {
      const fn = node.declaration;
      if (fn.id) {
        moduleFunctions.set(fn.id.name, {
          name: fn.id.name,
          isAsync: fn.async ?? false,
          params: (fn.params ?? []).map(reconstructParam),
          line: fn.loc.start.line,
          jsdoc: findLeadingJSDoc(comments, node.start),
        });
      }
    }
  }

  const exports         = [];
  const standaloneExports = [];

  // Second pass: resolve what is exported
  for (const node of ast.body) {
    // export class Foo {}
    if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'ClassDeclaration') {
      const name = node.declaration.id?.name ?? 'Anonymous';
      exports.push({
        exportName: name,
        pattern: 'export class',
        className: name,
        members: classMap.get(name)?.members ?? [],
      });
      continue;
    }

    // export default class Foo {}
    if (node.type === 'ExportDefaultDeclaration' && node.declaration?.type === 'ClassDeclaration') {
      const name = node.declaration.id?.name ?? 'Default';
      exports.push({
        exportName: name,
        pattern: 'export default class',
        className: name,
        members: classMap.get(name)?.members ?? [],
      });
      continue;
    }

    // export const X = ... (various forms)
    if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'VariableDeclaration') {
      for (const decl of node.declaration.declarations) {
        const exportName = decl.id?.name ?? '?';
        const init = decl.init;
        if (!init) continue;

        if (init.type === 'ObjectExpression') {
          // Plain object export: may be inline functions OR shorthand refs to module-level functions
          // e.g. export const BackupService = { snapshotUserCreation, fullDatabaseDump }
          const inlineMembers = extractObjectMembers(init, comments);
          const resolvedMembers = [...inlineMembers];

          for (const prop of init.properties) {
            if (prop.type === 'SpreadElement') continue;
            const propName = prop.key?.name ?? prop.key?.value ?? '?';
            const val = prop.value;
            // Shorthand: { fn } where val is Identifier pointing to a module function
            if (val?.type === 'Identifier' && moduleFunctions.has(val.name)) {
              const fn = moduleFunctions.get(val.name);
              // Only add if not already captured as an inline function
              if (!resolvedMembers.find(m => m.name === propName)) {
                resolvedMembers.push({
                  kind: 'method',
                  name: propName,
                  isStatic: false,
                  isPrivate: false,
                  isAsync: fn.isAsync,
                  params: fn.params,
                  line: fn.line,
                  jsdoc: fn.jsdoc,
                });
              }
            }
          }

          exports.push({
            exportName,
            pattern: 'export const = { }',
            className: null,
            members: resolvedMembers,
          });

        } else if (init.type === 'NewExpression') {
          // export const ipfsService = new IpfsService()
          const className = init.callee?.name ?? '?';
          const info = classMap.get(className);
          exports.push({
            exportName,
            pattern: `export const = new ${className}()`,
            className,
            members: info?.members ?? [],
          });

        } else if (init.type === 'ClassExpression') {
          // export const Foo = class { }
          const members = extractClassMembers(init.body, comments);
          exports.push({
            exportName,
            pattern: 'export const = class',
            className: init.id?.name ?? exportName,
            members,
          });

        } else if (init.type === 'CallExpression') {
          // export const keyManager = new KeyManager() wrapped in call, or similar
          // Try to resolve through class map
          const callee = init.callee;
          if (callee?.type === 'NewExpression') {
            const className = callee.callee?.name ?? '?';
            const info = classMap.get(className);
            exports.push({
              exportName,
              pattern: `export const = new ${className}()`,
              className,
              members: info?.members ?? [],
            });
          }
        }
      }
      continue;
    }

    // export function foo() {}
    if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'FunctionDeclaration') {
      const fn = node.declaration;
      standaloneExports.push({
        name:    fn.id?.name ?? '?',
        isAsync: fn.async ?? false,
        params:  (fn.params ?? []).map(reconstructParam),
        jsdoc:   findLeadingJSDoc(comments, node.start),
        line:    fn.loc.start.line,
      });
    }
  }

  // If no exports resolved but classes exist, include them (non-exported internal classes)
  if (exports.length === 0 && classMap.size > 0) {
    for (const [name, info] of classMap) {
      exports.push({
        exportName: name,
        pattern: 'class (not directly exported)',
        className: name,
        members: info.members,
      });
    }
  }

  return { filename, lines: lineCount, exports, standaloneExports };
}

// ─── Markdown rendering ───────────────────────────────────────────────────────

function renderSig(m) {
  const parts = [];
  if (m.isStatic) parts.push('static');
  if (m.isAsync)  parts.push('async');
  const prefix = parts.join(' ');
  const params = (m.params ?? []).join(', ');
  const sig = `${m.name}(${params})`;
  return prefix ? `${prefix} ${sig}` : sig;
}

function renderSection(index, data) {
  const lines = [];
  const num = index + 1;

  if (data.error) {
    lines.push(`## ${num}. ${data.filename}`);
    lines.push('');
    lines.push(`> ⚠️ ${data.error}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    return lines.join('\n');
  }

  // Heading: prefer class name over export name
  const primary = data.exports[0];
  const displayName = primary?.className ?? primary?.exportName ?? data.filename.replace('.js', '');

  lines.push(`## ${num}. ${displayName}`);
  lines.push('');
  lines.push(`**File:** \`backend/src/services/${data.filename}\` · **${data.lines} lines**`);

  if (primary) {
    lines.push(`**Export pattern:** \`${primary.pattern}\``);
  }
  lines.push('');

  for (const exp of data.exports) {
    // If multiple exports in file, show sub-heading
    if (data.exports.length > 1) {
      lines.push(`### ${exp.exportName}`);
      lines.push('');
    }

    const fields   = exp.members.filter(m => m.kind === 'field');
    const ctors    = exp.members.filter(m => m.kind === 'constructor');
    const pubMeth  = exp.members.filter(m => m.kind === 'method' && !m.isPrivate);
    const privMeth = exp.members.filter(m => m.kind === 'method' && m.isPrivate);

    // Static fields / constants
    if (fields.length > 0) {
      lines.push('**Constants & Static Fields**');
      lines.push('');
      lines.push('| Line | Name | Value |');
      lines.push('|------|------|-------|');
      for (const f of fields) {
        lines.push(`| ${f.line} | \`${f.name}\` | \`${f.value}\` |`);
      }
      lines.push('');
    }

    // Constructor
    if (ctors.length > 0) {
      lines.push('**Constructor**');
      lines.push('');
      for (const c of ctors) {
        const params = (c.params ?? []).join(', ');
        lines.push(`- \`constructor(${params})\` _(line ${c.line})_${c.jsdoc ? ' — ' + c.jsdoc : ''}`);
      }
      lines.push('');
    }

    // Public methods
    if (pubMeth.length > 0) {
      lines.push('**Methods**');
      lines.push('');
      lines.push('| Line | Signature | Async |');
      lines.push('|------|-----------|-------|');
      for (const m of pubMeth) {
        lines.push(`| ${m.line} | \`${renderSig(m)}\` | ${m.isAsync ? '✓' : '–'} |`);
      }
      lines.push('');
    }

    // Private methods
    if (privMeth.length > 0) {
      lines.push('**Private Methods**');
      lines.push('');
      lines.push('| Line | Signature | Async |');
      lines.push('|------|-----------|-------|');
      for (const m of privMeth) {
        lines.push(`| ${m.line} | \`${renderSig(m)}\` | ${m.isAsync ? '✓' : '–'} |`);
      }
      lines.push('');
    }

    if (exp.members.length === 0) {
      lines.push('_No members extracted._');
      lines.push('');
    }

    // JSDoc summaries
    const withDoc = exp.members.filter(m => m.jsdoc);
    if (withDoc.length > 0) {
      lines.push('**JSDoc Descriptions**');
      lines.push('');
      for (const m of withDoc) {
        lines.push(`- **\`${m.name}\`** — ${m.jsdoc}`);
      }
      lines.push('');
    }
  }

  // Standalone exported functions
  if (data.standaloneExports.length > 0) {
    lines.push('**Exported Functions**');
    lines.push('');
    for (const f of data.standaloneExports) {
      const async = f.isAsync ? 'async ' : '';
      const desc  = f.jsdoc ? ` — ${f.jsdoc}` : '';
      lines.push(`- \`${async}${f.name}(${f.params.join(', ')})\` _(line ${f.line})_${desc}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log(`Parsing ${SERVICE_FILES.length} service files...`);
  const allData = SERVICE_FILES.map(f => parseFile(f));

  // Stats mode
  if (STATS_ONLY) {
    let total = 0;
    console.log('\n| # | File | Lines | Methods | Fields | Errors |');
    console.log('|---|------|-------|---------|--------|--------|');
    allData.forEach((d, i) => {
      const methods = d.exports.reduce((s, e) => s + e.members.filter(m => m.kind === 'method').length, 0);
      const fields  = d.exports.reduce((s, e) => s + e.members.filter(m => m.kind === 'field').length, 0);
      const err     = d.error ? '⚠️' : '–';
      total += methods;
      console.log(`| ${i+1} | ${d.filename} | ${d.lines} | ${methods} | ${fields} | ${err} |`);
    });
    console.log(`\nTotal methods: ${total}`);
    return;
  }

  // Generate doc
  const ts = new Date().toISOString();
  const totalMethods = allData.reduce((s, d) =>
    s + d.exports.reduce((ss, e) => ss + e.members.filter(m => m.kind === 'method').length, 0), 0);
  const totalFields = allData.reduce((s, d) =>
    s + d.exports.reduce((ss, e) => ss + e.members.filter(m => m.kind === 'field').length, 0), 0);

  const header = [
    '# 09 — Service Internals',
    '',
    '> **⚠️ AUTO-GENERATED — DO NOT EDIT MANUALLY**  ',
    `> Generated: \`${ts}\`  `,
    '> Source: \`backend/src/services/\` (31 files)  ',
    '> Regenerate: \`npm run docs:services\`',
    '',
    `**${SERVICE_FILES.length} services · ${totalMethods} methods · ${totalFields} static fields**`,
    '',
    '---',
    '',
  ].join('\n');

  const body    = allData.map((d, i) => renderSection(i, d)).join('');
  const output  = header + body;
  const outLines = output.split('\n').length;

  writeFileSync(OUTPUT_FILE, output, 'utf-8');

  console.log(`\n✅  Written: ${OUTPUT_FILE}`);
  console.log(`    Services : ${SERVICE_FILES.length}`);
  console.log(`    Methods  : ${totalMethods}`);
  console.log(`    Fields   : ${totalFields}`);
  console.log(`    Doc lines: ${outLines}`);
}

main();
