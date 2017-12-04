/*使用需先下载request，cheerio，async，mysql，cron 包*/
var request=require("request");
var cheerio=require("cheerio");
const md5=require("./md5");
var async=require("async");
var mysql=require("./mysql");
var buf=new Buffer(65535);
var CronJob = require('cron').CronJob;
new CronJob('1 * * * * *', function() {
    go();
}, null, true, 'America/Los_Angeles');

function go() {
    var arr=[];
    var arrs=[];
    async.series([
        function (next) {
            mysql.query("select * from con", function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    for (var i = 0; i < result.length; i++) {
                        save(result[i].title, 4);/*将取出来的内容按照save算法存入buf*/
                    }
                }
                next();
            })
        },
        function (next) {
            request("http://tech.ifeng.com/listpage/803/1/list.shtml", function (err, head, body) {
                //想要爬取信息的网址
                var $ = cheerio.load(body);
                //将取来的字符串用此方法可选中
                $(".zheng_list h2 .t_css").each(function (index, obj) {
                    /*第一次爬取文章的标题*/
                    var newobj = {};
                    newobj.url = $(obj).attr("href");
                    newobj.text = $(obj).text();
                    /*将爬取到的内容存入对象*/
                    diff(newobj.text, 4, function () {
                        save(newobj.text, 4)
                    }, function () {
                        arr.push(newobj);
                    })
                    /*布隆算法进行去重，并保存*/

                })
                next();
            })
        },
        function (next) {
            var i = 0;
            async.eachSeries(arr, function (item, next1) {
            /*异步，循环的串行序列，第一个参数为数组对象"[{}]",第二个参数为处理函数*/

                request(item.url, function (err, head, body) {
                    /*调用request，item.url是目的网址，body为取到的
                    *网址的所有信息，为字符串*/
                    i++
                    var $ = cheerio.load(body);
                    var con = $("#main_content").text();

                    var newarr = [];
                    newarr.push(item.text);
                    newarr.push(con);
                    arrs.push(newarr);
                    console.log(arrs.length);
                    next1()

                })

            }, function () {
                next();
            })


        },
        function (next) {
            mysql.query("insert into con (title,con) values ?", [arrs], function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("ok")

                }
                next();
            })
        }
    ], function () {
        console.log("end");
    })
}


function save(str,num){
    var result=md5(str);
    /*将传入的字符串用md5方式加密*/
    for(var i=0;i<result.length;i+=num){
        buf[(parseInt(result.substr(i,num),16))]=1;
    }
    /*循环将num位md5表示的数转换成16进制，然后将声明的buf的该位置变为1*/
    /*用此算法去重，如果另一个str的buf的每个位置的数字都为1，则相同*/
}
/*save 方法有两个参数 str传入要处理的字符串 num表示要分割一组的长度*/
function diff(str,num,same,no){
    var result=md5(str);
    var flag=true;
    for(var i=0;i<result.length;i+=num){
        if(buf[parseInt(result.substr(i,num),16)]!=1){
            flag=false;
            break;
        }
    }
    if(flag){
        if(same){
            same();
        }
    }else{
        if(no){
            no();
        }
    }

}