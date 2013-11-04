var db = '';
var fs = '';
var path = '';

// *m = required module
exports.init = function(fsm, dbm, pathm){
	db = dbm;
	fs = fsm;
	path = pathm;
};

/*--------------------------------------------------------------------------------------------------	
// updateFoldersCreate : string
// Adds the given file to all Pi playlists that play the folder the file is added to
// INPUT: file - The file path of the newly created file
// CALLS: playPi
// Examples:
//		updateFoldersCreate("C:\DigitalSignage\media\piFilling\Org\testing.jpg") -> Adds testing.jpg to 
//			all Pi's piFolders that watch C:\DigitalSignage\media\piFilling\Org */
exports.updateFoldersCreate = function(file){
	console.log('File Created:' +file);
	console.log('Path: '+ path.dirname(file.replace(/\//g, '\\')));
	
	//Check for Thumbs.db
	if(file.substr(file.length-9) === 'Thumbs.db'){
		console.log('File is Thumbs.db, aborting symlink');
		return;
	}
	
	//Search the db for all Pi's that rely on the path of the updated file
	db.each("SELECT pID, ipaddress, location, orgcode FROM Pidentities WHERE mediapath LIKE '%"+path.dirname(file.replace(/\//g, '\\'))+"%'", function(err,row){
		console.log(row);
		//Create "unique" filename
		//Parse out any improper path separators **WINDOWS SPECIFIC CODE**
		var pathArray = file.replace(/\//g, '\\').split("\\");
		var length = pathArray.length;
		var piFolder = PIFOLDERS_ROOT + path.sep + row.pID + path.sep;
		if (length > 3) {
			filename = pathArray[length - 3] + "." + pathArray[length - 2] + "." + pathArray[length - 1];
		} else {
			filename = pathArray[pathArray.length - 1];
		}
		
		//Add the file to the given piFolder for persistence
		fs.symlink(file.replace(/\//g, '\\'), piFolder + filename, function (err) {
                        console.log("Trying ze link: " + piFolder + filename);
                        if (err) console.error(err.code);
		});
		//Tell the Pi to recollect the pictures in the piFolder/piDee folder
		playPi(row.ipaddress);
	});
}

/*--------------------------------------------------------------------------------------------------	
// updateFoldersDelete : string
// Adds the given file to all Pi playlists that play the folder the file is added to
// INPUT: file - The file path of the newly created file
// CALLS: playPi
// Examples:
//		updateFoldersDelete("C:\DigitalSignage\media\piFilling\Org\testing.jpg") -> Removes testing.jpg from all the 
//			Pi's piFolders that depend on C:\DigitalSignage\media\piFilling\Org */
exports.updateFoldersDelete = function(file){
	console.log('File Deleted:' +file);
	console.log('Path: '+ path.dirname(file.replace(/\//g, '\\')));
	//Search the db for all Pi's that rely on the path of the updated file
	db.each("SELECT pID, ipaddress, location, orgcode FROM Pidentities WHERE mediapath LIKE '%"+path.dirname(file.replace(/\//g, '\\'))+"%'", function(err,row){
		console.log(row);
		//Create "unique" filename
		//Parse out any improper path separators **WINDOWS SPECIFIC CODE**
		var pathArray = file.replace(/\//g, '\\').split("\\");
		var length = pathArray.length;
		var piFolder = PIFOLDERS_ROOT + path.sep + row.pID + path.sep;
		if (length > 3) {
			filename = pathArray[length - 3] + "." + pathArray[length - 2] + "." + pathArray[length - 1];
		} else {
			filename = pathArray[pathArray.length - 1];
		}
		
		//Add the file to the given piFolder for persistence
		fs.unlink(piFolder + filename, function (err) {
                        console.log("Deleting " + piFolder + filename);
                        if (err) console.error(err.code);
		});
		//Tell the Pi to recollect the pictures in the piFolder/piDee folder
		playPi(row.ipaddress);
	});
}