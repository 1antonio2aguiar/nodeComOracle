
module.exports.pessoasFuncoes = function(application, req, res){
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
}
