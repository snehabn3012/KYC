var Env = require('./Env');

var CURRENT_ENV = Env.CURR_ENV;

var BASE_URL = {
  STAGE: 'https://api.stage.zeta.in/zeta.in',
  PREPROD:'https://api.preprod.zeta.in/zeta.in',
  PROD: 'https://api.gw.zetapay.in/zeta.in'
};

 exports.getAPI = function(api) {
   var KYC_URL = {
    GET_IFI_SPECIFIC_APPLN : 'https://api.stage.zeta.in/zeta.in/app-portal/1.0/getIfiSpecificKycApplication?userId=155757&ifi=141618&token=NFcveWFuRnBRSmVIeFVYUzRjejltWmRQVDAvczNweHpzVFgxdVA5bGZoWDFQYlIrVndzQy9GNXowVjA9OkFRSGZEck9DdHBMNk1oN01XWkNnWlFWcE9xWG5qSUZQMTJmRG9hTWFxVEZvUDZvaUhWOEhiT1l0UzBUSVNwZklScUxVaUhOei9VMjB4R1o1WGRYWE1DUFpqUE12eVNqVzJjTzRjaFUwdlZyMDlUa3NieWMrbzdQRzV5dEtDbldKVmRZQng1S2I4UjFQZlpSQ3hMVGdaOE5aMHRnWXkvUE9pRDZObUJUblNnPT0=',
    GET_KYC : 'https://api.stage.zeta.in/zeta.in/zetauser/1.0/getKycV2'
   };
  return KYC_URL[api];
};
 