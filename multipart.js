const busboy = require("busboy");

function multipartXMLParser(req, res, next) {
    const contentType = req.headers["content-type"] || "";

    if (!contentType.includes("multipart/form-data")) {
        return next();
    }

    const bb = busboy({ headers: req.headers });

    let xml = "";
    let fileFound = false;

    bb.on("file", (fieldname, file, info) => {
        fileFound = true;

        file.on("data", data => {
            xml += data.toString("utf8");
        });
    });

    bb.on("finish", () => {
        if (!fileFound || !xml) {
            return res.status(400).send("XML vacío o no encontrado");
        }

        req.body = xml;
        next();
    });

    bb.on("error", err => {
        console.error("❌ BUSBOY ERROR:", err);
        return res.status(400).send("Error leyendo multipart");
    });

    req.pipe(bb);
}


module.exports = { multipartXMLParser };