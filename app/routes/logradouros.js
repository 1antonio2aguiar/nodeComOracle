
module.exports = function(application){
    var oracledb = require('oracledb');
    let dbConfig = {user:"dbo_ccm_pessoas", 
                    password:"dbo_ccm_pessoas", 
                    connectString:"172.17.0.113/apolo"};

    var preposicao = [
        {"value": "AO", selected: false},
        {"value": "ATÉ", selected: false},
        {"value": "D", selected: false},
        {"value": "DA", selected: false},
        {"value": "DE", selected: false},
        {"value": "DO", selected: false},
        {"value": "DAS", selected: false},
        {"value": "DOS", selected: false},
        {"value": "E", selected: false},
        {"value": "MÃE", selected: false},
        {"value": "PAR", selected: false},
        {"value": "RIO", selected: false},
        {"value": "SEM", selected: false}
    ];

    application.get('/logradourosList', function(req, res){ 
        var filterCidade = false;
        var filterCep = false;
        var filterLogradouro = false;
        var nmLogradouro = "";
        var logradouro = 0;
        var nmCidade = "";
        var cep = "";
        var query_select = "";
        var query_count = 0;
        var query_upd = "";
        var pagina = 0;
        var qtd_reg_por_pg = 14 ;

        var dados = req.query;

        if (dados.inputCidade) {
            var nmCidade = dados.inputCidade;
            filterCidade = true;
        };

        if (dados.inputNomeLogradouro) {
            nmLogradouro = dados.inputNomeLogradouro;
            filterLogradouro = true;
        }; 

        if (dados.inputCep) {
            cep = dados.inputCep;
            filterCep = true;
        } ;

        if (req.query.pagina) {
            pagina = req.query.pagina;
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

            query_count = "select count(*) from logradouros logr, distritos dis, cidades cid, ceps cep " +
                        "where logr.distrito = dis.id and dis.cidade = cid.id and cep.logradouro = logr.id " +
                        ( filterCidade ? " and cid.nome like upper('" + nmCidade + "%') " : '') +
                        ( filterLogradouro ? " and logr.nome like upper('" + nmLogradouro + "%')" : '') +
                        ( filterCep ? " and cep.cep = " + cep : '' );

            connOracleDb.execute(query_count, function(error, result){
                var totalPages = result.rows;
                if(totalPages < 14){
                    inicio = 1;
                    fim = totalPages + 1 ;
                }

                query_select = "select * from (select topn.*, ROWNUM rnum from " +
                "(select distinct logr.id,cid.nome nmcidade,dis.nome nmdistrito,tplog.sigla, " +
                "logr.nome nmlograd,logr.preposicao,logr.titulo_patente,logr.nome_reduzido, " +
                "logr.complemento,cep.cep,bai.nome nmbairro, bai.id idbairro from logradouros logr,bairros bai, " +
                "distritos dis,cidades cid,tipos_logradouros tplog,ceps cep  " +
                "where logr.tipo_logradouro = tplog.id and logr.distrito = dis.id and " +
                "logr.id = cep.logradouro(+) and bai.id = cep.bairro and dis.cidade = cid.id " + 
                ( filterCidade ? "and cid.nome like upper('" + nmCidade + "%') " : '') +
                ( filterLogradouro ? " and logr.nome like upper('" + nmLogradouro + "%')" : "") +
                ( filterCep ? " and cep.cep = " + cep : '' ) +
                " order by logr.id desc) topn where ROWNUM <= :fim ) where rnum  >= :inicio ";

                connOracleDb.execute(query_select,{fim: fim, inicio: inicio}, function(error, result){
                    var paginator = {
                        page: pagina,
                        dispay: 2,
                        totalPages: totalPages,
                        nmCidade: nmCidade,
                        nmLogradouro: nmLogradouro,
                        cep: cep
                    };

                    for (var i = 0; i < result.rows.length; i ++) {
                        var cepFormat = formataCEP(result.rows[i][9]);
                        result.rows[i][9] = cepFormat;
                    };

                    res.render("logradouros/logradourosList", {logradouros : result ? result.rows : [], 
                        paginator: pagination(paginator), 
                        metadata: paginator, 
                        nmCidade: nmCidade,
                        nmLogradouro: nmLogradouro,
                        cep: cep,
                        preposicao: preposicao,
                        logradouro: logradouro
                    });
                });
            });
        };
        run();
    });

    application.get('/logradourosNew', function(req, res){
        async function run() {
            query_select = "select cid.id,cid.nome,est.sigla from cidades cid, estados est " +
                "where cid.estado = est.id order by cid.nome"

            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, function(error, result){
                cidades = result.rows;
            
                query_select = "select tpLograd.id,tpLograd.sigla from tipos_logradouros tpLograd order by sigla " 
                connOracleDb.execute(query_select, function(error, result){
                    tiposLogradouros = result.rows;

                    query_select = "select tp.id,tp.descricao from titulos_patentes tp order by descricao"
                    connOracleDb.execute(query_select, function(error, result){
                        titulosPatentes = result.rows;

                        query_select = 'select SEQ_LOGRADOUROS.NEXTVAL from dual';
                        connOracleDb.execute(query_select, function(error, result){
                            logradouro = result.rows;

                            var dados = { cidades: cidades,
                                tiposLogradouros: tiposLogradouros,
                                titulosPatentes: titulosPatentes,
                                preposicao: preposicao,
                                logradouro: logradouro 
                            };
                            res.send(dados);
                        });
                    }); 
                });
            });
        };
        run();
    });

    application.post('/logradourosSave', function(req, res){
        var dados = req.body;

        if(dados.modalDtCriacao != null && dados.modalDtCriacao != ''){
            dados.modalDtCriacao = formataData(dados.modalDtCriacao);
        } else {dados.modalDtCriacao = null};

        if(dados.modalDtDecreto != null && dados.modalDtDecreto != ''){
            dados.modalDtDecreto = formataData(dados.modalDtDecreto);
        } else {dados.modalDtDecreto = null};

        if(dados.modalDtPortaria != null && dados.modalDtPortaria != ''){
            dados.modalDtPortaria = formataData(dados.modalDtPortaria);
        } else {dados.modalDtPortaria = null};

        if(dados.modalSelPreposicao == -1){dados.modalSelPreposicao = null};
        if(dados.modalSelTituloPatente == -1){dados.modalSelTituloPatente = null};
        if(!dados.modalImputIdVereador){dados.modalImputIdVereador = null};

        if(!dados.modalLogradDadosId & dados.modalTpOperacao == 'N'){
            query_insert = 'insert into logradouros (id, distrito, tipo_logradouro, nome, preposicao, ' +
            'titulo_patente, nome_reduzido, nome_simplificado, complemento) values ' +
            '(:id, :distrito, :tipo_logradouro, :nome, :preposicao, :titulo_patente, :nome_reduzido,' +
            ':nome_simplificado, :complemento)' ;

            async function run(){ 
                var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_insert,
                    {id: dados.modalLogradId, distrito: dados.modalSelDistrito, 
                    tipo_logradouro: dados.modalSelTpLograd, nome: dados.modalInputNome,
                    preposicao: dados.modalSelPreposicao, titulo_patente: dados.modalSelTituloPatente, 
                    nome_reduzido: dados.modInputNmReduzido, nome_simplificado: dados.modInputLogradNmSimples, 
                    complemento: dados.modalInputComplemento},
                {autoCommit: true},function(error, result){
                    if(error){
                        console.log('Erro ao inserir Logradouros. ' + error);
                        res.send('Erro ao inserir Logradouros. ' + error);
                    }; 
                });

                query_insert = 'insert into dados_logradouros (logradouro, data_criacao, lei_criacao, '+
                'data_decreto, decreto, data_portaria, portaria, pessoa_vereador, observacao) values ' +
                '(:logradouro, :data_criacao, :lei_criacao, :data_decreto, :decreto, :data_portaria, ' +
                ':portaria, :pessoa_vereador, :observacao)';

                connOracleDb.execute(query_insert,
                {   logradouro: dados.modalLogradId, 
                    data_criacao: dados.modalDtCriacao, 
                    lei_criacao: dados.modalInputLeiCriacao,
                    data_decreto: dados.modalDtDecreto,
                    decreto: dados.modalInputDecreto,
                    data_portaria: dados.modalDtPortaria,
                    portaria: dados.modalInputPortaria,
                    pessoa_vereador: dados.modalImputIdVereador,
                    observacao: dados.modalInputObservacao
                },{autoCommit: true},function(error, result){
                    if(error){
                        console.log('Erro ao inserir em dados logradouros ' + error);
                        res.send(error);
                    };
                });

                query_insert = 'insert into ceps (logradouro, bairro ) values (:logradouro, :bairro)';
                connOracleDb.execute(query_insert,
                {   logradouro: dados.modalLogradId, 
                    bairro: dados.modalSelBairro
                },{autoCommit: true},
                function(error, result){
                    if(error){
                        console.log('Erro ao inserir em Ceps. ' + error);
                        res.send('Erro ao inserir em Ceps. ' + error);
                    } 
                });
                res.send('Dados inseridos com sucesso!');
            };
            run();
            
        } else {
            query_upd = "update logradouros set tipo_logradouro = :tipo_logradouro, nome = :nome, " +
                "preposicao = :preposicao, titulo_patente = :titulo_patente, nome_reduzido = :nome_reduzido, " +
                "nome_simplificado = :nome_simplificado, complemento = :complemento " +
                "where id = :id"

            async function run(){ 
                var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_upd, {id: dados.modalLogradId,
                    tipo_logradouro: dados.modalSelTpLograd, nome: dados.modalInputNome,
                    preposicao: dados.modalSelPreposicao, titulo_patente: dados.modalSelTituloPatente,
                    nome_reduzido: dados.modInputNmReduzido, nome_simplificado: dados.modInputLogradNmSimples,
                    complemento: dados.modalInputComplemento},
                {autoCommit: true},
                function(error, result){
                    if(error){
                        console.log('Erro ao fazer update em logradouros. ' + error);
                        res.send('Erro ao fazer update em logradouros. ' + error);
                    }; 
                });
                    
                if(dados.modalLogradDadosId){
                    query_upd = 'update dados_logradouros set data_criacao = :data_criacao, ' +
                    'lei_criacao   = :lei_criacao, data_decreto = :data_decreto, decreto = :decreto, ' +
                    'data_portaria = :data_portaria, portaria   = :portaria, pessoa_vereador = :pessoa_vereador, ' +
                    'observacao    = :observacao where id  = :id' ;

                    connOracleDb.execute(query_upd, {
                        id:              dados.modalLogradDadosId, 
                        data_criacao:    dados.modalDtCriacao,
                        lei_criacao:     dados.modalInputLeiCriacao,
                        data_decreto:    dados.modalDtDecreto,
                        decreto:         dados.modalInputDecreto,
                        data_portaria:   dados.modalDtPortaria,
                        portaria:        dados.modalInputPortaria,
                        pessoa_vereador: dados.modalImputIdVereador,
                        observacao:      dados.modalInputObservacao
                    },{autoCommit: true},
                    function(error, result){
                        if(error){
                            console.log('Erro ao alterar em dados logradouros ' + error);
                            res.send('Erro ao alterar em Dados logradouros ' + error);
                        };
                    });
                } else {
                    query_insert = 'insert into dados_logradouros (logradouro, data_criacao, lei_criacao, '+
                    'data_decreto, decreto, data_portaria, portaria, pessoa_vereador, observacao) values ' +
                    '(:logradouro, :data_criacao, :lei_criacao, :data_decreto, :decreto, :data_portaria, ' +
                    ':portaria, :pessoa_vereador, :observacao)';

                    connOracleDb.execute(query_insert,
                        {   logradouro: dados.modalLogradId, 
                            data_criacao: dados.modalDtCriacao, 
                            lei_criacao: dados.modalInputLeiCriacao,
                            data_decreto: dados.modalDtDecreto,
                            decreto: dados.modalInputDecreto,
                            data_portaria: dados.modalDtPortaria,
                            portaria: dados.modalInputPortaria,
                            pessoa_vereador: dados.modalImputIdVereador,
                            observacao: dados.modalInputObservacao
                        },{autoCommit: true},
                        function(error, result){
                        if(error){
                            console.log('Erro ao inserir em dados logradouros ' + error);
                            res.send(error);
                        };
                    });
                };

                if(dados.modalLogradBairroAnt != dados.modalSelBairro){
                    query_upd = 'update ceps set bairro = :bairro ' +
                    'where logradouro = :logradouro and bairro = :bairroAnt' ;

                    connOracleDb.execute(query_upd, {
                        logradouro: dados.modalLogradId, 
                        bairroAnt:  dados.modalLogradBairroAnt,
                        bairro:     dados.modalSelBairro
                    },{autoCommit: true},
                    function(error, result){
                        if(error){
                            console.log('Erro ao alterar em Ceps ' + error);
                            res.send('Erro ao alterar em Ceps ' + error);
                        };
                    });
                };
                res.send('Dados Alterado com sucesso! ');
            };
            run(); 
        };
    });
    
    application.get('/logradourosEdit', function(req, res){
        var id_logradouro = req.query.id;
        var id_bairro = req.query.bairro;

        async function run(){

            // Tipos logradouros
            var query_select = "select tplograd.id, tplograd.sigla, tplograd.descricao from tipos_logradouros tplograd" ;

            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, function(error, result){
                var tiposLogradouros = result.rows;
                
                // Titulos patentes
                var query_select = "select tp.id, tp.descricao from titulos_patentes tp" ;
                connOracleDb.execute(query_select, function(error, result){
                    var titulosPatentes = result.rows;

                    //Logradouros
                    query_select = "select  cid.nome nmcidade, " + 
                    "dis.nome nmdistrito, " + 
                    "tplograd.descricao, " + 
                    "lograd.nome nmlograd, " + 
                    "lograd.titulo_patente, " + 
                    "lograd.preposicao, " + 
                    "lograd.nome_reduzido nmreduz, " + 
                    "lograd.NOME_SIMPLIFICADO, " + 
                    "to_char(dlograd.data_criacao,'YYYY-MM-DD')data_criacao,dlograd.lei_criacao, " + 
                    "to_char(dlograd.data_decreto,'YYYY-MM-DD')data_decreto,dlograd.decreto, " + 
                    "to_char(dlograd.data_portaria,'YYYY-MM-DD')data_portaria,dlograd.portaria, " + 
                    "dlograd.pessoa_vereador, " + 
                    "pvereador.nome nmvereador, " + 
                    "pvereador.fisica_juridica vereadorfisjur, " +  
                    "(case when pvereador.fisica_juridica = 'F' then " + 
                    "(select cpf from dados_pf dpf where dpf.pessoa = dlograd.pessoa_vereador) " + 
                    "else (select cnpj from dados_pj dpj where dpj.pessoa = dlograd.pessoa_vereador)  end) cpfcnpjvereador, " + 
                    "dlograd.observacao, lograd.complemento,lograd.id logradid,dlograd.id dlogradid, " + 
                    "lograd.tipo_logradouro tplogradid, " +
                    "est.sigla, " +
                    "cid.id idcidade, " +
                    "dis.id iddistrito " +

                    "from logradouros lograd, " + 
                    "distritos         dis, " + 
                    "cidades           cid, " + 
                    "dados_logradouros dlograd, " + 
                    "pessoas           pvereador, " + 
                    "tipos_logradouros tplograd, " + 
                    "estados est " + 

                    "where lograd.distrito = dis.id and " + 
                    "dis.cidade = cid.id and " +  
                    "lograd.id = dlograd.logradouro(+) and " + 
                    "dlograd.pessoa_vereador = pvereador.id(+) and " + 
                    "lograd.tipo_logradouro = tplograd.id and " + 
                    "est.id = cid.estado and " +
                    "lograd.id  = :id ";

                    connOracleDb.execute(query_select ,[id_logradouro], function(error, result){
                        if(result.rows[0][17] != null && result.rows[0][17] != 0){
                            result.rows[0][17] = formataCPF(result.rows[0][17]);
                        }
                        var logradouro = result.rows;

                        var distrito = logradouro[0][25];
                        query_select = "select id,nome from bairros where distrito = :distrito" ;

                        connOracleDb.execute(query_select ,[distrito], function(error, result){
                            var bairros = result.rows;

                            query_select = "select bai.id,bai.nome from bairros bai,ceps cep where " +
                            "cep.bairro = bai.id and cep.logradouro = :logradouro and cep.bairro = :bairro " ;

                            connOracleDb.execute(query_select ,[id_logradouro,id_bairro], function(error, result){
                                var bairroCep = result.rows;
                                var dados = { logradouro: logradouro,
                                    tiposLogradouros:tiposLogradouros,
                                    titulosPatentes: titulosPatentes, 
                                    preposicao: preposicao, 
                                    bairros: bairros,
                                    bairroCep: bairroCep
                                };

                                res.send(dados);
                            });
                        });
                    });
                });
            });
        }
        run();
    });

    application.post('/logradourosModalVisu', function(req, res){
     
        var dados = req.body;

        var query_select = "select logr.id, tplogr.sigla, logr.nome from logradouros logr, tipos_logradouros tplogr " +
        "where logr.tipo_logradouro = tplogr.id and logr.id = :id";
    
        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_select, [dados.id], function(error, result){
                res.send(result.rows);
            });
        };
        run();
    });

    application.delete('/logradourosDelete', function(req, res){
        var dados = req.body;
        var count = 0;

        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)

            query_select = 'select count(*) from ceps where logradouro = :id';
            connOracleDb.execute(query_select ,[dados.id], function(error, result){
                count = result.rows;
            });

            if(count == 1){
                connOracleDb.execute('delete from logradouros where id = :id', 
                    [dados.id],{autoCommit: true}, function(error, result){
                    if(error){
                        console.log('Erro ao deletar em logradouros ' + error);
                        res.send('Erro ao deletar em logradouros ' + error);
                    };
                });
            };

            connOracleDb.execute('delete from ceps where logradouro = :id and bairro = :bairro', 
                [dados.id,dados.bairro],{autoCommit: true}, function(error, result){
                if(error){
                    console.log('Erro ao deletar em Ceps ' + error);
                    res.send('Erro ao deletar em Ceps ' + error);
                };
            });
        };
        run(); 
        res.send('Item excluido com sucesso');
    });

    application.get('/logradourosDdw', function(req, res){
        dados = req.query;
        var cidade   = dados.cidade;
        var distrito = dados.distrito;
        var nmLogradouro = dados.nomeLogradouro;

        query_select = "select logr.id, " + 
        "tplograd.sigla, " +
        "logr.nome " +
        "from logradouros logr, distritos dis, cidades cid, tipos_logradouros tplograd  " +
        "where logr.distrito = dis.id and " +
        "dis.cidade = cid.id and " +
        "logr.tipo_logradouro = tplograd.id and " +
        "cid.id = :id_cidade and " +
        "distrito = :id_distrito " +
        ( nmLogradouro ? " and logr.nome like upper('%" + nmLogradouro + "%')" : '') +
        "order by logr.nome ";

        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select,[cidade,distrito], function(error, result){
                res.send(result.rows);
            });
        };
        run(); 
        
    });

    application.post('/logradourosNextval', function(req, res){
        async function run() {
            query_select = 'select SEQ_LOGRADOUROS.NEXTVAL from dual';
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, function(error, result){
                res.send(result.rows);
            });  
        }
        run();      
    });    
};


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

function formataData(data){

    var stringData = data.toString();
    var ano = stringData.substring(0, 4);
    var mes = stringData.substring(5, 7);
    var dia = stringData.substring(8, 10);
    var data = mes +'/'+ dia +'/'+ano;
    
    let objData = new Date(data);

    let formattedDate = (objData.getDate()  + "/" + (objData.getMonth() + 1) + "/" + objData.getFullYear());
    return formattedDate;
}  

function formataCPF(cpf) {
    cpfMasc = String(Number(cpf))

    if (cpfMasc != undefined) {
        if (cpfMasc.length <= 14) { //CPF
            //Coloca um ponto entre o terceiro e o quarto dígitos
            cpfMasc = cpfMasc.replace(/(\d{3})(\d)/, "$1.$2")
            //Coloca um ponto entre o terceiro e o quarto dígitos
            //de novo (para o segundo bloco de números)
            cpfMasc = cpfMasc.replace(/(\d{3})(\d)/, "$1.$2")
            //Coloca um hífen entre o terceiro e o quarto dígitos
            cpfMasc = cpfMasc.replace(/(\d{3})(\d{1,2})$/, "$1-$2")
            return cpfMasc;
        }
    }
}

function pagination(paginator) {
    var html = "";
    var minPage = 0;
    var maxPage = 0;

    if ((paginator.page - 1) <= 0) {
        minPage = 1;
    } else {
        minPage = paginator.page - 1;
    };

    maxPage = minPage + 1;

    var iterator = 1;
    while(iterator < paginator.dispay) {
        if (maxPage < paginator.totalPages) {
            maxPage++
        }

        iterator++;
    };
    
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