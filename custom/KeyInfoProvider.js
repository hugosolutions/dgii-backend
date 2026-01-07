const forge = require('node-forge');
const { FileKeyInfo } = require('xml-crypto');

class KeyInfoProvider extends FileKeyInfo {
    constructor(certificatePEM) {
        super();

        if (Buffer.isBuffer(certificatePEM)) {
            certificatePEM = certificatePEM.toString('ascii');
        }

        if (!certificatePEM || typeof certificatePEM !== 'string') {
            throw new Error(
                'certificatePEM must be a valid certificate in PEM format'
            );
        }

        this._certificatePEM = certificatePEM;
    }

    getKeyInfo(key, prefix) {
        prefix = prefix || '';
        prefix = prefix ? prefix + ':' : prefix;

        const certBodyInB64 = forge.util.encode64(
            forge.pem.decode(this._certificatePEM)[0].body
        );

        let keyInfoXml = `<${prefix}X509Data>`;
        keyInfoXml += `<${prefix}X509Certificate>`;
        keyInfoXml += certBodyInB64;
        keyInfoXml += `</${prefix}X509Certificate>`;
        keyInfoXml += `</${prefix}X509Data>`;

        return keyInfoXml;
    }

    getKey() {
        return Buffer.from(this._certificatePEM);
    }
}

module.exports = KeyInfoProvider;
