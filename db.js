const mysql = require("mysql2/promise");

// ESTA ES LA CONEXIÓN A TU BASE DE DATOS
const mysql = require("mysql2");

// pool = conexión reutilizable (lo correcto)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
