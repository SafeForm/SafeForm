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

  //Update workout index
  const workoutList = document.querySelectorAll(".workoutprogramitem");
  for(var i = 0; i < workoutList.length; i++) {
    workoutList[i].querySelector("#workoutIndex").innerText = i;
  }

  if (typeof moment === 'function') {
    // Moment.js is loaded, execute your code here
  } else {
    // Moment.js is not loaded yet, wait for a brief moment and try again
    location.reload();
  }

  moment.updateLocale('en', {
    week: {
      dow: 1, // Monday
    },
  });

  showInstructions();
  //Loop through all list items and assign href to each workout
  const programWorkoutList = document.getElementById("programWorkoutList").children;

  for (var i = 0; i < programWorkoutList.length; i++) {
    //Get link from workout summary information and set thumbnail link
    var workoutSummaryLink = programWorkoutList[i].querySelector("#svgPersonLink");
    workoutSummaryLink.href += "?fromProgram=true";
    programWorkoutList[i].querySelector("#thumbnailLink").href = workoutSummaryLink.href;
    programWorkoutList[i].querySelector("#workoutSummaryLink").href = workoutSummaryLink.href;

  }

  MemberStack.onReady.then(async function(member) {  
    const gymName = member["current-gym"];
    localStorage.setItem("fromGym", gymName)

  });

  //Add week buttons to paginate through workout, based on number of workouts
  var numWeeks = document.getElementById("programWeeks").innerText;
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

  const programs = JSON.parse(document.getElementById("programEventData").innerText);
  console.log(programs)
  //Also save in session storage
  sessionStorage.setItem("currentProgram", document.getElementById("programEventData").innerText);
  sessionStorage.setItem("currentFullProgram", document.getElementById("programFullEventData").innerText);

  var workouts = null;
  //iterate until we find current program
  for(var i = 0; i < programs.length; i++) {

    if(new Date().setHours(0, 0, 0, 0) <=  moment(programs[i].endWeek).toDate()) {
      workouts = programs[i].events;
      break;
    }
  }
  //Check if workouts exist
  if(workouts != null) {

    //Sort the workouts array based on the 'Start Date' field
    workouts.sort((a, b) => {
      const dateA = moment(a['start']);
      const dateB = moment(b['start']);
      return dateA - dateB;
    });
    
    const weeks = [];
    let currentWeek = [];
    var thisWeek = null;

    const currentDate = new Date(); // This gets the current date and time
    const formattedDate = moment(currentDate).format('YYYY-MM-DD');

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
    const workoutListWorkouts = document.getElementById('programWorkoutList').cloneNode(true).children;
    const workoutList = document.getElementById('programWorkoutList');

    // Add event listeners to the buttons
    buttons.forEach((button, index) => {
      button.addEventListener('click', (event) => {

        displayWorkouts(index, workoutList, workoutListWorkouts, weeks);
        $('#weekParentDiv .w-button').removeClass('current-week').addClass("week-button");
        event.target.classList.remove("week-button");
        event.target.classList.add("current-week");
      });
    });

    weekButton = document.getElementById("week-1");

    //Check if there are workouts in this week, otherwise show empty state
    if(thisWeek != null) {
      weekButton = document.getElementById(`week-${thisWeek}`);
      weekButton.click();
      sessionStorage.setItem("currentWeekNumber", thisWeek)
    } else {
      document.getElementById("guideListParent").style.display = "none";
      document.getElementById("workout-empty-state").style.display = "flex";
    }
  } else {
    document.getElementById("guideListParent").style.display = "none";
    document.getElementById("workout-empty-state").style.display = "flex";
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

  // Function to filter and display the workouts based on the selected week
  function displayWorkouts(weekIndex, workoutList, workoutListWorkouts, weeks) {

    // Clear the current workout list
    workoutList.innerHTML = '';

    // Get the selected week's workouts from the JSON structure
    const selectedWeekWorkouts = weeks[weekIndex];

    //Get workout index to start of the selected week
    var addedWorkout = 0;
    for(var i = 0; i < weekIndex; i++) {
      addedWorkout += weeks[i].length;
    }

    // Get the current date using moment.js
    const currentDate = moment();

    // Find the object with the closest 'start' date to the current date
    let closestWorkout = null;
    let minDateDifference = Infinity;

    var lastFinishedWorkout = localStorage.getItem("completedWorkout");
    if(lastFinishedWorkout) {
      lastFinishedWorkout = lastFinishedWorkout.split("+");
      var lastFinishedWorkoutIndex = null;
      if(lastFinishedWorkout.length > 2) {
        lastFinishedWorkoutIndex = lastFinishedWorkout[2];
      }
  
    }


    for (let i = 0; i < selectedWeekWorkouts.length; i++) {
      const workout = selectedWeekWorkouts[i];
      console.log(workout)
      if (workout.extendedProps.completedID === undefined) {
          closestWorkout = selectedWeekWorkouts[i];
          break;
      }
    }

    var completedWorkouts = 0;
    // Iterate over the selected week's workouts
    
    selectedWeekWorkouts.forEach((workout, index) => {

      // Get the workout element based on the workout ID
      var workoutElement = null;
      var foundIndex = "";
      var workoutIndex = 0;
      for(var i = 0; i < workoutListWorkouts.length; i++) {

        //Only check this weeks workouts
        if(i >= addedWorkout) {
          const workoutListElement = workoutListWorkouts[i].querySelector("#workoutID");
          workoutIndex = workoutListWorkouts[i].querySelector("#workoutIndex").innerText;
  
          if(workoutListElement.innerText == workout.extendedProps.workoutID && i == workoutIndex) {
            foundIndex = i;
            workoutElement = workoutListElement;
            break;
          }
        }

      }

      if (workoutElement && workoutElement.textContent === workout.extendedProps.workoutID) {

        var newElement = workoutElement.closest('.workoutprogramitem').cloneNode(true);

        newElement.querySelector("#workoutNumber").innerText = `Workout ${addedWorkout}.`;
        workoutList.appendChild(newElement);
        
        //Check if the workout is complete
        if(workout.extendedProps.completedID != undefined || (lastFinishedWorkoutIndex && lastFinishedWorkoutIndex == (addedWorkout))) {
          newElement.querySelector(".workoutprogramdiv").style.borderColor = "#08D58B" //make border green if complete
          completedWorkouts += 1;
        } else if(workout === closestWorkout) {
          newElement.querySelector("#workoutNumber").style.display = "block";
          newElement.querySelector(".workoutprogramdiv").classList.add("current-workout"); //change background colour if current
        } else {
          newElement.querySelector(".workoutprogramdiv").classList.add("future-workout"); //change border colour and time image if future
          //Workout info breaker
          newElement.querySelector("#workoutInfoBreaker").style.borderRightColor = "#6f6e6e";
        }
        addedWorkout += 1;
        const newElementParent = newElement.closest(".workoutprogramitem");
        const workoutIndex = newElementParent.querySelector("#workoutIndex").innerText;
        const programID = document.getElementById("programID").innerText;
        const programName = document.getElementById("programFullName").innerText;
        //Set onclick to capture current date and workout id
        newElement.onclick = (event) => {
          var uniqueWorkoutID = null;

          if(workout.extendedProps.completedID !== undefined) {
            uniqueWorkoutID = workout.extendedProps.completedID;
          } else {
            if(workout.extendedProps.uniqueWorkoutID != undefined) {
              uniqueWorkoutID = `${workout.extendedProps.uniqueWorkoutID}+${moment().format('YYYY-MM-DD')}+${workoutIndex}`;
            } else {
              uniqueWorkoutID = `${workout.extendedProps.workoutID}+${moment().format('YYYY-MM-DD')}+${workoutIndex}`;
            }
          }
          sessionStorage.setItem("currentWorkout", uniqueWorkoutID);
          sessionStorage.setItem("workoutIndex", workoutIndex);
          sessionStorage.setItem("programID", programID);
          sessionStorage.setItem("programName", programName);
        }

      }
    });

    var progressBar = document.getElementById("workoutProgress");

    progressBar.max = selectedWeekWorkouts.length;
    progressBar.value = completedWorkouts;
    //Check if all complete
    if(progressBar.max/progressBar.value == 1) {
      document.getElementById("guideListParent").style.display = "none";
      document.getElementById("workout-empty-state").style.display = "flex";
      document.getElementById("emptyStateText").innerText = "This weeks workouts have been completed - great work!";

    }

    // Get the current workout element
    var currentWorkout = document.querySelector('.current-workout');

    // Check if the current workout element is not already the first element
    if (currentWorkout && currentWorkout !== workoutList.firstChild) {
      // Move the current workout element to the beginning of the list
      currentWorkout = currentWorkout.parentElement;
      workoutList.insertBefore(currentWorkout, workoutList.firstChild);
      currentWorkout.querySelector("#workoutNumber").innerText = "Todays Workout";
    }


  }

}
