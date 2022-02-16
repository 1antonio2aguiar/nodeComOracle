module.exports = function(application){
    var oracledb = require('oracledb');
    let dbConfig = {user:"dbo_ccm_pessoas", 
                    password:"dbo_ccm_pessoas", 
                    connectString:"172.17.0.113/apolo"};

    var query_select = '';  
    
    application.get('/pessoaSearch', function(req, res){
        var id_pessoa = req.query.id_pessoa;
        var filterNome = req.query.nome;
        var filtercnpjcpf = req.query.cnpjcpf;

        async function run() {
            var connOracleDb = await oracledb.getConnection(dbConfig)

            if(req.query.fisjur == 'F'){
                query_select = "SELECT pes.id, " +
                "pes.nome, " +
                "pes.fisica_juridica, " +
                "to_char(pes.data_registro,'DD/MM/YYYY')data_nascimento, " +
                "to_char(pes.data_cadastro,'DD/MM/YYYY')data_cadastro, " +
                "pes.observacao, " +
                "pes.usuario, " +
                "to_char(pes.data_alteracao,'DD/MM/YYYY')data_alteracao, " +
                "pes.situacao, " +
                "SUBSTR(dpf.cpf,1,3)||'.'||SUBSTR(dpf.cpf,4,3)||'.'||SUBSTR(dpf.cpf,7,3)||'-'||SUBSTR(dpf.cpf,10,2) cpf, " + 
                "dpf.nome_social, " +
                "case dpf.raca when 1 then 'BRANCA' when 2 then 'NEGRO' when 3 then 'PARDA' when 4 then 'AMARELO' when 5 then 'INDÍGENA' when 99 then 'OUTROS' else null end raca, " +
                "case dpf.cor when 1 then 'BRANCA' when 2 then 'NEGRO' when 3 then 'PARDA' when 4 then 'AMARELO' when 5 then 'INDÍGENA' when 99 then 'OUTROS' else null end cor, " +
                "etn.descricao etnia, " +
                "case dpf.recebe_bf when 'S' then 'SIM' else 'NÃO' end recebe_bf, " +
                "dpf.cartao_sus, " +
                "case dpf.sexo when 'M' then 'MASCULINO' when 'F' then 'FEMININO' else ' ' end sexo, " +
                "tec.descricao estado_civil, " +
                "cid.nome nome_cidade, " +
                "dpf.mae, " +
                "dpf.pai, " +
                "dpf.mes_envio_sicom, " +
                "dpf.ano_envio_sicom, " +
                "tp_pes.descricao " + 
                "FROM pessoas pes, " +
                    "dados_pf dpf, " +
                    "etnias   etn, " +
                    "tipos_estados_civis tec, " +
                    "cidades cid, " +
                    "tipos_pessoas tp_pes " + 
                "where pes.id           = dpf.pessoa       and " +
                        "dpf.etnia        = etn.id(+)      and " + 
                        "dpf.estado_civil = tec.sigla(+)   and " +
                        "dpf.local_nascimento = cid.id(+)  and " +
                        "tp_pes.id = pes.tipo_pessoa       and " +
                        "pes.id = :id_pessoa " ;
            } else {
                query_select = "SELECT pes.id, " +
                "pes.nome, " +
                "pes.fisica_juridica, " +
                "to_char(pes.data_cadastro,'DD/MM/YYYY')data_cadastro, " +
                "pes.observacao, " +
                "pes.usuario pes_usuario, " +
                "to_char(pes.data_alteracao,'DD/MM/YYYY')pes_data_alteracao, " +
                "pes.situacao, " +
                "SUBSTR(dpj.cnpj,1,2)||'.'||SUBSTR(dpj.cnpj,3,3)||'.'||SUBSTR(dpj.cnpj,6,3)||'/'||SUBSTR(dpj.cnpj,9,4) ||'-'||SUBSTR(dpj.cnpj,13,2) cnpj, " + 
                "dpj.nome_fantasia, " +
                "dpj.objeto_social, " +
                "dpj.conjuge, " +
                "case dpj.micro_empresa when 'S' then 'SIM' when 'N' then 'NÃO' else ' ' end micro_empresa, " +
                "dpj.ano_envio_sicom, " +
                "dpj.mes_envio_sicom, " +
                "dpj.usuario dpj_usuario, " +
                "dpj.data_alteracao dpj_data_alteracao, " +
                "tp_pes.descricao, " +
                "tp_empresas.descricao tpempdescricao " +
                "FROM pessoas pes, " +
                "dados_pj dpj, " +
                "tipos_pessoas tp_pes, " +
                "tipos_empresas tp_empresas " +
                "where pes.id = dpj.pessoa   and " +
                "tp_pes.id = pes.tipo_pessoa and  " +
                "dpj.tipo_empresa = tp_empresas.tipo_estabelecimento(+) and " +
                "pes.id = :id_pessoa";
            }
            
            connOracleDb.execute(query_select ,[id_pessoa], function(error, result){
                pessoa = result.rows;

                query_select =  
                "select cup.cd_origem,      " + 
                "  cup.nome,                " + 
                "  case cup.fisica_juridica " + 
                "    when 'F' then          " + 
                "      SUBSTR(cup.cpf_cnpj,1,3)||'.'||SUBSTR(cup.cpf_cnpj,4,3)||'.'||SUBSTR(cup.cpf_cnpj,7,3)||'-'||SUBSTR(cup.cpf_cnpj,10,2) " + 
                "    else " + 
                "      SUBSTR(cup.cpf_cnpj,1,2)||'.'||SUBSTR(cup.cpf_cnpj,3,3)||'.'||SUBSTR(cup.cpf_cnpj,6,3)||'/'||SUBSTR(cup.cpf_cnpj,9,4) ||'-'||SUBSTR(cup.cpf_cnpj,13,2) " + 
                "    end cgc_cpf_format,                                          " +                    
                "  cup.banco,                                                     " +
                "  tp_logr.descricao tp_lograd_descricao,                         " +
                "  logr.nome logr_nome,                                           " +
                "  pes.numero,                                                    " +
                "  pes.complemento,                                               " +
                "  bai.nome bai_nome,                                             " +
                "  cid.nome cid_nome,                                             " +
                "  SUBSTR(cep.cep,1,2)||'.'||SUBSTR(cep.cep,3,3)||'-'||SUBSTR(cep.cep,6,3) cep_formatado " + 
                "from cad_unico_pessoa cup,                                       " +
                "     pes_pessoas pes,                                            " +
                "     pes_logradouros logr,                                       " +
                "     pes_tipos_logradouros tp_logr,                              " +
                "     pes_bairros bai,                                            " +
                "     pes_cidades cid,                                            " +
                "     pes_ceps cep                                                " +
                "where cup.cd_origem 		= pes.pessoa and                      " +
                "      pes.cidade    		= logr.cidade and                     " +
                "      pes.distrito    		= logr.distrito and                   " +
                "      pes.logradouro    	= logr.logradouro and                 " +
                "      logr.tipo_logradouro = tp_logr.tipo_logradouro and         " +
                "      pes.cidade    		= bai.cidade and                      " +
                "      pes.distrito    		= bai.distrito and                    " +
                "      pes.bairro    		= bai.bairro and                      " +
                "      pes.cidade    		= cid.cidade and                      " +
                "      pes.cidade    		= cep.cidade and                      " +
                "      pes.distrito    		= cep.distrito and                    " +
                "      pes.logradouro    	= cep.logradouro and                  " +
                "      pes.numero between 	cep.numero_ini and cep.numero_fim and " +
                "      cup.pessoas_cd_unico = :id_pessoa" + 
                
                " UNION " + 
                
                "select cup.cd_origem,      " + 
                "  cup.nome,                " + 
                "  case cup.fisica_juridica " + 
                "    when 'F' then          " + 
                "      SUBSTR(cup.cpf_cnpj,1,3)||'.'||SUBSTR(cup.cpf_cnpj,4,3)||'.'||SUBSTR(cup.cpf_cnpj,7,3)||'-'||SUBSTR(cup.cpf_cnpj,10,2) " + 
                "    else " + 
                "      SUBSTR(cup.cpf_cnpj,1,2)||'.'||SUBSTR(cup.cpf_cnpj,3,3)||'.'||SUBSTR(cup.cpf_cnpj,6,3)||'/'||SUBSTR(cup.cpf_cnpj,9,4) ||'-'||SUBSTR(cup.cpf_cnpj,13,2) " + 
                "    end cgc_cpf_format,                                          " +                    
                "  cup.banco,                                                     " +
                "  tp_logr.descricao tp_lograd_descricao,                         " +
                "  logr.nome logr_nome,                                           " +
                "  pes.numero,                                                    " +
                "  pes.complemento,                                               " +
                "  bai.nome bai_nome,                                             " +
                "  cid.nome cid_nome,                                             " +
                "  SUBSTR(pes.cep,1,2)||'.'||SUBSTR(pes.cep,3,3)||'-'||SUBSTR(pes.cep,6,3) cep_formatado " + 
                "from cad_unico_pessoa cup,                                       " +
                "     rh_pessoas pes,                                            " +
                "     rh_logradouros logr,                                       " +
                "     rh_tipos_logradouros tp_logr,                              " +
                "     rh_bairros bai,                                            " +
                "     rh_cidades cid                                             " +
                "where cup.cd_origem 		= pes.pessoa and                     " +
                "      pes.cidade    		= logr.cidade and                    " +
                "      pes.distrito    		= logr.distrito and                  " +
                "      pes.logradouro    	= logr.logradouro and                " +
                "      logr.tipo_logradouro = tp_logr.tipo_logradouro and        " +
                "      pes.cidade    		= bai.cidade and                     " +
                "      pes.distrito    		= bai.distrito and                   " +
                "      pes.bairro    		= bai.bairro and                     " +
                "      pes.cidade    		= cid.cidade and                     " +
                "      cup.pessoas_cd_unico = :id_pessoa " +
                
                " UNION " +
                
                "select cup.cd_origem, " +       
                "  cup.nome, " +                 
                "  case cup.fisica_juridica " +  
                "    when 'F' then " +           
                "      SUBSTR(cup.cpf_cnpj,1,3)||'.'||SUBSTR(cup.cpf_cnpj,4,3)||'.'||SUBSTR(cup.cpf_cnpj,7,3)||'-'||SUBSTR(cup.cpf_cnpj,10,2) " +  
                "    else " +  
                "      SUBSTR(cup.cpf_cnpj,1,2)||'.'||SUBSTR(cup.cpf_cnpj,3,3)||'.'||SUBSTR(cup.cpf_cnpj,6,3)||'/'||SUBSTR(cup.cpf_cnpj,9,4) ||'-'||SUBSTR(cup.cpf_cnpj,13,2) " +  
                "    end cgc_cpf_format, " +                                                              
                "  cup.banco, " +                                                      
                "  tp_logr.descricao tp_lograd_descricao, " +                          
                "  logr.nome logr_nome, " +                                            
                "  pes.numero, " +                                                     
                "  pes.complemento, " +                                                
                "  bai.nome bai_nome, " +                                              
                "  cid.nome cid_nome, " +                                              
                "  SUBSTR(pes.cep,1,2)||'.'||SUBSTR(pes.cep,3,3)||'-'||SUBSTR(pes.cep,6,3) cep_formatado " +  
                "from cad_unico_pessoa cup, " +                                        
                "     sane_pessoas pes, " +                                             
                "     sane_logradouros logr, " +                                        
                "     sane_tipos_logradouros tp_logr, " +                               
                "     sane_bairros bai,  " +                                            
                "     sane_cidades cid  " +                                             
                "where cup.cd_origem 		= pes.pessoa and  " +                     
                "      pes.cidade    		= logr.cidade and  " +                    
                "      pes.distrito    		= logr.distrito and  " +                  
                "      pes.logradouro    	= logr.logradouro and  " +                
                "      logr.tipo_logradouro = tp_logr.tipo_logradouro and  " +        
                "      pes.cidade    		= bai.cidade and  " +                     
                "      pes.distrito    		= bai.distrito and  " +                   
                "      pes.bairro    		= bai.bairro and  " +                     
                "      pes.cidade    		= cid.cidade and " +                     
                "      cup.pessoas_cd_unico = :id_pessoa" ;

                connOracleDb.execute(query_select ,[id_pessoa], function(error, result){
                    res.render("pessoasSearch/pessoasSearch", {
                        pessoa: pessoa,
                        pessoasOrigem: result.rows,
                        filterNome:    filterNome,
                        filtercnpjcpf: filtercnpjcpf
                    });
                });
                
            });

        };
        run(); 
    });

    application.get('/pessoaSearchEnderecos', function(req, res){
        var id_pessoa = req.query.id_pessoa;

        async function run() {
            var connOracleDb = await oracledb.getConnection(dbConfig)

            query_select = "select ender.id,   " +
            "tp_ender.descricao,               " + 
            "tp_logr.descricao tp_lograd_desc, " + 
            "logr.nome nome_lograd,         " +
            "ender.numero,                  " + 
            "nvl(ender.complemento,' ') complemento, " +
            "bai.nome nome_bairro,          " +
            "cid.nome nome_cidade,          " +
            "SUBSTR(cep.cep,1,2)||'.'||SUBSTR(cep.cep,3,3)||'-'||SUBSTR(cep.cep,6,3) cep_formatado " + 
            "from enderecos ender,            " + 
              "tipos_enderecos tp_ender,    " +
              "ceps cep,                    " +
              "logradouros logr,            " +
              "bairros bai,                 " +
              "distritos dis,               " +
              "cidades cid,                 " +
              "tipos_logradouros tp_logr    " +
                "where ender.tp_endereco     = tp_ender.id(+)and " + 
                "ender.cep             = cep.id(+)     and " + 
                "cep.logradouro        = logr.id(+)    and " + 
                "cep.bairro            = bai.id(+)     and " +
                "logr.distrito         = dis.id        and " + 
                "dis.cidade            = cid.id        and " + 
                "logr.tipo_logradouro  = tp_logr.id    and " + 
                "ender.cep <> 0                        and " +
                "ender.pessoa = :id_pessoa " +
            "UNION "  + 
                "select ender.id,                                 " +
                "  tp_ender.descricao,                            " +
                "  tp_logr.descricao tp_lograd_desc,              " +
                "  logr.nome nome_lograd,                         " +
                "  ender.numero,                                  " +
                "  ender.complemento,                             " +
                "  bai.nome nome_bairro,                          " +
                "  cid.nome nome_cidade,                          " +
                "  '' cep                                         " +
                "from enderecos ender,                            " +
                "    tipos_enderecos tp_ender,                    " +
                "    logradouros logr,                            " +
                "    bairros bai,                                 " +
                "    distritos dis,                               " +
                "    cidades cid,                                 " +
                "    tipos_logradouros tp_logr                    " +
                "where ender.tp_endereco     = tp_ender.id(+) and " +
                "      ender.logradouro        = logr.id(+)   and " +
                "      ender.bairro            = bai.id(+)    and " +
                "      logr.distrito         = dis.id         and " +
                "      dis.cidade            = cid.id         and " +
                "      logr.tipo_logradouro  = tp_logr.id     and " +
                "      ender.cep = 0                          and " +
                "      ender.pessoa = :id_pessoa" ;

            connOracleDb.execute(query_select ,[id_pessoa], function(error, result){
                enderecos = result.rows
                res.send( enderecos );
            });
        };
        run();
    });

    application.get('/pessoaSearchDocumentos', function(req, res){
        var id_pessoa = req.query.id_pessoa;

        async function run() {
            var connOracleDb = await oracledb.getConnection(dbConfig)

            query_select = "select doc.id,                                 " +
            "tp_doc.descricao,                                             " +
            "doc.numero_documento,                                         " +
            "nvl(to_char(doc.data_expedicao,'DD/MM/YYYY'),' ')data_expedicao, " +
            "nvl(doc.orgao_expedidor,' '),                                 " +
            "nvl(to_char(doc.data_validade_cnh,'DD/MM/YYYY'),' ')data_validade_cnh, " +
            "nvl(doc.categoria_cnh,' '),                                   " +
            "nvl(doc.zona,0),                                              " +
            "nvl(doc.secao,0),                                             " +
            "nvl(doc.termo,' '),                                           " +
            "nvl(doc.folha,' '),                                           " +
            "nvl(doc.livro,' ')                                            " +
            "from documentos doc,                                          " +
            "tipos_documentos tp_doc                                       " +
            "where doc.tipo_documento = tp_doc.id  and                     " +
            "doc.pessoa = :id_pessoa" ;

            connOracleDb.execute(query_select ,[id_pessoa], function(error, result){
                documentos = result.rows
                res.send( documentos );
            });
        };
        run();
    });

    application.get('/pessoaSearchContatos', function(req, res){
        var id_pessoa = req.query.id_pessoa;

        async function run() {
            var connOracleDb = await oracledb.getConnection(dbConfig)

            query_select = "select con.id, " +                                                
            "tp_con.descricao,             " +                                 
            "con.contato                   " +                      
            "from contatos con,            " +                              
            "tipos_contatos tp_con         " +                              
            "where con.tipo_contato = tp_con.id and " +                    
            "con.pessoa = :id_pessoa" ;

            connOracleDb.execute(query_select ,[id_pessoa], function(error, result){
                contatos = result.rows
                res.send( contatos );
            });
        };
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