import data from './data.js'
import barchart from './barchart.js'

barchart.init('chart-anchor', 500, 300);

// label for the chart based on activty
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

// datapoints for the chart out of records from DB
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
  var j = 0;
  for(var i = 0; i < records.length; i++){
    // records are ordered, find first day with data
    while (records[i].date != datapoints[j].date) {
      j++; // no entries for this day
    }
    // sum records for given date
    datapoints[j].value += records[i].amount;
  }
  return datapoints;
}

// Hugo passing label in render, instead of hardcoded
// instead of hardcoded data in example, get the data from server
// chart modal screen: input date and activity and use code below 
const fetchPromise = fetch('/week?date=1618963200000&activity=Bike');
fetchPromise.then(response => {
  return response.json();
}).then(records => {
  console.log(records);
  var datapoints = create_datapoints(1618963200000, records);
  barchart.render(datapoints, create_label_str('Bike'));
});

