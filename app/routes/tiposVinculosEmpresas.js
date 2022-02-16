module.exports = function(application){
    var oracledb = require('oracledb');
    let dbConfig = {user:"dbo_ccm_pessoas", 
                    password:"dbo_ccm_pessoas", 
                    connectString:"172.17.0.113/apolo"};

    application.get('/tiposVinculoEmpresaList', function(req, res){
        var query_select = ""; 

        query_select = 'select id,descricao from tipos_vinculos_empresas order by id';

        async function run() {
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, function(error, result) {
                var paginator = {
                    page: 1,
                    dispay: 2,
                    totalPages: 10
                };

                res.render("tiposVinculosEmpresas/tiposVinculosEmpresasList", {tiposVinculosEmpresas : result ? result.rows : [],
                    paginator: pagination(paginator), 
                    metadata: paginator
                });
            });
        };
        run();
    });

    application.post('/tiposVinculoEmpresaSave', function(req, res){
        var id        = req.body.id;
        var descricao = req.body.descricao;

        if(id == 0){
            var query_insert = 'insert into tipos_vinculos_empresas (descricao) values (:descricao) ';

            async function run(){ 
                var connOracleDb = await oracledb.getConnection(dbConfig)
                    connOracleDb.execute(query_insert,{descricao: descricao},{autoCommit: true},
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
            var query_update = 'update tipos_vinculos_empresas set descricao = :descricao where id = :id ';

            async function run(){ 
                var connOracleDb = await oracledb.getConnection(dbConfig)
                    connOracleDb.execute(query_update, {id: id, descricao: descricao},{autoCommit: true},
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
        }
    });

    application.delete('/tiposVinculoEmpresaDelete', function(req, res){
    
        var id = req.body.id;

        var query_delete = 'delete from tipos_vinculos_empresas where id = :id';

        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_delete, {id: id},
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

    application.post('/tiposVinculoEmpresaModalVisu', function(req, res){
        var dados = req.body;
        query_select = 'select id,descricao from tipos_vinculos_empresas where id = :id ';
        async function run() {
        var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, [dados.id], function(error, result) {
                res.send( result.rows );
            });
        };
        run();
    });

};

function pagination(paginator) {

    //console.log('pagina ' + paginator.page + ' total pg ' + paginator.totalPages)

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
            html += "<a class='btn btn-success btn-xs' href='/titulosPatentesList?pagina=" + i + 
            (paginator.descricao ? ("&inputDescricao=" + paginator.descricao) : "") + 
            "'>" + i + "</a>";
            "'>" + i + "</a>";
        html += "</li>";
    }
    return html;
}