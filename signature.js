const { SignedXml } = require('xml-crypto');
const { DOMParser } = require('@xmldom/xmldom');
const Digest = require('./custom/Digest');
const KeyInfoProvider = require('./custom/KeyInfoProvider');

class Signature {
    constructor(privateKey, certificatePEM) {
        this.privateKey = privateKey;
        this.certificatePEM = certificatePEM;
    }

    /**
     * Limpia espacios y nodos vacíos (OBLIGATORIO DGII)
     */
    cleanNodes(node) {
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];

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

    signXml(xml, rootTag) {
        // 🔴 ESTO ES LO QUE TE FALTABA
        SignedXml.HashAlgorithms['http://myDigestAlgorithm'] = Digest;

        const sig = new SignedXml();

        sig.signatureAlgorithm =
            'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';

        sig.canonicalizationAlgorithm =
            'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';

        sig.keyInfoProvider = new KeyInfoProvider(this.certificatePEM);

        // 🔴 EXACTAMENTE IGUAL AL GITHUB
        sig.addReference(
            `//*[local-name(.)='${rootTag}']`,
            ['http://www.w3.org/2000/09/xmldsig#enveloped-signature'],
            'http://myDigestAlgorithm',
            undefined,
            undefined,
            undefined,
            true
        );

        sig.signingKey = this.privateKey;

        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        this.cleanNodes(doc);

        sig.computeSignature(doc.toString());

        return sig.getSignedXml();
    }
}

module.exports = Signature;
