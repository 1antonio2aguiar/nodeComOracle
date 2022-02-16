module.exports = function(application){
    var oracledb = require('oracledb');
    let dbConfig = {user:"dbo_ccm_pessoas", 
                    password:"dbo_ccm_pessoas", 
                    connectString:"172.17.0.113/apolo"};

    var query_insert = '';     
    
    // Peda a data atual
    let dtHoje = new Date();
    dtHoje = (dtHoje.getDate())+ "/" + (dtHoje.getMonth()+1) + "/" + dtHoje.getFullYear();
    
    //Pega a data atual com hora minitos segundos  e decimos de segundo
    const zeroFill = n => {
        return ('0' + n).slice(-2);
    }
    const now = new Date();
    const dataHora = zeroFill(now.getUTCDate()) + '/' + zeroFill((now.getMonth() + 1)) + '/' + 
    now.getFullYear() + ' ' + zeroFill(now.getHours()) + ':' + zeroFill(now.getMinutes()) + ':' + 
    zeroFill(now.getSeconds()) + ',' + zeroFill(now.getMilliseconds()) + '00';
    //console.log(dataHora);
    
    var cor = [
        {"value": 1, selected: false , "display": "BRANCA"},
        {"value": 2, selected: false, "display": "NEGRO"},
        {"value": 3, selected: false,   "display": "PARDA"},
        {"value": 4, selected: false,   "display": "AMARELO"},
        {"value": 5, selected: false,   "display": "INDÍGENA"},
        {"value": 99, selected: false,   "display": "OUTROS"}
    ];

    var raca = [
        {"value": 1, selected: false , "display": "BRANCA"},
        {"value": 2, selected: false, "display": "NEGRO"},
        {"value": 3, selected: false,   "display": "PARDA"},
        {"value": 4, selected: false,   "display": "AMARELO"},
        {"value": 5, selected: false,   "display": "INDÍGENA"},
        {"value": 99, selected: false,   "display": "OUTROS"}
    ];                    
       
    application.get('/pessoasList', function(req, res){
        var query_select = "";  
        var filterNmPessoa = false;
        var nomePessoa = "";
        var filterCpfCnpj = false;
        var nrocnpjcpf = "";
        var cpfCnpj = 0;
        var query_count = 0;
        var pagina = 0;
        var qtdCarac = 0;

        if (req.query.inputNome) {
            nomePessoa = req.query.inputNome;
            filterNmPessoa = true;
            filterCpfCnpj  = false;
        }

        if (req.query.inputCpfCnpj) {
            cpfCnpj = req.query.inputCpfCnpj;
            nrocnpjcpf = cpfCnpj
            // retira os (.) e (-) do código do cpf
            cpfCnpj = cpfCnpj.normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z])/g, '');
            qtdCarac = cpfCnpj.length;

            filterNmPessoa = false;
            filterCpfCnpj  = true;
        }

        if (req.query.pagina) {
            pagina = req.query.pagina;
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

            query_count = "select count(*) from pessoas pes, dados_pf dpf, dados_pj dpj " +
            "where pes.id = dpf.pessoa(+) and  pes.id = dpj.pessoa(+) "  +
            ( filterNmPessoa ? " and trim(pes.nome) like upper('" + nomePessoa + "%')" : '')  + 
            ( filterCpfCnpj  ? " and ( dpf.cpf = " + cpfCnpj + " or dpj.cnpj = " + cpfCnpj +") " : '') ;

            connOracleDb.execute(query_count, function(error, result){
                var totalPages = result.rows[0][0] ;
                if(totalPages < 14){
                    inicio = 1;
                    fim = totalPages + 1 ;
                };

                query_select = "select * from (select topn.*, ROWNUM rnum from " +
                    "(select pes.id,pes.nome,dpf.cpf,tp.descricao,to_char(pes.data_registro,'DD/MM/YYYY')data_nascimento, pes.fisica_juridica, dpj.cnpj " +
                    "from pessoas pes, tipos_pessoas tp , dados_pf dpf, dados_pj dpj where pes.tipo_pessoa = tp.id and pes.id = dpf.pessoa(+) and  pes.id = dpj.pessoa(+) " +
                    //( filterNmPessoa ? " and pes.nome like upper('%" + nomePessoa + "%')" : '') +
                    ( filterNmPessoa ? " and trim(pes.nome) like upper('" + nomePessoa + "%')" : '') +
                    ( filterCpfCnpj  ? " and ( dpf.cpf = " + cpfCnpj + " or dpj.cnpj = " + cpfCnpj +") " : '') + 
                    " order by  pes.fisica_juridica, pes.nome " +
                    " ) topn where ROWNUM <= :fim ) where rnum  >= :inicio "  ;

                connOracleDb.execute(query_select,{fim: fim, inicio: inicio}, function(error, result){
                    var paginator = {
                        page: pagina,
                        dispay: 2,
                        totalPages: totalPages,
                        nomePessoa: nomePessoa,
                        nrocnpjcpf: nrocnpjcpf
                    };

                    var cpfCnpj = '';
                    for (var i = 0; i < result.rows.length; i ++) {
                        if(result.rows[i][5] == 'F'){
                            var cpfCnpj = formataCPF(result.rows[i][2]);
                            result.rows[i][2] = cpfCnpj;
                        } else {
                            var cpfCnpj = formataCNPJ(result.rows[i][6]);
                            result.rows[i][2] = cpfCnpj;
                        };
                    };

                    res.render("pessoas/pessoasList", {pessoas : result ? result.rows : [],
                        paginator: pagination(paginator), 
                        metadata: paginator
                    });
                });
            });
        };
        run(); 
    });
    
    // Novo cadastro
    application.get('/pessoasNew', function(req, res){
        async function run() {
            // Tipo pessoa
            query_select = 'select id,descricao from tipos_pessoas' ;
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, function(error, result){
                var tipos_pessoas = result.rows;

                // Estados Civis
                var query_select = 'select id,sigla,descricao from tipos_estados_civis' ;
                connOracleDb.execute(query_select, function(error, result){
                    var estados_civis = result.rows;

                    // Etnias
                    var query_select = 'select id,descricao from etnias' ;
                    connOracleDb.execute(query_select, function(error, result){
                        var etnias = result.rows;

                        query_select = 'select SEQ_PESSOAS.NEXTVAL from dual';
                        connOracleDb.execute(query_select, function(error, result){
                            id_pessoa = result.rows;

                            // Cidades
                            query_select = "select cid.id,cid.nome, est.sigla from cidades cid, " +
                            "estados est where cid.estado = est.id order by cid.nome" ;
                            connOracleDb.execute(query_select, function(error, result){
                                var cidades = result.rows;

                                // Tipos Empresas
                                query_select = "select tipo_estabelecimento,descricao from tipos_empresas";
                                connOracleDb.execute(query_select, function(error, result){
                                    var tipos_empresas = result.rows;

                                    res.render("pessoas/pessoasNew", { 
                                        tipos_pessoas: tipos_pessoas, 
                                        estados_civis: estados_civis, 
                                        etnias: etnias,
                                        cor: cor, 
                                        raca: raca,
                                        cidades: cidades,
                                        id_pessoa: id_pessoa,
                                        tipos_empresas: tipos_empresas
                                    });
                                });
                            });
                        });
                    });
                });                
            });
        };
        run();
    });

    application.get('/pessoaFisicaEdit', function(req, res){
        //console.log('ta no edit pessoa 1 '  + req.query.id_pessoa);
        //console.log('ta no edit pessoa 2 '  + req.query.id);


        var id_pessoa = req.query.id_pessoa;
        if(id_pessoa == 0){
            id_pessoa = req.query.id
        } ;

        var filterNome = req.query.nome;
        var filtercnpjcpf = req.query.cnpjcpf;

        var enderecos = [{"id":0, "tp_endereco":'', "numero":0, "complemento":'', "descricao":'', "cep":0}];

        async function run() {
            // Tipo pessoa
            query_select = "select id,descricao from tipos_pessoas " ;
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, function(error, result){
                var tiposDocumentos = '';
                var tipos_pessoas = result.rows;

                // Estados Civis
                var query_select = "select id,sigla,descricao from tipos_estados_civis " ;
                connOracleDb.execute(query_select, function(error, result){
                    var estados_civis = result.rows;

                    // Etnias
                    var query_select = "select id,descricao from etnias" ;
                    connOracleDb.execute(query_select, function(error, result){
                        var etnias = result.rows;

                        // Tipos Enderecos
                        var query_select = "select id,descricao from tipos_enderecos" ;
                        connOracleDb.execute(query_select, function(error, result){
                            var tiposEndereco = result.rows;

                            // Tipos Logradouros
                            var query_select = "select id,descricao from tipos_logradouros" ;
                            connOracleDb.execute(query_select, function(error, result){
                                var tiposLogradouros = result.rows;

                                // Cidades
                                var query_select = "select cid.id,cid.nome, est.sigla from cidades cid, " +
                                "estados est where cid.estado = est.id order by cid.nome" ;
                                connOracleDb.execute(query_select, function(error, result){
                                    var cidades = result.rows;

                                    var query_select = "select pes.id,pes.tipo_pessoa,pes.nome,pes.fisica_juridica,to_char(pes.data_registro,'YYYY-MM-DD')data_nascimento, " +
                                    "pes.observacao, dpf.cpf cpf, dpf.nome_social, dpf.raca, dpf.etnia, " +
                                    "dpf.cor, dpf.recebe_bf, dpf.cartao_sus,dpf.sexo,dpf.estado_civil, " +
                                    "dpf.local_nascimento, dpf.mae, dpf.pai, dpf.mes_envio_sicom, dpf.ano_envio_sicom " +
                                    "from pessoas pes, dados_pf dpf where pes.id = dpf.pessoa and pes.id = :id_pessoa" ;
                                    
                                    connOracleDb.execute(query_select ,[id_pessoa], function(error, result){
                                        
                                        for (var i = 0; i < raca.length; i ++) {
                                            if(raca[i].value == result.rows[0][8]){
                                                raca[i].selected = true;
                                            };
                                        };

                                        for (var i = 0; i < cor.length; i ++) {
                                            if(cor[i].value == result.rows[0][10]){
                                                cor[i].selected = true;
                                            };
                                        };

                                        var cpf = '';
                                        var cpf = formataCPF(result.rows[0][6]);
                                        result.rows[0][6] = cpf;

                                        res.render("pessoas/pessoasEdit", {pessoa: result.rows, 
                                            tipos_pessoas: tipos_pessoas, 
                                            estados_civis: estados_civis, etnias: etnias,
                                            cor: cor, raca: raca, tiposEndereco: tiposEndereco,
                                            tiposLogradouros: tiposLogradouros,
                                            cidades: cidades, enderecos: enderecos,
                                            tiposEndereco: tiposEndereco,
                                            tiposDocumentos: tiposDocumentos,
                                            filterNome:    filterNome,
                                            filtercnpjcpf: filtercnpjcpf                             
                                        });
                                    });
                                });    
                            });
                        });
                    });
                });
            });
        };
        run();  
    });

    application.post('/pessoaFisicaSave', function(req, res){
        var dados = req.body;
        //console.log(dados);

        if(dados.inputCpfpf != null && dados.inputCpfpf != ''){
            // retira os (.) e (-) do código do cpf
            dados.inputCpfpf = dados.inputCpfpf.normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z])/g, '');
        } else {dados.inputCpfpf = null}

        if(dados.inputDtRegistropf != null && dados.inputDtRegistropf != ''){
            dados.inputDtRegistropf = formataData(dados.inputDtRegistropf);
        } else {dados.inputDtRegistropf = null}

        if(dados.inputRacapf  == '-1') dados.inputRacapf  = null;
        if(dados.inputEtniapf == '-1') dados.inputEtniapf = null;
        if(dados.inputCorpf   == '-1') dados.inputCorpf   = null;

        query_insert = 'insert into pessoas (id,tipo_pessoa,nome,fisica_juridica,data_cadastro,' +
                'data_registro, observacao, usuario, data_alteracao, situacao) values ' +
                '(:id, :tipo_pessoa, :nome, :fisica_juridica, :data_cadastro, ' +
                ':data_registro,:observacao,:usuario,:data_alteracao, :situacao)';

        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_insert,{
            id:              dados.inputIdpf,
            tipo_pessoa:     dados.inputTpPessoapf,
            nome:            dados.inputNomepf,
            fisica_juridica: 'F',
            data_cadastro:   dtHoje,
            data_registro:   dados.inputDtRegistropf,
            observacao:      dados.inputObspf,
            usuario:         '1',
            data_alteracao: dataHora,
            situacao:       'A'},
            {autoCommit: true},
            function(error, result){
                if(error){
                    console.log('Erro ao inserir em pessoas ' + error);
                    res.send(error);
                };
            });
            
            query_insert = 'insert into dados_pf (pessoa, cpf, nome_social, raca, etnia, cor, ' +
            'recebe_bf, cartao_sus, sexo, estado_civil, local_nascimento, mae, pai, usuario, data_alteracao) values ' +
            '(:pessoa, :cpf, :nome_social, :raca, :etnia, :cor, :recebe_bf, :cartao_sus, :sexo, ' +
            ':estado_civil, :local_nascimento, :mae, :pai, :usuario, :data_alteracao)';

            connOracleDb.execute(query_insert, {
            pessoa:       dados.inputIdpf,
            cpf:          dados.inputCpfpf, 
            nome_social:  dados.inputNmsocialpf, 
            raca:         dados.inputRacapf,
            etnia:        dados.inputEtniapf, 
            cor:          dados.inputCorpf, 
            recebe_bf:    dados.inputBolsaFamiliapf, 
            cartao_sus:   dados.inputCartaoSuspf,
            sexo:         dados.inputSexopf, 
            estado_civil: dados.inputEstadoCivilpf, 
            local_nascimento: dados.inputCidadeNascimentopf,
            mae:          dados.inputNomeMaepf,
            pai:          dados.inputNomePaipf,
            usuario:      '1',
            data_alteracao: dataHora }, 
            {autoCommit: true}, 
            function(error, result){
                if(error){
                    console.log('Erro ao inserir em dados_pf ' + error);
                    res.send(error);
                };
                res.redirect("/pessoaFisicaEdit?id_pessoa=" + dados.inputIdpf);
            }); 
        };
        run(); 
    });
    
    application.post('/pessoaFisicaUpdate', function(req, res){
       var dados = req.body;

       // retira os (.) e (-) do código do cpf
       dados.inputCpfpf = dados.inputCpfpf.normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z])/g, '');
        
        //let dtRegistro = new Date(dados.inputDtRegistro);
        //let formattedDate = (dtRegistro.getDate()+1)+ "/" + (dtRegistro.getMonth() + 1) + "/" + dtRegistro.getFullYear()

        if(dados.inputDtRegistropf != null && dados.inputDtRegistropf != ''){
            dados.inputDtRegistropf = formataData(dados.inputDtRegistropf);
        } else {dados.inputDtRegistropf = null}

        if(dados.inputRacapf  == '-1') dados.inputRacapf  = null;
        if(dados.inputEtniapf == '-1') dados.inputEtniapf = null;
        if(dados.inputCorpf   == '-1') dados.inputCorpf   = null;
        if(dados.inputEstadoCivilpf   == '-1') dados.inputEstadoCivilpf   = null;
        if(dados.inputSexopf   == '-1') dados.inputSexopf   = null;

        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)

            var query_select = "update pessoas set nome = :nome, tipo_pessoa = :tipo_pessoa, " +
                "data_registro = :data_registro, observacao = :observacao, usuario = :usuario, " +
                "data_alteracao = :data_alteracao where id = :id"

            connOracleDb.execute(query_select, {id: dados.inputIdpf, 
                nome: dados.inputNomepf, 
                tipo_pessoa: dados.inputTpPessoapf,
                data_registro: dados.inputDtRegistropf, 
                observacao: dados.inputObspf,usuario: '2',
                data_alteracao: dataHora}, {autoCommit: true},      
            function(error, result){
                if(error){
                    console.log('Erro ao atualizar em pessoas ' + error);
                }
            });

            var query_select = "update dados_pf set cpf = :cpf, nome_social = :nome_social, raca = :raca, etnia = :etnia, " +
            "cor = :cor, recebe_bf = :recebe_bf, cartao_sus = :cartao_sus, sexo = :sexo, estado_civil = :estado_civil, " +
            "local_nascimento = :local_nascimento, mae = :mae, pai = :pai, usuario = :usuario, " +
            "data_alteracao = :data_alteracao where pessoa = :pessoa "

            connOracleDb.execute(query_select, {cpf: dados.inputCpfpf, 
                nome_social: dados.inputNmsocialpf, 
                raca: dados.inputRacapf,
                etnia: dados.inputEtniapf, 
                cor: dados.inputCorpf, 
                recebe_bf: dados.inputBolsaFamiliapf,
                cartao_sus: dados.inputCartaoSuspf,
                sexo: dados.inputSexopf, 
                estado_civil: dados.inputEstadoCivilpf, 
                local_nascimento: dados.inputCidadeNascimentopf,
                mae: dados.inputNomeMaepf, 
                pai: dados.inputNomePaipf, 
                usuario: '2', 
                data_alteracao: dataHora,
                pessoa: dados.inputIdpf}, {autoCommit: true}, 
            function(error, result){
                if(error){
                    console.log('erro ao atualizar dados pf' + error);
                }
                res.redirect("/pessoasList");
            }); 
        };
        run(); 
    });

    application.post('/pessoasBuscaPorNome', function(req, res){
        var filterNmPessoa = true;
        var nomePessoa = req.body.search;

        query_select = "select * from (select topn.*, ROWNUM rnum from " +
        "(select pes.id,pes.nome,dpf.cpf cpf_cnpj, pes.fisica_juridica from pessoas pes, tipos_pessoas tp, dados_pf dpf " +
        "where pes.tipo_pessoa = tp.id and pes.id = dpf.pessoa and pes.fisica_juridica = 'F' " +
        ( filterNmPessoa ? " and pes.nome like upper('" + nomePessoa + "%')" : '') + " order by pes.nome " +
        " ) topn where ROWNUM <= :fim ) where rnum  >= :inicio " + 
        
        "UNION " + 

        "select * from (select topn.*, ROWNUM rnum from " +
        "(select pes.id,pes.nome,ep.cnpj cpf_cnpj, pes.fisica_juridica from pessoas pes, tipos_pessoas tp , empresas_pessoas ep " +
        "where pes.tipo_pessoa = tp.id and pes.id = ep.pessoa(+) and pes.fisica_juridica = 'J' " +
        ( filterNmPessoa ? " and pes.nome like upper('" + nomePessoa + "%')" : '') + " order by pes.nome " +
        " ) topn where ROWNUM <= :fim ) where rnum  >= :inicio " ;

        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select,{fim: 10, inicio: 1}, function(error, result){
                
                var jsonObj = [];
                var cpfcnpj = '';
                
                linha = '[';
                for (var i = 1 ; i < result.rows.length; i++) {

                    if(result.rows[i][3] != null && result.rows[i][3] != 0){
                        if(result.rows[i][3] == 'F'){
                            cpfcnpj = formataCPF(result.rows[i][2]);
                        }else{
                            cpfcnpj = formataCNPJ(result.rows[i][2]);
                        }
                    }
                    
                    if(i > 1){
                        linha += ",";
                    }
                    linha += '{"id":'+ result.rows[i][0]+', "nome": "'+result.rows[i][1]+'", "cgccpf": "'+cpfcnpj+'", "rownum": '+result.rows[i][4]+'}';                    
                }
                linha += ']';
                var jsonObj = JSON.stringify(linha);
                
                res.send(jsonObj);

            });
        }
        run();
    });

    application.get('/buscaPorId', function(req, res){
        var id_pessoa = req.query.id;

        query_select = "select pes.id,pes.tipo_pessoa,pes.nome,pes.fisica_juridica,to_char(pes.data_registro,'YYYY-MM-DD')data_nascimento,  " +
        "pes.observacao, pes.situacao,dpf.cpf cpf,dpf.nome_social,dpf.raca raca, dpf.etnia, dpf.cor, dpf.recebe_bf, dpf.cartao_sus,  " +
        "dpf.sexo, dpf.estado_civil from pessoas pes, dados_pf dpf where pes.id = dpf.pessoa and pes.id = :id_pessoa  " +
        "union  " +
        "select pes.id,pes.tipo_pessoa,pes.nome,pes.fisica_juridica,to_char(pes.data_cadastro,'YYYY-MM-DD')data_cadastro,  " +
        "pes.observacao,pes.situacao,dpj.cnpj cnpj,dpj.nome_fantasia,0,0,0,dpj.micro_empresa,dpj.tipo_empresa,dpj.objeto_social,  " +
        "dpj.conjuge from pessoas pes, dados_pj dpj where pes.id = dpj.pessoa and pes.id = :id_pessoa" ; 

        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select,{id_pessoa}, function(error, result){
                if(result.rows[0][3] == 'F'){
                    result.rows[0][7] = formataCPF(result.rows[0][7]);
                } else {
                    result.rows[0][7] = formataCNPJ(result.rows[0][7]);
                };
                
                if(result.rows[0][4]){
                    result.rows[0][4] = formataData(result.rows[0][4]);
                };
                res.send(result.rows);
            });
        }
        run();
    });

    // --  --
    application.post('/pessoasBuscaPj', function(req, res){
        var filterNmPessoa = true;
        var nomePessoa = req.body.search;

        query_select = "select * from (select topn.*, ROWNUM rnum from " +
        "(select pes.id,pes.nome,ep.cnpj cpf_cnpj, pes.fisica_juridica from pessoas pes, tipos_pessoas tp , empresas_pessoas ep " +
        "where pes.tipo_pessoa = tp.id and pes.id = ep.pessoa(+) and pes.fisica_juridica = 'J' " +
        ( filterNmPessoa ? " and pes.nome like upper('" + nomePessoa + "%')" : '') + " order by pes.nome " +
        " ) topn where ROWNUM <= :fim ) where rnum  >= :inicio " ;

        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select,{fim: 10, inicio: 1}, function(error, result){
                
                var jsonObj = [];
                var cpfcnpj = '';
                
                linha = '[';
                for (var i = 1 ; i < result.rows.length; i++) {

                    if(result.rows[i][3] != null && result.rows[i][3] != 0){
                        if(result.rows[i][3] == 'F'){
                            cpfcnpj = formataCPF(result.rows[i][2]);
                        }else{
                            cpfcnpj = formataCNPJ(result.rows[i][2]);
                        }
                    }
                    
                    if(i > 1){
                        linha += ",";
                    }
                    linha += '{"id":'+ result.rows[i][0]+', "nome": "'+result.rows[i][1]+'", "cgccpf": "'+cpfcnpj+'", "rownum": '+result.rows[i][4]+'}';                    
                }
                linha += ']';
                var jsonObj = JSON.stringify(linha);
                
                res.send(jsonObj);

            });
        }
        run();
    });

    application.post('/pessoaDelete', function(req, res){
        var id_pessoa = req.body.pessoaDelId;

        query_select = 'select nvl(count(*),0) from pessoas_profissoes where pessoa = :pessoa';
        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)

            query_select = 'select nvl(count(*),0) from enderecos where pessoa = :pessoa';
            connOracleDb.execute(query_select,[id_pessoa], function(error, result){
                if(result.rows > 0){
                    query_delete = 'delete from enderecos where pessoa = :pessoa';
                    connOracleDb.execute(query_delete, [id_pessoa],{autoCommit: true}, function(error, result){});
                    console.log('excluiu em enderecos 4')
                };
            }); 

            query_select = 'select nvl(count(*),0) from documentos where pessoa = :pessoa';
            connOracleDb.execute(query_select,[id_pessoa], function(error, result){
                if(result.rows > 0){
                    query_delete = 'delete from documentos where pessoa = :pessoa';
                    connOracleDb.execute(query_delete, [id_pessoa],{autoCommit: true}, function(error, result){});
                    console.log('excluiu em documentos 3')
                };
            }); 

            query_select = 'select nvl(count(*),0) from contatos where pessoa = :pessoa';
            connOracleDb.execute(query_select,[id_pessoa], function(error, result){
                if(result.rows > 0){
                    query_delete = 'delete from contatos where pessoa = :pessoa';
                    connOracleDb.execute(query_delete, [id_pessoa],{autoCommit: true}, function(error, result){});
                    console.log('excluiu em contatos 2')
                };
            }); 

            connOracleDb.execute(query_select,[id_pessoa], function(error, result){
                if(result.rows > 0){
                    query_delete = 'delete from pessoas_profissoes where pessoa = :pessoa';
                    connOracleDb.execute(query_delete, [id_pessoa],{autoCommit: true}, function(error, result){});
                    console.log('excluiu em profissoes 1')
                };
            });

            query_delete = 'delete from dados_pf where id = :id';
            connOracleDb.execute(query_delete, [id_pessoa],{autoCommit: true}, function(error, result){
                console.log('excluiu em dados_pf 5')
            });

            query_delete = 'delete from pessoas where id = :id';
            connOracleDb.execute(query_delete, [id_pessoa],{autoCommit: true}, function(error, result){
                console.log('excluiu em pessoas 6')
            });

            res.send('Pessoa excluida com sucesso!');
        }
        run(); 
    });
};

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
};

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
}  ;

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
        };

        iterator++;
    };

    for (var i = minPage; i <= maxPage; i ++) {
        html += "<li class='page-item " + (i == paginator.page ? 'active' : '') + "'>";
            html += "<a class='btn btn-success btn-xs' href='/pessoasList?pagina=" + i + 
            (paginator.nomePessoa ? ("&nomePessoa=" + paginator.nomePessoa) : "") + 
            "'>" + i + "</a>";
        html += "</li>";
    };

    //(paginator.nomeBairro ? ("&nomeBairro=" + paginator.nomeBairro) : "") + "'>" + i + "</a>";
    return html;
};
