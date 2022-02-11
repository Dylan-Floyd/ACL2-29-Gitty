const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');
const fetch = require('cross-fetch');
const axios = require('axios').default;
const { setupServer } = require('msw/node');
const { rest } = require('msw');

const baseURL = `${process.env.API_URL}:${process.env.PORT}`;


let mockOAuthCode;
let mockToken;

const server = setupServer(
  rest.get('https://github.com/login/oauth/authorize', (req, res, ctx) => {
    const clientId = req.url.searchParams.get('client_id');
    const scope = req.url.searchParams.get('scope');
    const redirectURI = req.url.searchParams.get('redirect_uri');

    if(!scope || !clientId || !redirectURI) return res(
      ctx.status(403),
      ctx.json({
        message: 'scope, redirect_uri and client_id must be specified'
      })
    );

    mockOAuthCode = Math.floor(Math.random() * 1000);

    return res(
      ctx.status(301),
      ctx.set('Location', `${process.env.API_URL}:${process.env.PORT}/api/v1/github/login/callback?code=${mockOAuthCode}`)
    );
  }),
  rest.post('https://github.com/login/oauth/access_token', (req, res, ctx) => {
    const clientId = req.url.searchParams.get('client_id');
    const clientSecret = req.url.searchParams.get('client_secret');
    const code = req.url.searchParams.get('code');

    if(!clientSecret || !clientId || !code) return res(
      ctx.status(403),
      ctx.json({
        message: 'client_secret, code and client_id must be specified'
      })
    );

    if(code !== mockOAuthCode) return res(
      ctx.status(403),
      ctx.json({
        message: 'invalid code'
      })
    );

    mockToken = Math.floor(Math.random() * 1000);

    return res(
      ctx.json({ access_token: mockToken })
    );
  }),
  rest.get('https://api.github.com/user', (req, res, ctx) => {
    const auth = req.headers.get('Authorization');
    const token = auth.split('token ')[1];

    if(!token) {
      return res(
        ctx.status(403),
        ctx.json({
          message: 'invalid token'
        })
      );
    }

    return res(
      ctx.json({
        login: 'bob',
        email: '123@abc.com'
      })
    );
  })
);

async function login() {
  const res1 = await fetch(`${baseURL}/api/v1/github/login`, {
    method: 'GET',
    redirect: 'manual'
  });

  //follow redirect to github oauth page, that's mocked with msw
  const res2 = await fetch(res1.headers.get('location'), {
    method: 'GET',
    redirect: 'manual'
  });

  //follow redirect to /github/login/callback
  const res3 = await fetch(res2.headers.get('location'), {
    method: 'GET',
    credentials: 'include',
    redirect: 'manual'
  });
  
  return res3.headers.get('set-cookie');
}

describe('app routes', () => {
  let expressServer;

  beforeAll(async () => {
    await new Promise((resolve, reject) => {
      expressServer = app.listen(process.env.PORT)
        .once('listening', resolve)
        .once('error', reject);
    });
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  beforeEach(() => {
    return setup(pool);
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    pool.end();
    server.close();
    expressServer.close();
  });

  it('should redirect to the github oauth page upon login', async () => {
    const req = await request(app).get('/api/v1/github/login');

    expect(req.header.location).toMatch(
      /https:\/\/github.com\/login\/oauth\/authorize\?client_id=[\w\d]+&redirect_uri=http:\/\/localhost:7890\/api\/v1\/github\/login\/callback&scope=user/i
    );
  });

  //I regret doing this so much
  it('should be able to log in users', async () => {
    const cookie = await login();

    //use axios because it's the only thing that lets you set cookies
    axios.defaults.withCredentials = true;
    const res4 = await axios.get(`${baseURL}/api/v1/github/me`, {
      maxRedirects: 1,
      headers: {
        'Cookie': cookie
      }
    });

    expect(res4.data).toEqual({
      id: expect.any(String),
      username: 'bob',
      iat: expect.any(Number),
      exp: expect.any(Number),
    });
  });

  it('should be able to get posts for logged in users', async () => {
    const cookie = await login();

    //use axios because it's the only thing that lets you set cookies
    axios.defaults.withCredentials = true;
    const res = await axios.get(`${baseURL}/api/v1/posts`, {
      headers: {
        'Cookie': cookie
      }
    });

    const posts = res.data;
    expect(posts).toEqual([{
      id: '1',
      userId: '1',
      text: 'hello'
    }]);
  });

  it('returns a 401 error when getting posts while not logged in', async () => {
    await expect(axios.get(`${baseURL}/api/v1/posts`)).rejects.toEqual(new Error('Request failed with status code 401'));
  });

  it('should be able to post a post', async () => {
    const cookie = await login();

    //use axios because it's the only thing that lets you set cookies
    axios.defaults.withCredentials = true;
    const res = await axios(`${baseURL}/api/v1/posts`, {
      method: 'post', //apparently axios.post doesn't work with cookies
      headers: {
        'Cookie': cookie
      },
      data: {
        text: 'i am bob'
      }
    });

    const post = res.data;
    expect(post).toEqual({
      id: '2',
      userId: '2',
      text: 'i am bob'
    });
  });

  it('returns a 401 error when posting while not logged in', async () => {
    await expect(axios.post(`${baseURL}/api/v1/posts`)).rejects.toEqual(new Error('Request failed with status code 401'));
  });

});
