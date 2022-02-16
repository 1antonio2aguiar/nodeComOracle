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

    application.get('/pessoaJuridicaEdit', function(req, res){
        //console.log('ta no edit pessoa 1 '  + req.query.id_pessoa);
        //console.log('ta no edit pessoa 2 '  + req.query.id);

        var id_pessoa = req.query.id_pessoa;
        if(id_pessoa == 0){
            id_pessoa = req.query.id
        };

        var filterNome = req.query.nome;
        var filtercnpjcpf = req.query.cnpjcpf;

        var enderecos = [{"id":0, "tp_endereco":'', "numero":0, "complemento":'', "descricao":'', "cep":0}];

        async function run() {
            // Tipo pessoa
            query_select = "select id,descricao from tipos_pessoas " ;
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, function(error, result){
                var tipos_pessoas = result.rows;

                // Tipos Empresas
                query_select = "select tipo_estabelecimento,descricao from tipos_empresas" ;
                connOracleDb.execute(query_select, function(error, result){
                    var tipos_empresas = result.rows;

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

                                var query_select = "select pes.id,pes.tipo_pessoa,pes.nome,pes.fisica_juridica,to_char(pes.data_cadastro,'YYYY-MM-DD')data_cadastro, " +
                                "pes.observacao, dpj.cnpj cnpj, 0 zero, dpj.nome_fantasia, dpj.objeto_social, " +
                                "dpj.micro_empresa, dpj.conjuge, dpj.mes_envio_sicom, dpj.ano_envio_sicom, dpj.tipo_empresa " +
                                "from pessoas pes, dados_pj dpj where pes.id = dpj.pessoa and pes.id = :id_pessoa" ;

                                connOracleDb.execute(query_select ,[id_pessoa], function(error, result){
                                    var cnpj = '';
                                    var cnpj = formataCNPJ(result.rows[0][6]);
                                    result.rows[0][6] = cnpj;
            
                                    res.render("pessoas/pessoaJuridicaEdit", {pessoa: result.rows, 
                                        tipos_pessoas: tipos_pessoas, tipos_empresas: tipos_empresas,
                                        tiposEndereco: tiposEndereco, tiposLogradouros: tiposLogradouros,
                                        cidades: cidades,
                                        filterNome:    filterNome,
                                        filtercnpjcpf: filtercnpjcpf
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

    application.post('/pessoaJuridicaSave', function(req, res){
        var dados = req.body;
        //console.log(dados);

        if(dados.inputCnpj != null && dados.inputCnpj != ''){
            // retira os (.) e (-) do código do cpf
            dados.inputCnpj = dados.inputCnpj.normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z])/g, '');
        } else {dados.inputCnpj = null}

        query_insert = 'insert into pessoas (id, tipo_pessoa, nome, fisica_juridica, data_cadastro, observacao, usuario, data_alteracao, situacao) values ' +
        '(:id, :tipo_pessoa, :nome, :fisica_juridica, :data_cadastro, :observacao, :usuario, :data_alteracao, :situacao)';

        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_insert,{
            id:              dados.inputIdpj,
            tipo_pessoa:     dados.inputTpPessoapj,
            nome:            dados.inputNomepj,
            fisica_juridica: dados.inputFisJurpj,
            data_cadastro:   dtHoje,
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

            query_insert = 'insert into dados_pj (pessoa, cnpj, nome_fantasia, objeto_social, micro_empresa, conjuge, tipo_empresa, usuario, data_alteracao) ' +
            'values(:pessoa, :cnpj, :nome_fantasia, :objeto_social, :micro_empresa, :conjuge, :tipo_empresa, :usuario, :data_alteracao)';

            connOracleDb.execute(query_insert, {
            pessoa:        dados.inputIdpj,
            cnpj:          dados.inputCnpj, 
            nome_fantasia: dados.inputNmFantasiapj, 
            objeto_social: dados.inputObjSocialpj,
            micro_empresa: dados.inputMicroEmpresapj, 
            conjuge:       dados.inputConjugepj, 
            tipo_empresa:    dados.inputTpEmpresapj, 
            usuario:      '1',
            data_alteracao: dataHora }, 
            {autoCommit: true}, 
            function(error, result){
                if(error){
                    console.log('Erro ao inserir em dados_pj ' + error);
                    res.send(error);
                };
                res.redirect("/pessoaJuridicaEdit?id_pessoa=" + dados.inputIdpj);
            });
        };
        run();

    });

    application.post('/pessoaJuridicaUpdate', function(req, res){
        var dados = req.body;

        var filterNome = dados.inputFilterNome;
        var filtercnpjcpf = dados.inputFiltercpf;

        // retira os (.) e (-) do código do cnpj
        dados.inputCnpjpj = dados.inputCnpjpj.normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z])/g, '');

        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)

            var query_select = "update pessoas set tipo_pessoa = :tipo_pessoa, nome = :nome, " +
            "observacao = :observacao, usuario = :usuario, data_alteracao = :data_alteracao " +
            "where id = :id" ;

            connOracleDb.execute(query_select, {tipo_pessoa: dados.inputTpPessoapj, nome: dados.inputNomepj, 
            observacao: dados.inputObspj, usuario: 'TESTE UPD', data_alteracao: dataHora,
            id: dados.inputIdpj}, {autoCommit: true},       
            function(error, result){
                if(error){
                    console.log('Erro ao atualizar em pessoas ' + error);
                }

                var query_select = "update dados_pj set cnpj = :cnpj, nome_fantasia = :nome_fantasia," +
                "objeto_social = :objeto_social, micro_empresa = :micro_empresa, conjuge = :conjuge, " +
                "tipo_empresa = :tipo_empresa, usuario = :usuario, data_alteracao = :data_alteracao " +
                " where pessoa = :pessoa "

                connOracleDb.execute(query_select, {cnpj: dados.inputCnpjpj, nome_fantasia: dados.inputNmFantasiapj, 
                objeto_social: dados.inputObjSocialpj, micro_empresa: dados.inputMicroEmpresapj, 
                conjuge: dados.inputConjugepj, tipo_empresa: dados.inputTpEmpresapj, usuario: 'TESTE UPD',
                data_alteracao: dataHora,  pessoa: dados.inputIdpj}, {autoCommit: true},
                function(error, result){
                    if(error){
                        console.log('erro ao atualizar dados pj ' + error);
                    }
                    res.redirect("/pessoasList?inputNome="+filterNome+"&&inputCpf"+filtercnpjcpf);
                }); 
            });
        };
        run();
    });
};

function formataCNPJ(cpf) {
    cnpjMasc = String(Number(cpf))

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