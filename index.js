var Axios = require('Axios');
var Env = require('./common/Env');
var Utils = require('./common/Utils');
var Url = require('./common/Url');
var ifiList = Utils.AVAILABLE_IFI[Env.CURR_ENV];
var ifiValue = Utils.IFI_VALUE[Env.CURR_ENV];
var KOTAK_IFI = ifiList['KOTAK'];
var SODEXO_IFI =ifiList['SODEXO'];
var payload = {
    ifiKycMap : {}
};
var primaryIFI = 140793;
var MinKycifi = [],  // data contains IFI which has to be min kyced
FullKycifi = [],    // data contains IFI which has to be full kyced
kycData = {}, kycStates, bannerFlag = false;

const kyc = {
    KYC_INITIATOR : {
        MIN_KYC     :   ['SHORTFALL_CORP', 'SHORTFALL_NON_CORP', 'INVALID_PAN', 'NO_APPLICATION_FOUND'],
        FULL_KYC    :   ['MINIMAL']
    },
    STATUS_MSG : {
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
    },
    createIfiMap() {
        Object.keys(kycStates).forEach(key => {
            var temp = {};
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
            payload.ifiKycMap[key] = temp;
        });
        payload.isFullyKyced = isFullyKyced();
        payload.isPrimaryifiKyced = isPrimaryIFIKyced();
        payload.initiateMinKyc = initiateMinKyc();
    },
    checkKycInfo(kycInfo, key) {
        for(let i=0; i<kycInfo.length; i++) {
            if(kycInfo[i].ifiID === KOTAK_IFI && (key === 'status' ? (kycInfo[i].kycType === "SHORT_FALL" && kycInfo[i].authType === 'EXTERNAL') : key in kycInfo[i].attrs)) {
                this.createIfiMap();
                this.removeKyc(KOTAK_IFI);
                return true;
            }
        }
    },
    invokeDeDupe(req) { // user request to get source
        var reqObj = {
            params : {
              userID    : 126911,
              ifi       : 141618
            },
            headers : {
                'X-Zeta-AuthToken': req.token
            }
        };
        kycAPI('GET_IFI_SPECIFIC_APPLN', reqObj).then(function(response) {
            payload.kotak = {};
            payload.bannerFlag = true;
            payload.userData = response;
            if(response.finalKycStatus === 'REJECTED' && response.status === 'COMPLETED') {
                response.status = 'KYC_SHORTFALL';
            } else {
                response.status = (response.status == 'FAILED' || response.status == 'NAME_MISMATCH') ? 'PROCESSING' : response.status;
            }
            kotakStatus = response.status;
            kyc.updateKycStatus(kotakStatus, req.source);
            if(!kyc.invokeKyc(kotakStatus, 'MIN_KYC')) {
                kyc.removeKyc(KOTAK_IFI);
            } else {
                payload.hasKotak = true;
            }
            this.createIfiMap();
        })
        .catch(function(err) {
            console.log('err', err);
        });
    },
    removeKyc(ifi) {
        MinKycifi = MinKycifi.filter(function(item) {
            return item !== ifi
        });
    },
    updateKycStatus(kotakStatus, source) {
        payload.kotak.status = kotakStatus;
        // payload.kotak.description = this.STATUS_MSG[source][kotakStatus]; // dedupe
    },
    invokeKyc(kycStatus, type) {
        return this.KYC_INITIATOR[type].indexOf(kycStatus) > -1;
    }
};

function init(req) {
    return new Promise((resolve, reject) => {
        var reqObj = {
            params : {
              userID    : req.userid,
              isSecure  : true
            },
            headers : {
                'X-Zeta-AuthToken': req.token
            }
        }
        kycAPI('GET_KYC', reqObj)
        .then(function(res) {
            kycData = res;
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
            Object.keys(kycStates).forEach(function(key) {
                if(kyc.invokeKyc(kycStates[key], 'FULL_KYC')) {
                    FullKycifi.push(key);
                }
            });
            Object.keys(kycStates).forEach(function(key) {
                if(kyc.invokeKyc(kycStates[key], 'MIN_KYC')) {
                    MinKycifi.push(key);
                }
            });
            if(MinKycifi.includes(SODEXO_IFI)) {
                kyc.removeKyc(SODEXO_IFI)
            }
            if(MinKycifi.includes(KOTAK_IFI) && kycData.kycInfos.length > 0) {
                if(kyc.checkKycInfo(kycData.kycInfos, 'status')) {
                    kyc.updateKycStatus('INITIATED');
                } else if(kyc.checkKycInfo(kycData.kycInfos, 'crn')) {
                    kyc.updateKycStatus('KYC_SHORTFALL');
                } else {
                    payload.hasKotak = true;
                    kyc.createIfiMap();
                }
            } else {
                kyc.createIfiMap(); // conclusion
            }
            resolve(payload);
        })
        .catch(() => {
            reject();
        })
    });
};

function getEffectiveKycStatus() {  // expose fn
    return kycStates;
};

function ifiBasedInfo(ifi) {    // expose fn
    var i,kycInfo = kycData.kycInfos;
    for(i=0;i<=kycInfo.length;i++) {
        if(kycInfo[i].ifiID == ifi) {
            return kycInfo[i];
        }
    };
};

function isAtmEnabled() {
    return kycData.atmEnabled;
};

function isCorpUser() {
    return kycData.isCorpUser;
}

function initiateMinKyc() { // expose fn
    return MinKycifi.length > 0;
};

function isPrimaryIFIKyced() {  // expose fn
    if(MinKycifi.includes(primaryIFI)) {
        return false;
    } else {
        return true;
    }
};

function isFullyKyced() {   // expose fn
    return FullKycifi.length === Object.keys(kycStates).length;
};

function showBanner() { // expose fn
    return bannerFlag;
};

function kycAPI (api, req) {
    return Axios.get(Url.getAPI(api), req)
    .then(function (response) {
        return response.data;
    })
    .catch(function(error) {
        return response.data;
        console.log(error);
    });
};


module.exports = {
    init,
    getEffectiveKycStatus,
    showBanner,
    isPrimaryIFIKyced,
    ifiBasedInfo,
    initiateMinKyc,
    isAtmEnabled,
    isCorpUser
};