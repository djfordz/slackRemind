'use strict'
var input, tasks = [], flag;

var task = {'save': function(id, reminder, time, date, bool, completed, unix, timezone) {
        this.id = id;
        this.title = reminder;
        this.time = time;
        this.date = date;
        this.am = bool;
        this.completed = completed;
        this.unix = unix;
        this.timezone = timezone;
    }
}

function callback(result) {
    return result;
}

var flag = {
    'set': function(num) {
        chrome.storage.local.set({'flag': num}, function() {});
    },
    'get': function(result) {chrome.storage.local.get('flag', function(result){
            
        });
    }
}

function validate(string) {
    if(string.length == 0) {
        flag.set(0);
        return false;
    }
    if(string.match('@') == null) {
        flag.set(1);
        return false;
    }

    string = string.split('@');

    if(string[1].match(' ') == null) {
        flag.set(2);
        return false;
    }
    var timedate = string[1].split(' ');
    
    var time = timedate[0];
    var date = timedate[1];
    if(time.match(':') !== null) {
        time = time.replace(':', '');
    }
    if(time.match(/am|pm/g) !== null) {
        time = time.replace(/am|pm/g, '');
    }
    time = Number(time);
    if(!Number.isInteger(time)) {
        flag.set(3);
        return false;
    }
    if(date.match('/') !== null) {
        date = date.replace(/\//g, '');
    }
    if(date.match('-') !== null) {
        date = date.replace(/\-/, '');
    }
    date = Number(date);
    if(!Number.isInteger(date)) {
        flag.set(4);
        return false;
    }
    flag.set(0);
    return true;
}

function isCompleted() {
    flag = false;
    chrome.storage.local.get('key', function(items) {
        if(typeof(items['key']) != 'undefined' && items['key'] instanceof Array) {
            for(var i = 0; i < items.key.length; i++) {
                if(items.key[i] !== null) {
                    if(items.key[i].completed == 1) {
                        flag = true;
                    }                 
                }
            }
        } else if(typeof(items['key']) != 'undefined'){
            if(items.key.completed == 1) {
                flag = true;
            } 
        }
     
    });
    return flag;
}

$('#task').submit(function() {
    var title, reminder, time, bool = 0, date, completed, string = [], timedate = [];
    title = $('#title').val();
    if(!validate(title)) {
        return;
    }
    
    string = title.split('@');
    reminder = string[0];
    timedate = string[1].split(' ');
    if(timedate[0].match(/\:/g) != null) {
        timedate[0] = timedate[0].replace(':', '');
    }
    
    var ampm = timedate[0].match(/am|pm/i);
    time = timedate[0].replace(/am|pm/i, '');
    if(ampm instanceof Array) {
        ampm = ampm[0].toLowerCase();
    }

    if(ampm === 'pm') {
        bool = 1;
    }
    
    if(timedate[1].match(/\/|-/g) !== null) {
         date = timedate[1].replace(/\/|-/g, '');   
    } else {
        date = timedate[1];
    }
    
    var dt = localTime(date, time, bool);
    completed = isCompleted();
    createTask(reminder, dt[0], dt[1], bool, completed, epochTime(dt[0], dt[1], tz()), tz());
});

function showValidation(flag) {
    switch(flag) {
        case 1: $('<p>Ensure \'@\' is in your syntax.</p>').appendTo('#todos');
        break;
        case 2: $('<p>Ensure a \'space\' is inserted between time and date</p>').appendTo('#todos');
        break;
        case 3: $('<p>Ensure only numbers are used for time with or without \':\'</p>').appendTo('#todos');
        break;
        case 4: $('<p>Ensure only numbers are used for date with or without \'/\' or \'-\'</p>').appendTo('#todos');
        break;
    }
}

function listTasks() {
    chrome.storage.local.get('flag', function(item) {
       showValidation(item.flag); 
    });
    var ampm, cnt = 0;
    chrome.storage.local.get('key', function(items, index) {
        if(items['key'] != 'undefined' && items['key'] instanceof Array) {
            for(var i = 0; i < items.key.length; i++) {
                if(items.key[i] !== null) {
                    if(items.key[i].am == '1') {
                        ampm = 'pm';
                    } else {
                        ampm = 'am';
                    }
                    if(items.key[i].completed == 1) {
                        $("<strike>" + "<li id=" + items.key[i].id + ">" + items.key[i].title + ' @' + items.key[i].time.hour + ':' + items.key[i].time.minute + ampm +' ' + items.key[i].date.month + '/' + items.key[i].date.day + '/' + items.key[i].date.year + "</li>" + "</strike>").appendTo('.list');
                    } else {
                        $("<li id=" + items.key[i].id + ">" + items.key[i].title + ' @' + items.key[i].time.hour + ':' + items.key[i].time.minute + ampm + ' ' + items.key[i].date.month + '/' + items.key[i].date.day + '/' + items.key[i].date.year + "</li>").appendTo('.list');
                    }
                } else {
                    cnt++;
                }
            }
            if(items.key.length === cnt) {
                clearAll();
                listTasks();
            }
        } else if(typeof(items['key']) != 'undefined'){
            if(items.key !== null) {
                if(items.key.completed == 1) {
                   $("<strike>" + '<li id=' + items.key.id + '>' + items.key.title + ' @' + items.key.time.hour + ':' + items.key.time.minute + ampm + ' ' + items.key.date.month + '/' + items.key.date.day + '/' + items.key.date.year + '</li>' + "</strike>").appendTo('.list'); 
                } else {
                   $('<li id=' + items.key.id + '>' + items.key.title + ' @' + items.key.time.hour + ':' + items.key.time.minute + ampm + ' ' + items.key.date.month + '/' + items.key.date.day + '/' + items.key.date.year + '</li>').appendTo('.list');
                }
            } else {
                cnt++;
            }
            if(items.key.length === cnt) {
                clearAll();
            }
        } else {
            $('<li>' + 'No Reminders' + '</li>').appendTo('.list');
        }
    });
}

function createTask(reminder, time, date, bool, completed, unix, timezone) {
    if(!reminder) {
       return;
    }
    var id = getId();
    task.save(id, reminder, time, date, bool, completed, unix, timezone);
    createAlarm(task);
    chrome.storage.local.get('key', function(items) {
        if(typeof(items['key']) != 'undefined' && items['key'] instanceof Array) {
            items["key"].push(task);
        } else {
            items["key"] = [task];
        }
        chrome.storage.local.set(items, function() {});
     
	});
}

function sendToSlack(task) {
    var payload = JSON.stringify({"channel": "#random", "username": "Slack Remind", "text": "REMINDER: " + task.title + " to do. Wake up dude!"});
    chrome.storage.sync.get('endpoint', function(items) {
        $.ajax({
            type: "POST",
            url: items.endpoint,
            data: payload,
            dataType: "json"
        });     
    });
    
}

function *shuffle(array) {
    var i = array.length;
    while (i--) {
        yield array.splice(Math.floor(Math.random() * (i+1)), 1)[0];
    }
}

function getId() {
    var ranNums = [];
    for(var i = 0; i < 10000; i++) {
        ranNums.push(i);
    }
    var id = shuffle(ranNums);    
        return id.next().value;
}

function clearItem(id) {
    $('#' + id).remove();
}

function deleteTask(id) {
    chrome.storage.local.get('key', function(items) {
            if(typeof(items['key']) != 'undefined' && items['key'] instanceof Array) {
                for(var i = 0; i < items.key.length; i++) {
                    if(items.key[i] !== null) {
                        if(items.key[i].id == id) {
                            chrome.storage.local.remove('key', function() {});
                        }
                    }
                }
                clearItem(id);
            } else if(typeof(items['key']) != 'undefined') {
                chrome.storage.local.remove(items, function() {});
                clearItem(id); 
            }      
        
    });
}

function getEndpoint() {
    chrome.storage.sync.get('endpoint', function(items) {

    });
}

function getTimezone() {
    var offset;
    chrome.storage.local.get('timezone', function(items) {
        switch(items) {
            case 'UTC': offset = 0;
            break;
            case 'PST': offest = 7;
            break;
            case 'MST': offset = 6;
            break;
            case 'CST': offset = 5;
            break;
            case 'EST': offset = 4;
            break;
        } 
    });

    return offset;
}

function localTime(date, time, ampm) {
    var dateParts = date.match(/(\d{2})(\d{2})(\d{4})/);
    var timeParts;
    if(time.length == 3) {
        timeParts = time.match(/(\d{1})(\d{2})/);
    } else {
        timeParts = time.match(/(\d{2})(\d{2})/);
    }
    
    ampm = Number(ampm);
    if(ampm == 1) {
        time.hour = Number(time.hour);
        time.hour += 12;
        time.hour = time.hour.toString();
    }
    time = {hour: timeParts[1], minute: timeParts[2]};
    date = {year: dateParts[3], month: dateParts[1], day: dateParts[2]};
    return [time, date];
}

function createAlarm(task) { 
    chrome.alarms.create(task.id.toString(), {'when': epochTime(task.date, task.time, task.timezone)});
    
}

function clearAll() {
    chrome.storage.local.remove('key', function() {});
    chrome.alarms.clearAll(function() {});
    $('li').remove(); 
}

function clearCompleted(storedData) {
        storedData['key'].forEach(function(todo, index) {
            if(todo !== null) {
               if(todo.completed) {
                   storedData['key'][index] = null;
                     chrome.storage.local.set(storedData);
                } 
            }
        });
    }
    
function clearList() {
    $('li').remove();
}

var bind = function(el) {
    var elem = document.querySelector(el);
    $(elem).css('cursor', 'pointer');
   elem.addEventListener('click', function(ev) {
        var id = ev.target.id;
       if(ev.target.tagName === 'LI') {
           ev.target.classList.toggle('completed');
           
           chrome.storage.local.get('key', function(items) {
                    if(typeof(items['key']) != 'undefined'  && items['key'] instanceof Array) {
                       for(var i = 0; i < items.key.length; i++) {
                           if(items.key[i] !== null) {
                               if(items.key[i].id == id) {
                                   items.key[i].completed = 1;
                                   chrome.storage.local.set(items, function() {});
                               }
                           }
                       }
                       chrome.alarms.clear(id.toString(), function() {})
                       clearList();
                       listTasks();
                   } else if(typeof(items['key']) != 'undefined') {
                       if(items.key.id === id) {
                           items.key.completed = 1;     
                           chrome.storage.local.set(items, function() {});
                       }
                       chrome.alarms.clearAll(function() {});
                       clearList();
                       listTasks();
                   }

           });
       }
       
       if(ev.target.tagName === 'BUTTON') {
           if(id === 'clear') {
               clearAll();
               listTasks();
           }     
           if(id === 'completed') {
              chrome.storage.local.get('key', clearCompleted); 
               listTasks();
           }
       }
   });
   
}
function getMonth(month) {
    var monthString = '';
    month = Number(month);
    switch(month) {
        case 1: monthString = 'Jan';
        break;
        case 2: monthString = 'Feb';
        break;
        case 3: monthString = 'Mar';
        break;
        case 4: monthString = 'Apr';
        break;
        case 5: monthString = 'May';
        break;
        case 6: monthString = 'Jun';
        break;
        case 7: monthString = 'Jul';
        break;
        case 8: monthString = 'Aug';
        break;
        case 9: monthString = 'Sep';
        break;
        case 10: monthString = 'Oct';
        break;
        case 11: monthString = 'Nov';
        break;
        case 12: monthString = 'Dec';
        break;
    }
    return monthString;
}

function epochTime(date, time, timezone) {
    var dt = '';
    dt += date.day + ' ';
    dt += getMonth(date.month) + ' ';
    dt += date.year + ' ';
    dt += time.hour + ':';
    dt += time.minute + ' ';
    dt += timezone;

    return Date.parse(dt);
}
function epochTimeUTC(date, time) {
    time.hour = Number(time.hour);
    time.hour += 6;
    if(time.hour > 23) {
        time.hour -= 24;
    }
    date.month = Number(date.month) - 1;
    date.month = date.month.toString();
    time.hour = time.hour.toString();
    return Date.UTC(+date.year, +date.month, +date.day, +time.hour, +time.minute);
}

function timezone(storedData) {
    var timezone;
    if(typeof(storedData.timezone) != 'undefined') {
        switch(storedData.timezone) {
            case 'PST': timezone = 'PST';
            break;
            case 'MST': timezone = 'MST';
            break;
            case 'CST': timezone = 'CST';
            break;
            case 'EST': timezone = 'EST';
            break;
            default: timezone = 'UTC';
        } 
        DaylightSavings();
        return timezone;
    }
}

function tz() {
    var d = new Date();
    var tz = d.toString().split(' ').pop();
    tz = tz.replace(/\(/g, '');
    tz = tz.replace(/\)/g, '');
    return tz;
}
function showNotification(storedData) {
    function audioNotification(){
        var sound = new Audio('../snd/drop.mp3');
        sound.play();
    }
    if(typeof storedData['key'] !== 'undefined') {
        storedData['key'].forEach(function(todo) {
            if(todo !== null) {
                if (!todo.completed) {
                    chrome.notifications.create('reminder', {
                    type: 'basic',
                    iconUrl: '../img/reminder-icon-1.jpg',
                    title: 'Don\'t forget!',
                    message: 'You have ' + todo.title + ' to do. Wake up, dude!'
                 }, function(notificationId) {});
                }
            }
        });
    }
	audioNotification();
    var dt = new Date();
    dt = dt.getTime().toString().substr(0, 10);
    dt = Number(dt);
    
    if(typeof storedData['key'] !== 'undefined') {
        storedData['key'].forEach(function(todo) {
            if(todo !== null) {
                if(!todo.completed) {
                    var dt2 = epochTime(todo.date, todo.time, todo.timezone);
                    dt2 = dt2.toString();
                    dt2 = dt2.substr(0, 10);
                    dt2 = Number(dt2);
                   if(dt == dt2) {
                       console.log('test');
                        //sendToSlack(todo);
                   }
                }
            }
        });
    }
    
}

function init() {
    listTasks();
    bind('ul'); 
    bind('form');
}

init();
chrome.alarms.onAlarm.addListener(function(alarm) {
    chrome.storage.local.get('key', showNotification)
});


