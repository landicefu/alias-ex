const { parseTemplate, applyModifier } = require('../src/parser');
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

console.log('All tests passed! ✓');
