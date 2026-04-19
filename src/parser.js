const path = require('path');

function applyModifier(value, modifier) {
  switch (modifier) {
    case 'b': // basename
      return value.split(/[\\/]/).pop();
    case 'd': { // dirname
      const parts = value.split(/[\\/]/);
      parts.pop();
      return parts.join('/') || '.';
    }
    case 'e': { // extension
      const match = value.match(/\.[^.]+$/);
      return match ? match[0] : '';
    }
    case 'r': // remove extension
      return value.replace(/\.[^.]+$/, '');
    case 'u': // uppercase
      return value.toUpperCase();
    case 'l': // lowercase
      return value.toLowerCase();
    case 'f': // fullpath / absolute path
      return path.resolve(value);
    default:
      return value;
  }
}

function getSpecialVariable(name) {
  const now = new Date();

  switch (name) {
    case 'DATE':
      return now.toISOString().split('T')[0];
    case 'TIME':
      return now.toTimeString().split(' ')[0];
    case 'DATETIME':
      return now.toISOString().replace('T', ' ').split('.')[0];
    case 'RANDOM':
      return Math.floor(Math.random() * 32768).toString();
    default:
      return null;
  }
}

function parseTemplate(template, args, tokens) {
  let result = template;

  // Step 1: Replace user-defined tokens (longer names first to avoid partial matches)
  const tokenNames = Object.keys(tokens).sort((a, b) => b.length - a.length);
  for (const tokenName of tokenNames) {
    const regex = new RegExp(`\\$${escapeRegex(tokenName)}(?!\\w)`, 'g');
    result = result.replace(regex, tokens[tokenName]);
  }

  // Step 2: Replace special variables
  const specialVars = ['DATE', 'TIME', 'DATETIME', 'RANDOM'];
  for (const varName of specialVars) {
    const regex = new RegExp(`\\$${varName}(?!\\w)`, 'g');
    const value = getSpecialVariable(varName);
    if (value !== null) {
      result = result.replace(regex, value);
    }
  }

  // Step 3: Replace environment variables
  result = result.replace(/\$([A-Z_][A-Z0-9_]*)(?!\w)/g, (match, varName) => {
    return process.env[varName] || '';
  });

  // Step 4 & 5: Replace positional arguments with modifiers and simple positional arguments
  // Handle $N:modifier first, then $N
  result = result.replace(/\$(\d+)(:\w)?(?!\w|\d)/g, (match, num, modifierPart) => {
    const argIndex = parseInt(num, 10) - 1;
    const value = args[argIndex] !== undefined ? args[argIndex] : '';

    if (modifierPart) {
      const modifier = modifierPart.substring(1); // Remove the colon
      return applyModifier(value, modifier);
    }
    return value;
  });

  // Step 6: Replace argument slices $@N
  result = result.replace(/\$@(\d+)(?!\w)/g, (match, num) => {
    const startIndex = parseInt(num, 10) - 1;
    return args.slice(startIndex).join(' ');
  });

  // Step 7: Replace all arguments $@ and $*
  result = result.replace(/\$@|\$\*/g, args.join(' '));

  // Step 8: Replace argument count $#
  result = result.replace(/\$#/g, args.length.toString());

  return result;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function expandTokensAndEnv(str, tokens) {
  let result = String(str);

  const tokenNames = Object.keys(tokens || {}).sort((a, b) => b.length - a.length);
  for (const name of tokenNames) {
    const re = new RegExp(`\\$${escapeRegex(name)}(?!\\w)`, 'g');
    result = result.replace(re, tokens[name]);
  }

  const specialVars = ['DATE', 'TIME', 'DATETIME', 'RANDOM'];
  for (const v of specialVars) {
    const re = new RegExp(`\\$${v}(?!\\w)`, 'g');
    const val = getSpecialVariable(v);
    if (val !== null) result = result.replace(re, val);
  }

  result = result.replace(/\$([A-Z_][A-Z0-9_]*)(?!\w)/g, (m, v) => process.env[v] || '');
  return result;
}

function preprocessArgs(args, rules, tokens) {
  if (!rules || rules.length === 0) return args;
  let result = args.slice();
  const toks = tokens || {};

  // Pass 1: fill in defaults for missing/empty positional args.
  for (const rule of rules) {
    if (!rule || rule.type !== 'default') continue;
    const pos = parseInt(rule.position, 10);
    if (!Number.isFinite(pos) || pos < 1) continue;
    const idx = pos - 1;
    if (result[idx] === undefined || result[idx] === '') {
      result[idx] = expandTokensAndEnv(rule.value || '', toks);
    }
  }

  // Pass 2: apply per-arg transformations in rule order.
  result = result.map(arg => {
    if (arg === undefined) return '';
    let out = arg;
    for (const rule of rules) {
      if (!rule) continue;
      const type = rule.type || 'replace';
      if (type === 'replace') {
        if (!rule.match) continue;
        const rep = expandTokensAndEnv(rule.replace || '', toks);
        out = out.split(rule.match).join(rep);
      } else if (type === 'regex') {
        if (!rule.pattern) continue;
        let re;
        try {
          re = new RegExp(rule.pattern, 'g');
        } catch (_) {
          continue;
        }
        const rep = expandTokensAndEnv(rule.replacement || '', toks);
        out = out.replace(re, rep);
      } else if (type === 'map') {
        if (rule.key === undefined) continue;
        if (out === rule.key) {
          out = expandTokensAndEnv(rule.value || '', toks);
        }
      }
      // 'default' handled in pass 1
    }
    return out;
  });

  return result;
}

module.exports = {
  parseTemplate,
  applyModifier,
  preprocessArgs
};
