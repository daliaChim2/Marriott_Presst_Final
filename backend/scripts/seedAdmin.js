// scripts/seedAdmin.js
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");
require("dotenv").config();

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const hashedPassword = await bcrypt.hash("Marr#29", 10);

  await connection.execute(
    `INSERT INTO users (username, password, role) VALUES (?, ?, ?) 
    ON DUPLICATE KEY UPDATE password=VALUES(password), role=VALUES(role)`,
    ["admin_D", hashedPassword, "admin"]
  );

  console.log(" Usuario admin_D insertado con éxito.");
  await connection.end();
}

seed();

// node scripts/seedAdmin.js

