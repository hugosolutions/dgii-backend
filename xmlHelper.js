const { XMLParser } = require("fast-xml-parser");

function leerDatosECF(xml) {
    const parser = new XMLParser({
        ignoreAttributes: false,
        removeNSPrefix: true
    });

    const json = parser.parse(xml);

    try {
        const root = json?.ECF || json?.eCF;

        const rncEmisor = root?.Emisor?.RNCEmisor || "DESCONOCIDO";
        const rncComprador = root?.Receptor?.RNCComprador || "DESCONOCIDO";

        const tipo = root?.Encabezado?.IdDoc?.TipoeCF || "00";
        const ncf = root?.Encabezado?.IdDoc?.eNCF || "SIN-NCF";

        return {
            rncEmisor,
            rncComprador,
            tipo,
            ncf
        };
    } catch (error) {
        return {
            rncEmisor: "ERROR",
            rncComprador: "ERROR",
            tipo: "00",
            ncf: "ERROR"
        };
    }
}

module.exports = { leerDatosECF };
