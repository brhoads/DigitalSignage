var http = require('http'); 
var fs = require("fs"); 
var sqlite3 = require("sqlite3").verbose(); 
var file = "test6.db";
var exists = fs.existsSync(file);
var body = '';
var db = new sqlite3.Database(file);

function piDeeFunction(loc, org, body)
{
  var piChunk = JSON.parse(body);
  if(piChunk.location == "Location" || piChunk.org == "Org Code")
  {
    console.log("Sending command to reset pi");
  }
  else
  {
	if(piChunk.piDee = -1)
	{
		db.run("INSERT INTO Pidentities (IP_address, Location, Orgcode, timestamp, filelink) VALUES ('" + piChunk.piip + "', '" + piChunk.location + "', '" + piChunk.org + "', Time('now'), 'c:/blahblahblah')", function(error)
            {
			    piChunk.piDee = this.lastID;
		        console.log(piChunk.piDee);
            });
	        //send JSON command with piDee
		//build file path
	//	db.run("UPDATE Pidentities (filelink) SET ('PI FILE PI FILE') WHERE rowid = piDee");
	}
	
  }
}

http.createServer(function (inreq, res)
{

   //create the database if it has not been created 
   if(!exists)
    {
      //create Pidentities db file
      console.log("Creating Pidentities Database."); 
      fs.openSync(file, "w"); 
      //create Pidentities table
      db.run("CREATE TABLE Pidentities (PiD ROWID, timestamp TEXT, IP_address TEXT, Location TEXT, Orgcode TEXT, filelink TEXT)"); 
    } 

   inreq.on('data', function (data)
   {
      body += data;
   });

  // var test = JSON.parse(body);
  // console.log(test.location);

   inreq.on('end', function()
   {
	   res.writeHead(200, {'Content-Type': 'application/json'});
	   res.end('{OK}\n');
	  
          var piChunk = JSON.parse(body);
        //  console.log(piChunk.location);

		var user = { 
		  jsonrpc: '2.0', 
		  id: '1', 
		  method: 'GUI.ShowNotification',  //eventually player.open
		  params: {
			 title: 'HAYLEY AND PETER ROCK!',
			 message: body 
		  }
		}; 
	   
	   piDeeFunction(piChunk.location, piChunk.org, body);

	   var userString = JSON.stringify(user); 

	   var headers = { 
		  'Content-Type': 'application/json', 
		  'Content-Length': userString.length 
	   };
	 
	   var options = { 
		  host: '139.169.8.145', 
		  port: 80, 
		  path: '/jsonrpc', 
		  method: 'POST', 
		  headers: headers 
	   }; 
		console.log('Before outgoing request');
		
		//boolean values for error checking to keep clean
		
	   db.serialize(function() { 
		   //look to see if create needs to be in db.serialize
     	   //var stmt = db.prepare("INSERT INTO Pidentities (IP_address, Location, Orgcode, timestamp, filelink) VALUES ('" + piChunk.piip + "', '" + piChunk.location + "', '" + piChunk.org + "', Time('now'), 'c:/blahblahblah')");
		  // stmt.run();
		   
		   //error checks for now
		   //selecting and printing
		   //stmt.finalize();
		   db.each("SELECT rowid AS piDee, * FROM Pidentities", function(err, row) {
			     console.log(row.piDee + ": " + row.Location, row.IP_address, row.Orgcode, row.timestamp, row.filelink);
			});


		}); 
           //db.close();
		
	   // Setup the request. The options parameter is 
	   // the object we defined above. 
	   var outreq = http.request(options, function(res) { 
		  console.log('start of outgoing request');

		  res.setEncoding('utf-8'); 
		  var responseString = ''; 
		  
		  res.on('data', function(data) {
			 responseString += data;
		  }); 
		 console.log(body);
		 console.log('Leaving outgoing request');
		 
          	 

		  res.on('end', function() { 
			 var resultObject = JSON.parse(responseString); 
		   }); 
	   }); 

	   outreq.on('error', function(e) { 
		  // TODO: handle error. 
		});

	   outreq.write(userString); 
	   outreq.end();

   });

	console.log('This is the end');
    
	//Close near server shut down
	//Google to find out what that http.COMMAND is
	//db.close();
	
}).listen(8124);
