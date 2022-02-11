const pool = require('../utils/pool.js');

module.exports = class Post {
  id;
  userId;
  text;

  constructor(row) {
    this.id = row.id;
    this.userId = row.user_id;
    this.text = row.text;
  }

  static async insert({ userId, text }) {
    const { rows } = await pool.query(
      `
        INSERT INTO posts (user_id, text)
        VALUES ($1, $2)
        RETURNING *;
      `, [userId, text]
    );

    return new Post(rows[0]);
  }

  static async getAll() {
    const { rows } = await pool.query(
      `
        SELECT * FROM posts;
      `
    );

    console.log(rows);
    return rows.map(row => new Post(row));
  }
};
