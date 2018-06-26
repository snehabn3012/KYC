var Axios = require('Axios');
var Env = require('./common/Env');
var Utils = require('./common/Utils');
var Url = require('./common/Url');
var ifiList = Utils.AVAILABLE_IFI[Env.CURR_ENV];
var ifiValue = Utils.IFI_VALUE[Env.CURR_ENV];
var KOTAK_IFI = ifiList['KOTAK'];
var SODEXO_IFI =ifiList['SODEXO'];
var payload = {
    kotak: {},
    ifiKycMap : []
};
var primaryIFI = 140793;
var MinKycifi = [],  // data contains IFI which has to be min kyced
FullKycifi = [],    // data contains IFI which has to be full kyced
kycData = {}, kycStates, showBanner = false;

var KYC_INITIATOR = {
    MIN_KYC     :   ['SHORTFALL_CORP', 'SHORTFALL_NON_CORP', 'INVALID_PAN', 'NO_APPLICATION_FOUND'],
    FULL_KYC    :   ['MINIMAL']
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

function init(userID, authToken) {
    var reqObj = {
        params : {
          userID    : 155757,
          isSecure  : true
        }
    };
    kycAPI('GET_KYC', reqObj).then(function(kycData) {
        kycData = kycData;
        kycStates = kycData.effectiveKycStates;
        payload.userData = {};
        payload.userData.name = kycData.name;
        payload.userData.userID = kycData.userID;
        payload.userData.dob = kycData.dob;
        payload.userData.panNumber = kycData.panNumber;
        payload.userData.aadhaarNumber = kycData.aadhaarNumber;
        if(kycData.hasOwnProperty('kycInfos')) {
            payload.userData.gender = kycData.kycInfos[0].gender;
            payload.userData.address = kycData.kycInfos[0].address;
        }
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
            createIfiMap(); // conclusion
        }
    },function(error) {
        console.log(error);
    });
};

init();

function getEffectiveKycStatus() {  // expose fn
    return kycStates;
};

function ifiBasedInfo(ifi) {    // expose fn
    kycData.kycInfo.forEach(function(item) {
        if(item.ifiID === ifi) {
            return item;
        }
    });
};

function initiateMinKyc() { // expose fn
    return MinKycifi.length > 0;
}

function createIfiMap() {
    Object.keys(kycStates).forEach(key => {
        var temp = {};
        key = key.toString();
        temp.ifi = key;
        temp.name = ifiValue[key];
        if(MinKycifi.indexOf(key) > -1) {
            temp.isMinKyced = false;
            temp.isFullKyced = false;
        } else if(FullKycifi.indexOf(key) > -1) {
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
    console.log('payload', payload);
};

function isPrimaryIFIKyced() {  // expose fn
    if(MinKycifi.includes(primaryIFI)) {
        return false;
    } else {
        return true;
    }
}

function isFullyKyced() {   // expose fn
    var flag; FullKycifi =[];
    Object.keys(kycStates).forEach(function(key) {
        if(invokeKyc(kycStates[key], 'FULL_KYC')) {
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
        if(kycInfo[i].ifiID === KOTAK_IFI && (key === 'status' ? (kycInfo[i].kycType === "SHORT_FALL" && kycInfo[i].authType === 'EXTERNAL') : key in kycInfo[i].attrs)) {
            createIfiMap();
            removeKyc(KOTAK_IFI);
            return true;
        }
    }
};

function invokeDeDupe(kotakStatus) {
    var reqObj = {
        params : {
          userID    : 126911,
          ifi       : 141618
        }
    };
    kycAPI('GET_IFI_SPECIFIC_APPLN', reqObj).then(function(response) {
        payload.showBanner = true;
        payload.userData = response;
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

function showBanner() { // expose fn
    return showBanner;
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

function invokeKyc(kycStatus, type) {
    return KYC_INITIATOR[type].indexOf(kycStatus) > -1;
};

function kycAPI (api, req) {
    req.headers = {
        'X-Zeta-AuthToken': 'NFcveWFuRnBRSmVIeFVYUzRjejltWmRQVDAvczNweHpzVFgxdVA5bGZoWDFQYlIrVndzQy9GNXowVjA9OkFRSGZEck9DdHBMNk1oN01XWkNnWlFWcE9xWG5qSUZQMTJmRG9hTWFxVEZvUDZvaUhWOEhiT1l0UzBUSVNwZklScUxVaUhOei9VMjB4R1o1WGRYWE1DUFpqUE12eVNqVzJjTzRjaFUwdlZyMDlUa3NieWMrbzdQRzV5dEtDbldKVmRZQng1S2I4UjFQZlpSQ3hMVGdaOE5aMHRnWXkvUE9pRDZObUJUblNnPT0='
    };
    return Axios.get(Url.getAPI(api), req)
    .then(function (response) {
        console.log('response', response.data);
        return response;
    })
    .catch(function(error) {
        return response.data;
        console.log(error);
    });
};