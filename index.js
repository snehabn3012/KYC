var Axios = require('Axios');
var Env = require('./common/Env');
var Utils = require('./common/Utils');
var Url = require('./common/Url');
var serviceConnector = require('./common/serviceConnector');
var kycData = {};

(function() {
    kycAPI('GET_KYC').then(function(kycData) {
        console.log('kycData', kycData);
        kycData = kycData;
        var KOTAK_IFI = Utils.getIFIByName('KOTAK');
        console.log(KOTAK_IFI);
        if(getKycStatus(KOTAK_IFI, 'MIN_KYC')) {
            kycAPI('GET_IFI_SPECIFIC_APPLN').then(function(kotakKYCData) {
                console.log('kotakKYCData', kotakKYCData);
            });
        }
    },function(error){
        console.log(error);
    });
})();

var KYC_INITIATOR = {
    MIN_KYC : ['SHORTFALL_CORP', 'SHORTFALL_NON_CORP', 'INVALID_PAN', 'NO_APPLICATION_FOUND'],
    FULL_KYC : ['MINIMAL', 'EXPIRED_CORP', 'EXPIRED_NON_CORP']
};


function getKycStatus(ifi, type) {
    return KYC_INITIATOR[type].indexOf(kycData.effectiveKycStates[ifi]) > -1;
}

function kycAPI (api) {
    return Axios.get(Url.getAPI(api)).then(function (response) {
        return response.data;
    })
    .catch(function(error) {
        console.log(error);
    });
}