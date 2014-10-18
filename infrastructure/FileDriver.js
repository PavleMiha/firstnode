var mongoose = require('mongoose');
var fs = require('fs');
var Q = require('q');

var fileSchema = mongoose.Schema({
    ext: {type: String},
    contenttype: {type: String}
});

var File = mongoose.model('File', fileSchema);



function FileDriver() {
  this.get = get;
  this.handleGet = handleGet;
  this.getNewFileId = getNewFileId;
  this.handleUploadRequest = handleUploadRequest;
    
};

function get(id) {
    var deferred = Q.defer();
	var query = {
		_id: id
	};
    //var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
    //if (!checkForHexRegExp.test(id)) {
    //    deferred.reject("invalid id");
    //}
    {
        File.findOne(query, function(error,file) {
            if (error) deferred.reject(error);
            else deferred.resolve(file);
        })
    }

    return deferred.promise;
};

function handleGet(req, res) { //1
    var fileId = req.params.id;
    if (fileId) {
        this.get(fileId).then(function(thisFile) { //2
            if (thisFile) {
                 var filename = fileId + thisFile.ext; //3
                 var filePath = './uploads/'+ filename; //4
                 res.sendfile(filePath); //5
            } else res.send(404, 'file not found');
        }).fail(function(error) {
            res.send(500, error);
        })
    } else {
	    res.send(404, 'file not found');
    }
};

function getNewFileId(newobj, callback) { //2
    console.log("a");
    var file = new File({
        ext: newobj.ext,
        contenttype: newobj.ctype,
    });
    
	file.save(function(err,obj) {
	    console.log("asdfasdf");
		if (err) { console.log("b"); callback(err); } 
		else { console.log("c"); callback(null,obj._id); } //3
	});
};

function handleUploadRequest(req, res) {
    console.log("1");
    var ctype = req.get("content-type");
    var ext = ctype.substr(ctype.indexOf('/')+1);
    console.log("2");
    if (ext) {ext = '.' + ext; } else {ext = '';}
    this.getNewFileId({'contenttype':ctype, 'ext':ext}, function(err,id) { //4
        console.log("3");
        if (err) { res.send(400, err); } 
        else {
            console.log("4");
            var fstream;
            req.pipe(req.busboy);
            req.busboy.on('file', function (fieldname, file, filename) {
                console.log("Uploading: " + filename); 
                fstream = fs.createWriteStream(__dirname + '/uploads/' + filename);
                file.pipe(fstream);
                fstream.on('close', function () {
                    res.redirect('back');
                });
            });
        }
    });
};
 
module.exports = FileDriver;