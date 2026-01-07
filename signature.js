const { SignedXml } = require('xml-crypto');
const { DOMParser } = require('@xmldom/xmldom');
const KeyInfoProvider = require('./custom/KeyInfoProvider');

class Signature {
    constructor(privateKey, certificate) {
        this.privateKey = privateKey;
        this.certificate = certificate;
    }

    cleanNodes(node) {
        if (!node || !node.childNodes) return;

        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];

            if (!child) continue;

            if (
                child.nodeType === 8 ||
                (child.nodeType === 3 && !/\S/.test(child.nodeValue))
            ) {
                node.removeChild(child);
                i--;
            } else if (child.nodeType === 1) {
                this.cleanNodes(child);
            }
        }
    }

    signXml(xml) {
        const sig = new SignedXml({
            signatureAlgorithm:
                'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
            canonicalizationAlgorithm:
                'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
        });

        sig.signingKey = this.privateKey;
        sig.keyInfoProvider = new KeyInfoProvider(this.certificate);

        // 🔥 EXACTAMENTE COMO C#
        sig.addReference({
            uri: '',
            transforms: [
                'http://www.w3.org/2000/09/xmldsig#enveloped-signature'
            ],
            digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256'
        });

        // 👇 Limpiar posibles BOM y espacios al inicio/final
        xml = xml.trim().replace(/^\uFEFF/, '');

        // 👇 Crear parser con manejo de errores
        const parser = new DOMParser({
            errorHandler: {
                warning: () => { },
                error: () => { },
                fatalError: (e) => console.error('xmldom fatal:', e)
            }
        });

        // 👇 Parsear XML seguro
        const doc = parser.parseFromString(xml, 'text/xml');

        // 👇 Limpiar nodos vacíos (igual que antes)
        this.cleanNodes(doc);

        // 👇 PASAR el root node a computeSignature
        sig.computeSignature(doc.documentElement);


        return sig.getSignedXml();
    }
}

module.exports = Signature;
