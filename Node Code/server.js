//Create the HTTP servers for the Emergency webpage and the Pi HTTP requests
var emergencyServer = require('express')();
var piServer = require('express')();

emergencyServer.listen(8080);
piServer.listen(8123);

emergencyServer.get('/',function(request, response){
	response.send('<html><body>Testing Emergency</body></html>');
});

piServer.get('/',function(request, response){
	response.send({abc:123});
});