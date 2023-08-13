if (document.readyState !== 'loading') {
  mainFunc();
} else {
  document.addEventListener('DOMContentLoaded', function () {
    mainFunc();
  });
}

function mainFunc() {
  if (typeof moment === 'function') {
    // Moment.js is loaded, execute your code here
  } else {
    // Moment.js is not loaded yet, wait for a brief moment and try again
    location.reload();
  }

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
  //Also save in session storage
  sessionStorage.setItem("currentProgram", document.getElementById("programEventData").innerText);
  var workouts = null;
  //iterate until we find current program
  for(var i = 0; i < programs.length; i++) {
    if(new Date() <  moment(programs[i].endWeek).toDate()) {
      workouts = programs[i].events;
      break;
    }
  }


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
    
    // Get end of week for current array
    if (currentWeek.length > 0) {
      endOfWeek = getEndOfWeek(currentWeek[0]['start']);
      if(moment(formattedDate).isSameOrAfter(moment(currentWeek[0]['start'])) && moment(formattedDate).isSameOrBefore(moment(endOfWeek))) {
        thisWeek = weekCount;
      }

    }

    if (currentWeek.length === 0 || startDate.isBefore(moment(endOfWeek))) {
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
  
  if(thisWeek != null) {
    weekButton = document.getElementById(`week-${thisWeek}`);
  }

  weekButton.click();

/*
  
  window.addEventListener('load', (event) => {
    MemberStack.onReady.then(async function(member) {  

      // Only allow the page if user is logged in
      if(member.loggedIn === false) {
        window.location = "https://app.bene-fit.io/user-sign-in";
      }

      var metadata = await member.getMetaData();
      var programWorkoutList = document.getElementById("programWorkoutList").children;

      // Extract the workout IDs from the metadata object
      var completedWorkoutIDs = metadata.completedWorkouts.map(function (workout) {
        return workout.workout;
      });

      var currentWorkoutID = metadata.currentWorkout.workout;

      var futureWorkoutIDs = metadata.futureWorkouts.map(function (workout) {
        return workout.workout;
      });

      // Loop through each workout in the HTML list
      for (var i = 0; i < programWorkoutList.length; i++) {
        var workoutID = programWorkoutList[i].querySelector("#workoutID").innerText;

        // Check the status of the workout based on its ID in the metadata
        if (completedWorkoutIDs.includes(workoutID)) {
          programWorkoutList[i].classList.add("complete-workout");
        } else if (currentWorkoutID == workoutID) {
          programWorkoutList[i].classList.add("current-workout");
        } else if (futureWorkoutIDs.includes(workoutID)) {
          programWorkoutList[i].classList.add("future-workout");
        }
      }

      const workouts = JSON.parse(document.getElementById("programEventData").innerText);

      // Sort the workouts array based on the 'Start Date' field
      workouts.sort((a, b) => {
        const dateA = moment(a['start'], 'DD/MM/YYYY');
        const dateB = moment(b['start'], 'DD/MM/YYYY');
        return dateA - dateB;
      });
      
      const weeks = [];
      let currentWeek = [];
      
      for (const workout of workouts) {
        const startDate = moment(workout['start'], 'DD/MM/YYYY');
        let endOfWeek = null;
        
        // Get end of week for current array
        if (currentWeek.length > 0) {
          endOfWeek = getEndOfWeek(currentWeek[0]['start']);
        }
      
        if (currentWeek.length === 0 || startDate.isSameOrBefore(moment(endOfWeek, 'DD/MM/YYYY'))) {
          currentWeek.push(workout);
        } else {
          weeks.push(currentWeek);
          currentWeek = [workout];
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
        button.addEventListener('click', () => {
          displayWorkouts(index, workoutList, workoutListWorkouts, weeks);
        });
      });

    })

  });
  */
 


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
    var addedWorkout = 1;
    for(var i = 0; i < weekIndex; i++) {
      addedWorkout += weeks[i].length;
    }
    // Iterate over the selected week's workouts
    selectedWeekWorkouts.forEach((workout) => {
      // Get the workout element based on the workout ID
      var workoutElement = null;
      var foundIndex = "";
      for(var i = 0; i < workoutListWorkouts.length; i++) {

        const workoutListElement = workoutListWorkouts[i].querySelector("#workoutID");
        const workoutIndex = workoutListWorkouts[i].querySelector("#workoutNumber").innerText
        if(workoutListElement.innerText == workout.extendedProps.workoutID /*&& `Workout ${i}.` == workoutIndex*/) {
          foundIndex = i;
          workoutElement = workoutListElement;
        }
      }

      if (workoutElement && workoutElement.textContent === workout.extendedProps.workoutID) {

        var newElement = workoutElement.closest('.workoutprogramitem').cloneNode(true);
        newElement.querySelector("#workoutNumber").innerText = `Workout ${addedWorkout}.`;
        workoutList.appendChild(newElement);
        addedWorkout += 1;

        const newElementParent = newElement.closest(".workoutprogramitem");
        const workoutIndex = newElementParent.querySelector("#workoutNumber").innerText.split(" ")[1].replace(".","");
        const programID = document.getElementById("programID").innerText;
        const programName = document.getElementById("programFullName").innerText;
        //Set onclick to capture current date and workout id
        newElement.onclick = (event) => {
          const workoutID = `${workout.extendedProps.workoutID}+${moment().format('YYYY-MM-DD')}`;
          sessionStorage.setItem("currentWorkout", workoutID);
          sessionStorage.setItem("workoutIndex", workoutIndex);
          sessionStorage.setItem("programID", programID);
          sessionStorage.setItem("programName", programName);
        }

      }
    });

    // Get the current workout element
    var currentWorkout = document.querySelector('.current-workout');

    // Check if the current workout element is not already the first element
    if (currentWorkout && currentWorkout !== workoutList.firstChild) {
      // Move the current workout element to the beginning of the list
      workoutList.insertBefore(currentWorkout, workoutList.firstChild);
    }


  }

}
