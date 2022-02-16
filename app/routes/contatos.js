module.exports = function(application){
    var oracledb = require('oracledb');
    let dbConfig = {user:"dbo_ccm_pessoas", 
                    password:"dbo_ccm_pessoas", 
                    connectString:"172.17.0.113/apolo"};

    application.post('/contatosList', function(req, res){
        var query_select = ''; 
        var id_pessoa = 0;

        var dados = req.body;
        id_pessoa = dados.id_pessoa;

        query_select = 'select con.id, con.tipo_contato, con.contato, tpcon.descricao from ' +
        'contatos con, tipos_contatos tpcon where con.tipo_contato = tpcon.id(+) and  con.pessoa = :id';

        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, [id_pessoa], function(error, result){
                res.send(result.rows);
            });
        };   
        run();     
    });

    application.post('/contatosModalSubmit', function(req, res){
        var dados = req.body;

        if(dados.modNewIdContato != '' && dados.modNewIdContato != null){
            var query_update = 'update contatos set contato = :contato where id = :id';

            async function run(){ 
                var connOracleDb = await oracledb.getConnection(dbConfig)
                    connOracleDb.execute(query_update, { id: dados.modNewIdContato, contato: dados.modDocNewContato },
                    {autoCommit: true},
                    function(error, result){
                    if(error){
                        console.log(error);
                        res.send(error);
                    }else{
                        res.send( result );
                    };
                });
            };
            run(); 

        } else {

            var query_insert = 'insert into contatos (pessoa, tipo_contato, contato) ' +
                                'values (:pessoa, :tipo_contato, :contato)';

            async function run(){ 
                var connOracleDb = await oracledb.getConnection(dbConfig)
                    connOracleDb.execute(query_insert, { pessoa: dados.modNewIdPessoa,
                    tipo_contato: dados.modNewTipoContato, contato: dados.modDocNewContato },
                    {autoCommit: true},
                    function(error, result){
                    if(error){
                        console.log(error);
                    };
                    res.send(result);
                });
            };
            run(); 
        }
    });

    application.post('/contatoModalDelete', function(req, res){
        var dados = req.body;

        var query_delete = 'delete from contatos where id = :id';

        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_delete, {id: dados.modContatoDelId},
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

    application.get('/contatosModalNew', function(req, res){
        query_select = 'select id,descricao from tipos_contatos';

        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, function(error, result){
                res.send(result.rows);
            });
        };
        run(); 
    });
};