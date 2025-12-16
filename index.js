const express = require("express");
const app = express();
const { guardarECF } = require("./ecfRepository");
const pool = require("./db");



// Permitir recibir XML y JSON
app.use(express.text({ type: "*/*" }));
app.use(express.json());

// ----------------------------------
// RUTA DE PRUEBA
// ----------------------------------
app.get("/", (req, res) => {
    res.send("Servidor Facturación Electrónica DGII activo");
});

// ----------------------------------
// 1️⃣ AUTENTICACIÓN - SEMILLA
// ----------------------------------
app.get("/fe/autenticacion/api/semilla", (req, res) => {

    const xmlSemilla = `<?xml version="1.0" encoding="utf-8"?>
<SemillaModel>
  <valor>SEMILLA_PRUEBA_001</valor>
  <fecha>${new Date().toISOString()}</fecha>
  <any_element>anyType</any_element>
</SemillaModel>`;

    res.set("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xmlSemilla);
});



// ----------------------------------
// 1️⃣ AUTENTICACIÓN - VALIDACIÓN CERTIFICADO
// ----------------------------------
app.post("/fe/autenticacion/api/validacioncertificado", (req, res) => {

    const xmlRespuesta = `
  <ValidacionCertificado>
    <estado>OK</estado>
    <mensaje>Certificado válido</mensaje>
  </ValidacionCertificado>
  `;

    res.set("Content-Type", "application/xml");
    res.status(200).send(xmlRespuesta);
});

// ----------------------------------
// 2️⃣ RECEPCIÓN DE E-CF
// ----------------------------------
const { subirXMLaDrive } = require("./googleDrive");
const { leerDatosECF } = require("./xmlHelper");

app.post("/fe/recepcion/api/ecf", async (req, res) => {
    try {
        const xml = req.body;

        console.log("📄 XML recibido");

        // 👇 LEEMOS DATOS DEL XML
        const { rnc, tipo, ncf } = leerDatosECF(xml);

        console.log("RNC:", rnc);
        console.log("Tipo e-CF:", tipo);
        console.log("e-NCF:", ncf);

        const nombreArchivo = `${ncf}.xml`;

        await subirXMLaDrive(
            xml,
            nombreArchivo,
            rnc,
            tipo
        );

        await guardarECF({
            rnc,
            tipo,
            ncf,
            xml
        });

        return res.status(200).json({
            estado: "RECIBIDO",
            rnc,
            tipo,
            ncf
        });

    } catch (error) {
        console.error("❌ ERROR COMPLETO:");
        console.error(error);

        return res.status(500).json({
            estado: "ERROR",
            mensaje: "No se pudo procesar el XML"
        });
    }
});


// ----------------------------------
// 3️⃣ APROBACIÓN COMERCIAL
// ----------------------------------
app.post("/fe/aprobacioncomercial/api/ecf", async (req, res) => {
    try {
        const xmlEntrada = req.body;

        // (opcional) aquí luego puedes guardar el XML si quieres
        // await guardarAprobacion(xmlEntrada);

        const xmlRespuesta = `<?xml version="1.0" encoding="utf-8"?>
<ACECF>
  <DetalleAprobacionComercial>
    <Version>1.0</Version>
    <RNCEmisor>40224375192</RNCEmisor>
    <eNCF>E3100000002</eNCF>
    <FechaEmision>${new Date().toISOString()}</FechaEmision>
    <MontoTotal>1000.00</MontoTotal>
    <RNCComprador>000000000</RNCComprador>
    <Estado>APROBADO</Estado>
    <DetalleMotivoRechazo></DetalleMotivoRechazo>
    <FechaHoraAprobacionComercial>${new Date().toISOString()}</FechaHoraAprobacionComercial>
  </DetalleAprobacionComercial>
</ACECF>`;

        res.set("Content-Type", "application/xml; charset=utf-8");
        res.status(200).send(xmlRespuesta);

    } catch (error) {
        console.error("❌ Error aprobación comercial:", error);

        res.status(500).send(`<?xml version="1.0" encoding="utf-8"?>
<ACECF>
  <DetalleAprobacionComercial>
    <Estado>RECHAZADO</Estado>
    <DetalleMotivoRechazo>Error interno</DetalleMotivoRechazo>
  </DetalleAprobacionComercial>
</ACECF>`);
    }
});


// ----------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor DGII activo en http://localhost:${PORT}`);
});
