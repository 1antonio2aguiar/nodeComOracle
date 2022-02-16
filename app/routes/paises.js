module.exports = function(application){
    var oracledb = require('oracledb');
    let dbConfig = {user:"dbo_ccm_pessoas", 
                    password:"dbo_ccm_pessoas", 
                    connectString:"172.17.0.113/apolo"};

    application.get('/paisesList', function(req, res){
        var query_select = ''; 
        var query_count  = '';
        var pagina = 0;
        var qtd_reg_por_pg = 14 ;
        var descricao = '';
        var filterDescricao = false;

        if (req.query.pagina) {
            pagina = req.query.pagina;
        } else {
            pagina = 1;
        }

        if (pagina > 1) {
            var inicio = ((pagina * qtd_reg_por_pg) - qtd_reg_por_pg + 1);
        } else {
            inicio = pagina;
        }

        var fim = (pagina * qtd_reg_por_pg);

        async function run() {
            var connOracleDb = await oracledb.getConnection(dbConfig)

            query_count = "select count(*) from paises p" 

            connOracleDb.execute(query_count, function(error, result) {
            var totalPages = result.rows;
            if(totalPages < 10){
                inicio = 1;
                fim = totalPages + 1 ;
            };

            query_select = "select * from (select topn.*, ROWNUM rnum from " +
            "( select * from paises order by nome ) topn where ROWNUM <= :fim ) where rnum  >= :inicio" ;

            connOracleDb.execute(query_select, {fim: fim, inicio: inicio}, function(error, result) {
                var paginator = {
                    page: pagina,
                    dispay: 2,
                    totalPages: totalPages,
                    descricao: descricao 
                };
                res.render("paises/paisesList", {paises : result ? result.rows : [],
                    paginator: pagination(paginator), 
                    metadata: paginator,
                    descricao: descricao  
                });
            });
            });
        };
        run();
    });
    
    application.get('/paisesNew', function(req, res){
        res.render("paises/paisesAdd")
    });

    application.post('/paisesSave', function(req, res){
        var dados = req.body;

        if(dados.modalPaisId == '' || dados.modalPaisId == '0'){
            async function run(){ var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute('insert into paises (nome,sigla,nacionalidade,codigo_inep)' +
            ' values (:nome,:sigla,:nacionalidade,:codigo_inep) ',
            {nome: dados.modalNome, sigla: dados.modalSigla, nacionalidade: dados.modalNacionalidade, codigo_inep: dados.modalCodigoInep},
            {autoCommit: true},      
                function(error, result){
                    if(error){
                        console.log(error);
                        res.send('Erro ao inserir em PAISES' + error)
                    }
                    res.send('Pais inserido com sucesso!');
                    //res.redirect('/cepsList');
                });
            };
            run(); 
        } else {
            var dados = req.body;

            async function run(){ 
                var query_select = "update paises set nome = :nome, sigla = :sigla, codigo_inep = :codigo_inep, nacionalidade = :nacionalidade where id = :id"

                var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_select, {id: dados.modalPaisId, nome: dados.modalNome, sigla: dados.modalSigla, codigo_inep: dados.modalCodigoInep, nacionalidade: dados.modalNacionalidade},
                {autoCommit: true},      
                function(error, result){
                    if(error){
                        console.log(error);
                        res.send('Erro ao alterar em PAíSES' + error)
                    }
                    res.send('País alterado com sucesso!');
                    //res.redirect('/cepsList');
                });
            };
            run(); 
        };
    });

    application.get('/paisesEdit', function(req, res){
        var id_pais = req.query.id;
        
        async function run(){ var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute('select * from paises where id = :id', [id_pais], function(error, result){
                res.send(result.rows);
            });
        };
        run(); 
    });

    application.delete('/paisesDelete', function(req, res){
    var id_pais = req.body;
    
    async function run(){ var connOracleDb = await oracledb.getConnection(dbConfig)
        connOracleDb.execute('delete from paises where id = :id', [id_pais.id],{autoCommit: true}, function(error, result){
            res.send('Item excluido com sucesso');
            });
        };
        run(); 
    });

    
    application.post('/paisesModalVisu', function(req, res){
    var dados = req.body;

        async function run(){ var connOracleDb = await oracledb.getConnection(dbConfig)
        connOracleDb.execute('select * from paises where id = :id' , [dados.id], function(error, result){
            res.send(result.rows);
            });
        };
        run(); 
    });
};

function pagination(paginator) {
    var html = "";

    var minPage = 0;
    var maxPage = 0;

    if ((paginator.page - 1) <= 0) {
        minPage = 1;
    } else {
        minPage = paginator.page - 1;
    }

    maxPage = minPage + 1;

    var iterator = 1;
    while(iterator < paginator.dispay) {
        if (maxPage < paginator.totalPages) {
            maxPage++
        }

        iterator++;
    }
    
    for (var i = minPage; i <= maxPage; i ++) {
        html += "<li class='page-item " + (i == paginator.page ? 'active' : '') + "'>";
            html += "<a class='btn btn-success btn-xs' href='/paisesList?pagina=" + i +
            "'>" + i + "</a>";
            "'>" + i + "</a>";
        html += "</li>";
    }
    return html;
}  