'use strict'

// using a Promises-wrapped version of sqlite3
const db = require('./sqlWrap');

// SQL commands for ActivityTable
const insertDB = "insert into ActivityTable (googleuserid, activity, date, amount) values (?,?,?,?)";
const getOneDB = "select * from ActivityTable where activity = ? and date = ? and amount = ?";
const allDB = "select * from ActivityTable where activity = ?";
const insertProfileDB = "insert into Profile (googleuserid, fname) values (?,?)";
// for debug
const fullDB = "select * from ActivityTable";
const fullProfileDB = "select * from Profile";
async function testDB () {

  // for testing, always use today's date
  const today = new Date().getTime();

  // all DB commands are called using await

  // empty out database - probably you don't want to do this in your program
  await db.deleteEverything();

  await db.run(insertDB,["running",today,2.4]);
  await db.run(insertDB,["walking",today,1.1]);
  await db.run(insertDB,["walking",today,2.7]);
  
  console.log("inserted two items");

  // look at the item we just inserted
  let result = await db.get(getOneDB,["running",today,2.4]);
  console.log(result);

  // get multiple items as a list
  result = await db.all(allDB,["walking"]);
  console.log(result);
}

async function insertActivity(userid,newEntry) {
  //let [yyyy, mm, dd] = newEntry.date.split("-"); 
  //var mydate = new Date(Date.UTC(yyyy, mm-1, dd, 0, 0));
  // TZ issues workaround at browser side
	//var userid_str = "'"+userid+"'";
	//console.log("insertAct:",userid_str);
  var fulldate = new Date(newEntry.date);
  var mydate = fulldate.getTime();
  console.log("insert");
  await db.run(insertDB,[userid,newEntry.activity, mydate, newEntry.scalar]);
}

async function insertProfile(userid,name){
  console.log(typeof userid);
  console.log(typeof name);
  var userid_str = "'"+userid+"'";
  var name_str = "'"+name+"'";
  const cmd = "select * from Profile where googleuserid = "+userid_str; //+ " and fname = "+name;
  console.log('cmd insert:',cmd)
  let result = await db.all(cmd);
  console.log("result:", result);
  //name = "'"+name+"'";
  if(!(result.length > 0)){
    //const cmd2 = "INSERT INTO Profile (googleuserid, fname) VALUES('"+userid+"', '"+name+"')";
    await db.run(insertProfileDB,[userid,name]);
    //await db.run(cmd2);
  }else{
    return {};
  }

}

async function userSearch(userinfo){
  var userid_str = "'"+userinfo+"'";
  const cmd = "select * from Profile where googleuserid = "+userid_str;
  
  let result = await db.all(cmd);
  console.log("userSearch:",result[0].fname);
  return await result[0].fname;
}

async function reminder(userinfo) {
	var userid_str = "'"+userinfo+"'";
  const today = new Date().getTime();
  const remDB = "select * from ActivityTable where googleuserid = "+userid_str+" and amount = -1 and date < " + today.toString() + " ORDER BY date DESC;";

  let result = await db.all(remDB);
  if (result.length > 0) {
    // first element, if any will be most recent -> return
    for (var i = 0; i < result.length; i++) {
      // delete older entries
      const delDB = "delete from ActivityTable where rowIdNum=" + result[i].rowIdNum.toString();
      await db.run(delDB);
    }
    db.run("vacuum");
    // return only data fields (names as per fitnessLog.js)
    var retData = {
    activity: result[0].activity,
    date: result[0].date,
    scalar: result[0].amount 
    } 
    return JSON.stringify(retData);
  }
  return {};
}

// return the whole DB to debug
async function full() {
  //await db.deleteEverything(); // uncomment will delete DB on calling /dump (for debug)
  //await db.run(insertProfileDB,["106057521533558260625","Joske"]); //test
  let result = await db.all(fullDB);
  console.log(result);
  return result;
}

async function full2() {
  let result = await db.all(fullProfileDB);
  console.log(result);
  return result;
}

// helper for chart
async function getMostRecentAct(userid){
  const today = new Date();
  today.setHours(0,0,0,0);
  const getRecent = "select * from ActivityTable where googleuserid = "+userid+" and amount != -1 and date < " + today.getTime().toString() + " ORDER BY date DESC";
  console.log(getRecent);
  let result = await db.all(getRecent);
  console.log("act:", result[0].activity);
  return result[0].activity; 
}

async function chart(userinfo,date,activity){
	var userid_str = "'"+userinfo+"'";
  var yest = new Date();
  yest.setHours(0,0,0,0);
  yest.setDate(yest.getDate()-1);
  if (date > yest.getTime()) {
    return "error: date not in past";
  }
  if(activity === ''){
    let activity_obj = await getMostRecentAct(userid_str);
    activity = activity_obj;
  }
  const dayoffset = 86400000;
  const firstdate = date - (7 * dayoffset);
  const getChartDB = "select * from ActivityTable where googleuserid = "+userid_str+" and amount != -1 and date <= " +  date +" and date >" + firstdate+ " and activity = '" + activity + "'  ORDER BY date ";
  let result = await db.all(getChartDB);
  const returnChart = new Array;
  for(var i = 0; i < result.length; i++){
    var chartReturn = {
      activity : result[i].activity,
      date : result[i].date,
      amount : result[i].amount
    }
    returnChart[i] = chartReturn;
    console.log(returnChart);
  }
  return(JSON.stringify(returnChart));
}

module.exports.testDB = testDB;
module.exports.insertActivity = insertActivity;
module.exports.full = full;
module.exports.full2 = full2;
module.exports.reminder = reminder;
module.exports.chart = chart;
module.exports.insertProfile = insertProfile;
module.exports.userSearch = userSearch;