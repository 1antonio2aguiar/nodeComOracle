module.exports = function(application){
    var oracledb = require('oracledb');
    let dbConfig = {user:"dbo_ccm_pessoas", 
                    password:"dbo_ccm_pessoas", 
                    connectString:"172.17.0.113/apolo"};
    var rowsCep = 0;


    application.get('/cepsList', function(req, res){ 
        var query_select     = "";  
        var filterCidade     = false;
        var filterLogradouro = false;
        var filterCep        = false;
        var nmLogradouro   = "";
        var nmCidade         = "";
        var query_count      = 0;
        var pagina           = 0;
        var cep             = null; 

        var dados = req.query;

        if (dados.inputCidade) {
            nmCidade = dados.inputCidade;
            filterCidade = true;
        };

        if (dados.inputNomeLogradouro) {
            nmLogradouro = dados.inputNomeLogradouro;
            filterLogradouro = true;
        };
        
        if (dados.inputCep) {
            // retira os (.) e (-) do código do cep
            cep = dados.inputCep.normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z])/g, '');
            filterCidade = false;
            filterLogradouro = false;
            filterCep = true;
        } ;
        

        if (dados.pagina) {
            pagina = dados.pagina;
        } else {
            pagina = 1;
        }

        var qtd_reg_por_pg = 14 ;
        if (pagina > 1) {
            var inicio = ((pagina * qtd_reg_por_pg) - qtd_reg_por_pg + 1);
        } else {
            inicio = pagina;
        }
        
        var fim = (pagina * qtd_reg_por_pg);

        async function run() {
            var connOracleDb = await oracledb.getConnection(dbConfig)

            query_count = "select count(*) from ceps cep,logradouros logr, bairros bai, distritos dis, cidades cid " +
                        "where cep.logradouro = logr.id and cep.bairro     = bai.id and logr.distrito   = dis.id and " +
                        "dis.cidade     = cid.id " +
                        ( filterCidade ? " and cid.nome like upper('" + nmCidade + "%') " : '') +
                        ( filterCep    ? "and cep.cep = " + cep : '') +
                        ( filterLogradouro ? " and logr.nome like upper('" + nmLogradouro + "%')" : '');
            
            connOracleDb.execute(query_count, function(error, result){
                var totalPages = result.rows;
                if(totalPages < 10){
                    inicio = 1;
                    fim = totalPages + 1 ;
                }

                query_select = "select cid.id,cid.nome,est.sigla from cidades cid, estados est " +
                                "where cid.estado = est.id order by cid.nome";

                connOracleDb.execute(query_select, function(error, result){
                    cidades = result.rows;

                    query_select = "select * from (select topn.*, ROWNUM rnum from " +
                    "(select cep.id,cid.id idCidade,cep.logradouro idLograd, " +
                    "SUBSTR(cep.cep,1,2)||'.'||SUBSTR(cep.cep,3,3)||'-'||SUBSTR(cep.cep,6,3) cep_formatado, " +
                    "cep.numero_ini,cep.numero_fim,cep.identificacao, " +
                    "cid.nome nmCidade,dis.nome nmDistrito,bai.nome nmBairro,logr.nome nmLograd, dis.id idDistrito, tplograd.sigla " +
                    "from ceps cep,logradouros logr, bairros bai, distritos dis, cidades cid, tipos_logradouros tplograd " +
                    "where cep.logradouro = logr.id and cep.bairro = bai.id and logr.distrito = dis.id and dis.cidade = cid.id and logr.tipo_logradouro = tplograd.id " + 
                    ( filterCidade ? " and cid.nome like upper('" + nmCidade + "%') " : '') + 
                    ( filterCep    ? "and cep.cep = " + cep : '') +
                    ( filterLogradouro ? " and logr.nome like upper('" + nmLogradouro + "%')" : "") +
                    " ) topn where ROWNUM <= :fim ) where rnum  >= :inicio ";

                    connOracleDb.execute(query_select,{fim: fim, inicio: inicio}, function(error, result){
                        var paginator = {
                            page: pagina,
                            dispay: 2,
                            totalPages: totalPages,
                            nomeCidade: nmCidade,
                            nomeLogradouro: nmLogradouro,
                            cep: cep
                        };

                        res.render("ceps/cepsList", {ceps : result ? result.rows : [], 
                            paginator: pagination(paginator), 
                            metadata: paginator, 
                            cidades: cidades,
                            nomeCidade: nmCidade,
                            nomeLogradouro: nmLogradouro 
                        });
    
                        //res.send(result.rows);
                    });
                });
            });
        }
        run();
    });

    application.get('/cepsNew', function(req, res){

        var identificacao = [
            {"value": "A", display: "A", selected: false},
            {"value": "D", display: "Direita",selected: false},
            {"value": "E", display: "Esquerda",selected: false},
            {"value": "I", display: "Impar",selected: false},
            {"value": "P", display: "par",selected: false},
            {"value": "U", display: "Unico",selected: false}
        ];

        async function run() {

            query_select = "select cid.id,cid.nome,est.sigla from cidades cid, estados est " +
            "where cid.estado = est.id order by cid.nome"

            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, function(error, result){
                cidades = result.rows;
                res.send({ cidades: cidades, identificacao: identificacao });
            });
        };
        run();
    });

    application.get('/cepsSearch', function(req, res){
  
        var id_cep = req.query;
    
        query_select = "select cep.cep,cep.numero_ini,cep.numero_fim,cep.identificacao, " +
            "cid.nome nmCidade,dis.nome nmDistrito,bai.nome nmBairro,log.nome nmLograd " +
            "from ceps cep,logradouros log, bairros bai, distritos dis, cidades cid  " +
            "where cep.logradouro = log.id and cep.bairro = bai.id and log.distrito = dis.id and " +
            "dis.cidade = cid.id and cep.id = :id" ;
        
        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select,[id_cep.id_cep], function(error, result){
                
            var cep = '';
            var cep = formataCEP(result.rows[0][0]);
            result.rows[0][0] = cep;

            res.render("ceps/cepsSearch", {cep : result.rows});
            //res.send(result.rows);
          });
        };
        run(); 
    });

    application.post('/cepsSave', function(req, res){
        var dados = req.body;

        // retira os (.) e (-) do código do cpf
        dados.modalNroCep = dados.modalNroCep.normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z])/g, '');

        if(dados.modalTpOperacao == 'N'){
            query_select = 'select nvl(count(*),0) from ceps where logradouro = :logradouro and bairro  = :bairro and ' +
            'numero_ini = :numinIcial and numero_fim = :numFinal and identificacao = :identificacao';
            async function run(){ var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_select ,
                [dados.modalIdLogradouro,dados.modalIdBairro,dados.modalNumInicial,dados.modalNumFinal,dados.modalSelIdent],
                function(error, result){
                    if(error){
                        console.log(error);
                        res.send('Erro ao Buscar quantidade em CEPS' + error)
                    }
                    rowsCep = result.rows;

                    if(rowsCep == 0){
                        async function run(){var connOracleDb = await oracledb.getConnection(dbConfig) 
                            connOracleDb.execute('insert into ceps (logradouro,bairro,cep,numero_ini,numero_fim,identificacao)' +
                            ' values (:logradouro,:bairro,:cep,:numero_ini,:numero_fim,:identificacao) ',
                            {logradouro: dados.modalIdLogradouro, bairro: dados.modalIdBairro, cep: dados.modalNroCep, numero_ini:
                                dados.modalNumInicial, numero_fim: dados.modalNumFinal, identificacao: dados.modalSelIdent},
                            {autoCommit: true},      
                            function(error, result){
                                if(error){
                                    console.log(error);
                                    res.send('Erro ao inserir em CEPS' + error)
                                }
                                res.send('Cep inserido com sucesso!');
                                //res.redirect('/cepsList');
                            });
                        };
                        run(); 
                    } else {
                        async function run(){ var connOracleDb = await oracledb.getConnection(dbConfig)
                            var query_update = 'update ceps set cep = :cep where logradouro = :logradouro and bairro  = :bairro and ' +
                            'numero_ini = :numinIcial and numero_fim = :numFinal and identificacao = :identificacao'
    
                            var connOracleDb = await oracledb.getConnection(dbConfig)
                            connOracleDb.execute(query_update, {cep: dados.modalNroCep, 
                            logradouro: dados.modalIdLogradouro,
                            bairro: dados.modalIdBairro,
                            numinIcial: dados.modalNumInicial,
                            numFinal: dados.modalNumFinal,
                            identificacao: dados.modalSelIdent},
                            {autoCommit: true},      
                            function(error, result){
                                if(error){
                                    console.log(error);
                                    res.send('Erro ao alterar em CEPS' + error)
                                }
                                res.send('Cep alterado com sucesso!');
                                //res.redirect('/cepsList');
                            });
                        };
                        run();
                    };
                });
            };
            run();
        } else {
            async function run(){ var connOracleDb = await oracledb.getConnection(dbConfig)
                var query_update = "update ceps set cep = :cep, numero_ini = :numero_ini, numero_fim = :numero_fim, " + 
                "identificacao = :identificacao where id = :id";

                connOracleDb.execute(query_update, {id: dados.cepId,
                    cep: dados.modalNroCep, 
                    numero_ini: dados.modalNumInicial, 
                    numero_fim: dados.modalNumFinal, 
                    identificacao: dados.modalSelIdent },
                {autoCommit: true},      
                function(error, result){
                    if(error){
                        console.log(error);
                        res.send('Erro ao alterar em CEPS' + error)
                    }
                    res.send('Cep alterado com sucesso!');
                    //res.redirect('/cepsList');
                });
            };
            run();
        };
    });

    application.get('/cepsEdit', function(req, res){
        var id_cep = req.query.id;

        var identificacao = [
            {"value": "A", display: "A",        selected: false},
            {"value": "D", display: "Direita",  selected: false},
            {"value": "E", display: "Esquerda", selected: false},
            {"value": "I", display: "Impar",    selected: false},
            {"value": "P", display: "par",      selected: false},
            {"value": "U", display: "Único",    selected: false}
        ];
        
        async function run(){

            //cep
            query_select = "select cep.id,cid.id idCidade, dis.id idDistrito,cep.logradouro idLograd, " +
            "cep.bairro idBairro, " +
            "SUBSTR(cep.cep,1,2)||'.'||SUBSTR(cep.cep,3,3)||'-'||SUBSTR(cep.cep,6,3) cep_formatado, " +
            "cep.numero_ini, cep.numero_fim,cep.identificacao, " +
            "cid.nome nmcidade, dis.nome nmdistrito, bai.nome nmbairro, logr.nome nmlograd, tplograd.sigla, est.sigla estsigla " +
            "from ceps cep,logradouros logr, bairros bai, distritos dis, cidades cid, tipos_logradouros tplograd, estados est " +
            "where cep.logradouro = logr.id and cep.bairro = bai.id and logr.distrito = dis.id and " +
            "dis.cidade = cid.id and logr.tipo_logradouro = tplograd.id and cid.estado = est.id and cep.id = :id" ;
            
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select ,[id_cep], function(error, result){
                res.send({ cep: result.rows, identificacao: identificacao });
            });
        }
        run();
    });

    application.post('/cepsModalVisu', function(req, res){
     
        var dados = req.body;

        var query_select = "select cep.id, cep.cep, tplogr.sigla, logr.nome " +
        "from ceps cep, logradouros logr, tipos_logradouros tplogr " +
        "where cep.logradouro = logr.id and logr.tipo_logradouro = tplogr.id and cep.id = :id";
    
        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_select, [dados.id], function(error, result){
                    
                var cep = '';
                var cep = formataCEP(result.rows[0][1]);
                result.rows[0][1] = cep;

                res.send(result.rows);
            });
        };
        run();
    });

    application.delete('/cepsDelete', function(req, res){
        var dados = req.body;
        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute('delete from ceps where id = :id', [dados.id],
                {autoCommit: true}, function(error, result){
                if(error){
                    console.log('Erro ao exluir item ' + error);
                    res.send('Erro ao exluir item ' + error);
                } ;
            });
        };
        run(); 
        res.send('Cep excluido com sucesso');
    }); 

    application.get('/cepPorEndereco', function(req, res){
        
        var bairro     = req.query.bairro;
        var logradouro = req.query.logradouro;
        var numero     = req.query.numero;

        var query_select = "select cep.id,cep.cep from ceps cep where cep.logradouro = :logradouro and " +
        "cep.bairro = :bairro and :numero between cep.numero_ini and cep.numero_fim";
    
        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, [logradouro,bairro,numero], 
            function(error, result){
                if(error){
                    console.log('Não foi possível localizar CEP para bairro/logradouro informado ' + error);
                    res.send('Não foi possível localizar CEP para bairro/logradouro informado ' + error);
                };

                if(result.rows[0]){
                    var cep = '';
                    var cep = formataCEP(result.rows[0][1]);
                    result.rows[0][1] = cep;
                    res.send(result.rows);
                } else {
                    res.send('Não foi possível localizar CEP para bairro/logradouro informado ' + result);
                }
                    
            });
        };
        run();
    });
}

function formataCEP(cep) {
    cepMasc = String(Number(cep))

    if (cepMasc != undefined) {
        if (cepMasc.length <= 8) { //CPF
            //Coloca um ponto entre o terceiro e o quarto dígitos
            cepMasc = cepMasc.replace(/(\d{2})(\d)/, "$1.$2")
            //Coloca um hífen entre o terceiro e o quarto dígitos
            cepMasc = cepMasc.replace(/(\d{3})(\d)/, "$1-$2")
            return cepMasc;
        }
    }
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
            html += "<a class='btn btn-success btn-xs' href='/logradourosList?pagina=" + i + 
            (paginator.nmCidade ? ("&inputCidade=" + paginator.nmCidade) : "") + 
            (paginator.nmLogradouro ? ("&inputNomeLogradouro=" + paginator.nmLogradouro) : "") + 
            (paginator.cep ? ("&inputCep=" + paginator.cep) : "") +
            "'>" + i + "</a>";
        html += "</li>";
    };
    return html;
};

