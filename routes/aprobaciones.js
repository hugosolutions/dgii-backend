const express = require("express");
const router = express.Router();
const pool = require("../db");

// ----------------------------------
// RECEPCIÓN APROBACIÓN COMERCIAL
// ----------------------------------
router.post("/fe/aprobacioncomercial/api/ecf", async (req, res) => {
    try {
        const {
            Version,
            RNCEmisor,
            eNCF,
            FechaEmision,
            MontoTotal,
            RNCComprador,
            Estado,
            DetalleMotivoRechazo,
            FechaHoraAprobacionComercial
        } = req.body;

        // 👇 LOG CLAVE PARA DGII
        console.log("📩 Aprobación comercial recibida");
        console.log("   eNCF:", eNCF);
        console.log("   Estado:", Estado);
        console.log("   RNC Comprador:", RNCComprador);

        // ----------------------------
        // 1️⃣ Validar datos mínimos
        // ----------------------------
        if (!RNCComprador || !eNCF) {
            return res.status(400).json({
                estado: "ERROR",
                mensaje: "Datos incompletos"
            });
        }

        // ----------------------------
        // 2️⃣ Verificar si el comprador es cliente DGII
        // ----------------------------
        const [clientes] = await pool.query(
            "SELECT id FROM clientes_ecf WHERE rnc = ?",
            [RNCComprador]
        );

        if (clientes.length === 0) {
            return res.status(200).json({
                estado: "IGNORADO",
                mensaje: "RNC comprador no registrado"
            });
        }

        // ----------------------------
        // 3️⃣ Guardar aprobación comercial
        // ----------------------------
        await pool.query(`
            INSERT INTO aprobacionescomerciales (
                version,
                rnc_emisor,
                encf,
                fecha_emision,
                monto_total,
                rnc_comprador,
                estado,
                detalle_motivo_rechazo,
                fecha_hora_aprobacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                estado = VALUES(estado),
                detalle_motivo_rechazo = VALUES(detalle_motivo_rechazo),
                fecha_hora_aprobacion = VALUES(fecha_hora_aprobacion)
        `, [
            Version,
            RNCEmisor,
            eNCF,
            FechaEmision,
            MontoTotal,
            RNCComprador,
            Estado,
            DetalleMotivoRechazo || null,
            FechaHoraAprobacionComercial
        ]);

        return res.status(200).json({
            estado: "RECIBIDO",
            encf: eNCF,
            rnc_comprador: RNCComprador
        });

    } catch (error) {
        console.error("❌ Error recepción aprobación:", error);

        return res.status(500).json({
            estado: "ERROR",
            mensaje: "Error interno del servidor"
        });
    }
});


module.exports = router;
