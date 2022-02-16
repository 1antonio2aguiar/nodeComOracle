module.exports = function(application){
    var oracledb = require('oracledb');
    let dbConfig = {user:"dbo_ccm_pessoas", 
                    password:"dbo_ccm_pessoas", 
                    connectString:"172.17.0.113/apolo"};
                    

    application.post('/empresasPessoasList', function(req, res){
        var query_select = ''; 
        var id_pessoa = 0;
        var idEmpresaPessoa = 0;

        var dados = req.body;
        id_pessoa = dados.id_pessoa;
        if(!id_pessoa){
            idEmpresaPessoa = dados.idEmpresaPessoa;
        };

        query_select = "select ep.id,ep.id_empresa,ep.id_pessoa,ep.vinculo,ep.participacao, tve.descricao vinculodesc, tppes.descricao tpempdesc, " +
        "emp.nome nmempresa, pes.nome nmpessoa, " +
        "SUBSTR(dpf.cpf,1,3)||'.'||SUBSTR(dpf.cpf,4,3)||'.'||SUBSTR(dpf.cpf,7,3)||'-'||SUBSTR(dpf.cpf,10,2) cpfCnpj " +
        "from empresas_pessoas ep, " +
        "tipos_vinculos_empresas tve, " +
        "tipos_pessoas tppes, " +
        "pessoas emp, " +
        "dados_pf dpf, " + 
        "pessoas pes " +
        "where ep.vinculo = tve.id and " +
        "ep.id_empresa = emp.id and " +
        "emp.id = dpf.pessoa and " +
        "ep.id_pessoa = pes.id and " +
        "emp.tipo_pessoa = tppes.id(+) and " + 
        ( id_pessoa ? " ep.id_pessoa = " + id_pessoa : " ep.id = " + idEmpresaPessoa) +
        
        " UNION " + 
        
        "select ep.id,ep.id_empresa,ep.id_pessoa,ep.vinculo,ep.participacao, " +
        "tve.descricao vinculodesc, tpemp.descricao tpempdesc, emp.nome nmempresa, pes.nome nmpessoa, " +
        "SUBSTR(dpj.cnpj,1,2)||'.'||SUBSTR(dpj.cnpj,3,3)||'.'||SUBSTR(dpj.cnpj,6,3)||'/'||SUBSTR(dpj.cnpj,9,4) ||'-'||SUBSTR(dpj.cnpj,13,2) cpfCnpj " +
        "from empresas_pessoas ep, " +
        "tipos_vinculos_empresas tve, " +
        "tipos_empresas tpemp, " +
        "pessoas emp, " +
        "dados_pj dpj, " +
        "pessoas pes " + 
        "where ep.vinculo = tve.id and " +
        "ep.id_empresa = emp.id and " +
        "emp.id = dpj.pessoa and " +
        "ep.id_pessoa = pes.id and " + 
        "dpj.tipo_empresa = tpemp.tipo_estabelecimento(+) and " +
        ( id_pessoa ? " ep.id_pessoa = " + id_pessoa : " ep.id = " + idEmpresaPessoa) ;

        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, [], function(error, result){
                res.send(result.rows);
            });
        };   
        run();     
    });

    application.post('/empresasPessoasModalSubmit', function(req, res){
        var dados = req.body;

        if(dados.modNewIdEmpresaPessoa != '' && dados.modNewIdEmpresaPessoa != null){
            var query_update = 'update empresas_pessoas set participacao = :participacao where id = :id';

            async function run(){ 
                var connOracleDb = await oracledb.getConnection(dbConfig)
                    connOracleDb.execute(query_update, { id: dados.modNewIdEmpresaPessoa, participacao: dados.modNewEmpParticipacao },
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

            var query_insert = 'insert into empresas_pessoas (id_empresa, id_pessoa, vinculo, participacao) ' +
                                'values (:id_empresa, :id_pessoa, :vinculo, :participacao)';

            async function run(){ 
                var connOracleDb = await oracledb.getConnection(dbConfig)
                    connOracleDb.execute(query_insert, { id_empresa: dados.modNewEmpIdEmpresa,
                    id_pessoa: dados.modNewEmpIdPessoa,
                    vinculo: dados.modNewEmpTipoVinculo,
                    participacao: dados.modNewEmpParticipacao},
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

    application.post('/empresasPessoasDelete', function(req, res){
        var dados = req.body;

        var query_delete = 'delete from empresas_pessoas where id = :id';

        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_delete, {id: dados.modDelIdEmpresaPessoa},
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
    
    application.get('/empresasPessoasModalNew', function(req, res){
        query_select = 'select id,descricao from tipos_vinculos_empresas';

        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, function(error, result){
                res.send(result.rows);
            });
        };
        run(); 
    });

    application.get('/empresasPessoasBuscaPorDocNome', function(req, res){

        tipoBusca = req.query.tipoBusca;
        nome      = req.query.nomePessoa;
        cpfCnpj   = req.query.cpfCnpj;

        if(tipoBusca == 'F'){
            query_select = "select p.nome, " +
            "SUBSTR(dpf.cpf,1,3)||'.'||SUBSTR(dpf.cpf,4,3)||'.'||SUBSTR(dpf.cpf,7,3)||'-'||SUBSTR(dpf.cpf,10,2) cpfCnpj, " + 
            "p.id " +
            "from pessoas p, dados_pf dpf " +
            "where dpf.pessoa = p.id and dpf.cpf = :cpf";
        } else {
            if(tipoBusca == 'J'){
                query_select = "select p.nome, " +
                "SUBSTR(dpj.cnpj,1,2)||'.'||SUBSTR(dpj.cnpj,3,3)||'.'||SUBSTR(dpj.cnpj,6,3)||'/'||SUBSTR(dpj.cnpj,9,4) ||'-'||SUBSTR(dpj.cnpj,13,2) cpfCnpj, " +  
                "p.id " +
                "from pessoas p, dados_pj dpj " +
                "where dpj.pessoa = p.id and dpj.cnpj = :cnpj";
            } else {
                query_select = "select p.nome, " +
                "SUBSTR(dpf.cpf,1,3)||'.'||SUBSTR(dpf.cpf,4,3)||'.'||SUBSTR(dpf.cpf,7,3)||'-'||SUBSTR(dpf.cpf,10,2) cpfCnpj, " + 
                "p.id " +
                "from pessoas p, dados_pf dpf " +
                "where dpf.pessoa = p.id and p.nome like upper('" + nome + "%') " + 
                "UNION " +
                "select p.nome, " + 
                "SUBSTR(dpj.cnpj,1,2)||'.'||SUBSTR(dpj.cnpj,3,3)||'.'||SUBSTR(dpj.cnpj,6,3)||'/'||SUBSTR(dpj.cnpj,9,4) ||'-'||SUBSTR(dpj.cnpj,13,2) cpfCnpj, " +  
                "p.id " +
                "from pessoas p, dados_pj dpj " +
                "where dpj.pessoa = p.id and p.nome like upper('" + nome + "%') " ;
             } 
        }
        
        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            if(tipoBusca == 'F' | tipoBusca == 'J'){
                connOracleDb.execute(query_select, [cpfCnpj], function(error, result){
                    res.send(result.rows);
                });
            } else {
                connOracleDb.execute(query_select, function(error, result){
                    res.send(result.rows);
                });
            };
        };
        run(); 
    });


};