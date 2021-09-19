
'use strict';  // always start with this 

//abdullah just added
initializeName(); // maybe remove

import barchart from './barchart.js'

barchart.init('chart-anchor', 500, 300);


/* Set default date in forms to current date */
document.getElementById('pAct-date').valueAsDate = newUTCDate()
document.getElementById('fAct-date').valueAsDate = newUTCDate()


/* Past Activity 'Add New Activity' Button - Show Form */
let add_past_activity_button = document.getElementById("addPastActivityButton")
add_past_activity_button.addEventListener("click", add_past_activity_onclick);


/* Future Activity 'Add New Activity' Button - Show Form */
let add_future_activity_button = document.getElementById("addFutureActivityButton")
add_future_activity_button.addEventListener("click", add_future_activity_onclick);


/* Past Activity Form Dropdown */
let past_activity_dropdown = document.getElementById("pAct-activity")
past_activity_dropdown.addEventListener("change", past_activity_dropdown_onchange);


/* Past Activity 'Submit' Button - Submit Form */
let submit_past_activity_button = document.getElementById("submitPastActivityButton")
submit_past_activity_button.addEventListener("click", submit_past_activity_onclick);


/* Future Activity 'Submit' Button - Submit Form */
let submit_future_activity_button = document.getElementById("submitFutureActivityButton")
submit_future_activity_button.addEventListener("click", submit_future_activity_onclick);

// reminder yes handling
let reminder_yes = document.getElementById("yes")
reminder_yes.addEventListener("click", reminderConfirmation);

// reminder no handling
let reminder_no = document.getElementById("no")
reminder_no.addEventListener("click", reminderRefusal);

/* to visualize reminder bar*/
window.addEventListener('load', (event) => {
    reminderHandling();
});

/* to store the value from reminder */
var reminderAct;
var reminderDate = newUTCDate();

//abdullah just added not sure if working 
async function getNameString() {
  let response = await fetch('/name');
  if (response.ok){
    return response.text(); //name as string 
  } else {
    console.log(error);
  }
}
function initializeName() {
  let nameField = document.getElementById("username");
  getNameString().then((nameVal) => {
    nameField.textContent = nameVal;
  }).catch(
    function(error) {
      console.log("error in displaying name");
    }
  );
}

/**
 * ONCLICK - Hide 'Add New Activity' Button under the Past Section and Show
 * Form to Add a Past Activity
 */
function add_past_activity_onclick() {
  /* Connect to Past Activity Sections */
  let pActAdd = document.getElementById("pAct-Add");
  let pActForm = document.getElementById("pAct-Form");

  /* Show Form, Hide 'Add New Activity' Button */
  pActAdd.classList.add("hide");
  pActForm.classList.remove("hide");
}

// handle user filling activity from reminder
function reminderConfirmation(){
  var unit;
  if ((reminderAct === "Walk")||(reminderAct ==="Run")||reminderAct === "Bike"){
    unit = "km";
  } else if(reminderAct === "Basketball"||reminderAct ==="Soccer"||(reminderAct === "Yoga")){
    unit = "Minutes";
  } else if(reminderAct === "Swim"){
    unit = "Laps";
  }
  document.getElementById('pAct-date').valueAsDate = reminderDate;
  document.getElementById('pAct-activity').value = reminderAct;
  document.getElementById('pAct-unit').value = unit;
  add_past_activity_onclick();
  // need to hide the reminder bar here
  document.getElementById("remindercontainer").style.display = "none";

}

// handle to get rid of reminder
function reminderRefusal(){
  document.getElementById("remindercontainer").style.display = "none";
}

// handlers for progress handling
let view_progress_button = document.getElementById("viewProgressButton");
view_progress_button.addEventListener("click", viewProgress);

let go_barchart_button = document.getElementById("brGo");
go_barchart_button.addEventListener("click", barchartConstruct);


// helper function for chart label
function create_label_str(activity ) {
  var label="";
  if(activity === 'Walk'){
    label = "Kilometers Walked";
  }else if (activity === 'Swim'){
    label = "Laps Swam";
  }else if(activity === 'Run'){
    label = "Kilometers Run";
  }else if(activity === 'Yoga'){
    label = "Minutes of Yoga";
  }else if(activity === 'Soccer'){
    label = "Minutes of Soccer";
  }else if(activity === 'Basketball'){
    label = "Minutes of Basketball";
  }else if(activity === 'Bike'){
    label = "Kilometers Biked";
  }
  return(label);
}

// helper function chart to generate datapoints per day out of records for DB
function create_datapoints(date, records) {
  var datapoints = new Array();
  // initialize data for 7 days, last day is date
  for(var i = 0; i < 7; i++) {
    var curr = date - ((6-i) * 86400000); // offset day
    var entry = {
    date: curr,
    value: 0 }
    datapoints[i] = entry;
  }
  if (records != null) {
    var j = 0;
    for(var i = 0; i < records.length; i++){
      // records are ordered, find first day with data
      while (records[i].date != datapoints[j].date) {
        j++; // no entries for this day
        if (j > 6) {
          break; // should not happen
          console.log("record not in range, date:", records[i].date);
        }
      }
      if (j>6) {
        break;
      }
    // sum records for given date
    datapoints[j].value += records[i].amount;
    }
  }
  // workaround for TZ difference
  var today = new Date();
  console.log("points:", datapoints);
  for(var i = 0; i < 7; i++) {
    datapoints[i].date += today.getTimezoneOffset() * 60000; 
  }
  console.log("points:", datapoints);

  return datapoints;
}

// create the chart
function barchartFormation(activity, date){
  var newdate = date.getTime();
  var fetchstr = '/week?date='+newdate+'&activity='+activity;
  const fetchPromise = fetch(fetchstr);
  fetchPromise.then(response => {
    return response.json();
  }).then(records => {
    console.log(records);
    var datapoints = create_datapoints(newdate, records);
    barchart.render(datapoints, create_label_str(activity));
  }).catch((error) => {
    // draw empty chart, if no data
    var datapoints = create_datapoints(newdate, activity);
    barchart.render(datapoints, create_label_str(activity));
    document.getElementById('bc-date').valueAsDate = dateObj;
    document.getElementById('bc-activity').value = null;  
  });
}

function barchartConstruct(){

  var dateField = document.getElementById("bc-date").valueAsDate;
  console.log("date:", dateField);
  var yest = new Date();
  yest.setHours(0,0,0,0);
  yest.setDate(yest.getDate()-1);
  console.log("yest:", yest);

  if ((!dateField) || (dateField.getTime() > yest.getTime())) {
    alert("Please add a proper date in the past");
    document.getElementById("bc-date").valueAsDate = null;
    return;
  }
  var activity = document.getElementById("bc-activity").value;
  var date = new Date(dateField);
  var barchart = barchartFormation(activity,date);
  var bc = document.getElementById("chart-anchor");
  bc.value = barchart;
}

// initial chart population
function intialBarChart(dateObj){
  var mydate = dateObj.getTime();
  var fetchstr = '/week?date='+mydate+'&activity=';
  var activity = null;
  const fetchPromise = fetch(fetchstr);
  fetchPromise.then(response => {
    return response.json();
  }).then(records => {
    var datapoints = create_datapoints(mydate, records);
    if (records.length != 0) {
      activity = records[0].activity;
    }
    barchart.render(datapoints, create_label_str(activity));
    document.getElementById('bc-date').valueAsDate = dateObj;
    document.getElementById('bc-activity').value = activity;    
  }).catch((error) => {
    // draw empty chart if no data
    var datapoints = create_datapoints(mydate, null);
    barchart.render(datapoints, create_label_str(null));
    document.getElementById('bc-date').valueAsDate = dateObj;
    document.getElementById('bc-activity').value = null;  
  });
}

function darken() {
  document.getElementById("page-mask").classList.add("darkenmask");
}

function brighten() {
  document.getElementById("page-mask").classList.remove("darkenmask");
}

// progress handlers
function viewProgress(){
  darken();
  var modal = document.getElementById("barchartModal");
  modal.style.display = "block";
  var yest = new Date();
  yest.setHours(0,0,0,0);
  yest.setDate(yest.getDate()-1); 
  // TZ workaround
  var yestUTC =  new Date(yest.getTime() - yest.getTimezoneOffset() * 60000); 
  var barchart = intialBarChart(yestUTC);
  var bc = document.getElementById("chart-anchor");
  bc.value = barchart; 

}

let modal_close = document.getElementById("close");
modal_close.addEventListener("click", closeModal);

function closeModal(){
  var modal = document.getElementById("barchartModal");
  modal.style.display = "none";
  brighten();

}

/**
 * ONCLICK - Hide 'Add New Activity' Button under the Future Section and Show
 * Form to Add a Future Activity
 */
function add_future_activity_onclick() {
  /* Connect to Past Activity Sections */
  let fActAdd = document.getElementById("fAct-Add");
  let fActForm = document.getElementById("fAct-Form");

  /* Show Form, Hide 'Add New Activity' Button */
  fActAdd.classList.add("hide");
  fActForm.classList.remove("hide");
}


/**
 * ONCHANGE - Automatically Change Units in Past Activty Form to accomodate the
 * selected Activity from the dropdown menu
 */
function past_activity_dropdown_onchange() {
  /* Connect to Past Activity Unit Input */
  let pActUnit = document.getElementById("pAct-unit");

  /* Show Form, Hide 'Add New Activity' Button */
  switch (past_activity_dropdown.value) {
    case 'Walk': case 'Run': case 'Bike':
      pActUnit.value = 'km';
      break;
    case 'Swim':
      pActUnit.value = 'laps';
      break;
    case 'Yoga': case 'Soccer': case 'Basketball':
      pActUnit.value = 'minutes';
      break;
    default:
      pActUnit.value = 'units';
  }
}


/**
 * ONCLICK - Validate Past Activity Form Contents, Send Data to Server, Remove
 * Form, and Display 'Add ...' Button with confirmation text above
 */
function submit_past_activity_onclick() {
  /* Connect to Past Activity Sections */
  let pActAdd = document.getElementById("pAct-Add");
  let pActForm = document.getElementById("pAct-Form");
  
  /* Activity Data to Send to Server */
  let data = {
    date: document.getElementById('pAct-date').value,
    activity: document.getElementById('pAct-activity').value,
    scalar: document.getElementById('pAct-scalar').value,
    units: document.getElementById('pAct-unit').value
  }

  if (!past_activity_form_is_valid(data)) {  
    alert("Invalid Past Activity. Please fill in the entire form.");
    return
  }

  /* Hide Form, Show 'Add New Activity' Button */
  pActAdd.classList.remove("hide");
  pActForm.classList.add("hide");
  
  /* Add 'p' tag above 'Add New Activity' Button */
  let newActivity = create_submission_success_element(   
    "Got it! ",
    `${data.activity} for ${data.scalar} ${data.units}. `,
    "Keep it up!"
  )
  insert_latest_response(pActAdd, newActivity)

  console.log('Past Activity Sending:', data);

  sendDataToServer('/store', data)
  .then((response) => {
    console.log(response);
    console.log('Past Activity Success:', data);
  })
  .catch((error) => {
    console.error('Past Activity Error:', error);
  });
 
  /* Reset Form */
  document.getElementById('pAct-date').valueAsDate = newUTCDate()
  document.getElementById('pAct-activity').value = "Walk"
  document.getElementById('pAct-scalar').value = ""
  document.getElementById('pAct-unit').value = "km"
}

//async send data func 
async function sendDataToServer(url, data) {
  let dataSend = JSON.stringify(data);

  let params = {
    body: dataSend,
    method: 'POST',
    headers: {'Content-Type': 'application/json'}
  }
  console.log("Calling fetch");

  let response = await fetch(url, params);

  if (response.ok) {
    console.log("Message sent successfully");
    return response.text(); 
  } else {
    console.log("Server refused message");
  }
}

/**
 * ONCLICK - Validate Future Activity Form Contents, Send Data to Server, Remove
 * Form, and Display 'Add ...' Button with confirmation text above
 */
function submit_future_activity_onclick() {
  /* Connect to Future Activity Sections */
  let fActAdd = document.getElementById("fAct-Add");
  let fActForm = document.getElementById("fAct-Form");
  
  /* Activity Data to Send to Server */
  let data = {
    date: document.getElementById('fAct-date').value,
    activity: document.getElementById('fAct-activity').value,
    scalar: -1
  }
  
  /* Form Validation */
  if (!future_activity_form_is_valid(data)) {  
    alert("Invalid Future Plan. Please fill in the entire form.");
    return
	} 

  /* Hide Form, Show 'Add New Activity' Button */
  fActAdd.classList.remove("hide");
  fActForm.classList.add("hide");

  /* Add 'p' tag above 'Add New Activity' Button  */
  let newActivity = create_submission_success_element(
    "Sounds good! Don't forget to come back to update your session for ",
    `${data.activity} on ${reformat_date(data.date)}`,
    "!"
  )
  insert_latest_response(fActAdd, newActivity)

  console.log('Future Plans Sending:', data);

  sendDataToServer('/store', data)
  .then((response) => {
    //response.json();
    console.log(response);
    console.log('Future Plans Success: ', data);
  })
  .catch((error) => {
    console.log('Future Plans Error: ', error);
  } )

  /* Reset Form */
  document.getElementById('fAct-date').valueAsDate = newUTCDate()
  document.getElementById('fAct-activity').value = "Walk"
}


/**
 * Create DOM element for acknowledgment message to send to user for submitting a form
 * @param {string} beg - regular starting section
 * @param {string} mid - bolded middle section
 * @param {string} end - regular trailing text
 * @returns {HTMLElement} DOM element combining beg, mid, end
 */
function create_submission_success_element(beg, mid, end) {
  /* Create all HTML elements to add */
  let newMessage = document.createElement('p')
  let baseText = document.createElement('span')
  let dynamicText = document.createElement('strong')
  let exclamationText = document.createElement('span')
  
  /* Update textContent of all generated DOM elements */
  baseText.textContent = beg
  dynamicText.textContent = mid
  exclamationText.textContent = end
  
  /* Append all text contents back to back in wrapper 'p' tag */
  newMessage.appendChild(baseText)
  newMessage.appendChild(dynamicText)
  newMessage.appendChild(exclamationText)

  return newMessage  
}


/**
 * Checks if past activity data is valid
 * @param {Object} data
 * @param {string} data.date - format 'mm-dd-yyyy'
 * @param {string} data.activity
 * @param {string} data.scalar - time or distance integer or float
 * @param {string} data.units - units for scalar value
 * @returns {boolean} Boolean represents if data is valid
 */
function past_activity_form_is_valid(data) {
  let date = new Date(data.date.replace('-','/'))
  if ( date != "Invalid Date" && date > newUTCDate()) {
    return false
  }

  return !(data.date == "" || data.activity == "" || data.scalar == "" || data.units == "" )
}


/**
 * Checks if future activity data is valid
 * @param {Object} data
 * @param {string} data.date
 * @param {string} data.activity
 * @returns {boolean} Boolean represents if data is valid
 */
function future_activity_form_is_valid(data) {
  
  
  let date = new Date(data.date.replace('-','/'))
  if ( date != "Invalid Date" && date < newUTCDate()) {
    return false
  }
  
  return !(data.date == "" || data.activity == "")
}


/**
 * Insert Prompt at the top of parent and remove old prompts
 * @param {HTMLElement} parent - DOM element 
 * @param {HTMLElement} child - DOM element
 */
function insert_latest_response(parent, child) {
  if(parent.children.length > 1) {
    parent.removeChild(parent.children[0])
  }
  parent.insertBefore(child, parent.childNodes[0])
}


/**
 * Convert 'yyyy-mm-dd' to 'mm/dd/yy'
 * @param {string} date 
 * @returns {string} same date, but reformated
 */
function reformat_date(date) {
  let [yyyy, mm, dd] = date.split("-");
  return `${mm}/${dd}/${yyyy.substring(2,4)}`
}


/**
 * Convert GMT date to UTC
 * @returns {Date} current date, but converts GMT date to UTC date
 */
function newUTCDate() {
  let gmtDate = new Date()
  return new Date(gmtDate.toLocaleDateString())
}

/* reminder handling */
function reminderHandling() {
  // get the information from server
  fetch(`/reminder`)
  .then(response => {
    return response.json();
  }) 
  .then(data => {
    if (data != {}) {
      var retStr = '';
      var dayStr = '';
      const today = newUTCDate();
      console.log("today:", today.getTime());
      var deltaDays = Math.round((today.getTime() - data.date) / 86400000);
      // only return in case of last week
      if (deltaDays === 1) {
         dayStr = "yesterday"
      } else if ((deltaDays < 8) && (deltaDays > 0)){
         var remUTCDate = new Date(data.date); 
         var remDate = new Date(remUTCDate.getTime() + remUTCDate.getTimezoneOffset() * 60000); // TZ workaround
         var options = { weekday: 'long'};
         dayStr = "on " + new Intl.DateTimeFormat('en-US', options).format(remDate);
      }
      if (dayStr != '') {
        if ((data.activity === "Walk")||(data.activity ==="Run")||(data.activity === "Swim")||(data.activity ==="Bike")){
          retStr = "Did you " + data.activity + " " + dayStr + "?";
        } else if(data.activity === "Basketball"||data.activity ==="Soccer"){
          retStr = "Did you play " + data.activity + " " + dayStr + "?";
        } else if(data.activity === "Yoga"){
          retStr = "Did you do " + data.activity + " " + dayStr + "?";
        }
        reminderAct = data.activity;
        reminderDate = new Date(data.date);
        document.getElementById("question").textContent = retStr;
        document.getElementById("remindercontainer").style.display = "flex";
      }
    }
  })
  .catch((error) => {
    console.error('reminder:', error);
  });
}
