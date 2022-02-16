module.exports = function(application){
    var oracledb = require('oracledb');
    let dbConfig = {user:"dbo_ccm_pessoas", 
                    password:"dbo_ccm_pessoas", 
                    connectString:"172.17.0.113/apolo"};

    var query_select = '';

    application.post('/enderecosList', function(req, res){
        var id_pessoa = 0;

        var dados = req.body;
        id_pessoa = dados.id_pessoa;

        //console.log(id_pessoa);

        query_select = "select ender.id, tpender.descricao, cep.cep, ender.numero, ender.tp_endereco, " +
            "ender.complemento, ender.cep idcep, tplogr.descricao tplograddesc, logr.nome , bai.nome nmbairro " +
            "from enderecos ender, tipos_enderecos tpender, ceps cep,logradouros logr , tipos_logradouros tplogr, bairros bai "+ 
            "where ender.tp_endereco = tpender.id(+) and ender.cep = cep.id(+) and cep.logradouro = logr.id(+) and " + 
            "logr.tipo_logradouro = tplogr.id and ender.cep <> 0 and cep.bairro = bai.id(+) and ender.pessoa = :id_pessoa " +
            "union " +
            "select ender.id, tpender.descricao, '0' cep, ender.numero, ender.tp_endereco,ender.complemento, 0 idcep, " +
            "tplogr.descricao tplograddesc, logr.nome , bai.nome nmbairro from enderecos ender, tipos_enderecos tpender, " + 
            "logradouros logr , tipos_logradouros tplogr, bairros bai " +
            "where ender.tp_endereco    = tpender.id(+) and " + 
                "ender.logradouro       = logr.id(+)  and ender.bairro = bai.id(+) and " +
                "logr.tipo_logradouro = tplogr.id     and ender.cep = 0 and " +
                "ender.pessoa = :id_pessoa " ;

        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, [id_pessoa], function(error, result){

                var cep = '';
                for (var i = 0; i < result.rows.length; i ++) {
                    var cep = formataCEP(result.rows[i][2]);
                    result.rows[i][2] = cep;
                };
                res.send(result.rows);
            });
        };
        run();
    });
    
    application.post('/enderecosModalDetails', function(req, res){
        var dados = req.body;

        if(dados.cep > 0){
            query_select = 'select ender.id, tpender.descricao tpenddescricao, cep.cep, ender.numero, ender.tp_endereco, ender.complemento, ' +
            'tplogr.descricao tplogrdescricao, logr.nome nmlograd, bai.nome nmbairro, dis.nome nmdistrito, cid.nome nmcidade, est.sigla estadossigla ' +
            'from enderecos ender, tipos_enderecos tpender, ceps cep, logradouros logr, tipos_logradouros tplogr, ' +
            'bairros bai, distritos dis, cidades cid, estados est  ' +
            'where ender.tp_endereco    = tpender.id(+) and ' +
            'ender.cep            = cep.id        and  ' +
            'cep.logradouro       = logr.id       and  ' +
            'logr.tipo_logradouro = tplogr.id     and  ' +
            'cep.bairro           = bai.id        and  ' +
            'logr.distrito        = dis.id        and  ' +
            'dis.cidade           = cid.id        and  ' +
            'cid.estado           = est.id        and  ' +
            'ender.id = :id ';
        } else {
            query_select = "select ender.id, tpender.descricao tpenddescricao, '0'cep, ender.numero, ender.tp_endereco, ender.complemento, " +
            "tplogr.descricao tplogrdescricao, logr.nome nmlograd, bai.nome nmbairro, dis.nome nmdistrito, cid.nome nmcidade, est.sigla estadossigla " +
            "from enderecos ender, tipos_enderecos tpender, logradouros logr, tipos_logradouros tplogr, " +
            "bairros bai, distritos dis, cidades cid, estados est  " +
            "where ender.tp_endereco    = tpender.id(+) and " +
            "ender.logradouro       = logr.id       and  " +
            "logr.tipo_logradouro = tplogr.id       and  " +
            "ender.bairro           = bai.id        and  " +
            "logr.distrito        = dis.id          and  " +
            "dis.cidade           = cid.id          and  " +
            "cid.estado           = est.id          and  " +
            "ender.id = :id ";
        }

        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_select, [dados.id], function(error, result){

                var cep = '';
                var cep = formataCEP(result.rows[0][2]);
                result.rows[0][2] = cep;

                res.send(result.rows);
            });
        };
        run();
    });
    

    application.post('/enderecosModalEdit', function(req, res){
        var dados = req.body;

        if(dados.cep > 0){
            query_select = 'select ender.pessoa,ender.numero,ender.complemento,ender.tp_endereco, '+
            'tpender.descricao,cep.cep,tplogr.descricao tplogrdescricao,logr.nome nmlograd, bai.nome nmbairro, ' +
            'cid.nome nmcidade, est.sigla estadossigla, ender.id, cep.id cepid, logr.id idlograd, bai.id idbai ' +
            'from enderecos ender, tipos_enderecos tpender, ceps cep, logradouros logr, ' +
            'tipos_logradouros tplogr, bairros bai, distritos dis, cidades cid, estados est ' +
            'where ender.tp_endereco = tpender.id and ender.cep = cep.id and cep.logradouro = logr.id and ' +
            'logr.tipo_logradouro = tplogr.id  and  cep.bairro = bai.id and logr.distrito = dis.id and  ' +
            'dis.cidade = cid.id and cid.estado = est.id and ender.id = :id' ;
        } else {
            query_select = "select ender.pessoa,ender.numero,ender.complemento,ender.tp_endereco,tpender.descricao,'0' cep," +
            "tplogr.descricao tplogrdescricao,logr.nome nmlograd, bai.nome nmbairro, cid.nome nmcidade, " +
            "est.sigla estadossigla, ender.id, 0 cepid, logr.id idlograd, bai.id idbai " +
            "from enderecos ender, tipos_enderecos tpender, logradouros logr, tipos_logradouros tplogr, bairros bai, distritos dis, cidades cid, estados est " +
            "where ender.tp_endereco = tpender.id and ender.bairro = bai.id and ender.logradouro = logr.id and " +
            "logr.distrito = dis.id and dis.cidade = cid.id and cid.estado = est.id and " +
            "logr.tipo_logradouro = tplogr.id and  ender.id = :id" ;
        }
    
        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_select, [dados.id], function(error, result){
                
                if(dados.cep > 0){
                    var cep = '';
                    var cep = formataCEP(result.rows[0][5]);
                    result.rows[0][5] = cep;
                }
                res.send(result.rows);
            });
        };
        run();
    });

    application.post('/enderecosModalEditCep', function(req, res){
        var dados = req.body;

        query_select = "select cep.id,cep.cep,tplogr.descricao tplogrdescricao,logr.nome nmlograd, " +
        "bai.nome nmbairro , cid.nome nmcidade, est.sigla estadossigla, cep.logradouro, cep.bairro, " +
        "dis.nome, tplogr.id tplogrid, rownum " +
        "from ceps cep, logradouros logr, tipos_logradouros tplogr, bairros bai, distritos dis, " +
        "cidades cid, estados est " +
        "where cep.logradouro = logr.id and logr.tipo_logradouro = tplogr.id  and  cep.bairro = bai.id " +
        "and logr.distrito = dis.id and  dis.cidade = cid.id and cid.estado = est.id and cep.cep = '" + dados.cep + "'"  ;
    
        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_select, function(error, result){
                res.send(result.rows);
            });
        };
        run();
    });

    application.post('/enderecosModalUpdate', function(req, res){
        var dados = req.body;

        var query_update = 'update enderecos set bairro = :bairro, logradouro = :logradouro, ' +
        'numero = :numero, complemento = :complemento, cep = :cep where id = :id';

        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_update, {
                id:          dados.modEditId,
                bairro:      dados.modEditIdLogradouro,
                logradouro:  dados.modEditIdBairro,
                numero:      dados.modEditNumero,
                complemento: dados.modEditComplemento,
                cep:         dados.modEditCepId},
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

    application.post('/enderecosModalDelete', function(req, res){
        var dados = req.body;

        var query_update = 'delete from enderecos where id = :id';

        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_update, {id: dados.modDelId},
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

    application.get('/enderecosModalNew', function(req, res){
        query_select = 'select id,descricao from tipos_enderecos';

        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, function(error, result){
                res.send(result.rows);
            });
        };
        run(); 
    });


    application.post('/enderecosModalSubmit', function(req, res){
        var dados = req.body;

        //console.log(dados);

        var query_insert = 'insert into enderecos (pessoa,tp_endereco,bairro,logradouro,cep,numero,complemento) ' +
        'values (:pessoa,:tp_endereco,:bairro,:logradouro,:cep,:numero,:complemento)';

        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_insert, {
                pessoa:         dados.modNewIdPessoa, 
                tp_endereco:    dados.modNewTipoEndereco,
                bairro:         dados.modNewBairro,
                logradouro:     dados.modNewLogradouro,
                cep:            dados.modNewIdCep,
                numero:         dados.modNewNumero,
                complemento:    dados.modNewComplemento},

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