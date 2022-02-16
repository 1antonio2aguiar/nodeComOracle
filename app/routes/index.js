module.exports = function(application){
	application.get('/', function(req, res){
		application.app.controllers.login.login(application, req, res);
	});

	application.get('/menu', function(req, res){
		application.app.controllers.menu.menu(application, req, res);
	});
}