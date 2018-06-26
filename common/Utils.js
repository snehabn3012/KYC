var Env = require('./Env');

const AVAILABLE_IFI = {
    STAGE: {
        'KOTAK'   : '141618',
        'SODEXO'  : '141617',
        'IDFC'    : '140827',
        'HDFC'    : '147340',  
        'RBL'     : '140793'
    },
    PREPROD : {
        'KOTAK'   : '141618',
        'SODEXO'  : '141617',
        'HDFC'    : '147340',  
        'IDFC'    : '140827',
        'RBL'     : '140793'
    },
    PROD : {
        'KOTAK'   : '163924',
        'SODEXO'  : '163925',
        'IDFC'    : '158326',
        'HDFC'    : '233203',  
        'RBL'     : '156699'
    }
};

const IFI_VALUE = {
    STAGE: {
        141618 : 'KOTAK',
        141617 : 'SODEXO',
        140827 : 'IDFC',
        147340 : 'HDFC',  
        140793 : 'RBL'
    },
    PREPROD : {
        141618 : 'KOTAK',
        141617 : 'SODEXO',
        140827 : 'IDFC',
        147340 : 'HDFC',  
        140793 : 'RBL'
    },
    PROD : {
        163924 : 'KOTAK',
        163925 : 'SODEXO',
        158326 : 'IDFC',
        233203 : 'HDFC',  
        156699 : 'RBL'
    }
};

const getIFIByName = function(name) {
    return AVAILABLE_IFI[Env.CURR_ENV][name];
};

module.exports = {
    AVAILABLE_IFI,
    IFI_VALUE,
    getIFIByName
};
