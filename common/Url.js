var Env = require('./Env');

var CURRENT_ENV = Env.CURR_ENV();

var BASE_URL = {
  STAGE: 'https://api.stage.zeta.in/zeta.in',
  PREPROD:'https://api.preprod.zeta.in/zeta.in',
  PROD: 'https://api.gw.zetapay.in/zeta.in'
};

 exports.getAPI = function(api) {
   var KYC_URL = {
    GET_IFI_SPECIFIC_APPLN : '${BASE_URL[CURRENT_ENV]}/app-portal/1.0/getIfiSpecificKycApplication',
    GET_KYC : 'https://api.stage.zeta.in/zeta.in/zetauser/1.0/getKyc?userID=126911&token=U2xVRWR6OHI4UVdaQi9TeFVPOWljTFJmc1lhc1ozK1dwWG42V1dMSmhSSThKNXRRWWlJbytoWT06QVFGYy9La2tPOVpqeXE2dUJwNnRJWjA3U250eVFFQWVZc3hmUVFwZXg0RDNWU09rNTRvc3JGZXh4cnlRUUxCTXZoZEtmbjFVZHptN2hzRjJJVGxVZ0doOWdHMC82M1NhWHp5ZDFDMWlDeUJkM3QyeldFeFVGdXcyYktKcW16VTFDeDlZSVdvTEQ2ZFY1ODBkdFZ1cXEyWUV1SUZwSTRaditRPT0='
   };
  return KYC_URL[api];
};
 