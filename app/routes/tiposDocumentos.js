module.exports = function(application){
    var oracledb = require('oracledb');
    let dbConfig = {user:"dbo_ccm_pessoas", 
                    password:"dbo_ccm_pessoas", 
                    connectString:"172.17.0.113/apolo"};

    application.get('/tiposDocumentosList', function(req, res){
        var query_select = ''; 
        var query_count  = '';
        var pagina = 0;
        var qtd_reg_por_pg = 14 ;

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
            query_count = 'select count(*) from tipos_documentos' ;

            connOracleDb.execute(query_count, function(error, result){
                var totalPages = result.rows;
                if(totalPages < 10){
                    inicio = 1;
                    fim = totalPages + 1 ;
                };

                query_select = 'select * from (select topn.*, ROWNUM rnum from ' +
                    '(select id,descricao from tipos_documentos order by id ' +
                    ') topn where ROWNUM <= :fim ) where rnum  >= :inicio' ;

                connOracleDb.execute(query_select, {fim: fim, inicio: inicio}, function(error, result) {
                    var paginator = {
                        page: pagina,
                        dispay: 2,
                        totalPages: totalPages,
                    };
                    res.render("tiposDocumentos/tiposDocumentosList", {tiposDocumentos : result ? result.rows : [],
                        paginator: pagination(paginator), 
                        metadata: paginator 
                    });
                });
            });
        };
        run();
    });

    application.post('/tiposDocumentosSave', function(req, res){
        var id        = req.body.id;
        var descricao = req.body.descricao;

        if(id == 0){
            var query_insert = 'insert into tipos_documentos (descricao) values (:descricao) ';

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
            var query_update = 'update tipos_documentos set descricao = :descricao where id = :id ';

            async function run(){ 
                var connOracleDb = await oracledb.getConnection(dbConfig)
                    connOracleDb.execute(query_update, { id: id, descricao: descricao },
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
        }
    });

    application.delete('/tiposDocumentosDelete', function(req, res){
    
        var id = req.body.id;

        var query_delete = 'delete from tipos_documentos where id = :id';

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
            html += "<a class='btn btn-success btn-xs' href='/tiposDocumentosList?pagina=" + i + 
            "'>" + i + "</a>";
        html += "</li>";
    }
    return html;
}