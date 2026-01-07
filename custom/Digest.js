const crypto = require('crypto');
const { DOMParser } = require('@xmldom/xmldom');

class Digest {
    sortElements(elements) {
        const comparator = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
        const items = Array.from(elements);
        return items.sort(comparator);
    }

    getHash(xml) {
        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        const attrs = doc.childNodes[0].attributes;

        // 🔥 HACK CRÍTICO DGII: ordenar atributos
        const items = this.sortElements(attrs);
        Object.assign(doc.childNodes[0].attributes, items);

        const shasum = crypto.createHash('sha256');
        shasum.update(doc.toString(), 'utf8');

        return shasum.digest('base64');
    }

    getAlgorithmName() {
        return 'http://www.w3.org/2001/04/xmlenc#sha256';
    }
}

module.exports = Digest;
