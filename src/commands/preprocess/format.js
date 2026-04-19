function formatRule(rule) {
  if (!rule) return '(invalid rule)';
  const type = rule.type || 'replace';
  switch (type) {
    case 'replace':
      return `replace: "${rule.match}" -> "${rule.replace}"`;
    case 'regex':
      return `regex:   /${rule.pattern}/ -> "${rule.replacement}"`;
    case 'map':
      return `map:     "${rule.key}" => "${rule.value}"`;
    case 'default':
      return `default: $${rule.position} = "${rule.value}"`;
    default:
      return `${type}: ${JSON.stringify(rule)}`;
  }
}

module.exports = { formatRule };
