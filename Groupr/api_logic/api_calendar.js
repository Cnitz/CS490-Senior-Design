// Libraries

// Models
var User = require('../models/user');
var Calendar = require('../models/calendar');
var Group = require('../models/group');

var calendar = new Object();

var search_event = function(eventList, key) {
    var idx = 0;
    eventList.forEach(function(event, index) {
        if (event.name == key.name) {
            idx = index;
        }
    })
    return idx;
}

calendar.event_action = function(calendarList, eventList, action_type, callback) {
    var reponseObj = {};
    var counter = 0;
    var index = 0;
    calendarList.forEach(function(calendar) {
        index = 0;
        switch (action_type) {
            case 'add':
                eventList.forEach(function(event) {
                    console.log(event);
                    calendar.events.push(event);
                });
            break;
            case 'delete':
                eventList.forEach(function(event) {
                    if (index != -1) {
                        index = search_event(calendar.events, event);
                        calendar.events.splice(index, 1);
                    }
                    else {
                        reponseObj.status == 500;
                        reponseObj.message = 'Error: Event not found';
                    }
                });
            break;
            case 'edit':
                eventList.forEach(function(event) {
                    index = search_event(calendar.events, event);
                    console.log("42 " + index);
                    if (index != -1) {
                        calendar.events[index] = event;
                        console.log('46 ' + calendar.events[index]);
                    }
                    else {
                        reponseObj.status == 500;
                        reponseObj.message = 'Error: Event not found';
                    }
                });
        }
    })
    calendarList.forEach(function(calendar) {
        calendar.save((err) => {
            counter++;
            if (err) {
                reponseObj.status = 500;
                reponseObj.message = 'Error: Database access';
            }
            else if (counter === calendarList.length) {
                console.log(counter);
                callback(reponseObj);
            }
            else {}
        })
    })
}

calendar.schedule_assistant = function(calendarList, startTimeUTC, endTimeUTC, meetingLength, callback) {
    var reponseObj = {};

    var startTime = new Date(startTimeUTC);
    var endTime = new Date(endTimeUTC);

    console.log(startTime);
    console.log(endTime);

    var interval = (endTime - startTime) / 60000;

    /* Date aggregation */
    aggregateCalendar = [];
    for (var i = 0; i < calendarList.length; i++) {
        for (var j = 0; j < calendarList[i].length; j++) {
            //console.log(calendarList[i][j]);
            if (calendarList[i][j].endTime <= startTime) {
            }
            else if (calendarList[i][j].startTime >= endTime) {
            }
            else {
                console.log("In Else");
                var event = calendarList[i][j];
                var newEvent = {
                  startTime: 0,
                  endTime: 0
                };
                if (event.startTime < startTime) {
                    event.startTime = startTime;
                }
                if (event.endTime > endTime) {
                    event.endTime = endTime;
                }

                newEvent.startTime = (event.startTime - startTime) / 60000;
                newEvent.endTime = (event.endTime - startTime) / 60000;
                aggregateCalendar.push(newEvent);
            }
        }
    }
    console.log(aggregateCalendar);

    /* calculate conflict frequency */
    var conflictFrequency = [];
    console.log('interval is '+ interval);
    console.log('meeting length is ' + meetingLength);
    for (var i = 0; i < interval; i++) {
        conflictFrequency[i] = 0;
    }

    for (var i = 0; i < aggregateCalendar.length; i++) {
        var event = aggregateCalendar[i];
        for (var j = event.startTime; j < event.endTime; j++) {
            conflictFrequency[j] += 1;
        }
    }
    console.log(conflictFrequency);

    /* find best fit meeting time */
    var bestFit = {
        startIndex: 0,
        endIndex: 0,
        score: 0,
    }
    var curCount = 0;
    for (var i = 0; i < interval; i++) {
        if (i < meetingLength) {
            curCount += conflictFrequency[i];

            if (i == meetingLength - 1) {
                // initialize best fit
                bestFit.startIndex = 0;
                bestFit.endIndex = i;
                bestFit.score = curCount;
            }
        }
        else {
                // check against new value
            curCount -= conflictFrequency[i - meetingLength];
            curCount += conflictFrequency[i];

            if (curCount < bestFit.score) {
                bestFit.startIndex = i - meetingLength + 1;
                bestFit.endIndex = i + 1;
                bestFit.score = curCount;
            }
        }
    }
    console.log(bestFit);

    /* create date for best fit event */
    var finalStartTime = new Date(startTime);
    console.log("finalStartTime: "+finalStartTime);
    var finalEndTime = new Date(startTime);
    console.log("finalEndTime: "+finalEndTime);
    var startHours = startTime.getHours();
    console.log("startHours: "+startHours);
    var startMinutes = startTime.getMinutes();
    console.log("startMinutes: "+startMinutes);
    var totalStartTime = ((bestFit.startIndex + startMinutes) / 60) + startHours;
    console.log("totalStartTime: "+totalStartTime);
    var totalEndTime = ((bestFit.endIndex + startMinutes) / 60) + startHours;
    console.log("totalEndTime: "+totalEndTime);
    var startHours = Math.floor(totalStartTime);
    console.log("startHours: "+startHours);
    var startMinutes = Math.round((totalStartTime - startHours) * 60);
    console.log("startMinutes: "+startMinutes);
    var endHours = Math.floor(totalEndTime);
    console.log("endHours: "+endHours);
    var endMinutes = Math.round((totalEndTime - endHours) * 60);
    console.log("endMinutes: "+endMinutes);

    finalStartTime.setHours(startHours);
    finalStartTime.setMinutes(startMinutes);
    finalEndTime.setHours(endHours);
    finalEndTime.setMinutes(endMinutes);

    console.log(finalStartTime);
    console.log(finalEndTime);


    reponseObj.status = 200;
    reponseObj.event = { startTime: finalStartTime, endTime: finalEndTime };
    callback(reponseObj);
}

module.exports = calendar;
