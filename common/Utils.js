var Env = require('./Env');

const AVAILABLE_IFI = {
    STAGE: {
        'KOTAK'   : '141618',
        'SODEXO'  : '141617',
        'IDFC'    : '140827',
        'RBL'     : '140793'
    },
    PROD : {
        'KOTAK'   : '163924',
        'SODEXO'  : '163925',
        'IDFC'    : '158326',
        'RBL'     : '156699'
    },
    PREPROD : {
        'KOTAK'   : '141618',
        'SODEXO'  : '141617',
        'IDFC'    : '140827',
        'RBL'     : '140793'
    }
};

const getIFIByName = function(name) {
    return AVAILABLE_IFI[Env.CURR_ENV][name];
};

module.exports = {
    AVAILABLE_IFI,
    getIFIByName
};
