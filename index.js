const express = require("express");
const app = express();

// Repos / helpers
const { guardarECF } = require("./ecfRepository");
const aprobacionesRoutes = require("./routes/aprobaciones");
const { multipartXMLParser } = require("./multipart");

const { subirXMLaDrive } = require("./googleDrive");
const { leerDatosECF } = require("./xmlHelper");
const { generarARECF } = require("./senderReceiver");

// --------------------------------------------------
// ⚠️ SOLO JSON PARA RUTAS JSON
// --------------------------------------------------
app.use(express.json({ type: "application/json" }));

// Rutas JSON
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
    const xmlRespuesta = `<?xml version="1.0" encoding="utf-8"?>
<ValidacionCertificado>
  <estado>OK</estado>
  <mensaje>Certificado válido</mensaje>
</ValidacionCertificado>`;

    res.set("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xmlRespuesta);
});

// ----------------------------------
// 2️⃣ RECEPCIÓN DE E-CF (XML) — DGII
// ----------------------------------

function fechaDGII(date = new Date()) {
    const pad = (n) => n.toString().padStart(2, '0');

    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date
        .getFullYear()
        .toString()
        .slice(-2)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}


app.post(
    "/fe/recepcion/api/ecf",
    multipartXMLParser, // 👈 CLAVE
    async (req, res) => {
        try {
            const xml = req.body;

            console.log("📥 BODY TYPE:", typeof xml);
            console.log("📥 BODY SIZE:", xml?.length);

            if (!xml || typeof xml !== "string") {
                throw new Error("XML no recibido");
            }

            // Leer datos del ECF
            const {
                rncEmisor,
                rncComprador,
                tipo,
                ncf
            } = leerDatosECF(xml);

            // Persistencia
            await subirXMLaDrive(xml, `${ncf}.xml`, rncEmisor, tipo);
            await guardarECF({ rnc: rncEmisor, tipo, ncf, xml });

            // 🔐 GENERAR ARECF FIRMADO (TODO ADENTRO)
            const acuseXML = generarARECF(xml, rncComprador);

            res.set("Content-Type", "application/xml; charset=utf-8");
            return res.status(200).send(acuseXML);

        } catch (err) {
            console.error("❌ ERROR RECEPCIÓN E-CF:", err.message);

            res.set("Content-Type", "application/xml; charset=utf-8");
            return res.status(400).send(`<?xml version="1.0" encoding="utf-8"?>
<ARECF>
  <DetalleAcusedeRecibo>
    <Version>1.0</Version>
    <Estado>1</Estado>
    <CodigoMotivoNoRecibido>1</CodigoMotivoNoRecibido>
    <FechaHoraAcuseRecibo>${fechaDGII()}</FechaHoraAcuseRecibo>
  </DetalleAcusedeRecibo>
</ARECF>`);
        }
    }
);

// ----------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor DGII activo en http://localhost:${PORT}`);
});
