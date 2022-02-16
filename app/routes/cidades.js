const { query } = require('express');

module.exports = function(application){
    var oracledb = require('oracledb');
    let dbConfig = {user:"dbo_ccm_pessoas", 
                    password:"dbo_ccm_pessoas", 
                    connectString:"172.17.0.113/apolo"};

    application.get('/cidadesList', function(req, res){
        var filterCidade = false;
        var filterEstado = false;
        var idEstado = 0;
        var nomeCidade = "";
        var query_select = ''; 
        var query_count  = '';
        var pagina = 0;
        var totalPages = 0;
        var qtd_reg_por_pg = 14 ;

        dados = req.query;

        if(dados.idEstado){
            if(dados.idEstado != -1){
                idEstado = dados.idEstado;
                filterEstado = true;
            };
        };

        if (dados.nomeCidade) {
            nomeCidade = dados.nomeCidade;
            filterCidade = true;
        }; 

        if (dados.pagina) {
            pagina = dados.pagina;
        } else {
            pagina = 1;
        };

        if (pagina > 1) {
            var inicio = ((pagina * qtd_reg_por_pg) - qtd_reg_por_pg + 1);
        } else {
            inicio = pagina;
        };
        
        var fim = (pagina * qtd_reg_por_pg);

        async function run() {
            var connOracleDb = await oracledb.getConnection(dbConfig)

            query_count = "select count(cid.id) from cidades cid, estados est where cid.estado = est.id " + 
            (filterEstado ? "and cid.estado = " + idEstado : '') + 
            (filterCidade ? "and cid.nome like upper('" + nomeCidade + "%')" : '');

            connOracleDb.execute(query_count, function(error, result){
                totalPages = result.rows;
                if(totalPages < 14){
                    inicio = 1;
                    fim = totalPages + 1 ;
                }
            });

            query_select = 'select id,nome from estados where pais = 1';

            connOracleDb.execute(query_select, function(error, result){
                estados = result.rows;

                query_select = "select * from (select topn.*, ROWNUM rnum from " +
                "(select cid.id, cid.nome cidade,cid.sigla, est.nome estado, cid.codigo_sicom,cid.codigo_ibge,cid.codigo_inep " + 
                "from cidades cid, estados est where cid.estado = est.id " + 
                (filterEstado ? "and cid.estado = " + idEstado : '') + 
                (filterCidade ? " and cid.nome like upper('" + nomeCidade+ "%')" : '') + " order by cid.nome asc ) topn " +
                " where ROWNUM <= :fim ) where rnum  >= :inicio " ;

                connOracleDb.execute(query_select,
                {fim: fim, inicio: inicio}, function(error, result){
                    var paginator = {
                        page: pagina,
                        dispay: 2,
                        totalPages: totalPages,
                        idEstado: idEstado,
                        nomeCidade: req.query.nomeCidade
                    };

                    res.render("cidades/cidadesList", {cidades : result ? result.rows : [],  
                        paginator: pagination(paginator), 
                        estados: estados ? estados : [],
                        metadata: paginator, 
                        idEstado: idEstado,
                        nomeCidade: nomeCidade
                    });
                });
            });
        };
        run(); 
    });
    
    application.post('/cidadesSave', function(req, res){
        dados = req.body;
        var id = dados.modalId;

        if(id == 0){
            var query_insert = 'insert into cidades (estado, nome, sigla, codigo_sicom, codigo_ibge, codigo_inep) ' + 
            'values (:estado, :nome, :sigla, :codigo_sicom, :codigo_ibge, :codigo_inep)';

            async function run(){ 
                var connOracleDb = await oracledb.getConnection(dbConfig)
                    connOracleDb.execute(query_insert,
                    {estado: dados.modalEstado, 
                    nome: dados.modalNmCidade, 
                    sigla: dados.modalSigla, 
                    codigo_sicom: dados.modalCodigoSicom,
                    codigo_ibge: dados.modalCodigoIbge,
                    codigo_inep: dados.modalCodigoInep},
                    {autoCommit: true},
                    function(error, result){
                    if(error){
                        console.log('Erro ao inserir cidade. ' + error);
                        res.send(error);
                    }else{
                        res.send( result );
                    };
                });
            };
            run(); 
        } else {
            var query_update = 'update cidades set nome = :nome, sigla = :sigla, ' +
            'codigo_sicom = :codigo_sicom, codigo_ibge = :codigo_ibge, codigo_inep = :codigo_inep ' +
            'where id = :id ';

            async function run(){ 
                var connOracleDb = await oracledb.getConnection(dbConfig)
                    connOracleDb.execute(query_update, {id: id, 
                    nome: dados.modalNmCidade, 
                    sigla: dados.modalSigla, 
                    codigo_sicom: dados.modalCodigoSicom,
                    codigo_ibge: dados.modalCodigoIbge,
                    codigo_inep: dados.modalCodigoInep},
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
        };
    });

    application.post('/cidadesEdit', function(req, res){
        var id_cidade = req.body.id;

        async function run(){

            // Cidades
            query_select = 'select c.id idcidade, c.estado, c.nome nmcidade, c.sigla, c.codigo_sicom, ' +
            'c.codigo_ibge, c.codigo_inep, e.id idestado, e.nome nmestado, p.id idpais, p.nome nmpais ' +
            'from cidades c, estados e, paises p '+ 
            'where c.estado = e.id and e.pais = p.id and c.id = :id' ;

            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select,[id_cidade],function(error, result){
                var cidade = result.rows;
                res.send(cidade);
            });
        }
        run();
    });

    application.get('/paisesEstadosBusca', function(req, res){

        // paises/estados
        query_select = 'select p.id idpais,p.nome nmpais, e.id idestado, e.nome nmestado from paises p, estados e where e.pais(+) = p.id' ;
                    
        async function run(){

            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select,function(error, result){
                var paisesEstados = result.rows;
                res.send(paisesEstados);
            });
        }
        run();
    });

    application.delete('/cidadesDelete', function(req, res){
        var dados = req.body;
        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute('delete from cidades where id = :id', [dados.id],
                {autoCommit: true}, function(error, result){
                if(error){
                    console.log('Erro ao exluir item ' + error);
                    res.send('Erro ao exluir item ');
                } else{
                    res.send('Item excluido com sucesso');
                };
            });
        };
        run(); 
    }); 
}

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
            html += "<a class='btn btn-success btn-xs' href='/cidadesList?pagina=" + i + 
            (paginator.idEstado ? ("&idEstado=" + paginator.idEstado) : "") + 
            (paginator.nomeCidade ? ("&nomeCidade=" + paginator.nomeCidade) : "") + "'>" + i + "</a>";
        html += "</li>";
    }

    return html;
} 
