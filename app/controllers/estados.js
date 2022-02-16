module.exports.estadosList = function(application, req, res){
    console.log('ta no controller');
    //var conn = application.config.dbConnection();
    console.log(conn);
    console.log('Deus agora vai');
   
    //var PaisesDAO = new application.app.models.PaisesDAO(conn);

    PaisesDAO.getPaises(function(error, result){
        res.render("estados/estadosList", {estados : result})
    });
};



