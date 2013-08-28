var sqlite3 = require('sqlite3').verbose(); 
var file = "iptvChannels.db";
var iptvDB = new sqlite3.Database(file);
var fs = require('fs'); 
var exists = fs.existsSync(file);


iptvDB.serialize(function() {
	if(!exists)
	{
		//create iptv  db file
		console.log("Creating iptvChannels Database."); 
		fs.openSync(file, "w");
		
		//dropTable first
		//create iptvtable
		iptvDB.run("CREATE TABLE iptvTable (channel_name TEXT,ip_address TEXT)");
	}
	
	iptvDB.prepare("SELECT * FROM iptvTable");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('NASA TV #1','udp://@239.15.15.1:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('NASA TV #2','udp://@239.15.15.2:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('NASA TV #3','udp://@239.15.15.2:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('Johnson TV','udp://@239.15.15.4:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('Quad Split ISS Downlink','udp://@239.15.15.5:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('ISS Downlink 1','udp://@239.15.15.6:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('Iss Downlink 2','udp://@239.15.15.7:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('ISS Downlink 3','udp://@239.15.15.8:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('Iss Downlink 4','udp://@239.15.15.9:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('FCR-Front Left','udp://@239.15.15.10:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('FCR-Left Side','udp://@239.15.15.11:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('FCR-Back Left','udp://@239.15.15.12:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('WFCR-Front Side','udp://@239.15.15.13:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('WFCR-Right Side','udp://@239.15.15.14:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('Weather Info','udp://@239.15.15.16:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('Weather Radar','udp://@239.15.15.17:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('CNN','udp://@239.15.15.35:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('NASA TV Guide','udp://@239.15.15.36:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('KUBE','udp://@239.15.15.38:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('KRIV 26 FOX','udp://@239.15.15.39:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('KHOU 11 CBS','udp://@239.15.15.40:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('KRPC 2 NBC','udp://@239.15.15.41:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('KTRK 13 ABC','udp://@239.15.15.42:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('Scola Germany','udp://@239.15.15.43:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('Satellite Map','udp://@239.15.15.45:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('NASA Channel','udp://@239.15.15.46:30120')");
	iptvDB.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('NASA Educational','udp://@239.15.15.47:30120')");

});
	
//iptvDB.each("SELECT * FROM iptvTable", function(err, row) {
//	console.log(row.channel_name + ", " + row.ip_address);
//});

 