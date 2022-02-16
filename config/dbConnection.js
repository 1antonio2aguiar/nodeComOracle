/* importar o oracledb */
//console.log('ta no connect');
var oracledb = require('oracledb');
var dbConfig = {user:"dbo_ccm_pessoas", password:"dbo_ccm_pessoas", connectString:"172.17.0.113/apolo"};

async function run(){ var connection = await oracledb.getConnection(dbConfig)
     return connection;
 }
 run();


/*var oracledb = require('oracledb');  

oracledb.getConnection({  
    user: "dbo_ccm_pessoas",  
    password: "dbo_ccm_pessoas",  
    connectString: "172.17.0.113/apolo"  
}, function(err, connection) {  
    if (err) {  
         console.error(err.message);  
         return;  
    }  
    connection.execute( "SELECT nome,estado FROM cidades ",  
    [],  
    function(err, result) {  
         if (err) {  
              console.error(err.message);  
              doRelease(connection);  
              return;  
         }  
         console.log(result.metaData);  
         console.log(result.rows);  
         doRelease(connection);  
    });  
});  

function doRelease(connection) {  
    connection.release(  
         function(err) {  
              if (err) {console.error(err.message);}  
         }  
    );  
}  */


/*(async function() {
try{
   connection = await oracledb.getConnection({
        user : 'dbo_ccm_pessoas',
        password : 'dbo_ccm_pessoas',
        connectString : '172.17.0.113/apolo'
   });
   console.log("Successfully connected to Oracle!")
} catch(err) {
    console.log("Error: ", err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch(err) {
        console.log("Error when closing the database connection: ", err);
      }
    }
  }
})()*/