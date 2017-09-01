var crypto = require('crypto'),
    // algorithm = 'aes-256-ctr',
    algorithm = 'aes-128-ecb',
    password = 'a-shared-secret!';
//password = 'd6F3Efeq';

function encrypt(text){
    var cipher = crypto.createCipher(algorithm,password)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    return crypted;
}

function decrypt(text){
    var decipher = crypto.createDecipher(algorithm,password)
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
    return dec;
}

var hw = encrypt("hello world")
// outputs hello world
console.log(decrypt(hw));

// console.log(decrypt("9+eoCGD56sNU4iCuyb2zwA=="));



// https://stackoverflow.com/questions/21038504/aes-128-ecb-inconsistent-encryption-result-of-node-js-and-java
// https://nodejs.org/api/crypto.html#crypto_crypto_createcipheriv_algorithm_key_iv_options
// https://crypto.stackexchange.com/questions/3965/what-is-the-main-difference-between-a-key-an-iv-and-a-nonce
