// senderReceiver.js
const { DOMParser } = require("@xmldom/xmldom");
const { js2xml } = require("xml-js");

/**
 * Tipos de e-CF que NO deben recibirse
 */
const excludedEncfType = ["32", "41", "43", "45", "46", "47"];

/**
 * Estados oficiales DGII
 */
const ReceivedStatus = {
    RECIBIDO: "0",
    NO_RECIBIDO: "1"
};

/**
 * Códigos oficiales DGII
 */
const NoReceivedCode = {
    ERROR_ESPECIFICACION: "1",
    ERROR_FIRMA: "2",
    DUPLICADO: "3",
    RNC_NO_CORRESPONDE: "4"
};

/**
 * Fecha formato ISO (DGII lo acepta)
 */
function getCurrentFormattedDateTime() {
    return new Date().toISOString();
}

/**
 * Genera el Acuse de Recibo (ARECF)
 * El estado inicial es RECIBIDO y se ajusta según validaciones
 */
function generarARECF(xml, receptorRNC) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "text/xml");

    let estado = ReceivedStatus.RECIBIDO;
    let codigoMotivo;

    // Extraer nodos obligatorios
    const eNCF = xmlDoc.getElementsByTagName("eNCF")[0]?.textContent;
    const TipoeCF = xmlDoc.getElementsByTagName("TipoeCF")[0]?.textContent;
    const RNCEmisor = xmlDoc.getElementsByTagName("RNCEmisor")[0]?.textContent;
    const RNCComprador = xmlDoc.getElementsByTagName("RNCComprador")[0]?.textContent;

    // Validación mínima de estructura
    if (!eNCF || !TipoeCF || !RNCEmisor || !RNCComprador) {
        estado = ReceivedStatus.NO_RECIBIDO;
        codigoMotivo = NoReceivedCode.ERROR_ESPECIFICACION;
    }

    // Validar tipo de e-CF
    if (TipoeCF && excludedEncfType.includes(TipoeCF)) {
        estado = ReceivedStatus.NO_RECIBIDO;
        codigoMotivo = NoReceivedCode.ERROR_ESPECIFICACION;
    }

    // Validar RNC del receptor
    if (receptorRNC && RNCComprador && receptorRNC !== RNCComprador) {
        estado = ReceivedStatus.NO_RECIBIDO;
        codigoMotivo = NoReceivedCode.RNC_NO_CORRESPONDE;
    }

    // Construcción del XML (OFICIAL DGII)
    const data = {
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

    return js2xml(data, {
        compact: true,
        ignoreComment: true,
        spaces: 4
    });
}

module.exports = {
    generarARECF,
    ReceivedStatus,
    NoReceivedCode,
    excludedEncfType
};
