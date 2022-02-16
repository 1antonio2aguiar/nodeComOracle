module.exports = function(application){
    var oracledb = require('oracledb');
    let dbConfig = {user:"dbo_ccm_pessoas", 
                    password:"dbo_ccm_pessoas", 
                    connectString:"172.17.0.113/apolo"};

    application.get('/cartoriosList', function(req, res){
        var query_select = ""; 

        query_select = 'select car.id, car.pessoa, pes.nome, dpj.cnpj from cartorios car, pessoas pes, dados_pj dpj ' +
        'where car.pessoa = pes.id and pes.id = dpj.pessoa(+) order by id';

        async function run() {
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, function(error, result) {

                for (var i = 0 ; i < result.rows.length; i++) {
                    result.rows[i][3] = formataCNPJ(result.rows[i][3]);
                }
                res.render("cartorios/cartoriosList", {cartorios: result ? result.rows : []});
            });
        };
        run();
    });     
    
    application.get('/cartoriosNew', function(req, res){
        res.render("cartorios/cartoriosNew")
    });

    application.post('/cartoriosSave', function(req, res){
        var pessoa    = req.body.inputIdCartorio;

        var query_insert = 'insert into cartorios (pessoa) values (:pessoa) ';

            async function run(){ 
                var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_insert,{pessoa: pessoa},{autoCommit: true},
                function(error, result){
                if(error){
                    console.log(error);
                    res.send(error);
                }else{
                    res.redirect("/cartoriosList");
                };
            });
        };
        run(); 
    });

    application.post('/cartoriosModalVisu', function(req, res){

        var dados = req.body;

        query_select = 'select car.id, car.pessoa, pes.nome, dpj.cnpj from cartorios car, pessoas pes, dados_pj dpj ' +
        'where car.pessoa = pes.id and pes.id = dpj.pessoa(+) and car.id = :id';

        async function run(){ var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select , [dados.id], function(error, result){
                res.send(result.rows);
            });
        };
        run(); 
    });

    application.delete('/cartorioDelete', function(req, res){
        var id = req.body;

        query_delete = 'delete from cartorios car where car.id = :id';
        
        async function run(){ var connOracleDb = await oracledb.getConnection(dbConfig)
        connOracleDb.execute(query_delete , [id.id],{autoCommit: true},
            function(error, result){
                if(error){
                    console.log(error);
                    res.send(error);
                }else{
                    res.send();
                };
            });
        };
        run(); 
    });

    application.get('/cartoriosSearch', function(req, res){

        query_select = 'select car.id, car.pessoa, pes.nome, dpj.cnpj from cartorios car, pessoas pes, dados_pj dpj ' +
        'where car.pessoa = pes.id and pes.id = dpj.pessoa';

        async function run(){ var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select , function(error, result){
                res.send(result.rows);
            });
        };
        run(); 
    });

};

function formataCNPJ(cnpj) {
    cnpjMasc = String(Number(cnpj))

    if (cnpjMasc != undefined) {
        if (cnpjMasc.length <= 14) { //CNPJ
            cnpjMasc = cnpjMasc.replace( /\D/g , ""); //Remove tudo o que não é dígito
            cnpjMasc = cnpjMasc.replace( /^(\d{2})(\d)/ , "$1.$2"); //Coloca ponto entre o segundo e o terceiro dígitos
            cnpjMasc = cnpjMasc.replace( /^(\d{2})\.(\d{3})(\d)/ , "$1.$2.$3"); //Coloca ponto entre o quinto e o sexto dígitos
            cnpjMasc = cnpjMasc.replace( /\.(\d{3})(\d)/ , ".$1/$2"); //Coloca uma barra entre o oitavo e o nono dígitos
            cnpjMasc = cnpjMasc.replace( /(\d{4})(\d)/ , "$1-$2"); //Coloca um hífen depois do bloco de quatro dígitos
            
            return cnpjMasc;
        }
    }
}