const path = require('path');

function getP12ConfigByRNC(rnc) {
    const passwords = JSON.parse(process.env.P12_PASSWORDS || '{}');

    const password = passwords[rnc];
    if (!password) {
        throw new Error(`No existe password configurado para RNC ${rnc}`);
    }

    const p12Path = path.resolve(
        process.cwd(),
        'p12',
        `${rnc}.p12`
    );

    return {
        p12Path,
        password
    };
}

module.exports = { getP12ConfigByRNC };
