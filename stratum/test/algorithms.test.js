const Algorithms = require('../main/algorithms');

////////////////////////////////////////////////////////////////////////////////

describe('Test algorithm functionality', () => {

  // Deterministic
  test('Test implemented scrypt algorithm', () => {
    const start = Buffer.from('000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f');
    const output = Buffer.from('8438235b4ae8f5ad897f9482545fdca3ebeabbc15bffd544cd35d2419976cb8d', 'hex');
    expect(Algorithms.scrypt.hash({}).apply(null, [start]).length).toBe(32);
  });

  // Deterministic
  test('Test implemented sha256d algorithm', () => {
    const start = Buffer.from('000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f');
    const output = Buffer.from('dc83687981432eb309f7c96a51f8bd10cec4a4630f47fdca1c2768d34ba9031a', 'hex');
    expect(Algorithms.sha256d.hash({}).apply(null, [start]).length).toBe(32);
    expect(Algorithms.sha256d.hash({}).apply(null, [start])).toStrictEqual(output);
  });
});
