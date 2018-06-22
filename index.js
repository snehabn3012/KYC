var Axios = require('Axios');
var Env = require('./common/Env');
var Utils = require('./common/Utils');
var Url = require('./common/Url');
var ifiList = Utils.AVAILABLE_IFI[Env.CURR_ENV];
var KOTAK_IFI = ifiList['KOTAK'];
var SODEXO_IFI =ifiList['SODEXO'];
var payload = {
    kotak: {},
    ifiKycMap : []
};
var primaryIFI = 140793;
var MinKycifi = [],  // data contains IFI which has to be min kyced
FullKycifi = [],    // data contains IFI which are full kyced
kycStates;

function init() {
    kycAPI('GET_KYC').then(function(kycData) {
        kycStates = kycData.effectiveKycStates;
        kycStates = {
            "140793": "MINIMAL",
            "140827": "MINIMAL",
            "141617": "SHORTFALL_CORP",
            "141618": "SHORTFALL_CORP",
            "156699": "MINIMAL"
        },
        isFullyKyced();
        Object.keys(kycStates).forEach(function(key) {
            if(invokeKyc(kycStates[key], 'MIN_KYC')) {
                MinKycifi.push(key);
            }
        });
        if(MinKycifi.includes(SODEXO_IFI)) {
            removeKyc(SODEXO_IFI)
        }
        if(MinKycifi.includes(KOTAK_IFI) && kycData.kycInfos.length > 0) {
            if(checkKycInfo(kycData.kycInfos, 'status')) {
                updateKycStatus('INITIATED');
            } else if(checkKycInfo(kycData.kycInfos, 'crn')) {
                updateKycStatus('KYC_SHORTFALL');
            } else {
                invokeDeDupe(kycStates[KOTAK_IFI]);                
            }
        } else {
            createIfiMap();
        }
    },function(error) {
        console.log(error);
    });
};

init();

function initiateMinKyc() {
    return MinKycifi.length > 0;
}

function createIfiMap() {
    Object.keys(ifiList).forEach(key => {
        var temp = {};
        temp.name = key;
        temp.ifi = ifiList[key];
        if(MinKycifi.indexOf(ifiList[key]) > -1) {
            temp.isMinKyced = false;
            temp.isFullKyced = false;
        } else if(FullKycifi.indexOf(ifiList[key]) > -1) {
            temp.isMinKyced = true;
            temp.isFullKyced = false;
        } else {
            temp.isMinKyced = true;
            temp.isFullKyced = true;
        }
        payload.ifiKycMap.push(temp);
    });
    payload.isFullyKyced = isFullyKyced();
    payload.isPrimaryifiKyced = isPrimaryIFIKyced();
    payload.initiateMinKyc = initiateMinKyc();
    console.log('Any ifi not Min Kyced -->', payload.initiateMinKyc);
    console.log('payload', payload);
};

function isPrimaryIFIKyced() {
    if(MinKycifi.includes(primaryIFI)) {
        return false;
    } else {
        return true;
    }
}

function isFullyKyced() {
    var flag;
    Object.keys(kycStates).forEach(function(key) {
        if(!invokeKyc(kycStates[key], 'FULL_KYC')) {
            FullKycifi.push(key);
        }
    });
    if(FullKycifi.length > 0) {
        flag = false;
    } else {
        flag = true;
    }
    return flag;
};


function checkKycInfo(kycInfo, key) {
    for(let i=0; i<kycInfo.length; i++) {
        if(kycInfo[i].ifiID === KOTAK_IFI && (key === 'status' ? kycInfo[i][key] === "INITIATED" : key in kycInfo[i].attrs)) {
            createIfiMap();
            removeKyc(KOTAK_IFI);
            return true;
        }
    }
};

function invokeDeDupe(kotakStatus) {
    kycAPI('GET_IFI_SPECIFIC_APPLN').then(function(response) {
        if(response.finalKycStatus === 'REJECTED' && response.status === 'COMPLETED') {
            response.status = 'KYC_SHORTFALL';
        } else {
            response.status = (response.status == 'FAILED' || response.status == 'NAME_MISMATCH') ? 'PROCESSING' : response.status;
        }
        kotakStatus = response.status;
        updateKycStatus(kotakStatus);
        if(!invokeKyc(kotakStatus, 'MIN_KYC')) {
            removeKyc(KOTAK_IFI);
        } else {
            payload.hasKotak = true;  
        }
        createIfiMap();
    })
    .catch(function(err) {
        console.log('err', err);
    });
};

function removeKyc(ifi) {
    MinKycifi = MinKycifi.filter(function(item) {
        return item !== ifi
    });
}

function updateKycStatus(kotakStatus) {
    var source = 'ZOW';
    payload.kotak.status = kotakStatus;
    payload.kotak.description = STATUS_MSG[source][kotakStatus];
}

var KYC_INITIATOR = {
    MIN_KYC     :   ['SHORTFALL_CORP', 'SHORTFALL_NON_CORP', 'INVALID_PAN', 'NO_APPLICATION_FOUND'],
    // FULL_KYC    :   ['MINIMAL', 'EXPIRED_CORP', 'EXPIRED_NON_CORP']
    FULL_KYC    :   ['AADHAAR_BIOMETRIC','AADHAAR_OTP','E_KYC','PAPER']
};

function invokeKyc(kycStatus, type) {
    return KYC_INITIATOR[type].indexOf(kycStatus) > -1;
};

var STATUS_MSG = {
    ZOW : {
        PROCESSING : 'Our partner bank Kotak requires every customer to go through a checker process to identify existing relationship with Kotak. Your KYC data is under processing. It may take upto 5 working days.',
        INVALID_CUSTOMER : 'Through our checker process, we have identified that you are not eligible to receive benefits from Kotak bank on Zeta. If you have any query, please let us know.',
        INVALID_PAN : 'Through our checker process, we have identified that your PAN detail is invald. Please update your PAN detail to continue getting your benefits.',
        KYC_SHORTFALL : 'Since you already have an existing account with Kotak, you must complete your Full KYC with Kotak to receive benefits on Zeta.',
        NO_APPLICATION_FOUND : 'As per RBI mandate, Please update your KYC details to continue getting your benefits.'
    },
    APP : {
        PROCESSING          : 'As part of onboarding on Zeta, our partner bank Kotak requires a customer to go through a checker process to identify existing relationship with Kotak. Based on this check, your KYC status will be updated in our system. It may take up to x working days from our side to process your application.',
        KYC_SHORTFALL       : 'Through our checker process, we have identified that you already have an existing account with Kotak. As per RBI mandate, you must complete your Full KYC with Kotak to receive benefits on Zeta.Please reach out to your corp salary team to know about the scheduled dates of visit of Kotak team to your campus.',
        INVALID_CUSTOMER    : 'Through our checker process, we have identified that you are not eligible to receive benefits from Kotak bank on Zeta. If you think this is a mistake, please let us know and we will forward your request to Kotak bank for review.'
    }
};

function kycAPI (api) {
    return Axios.get(Url.getAPI(api)).then(function (response) {
        return response.data;
    })
    .catch(function(error) {
        console.log(error);
    });
}