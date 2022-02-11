const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
//const request = require('supertest');
//const app = require('../lib/app');

describe('posts routes', () => {
  beforeEach(() => {
    return setup(pool);
  });

  afterAll(() => {
    pool.end();
  });

  it('passes', () => {
    expect(true).toEqual(false);
  });

});
