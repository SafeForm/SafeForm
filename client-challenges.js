const devMode = localStorage.getItem("devMode");
if (document.readyState !== 'loading') {
  if(devMode == undefined) {
    main();
  }
  
} else {
  document.addEventListener('DOMContentLoaded', function () {
    if(devMode == undefined) {
      main();
    }
  });
}

function main() {

  //Save url
  sessionStorage.setItem("challengePage", window.location);

  //Loop through all list items and assign href to each workout
  const challengeWorkoutList = document.getElementById("challengeWorkoutList").children;
  for (var i = 0; i < challengeWorkoutList.length; i++) {
    //Get link from workout summary information and set thumbnail link
    var workoutSummaryLink = challengeWorkoutList[i].querySelector("#workoutSummaryLink");
    workoutSummaryLink.href += "?fromChallenge=true";
    challengeWorkoutList[i].querySelector("#thumbnailLink").href = workoutSummaryLink.href;
    challengeWorkoutList[i].querySelector("#workoutSummaryLink").href = workoutSummaryLink.href;
  }

  MemberStack.onReady.then(async function(member) {

    var metadata = await member.getMetaData();

    const gymName = member["current-gym"];

    if(gymName && gymName != "" && gymName.toLowerCase() == "sam druce - fitness") {
      localStorage.setItem("fromGym", gymName);
    }

    const weeks = [];

    document.addEventListener('click', function (event) {

      if(event.target.id == "dayView") {
        if(event.target.classList.contains("dayweekbutton")) {
          $('#weekParentDiv > a:not(.div-block-574 .w-button)').hide();
          $('#weekParentDiv > button').show();
          event.target.classList.remove("dayweekbutton");
          event.target.classList.add("dayweekbuttonclicked");
          
          document.getElementById("scheduleText").innerText = "By Day";

          document.getElementById("weeklyView").click();
          
          document.getElementById(sessionStorage.getItem("currentDay")).click();
          document.getElementById("weeklyView").classList.remove("dayweekbuttonclicked");
          document.getElementById("weeklyView").classList.add("dayweekbutton");
        }
      }

      if(event.target.id == "weeklyView") {

        if(event.target.classList.contains("dayweekbutton")) {
          $('#weekParentDiv > a:not(.div-block-574 .w-button)').show();
          $('#weekParentDiv > button').hide();
          event.target.classList.remove("dayweekbutton");
          event.target.classList.add("dayweekbuttonclicked");

          document.getElementById("scheduleText").innerText = "By Week";

          var selectedWeek = getWeekNumber(sessionStorage.getItem("currentDay"), weeks);
          document.getElementById(`week-${selectedWeek}`).click();
          
          
          document.getElementById("dayView").click();
    
          document.getElementById("dayView").classList.remove("dayweekbuttonclicked");
          document.getElementById("dayView").classList.add("dayweekbutton");
        }



      }

    });

    var workoutList = document.querySelectorAll("#challengeWorkoutList .challengeitem");

    for(var i = 0; i < workoutList.length; i++) {
      workoutList[i].querySelector("#workoutIndex").innerText = i;
    }

    localStorage.setItem("freeProgramLink", window.location);
    //Update workout index
    var workoutList = document.querySelectorAll(".workoutprogramitem");

    moment.updateLocale('en', {
      week: {
        dow: 1, // Monday
      },
    });

    //Loop through all list items and assign href to each workout
    const challengeWorkoutList = document.getElementById("challengeWorkoutList").children;

    for (var i = 0; i < challengeWorkoutList.length; i++) {
      //Get link from workout summary information and set thumbnail link
      var workoutSummaryLink = challengeWorkoutList[i].querySelector("#workoutSummaryLink");
      challengeWorkoutList[i].querySelector("#thumbnailLink").href = workoutSummaryLink.href;
      challengeWorkoutList[i].querySelector("#workoutSummaryLink").href = workoutSummaryLink.href;
    }

    //Add week buttons to paginate through workout, based on number of workouts
    var numWeeks = document.getElementById("challengeWeeks").innerText;
    var weekButton = document.getElementById("week-1");
    var parentDiv = document.getElementById("weekParentDiv");
    
    for (var i = 0; i < numWeeks; i++) {
        var newButton = weekButton.cloneNode(true);
        newButton.innerText = `Week ${i+1}`;
        // Apply styling based on completion and current week status
        newButton.id = `week-${i+1}`;

        parentDiv.appendChild(newButton);
    }
    //Remove original placeholder button
    weekButton.remove();

    const challenge = JSON.parse(document.getElementById("challengeEventData").innerText);

    //Also save in session storage
    sessionStorage.setItem("currentProgram", document.getElementById("challengeEventData").innerText);
    sessionStorage.setItem("currentFullProgram", document.getElementById("challengeFullEventData").innerText);

    var workouts = [];
    var tasks = [];

    //Iterate until we find current program
    for(var i = 0; i < challenge.length; i++) {
      if(challenge[i].extendedProps.workoutID) {
        workouts.push(challenge[i]);
      } else {
        tasks.push(challenge[i]);
      }
    }

    //Check if workouts exist
    if(workouts.length > 0 || tasks.length > 0) {

      workouts = workouts.concat(tasks)

      //Sort the workouts array based on the 'Start Date' field
      workouts.sort((a, b) => {
        const dateA = moment(a['start']);
        const dateB = moment(b['start']);
        return dateA - dateB;
      });

      tasks.sort((a, b) => {
        const dateA = moment(a['start']);
        const dateB = moment(b['start']);
        return dateA - dateB;
      });

      let currentWeek = [];
      var thisWeek = null;

      
      var challengeStartDate = new Date(document.getElementById("challengeStartDate").innerText);
      var challengeEndDate = new Date(document.getElementById("challengeEndDate").innerText);
      const formattedDate = moment(challengeStartDate).format('YYYY-MM-DD');

      var weekCount = 1;

      for (const workout of workouts) {

        const startDate = moment(workout['start']);

        let endOfWeek = null;
        let startOfWeek = null;

        // Get end of week for current array
        if (currentWeek.length > 0) {

          endOfWeek = getEndOfWeek(currentWeek[0]['start']);
          startOfWeek = moment(endOfWeek).subtract(6, 'days').format('YYYY-MM-DD');

          if(moment(formattedDate).isSameOrAfter(moment(startOfWeek)) && moment(formattedDate).isSameOrBefore(moment(endOfWeek))) {
            thisWeek = weekCount;
          }

        }

        if (currentWeek.length === 0 || startDate.isSameOrBefore(moment(endOfWeek))) {
          currentWeek.push(workout);
        } else {
          weeks.push(currentWeek);
          currentWeek = [workout];
          weekCount++;
        }
      }

      // Push the last week
      if (currentWeek.length > 0) {
        weeks.push(currentWeek);
      }

      const buttons = document.querySelectorAll('a[id^="week-"]');
      const workoutListWorkouts = document.querySelectorAll('.challengeitem');
      const workoutList = document.getElementById('challengeWorkoutList');
      const weeklyTaskList = document.getElementById('challengeWeeklyTaskList');

      // Add event listeners to the buttons
      buttons.forEach((button, index) => {


        thisWeek = getWeekNumber(sessionStorage.getItem("currentDay"), weeks);

        if(index+1 == thisWeek) {
          button.classList.remove("week-button");
          button.classList.add("current-week");
        } else if(index+1 < thisWeek) {
          button.classList.remove("week-button");
          button.classList.add("previous-week");
        }

        button.addEventListener('click', (event) => {
          addWorkoutsToList(workoutList, workoutListWorkouts, index, weeks, weeklyTaskList, "week");
         
          $('#weekParentDiv .current-week-clicked').removeClass('current-week-clicked').addClass("current-week");
          $('#weekParentDiv .week-button-clicked').removeClass('week-button-clicked').addClass("week-button");
          $('#weekParentDiv .previous-week-clicked').removeClass('previous-week-clicked').addClass("previous-week");


          //Check what the target class was:
          if(event.target.classList.contains("current-week")) {
            event.target.classList.remove("current-week");
            event.target.classList.add("current-week-clicked");
          } else if(event.target.classList.contains("week-button")) {
            event.target.classList.remove("week-button");
            event.target.classList.add("week-button-clicked");
          } else if(event.target.classList.contains("previous-week")) {
            event.target.classList.remove("previous-week");
            event.target.classList.add("previous-week-clicked");
          }

          //Set current week number again
          sessionStorage.setItem("currentWeekNumber", event.target.innerText.split(" ")[1])

        });
      });
      
      weekButton = document.getElementById("week-1");
      weekButton.click();
      sessionStorage.setItem("currentWeekNumber", thisWeek)

      var days = [];
      
      // Group workouts by days
      for (const workout of workouts) {
        const workoutDate = moment(workout['start']).format('YYYY-MM-DD');
        
        if (workout.extendedProps.weeklyTask != "true" && !days[workoutDate]) {
          days[workoutDate] = [];
        }
        if(workout.extendedProps.weeklyTask != "true") {
          days[workoutDate].push(workout);  
        }
        
      }

      // Create buttons for each day
      Object.keys(days).forEach((day, index) => {
        const button = document.createElement('button');
        button.innerText = index + 1;
        button.id = day;

        var currentDay = moment().format('YYYY-MM-DD');

        if(button.id == currentDay) {
          button.classList.remove("day-button");
          button.classList.add("current-day");
        } else if(button.id < currentDay) {
          button.classList.remove("day-button");
          button.classList.add("previous-day");
        } else {
          button.classList.add("day-button");
        }

        const filteredWorkouts = workouts.filter(workout => {
          if (workout.extendedProps.weeklyTask) {
            const workoutDate = new Date(workout.start);
            const selectedDate = new Date(day);
            return isInSameWeek(selectedDate, workoutDate);
          }
          return false;
        });

        days[day] = filteredWorkouts.concat(days[day]);
        //button.classList.add("day-button")
        button.addEventListener('click', (event) => {
          addWorkoutsToList(workoutList, workoutListWorkouts, day, days, weeklyTaskList, "day");

          $('#weekParentDiv .current-day-clicked').removeClass('current-day-clicked').addClass("current-day");
          $('#weekParentDiv .day-button-clicked').removeClass('day-button-clicked').addClass("day-button");
          $('#weekParentDiv .previous-day-clicked').removeClass('previous-day-clicked').addClass("previous-day");
  
  
          //Check what the target class was:
          if(event.target.classList.contains("current-day")) {
            event.target.classList.remove("current-day");
            event.target.classList.add("current-day-clicked");
          } else if(event.target.classList.contains("day-button")) {
            event.target.classList.remove("day-button");
            event.target.classList.add("day-button-clicked");
          } else if(event.target.classList.contains("previous-day")) {
            event.target.classList.remove("previous-day");
            event.target.classList.add("previous-day-clicked");
          }
  
          sessionStorage.setItem("currentDay", day);
        });

        // Append button to DOM
        document.getElementById('weekParentDiv').appendChild(button);
      });

      var currentDate = moment().format('YYYY-MM-DD');
      if(document.getElementById(currentDate)) {
        document.getElementById(currentDate).click()
        sessionStorage.setItem("currentDay", currentDate);
      } else {
        //Iterate backwards and find button
        const challengeStartDay = moment(challengeStartDate).format('YYYY-MM-DD');
        currentDate = moment();
        while (currentDate.isAfter(moment(challengeStartDay))) {
          currentDate = currentDate.subtract(1, 'day'); // Subtract 1 day
          const currentDateString = currentDate.format('YYYY-MM-DD');
          const element = document.getElementById(currentDateString);
          if (element) {
              element.click(); // Click the element if it exists
              break; // Break out of the loop
          }
        }
        
      }
      
    } else {
      document.getElementById("guideListParent").style.display = "none";
      document.getElementById("workout-empty-state").style.display = "flex";
    }


    //Hide week buttons for now
    $('#weekParentDiv > a:not(.div-block-574 .w-button)').hide();
    $('#weekParentDiv > button').show();

    function getWeekNumber(dateString, weeks) {
      const date = new Date(dateString);
      
      for (let i = 0; i < weeks.length; i++) {
          const week = weeks[i];
          for (let j = 0; j < week.length; j++) {
              const event = week[j];
              const eventDate = new Date(event.start);
              if (eventDate.getFullYear() === date.getFullYear() &&
                  eventDate.getMonth() === date.getMonth() &&
                  eventDate.getDate() === date.getDate()) {
                  return i + 1;
              }
          }
      }

      return 1; // Date not found in the provided object
  }

    function isInSameWeek(date1, date2) {
      const firstDayOfWeek = new Date(date1);
      firstDayOfWeek.setDate(date1.getDate() - date1.getDay()); // Set to Sunday of the week
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6); // Set to Saturday of the week
      return date2 >= firstDayOfWeek && date2 <= lastDayOfWeek;
    }

    function getEndOfWeek(date) {
      // Parse the input date using Moment.js
      const inputDate = moment(date);

      // Calculate the end of the week (Sunday) using Moment.js
      const endOfWeek = inputDate.endOf('week').isoWeekday(7);
      
      // Format the end of the week as a string in the format "DD/MM/YYYY"
      const formattedEndOfWeek = endOfWeek.format('YYYY-MM-DD');
      // Return the formatted end of the week
      return formattedEndOfWeek;
    }

    function addWorkoutsToList(workoutList, workoutListWorkouts, index, weeks, weeklyTaskList, view="week") {

      var workouts = [];
      if(index >= weeks.length) {
        workouts = weeks[weeks.length-1];
      } else {
        workouts = weeks[index];
      }

      if (workoutListWorkouts.length > 0) {
        // Clear the current workout list
        workoutList.innerHTML = '';
        if(weeklyTaskList) {
          weeklyTaskList.innerHTML = '';
        }
        
        var nextDay = null;
        var currentDay = null;
        var isSameDay = true;
        var count = 1;
        var currentDiv = null; // Track the current div for same-day workouts
        var completedWeeklyTasks = 0
        var taskCounter = 0;
        for (var i = 0; i < workouts.length; i++) {
          const isWeekly = workouts[i].extendedProps.weeklyTask;
          currentDay = moment(workouts[i].start);
          if (i < workouts.length - 1) {
            nextDay = moment(workouts[i + 1].start);
          }

          // Check if the current workout and the next workout are on the same day
          
          if (workouts[i].extendedProps.weeklyTask != "true" && (currentDay.isSame(nextDay) || isSameDay)) {
            isSameDay = true;
            // If the current div is not set or different from the new div date, create a new div
            if (!currentDiv || !currentDiv.dataset.date || currentDiv.dataset.date !== currentDay.format("YYYY-MM-DD")) {

              currentDiv = document.createElement('div');
              taskCounter = 0;

              currentDiv.style.marginBottom = '10px';
              //currentDiv.style.borderBottom = '1px solid #CBCBCB';

              currentDiv.style.display = "flex";
              currentDiv.style.flexDirection = "column";
              currentDiv.style.alignItems = "flex-start";
              currentDiv.style.width = "100%";
              currentDiv.style.padding = "5px";

              currentDiv.dataset.date = currentDay.format("YYYY-MM-DD"); // Set dataset to track date

              const daytext = document.createElement('div');
              daytext.innerText = `Day ${count}`;
              daytext.style.padding = "5px";

              if(currentDay.format("YYYY-MM-DD") == moment(new Date).format("YYYY-MM-DD")) {
                daytext.style.color = "#0c08d5";
              } else if(currentDay.format("YYYY-MM-DD") < moment(new Date).format("YYYY-MM-DD")) {
                daytext.style.color = "#000000";
              }

              if(view == "week") {
                currentDiv.appendChild(daytext);
              }
              
              workoutList.appendChild(currentDiv);
              count += 1;
            } 
          } else {
            isSameDay = false;
            // Update currentDiv for next day's workouts
            currentDiv = null;
          }
          
          // Find matching workout element
          for (var j = 0; j < workoutListWorkouts.length; j++) {

            //Check if workout
            if(workoutListWorkouts[j].querySelector("#workoutID")) {

              if (workoutListWorkouts[j].querySelector("#workoutID").innerText == workouts[i].extendedProps.workoutID) {
                const clonedWorkout = workoutListWorkouts[j].cloneNode(true);
                const workoutUniqueID = workouts[i].extendedProps.uniqueWorkoutID;

                clonedWorkout.onclick = () => {
                  sessionStorage.setItem("currentWorkout", workoutUniqueID);
                }

                if(metadata[workoutUniqueID]) {

                  clonedWorkout.querySelector("#workoutStatus").classList.remove("not-started");
                  clonedWorkout.querySelector("#workoutStatus").classList.add("finished");
                  clonedWorkout.querySelector("#workoutStatus").innerText = "Finished";

                  if(isWeekly) {
                    completedWeeklyTasks += 1;
                    updateWeeklyTaskText(completedWeeklyTasks, numberOfWeeklyTasks);
                  }
                } else if(workoutUniqueID == localStorage.getItem("startedWorkout")) {
                  clonedWorkout.querySelector("#workoutStatus").classList.remove("not-started");
                  clonedWorkout.querySelector("#workoutStatus").classList.add("in-progress");
                  clonedWorkout.querySelector("#workoutStatus").innerText = "In Progress";
                } 
                
                if (isSameDay) {
                  
                  if(workouts[i].extendedProps.weeklyTask == "true") {
                    weeklyTaskList.appendChild(clonedWorkout); // Append to the current div for same-day workouts
                  } else {
                    currentDiv.appendChild(clonedWorkout); // Append to the current div for same-day workouts
                  }
                  
                } else {
                  if(workouts[i].extendedProps.weeklyTask == "true") {
                    weeklyTaskList.appendChild(clonedWorkout); // Append directly to the workout list
                  } else {
                    workoutList.appendChild(clonedWorkout); // Append directly to the workout list
                  }
                }

                break;
              }
            }

            if(workoutListWorkouts[j].querySelector("#taskID")) {

              if (workoutListWorkouts[j].querySelector("#taskID").innerText == workouts[i].extendedProps.taskID) {
                const clonedTask = workoutListWorkouts[j].cloneNode(true);

                const taskCompleteButton = clonedTask.querySelector("#completeExercise");
                const taskCompletedButton = clonedTask.querySelector("#completedExercise");
                const taskUniqueID = workouts[i].extendedProps.uniqueTaskID;

                taskCompleteButton.onclick = () => {
                  handleCompleteTask(taskUniqueID, true);
                  metadata[taskUniqueID] = "true";
                  styleCompleteTask(clonedTask);
                  if(isWeekly) {
                    completedWeeklyTasks += 1;
                    updateWeeklyTaskText(completedWeeklyTasks, numberOfWeeklyTasks);
                  }
                }

                taskCompletedButton.onclick = () => {
                  handleCompleteTask(taskUniqueID, null);
                  metadata[taskUniqueID] = null;
                  styleCompletedTask(clonedTask);
                  completedWeeklyTasks -= 1;
                  if(isWeekly) {
                    updateWeeklyTaskText(completedWeeklyTasks, numberOfWeeklyTasks);
                  }
                }

                if(metadata[taskUniqueID]) {
                  styleCompleteTask(clonedTask);
                  if(isWeekly) {
                    completedWeeklyTasks += 1;
                  }
                }

                if (isSameDay) {
                  if(workouts[i].extendedProps.weeklyTask == "true") {
                    weeklyTaskList.appendChild(clonedTask); // Append to the current div for same-day workouts
                  } else {
                    
                    const textBlock = clonedTask.querySelector(".text-block-324");
                    if (textBlock && textBlock.innerText.trim() !== "" && taskCounter === 0) {
                        const firstChild = currentDiv.firstChild;
                        if (firstChild && firstChild.innerText.includes("Day")) {
                            currentDiv.insertBefore(clonedTask, firstChild.nextSibling);
                        } else {
                            currentDiv.insertBefore(clonedTask, firstChild);
                        }
                        taskCounter += 1;
                    } else {
                      
                      currentDiv.appendChild(clonedTask); // Append to the current div for same-day workouts
                    }
                    
                  }
                  
                } else {
                  
                  if(workouts[i].extendedProps.weeklyTask == "true") {
                    weeklyTaskList.appendChild(clonedTask); // Append directly to the workout list
                  } else {
                    workoutList.appendChild(clonedTask); // Append directly to the workout list
                  }
                }
                break;
              }
            }

          }

        }

        //Remove border from last element
        const itemList = document.getElementById("challengeWorkoutList").children;
        if(itemList.length > 0) {
          itemList[itemList.length - 1].style.borderBottom = '';
        }

        //Add number of tasks to weekly
        var weeklyTaskText = document.getElementById("weeklyTaskText").innerText;
        var numberOfWeeklyTasks = document.querySelectorAll(".weekly-tasks .challengeitem").length;
        updateWeeklyTaskText(completedWeeklyTasks, numberOfWeeklyTasks);
        

      }

    }

    var weekButtonOffset = document.querySelector(".current-day-clicked");
    if(weekButtonOffset) {
      weekButtonOffset = weekButtonOffset.offsetLeft - 25
      //Get current week and scroll to it
      document.getElementById("weekParentDiv").scrollTo({
        left: weekButtonOffset
      })
    }


  });

}



  // Function to check if the device is iOS
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  // Function to check if the device is Android
  function isAndroid() {
    return /Android/.test(navigator.userAgent);
  }

// Function to show the appropriate instructions element
function showInstructions() {
  const instructionsModal = document.getElementById('instructionsModal');
  const iosInstructions = document.querySelector('.ios-instructions');
  const androidInstructions = document.querySelector('.android-instructions');

  // Check if the 'hasViewedProgram' flag exists in localStorage
  const hasViewedProgram = localStorage.getItem('hasViewedProgram');
  if (hasViewedProgram === null || hasViewedProgram === 'false') {
    // Show the instructions modal
    instructionsModal.style.display = 'flex';
    instructionsModal.style.alignContent = 'center';
    instructionsModal.style.justifyContent = 'center';

    if (isIOS()) {
      // Show iOS instructions, hide Android instructions
      iosInstructions.style.display = 'flex';
      androidInstructions.style.display = 'none';
    } else if (isAndroid()) {
      // Show Android instructions, hide iOS instructions
      iosInstructions.style.display = 'none';
      androidInstructions.style.display = 'flex';
    } else {
      // If the device is neither iOS nor Android, you can handle it as you wish
      // For example, show a default instruction or hide both elements.
      iosInstructions.style.display = 'flex';
      androidInstructions.style.display = 'none';
    }

    // Set the 'hasViewedProgram' flag to true in localStorage
    localStorage.setItem('hasViewedProgram', 'true');
  }
}

function updateWeeklyTaskText(completedWeeklyTasks, numberOfWeeklyTasks) {
  document.getElementById("weeklyTaskText").innerText = `Weekly Tasks ${completedWeeklyTasks}/${numberOfWeeklyTasks}`;

  if(numberOfWeeklyTasks == 0) {
    document.querySelector(".div-block-573").style.display = "none";
  } else if(numberOfWeeklyTasks != 0 && completedWeeklyTasks == numberOfWeeklyTasks) {
    document.querySelector(".weekly-tasks").style.borderColor = "#6F6E6E";
    document.querySelector("#weeklyTaskText").style.color = "#6F6E6E";
  } else {
    document.querySelector(".weekly-tasks").style.borderColor = "#cbcbcb";
    document.querySelector("#weeklyTaskText").style.color = "";
  }
}


function styleCompleteTask(taskElement) {
  taskElement.style.borderColor = "#6F6E6E";
  
  taskElement.querySelector(".text-block-317").style.color = "black";
  taskElement.querySelector("#completeExercise").style.display = "none";
  taskElement.querySelector("#completedExercise").style.display = "block";
}

function styleCompletedTask(taskElement) {
  taskElement.style.borderColor = "#cbcbcb";
  taskElement.querySelector(".text-block-317").style.color = "#6f6e6e";
  taskElement.querySelector("#completedExercise").style.display = "none";
  taskElement.querySelector("#completeExercise").style.display = "block";
}

function handleCompleteTask(uniqueTaskID, value) {
  MemberStack.onReady.then(async function(member) {
    var memberProgress = {
      [uniqueTaskID]: value
    }

    member.updateMetaData(memberProgress);
  });

}

function getMemberMetaData(uniqueTaskID) {
  return new Promise((resolve, reject) => {
    MemberStack.onReady.then(async function(member) {
      try {
        var metadata = await member.getMetaData();
        resolve(metadata[uniqueTaskID] || false);
      } catch (error) {
        reject(error);
      }
    });
  });
}
