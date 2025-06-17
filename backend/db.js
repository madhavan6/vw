const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: '46.28.44.5',
  user: 'vwSrv',
  password: 'Bgt56yhN@',
  database: 'vwSrv',
  port: 3306
});

module.exports = db;



