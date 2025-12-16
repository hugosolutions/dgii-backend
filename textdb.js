const db = require("./db");

async function probarConexion() {
    try {
        const [rows] = await db.query("SELECT * from clientes");
        console.log("✅ CONECTADO A MYSQL CORRECTAMENTE");
        process.exit(0);
    } catch (error) {
        console.error("❌ ERROR DE CONEXIÓN:", error.message);
        process.exit(1);
    }
}

probarConexion();
