const fetch = require('cross-fetch');

module.exports = {
  exchangeCodeForToken: async (code) => {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });

    const { access_token } = await res.json();
    return access_token;
  },
  
  getGithubProfile: async (token) => {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/json',
        Authorization: `token ${token}`,
      },
    });

    const profile = await res.json();
    return profile;
  }
};
