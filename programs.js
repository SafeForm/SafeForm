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

  localStorage.setItem("freeProgramLink", window.location);
  //Update workout index
  var workoutList = document.querySelectorAll(".workoutprogramitem");

  var stripeProduct = document.getElementById("stripeProduct").innerText;

  moment.updateLocale('en', {
    week: {
      dow: 1, // Monday
    },
  });

  //Loop through all list items and assign href to each workout
  const programWorkoutList = document.getElementById("programWorkoutList").children;

  for (var i = 0; i < programWorkoutList.length; i++) {
    //Get link from workout summary information and set thumbnail link
    var workoutSummaryLink = programWorkoutList[i].querySelector("#workoutSummaryLink");
    workoutSummaryLink.href += "?fromFreeProgram=true";
    programWorkoutList[i].querySelector("#thumbnailLink").href = workoutSummaryLink.href;
    programWorkoutList[i].querySelector("#workoutSummaryLink").href = workoutSummaryLink.href;

  }

  document.addEventListener('click', function(event) {

    if(event.target.id == "buyNowModal") {
      document.getElementById("buyNowModal").style.display = "none";
      document.querySelector(".freeprogrambody").style.overflow = "auto";
    }

    if(event.target.id == "closeCreateUserModal") {
      document.querySelector(".freeprogrambody").style.overflow = "auto";
    }

    if(event.target.closest("#home")) {
      document.getElementById("buyNowModal").style.display = "flex";
      document.querySelector(".freeprogrambody").style.overflow = "hidden";
    }

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
  sessionStorage.setItem("currentFullProgram", document.getElementById("programFullEventData").innerText);

  var workouts = [];

  var endOfProgramWeek = getEndOfWeek(programs[0]['start']);
  var startOfProgramWeek = moment(endOfProgramWeek).subtract(6, 'days').format('YYYY-MM-DD');

  //Iterate until we find current program
  for(var i = 0; i < programs.length; i++) {

    workouts.push(programs[i]);
  
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

    var currentDate = new Date(); // This gets the current date and time
    var formattedDate = moment(currentDate).format('YYYY-MM-DD');

    var parts = workouts[0].start.split("-");
    var firstProgramDate = new Date(parts[0], parts[1] - 1, parts[2]); // Adjust for zero-based month
    var lastProgramDate = new Date(workouts[workouts.length - 1].start);

    if (currentDate < firstProgramDate) {
      formattedDate = firstProgramDate;
    } else if (currentDate > lastProgramDate) {
      formattedDate = lastProgramDate;
    } 
    
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

    //Restart thisweek
    thisWeek = 1;

    const buttons = document.querySelectorAll('a[id^="week-"]');
    const workoutListWorkouts = document.getElementById('programWorkoutList').cloneNode(true).children;
    const workoutList = document.getElementById('programWorkoutList');

    // Add event listeners to the buttons
    buttons.forEach((button, index) => {

      if(index+1 == thisWeek) {
        button.classList.remove("week-button");
        button.classList.add("current-week");
      } else if(index+1 < thisWeek) {
        button.classList.remove("week-button");
        button.classList.add("previous-week");
      }

      button.addEventListener('click', (event) => {

        if(index == 0 || stripeProduct.toLowerCase() == "true") {
          displayWorkouts(index, workoutList, workoutListWorkouts, weeks);

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
        } else {
          document.getElementById("buyNowModal").style.display = "flex";
          document.querySelector(".freeprogrambody").style.overflow = "hidden";
        }
        
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

  var weekButtonOffset = document.querySelector(".current-week-clicked");

  if(weekButtonOffset) {
    weekButtonOffset = weekButtonOffset.offsetLeft - 25;
    //Get current week and scroll to it
    document.getElementById("weekParentDiv").scrollTo({
      left: weekButtonOffset
    });
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
    var nextDay = null;
    var currentDay = null;
    var isSameDay = true;
    var count = 1;
    var currentDiv = null; // Track the current div for same-day workouts

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
      var lastCompletedWorkout = null;

      if(lastFinishedWorkout.length > 2) {
        lastFinishedWorkoutIndex = lastFinishedWorkout[2];
        lastCompletedWorkout = lastFinishedWorkout[0];
      } else if(lastFinishedWorkout.length == 1) {
        lastCompletedWorkout = lastFinishedWorkout[0];
      }
    }

    for (let i = 0; i < selectedWeekWorkouts.length; i++) {
      const workout = selectedWeekWorkouts[i];

      if (workout.extendedProps.completedID === undefined) {
          closestWorkout = selectedWeekWorkouts[i];
          break;
      }
    }

    var completedWorkouts = 0;
    // Iterate over the selected week's workouts

    selectedWeekWorkouts.forEach((workout, index) => {

      currentDay = moment(workout.start);
      if (i < workouts.length - 1) {
          nextDay = moment(workout.start);
      }

       // Check if the current workout and the next workout are on the same day
       if (currentDay.isSame(nextDay) || isSameDay) {
        isSameDay = true;
        // If the current div is not set or different from the new div date, create a new div
        if (!currentDiv || !currentDiv.dataset.date || currentDiv.dataset.date !== currentDay.format("YYYY-MM-DD")) {

          currentDiv = document.createElement('div');
          taskCounter = 0;

          currentDiv.style.width = "100%";
          currentDiv.id = "workoutDay";

          currentDiv.dataset.date = currentDay.format("YYYY-MM-DD"); // Set dataset to track date

          const daytext = document.createElement('div');
          daytext.innerText = `Day ${count}`; 

          daytext.classList.add("workout-day")
          daytext.style.display = "block";

          currentDiv.appendChild(daytext);
          workoutList.appendChild(currentDiv);
          count += 1;
        } 
      } else {
        isSameDay = false;
        // Update currentDiv for next day's workouts
        currentDiv = null;
      }
      
      // Get the workout element based on the workout ID
      var workoutElement = null;
      var foundIndex = "";
      var workoutIndex = 0;
      
      for(var i = 0; i < workoutListWorkouts.length; i++) {

        const workoutListElement = workoutListWorkouts[i].querySelector("#workoutID");
        workoutIndex = workoutListWorkouts[i].querySelector("#workoutIndex").innerText;

        if(workoutListElement.innerText == workout.extendedProps.workoutID) {
          foundIndex = i;
          workoutElement = workoutListElement;
          break;
        }

      }

      if (workoutElement && workoutElement.textContent === workout.extendedProps.workoutID) {

        var newElement = workoutElement.closest('.workoutprogramitem').cloneNode(true);

        workoutList.appendChild(newElement);
        //Check if the workout is complete
        if(workout.extendedProps.completedID != undefined || (lastCompletedWorkout && (lastCompletedWorkout == workout.extendedProps.uniqueWorkoutID))) {
          completedWorkouts += 1;
          newElement.querySelector("#workoutStatus").classList.remove("not-started");
          newElement.querySelector("#workoutStatus").classList.add("finished");
          newElement.querySelector("#workoutStatus").innerText = "Finished";
        } else if(localStorage.getItem("startedWorkout") == workout.extendedProps.uniqueWorkoutID || workout === closestWorkout) { //Next workout
          newElement.querySelector("#workoutStatus").classList.add("not-started-current-workout");

          if(localStorage.getItem("startedWorkout") == workout.extendedProps.uniqueWorkoutID ) {
            newElement.querySelector("#workoutStatus").classList.remove("not-started");
            newElement.querySelector("#workoutStatus").classList.add("in-progress");
            newElement.querySelector("#workoutStatus").innerText = "In Progress";
          } 

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

    // Get the current workout element
    var currentWorkout = document.querySelector('.not-started-current-workout');
  
    // Check if the current workout element is not already the first element
    if (currentWorkout ) {

      currentWorkout = currentWorkout.closest(".workoutprogramitem");

      if(!currentWorkout.previousElementSibling.innerText.toLowerCase().includes("day 1") && !currentWorkout.previousElementSibling.innerText.toLowerCase().includes("monday")) {

        window.scrollTo({
          top: currentWorkout.offsetTop - 100,
          behavior: 'smooth' 
        });

      }

      currentWorkout.previousElementSibling.querySelector(".workout-day").style.color = "#0C08D5";

      while(currentWorkout.previousElementSibling.previousElementSibling) {
        currentWorkout = currentWorkout.previousElementSibling.previousElementSibling;
        currentWorkout.previousElementSibling.querySelector(".workout-day").style.color = "#000000";
        if(currentWorkout.querySelectorAll("#workoutHeading").length > 1) {
          currentWorkout.querySelectorAll("#workoutHeading")[0].style.color = "#000000";
          currentWorkout.querySelectorAll("#workoutHeading")[1].style.color = "#000000";
        }

      }

    }

  }


  

}



