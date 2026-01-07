const { SignedXml } = require('xml-crypto');
const { DOMParser } = require('@xmldom/xmldom');
const KeyInfoProvider = require('./custom/KeyInfoProvider');

class Signature {
    constructor(privateKey, certificate) {
        this.privateKey = privateKey;
        this.certificate = certificate;
    }

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
        const sig = new SignedXml({
            signatureAlgorithm:
                'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
            canonicalizationAlgorithm:
                'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
        });

        sig.signingKey = this.privateKey;
        sig.keyInfoProvider = new KeyInfoProvider(this.certificate);

        // ✅ ÚNICA FORMA VÁLIDA
        sig.addReference({
            xpath: `//*[local-name()='${rootTag}']`,
            transforms: [
                'http://www.w3.org/2000/09/xmldsig#enveloped-signature'
            ],
            digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256'
        });

        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        this.cleanNodes(doc);

        // 🚨 PASAR EL DOCUMENTO, NO STRING
        sig.computeSignature(doc);

        return sig.getSignedXml();
    }
}

module.exports = Signature;
