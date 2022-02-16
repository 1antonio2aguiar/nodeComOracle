function cidadesDAO(connection){
	this._connection = connection;
}

cidadesDAO.prototype.getCidades = function(callback){

    var oracledb = require('oracledb');
    var dbConfig = {user:"dbo_ccm_pessoas", password:"dbo_ccm_pessoas", connectString:"172.17.0.113/apolo"};

    console.log('ta no DAO');

    async function run() {var connOracleDb = await oracledb.getConnection(dbConfig)
        connOracleDb.execute('select count(*) from cidades', function(error, result){
            res.send(result.rows);
            return result;
          });   
    };
    run();
};