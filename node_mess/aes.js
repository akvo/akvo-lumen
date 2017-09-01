const crypto = require('crypto');
const decipher = crypto.createDecipher('aes-128', 'a password');

let decrypted = '';
decipher.on('readable', () => {
    const data = decipher.read();
    if (data)
        decrypted += data.toString('utf8');
});
decipher.on('end', () => {
    console.log(decrypted);
    // Prints: some clear text data
});

const encrypted =
      'ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504';
// const encrypted =
//       '9+eoCGD56sNU4iCuyb2zwA==';
decipher.write(encrypted, 'hex');
decipher.end();
