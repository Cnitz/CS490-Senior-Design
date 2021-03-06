define([
    './Module'
], function (module) {
    return module.controller('Groupr.Controllers.GroupCalendarController', [
        '$scope',
        '$state',
        'Groupr.Services.GroupServices',
        'Groupr.Services.AccountServices',
        '$stateParams',
        'Groupr.Services.CalendarServices',
        '$mdSidenav',
        '$log',
        '$mdDialog',
        function GroupCalendarController($scope, $state, GroupServices, AccountServices, $stateParams, CalendarServices, $mdSidenav, $log, $mdDialog) {
            var vm = this;
            {
                vm.groups = [];
                vm.tasks = [];
            }
            vm.goHome = goHome;

            vm.groupCalendar = groupCalendar;
            vm.groupChat = groupChat;
            vm.groupTasks = groupTasks;
            vm.groupComplaints = groupComplaints;
            vm.logout = logout;

            vm.logout = logout;
            vm.addEvent = addEvent;
            vm.deleteEvent = deleteEvent;
            vm.editEvent = editEvent;
            vm.refresh = refresh;
            vm.printDate = printDate;
            vm.scheuduleAssistant = scheuduleAssistant;
            vm.printTimes = printTimes;
            vm.navigateToScheduleAssistant = navigateToScheduleAssistant;
            vm.vote = vote;
            vm.voters = [];
            vm.submitVote = submitVote;
            vm.deleteProposedEvent = deleteProposedEvent;
            vm.cancelVoting = cancelVoting;
            vm.endVoting = endVoting;
            vm.proposeEvent = proposeEvent;
            vm.submitToGroup = submitToGroup;
            vm.openAddEventDialog = openAddEventDialog;
            vm.openEditEventDialog = openEditEventDialog;
            vm.openDoodleDialog = openDoodleDialog;

            $scope.currentNavItem = "groups";
            $scope.customFullscreen = false;
            $scope.durationHours = 0;
            $scope.durationMinutes = 0;
            $scope.eventName = "";
            $scope.eventDescription = "";
            $scope.eventLocation = "";
            $scope.users = [];
            $scope.myDate = new Date();
            $scope.doodleInProgress = false;
            $scope.votingActive = false;
            $scope.hasVoted = false;
            vm.currGroup = "";
            vm.events = [];
            $scope.pendingEvents = [];
            $scope.votingEvents = [];
            $scope.checkBoxData = [];
            $scope.toggleLeft = buildDelayedToggler('left');
            $scope.user = {};

            vm.leaveGroup = leaveGroup;
            vm.groupID = $stateParams.groupID;




            $scope.addTask = function (data) {
                if ($scope.title == "" || $scope.description == "")
                    return;
                var task = { group: vm.currGroup._id, title: $scope.title, description: $scope.description };
                GroupServices.addTask(task)
                    .then(function (res) {
                        console.log(res.data);
                        vm.tasks.push(task);

                        var g = { group: vm.currGroup._id };
                        GroupServices.getTasks(g)
                            .then(function (res) {
                                vm.tasks = res.data;
                            }, function (res) {
                                console.log("failure");
                                console.log(res.data.message);
                            });
                    })
            };
            $scope.removeTask = function (data) {
                for (var i = 0; i < vm.tasks.length; i++) {
                    if (vm.tasks[i].title == data) {
                        var task = { taskId: vm.tasks[i]._id };
                        console.log(task);
                        GroupServices.removeTask(task)
                            .then(function (res) {
                                console.log("Success!");
                                console.log(res.data);
                                vm.tasks.splice(i, 1);
                            }, function (res) {
                                console.log("Failure.");
                                console.log(res.data);
                            });

                        break;
                    }
                }
            };
            $scope.statusChanged = function (task) {
                console.log(task);

                GroupServices.updateStatus(task._id)
                    .then(function (res) {
                        console.log("update status success!");
                        console.log(res);
                    }, function (res) {
                        console.log("update status failure!");
                        console.log(res);
                    });


            };


            function scheuduleAssistant(){


              var newStartDate = new Date($scope.myDate);
              var newEndDate = new Date($scope.myDate);

              var time = $scope.startTime.match(/(\d+)(?::(\d\d))?\s*(p?)/);
              newStartDate.setHours(parseInt(time[1]) + (time[3] ? 12 : 0));
              newStartDate.setMinutes(parseInt(time[2]) || 0);

              var time2 = $scope.endTime.match(/(\d+)(?::(\d\d))?\s*(p?)/);
              newEndDate.setHours(parseInt(time2[1]) + (time2[3] ? 12 : 0));
              newEndDate.setMinutes(parseInt(time2[2]) || 0);

              var duration = ($scope.durationHours * 60) + $scope.durationMinutes;

              console.log(newStartDate);
              console.log(newEndDate);

              newStartDate.setSeconds(0);
              newStartDate.setMilliseconds(0);
              newEndDate.setSeconds(0);
              newEndDate.setMilliseconds(0);

              CalendarServices.scheduleAssistant(newStartDate, newEndDate, duration, vm.groupID).then(
                function(res){
                  console.log(res.data);
                  $scope.pendingEvents.push(res.data);
                },
                function(res){
                  console.log("Failure");
                  console.log(res.event);
                });
            }

            function leaveGroup() {
                GroupServices.leaveGroup(vm.groupID);
                $state.go('home');
            }

            /*Navigates to Group Calendar sub-page*/
            function groupCalendar() {
                console.log("groupID: " + vm.groupID);
                $state.go('groupCalendar', { groupID: vm.groupID });
            }

            function groupChat() {
                $state.go('groupChat', { groupID: vm.groupID });
            }

            function groupTasks() {
                $state.go('groupindiv', { groupID: vm.groupID });
            }

            function groupComplaints(){
                $state.go('groupComplaints', {groupID: vm.groupID});
            }

            /* Takes the current proposedEvents and allows the group to vote on them*/
            function submitToGroup(){
                CalendarServices.proposedMeetingTimes($scope.pendingEvents, $scope.eventName, $scope.eventDescription, $scope.eventLocation, vm.groupID).then(
                    function(res) {
                        refresh();
                    },
                    function(res) {
                        console.log(res.data);
                    });
            }

            function deleteProposedEvent(event){
              $scope.pendingEvents.splice($scope.pendingEvents.indexOf(event),1);
            }

            //Not sure where this goes on the back end, but for testing this should return a boolean
            function votingActive(){
              //For false
              return "style=\"display: none;\"";
            }

            /*Adds the given event to the proposal list */
            function proposeEvent(){
              var pEvent = {
                  startTime: $scope.myDate,
                  endTime: $scope.myDate,
                  votes: 0
              }

              //Now reading in the time strings and setting times. Remove when better time picker is made
              var newStartDate = new Date($scope.myDate);
              var newEndDate = new Date($scope.myDate);

              var time = $scope.startTime.match(/(\d+)(?::(\d\d))?\s*(p?)/);
              newStartDate.setHours(parseInt(time[1]) + (time[3] ? 12 : 0));
              newStartDate.setMinutes(parseInt(time[2]) || 0);

              var time2 = $scope.endTime.match(/(\d+)(?::(\d\d))?\s*(p?)/);
              newEndDate.setHours(parseInt(time2[1]) + (time2[3] ? 12 : 0));
              newEndDate.setMinutes(parseInt(time2[2]) || 0);

              pEvent.startTime = newStartDate;
              pEvent.endTime = newEndDate;
              //End Time Reading Hack
              $scope.pendingEvents.push(pEvent);
            }

            function activate() {
                if ($stateParams.groupID != null) {
                    AccountServices.getUser()
                    .then(
                        function(res) {
                            $scope.user = res.data;
                            console.log($scope.user);
                            CalendarServices.getGroupCalendar($stateParams.groupID)
                            .then(
                                function(result) {
                                    vm.events = result.data.events;
                                    $scope.doodleInProgress = result.data.schedule_assistant.inProgress;
                                    $scope.votingActive = result.data.schedule_assistant.active;

                                    if ($scope.doodleInProgress) {
                                        $scope.eventName = result.data.schedule_assistant.name;
                                        $scope.eventLocation = result.data.schedule_assistant.location;
                                        $scope.eventDescription = result.data.schedule_assistant.description;
                                    }
                                    if (votingActive) {
                                        vm.voters = result.data.schedule_assistant.voters;
                                        $scope.votingEvents = result.data.schedule_assistant.events;
                                        $scope.votingEvents.forEach(function(event){
                                            event.selected = false;
                                        })
                                        vm.voters.forEach(function(voter) {
                                            if (voter === $scope.user.username) {
                                                $scope.hasVoted = true;
                                            }
                                        })
                                    }
                                },
                                function(result) {
                                    console.log(res.data);
                                })
                        },
                        function(res) {
                            console.log(res.data);
                        }
                    )

                    GroupServices.getGroupInfo($stateParams.groupID)
                    .then(
                        function(resOne) {
                            vm.currGroup = resOne.data;
                            var g = { group: vm.currGroup._id };
                            GroupServices.getTasks(g)
                            .then(
                                function (resTwo) {
                                    vm.tasks = resTwo.data;
                                },
                                function (resTwo) {
                                    console.log(resTwo.data);
                                })
                        },
                        function (resOne) {
                            console.log(res.data);
                        }
                    )
                }
            }

            activate();

            for (var i = 0; i < vm.tasks.length; i++) {
                $scope.checkBoxData[i] = vm.tasks[i].status;
            }
            console.log($scope.checkBoxData);

            /**
            * Supplies a function that will continue to operate until the
            * time is up.
            */
            function debounce(func, wait, context) {
                var timer;

                return function debounced() {
                    var context = $scope,
                        args = Array.prototype.slice.call(arguments);
                    $timeout.cancel(timer);
                    timer = $timeout(function () {
                        timer = undefined;
                        func.apply(context, args);
                    }, wait || 10);
                };
            }

            /**
            * Build handler to open/close a SideNav; when animation finishes
            * report completion in console
            */
            function buildDelayedToggler(navID) {
                return debounce(function () {
                    // Component lookup should always be available since we are not using `ng-if`
                    $mdSidenav(navID)
                        .toggle()
                        .then(function () {
                            $log.debug("toggle " + navID + " is done");
                        });
                }, 200);
            }

            function goHome() {
                $state.go('home');
            }

            /* cancel the voting, back end to clear schedule assistant fields */
            function cancelVoting() {
                console.log('cancelVoting');
                CalendarServices.cancelVoting($stateParams.groupID)
                .then(
                    function(res) {
                        $scope.hasVoted = false;
                        $scope.votingActive = false;
                        $scope.pendingEvents = [];
                        refresh();
                    },
                    function(res) {
                        console.log(res.data);
                    }
                )
            }

            /* back end, take current highest, send the index of the event */
            function endVoting() {
                console.log('endVoting');
                CalendarServices.endVoting($stateParams.groupID)
                .then(
                    function(res) {
                        $scope.hasVoted = false;
                        $scope.votingActive = false;
                        refresh();
                    },
                    function(res) {
                        console.log(res.data);
                    }
                )

            }

            function logout() {
                AccountServices.logout();
                $state.go('main');
            }

            /* if there is no current vote, navigate to the schedule assistant page to create a new "doodle" */
            function navigateToScheduleAssistant() {
                $state.go('scheduleAssistant', { groupID: $stateParams.groupID });
            }

            /* Vote for one proposed time, front end only */
            function vote(index) {
                $scope.checkBoxData[index] = true;
            }

            /* submit all votes and store in back end database */
            function submitVote() {
                console.log('submitVote');
                var index = 0;
                $scope.votingEvents.forEach(function(event){
                  $scope.checkBoxData[index++] = event.selected;
                })
                CalendarServices.vote($stateParams.groupID, $scope.checkBoxData, $scope.user.username)
                .then(
                    function(res) {
                        $scope.hasVoted = true;
                        vm.voters.push($scope.user.username);
                    },
                    function(res) {
                        console.log(res.data);
                    }
                )
            }

            function mapMonth(month) {
                switch (month) {
                    case 1:
                        return 'January';
                    break;
                    case 2:
                        return 'February';
                    break;
                    case 3:
                        return 'March';
                    break;
                    case 4:
                        return 'April';
                    break;
                    case 5:
                        return 'May';
                    break;
                    case 6:
                        return 'June';
                    break;
                    case 7:
                        return 'July';
                    break;
                    case 8:
                        return 'August';
                    break;
                    case 9:
                        return 'September';
                    break;
                    case 10:
                        return 'October';
                    break;
                    case 11:
                        return 'November';
                    break;
                    case 12:
                        return 'December';
                    break;
                }
            }

            function printDate(event) {
                var newDate = new Date(event.startTime);
                var month = mapMonth(newDate.getMonth() + 1);
                return (month + ' ' + newDate.getDate() + ' From ')
            }

            function printTimes(event) {
                var newStartTime = new Date(event.startTime);
                var newEndTime = new Date(event.endTime);
                var minutes1= "";
                var minutes2= "";

                if(newStartTime.getMinutes() < 10){
                  minutes1 = "0"+newStartTime.getMinutes();
                }

                if(newEndTime.getMinutes() < 10){
                  minutes2 = "0"+newEndTime.getMinutes();
                }

                return newStartTime.getHours() + ':' + minutes1 + ' - ' + newEndTime.getHours() + ':' + minutes2;
            }

            function addEvent() {
                var event = {
                    name: $scope.eventName,
                    description: $scope.eventDescription,
                    location: $scope.eventLocation,
                    startTime: $scope.myDate,
                    endTime: $scope.myDate
                }

                //Now reading in the time strings and setting times. Remove when better time picker is made
                var newStartDate = new Date($scope.myDate);
                var newEndDate = new Date($scope.myDate);

                var time = $scope.startTime.match(/(\d+)(?::(\d\d))?\s*(p?)/);
                newStartDate.setHours(parseInt(time[1]) + (time[3] ? 12 : 0));
                newStartDate.setMinutes(parseInt(time[2]) || 0);

                var time2 = $scope.endTime.match(/(\d+)(?::(\d\d))?\s*(p?)/);
                newEndDate.setHours(parseInt(time2[1]) + (time2[3] ? 12 : 0));
                newEndDate.setMinutes(parseInt(time2[2]) || 0);

                event.startTime = newStartDate;
                event.endTime = newEndDate;
                //End Time Reading Hack


                console.log(event);
                CalendarServices.addGroupEvent(event, $stateParams.groupID)
                .then(
                    function (result) {
                        console.log('success adding event');
                        refresh();
                    },
                    function (result) {
                        console.log(result.data);
                    }
                )
            }

            function deleteEvent(event) {
                CalendarServices.deleteGroupEvent(event, $stateParams.groupID)
                .then(
                    function (result) {
                        console.log('success deleting event');
                        refresh();
                    },
                    function (result) {
                        console.log(result.data);
                    }
                )
            }

            function editEvent() {
                CalendarServices.editGroupEvent(event, $stateParams.groupID)
                .then(
                    function (result) {
                        refresh();
                    },
                    function (result) {
                        console.log(result.data);
                    }
                )
            }

            function refresh() {
                CalendarServices.getGroupCalendar($stateParams.groupID)
                .then(
                    function (result) {
                        vm.events = result.data.events;
                        $scope.doodleInProgress = result.data.schedule_assistant.inProgress;
                        $scope.votingActive = result.data.schedule_assistant.active;

                        if ($scope.doodleInProgress) {
                            $scope.eventName = result.data.schedule_assistant.name;
                            $scope.eventLocation = result.data.schedule_assistant.location;
                            $scope.eventDescription = result.data.schedule_assistant.description;
                        }
                        if (votingActive) {
                            vm.voters = result.data.schedule_assistant.voters;
                            $scope.votingEvents = result.data.schedule_assistant.events;
                            $scope.votingEvents.forEach(function(event){
                                event.selected = false;
                            })
                            vm.voters.forEach(function(voter) {
                                if (voter === $scope.user.username) {
                                    $scope.hasVoted = true;
                                }
                            })
                        }
                    },
                    function (result) {
                        console.log(result.data);
                    }
                )
            }

            function openAddEventDialog(ev) {
                $mdDialog.show({
                    controller: 'Groupr.Controllers.AddEventDialog',
                    templateUrl: './Views/_add_event_dialog.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: true,
                    locals : {
                        groupID: $stateParams.groupID,
                        calendarType: 'group'
                    },
                    onRemoving: function(element, removePromise) {
                        refresh();
                    }
                })
            }

            function openEditEventDialog(event, ev) {
                $mdDialog.show({
                    controller: 'Groupr.Controllers.EditEventDialog',
                    templateUrl: './Views/_edit_event_dialog.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: true,
                    locals : {
                        groupID: $stateParams.groupID,
                        calendarType: 'group',
                        event: event
                    },
                    onRemoving: function(element, removePromise) {
                        refresh();
                    }
                })
            }

            function openDoodleDialog(ev) {
                console.log("opening doodle dialog");
                $mdDialog.show({
                    controller: 'Groupr.Controllers.StartDoodleDialog',
                    templateUrl: './Views/_start_doodle_dialog.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: true,
                    locals : {
                        groupID: $stateParams.groupID,
                    },
                    onRemoving: function(element, removePromise) {
                        refresh();
                    }
                })
            }

            return vm;
        }
    ])
        .controller('LeftCtrl', function ($scope, $timeout, $mdSidenav, $log) {
            $scope.close = function () {
                // Component lookup should always be available since we are not using 'ng-if'
                $mdSidenav('left').close()
                    .then(function () {
                        $log.debug("close LEFT is done");
                    });
            };
        });
});
