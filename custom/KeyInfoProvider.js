const forge = require('node-forge');

class KeyInfoProvider {
    constructor(certificatePEM) {
        if (!certificatePEM || typeof certificatePEM !== 'string') {
            throw new Error('certificatePEM must be a valid PEM string');
        }
        this.certificatePEM = certificatePEM;
    }

    getKeyInfo(key, prefix) {
        prefix = prefix ? prefix + ':' : '';

        const certBodyInB64 = forge.util.encode64(
            forge.pem.decode(this.certificatePEM)[0].body
        );

        return `
<${prefix}X509Data>
  <${prefix}X509Certificate>${certBodyInB64}</${prefix}X509Certificate>
</${prefix}X509Data>`;
    }

    getKey() {
        return null;
    }
}

module.exports = KeyInfoProvider;
