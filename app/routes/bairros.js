module.exports = function(application){
    var oracledb = require('oracledb');
    let dbConfig = {user:"dbo_ccm_pessoas", 
                    password:"dbo_ccm_pessoas", 
                    connectString:"172.17.0.113/apolo"};

    //Pega a data atual com hora minitos segundos  e decimos de segundo
    const zeroFill = n => {return ('0' + n).slice(-2);}

    const now = new Date();
    const dataHora = zeroFill(now.getUTCDate()) + '/' + zeroFill((now.getMonth() + 1)) + '/' + 
    now.getFullYear() + ' ' + zeroFill(now.getHours()) + ':' + zeroFill(now.getMinutes()) + ':' + 
    zeroFill(now.getSeconds()) + ',' + zeroFill(now.getMilliseconds()) + '00';
    //console.log(dataHora);

    application.get('/bairrosList', function(req, res){ 
        var query_select     = "";  
        var filterCidade     = false;
        var filterBairro = false;
        var filterCep        = false;
        var nmBairro   = "";
        var nmCidade         = "";
        var query_count      = 0;
        var pagina           = 0;
        var cep             = null;
        var bairro = 0; 

        var dados = req.query;

        if (dados.inputCidade) {
            nmCidade = dados.inputCidade;
            filterCidade = true;
        }; 

        if (dados.inputNomeBairro) {
            nmBairro = dados.inputNomeBairro;
            filterBairro = true;
        };
        
        if (dados.inputCep) {
            // retira os (.) e (-) do código do cep
            cep = dados.inputCep.normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z])/g, '');
            filterCidade = false;
            filterBairro = false;
            filterCep = true;
        } ;

        if (req.query.pagina) {
            pagina = req.query.pagina;
        } else {
            pagina = 1;
        }

        var qtd_reg_por_pg = 14 ;
        if (pagina > 1) {
            var inicio = (pagina * qtd_reg_por_pg) - qtd_reg_por_pg + 1;
        } else {
            inicio = pagina;
        }
        
        var fim = (pagina * qtd_reg_por_pg);

        async function run() {
            var connOracleDb = await oracledb.getConnection(dbConfig)

            query_count = "select count(*) from bairros bai, distritos dis, cidades cid " +
                          "where bai.distrito = dis.id and dis.cidade = cid.id " +
                        ( filterCidade ? " and cid.nome like upper('" + nmCidade + "%') " : '') +
                        ( filterBairro ? " and bai.nome like upper('%" + nmBairro + "%')" : '') +
                        ( filterCep    ? " and cep.cep = " + cep : '') ;

            connOracleDb.execute(query_count, function(error, result){
                var totalPages = result.rows;
                if(totalPages < 14){
                    inicio = 1;
                    fim = totalPages + 1 ;
                }

                query_select = "select cid.id,cid.nome,est.sigla from cidades cid, estados est " +
                "where cid.estado = est.id order by cid.nome";

                connOracleDb.execute(query_select, function(error, result){
                    cidades = result.rows;

                query_select = "select * from (select topn.*, ROWNUM rnum from (select bai.id,cid.nome nmcida, " +
                "dis.nome nmdistrito,bai.nome nmbairro,bai.nome_abreviado,cid.id idcida " +
                "from bairros bai,distritos dis, cidades cid " +
                "where bai.distrito = dis.id and dis.cidade = cid.id  " +
                ( filterCidade ? " and cid.nome like upper('" + nmCidade + "%') " : '') +
                ( filterBairro ? " and bai.nome like upper('%" + nmBairro + "%')" : '') +
                ( filterCep    ? " and cep.cep = " + cep : '') +
                
                " order by cid.nome,dis.nome,bai.nome) topn where ROWNUM <= :fim ) where rnum  >= :inicio ";
            
                connOracleDb.execute(query_select,{fim: fim, inicio: inicio}, function(error, result){
                    var paginator = {
                        page: pagina,
                        dispay: 2,
                        totalPages: totalPages,
                        nmCidade: nmCidade,
                        nmBairro: nmBairro,
                        cep: cep
                    };

                    res.render("bairros/bairrosList", {bairros : result ? result.rows : [], 
                        paginator: pagination(paginator), 
                        metadata: paginator,
                        bairro: bairro 
                    });

                    //res.send(result.rows);
                });
            });
            });
        }
        run();
    });

    application.get('/bairrosNew', function(req, res){
        async function run() {
            var connOracleDb = await oracledb.getConnection(dbConfig)
            query_select = 'select SEQ_BAIRROS.NEXTVAL from dual';
            connOracleDb.execute(query_select, function(error, result){
                bairro = result.rows;
            });

            query_select = "select cid.id,cid.nome,est.sigla from cidades cid, estados est " +
            "where cid.estado = est.id order by cid.nome";

            connOracleDb.execute(query_select, function(error, result){
                cidades = result.rows;
                var dados = { cidades: cidades, bairro: bairro};
                res.send(dados);
            });
        };
        run();
    });

    application.post('/bairrosSave', function(req, res){
        var dados = req.body;
        //console.log(dados);

        if(dados.modalDtCriacao != ''){
            dados.modalDtCriacao = formataData(dados.modalDtCriacao);
        } else {dados.modalDtCriacao = null, modalInputLeiCriacao = null};

        if(dados.modalDtDecreto != ''){
            dados.modalDtDecreto = formataData(dados.modalDtDecreto);
        } else {dados.modalDtDecreto = null, modalInputDecreto = null};

        if(dados.modalDtPortaria != ''){
            dados.modalDtPortaria = formataData(dados.modalDtPortaria);
        } else {dados.modalDtPortaria = null, modalInputPortaria = null};

        if(!dados.modImputIdVereador){ dados.modImputIdVereador = null };
        if(!dados.modImputIdLoteadora){ dados.modImputIdLoteadora = null };
        if(dados.inputZonaRural == '-1'){dados.inputZonaRural = 'N'};

        if(dados.modalTpOperacao == 'N'){
            query_insert = 'insert into bairros (id,distrito,nome,nome_abreviado,usuario,data_alteracao) ' +
            'values (:id,:distrito,:nome,:nome_abreviado,:usuario,:data_alteracao)' ;

            async function run(){ 
                var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_insert,
                    {id: dados.modalBairroId,
                    distrito: dados.modalSelDistrito,
                    nome: dados.modInputNome, 
                    nome_abreviado: dados.modInputNmAbrev,
                    usuario: 'Analistas',
                    data_alteracao: dataHora},
                {autoCommit: true},function(error, result){
                    if(error){
                        console.log('Erro ao inserir Bairros. ' + error);
                        res.send('Erro ao inserir Bairros. ' + error);
                    }; 
                });

                query_insert = 'insert into dados_bairros (bairro,data_criacao,lei_criacao, ' +
                'data_decreto, decreto, data_portaria, portaria, pessoa_vereador, ' +
                'pessoa_loteadora, nome_popular,zona_rural,usuario,data_alteracao) ' +
                'values (:bairro, :data_criacao, :lei_criacao, :data_decreto, :decreto, ' +
                ':data_portaria,:portaria, :pessoa_vereador, :pessoa_loteadora, :nome_popular, ' +
                ':zona_rural,:usuario,:data_alteracao)';

                connOracleDb.execute(query_insert,
                {   bairro: dados.modalBairroId, 
                    data_criacao:        dados.modalDtCriacao, 
                    lei_criacao:        dados.modalInputLeiCriacao,
                    data_decreto:       dados.modalDtDecreto,
                    decreto:            dados.modalInputDecreto,
                    data_portaria:      dados.modalDtPortaria,
                    portaria:           dados.modalInputPortaria,
                    pessoa_vereador:    dados.modImputIdVereador,
                    pessoa_loteadora:   dados.modImputIdLoteadora,
                    nome_popular:       dados.modalInputNmPopular,
                    zona_rural:         dados.modalSelZonaRural,
                    usuario:            'Analistas',
                    data_alteracao:     dataHora
                },{autoCommit: true},function(error, result){
                    if(error){
                        console.log('Erro ao inserir Dados Bairros. ' + error);
                        res.send('Erro ao inserir Dados Bairros. ' + error);
                    }; 
                });
                res.send('Dados Atualizados com sucesso! ');
            };
            run(); 
        } else {
            async function run(){
                var connOracleDb = await oracledb.getConnection(dbConfig)
                var query_update = "update bairros set nome = :nome, nome_abreviado = :nome_abreviado, " + 
                "usuario = :usuario, data_alteracao = :data_alteracao where id = :id";

                connOracleDb.execute(query_update, 
                {   id: dados.modalBairroId,
                    nome: dados.modInputNome,
                    nome_abreviado: dados.modInputNmAbrev,
                    usuario: 'Analistas',
                    data_alteracao: dataHora
                },{autoCommit: true},function(error, result){
                    if(error){
                        console.log('Erro ao alterar Bairros. ' + error);
                        res.send('Erro ao alterar Bairros. ' + error);
                    }
                });

                query_update = 'update dados_bairros set data_criacao = :data_criacao, ' +
                'lei_criacao = :lei_criacao, data_decreto = :data_decreto, decreto = :decreto, ' +
                'data_portaria = :data_portaria, portaria = :portaria, nome_popular = :nome_popular, ' +
                'zona_rural = :zona_rural, pessoa_vereador = :pessoa_vereador, ' + 
                'pessoa_loteadora = :pessoa_loteadora, usuario = :usuario, ' + 
                'data_alteracao = :data_alteracao where id = :id' ;
                
                connOracleDb.execute(query_update, 
                {   id:                 dados.modalBairroDadosId,
                    data_criacao:       dados.modalDtCriacao, 
                    lei_criacao:        dados.modalInputLeiCriacao,
                    data_decreto:       dados.modalDtDecreto,
                    decreto:            dados.modalInputDecreto,
                    data_portaria:      dados.modalDtPortaria,
                    portaria:           dados.modalInputPortaria,
                    nome_popular:       dados.modalInputNmPopular,
                    zona_rural:         dados.modalSelZonaRural,
                    pessoa_vereador:    dados.modImputIdVereador,
                    pessoa_loteadora:   dados.modImputIdLoteadora,
                    usuario:            'Analistas',
                    data_alteracao:     dataHora
                },{autoCommit: true},
                function(error, result){
                    if(error){
                        console.log('Erro ao Atualizar em Dados Bairros. ' + error);
                        res.send('Erro ao Atualizar em Dados Bairros. ' + error);
                    }
                }); 
                res.send('Dados atualizados com sucesso!');
            }
            run();
        };
    });


    application.get('/bairrosSearch', function(req, res){
        var id_bairro = req.query.id;

        var query_select = "select cid.nome nmcidade, dis.nome nmdistrito, bai.nome nmbairro, " + 
        "bai.nome_abreviado, to_char(dbai.data_criacao,'YYYY-MM-DD')data_criacao,dbai.lei_criacao, " +
        "to_char(dbai.data_decreto,'YYYY-MM-DD')data_decreto,dbai.decreto, " +
        "to_char(dbai.data_portaria,'YYYY-MM-DD')data_portaria,dbai.portaria, " +
        "dbai.pessoa_vereador,dbai.pessoa_loteadora,dbai.nome_popular,dbai.zona_rural, " +
        "pvereador.nome vereador,ploteadora.nome loteadora, pvereador.fisica_juridica vereadorfisjur, ploteadora.fisica_juridica loteadorafisjur, " + 

        "(case when pvereador.fisica_juridica = 'F' then " +
        "(select cpf from dados_pf dpf where dpf.pessoa = dbai.pessoa_vereador) " +
        "else (select cnpj from dados_pj dpj where dpj.pessoa = dbai.pessoa_vereador)  end) cpfcnpjvereador, " +
        "(case when ploteadora.fisica_juridica = 'F' then " +
        "(select cpf from dados_pf dpf where dpf.pessoa = dbai.pessoa_loteadora) " +
        "else (select cnpj from dados_pj dpj where dpj.pessoa = dbai.pessoa_loteadora)  end) cpfcnpjpessoa_loteadora , " +
        "bai.id bairroid, dbai.id dadosbairroid, est.sigla " +

        "from bairros bai, distritos dis,cidades cid, dados_bairros dbai, pessoas pvereador, pessoas ploteadora, estados est " +
        "where bai.distrito = dis.id and dis.cidade = cid.id and bai.id = dbai.bairro(+) and " +
        "dbai.pessoa_vereador = pvereador.id(+) and dbai.pessoa_loteadora = ploteadora.id(+) and cid.estado = est.id and bai.id = :id ";

        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select,[id_bairro], function(error, result){

            if(result.rows[0][18] != null && result.rows[0][18] != 0){
                if(result.rows[0][16] == 'F'){
                    result.rows[0][18] = formataCPF(result.rows[0][18]);
                }else{
                    result.rows[0][18] = formataCNPJ(result.rows[0][18]);
                };
            };

            if(result.rows[0][19] != null && result.rows[0][19] != 0){
                if(result.rows[0][17] == 'F'){
                    result.rows[0][19] = formataCPF(result.rows[0][19]);
                }else{
                    result.rows[0][19] = formataCNPJ(result.rows[0][19]);
                };
            };

            res.send(result.rows);
          });
        };
        run(); 
    });

    application.post('/bairrosModalVisu', function(req, res){
     
        var dados = req.body;

        var query_select = "select id,nome from bairros where id = :id";
    
        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_select, [dados.id], function(error, result){
                res.send(result.rows);
            });
        };
        run();
    });

    application.delete('/bairrosDelete', function(req, res){
        var count = 0;
        var dados = req.body;

        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
            query_select = 'select count(*) from ceps where bairro = :id';
            connOracleDb.execute(query_select ,[dados.id], function(error, result){
                count = result.rows;
            });

            if(count > 0){
                connOracleDb.execute('delete from ceps where bairro = :bairro', 
                    [dados.id],{autoCommit: true}, function(error, result){
                    if(error){
                        console.log('Erro ao deletar em CEPS ' + error);
                        res.send('Erro ao deletar em CEPS ' + error);
                    };
                });
            };

            connOracleDb.execute('delete from bairros where id = :id', 
                [dados.id],{autoCommit: true}, function(error, result){
                if(error){
                    console.log('Erro ao deletar em BAIRROS ' + error);
                    res.send('Erro ao deletar em BAIRROS ' + error);
                };
            });
        };
        run(); 
        res.send('Item excluido com sucesso');
    });

    application.get('/bairrosDdw', function(req, res){
        dados = req.query;
        var cidade   = dados.cidade;
        var distrito = dados.distrito;
        var nmBairro = dados.nomeBairro;

        var query_select = "select bai.id, bai.nome " +
        "from bairros bai, distritos dis, cidades cid " + 
        "where bai.distrito = dis.id and " + 
        "dis.cidade = cid.id and " + 
        "cid.id = :id_cidade and " +
        "distrito = :id_distrito " + 
        ( nmBairro ? " and bai.nome like upper('%" + nmBairro + "%')" : '') +
        "order by bai.nome";
        
        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select,[cidade,distrito], function(error, result){
                res.send(result.rows);
            });
        };
        run(); 
        
    });
}

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

function formataCNPJ(cnpj) {
    cnpjMasc = String(Number(cnpj))

    if (cnpjMasc != undefined) {
        if (cnpjMasc.length <= 14) { //CNPJ
            cnpjMasc = cnpjMasc.replace( /\D/g , ""); //Remove tudo o que não é dígito
            cnpjMasc = cnpjMasc.replace( /^(\d{2})(\d)/ , "$1.$2"); //Coloca ponto entre o segundo e o terceiro dígitos
            cnpjMasc = cnpjMasc.replace( /^(\d{2})\.(\d{3})(\d)/ , "$1.$2.$3"); //Coloca ponto entre o quinto e o sexto dígitos
            cnpjMasc = cnpjMasc.replace( /\.(\d{3})(\d)/ , ".$1/$2"); //Coloca uma barra entre o oitavo e o nono dígitos
            cnpjMasc = cnpjMasc.replace( /(\d{4})(\d)/ , "$1-$2"); //Coloca um hífen depois do bloco de quatro dígitos
            
            return cnpjMasc;
        }
    }
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
            html += "<a class='btn btn-success btn-xs' href='/bairrosList?pagina=" + i + 
            (paginator.nmCidade ? ("&inputCidade=" + paginator.nmCidade) : "") + 
            (paginator.nmBairro ? ("&inputNomeBairro=" + paginator.nmBairro) : "") + 
            (paginator.cep ? ("&inputCep=" + paginator.cep) : "") +
            "'>" + i + "</a>";
        html += "</li>";
    };
    return html;
}