var Env = require('./Env');

exports.getIFIByName = function(name) {
    const STAGE = {
        'KOTAK'   : '141618',
        'SODEXO'  : '141617',
        'IDFC'    : '140827',
        'RBL'     : '140793'
    };
    const PROD = {
        'KOTAK'   : '163924',
        'SODEXO'  : '163925',
        'IDFC'    : '158326',
        'RBL'     : '156699'
    };
    const PREPROD = {
        'KOTAK'   : '141618',
        'SODEXO'  : '141617',
        'IDFC'    : '140827',
        'RBL'     : '140793'
    };
    return Env.CURR_ENV === 'PROD' ? PROD[name] : Env.CURR_ENV === 'STAGE' ? STAGE[name] : PREPROD[name];
}