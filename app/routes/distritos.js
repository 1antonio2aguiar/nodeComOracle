module.exports = function(application){
    var oracledb = require('oracledb');
    let dbConfig = {user:"dbo_ccm_pessoas", 
                    password:"dbo_ccm_pessoas", 
                    connectString:"172.17.0.113/apolo"};

    application.get('/distritosList', function(req, res){
        var filter = false;
        var nomeCidade = "";

        if (req.query.nomeCidade) {
            nomeCidade = req.query.nomeCidade;
            filter = true;
        } 

        if (req.query.pagina) {
            pagina = req.query.pagina;
        } else {
            pagina = 1;
        }

        var qtd_reg_por_pg = 10 ;
        if (pagina > 1) {
            var inicio = (pagina * qtd_reg_por_pg) - qtd_reg_por_pg;
        } else {
            inicio = pagina;
        }
        
        var fim = (pagina * qtd_reg_por_pg);

        //console.log('inicio '+ inicio + ' fim ' + fim);

        async function run() {
            var connOracleDb = await oracledb.getConnection(dbConfig)

            var query_count = "select count(*) from distritos dis, cidades cid where dis.cidade = cid.id" +
                               (filter ? " and cid.nome like upper('" + nomeCidade + "%')" : ''); 

            connOracleDb.execute(query_count, function(error, result){
                totalPages = result.rows;
                if(totalPages < 10){
                    inicio = 1;
                    fim = totalPages + 1 ;
                }

                var query_select = "select * from (select topn.*, ROWNUM rnum from " +
                    "(select dis.id,dis.nome nome_distrito,dis.codigo_inep,dis.cidade, " +
                    "cid.nome nome_cidade from distritos dis, cidades cid where dis.cidade = cid.id " +
                    (filter ? " and cid.nome like upper('" + nomeCidade + "%')" : '') + " order by cid.nome, dis.nome " +
                    " ) topn where ROWNUM <= :fim ) where rnum  >= :inicio " ;

                connOracleDb.execute(query_select,{fim: fim, inicio: inicio}, function(error, result){
                    var paginator = {
                        page: pagina,
                        dispay: 2,
                        totalPages: totalPages,
                        nomeCidade: req.query.nomeCidade
                    };

                    res.render("distritos/distritosList", {distritos : result ? result.rows : [], 
                        paginator: pagination(paginator), 
                        metadata: paginator, 
                        nomeCidade: nomeCidade
                    });
                    //res.send(result.rows);
                });
            });
        };
        run();
    });

    application.get('/distritosNew', function(req, res){
        async function run() {

            var query_select = "select cid.id,cid.nome,est.sigla from cidades cid, estados est " +
            "where cid.estado = est.id order by cid.nome"

            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, function(error, result){
                res.render("distritos/distritosNew", {cidades : result.rows});
                //res.send(result.rows);
            });
        };
        run();
    });

    application.post('/distritosSave', function(req, res){
        var dados = req.body;
        //console.log(dados);
        async function run(){ var connOracleDb = await oracledb.getConnection(dbConfig)
        connOracleDb.execute('insert into distritos (cidade,nome,codigo_inep)' +
          ' values (:cidade,:nome,:codigo_inep) ',
          {cidade: dados.cidade, nome: dados.nome, codigo_inep: dados.codigo_inep},
          {autoCommit: true},      
            function(error, result){
                if(error){
                console.log(error);
                }
                res.redirect("/distritosList");
            });
        };
        run();
    });

    application.get('/distritosEdit', function(req, res){
        var id_distrito = req.query;
        async function run(){ 
            
            var query_select = "select cid.id,cid.nome,est.sigla from cidades cid, estados est " +
            "where cid.estado = est.id order by cid.nome"
            
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, function(error, result){
                var cidades = result.rows

                query_select = "select dis.id, dis.cidade, dis.nome, dis.codigo_inep, cid.id from distritos dis, " +
                "cidades cid where dis.cidade = cid.id and dis.id = :id" ;
            
                connOracleDb.execute(query_select ,[id_distrito.id_distrito], function(error, result){
                    res.render("distritos/distritosEdit", {cidades: cidades, distrito : result.rows});
                });
            });
        };
        run(); 
    });

    application.post('/distritosUpdate', function(req, res){
        var dados = req.body;
    
        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)

            var query_select = "update distritos set cidade = :cidade, nome = :nome, codigo_inep = :codigo_inep where id = :id"

            connOracleDb.execute(query_select, {id: dados.id, cidade: dados.cidade, nome: dados.nome, codigo_inep: dados.codigo_inep},
            {autoCommit: true},      
            function(error, result){
                if(error){
                console.log(error);
                }
                res.redirect("/distritosList");
            });
        };
        run(); 
    });

    application.get('/distritosSearch', function(req, res){
  
        var id_distrito = req.query;

        var query_select = "select cid.nome, dis.nome, dis.codigo_inep from distritos dis, cidades cid " +
                        "where dis.cidade = cid.id and dis.id = :id";
        
        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select,[id_distrito.id_distrito], function(error, result){
            res.render("distritos/distritosSearch", {distrito : result.rows});
            //res.send(result.rows);
          });
        };
        run(); 
    });

    application.post('/distritosModalVisu', function(req, res){
     
        var dados = req.body;

        var query_select = "select id,nome from distritos where id = :id";
    
        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_select, [dados.id], function(error, result){
                res.send(result.rows);
            });
        };
        run();
    });

    application.delete('/distritosDelete', function(req, res){
        var dados = req.body;
        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute('delete from distritos where id = :id', 
                [dados.id],{autoCommit: true}, function(error, result){
                res.send('Item excluido com sucesso');
            });
        };
        run(); 
    });

    application.get('/distritos', function(req, res){
        var cidade = req.query.cidade;

        var query_select = "select dis.id, dis.nome, est.sigla from cidades cid, distritos dis, " +
        "estados est where cid.id = dis.cidade and est.id = cid.estado and cid.id  = :cidade";
        
        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select,[cidade], function(error, result){
                res.send(result.rows);
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
            html += "<a class='btn btn-success btn-xs' href='/distritosList?pagina=" + i + 
            (paginator.nomeCidade ? ("&nomeCidade=" + paginator.nomeCidade) : "") + "'>" + i + "</a>";
        html += "</li>";
    }

    
    return html;
}