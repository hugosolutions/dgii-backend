const fs = require('fs');
const forge = require('node-forge');

class P12Reader {
    constructor(passphrase) {
        this.passphrase = passphrase;
    }

    getCertificateFromP12(p12) {
        const certData = p12.getBags({ bagType: forge.pki.oids.certBag });
        const certs = certData[forge.pki.oids.certBag];

        if (!certs || !certs.length || !certs[0].cert) {
            throw new Error('Certificado no encontrado en el P12');
        }

        return forge.pki.certificateToPem(certs[0].cert);
    }

    getKeyFromP12(p12) {
        const keyData = p12.getBags({
            bagType: forge.pki.oids.pkcs8ShroudedKeyBag
        });

        const keys = keyData[forge.pki.oids.pkcs8ShroudedKeyBag];
        if (!keys || !keys.length || !keys[0].key) {
            throw new Error('Private key no encontrada en el P12');
        }

        return forge.pki.privateKeyToPem(keys[0].key);
    }

    getKeyFromFile(p12Path) {
        const p12File = fs.readFileSync(p12Path, 'base64');
        const p12Der = forge.util.decode64(p12File);
        const p12Asn1 = forge.asn1.fromDer(p12Der);
        const p12 = forge.pkcs12.pkcs12FromAsn1(
            p12Asn1,
            false,
            this.passphrase
        );

        return {
            key: this.getKeyFromP12(p12),
            cert: this.getCertificateFromP12(p12)
        };
    }
}

module.exports = P12Reader;
