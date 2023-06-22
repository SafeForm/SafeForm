if (document.readyState !== 'loading') {
  main();
} else {
  document.addEventListener('DOMContentLoaded', function () {
      main();
  });
}

function main() {
//

  //Add utm to buttons
  // document.getElementById("exerciseLibrary").href += "?utm_campaign=safeform fitness - haymarket";
  // document.getElementById("workouts").href += "?utm_campaign=safeform fitness - haymarket";
  // document.getElementById("home").href += "?utm_campaign=safeform fitness - haymarket";

  /*
  // Add buttons to horizontal div based on number of weeks
  var numWeeks = document.getElementById("programWeeks").innerText;
  //numWeeks = 20;
  var currentProgramWeek = 1;
  var weekButton = document.getElementById("week-1");
  
  var parentDiv = document.getElementById("weekParentDiv");
  
  for (var i = 0; i < numWeeks; i++) {
      var newButton = weekButton.cloneNode(true);
      newButton.innerText = `Week ${i+1}`;
      // Apply styling based on completion and current week status
      newButton.id = `week-${i+1}`;
      if (i+1 < currentProgramWeek) {
        weekButton.classList.remove('current-week');
        newButton.classList.add('complete-week');
      } else if (i+1 == currentProgramWeek) {
        newButton.classList.add('current-week');
      } else {
        weekButton.classList.remove('current-week');
        newButton.classList.add('future-week');
      }

      parentDiv.appendChild(newButton);
  }
  //Remove original placeholder button
  weekButton.remove();

  // Style the first element:
  if (currentProgramWeek > 1) {
    weekButton.classList.remove('current-week');
    weekButton.classList.add('complete-week');
  }

  */

  //Add week buttons to paginate through workout, based on number of workouts
  //var numWeeks = document.getElementById("programWeeks").innerText;
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

  const workouts = JSON.parse(document.getElementById("programEventData").innerText);

  // Sort the workouts array based on the 'Start Date' field
  workouts.sort((a, b) => {
    const dateA = moment(a['start']);
    const dateB = moment(b['start']);
    return dateA - dateB;
  });
  
  const weeks = [];
  let currentWeek = [];
  
  for (const workout of workouts) {
    const startDate = moment(workout['start']);

    let endOfWeek = null;
    
    // Get end of week for current array
    if (currentWeek.length > 0) {
      endOfWeek = getEndOfWeek(currentWeek[0]['start']);
    }
  
    if (currentWeek.length === 0 || startDate.isSameOrBefore(moment(endOfWeek))) {
      console.log()
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
    button.addEventListener('click', (event) => {
      displayWorkouts(index, workoutList, workoutListWorkouts, weeks);
      $('#weekParentDiv .w-button').removeClass('current-week').addClass("week-button");
      event.target.classList.remove("week-button");
      event.target.classList.add("current-week");
    });
  });

  weekButton = document.getElementById("week-1");

  weekButton.click();

/*
  
  window.addEventListener('load', (event) => {
    MemberStack.onReady.then(async function(member) {  

      // Only allow the page if user is logged in
      if(member.loggedIn === false) {
        window.location = "https://safeform.app/user-sign-in";
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

    // Iterate over the selected week's workouts
    selectedWeekWorkouts.forEach((workout) => {
      // Get the workout element based on the workout ID
      var workoutElement = null;
      for(var i = 0; i < workoutListWorkouts.length; i++) {

        const workoutListElement = workoutListWorkouts[i].querySelector("#workoutID");
        if(workoutListElement.innerText == workout.extendedProps.workoutID ) {
          workoutElement = workoutListElement;
        }
      }
      if (workoutElement && workoutElement.textContent === workout.extendedProps.workoutID) {

        var newElement = workoutElement.closest('.collection-item-7').cloneNode(true);
        console.log(newElement)
        workoutList.appendChild(newElement);

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
