var mysql=require("mysql");
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'roots',
    database : 'nodes',
    dateStrings:'Date'
});
module.exports=connection;
