'use strict'

const sql = require('sqlite3');
const util = require('util');


// old-fashioned database creation code 

// creates a new database object, not a 
// new database. 
const db = new sql.Database("activities.db");

// check if database exists
let cmd = " SELECT name FROM sqlite_master WHERE type='table' AND name='ActivityTable' ";
let cmd2 = " SELECT name FROM sqlite_master WHERE type='table' AND name='Profile' ";

db.get(cmd, function (err, val) {
  if (val == undefined) {
        console.log("No database file - creating activity");
        createActivityTable();
  } else {
        console.log("Database act found");
  }
});

// only 1 creating both tables instead...
db.get(cmd2, function (err, val) {
  if (val == undefined) {
        console.log("No database file - creating profile");
        createProfileTable();
  } else {
        console.log("Database profile found");
  }
});

// called to create table if needed
function createActivityTable() {
  // explicitly declaring the rowIdNum protects rowids from changing if the 
  // table is compacted; not an issue here, but good practice
  const cmd = 'CREATE TABLE ActivityTable (rowIdNum INTEGER PRIMARY KEY, googleuserid TEXT, activity TEXT, date INTEGER, amount FLOAT)';
  db.run(cmd, function(err, val) {
    if (err) {
      console.log("Activity creation failure",err.message);
    } else {
      console.log("Created activitytable");
    }
  });
}

function createProfileTable() {
  // explicitly declaring the rowIdNum protects rowids from changing if the 
  // table is compacted; not an issue here, but good practice
  const cmd = 'CREATE TABLE Profile (rowIdNum INTEGER PRIMARY KEY, googleuserid TEXT, fname TEXT)';
  db.run(cmd, function(err, val) {
    if (err) {
      console.log("Profile creation failure",err.message);
    } else {      console.log("Created profile table");
    }
  });
}

// wrap all database commands in promises
db.run = util.promisify(db.run);
db.get = util.promisify(db.get);
db.all = util.promisify(db.all);

// empty all data from db
db.deleteEverything = async function() {
  await db.run("delete from ActivityTable");
  await db.run("delete from Profile")
  db.run("vacuum");
}

// allow code in index.js to use the db object
module.exports = db;
