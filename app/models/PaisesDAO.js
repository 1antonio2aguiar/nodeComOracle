
let dbConfig = {user:"dbo_ccm_pessoas", password:"dbo_ccm_pessoas", connectString:"172.17.0.113/apolo"};
     
function PaisesDAO(conn){
	this._conn = conn;
	console.log('ta no DAO tete' + this._conn);
}

PaisesDAO.prototype.getPaises =  function(callback){
	async function run(){ var connOracleDb = await oracledb.getConnection(dbConfig)

		connOracleDb.execute('select * from paises where id = 2', function(error, result){
			res.send(result);
		});
		//run();
	}
	
}

PaisesDAO.prototype.getPais = function(id_pais, callback){
	this._connection.query('select * from paises where id = ' + id_pais.id , callback);
}

/*id_pais.prototype.salvarPais = function(pais,callback){
	this._connection.query('insert into paises set ?', pais, callback);
}*/

module.exports = function(){
	//console.log('tá no return');
	return PaisesDAO;
};