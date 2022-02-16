module.exports = function(application){
    var oracledb = require('oracledb');
    let dbConfig = {user:"dbo_ccm_pessoas", 
                    password:"dbo_ccm_pessoas", 
                    connectString:"172.17.0.113/apolo"};

    application.post('/pessoasProfissoesList', function(req, res){
        var query_select = ''; 
        var id_pessoa = 0;

        var dados = req.body;
        id_pessoa = dados.id_pessoa;

        query_select = 'select ppro.id, ppro.pessoa, ppro.profissao, pro.nome from ' +
        'pessoas_profissoes ppro, profissoes pro where ppro.profissao = pro.id(+) and  ppro.pessoa = :id';

        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, [id_pessoa], function(error, result){
                res.send(result.rows);
            });
        };   
        run();     
    });

    application.post('/pessoasProfissoesModalSubmit', function(req, res){
        var dados = req.body;

        var query_insert = 'insert into pessoas_profissoes (pessoa, profissao) ' +
                            'values (:pessoa, :profissao)';

        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_insert, { pessoa: dados.modNewIdPessoa,profissao: dados.modNewProfissao },
                {autoCommit: true},
                function(error, result){
                if(error){
                    console.log(error);
                };
                res.send(result);
            });
        };
        run(); 
    });

    application.post('/pessoasProfissoesModalDelete', function(req, res){
        var dados = req.body;

        var query_delete = 'delete from pessoas_profissoes where id = :id';

        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_delete, {id: dados.modalProfisDelId},
                {autoCommit: true},
                function(error, result){
                if(error){
                    console.log(error);
                };
                res.send(result);
            });
        };
        run();
    });

    application.get('/pessoasProfissoesModalNew', function(req, res){
        query_select = 'select id,nome from profissoes order by nome';

        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, function(error, result){
                res.send(result.rows);
            });
        };
        run(); 
    });
};