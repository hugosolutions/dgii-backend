const db = require("./db");

async function guardarECF({ rnc, tipo, ncf, xml }) {
    const sql = `
    INSERT INTO ecf_recibidos
    (rnc_emisor, tipo_ecf, e_ncf, xml)
    VALUES (?, ?, ?, ?)
  `;

    await db.execute(sql, [
        rnc,
        tipo,
        ncf,
        xml
    ]);
}

module.exports = { guardarECF };
