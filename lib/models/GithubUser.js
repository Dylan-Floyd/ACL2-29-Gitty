const pool = require('../utils/pool.js');

module.exports = class GithubUser {
  id;
  username;

  constructor(row) {
    this.id = row.id;
    this.username = row.username;
  }

  static async insert({ username }) {
    const { rows } = await pool.query(`
      INSERT INTO users (username) VALUES ($1) RETURNING *;
    `, [username]);

    return new GithubUser(rows[0]);
  }

  static async findByUsername(username) {
    const { rows } = await pool.query(`
      SELECT * from users WHERE username=$1;
    `, [username]);

    if(!rows[0]) return null;

    return new GithubUser(rows[0]);
  }
};
