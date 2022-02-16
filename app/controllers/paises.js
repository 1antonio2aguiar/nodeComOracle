module.exports.paisesList = function(application, req, res){
    //console.log('ta no controller');
    //var conn = application.config.dbConnection();
    console.log(conn);
    console.log('Deus agora vai');
   
    //var PaisesDAO = new application.app.models.PaisesDAO(conn);

    //res.render('paises/paisesList', {validacao : {} , pais : {}});
    
    //PaisesDAO.getPaises(function(error, result){
      //  res.render("paises/paisesList", {paises : result})
    //});
}

/*module.exports.paisesAdd = function(application, req, res){
    var conn = application.config.dbConnection();
    var PaisesModel = new application.app.models.PaisesDAO(conn);

    PaisesModel.getPais(function(error, result){
        res.render("paises/paisesAdd", {pais : result})
    });

    res.render('paises/paisesAdd', { paises : {}});
}

module.exports.paisesSalvar = function(application, req, res){

    var pais = req.body

    req.assert('nome','Nome é obrigatório').notEmpty();
    req.assert('sigla','Sigla é obrigatória').notEmpty();
    req.assert('nacionalidade','Sigla é obrigatória').notEmpty();

    var errors = req.validationErrors();
    if(errors){
        res.render("paises/paisesAdd", { validacao : errors , pais : pais});
        return;
    }

    var connection = application.config.dbConnection();
    var PaisesDAO = new application.app.models.PaisesDAO(connection);

    PaisesDAO.salvarPais = function(application, req, res){
        res.redirect('/paises/paisesList');
    }
}*/