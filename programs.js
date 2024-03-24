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

  moment.updateLocale('en', {
    week: {
      dow: 1, // Monday
    },
  });

  //Loop through all list items and assign href to each workout
  const programWorkoutList = document.getElementById("programWorkoutList").children;

  for (var i = 0; i < programWorkoutList.length; i++) {
    //Get link from workout summary information and set thumbnail link
    var workoutSummaryLink = programWorkoutList[i].querySelector("#svgPersonLink");
    workoutSummaryLink.href += "?fromFreeProgram=true";
    programWorkoutList[i].querySelector("#thumbnailLink").href = workoutSummaryLink.href;
    programWorkoutList[i].querySelector("#workoutSummaryLink").href = workoutSummaryLink.href;

  }

  document.addEventListener('click', function(event) {

    if(event.target.id == "buyNowModal") {
      document.getElementById("buyNowModal").style.display = "none";
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

    if(moment(programs[i].start).isSameOrBefore(endOfProgramWeek)) {
      workouts.push(programs[i]);
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

    const buttons = document.querySelectorAll('a[id^="week-"]');
    const workoutListWorkouts = document.getElementById('programWorkoutList').cloneNode(true).children;
    const workoutList = document.getElementById('programWorkoutList');

    // Add event listeners to the buttons
    buttons.forEach((button, index) => {
      button.addEventListener('click', (event) => {

        if(index == 0) {
          //displayWorkouts(index, workoutList, workoutListWorkouts, workouts);
          addWorkoutsToList(workoutList, workoutListWorkouts, workouts);

          $('#weekParentDiv .w-button').removeClass('current-week').addClass("week-button");
          event.target.classList.remove("week-button");
          event.target.classList.add("current-week");
  
          //Set current week number again
          sessionStorage.setItem("currentWeekNumber", event.target.innerText.split(" ")[1])
        } else {
          document.getElementById("buyNowModal").style.display = "flex";
        }

      });
    });

    weekButton = document.getElementById("week-1");
    weekButton.click();
    sessionStorage.setItem("currentWeekNumber", thisWeek)
    
  } else {
    document.getElementById("guideListParent").style.display = "none";
    document.getElementById("workout-empty-state").style.display = "flex";
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

  function addWorkoutsToList(workoutList, workoutListWorkouts, workouts) {
    
    if(workoutListWorkouts.length > 0) {

      // Clear the current workout list
      workoutList.innerHTML = '';
      for(var i = 0; i < workouts.length; i++) { 

        //Find matching workout element
        for(var j = 0; j < workoutListWorkouts.length; j++) {
          if(workoutListWorkouts[j].querySelector("#workoutID").innerText == workouts[i].extendedProps.workoutID) {
            workoutList.appendChild(workoutListWorkouts[j]);
            break;
          }
        }
      }
    }
    
  }
  

}



