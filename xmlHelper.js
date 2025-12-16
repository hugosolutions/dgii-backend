const { XMLParser } = require("fast-xml-parser");

function leerDatosECF(xml) {
    const parser = new XMLParser({
        ignoreAttributes: false,
    });

    const json = parser.parse(xml);

    try {
        const rnc =
            json?.ECF?.Emisor?.RNCEmisor ||
            json?.eCF?.Emisor?.RNCEmisor ||
            "DESCONOCIDO";

        const tipo =
            json?.ECF?.Encabezado?.IdDoc?.TipoeCF ||
            json?.eCF?.Encabezado?.IdDoc?.TipoeCF ||
            "00";

        const ncf =
            json?.ECF?.Encabezado?.IdDoc?.eNCF ||
            json?.eCF?.Encabezado?.IdDoc?.eNCF ||
            "SIN-NCF";

        return { rnc, tipo, ncf };
    } catch (error) {
        return {
            rnc: "ERROR",
            tipo: "00",
            ncf: "ERROR",
        };
    }
}

module.exports = { leerDatosECF };
