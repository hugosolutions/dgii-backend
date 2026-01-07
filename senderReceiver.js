// senderReceiver.js
const { DOMParser } = require("@xmldom/xmldom");
const { js2xml } = require("xml-js");

const { getP12ConfigByRNC } = require("./certStore");
const P12Reader = require("./p12Reader");
const Signature = require("./signature");

/**
 * Tipos de e-CF que NO deben recibirse
 */
const excludedEncfType = ["32", "41", "43", "45", "46", "47"];

/**
 * Estados DGII
 */
const ReceivedStatus = {
    RECIBIDO: "0",
    NO_RECIBIDO: "1"
};

/**
 * Códigos DGII
 */
const NoReceivedCode = {
    ERROR_ESPECIFICACION: "1",
    ERROR_FIRMA: "2",
    DUPLICADO: "3",
    RNC_NO_CORRESPONDE: "4"
};

/**
 * Fecha DGII: DD-MM-YYYY HH:mm:ss
 */
function getCurrentFormattedDateTime() {
    const d = new Date();
    const pad = n => n.toString().padStart(2, "0");

    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Genera y FIRMA el ARECF
 */
function generarARECF(xml, receptorRNC) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "text/xml");

    let estado = ReceivedStatus.RECIBIDO;
    let codigoMotivo;

    const eNCF = xmlDoc.getElementsByTagName("eNCF")[0]?.textContent;
    const TipoeCF = xmlDoc.getElementsByTagName("TipoeCF")[0]?.textContent;
    const RNCEmisor = xmlDoc.getElementsByTagName("RNCEmisor")[0]?.textContent;
    const RNCComprador = xmlDoc.getElementsByTagName("RNCComprador")[0]?.textContent;

    // Validaciones mínimas
    if (!eNCF || !TipoeCF || !RNCEmisor || !RNCComprador) {
        estado = ReceivedStatus.NO_RECIBIDO;
        codigoMotivo = NoReceivedCode.ERROR_ESPECIFICACION;
    }

    if (TipoeCF && excludedEncfType.includes(TipoeCF)) {
        estado = ReceivedStatus.NO_RECIBIDO;
        codigoMotivo = NoReceivedCode.ERROR_ESPECIFICACION;
    }

    if (receptorRNC && receptorRNC !== RNCComprador) {
        estado = ReceivedStatus.NO_RECIBIDO;
        codigoMotivo = NoReceivedCode.RNC_NO_CORRESPONDE;
    }

    // ARECF sin firma
    const arecfObj = {
        _declaration: {
            _attributes: { version: "1.0", encoding: "utf-8" }
        },
        ARECF: {
            DetalleAcusedeRecibo: {
                Version: "1.0",
                RNCEmisor,
                RNCComprador,
                eNCF,
                Estado: estado,
                ...(codigoMotivo && { CodigoMotivoNoRecibido: codigoMotivo }),
                FechaHoraAcuseRecibo: getCurrentFormattedDateTime()
            }
        }
    };

    const arecfXML = js2xml(arecfObj, {
        compact: true,
        spaces: 4
    });

    // 🔐 CARGAR CERTIFICADO DEL RECEPTOR
    const { p12Path, password } = getP12ConfigByRNC(RNCComprador);
    const reader = new P12Reader(password);
    const { key, cert } = reader.getKeyFromFile(p12Path);

    // ✍️ FIRMAR (IGUAL GITHUB)
    const signer = new Signature(key, cert);
    return signer.signXml(arecfXML, "ARECF");
}

module.exports = {
    generarARECF,
    ReceivedStatus,
    NoReceivedCode,
    excludedEncfType
};
