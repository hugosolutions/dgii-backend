const mysql = require("mysql2/promise");

// ESTA ES LA CONEXIÓN A TU BASE DE DATOS
const pool = mysql.createPool({
    host: "mysql-14beaeb8-hugofernando809-0f75.a.aivencloud.com",
    user: "avnadmin",
    password: "AVNS_ubF1LMX6xD_0cCFmfQq",
    database: "defaultdb",
    port: 13839,
    waitForConnections: true,
    connectionLimit: 10,
});

module.exports = pool;
