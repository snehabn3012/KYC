exports.CURR_ENV = function () {
    //return window.location.hostname === 'localhost' || window.location.host.indexOf('stage') > -1 ? 'STAGE' : window.location.host.indexOf('-pp') > -1 ? 'PREPROD' : 'PROD';
    return 'STAGE';
};
  