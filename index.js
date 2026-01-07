const express = require("express");
const app = express();
const { guardarECF } = require("./ecfRepository");
const pool = require("./db");
const aprobacionesRoutes = require("./routes/aprobaciones");

// --------------------------------------------------
// ✅ MIDDLEWARE CORRECTO (CLAVE)
// --------------------------------------------------
// JSON SOLO para application/json
app.use(express.json({ type: "application/json" }));

// XML SOLO para XML
app.use(express.text({ type: ["application/xml", "text/xml"] }));

// Rutas de aprobación comercial (JSON)
app.use(aprobacionesRoutes);

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

    res.set("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xmlRespuesta);
});

// ----------------------------------
// 2️⃣ RECEPCIÓN DE E-CF (XML)
// ----------------------------------
const { subirXMLaDrive } = require("./googleDrive");
const { leerDatosECF } = require("./xmlHelper");
const { generarARECF } = require("./senderReceiver");

app.post("/fe/recepcion/api/ecf", async (req, res) => {
    try {
        const xml = req.body;

        // 1️⃣ Validación básica
        if (!xml || typeof xml !== "string") {
            throw new Error("XML no recibido o formato inválido");
        }

        // 2️⃣ Lectura de datos desde el XML
        const {
            rncEmisor,
            rncComprador,
            tipo,
            ncf
        } = leerDatosECF(xml);

        // 3️⃣ Validación mínima de datos críticos
        if (
            rncEmisor === "ERROR" ||
            rncComprador === "ERROR" ||
            ncf === "ERROR"
        ) {
            throw new Error("XML malformado o incompleto");
        }

        // ⚠️ VALIDACIÓN FUTURA (multi-tenant)
        // const cliente = await buscarClientePorRNC(rncComprador);
        // if (!cliente) {
        //     throw new Error("RNC receptor no autorizado");
        // }

        // 4️⃣ Guardar XML original
        await subirXMLaDrive(xml, `${ncf}.xml`, rncEmisor, tipo);

        await guardarECF({
            rnc: rncEmisor,
            tipo,
            ncf,
            xml
        });

        // 5️⃣ Generar ARECF oficial DGII
        const acuseXML = generarARECF(xml, rncComprador);

        // 6️⃣ Responder con XML
        res.set("Content-Type", "application/xml; charset=utf-8");
        return res.status(200).send(acuseXML);

    } catch (error) {
        console.error("❌ ERROR RECEPCIÓN E-CF:", error.message);

        // ❌ ARECF de error (estructura oficial DGII)
        const acuseError = `<?xml version="1.0" encoding="utf-8"?>
<ARECF>
  <DetalleAcusedeRecibo>
    <Version>1.0</Version>
    <Estado>1</Estado>
    <CodigoMotivoNoRecibido>1</CodigoMotivoNoRecibido>
    <FechaHoraAcuseRecibo>${new Date().toISOString()}</FechaHoraAcuseRecibo>
  </DetalleAcusedeRecibo>
</ARECF>`;

        res.set("Content-Type", "application/xml; charset=utf-8");
        return res.status(400).send(acuseError);
    }
});




// ----------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor DGII activo en http://localhost:${PORT}`);
});
