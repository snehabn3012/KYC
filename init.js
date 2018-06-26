var asd = require('./index.js');
var req = {
    source : 'ZoW',
    userid : 126911,
    token  : 'NFcveWFuRnBRSmVIeFVYUzRjejltWmRQVDAvczNweHpzVFgxdVA5bGZoWDFQYlIrVndzQy9GNXowVjA9OkFRSGZEck9DdHBMNk1oN01XWkNnWlFWcE9xWG5qSUZQMTJmRG9hTWFxVEZvUDZvaUhWOEhiT1l0UzBUSVNwZklScUxVaUhOei9VMjB4R1o1WGRYWE1DUFpqUE12eVNqVzJjTzRjaFUwdlZyMDlUa3NieWMrbzdQRzV5dEtDbldKVmRZQng1S2I4UjFQZlpSQ3hMVGdaOE5aMHRnWXkvUE9pRDZObUJUblNnPT0='
}
asd.init(req).then(function(res) {
    console.log('res', res);
    initiateMinKyc = asd.initiateMinKyc();
    console.log('aa', initiateMinKyc);
});