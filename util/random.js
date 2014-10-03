var Random = {
	generateApiAccessToken : generateToken
};

function generateToken()
{
    console.log("tokentoken")
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < 32; i++ ) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

module.exports = Random;