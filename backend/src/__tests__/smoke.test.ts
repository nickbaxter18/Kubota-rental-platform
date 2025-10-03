test('Jest should work with ts-jest', () => {
  expect(1 + 1).toBe(2);
});

test('TypeScript compilation should work', () => {
  const message: string = 'Hello, Jest!';
  expect(message).toBe('Hello, Jest!');
});

test('ts-jest preset should be loaded correctly', () => {
  const obj = { test: true };
  expect(obj.test).toBe(true);
});
