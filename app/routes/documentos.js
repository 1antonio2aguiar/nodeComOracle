module.exports = function(application){
    var oracledb = require('oracledb');
    let dbConfig = {user:"dbo_ccm_pessoas", 
                    password:"dbo_ccm_pessoas", 
                    connectString:"172.17.0.113/apolo"};

    application.post('/documentosList', function(req, res){
        var query_select = ''; 
        var id_pessoa = 0;

        var dados = req.body;
        id_pessoa = dados.id_pessoa;

        query_select = "select doc.id, doc.pessoa, doc.tipo_documento,  doc.numero_documento, " + 
        "to_char(doc.data_documento,'DD/MM/YYYY')data_documento, to_char(doc.data_expedicao,'DD/MM/YYYY')data_expedicao, " +
        "doc.documento_origem, doc.orgao_expedidor, doc.numero_registro_cnh, to_char(doc.data_primeira_cnh,'DD/MM/YYYY')data_primeira_cnh, " +
        "to_char(doc.data_validade_cnh,'DD/MM/YYYY')data_validade_cnh, doc.categoria_cnh, doc.titulo_eleitoral, " +
        "doc.zona, doc.secao, doc.termo, doc.folha, doc.livro, to_char(doc.dt_emis_cert,'DD/MM/YYYY')dt_emis_cert, " + 
        "doc.uf_cartorio, doc.cidade_cartorio, doc.cartorio, tpdoc.descricao, " +
        "pescartorio.nome nmpescartorio " +
        "from documentos doc, tipos_documentos tpdoc, pessoas pescartorio " +
        "where doc.tipo_documento  = tpdoc.id and " +
        "doc.cartorio        = pescartorio.id(+) and " +
        "doc.pessoa = :id ";

        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_select, [id_pessoa], function(error, result){
                res.send(result.rows);
            });
        };
        run();
    });   
    
    application.get('/documentosModalNew', function(req, res){
        query_select = 'select id,descricao from tipos_documentos';

        async function run(){
            var connOracleDb = await oracledb.getConnection(dbConfig)
            connOracleDb.execute(query_select, function(error, result){
                res.send(result.rows);
            });
        };
        run(); 
    });

    application.post('/documentosModalSubmit', function(req, res){
        var dados = req.body;

        dados.modNewIdPessoa = parseInt(dados.modNewIdPessoa);
        dados.modNewTipoDocumento = parseInt(dados.modNewTipoDocumento);

        if(dados.modDocNewDtDocumento != null && dados.modDocNewDtDocumento != ''){
            dados.modDocNewDtDocumento = formataData(dados.modDocNewDtDocumento);
        } else {dados.modDocNewDtDocumento = null}
        
        if(dados.modDocNewDtExpedicao != null && dados.modDocNewDtExpedicao != ''){
            dados.modDocNewDtExpedicao = formataData(dados.modDocNewDtExpedicao);
        } else {dados.modDocNewDtExpedicao = null}
        
        if(dados.modDocNewDtPricnh != null && dados.modDocNewDtPricnh != ''){
            dados.modDocNewDtPricnh = formataData(dados.modDocNewDtPricnh);
        } else {dados.modDocNewDtPricnh = null}
        
        if(dados.modDocNewDtValcnh != null && dados.modDocNewDtValcnh != ''){
            dados.modDocNewDtValcnh = formataData(dados.modDocNewDtValcnh);
        } else {dados.modDocNewDtValcnh = null}
        
        if(dados.modDocNewDtEmiscert != null && dados.modDocNewDtEmiscert != ''){
            dados.modDocNewDtEmiscert = formataData(dados.modDocNewDtEmiscert);
        } else {dados.modDocNewDtEmiscert = null}

        if(dados.modNewCartorio == '-1'){dados.modNewCartorio = null} 

        if(dados.modDocNewZona == ''){dados.modDocNewZona = null} 

        if(dados.modDocNewSecao == ''){dados.modDocNewSecao = null} 

        var numero_reg_cnh = '';
        if(dados.modNewTipoDocumento == 3){numero_reg_cnh = dados.modDocNewNroDocumento} else {numero_reg_cnh = null}

        var titulo_eleitor = 0;
        if(dados.modNewTipoDocumento == 11){titulo_eleitor = parseInt(dados.modDocNewNroDocumento)} else {titulo_eleitor = null}

        var query_insert = 'insert into documentos (pessoa,tipo_documento, ' +
        'numero_documento,data_documento,data_expedicao,documento_origem, ' +
        'orgao_expedidor,numero_registro_cnh,data_primeira_cnh,data_validade_cnh, ' +
        'categoria_cnh,titulo_eleitoral,zona,secao,termo,folha,livro,dt_emis_cert, ' +
        'cartorio) ' +

        'values (:pessoa,:tipo_documento,:numero_documento,:data_documento,:data_expedicao, ' +
        ':documento_origem,:orgao_expedidor,:numero_registro_cnh,:data_primeira_cnh, ' +
        ':data_validade_cnh,:categoria_cnh,:titulo_eleitoral,:zona,:secao,:termo,:folha,:livro, ' +
        ':dt_emis_cert,:cartorio)'; 

        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_insert, {pessoa: dados.modNewIdPessoa,
                    tipo_documento: 		dados.modNewTipoDocumento,
                    numero_documento: 		dados.modDocNewNroDocumento,
                    data_documento: 		dados.modDocNewDtDocumento,
                    data_expedicao: 		dados.modDocNewDtExpedicao,
                    documento_origem: 		dados.modDocNewOrigem,
                    orgao_expedidor: 		dados.modDocNewExpedidor,
                    numero_registro_cnh: 	numero_reg_cnh,
                    data_primeira_cnh: 		dados.modDocNewDtPricnh,
                    data_validade_cnh: 		dados.modDocNewDtValcnh,
                    categoria_cnh: 			dados.modDocNewCatcnh,
                    titulo_eleitoral: 		titulo_eleitor,
                    zona:  					dados.modDocNewZona,
                    secao: 					dados.modDocNewSecao,
                    termo: 					dados.modDocNewTermo,
                    folha: 					dados.modDocNewFolha,
                    livro: 					dados.modDocNewLivro,
                    dt_emis_cert: 			dados.modDocNewDtEmiscert,
                    cartorio: 			    dados.modNewCartorio },
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

    application.post('/documentosModalEdit', function(req, res){
        //var dados = req.query;
        var dados = req.body;

        async function run(){ 
            // Cartorios
            var query_select = 'select car.id,car.pessoa,pes.nome from cartorios car, pessoas pes where car.pessoa = pes.id';

            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_select, function(error, result){
                var cartorios = result.rows;   
                
                var query_select = "select doc.id, doc.pessoa, doc.tipo_documento,  doc.numero_documento, " + 
                "to_char(doc.data_documento,'YYYY-MM-DD')data_documento, to_char(doc.data_expedicao,'YYYY-MM-DD')data_expedicao, " +
                "doc.documento_origem, doc.orgao_expedidor, doc.numero_registro_cnh, to_char(doc.data_primeira_cnh,'YYYY-MM-DD')data_primeira_cnh, " +
                "to_char(doc.data_validade_cnh,'YYYY-MM-DD')data_validade_cnh, doc.categoria_cnh, doc.titulo_eleitoral, " +
                "doc.zona, doc.secao, doc.termo, doc.folha, doc.livro, to_char(doc.dt_emis_cert,'YYYY-MM-DD')dt_emis_cert, " +
                "doc.cartorio, tpdoc.descricao, pescart.nome from documentos doc, tipos_documentos tpdoc, cartorios car, pessoas pescart " +
                "where doc.tipo_documento = tpdoc.id and doc.cartorio = car.id(+) and car.pessoa = pescart.id(+) and doc.id = :id ";
                
                connOracleDb.execute(query_select, [dados.id], function(error, result){
                    var documento = result.rows;
                    var dados = { documento: documento, cartorios: cartorios };
                    res.send(dados);
                });
            });
        };
        run();
    });
    

    application.post('/documentosModalUpdate', function(req, res){
        var dados = req.body;
        dados.modDocEditId = parseInt(dados.modDocEditId);
        dados.modEditTipoDocumentoId = parseInt(dados.modEditTipoDocumentoId);

        if(dados.modDocEditDocumentoDt != null && dados.modDocEditDocumentoDt != ''){
            dados.modDocEditDocumentoDt = formataData(dados.modDocEditDocumentoDt);
        } else {dados.modDocEditDocumentoDt = null}
        
        if(dados.modDocEditDtExpedicao != null && dados.modDocEditDtExpedicao != ''){
            dados.modDocEditDtExpedicao = formataData(dados.modDocEditDtExpedicao);
        } else {dados.modDocEditDtExpedicao = null}
        
        if(dados.modDocEditDtPricnh != null && dados.modDocEditDtPricnh != ''){
            dados.modDocEditDtPricnh = formataData(dados.modDocEditDtPricnh);
        } else {dados.modDocEditDtPricnh = null}
        
        if(dados.modDocEditDtValcnh != null && dados.modDocEditDtValcnh != ''){
            dados.modDocEditDtValcnh = formataData(dados.modDocEditDtValcnh);
        } else {dados.modDocEditDtValcnh = null}
        
        if(dados.modDocEditDtEmiscert != null && dados.modDocEditDtEmiscert != ''){
            dados.modDocEditDtEmiscert = formataData(dados.modDocEditDtEmiscert);
        } else {dados.modDocEditDtEmiscert = null}

        if(dados.modEditCartorio == '-1'){dados.modEditCartorio = null} 

        if(dados.modDocEditZona == ''){dados.modDocEditZona = null} 

        if(dados.modDocEditSecao == ''){dados.modDocEditSecao = null} 

        var numero_reg_cnh = '';
        if(dados.modEditTipoDocumentoId == 3){numero_reg_cnh = dados.modDocEditNroDocumento} else {numero_reg_cnh = null}

        var titulo_eleitor = 0;
        if(dados.modEditTipoDocumentoId == 11){titulo_eleitor = parseInt(dados.modDocEditNroDocumento)} else {titulo_eleitor = null}

        var query_update = 'update documentos set numero_documento        =  :numero_documento  , ' +     
        'data_documento       =  :data_documento      , data_expedicao    =  :data_expedicao    , ' + 
        'documento_origem     =  :documento_origem    , orgao_expedidor   =  :orgao_expedidor   , ' + 
        'numero_registro_cnh  =  :numero_registro_cnh , data_primeira_cnh =  :data_primeira_cnh , ' + 
        'data_validade_cnh    =  :data_validade_cnh   , categoria_cnh     =  :categoria_cnh     , ' + 
        'titulo_eleitoral     =  :titulo_eleitoral    , zona              =  :zona              , ' + 
        'secao                =  :secao               , termo             =  :termo             , ' + 
        'folha                =  :folha               , livro             =  :livro             , ' + 
        'dt_emis_cert       =  :dt_emis_cert        , cartorio         =  :cartorio where id = :id ';

        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_update, 
                    {id:                 dados.modDocEditId,
                    numero_documento:    dados.modDocEditNroDocumento,
                    data_documento:      dados.modDocEditDocumentoDt,
                    data_expedicao:      dados.modDocEditDtExpedicao,
                    documento_origem:    dados.modDocEditOrigem,
                    orgao_expedidor:     dados.modDocEditExpedidor,
                    numero_registro_cnh: numero_reg_cnh,
                    data_primeira_cnh:   dados.modDocEditDtPricnh,
                    data_validade_cnh:   dados.modDocEditDtValcnh,
                    categoria_cnh:       dados.modDocEditCatcnh,
                    titulo_eleitoral:    titulo_eleitor,
                    zona:                dados.modDocEditZona,
                    secao:               dados.modDocEditSecao,
                    termo:               dados.modDocEditTermo,
                    folha:               dados.modDocEditLivro,
                    livro:               dados.modDocEditFolha,
                    dt_emis_cert:        dados.modDocEditDtEmiscert,
                    cartorio:            dados.modEditCartorio},
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

    application.post('/documentoModalDelete', function(req, res){
        var dados = req.body;
        
        var query_delete = 'delete from documentos where id = :id';

        async function run(){ 
            var connOracleDb = await oracledb.getConnection(dbConfig)
                connOracleDb.execute(query_delete, {id: dados.modDocDelId},
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