const forge = require('node-forge');

class KeyInfoProvider {
    constructor(certificatePEM) {
        if (!certificatePEM || typeof certificatePEM !== 'string') {
            throw new Error('certificatePEM inválido');
        }
        this.certificatePEM = certificatePEM;
    }

    getKeyInfo(key, prefix) {
        prefix = prefix ? prefix + ':' : '';

        const certBody = forge.pem.decode(this.certificatePEM)[0].body;
        const certBase64 = forge.util.encode64(certBody);

        return (
            `<${prefix}X509Data>` +
            `<${prefix}X509Certificate>` +
            certBase64 +
            `</${prefix}X509Certificate>` +
            `</${prefix}X509Data>`
        );
    }

    getKey() {
        return null;
    }
}

module.exports = KeyInfoProvider;
