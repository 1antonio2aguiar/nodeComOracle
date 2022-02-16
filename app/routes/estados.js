module.exports = function(application){
    var oracledb = require('oracledb');
    let dbConfig = {user:"dbo_ccm_pessoas", 
                    password:"dbo_ccm_pessoas", 
                    connectString:"172.17.0.113/apolo"};

    application.get('/estadosList', function(req, res){
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
            query_count = 'select count(*) from estados' ;

            connOracleDb.execute(query_count, function(error, result){
                var totalPages = result.rows;
                if(totalPages < 10){
                    inicio = 1;
                    fim = totalPages + 1 ;
                };

                query_select = 'select * from (select topn.*, ROWNUM rnum from ' +
                    '(select e.id,e.nome nmestado,e.sigla,p.nome nmpais,e.codigo_inep from estados e, paises p where e.pais' +
                    ' = p.id order by p.nome,e.nome ) topn where ROWNUM <= :fim ) where rnum  >= :inicio' ;

                connOracleDb.execute(query_select, {fim: fim, inicio: inicio}, function(error, result) {
                    var paginator = {
                        page: pagina,
                        dispay: 2,
                        totalPages: totalPages,
                    };
                    res.render("estados/estadosList", {estados : result ? result.rows : [],
                        paginator: pagination(paginator), 
                        metadata: paginator 
                    });
                });
            });
        };
        run();
    });

    application.post('/estadosSave', function(req, res){
        dados = req.body;
        id = dados.modalId;

        if(id == 0){
            var query_insert = 'insert into estados (pais, nome, sigla, codigo_inep) values (:pais, :nome, :sigla, :codigo_inep)';

            async function run(){ 
                var connOracleDb = await oracledb.getConnection(dbConfig)
                    connOracleDb.execute(query_insert,
                    {pais: dados.modalPais, nome: dados.modalNmEstado, 
                    sigla: dados.modalSigla, codigo_inep: dados.modalCodigoInep},
                    {autoCommit: true},
                    function(error, result){
                    if(error){
                        console.log('Erro ao inserir estado. ' + error);
                        res.send(error);
                    }else{
                        res.send( result );
                    };
                });
            };
            run(); 
        } else {
            var query_update = 'update estados set nome = :nome, sigla = :sigla, codigo_inep = :codigo_inep where id = :id ';

            async function run(){ 
                var connOracleDb = await oracledb.getConnection(dbConfig)
                    connOracleDb.execute(query_update, {id: id, nome: dados.modalNmEstado, 
                    sigla: dados.modalSigla, codigo_inep: dados.modalCodigoInep},
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

    application.post('/estadosEdit', function(req, res){
        var id_estado = req.body.id;

        async function run(){

            // Estados
            var query_select = 'select e.id,e.nome nmestado,e.sigla,p.nome nmpais,e.codigo_inep,p.id ' +
            'from estados e, paises p where e.pais = p.id and e.id = :id' ;

            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select,[id_estado],function(error, result){
                var estado = result.rows;
                res.send(estado);
            });
        }
        run();
    });
    
    application.delete('/estadosDelete', function(req, res){
    
        var id = req.body.id;

        var query_delete = 'delete from estados where id = :id';

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

    application.post('/paisesLista', function(req, res){

        var query_select = 'select id, nome, sigla, codigo_inep, nacionalidade from paises order by nome';

        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, function(error, result) {
                res.send({paises : result ? result.rows : []
                });
            });
        };
        run();
    });

    application.get('/estadosLista', function(req, res){
        var id_pais = req.query.pais;

        var query_select = 'select id, nome, sigla, codigo_inep from estados where pais = :pais order by nome';

        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select,{pais: id_pais}, function(error, result) {
                res.send({estados : result ? result.rows : []});
            });
        };
        run();
    });

    application.post('/tiposLogradourosModalVisu', function(req, res){
        var dados = req.body;
        query_select = 'select id,descricao,sigla from tipos_logradouros where id = :id ';
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
            html += "<a class='btn btn-success btn-xs' href='/estadosList?pagina=" + i + 
            "'>" + i + "</a>";
        html += "</li>";
    }
    return html;
}