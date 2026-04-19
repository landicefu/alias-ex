const { parseTemplate, applyModifier, preprocessArgs } = require('../src/parser');
const assert = require('assert');

console.log('Running tests...\n');

// Test 1: Basic positional arguments
console.log('Test 1: Basic positional arguments');
const result1 = parseTemplate('echo $1 $2', ['hello', 'world'], {});
assert.strictEqual(result1, 'echo hello world', 'Basic positional args failed');
console.log('  ✓ Passed\n');

// Test 2: Tokens
console.log('Test 2: User-defined tokens');
const result2 = parseTemplate('ssh $user@$server', [], { user: 'admin', server: '192.168.1.100' });
assert.strictEqual(result2, 'ssh admin@192.168.1.100', 'Token substitution failed');
console.log('  ✓ Passed\n');

// Test 3: Special variables
console.log('Test 3: Special variables');
const result3 = parseTemplate('echo $DATE', [], {});
assert.match(result3, /^echo \d{4}-\d{2}-\d{2}$/, 'DATE variable failed');
console.log('  ✓ Passed\n');

// Test 4: Argument count
console.log('Test 4: Argument count');
const result4 = parseTemplate('echo $#', ['a', 'b', 'c'], {});
assert.strictEqual(result4, 'echo 3', 'Argument count failed');
console.log('  ✓ Passed\n');

// Test 5: All arguments
console.log('Test 5: All arguments');
const result5 = parseTemplate('echo $@', ['a', 'b', 'c'], {});
assert.strictEqual(result5, 'echo a b c', 'All arguments failed');
console.log('  ✓ Passed\n');

// Test 6: Modifiers
console.log('Test 6: Argument modifiers');
const result6 = parseTemplate('echo $1:b', ['/path/to/file.txt'], {});
assert.strictEqual(result6, 'echo file.txt', 'Basename modifier failed');
console.log('  ✓ Passed\n');

// Test 7: Argument slice
console.log('Test 7: Argument slice');
const result7 = parseTemplate('echo $@2', ['a', 'b', 'c'], {});
assert.strictEqual(result7, 'echo b c', 'Argument slice failed');
console.log('  ✓ Passed\n');

// Test 8: Environment variables
console.log('Test 8: Environment variables');
process.env.TEST_VAR = 'test_value';
const result8 = parseTemplate('echo $TEST_VAR', [], {});
assert.strictEqual(result8, 'echo test_value', 'Environment variable failed');
console.log('  ✓ Passed\n');

// Test applyModifier directly
console.log('Test 9: Modifiers');
assert.strictEqual(applyModifier('/path/to/file.txt', 'b'), 'file.txt', 'basename failed');
assert.strictEqual(applyModifier('/path/to/file.txt', 'd'), '/path/to', 'dirname failed');
assert.strictEqual(applyModifier('/path/to/file.txt', 'e'), '.txt', 'extension failed');
assert.strictEqual(applyModifier('/path/to/file.txt', 'r'), '/path/to/file', 'remove ext failed');
assert.strictEqual(applyModifier('Hello', 'u'), 'HELLO', 'uppercase failed');
assert.strictEqual(applyModifier('Hello', 'l'), 'hello', 'lowercase failed');
console.log('  ✓ Passed\n');

// Test 10: Preprocess args — literal match with token expansion in replacement
console.log('Test 10: Preprocess args with token in replacement');
const processed10 = preprocessArgs(
  ['./folder/a_file.txt', 'remote:~/'],
  [{ match: 'remote', replace: 'ubuntu@$ORACLE_VPS_IP' }],
  { ORACLE_VPS_IP: '150.230.200.203' }
);
assert.deepStrictEqual(
  processed10,
  ['./folder/a_file.txt', 'ubuntu@150.230.200.203:~/'],
  'Preprocess args failed'
);
console.log('  ✓ Passed\n');

// Test 11: Preprocess skipped when no rules
console.log('Test 11: Preprocess args — no rules is a no-op');
const processed11 = preprocessArgs(['a', 'b'], undefined, {});
assert.deepStrictEqual(processed11, ['a', 'b'], 'Empty preprocess failed');
console.log('  ✓ Passed\n');

// Test 12: Preprocess rules applied in order
console.log('Test 12: Preprocess rules applied in order');
const processed12 = preprocessArgs(
  ['foo bar'],
  [
    { type: 'replace', match: 'foo', replace: 'hello' },
    { type: 'replace', match: 'bar', replace: 'world' }
  ],
  {}
);
assert.deepStrictEqual(processed12, ['hello world'], 'Rule ordering failed');
console.log('  ✓ Passed\n');

// Test 13: Regex rule with capture groups and token expansion
console.log('Test 13: Regex preprocess with capture groups and tokens');
const processed13 = preprocessArgs(
  ['remote:~/docs'],
  [{ type: 'regex', pattern: '^(\\w+):(.*)', replacement: '$USER_TOK@$host:$2' }],
  { USER_TOK: 'ubuntu', host: '10.0.0.1' }
);
assert.deepStrictEqual(processed13, ['ubuntu@10.0.0.1:~/docs'], 'Regex rule failed');
console.log('  ✓ Passed\n');

// Test 14: Map rule — whole-arg alias, leaves non-matches alone
console.log('Test 14: Map preprocess matches whole arg only');
const processed14 = preprocessArgs(
  ['mac', 'mac-mini', 'pi'],
  [
    { type: 'map', key: 'mac', value: '192.168.1.100' },
    { type: 'map', key: 'pi', value: '192.168.1.50' }
  ],
  {}
);
assert.deepStrictEqual(
  processed14,
  ['192.168.1.100', 'mac-mini', '192.168.1.50'],
  'Map rule failed'
);
console.log('  ✓ Passed\n');

// Test 15: Default rule fills missing positional arg, expands tokens
console.log('Test 15: Default preprocess fills missing positional arg');
const processed15 = preprocessArgs(
  ['./dist'],
  [{ type: 'default', position: 2, value: '$env-prod' }],
  { 'env-prod': 'production' }
);
assert.deepStrictEqual(processed15, ['./dist', 'production'], 'Default rule failed');
console.log('  ✓ Passed\n');

// Test 16: Default does not override a provided arg
console.log('Test 16: Default does not override provided arg');
const processed16 = preprocessArgs(
  ['./dist', 'staging'],
  [{ type: 'default', position: 2, value: 'production' }],
  {}
);
assert.deepStrictEqual(processed16, ['./dist', 'staging'], 'Default override failed');
console.log('  ✓ Passed\n');

// Test 17: Backwards compatibility — rule with no type defaults to replace
console.log('Test 17: Rule without type defaults to replace');
const processed17 = preprocessArgs(
  ['remote:~/'],
  [{ match: 'remote', replace: 'ubuntu@host' }],
  {}
);
assert.deepStrictEqual(processed17, ['ubuntu@host:~/'], 'Typeless rule failed');
console.log('  ✓ Passed\n');

console.log('All tests passed! ✓');
