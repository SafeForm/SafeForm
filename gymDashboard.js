if (document.readyState !== 'loading') {
  const item = localStorage.getItem('nonExistentItem');
  if(item === null) {
    main();
  }
} else {
  document.addEventListener('DOMContentLoaded', function () {
    const item = localStorage.getItem('nonExistentItem');
    if(item === null) {
      main();
    }
  });
}

function main() {

  //document.getElementsByClassName("form-block-20")[0].style.display = "block";
  //document.getElementById("userPage").style.display = "flex";
  //document.getElementById("workoutsPage").click();

  var muscleMapping = {
    "pectoralis-major":"Chest",
    "quadriceps":"Quads",
    "rectus-abdominis":"Abs",
    "biceps-brachii":"Biceps",
    "triceps-brachii":"Triceps",
    "deltoids":"Shoulders",
    "obliques":"Obliques",
    "trapezius":"Traps",
    "latissimus-dorsi":"Lats",
    "palmaris-longus":"Forearms",
    "gluteus-maximus":"Glutes",
    "hamstrings":"Hamstrings",
    "gastrocnemius":"Calves",
    "erector-spinae":"Lower Back"
  }

  //Flag for checking if radio button was human clicked or programmatic
  var isProgrammaticClick = false;
  var isPasteState = false;
  var isEventPasteState = false;
  var setFromPaste = false;
  var clickedCopyButton = "";
  var clickedEventCopyButton = "";
  var workoutRadioClicked = false;
  var summaryRadioClicked = false;
  var userProgramEvents = null;
  var userProgramWorkoutID = "";
  var addProgram = false;
  
    
  //Object to keep track of the guide -> exercise workout mapping
  //Object with guide ID as the key and array of guide divs as values
  var guideToWorkoutObj = {};

  //Populate gym name text box value
  document.getElementById("gymNameTextBox").value = document.getElementById("gymFullName").innerText;

  /*
    Splitting up if there is multiple gym & muscle values to make sure we are filtering each
  */
  //Iterate through list
  var exerciseList = document.querySelectorAll("#exerciseInfoDiv");

  for(let i = 0; i < exerciseList.length; i++) {
    
    //Obtain the gym text field
    var gymElement = exerciseList[i].querySelector("#gymField");
    var muscleElement = exerciseList[i].querySelector("#scientificPrimaryMuscle");

    if (gymElement) {
      
      //Split the gym field by comma
      var gymElementArr = gymElement.innerText.split(',');
      
      //Obtain the original dv
      var exerciseInfoDiv = exerciseList[i];

      if (gymElementArr.length > 1) {
        //Clone the gym text field and split it into their own text block
        cloneAndAddElement(gymElementArr, gymElement, exerciseInfoDiv, "div", "gymField", "gymfilter");
      }
    }
    
    if (muscleElement) {
    
      //Split the muscle field by comma
      var muscleElementArr = muscleElement.innerText.split(',');
      
      //Obtain the original div
      var exerciseInfoDiv = exerciseList[i];

      if (muscleElementArr.length > 1) {
        //Clone the muscle text field and split it into their own text block
        cloneAndAddElement(muscleElementArr, muscleElement, exerciseInfoDiv, "div", "scientificPrimaryMuscle", "muscleNameFilter");
      }
    }
  }


  function cloneAndAddElement(valueArr, elementToClone, containerElement, tagElement, newID, customID=null) {

    var parentElement = elementToClone.parentElement;

    //Iterate through array and create eleme
    //Then append to container div
    for(let i = 0; i < valueArr.length; i++) {
      
      if (tagElement != "div") {
        var clonedElement = parentElement.cloneNode(true);
      } else {
        var clonedElement = elementToClone.cloneNode(true);
      }
      
      clonedElement.id = `${newID}`;
      customID ? clonedElement.setAttribute('fs-cmsfilter-field', customID) : null;
      if(tagElement == "div") {
        clonedElement.innerText = valueArr[i].trim();
      } else {
        clonedElement.querySelector(tagElement).innerText = valueArr[i].trim();
      }
      
      containerElement.append(clonedElement);

    }
    
    //Remove original parent
    elementToClone.remove();

  }

  //Add workout
  //Setting onclick events for adding guides to workout
  var guideExercises = document.querySelectorAll("#individualGuide");

    for (let i = 0; i < guideExercises.length; i++) {
      
      guideExercises[i].onclick = (event) => {
        //Make sure when info button is clicked the exercise isnt added to the list
        if(event.target.id != "guideLinkInfo" && event.target.id != "guideLinkInfoImage") {
          var copyOfGuide = '';
          copyOfGuide = guideExercises[i].cloneNode(true);
    
          //Remove info button
          copyOfGuide.querySelector("#guideLinkInfo").remove();
    
          //Copy thumbnail and svg person into a separate div
          var exerciseThumbnail = $(copyOfGuide).find("#exerciseThumbnail").detach();
          var svgPersonDiv = $(copyOfGuide).find("#exerciseInfoRight").detach();

          //Change ID of exercise name
          copyOfGuide.querySelector("#guideName").id = "workoutExercisename";
    
          //Ensure copy border colour is SF blue
          copyOfGuide.style.borderColor = "rgb(12, 8, 213)";
          addExerciseToWorkoutList(copyOfGuide, null, null, exerciseThumbnail, svgPersonDiv);

          createWorkoutListEntry(copyOfGuide.querySelector("#itemID").innerText, guideExercises[i]);

        }

      }

    }

    function addExerciseToWorkoutList(copyOfGuide, exerciseInformation=null, prefill=null, thumbnail=null, svgPerson=null, programWorkout= false) {

      //Get current guide and add to workout list
      var workoutList = "";
      if(!programWorkout) {
        workoutList = document.getElementById("workoutList");
      } else {
        workoutList = document.getElementById("programWorkoutList");
      }

      const workoutItemTemplate = workoutList.querySelector("ul > li:first-child");
      
      var workoutItem = workoutItemTemplate.cloneNode(true);

      //Add set rep info into guide template
      const setRepInfo = workoutItem.querySelector("#setRepInfo").cloneNode(true);
      copyOfGuide.append(setRepInfo);
  
      //Add workout Exercise ID and Name into guide template as well
      var workoutExerciseItemID = workoutItem.querySelector("#workoutExerciseItemID").cloneNode(true);
      copyOfGuide.append(workoutExerciseItemID);
  
      var workoutExerciseFullName = workoutItem.querySelector("#workoutExerciseFullName").cloneNode(true);
      copyOfGuide.append(workoutExerciseFullName);
  
      //Add guide to workout exercise template
      workoutItem.querySelector("#guidePlaceHolder").append(copyOfGuide);
      //If extra information is provided fill in fields
      if(exerciseInformation != null) {
        if(!programWorkout) {
          
          setRepInfo.querySelector("#reps").value = exerciseInformation.exerciseReps;
          setRepInfo.querySelector("#sets").value = exerciseInformation.exerciseSets;
          setRepInfo.querySelector("#exerciseRestMinutes").value = exerciseInformation.exerciseRestMins;
          setRepInfo.querySelector("#exerciseRestSeconds").value = exerciseInformation.exerciseRestSecs;
        } else {
          setRepInfo.querySelector("#reps").innerText = exerciseInformation.exerciseReps;
          setRepInfo.querySelector("#sets").innerText = exerciseInformation.exerciseSets;
          setRepInfo.querySelector("#exerciseRestMinutes").innerText = exerciseInformation.exerciseRestMins;
          setRepInfo.querySelector("#exerciseRestSeconds").innerText = exerciseInformation.exerciseRestSecs;
        }

        if(!programWorkout) {
          workoutItem.querySelector("#restBetweenExerciseMinutes").value = exerciseInformation.exerciseRestBetweenMins;
          workoutItem.querySelector("#restBetweenExerciseSeconds").value = exerciseInformation.exerciseRestBetweenSecs;
        }
        workoutExerciseItemID.innerText = exerciseInformation.exerciseItemID;
        workoutExerciseFullName.innerText = exerciseInformation.exerciseFullName;
  
      }
      
      //Remove link to guide:
      copyOfGuide.href = "#";
      
      //Remove old template items
      workoutItem.querySelector("#setRepInfo").remove();
      workoutItem.querySelector("#workoutExerciseFullName").remove();
      workoutItem.querySelector("#workoutExerciseItemID").remove();
  
      //Make svg person smaller
      svgPerson[0].style.width = "80%";
      thumbnail[0].style.width = "100%";
    
      //Add thumbnail and svg person to hover div
      $(workoutItem).find("#thumbnailAndMuscleDiv").append(thumbnail);
      $(workoutItem).find("#thumbnailAndMuscleDiv").append(svgPerson);
      
      workoutItem.style.display = "block";
      
      //Reduce headers font size:
      workoutItem.querySelector("#workoutExercisename").style.fontSize = "16px";
      workoutItem.querySelector("#exerciseDifficultyParent").style.display = "none";
  
      //Add to 'workouts' list
      workoutList.appendChild(workoutItem);
      //Scroll list to bottom to show user
      //Ensure when user is editing workout it does not scroll initially
      if (sessionStorage.getItem("viewingEditFirstTime") == "false" && !prefill) {
        workoutList.scrollIntoView({behavior: "smooth", block: "end"});
      } else {
        sessionStorage.setItem("viewingEditFirstTime", 'false');
      }
      
      //Check if experience label needs to be updated i.e intermediate or advanced
      const exerciseDifficulty = workoutItem.querySelector("#exerciseDifficulty").innerText;
      var currentDifficulty = document.getElementById("experience");
  
      if (currentDifficulty.innerText != "Advanced" && exerciseDifficulty == "Intermediate") {
        currentDifficulty.innerText = "Intermediate";
      } else if(exerciseDifficulty == "Advanced") {
        currentDifficulty.innerText = "Advanced";
      }
      
      const listLength = workoutList.childNodes.length;
  
      //Ensure required fields are set as required
      if(listLength >= 2) {
        workoutItem.querySelector("#reps").setAttribute("required", "");
        workoutItem.querySelector("#sets").setAttribute("required", "");
        workoutItem.querySelector("#exerciseRestMinutes").setAttribute("required", "");
        workoutItem.querySelector("#exerciseRestSeconds").setAttribute("required", "");
        if(listLength >= 3 && !programWorkout) {
          workoutItem.querySelector("#restBetweenExerciseMinutes").setAttribute("required", "");
          workoutItem.querySelector("#restBetweenExerciseSeconds").setAttribute("required", "");
        }
      }
      
      const saveWorkout = document.getElementById("saveWorkout");
      if (sessionStorage.getItem("editWorkout")) {
        saveWorkout.value = "Save Changes";
      }
  
      //Hiding and showing move icons and break icon between exercises
      if(listLength == 2) {
        if(!programWorkout) {
          workoutItem.querySelector("#moveDown").style.display = "none";
        }
        saveWorkout.style.display = "none";
        document.getElementById("firstExercisePlaceholder").style.display = "none";
      } else if(listLength == 3) {
        if(!programWorkout) {
          workoutItem.querySelector("#moveDown").style.display = "none";
          workoutItem.querySelector("#moveUp").style.display = "block";
          workoutItem.previousSibling.querySelector("#moveDown").style.display = "block";
        }
        workoutItem.querySelector("#exerciseBreaker").style.display = "block";
        
        saveWorkout.style.display = "block";
      } else if(listLength > 3) {
        if(!programWorkout) {
          workoutItem.previousSibling.querySelector("#moveDown").style.display = "block";
          workoutItem.previousSibling.querySelector("#moveUp").style.display = "block";
          workoutItem.querySelector("#moveDown").style.display = "none";
          workoutItem.querySelector("#moveUp").style.display = "block";
        }
        workoutItem.querySelector("#exerciseBreaker").style.display = "block";

        saveWorkout.style.display = "block";
      }
  
    }

    function createWorkoutListEntry(workoutExerciseID, guideExercise) {

      const exerciseObj = {};
      exerciseObj[workoutExerciseID] = guideExercise

      //Check if guide is already in list, if it as add to array, if it is not then create new array entry
      if (guideToWorkoutObj[workoutExerciseID] != null) {
        guideToWorkoutObj[workoutExerciseID].push(guideExercise);
      } else {
        guideToWorkoutObj[workoutExerciseID] = [];
        guideToWorkoutObj[workoutExerciseID].push(guideExercise);
      }
      guideExercise.style.borderColor = "rgb(8, 213, 139)";
    }

  /*
    - Check if specified parameters are in URL from workout builder submitting to show appropriate page
  */
  url = new URL(window.location.href.replace("#",""));

  if (url.searchParams.has('showPage')) {
    var showPage = url.searchParams.get('showPage');
    //Hide and show necessary pages
    document.getElementById("equipmentBody").style.display = "none";
    document.getElementById("workoutSummaryPage").style.display = "block";
  }

  window.addEventListener('load', (event) => {
    //Start workouts button clicked
    document.getElementById("workoutRadio").click();
    checkProgramWorkoutCheckBox();

    document.getElementById("summaryRadioButton").click();
    checkSummaryTrainingCheckBox();

    MemberStack.onReady.then(function(member) {  
      var membership = member.membership  
      var memberID = member["id"];
      var equipmentStatus = member["equipment-upload-complete"];

      const baseURL = window.location.origin;
      //set link to dashboard page
      const path = window.location.pathname;

      const urlID = path.split("/")[2];	

      if(equipmentStatus == "complete") {
        const equipmentBody = document.getElementById("equipmentBody");
        const dashboardBody = document.getElementById("dashboardBody");
        const settingsBody = document.getElementById("settingsBody");
        const usersBody = document.getElementById("usersBody");
        const userDetailDiv = document.getElementById("userDetailsPage");

        document.getElementById("equipmentListContainer").style.display = 'block';
        document.getElementById("equipmentPage").onclick = function() {
          //equipmentBody.style.display = "block";
          dashboardBody.style.display = "none";
          settingsBody.style.display = "none";
          //workoutBuilderPage.style.display = "none";
          //Reset filters on workout or program summary page
          if(sessionStorage.getItem("editProgram") == "true" || sessionStorage.getItem("createProgram") == "true" || sessionStorage.getItem("duplicateProgram") == "true" || sessionStorage.getItem("createUserProgram") == "true" ) {
            checkAndClearProgram("equipmentBody");
          } else {
            checkAndClearWorkouts("equipmentBody");
          }
          
        };

        document.getElementById("userPage").onclick = function() {
          //equipmentBody.style.display = "block";
          dashboardBody.style.display = "none";
          settingsBody.style.display = "none";
          equipmentBody.style.display = "none";
          //workoutBuilderPage.style.display = "none";
          //Reset filters on workout or program summary page
          if(sessionStorage.getItem("editProgram") == "true" || sessionStorage.getItem("createProgram") == "true" || sessionStorage.getItem("duplicateProgram")== "true" || sessionStorage.getItem("createUserProgram") == "true") {
            checkAndClearProgram("usersBody", "userSummaryPage");
          } else {
            checkAndClearWorkouts("usersBody", "userSummaryPage");
          }
          
        };

        document.getElementById("dashboardPage").onclick = function() {
          //dashboardBody.style.display = "block";
          equipmentBody.style.display = "none";
          settingsBody.style.display = "none";
          //workoutBuilderPage.style.display = "none";
          //Reset filters on workout summary page
          
          if(sessionStorage.getItem("editProgram") == "true" || sessionStorage.getItem("createProgram") == "true" || sessionStorage.getItem("duplicateProgram") == "true" || sessionStorage.getItem("createUserProgram") == "true") {
            checkAndClearProgram("dashboardBody");
          } else {
            checkAndClearWorkouts("dashboardBody");
          }
        };

        document.getElementById("settingsPage").onclick = function() {
          //settingsBody.style.display = "block";
          equipmentBody.style.display = "none";
          dashboardBody.style.display = "none";
          //workoutBuilderPage.style.display = "none";
          //Reset filters on workout summary page
          
          if(sessionStorage.getItem("editProgram") == "true" || sessionStorage.getItem("createProgram") == "true" || sessionStorage.getItem("duplicateProgram")== "true" || sessionStorage.getItem("createUserProgram") == "true") {
            checkAndClearProgram("settingsBody");
          } else {
            checkAndClearWorkouts("settingsBody");
          }
        };
        
        document.getElementById("workoutsPage").onclick = function() {
          //Reset filters on workout summary page
          //workoutSummaryPage.style.display = "block";
          //workoutBuilderPage.style.display = "none";
          settingsBody.style.display = "none";
          equipmentBody.style.display = "none";
          dashboardBody.style.display = "none";
          // Check if there are any exercises in the list 
          // If there is, prompt user to confirm removing list 

          // If they confirm remove items from list and clear filters and hide exercise list
          
          if(sessionStorage.getItem("editProgram") == "true" || sessionStorage.getItem("createProgram") == "true" || sessionStorage.getItem("duplicateProgram")== "true" || sessionStorage.getItem("createUserProgram") == "true") {
            checkAndClearProgram("workoutSummaryPage");
          } else {
            checkAndClearWorkouts("workoutSummaryPage");
          }

        };

      } else if(equipmentStatus == "skipped") {
        var gymName = member["gym-name"];
        var gymLocation = member["gym-location"];
        var dashboardID = member["webflow-dashboard-id"];
        var equipmentID = member["webflow-equipment-id"];
        var email = member["email"];
        var hashedGym = "";
        
        const prefillParameters = `?prefill_Location=${gymLocation}&hide_Location=true&prefill_GymNameHash=${hashedGym}&hide_GymNameHash=true&prefill_Account+Name=${gymName}&hide_Account+Name=true&prefill_Memberstack+ID=${memberID}&hide_Memberstack+ID=true&prefill_Dashboard+ID=${dashboardID}&hide_Dashboard+ID=true&prefill_Equipment+ID=${equipmentID}&hide_Equipment+ID=true&prefill_Site+Email=${email}&hide_Site+Email=true`
        const airtableForm = "https://airtable.com/shr6SXGXG0eqbfeJV" + prefillParameters;
        
        const upload = document.getElementById("uploadList");
        upload.href = airtableForm;

        //Show upload content
        document.getElementById("equipmentUploadDiv").style.display = "block";
      }
      
      else {
        document.getElementById("equipmentListContainer").style.display = 'none';
        document.getElementById("notUploaded").style.display = "block";
      }

    })

    var selectedDate = "";
    var currentNumberOfWeeks = 4;
  
    var calendarEl = document.getElementById('calendar');
    
    var calendar = new FullCalendar.Calendar(calendarEl, {
      // Your calendar options here
      initialView: 'dayGridFourWeek',
      contentHeight: "90%",
      duration: { weeks: currentNumberOfWeeks},
      views: {
        dayGridFourWeek: {
          dayHeaderContent: function(info) {
            return info.date.getDate() - 3; // Display day number
          },
          type: 'dayGrid',
        }
      },
      editable: true,
      dayCellContent: function(info) {
        // Return an empty string to hide the date of the month
        return '';
      },
      headerToolbar: {
        left: '',
        right: '',
      },
      dateClick: function(info) {
        // Do something when the user clicks on a date

        //Don't show workout modal if user is in paste state or delete / copy button is pressed
        if(!(isPasteState || isEventPasteState) && info.jsEvent.target.tagName != "IMG") {

          //Check if day already has date in it
          var clickedDay = info.dayEl; // Get the DOM element of the clicked day
          var hasEventHarness = clickedDay.querySelector('.fc-daygrid-event-harness') !== null;
      
          if (!hasEventHarness) {
            selectedDate = info.dateStr;
    
            //Show workouts modal
            showModal("workoutsList");

          }
        } else if (setFromPaste) {
          isPasteState = false;
          isEventPasteState = false;
          setFromPaste = false;
        }

      },
      eventDidMount: function(info) {
        var eventEl = info.el;
        var eventElParent = eventEl.closest(".fc-daygrid-day-frame");

        // Create a copy and delete button element
        var deleteButtonEl = document.createElement('button');
        var copyButtonEl = document.createElement('button');

        copyButtonEl.className = 'copy-event-button';
        deleteButtonEl.className = 'delete-event-button';

        var originalCellDay = "";
        var originalCell = "";

        // Create an image element for the delete button
        var deleteImageEl = document.createElement('img');
        deleteImageEl.src = 'https://uploads-ssl.webflow.com/622f1b68bc1e4510618e0b04/6461eb594bc9d89c2d285060_trashIcon.webp';

        // Create an image element for the delete button
        var copyImageEl = document.createElement('img');
        copyImageEl.src = 'https://uploads-ssl.webflow.com/622f1b68bc1e4510618e0b04/646ddea577e978678ad7eecb_copyButtonNew.webp';
      
        // Append the image element to the delete button
        deleteButtonEl.appendChild(deleteImageEl);
        copyButtonEl.appendChild(copyImageEl);

        // Append the delete button to the event element
        eventElParent.appendChild(deleteButtonEl);

        eventElParent.appendChild(copyButtonEl);
      
        // Add a hover event listener to show/hide the delete button
        eventElParent.addEventListener('mouseenter', function() {
          copyButtonEl.style.display = 'block';
          deleteButtonEl.style.display = 'block';
        });
      
        eventElParent.addEventListener('mouseleave', function(event) {

          //Get date of hovered date 
          var hoveredEventDate = new Date(event.target.closest('.fc-daygrid-day-frame').parentElement.getAttribute("data-date"));
          if(sessionStorage.getItem('copiedEvent')) {
            var copiedEventDate = new Date(JSON.parse(sessionStorage.getItem('copiedEvent')).start);
          }
          
          hoveredEventDate.setHours(hoveredEventDate.getHours() - 10);

          if(isEventPasteState && (hoveredEventDate.getTime() == copiedEventDate.getTime())) {
            copyButtonEl.style.display = 'block';
            deleteButtonEl.style.display = 'block';
          } else {
            copyButtonEl.style.display = 'none';
            deleteButtonEl.style.display = 'none';
          }

        });
      
        // Add a click event listener to remove the event
        deleteImageEl.addEventListener('click', function(event) {
          event.stopPropagation(); // Prevent event propagation to the parent elements

          //Remove copy, delete buttons and event
          event.target.parentElement.nextElementSibling.remove();
          info.event.remove();
          event.target.remove();
        });

        // Add a click event listener to copy the event
        copyImageEl.addEventListener('click', function(event) {

          event.stopPropagation(); // Prevent event propagation to the parent elements

          //Save the copy button
          clickedEventCopyButton = event.target;

          //Set image to pressed state
          copyImageEl.src = "https://uploads-ssl.webflow.com/622f1b68bc1e4510618e0b04/646ddeb5b0ba0c6aee88f383_copyPressedNew.webp";
          // Get the event details
          var eventDetails = {
            allDay: info.event.allDay,
            extendedProps: {
              length: info.event.extendedProps.length,
              targetArea: info.event.extendedProps.targetArea,
              workoutID: info.event.extendedProps.workoutID
            },
            start: info.event.start,
            title: info.event.title
          };

          sessionStorage.setItem('copiedEvent', JSON.stringify(eventDetails));
          isEventPasteState = true;
        });
        
        // Add event listeners for event drag start and stop
        calendar.on('eventDragStart', function(info) {
          // Get the original date cell
          originalCell = info.jsEvent.target;
          originalCell = originalCell.closest('.fc-daygrid-day-frame');
          originalCellDay = info.event._instance.range.start;
        });

        calendar.on('eventDrop', function(info) {

          var stoppedEventDay = info.event._instance.range.start;

          if(originalCell) {
            // Find the corresponding delete button element in the original cell
            var originalDeleteButtonEl = originalCell.querySelector(".delete-event-button");
            var originalCopyButtonEl = originalCell.querySelector(".copy-event-button");
            // Remove the delete button from the original cell
            if ((originalDeleteButtonEl && originalCopyButtonEl) && stoppedEventDay != originalCellDay) {
              originalDeleteButtonEl.remove();
              originalCopyButtonEl.remove()
            }
          }

        });

        return eventEl;
      },

      eventContent: function(info) {

        var targetArea = info.event.extendedProps.targetArea;
        var duration = info.event.extendedProps.length;

        return {
          html: '<div class="fc-content">' +
                  '<div class="fc-title">' + info.event.title + '</div>' +
                  '<div class="fc-details">' + targetArea + '<br>' + duration + '</div>' +
                '</div>',
        };
      },
      viewDidMount: function(view) {
        var index = 0;
        $(view.el).find('[role=row]').each(function() {
          if (index == 0) {
            $(this).prepend("<div/>");
          } else {
            var rowIndex = $(this).index() + 1; // Get the index of the row and add 1 to make it 1-based
      
            // Get the day of the first day in the week
            var firstDay = $(this).find('[data-date]').first().attr('data-date');
            var startDate = new Date(firstDay);
      
            // Get the day of the last day in the week
            var lastDay = $(this).find('[data-date]').last().attr('data-date');
            var endDate = new Date(lastDay);
      
            // Format the start and end dates
            var formattedStartDate = startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            var formattedEndDate = endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      
            // Construct the week range string
            var weekRange = formattedStartDate + ' - ' + formattedEndDate;
      
            var copyButtonHtml = '<img class="copy-events-button" src="https://uploads-ssl.webflow.com/622f1b68bc1e4510618e0b04/646ddea577e978678ad7eecb_copyButtonNew.webp" alt="Copy" title="Copy Week">';
            var deleteButtonHtml = '<img class="delete-events-button" src="https://uploads-ssl.webflow.com/622f1b68bc1e4510618e0b04/646c9d5cd44c1433f46e0a1e_deleteWeek.webp" alt="Delete" title="Delete Week">';
      
            var currentDate = new Date(); // Get the current date
            var isInWeekRange = currentDate >= startDate && currentDate <= endDate;
      
            var weekRangeHtml = '<div class="week-range' + (isInWeekRange ? ' current-week-range' : '') + '">' + weekRange + '</div>';
            var weekInfoHtml = '<div class="week-info">' + '<div>' + rowIndex + '</div>' + copyButtonHtml + deleteButtonHtml + '</div>';
            var buttonsContainerHtml = '<div class="buttons-container">' + weekRangeHtml + weekInfoHtml + '</div>';
            $(this).prepend(buttonsContainerHtml);
          }
      
          index++;
        });
      },
      
    });
    
    calendar.render();

    //Get all program summaries and set onclicks
    var programList = document.querySelectorAll("#programSummary");
    for(let i = 0; i < programList.length; i++) {
      (function(program) {
        program.onclick = () => {
          //Prefill program screen
          prefillProgramBuilder(program);

          //Set edit program flag
          sessionStorage.setItem("editProgram", 'true');

        }
      })(programList[i]);
    }

    //Get all program summaries and set onclicks
    var programList = document.querySelectorAll("#programSummary");
    for(let i = 0; i < programList.length; i++) {
      (function(program) {
        program.onclick = () => {
          //Prefill program screen
          prefillProgramBuilder(program);

          //Set edit program flag
          sessionStorage.setItem("editProgram", 'true');

        }
      })(programList[i]);
    }
    //Set onclicks for all workouts
    var programWorkouts = document.querySelectorAll("#workoutSummaryProgram");
    var mainWorkoutList = document.getElementById("workoutSummaryList").children;

    var desiredDate = "";
    var newEvent = "";

    for(var i = 0; i < programWorkouts.length; i++) {
      (function(workout) {
        workout.onclick = () => {

          //Remove if any workouts exist
          clearWorkoutExerciseList(true);
          //Get workout ID:
          var programWorkoutID = workout.querySelector("#workoutIDProgram").innerText;

          //List workout summary list and find matching workout id
          for(var j = 0; j < mainWorkoutList.length; j++) {
          
            if(mainWorkoutList[j].querySelector("#workoutID").innerText == programWorkoutID) {
              //Populate select workout side bar
              var selectedWorkout = getWorkoutExerciseInformation(mainWorkoutList[j], true)

              document.getElementById("selectedWorkoutName").innerText = selectedWorkout.workoutName;
              document.getElementById("selectedWorkoutDescription").innerText = selectedWorkout.workoutSummaryDescription;
              document.getElementById("selectedWorkoutDuration").innerText = selectedWorkout.workoutDuration;
              document.getElementById("selectedWorkoutFocusArea").innerText = selectedWorkout.workoutFocusArea;
              document.getElementById("selectedWorkoutExperience").innerText = selectedWorkout.workoutDifficulty;

              //Now populate exercises
              prefillWorkoutBuilder(selectedWorkout, true)

              //Hide placeholder
              document.getElementById("selectWorkoutPlaceholder").style.display = "none";

              //Show workoutProgramSummary
              var workoutProgramSummary = document.getElementById("workoutProgramSummary");
              workoutProgramSummary.style.display = "flex";
              workoutProgramSummary.style.flexDirection = "column";
              workoutProgramSummary.style.justifyContent = "center";
              workoutProgramSummary.style.alignItems = "center";
  
            }
          }

          //Create event and add to calendar
          desiredDate = new Date(selectedDate);
    
          // Create a new event object with the desired date
          newEvent = {
            title: selectedWorkout.workoutName,
            details: selectedWorkout.workoutFocusArea,
            extendedProps: {
              targetArea: selectedWorkout.workoutFocusArea,
              length: selectedWorkout.workoutDuration,
              workoutID: selectedWorkout.workoutSummaryID,
              difficulty: selectedWorkout.workoutDifficulty
            },
            start: desiredDate,
            allDay: true
          };

        }
      })(programWorkouts[i]);

    }

    //Set onclicks for programs in modal
    var programListModal = document.querySelectorAll("#programModalSummary");
    for(var i = 0; i < programListModal.length; i++) {
      (function(programItem) {
        programItem.onclick = () => {

          //Remove if any workouts exist
          clearProgramModalList();

          //Set selected program name
          document.getElementById("selectedProgramName").innerText = programItem.querySelector("#programModalName").innerText;
          
          //Set selected program description
          document.getElementById("selectedProgramDescription").innerText = programItem.querySelector("#programModalDescription").innerText;

          //Set selected program number of weeks
          document.getElementById("selectedProgramWeeks").innerText = programItem.querySelector("#programWeeks").innerText;

          //Get program ID:
          userProgramWorkoutID = programItem.querySelector("#programIDModal").innerText;
          
          //Get events related to program
          userProgramEvents = programItem.querySelector("#eventDataModal").innerText;

          //Hide placeholder
          document.getElementById("selectProgramPlaceholder").style.display = "none";

          //Prefill program list with workouts
          addWorkoutToProgramModalList(userProgramEvents);

          //Show workoutProgramSummary
          var programSummary = document.getElementById("programSummaryModal");
          programSummary.style.display = "flex";
          programSummary.style.flexDirection = "column";
          programSummary.style.justifyContent = "center";
          programSummary.style.alignItems = "center";



        }
      })(programListModal[i]);

    }

    //Set onclick for program workout select
    document.getElementById("selectProgramWorkout").onclick = () => {
      clearWorkoutExerciseList(true);
      // Add the new event to the calendar
      calendar.addEvent(newEvent);

      // Hide modal
      document.getElementById("modalWrapper").style.display = "none";
      document.getElementById("workoutsList").style.display = "none";
      document.getElementById("programList").style.display = "none";
    }

    //Set onclick for program select modal
    document.getElementById("selectProgramModal").onclick = () => {

      // Clear program list
      //clearProgramModalList();

      //Put user in 'add program' state
      addProgram = true;

      //Update program name to indicate to user to click a week
      //document.getElementById("userProgramName").innerText = "Click a week to select when the programs starts. ";

      //Populate calendar - change to when row clicked

      // userProgramWorkoutID = programItem.querySelector("#programIDModal").innerText;

      // userProgramEvents = programItem.querySelector("#eventDataModal").innerText;
      // // Add all workout events to the calendar
      // prefillProgramBuilder(programEventsData, "programSelect");

      // Hide modal
      document.getElementById("modalWrapper").style.display = "none";
      document.getElementById("workoutsList").style.display = "none";
      document.getElementById("programList").style.display = "none";

    }
    

    /*
      - First check if workout summary list has children
      - Iterate through workout summaries and show the 'workout of the week' icon if set
    */
    const workoutSummary = document.getElementById("workoutSummaryList");
    var workoutSummaryList = null;
    if(workoutSummary) {
      workoutSummaryList = workoutSummary.children;
      for(let i = 0; i < workoutSummaryList.length; i++) {
      
        const isWorkoutOfTheWeek = workoutSummaryList[i].querySelector("#isWorkoutOfTheWeek").innerText;
        if(isWorkoutOfTheWeek == "true") {
          workoutSummaryList[i].querySelector("#workoutOfTheWeekIcon").style.display = "block";
          break;
        }
      }
    }
    
    const svgPerson = document.getElementById("ajaxContent");
    const guideList = document.getElementById("guideListParent");
    const clickExerciseText = document.getElementById("clickExerciseText");
    const backButton = document.getElementById("clearText");
    
    //If search box changes, show list and hide svg man:
    const searchBox = document.getElementById("exerciseSearch");
    searchBox.oninput = function() {
      if(searchBox.value != "") {
        svgPerson.style.display = 'none';
        guideList.style.display = 'block';
        clickExerciseText.style.display = 'block';
        backButton.style.display = 'block';
      } else {
        svgPerson.style.display = 'block';
        guideList.style.display = 'none';
        clickExerciseText.style.display = 'none';
        backButton.style.display = 'none';
        resetFilters(true);
      }
    }

    //Set onclicks for user summary list
    var userSummaryList = document.querySelectorAll("#userSummary");
    for(let i = 0; i < userSummaryList.length; i++) {
      (function(userSummary) {
        userSummary.onclick = () => {
          //Fill account type
          document.getElementById("accountType").innerText = userSummary.querySelector("#summaryAccountType").innerText;
          //Fill program ends
          document.getElementById("programEnds").innerText = userSummary.querySelector("#summaryProgramEnds").innerText;
          //Fill experience
          document.getElementById("experienceLevel").innerText = userSummary.querySelector("#summaryExperience").innerText;
          //Fill goals
          document.getElementById("userGoals").innerText = userSummary.querySelector("#summaryGoal").innerText;
          //Fill user created
          document.getElementById("userCreated").innerText = userSummary.querySelector("#summaryUserCreated").innerText;
          //Fill user email
          document.getElementById("userEmail").innerText = userSummary.querySelector("#summaryUserEmail").innerText;
          //Fill mobile phone
          document.getElementById("userPhone").innerText = userSummary.querySelector("#summaryUserPhone").innerText;
          //Fill user notes
          document.getElementById("userNotes").value = userSummary.querySelector("#summaryUserNotes").innerText;
          //Fill experience
          document.getElementById("userLimitations").value = userSummary.querySelector("#summaryUserLimitations").innerText;

          //Fill calendar
          prefillProgramBuilder(userSummary, "userProgram");
          //TODO: Fill program name


          //Hide user summary list
          document.getElementById("userSummaryPage").style.display = "none";

          //Show user details
          document.getElementById("userDetailsPage").style.display = "block";


          


        }
      })(userSummaryList[i]);
    }

    //Catching mouse over and out events for showing the thumbnail and svg person
    document.addEventListener('mouseover', function (event) {

      if((event.target.classList.contains('fc-daygrid-day-frame') || event.target.classList.contains('fc-details') ||  event.target.classList.contains('fc-daygrid-day-events') ||event.target.classList.contains('fc-daygrid-day-top') ) && (isPasteState || isEventPasteState)) {
        var hoveredRow = event.target.closest('[role="row"]');
        var hoveredDay = event.target.closest('.fc-daygrid-day-frame');

        if(isPasteState) {
          toggleRowPasteStateCSS(hoveredRow, true);
        } else {
          toggleDayPasteStateCSS(hoveredDay, true);
        }
        

      } else if(event.target.id == "workoutExercisename") {
          
        var hoverDiv = event.target.parentElement.parentElement.parentElement.parentElement.querySelector("#thumbnailAndMuscleDiv").style;
        hoverDiv.display = "flex";
        hoverDiv.alignItems = "center";
        hoverDiv.justifyContent = "center";
        hoverDiv.flexDirection = "row";
        //Underline text
        event.target.style.textDecoration = "underline";
      } else if (event.target.id == "thumbnailAndMuscleDiv") {
        var hoverDiv = event.target.style;
        hoverDiv.display = "flex";
        hoverDiv.alignItems = "center";
        hoverDiv.justifyContent = "center";
        hoverDiv.flexDirection = "row";
      } else if ((event.target.id == "exerciseThumbnail" || event.target.id == "exerciseInfoRight") && (event.target.parentElement.id == "thumbnailAndMuscleDiv")) {

        var hoverDiv = event.target.parentElement.style;
        hoverDiv.display = "flex";
        hoverDiv.alignItems = "center";
        hoverDiv.justifyContent = "center";
        hoverDiv.flexDirection = "row";
        //Ensure we only check items in workout list
      } else if(event.target.className == "exerciseThumbnail" && event.target.parentElement.id == "exerciseThumbnail" && event.target.parentElement.parentElement.id == "thumbnailAndMuscleDiv") {
        var hoverDiv = event.target.parentElement.parentElement.style;
        hoverDiv.display = "flex";
        hoverDiv.alignItems = "center";
        hoverDiv.justifyContent = "center";
        hoverDiv.flexDirection = "row";
      }

    }, false);

    document.addEventListener('mouseout', function (event) {

      if((event.target.classList.contains('fc-daygrid-day-frame') || event.target.classList.contains('fc-details') ||  event.target.classList.contains('fc-daygrid-day-events'))) {
        var hoveredRow = event.target.closest('[role="row"]');
        toggleRowPasteStateCSS(hoveredRow, false);

      } else if(event.target.id == "workoutExercisename") {
        event.target.parentElement.parentElement.parentElement.parentElement.querySelector("#thumbnailAndMuscleDiv").style.display = "none";
        //Underline text
        event.target.style.textDecoration = "none";
      } else if (event.target.id == "thumbnailAndMuscleDiv") {
        event.target.style.display = "none";
      }

    }, false);

    document.getElementById("programForm").onsubmit = function() {
      var program = {};
      var programWorkoutsArr = [];

      //List events from calendar
      var events = calendar.getEvents();

      program["programName"] = document.getElementById("programName").value;
      program["programDescription"] = document.getElementById("programDescription").value;
      program["experience"] = document.getElementById("programExperience").value;
      program["programGoal"] = document.getElementById("programGoal").value;
      
      // Loop through the events and log their titles to the console
      for (var i = 0; i < events.length; i++) {
        //workoutObj["workoutID"] = ;
        // workoutObj["targetArea"] = events[i].extendedProps.targetArea;
        // workoutObj["length"] = events[i].extendedProps.length;
        // workoutObj["date"] = events[i].start.toLocaleDateString();
        // workoutObj["workoutName"] =  events[i].title;
        programWorkoutsArr.push(events[i].extendedProps.workoutID);
      }

      // Calculate number of weeks between start of first event and end of last event
      var numWeeks = Math.ceil((events[events.length-1].start.getTime() - events[0].start.getTime()) / (1000 * 60 * 60 * 24 * 7));

      program["workouts"] = programWorkoutsArr;
      program["eventData"] = JSON.stringify(events);

      const dates = events.map(obj => obj.start);
      
      // Sort the dates in ascending order
      dates.sort((a, b) => a - b);

      program["startDate"] = dates[0];
      program["endDate"] = dates[dates.length - 1];

      const millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
      const firstDate = dates[0];
      const lastDate = dates[dates.length - 1];
      program["numberOfWeeks"] = Math.ceil((lastDate - firstDate) / millisecondsPerWeek);
      
      program["gymName"] = document.getElementById("gymFullName").innerText;
      program["gymID"] = document.getElementById("gymID").innerText;

      if(sessionStorage.getItem('editProgram') == "true") {
        program["programID"] = document.getElementById("programSummaryID").value;
      } 

      sendProgramToMake(program);


    }

    document.getElementById("workoutBuilderForm").onsubmit = function() {

      var workout = {};

      //Obtain form data
      workout["name"] = document.getElementById("workoutName").value;
      workout["length"] = document.getElementById("estTime").value;
      workout["description"] = document.getElementById("workoutDescription").value;
      workout["focusArea"] = document.getElementById("focusArea").value;
      workout["gymName"] = document.getElementById("gymFullName").innerText;
      workout["gymID"] = document.getElementById("gymID").innerText;
      workout["experience"] = document.getElementById("experience").innerText;
      workout["workoutID"] = document.getElementById("workoutSummaryID").innerText;
      workout["workoutFullName"] = document.getElementById("workoutSummaryFullName").innerText;
      workout["listOfExercises"] = [];

      const workoutList = document.getElementById("workoutList").children;

      //Loop through list and obtain rest of data and add to object 
      for(var i = 1; i < workoutList.length; i++) {
        var workoutExercise = {}
        i >= 2 ? workoutExercise["restBetweenSeconds"] = workoutList[i].querySelector("#restBetweenExerciseSeconds").value : null;
        i >= 2 ? workoutExercise["restBetweenMinutes"] = workoutList[i].querySelector("#restBetweenExerciseMinutes").value : null;

        workoutExercise["sets"] = workoutList[i].querySelector("#sets").value;
        workoutExercise["reps"] = workoutList[i].querySelector("#reps").value;
        workoutExercise["exerciseRestSeconds"] = workoutList[i].querySelector("#exerciseRestSeconds").value;
        workoutExercise["exerciseRestMinutes"] = workoutList[i].querySelector("#exerciseRestMinutes").value;
        
        workoutExercise["guideID"] = workoutList[i].querySelector("#itemID").innerText;
        workoutExercise["workoutExerciseItemID"] = workoutList[i].querySelector("#workoutExerciseItemID").innerText;
        workoutExercise["workoutExerciseFullName"] = workoutList[i].querySelector("#workoutExerciseFullName").innerText;
        workout.listOfExercises.push(workoutExercise);
      }

      //Make sure they have selected a duration and focus area
      if(!workout["length"].includes("Duration") && !workout["focusArea"].includes("Focus Area")) {
        //Send to make and navigate back to workout summary
        sendWorkoutToMake(workout);      
      } else {
        if(workout["length"] == "Duration") {
          document.getElementById("estTimeDiv").style.borderRadius = "8px";
          document.getElementById("estTimeDiv").style.border = "1px solid red";
          document.getElementById("durationRequired").style.display = "block";
        } else if(workout["focusArea"] == "Focus Area") {
          document.getElementById("focusArea").style.borderRadius = "8px";
          document.getElementById("focusArea").style.border = "1px solid red";
          document.getElementById("focusAreaRequired").style.display = "block";
        }
      }
    }

    //Listen for click events specifically for in paste state when clicking on cells
    //Otherwise if in paste state and not clicked on a day cancel paste state
    document.addEventListener('click', function(event) {

      //Check if in paste state and anywhere in the row is clicked
      if((event.target.classList.contains('fc-daygrid-day-frame') || event.target.classList.contains('fc-details') || event.target.classList.contains('fc-daygrid-day-events')) && (isPasteState || isEventPasteState)) {

        //Get entire row of paste button
        var weekRow = event.target.closest('[role="row"]');
        var dayCell = event.target.closest('.fc-daygrid-day-frame');

        if(isPasteState) {
          
          if (weekRow) {

            //Obtain saved copied events
            var copiedEvents = JSON.parse(sessionStorage.getItem('copiedEvents'));

            if (copiedEvents) {

              //Get start time of entire week
              var startTime = new Date(weekRow.querySelector('[role="gridcell"]').getAttribute("data-date"));

              copiedEvents.forEach(function(event) {
                event.start = new Date(event.start);
              
                var millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;

                startTime.setHours(0, 0, 0, 0);

                // Calculate the start and end dates of the week of interest
                var endOfWeek = new Date(startTime.getTime() + (7 * 24 * 60 * 60 * 1000));
              
                // Filter the events within the week of interest
                var eventsInWeek = calendar.getEvents().filter(function(existingEvent) {
                  var existingEventStart = existingEvent.start;
                  return (
                    existingEventStart >= startTime && existingEventStart <= endOfWeek
                  );
                });
              
                // Calculate the difference between copied event and selected paste week
                if (event.start.getTime() > startTime.getTime()) {
                  var difference = Math.floor((event.start.getTime() - startTime.getTime()) / millisecondsPerWeek);
                  event.start.setDate(event.start.getDate() - (difference * 7));
                } else if (event.start.getTime() < startTime.getTime()) {
                  var difference = Math.ceil((startTime.getTime() - event.start.getTime()) / millisecondsPerWeek);
                  event.start.setDate(event.start.getDate() + (difference * 7));
                }

                // Check if there are any duplicate events within the week
                var duplicateEventExists = eventsInWeek.some(function(existingEvent) {
                  return existingEvent.start.toDateString() === event.start.toDateString();
                });
                
                if(!duplicateEventExists) {
                  // Add event to calendar
                  calendar.addEvent(event);
                }

              });
              
            }
          }
        } else {
          var copiedEvent = JSON.parse(sessionStorage.getItem('copiedEvent'));
          var clickedDate = new Date(dayCell.parentElement.getAttribute("data-date"));

          if ((copiedEvent && clickedDate)) {
        
            // Create a new event object with the copied event details
            var newEvent = {
              title: copiedEvent.title,
              start: clickedDate,
              end: clickedDate, // Set the end date as the same as start for all-day events
              allDay: copiedEvent.allDay,
              extendedProps: copiedEvent.extendedProps
            };
        
            // Add the new event to the calendar
            calendar.addEvent(newEvent);
      
          }

        }

        toggleRowPasteStateCSS(weekRow, false);
        toggleDayPasteStateCSS(dayCell, false);

        setFromPaste = true;
      } else {
        isPasteState = false;
        isEventPasteState = false;
      }

    });

    //Listen for click events:
    document.addEventListener('click', function (event) {
      
      //Check if clicked copy button is selected
      if(clickedCopyButton.src != "") {
        clickedCopyButton.src = "https://uploads-ssl.webflow.com/622f1b68bc1e4510618e0b04/64660537b94dae417d693cce_copyButton.webp";
        clickedCopyButton = "";
      }

      if(clickedEventCopyButton && clickedEventCopyButton.src != "") {

        //Hide the copy and delete buttons, reset the image state to unclicked
        clickedEventCopyButton.src = "https://uploads-ssl.webflow.com/622f1b68bc1e4510618e0b04/64660537b94dae417d693cce_copyButton.webp";

        clickedEventCopyButton.parentElement.style.display = "none";
        clickedEventCopyButton.parentElement.previousSibling.style.display = "none";
        clickedEventCopyButton = "";
      }

      if (event.target.classList.contains('copy-events-button')) {
        clickedCopyButton = event.target;
        event.target.src = "https://uploads-ssl.webflow.com/622f1b68bc1e4510618e0b04/646ddeb5b0ba0c6aee88f383_copyPressedNew.webp"
        
        isPasteState = true;

        //Get entire row of copy button
        var weekRow = event.target.closest('[role="row"]');
        //Get first cell of that week
        var weekStart = new Date(weekRow.querySelector('[role="gridcell"]').getAttribute("data-date"));
        var weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000); // Add 7 days to get the end of the week

        //Minus 10 hours from week start & end
        weekStart = new Date(weekStart.setHours(weekStart.getHours() - 10));
        weekEnd = new Date(weekEnd.setHours(weekEnd.getHours() - 10));
        
        //List all events then filter to specific week
        var allEvents = calendar.getEvents();
        var weekEvents = allEvents.filter(function(event) {
          return event.start >= weekStart && event.start < weekEnd;
        });
    
        sessionStorage.setItem('copiedEvents', JSON.stringify(weekEvents));

      } else if (event.target.classList.contains('delete-events-button')) {

        //Get entire row of copy button
        var weekRow = event.target.closest('[role="row"]');
        var weekRowChildren = weekRow.children;
        //Get first cell of that week
        var weekStart = new Date(weekRow.querySelector('[role="gridcell"]').getAttribute("data-date"));
        var weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000); // Add 7 days to get the end of the week

        //Minus 10 hours from week start & end
        weekStart = new Date(weekStart.setHours(weekStart.getHours() - 10));
        weekEnd = new Date(weekEnd.setHours(weekEnd.getHours() - 10));
        
        //List all events then filter to specific week
        var allEvents = calendar.getEvents();
        var weekEvents = allEvents.filter(function(event) {
          return event.start >= weekStart && event.start < weekEnd;
        });

        // Remove the week events from the calendar
        weekEvents.forEach(function(event) {

          event.remove();
        });
        for(var i = 1; i < weekRowChildren.length; i++) {
          var copyButton = weekRowChildren[i].querySelector('.copy-event-button');
          var deleteButton = weekRowChildren[i].querySelector('.delete-event-button');
          if(copyButton && deleteButton) {
            copyButton.remove();
            deleteButton.remove();
          }
        }


      } else if (event.target.nodeName == "path") {

        clearMuscleFilters();

        var muscleFilter = sessionStorage.getItem("muscleFilter");
        
        //Ensure muscle filter exists
        if(muscleFilter && muscleFilter != "") {
          muscleFilter = muscleFilter.replaceAll(" ", "-");
          document.querySelector(`.${muscleFilter}-filter`).click();
          //Click ab/adductors if quads are selected
          if(muscleFilter == "quadriceps") {
            document.querySelector(".adductors-filter").click();
            document.querySelector(".abductors-filter").click();
          }
          // hide SVG man:
          svgPerson.style.display = 'none';
          guideList.style.display = 'block';
          clickExerciseText.style.display = 'block';
          backButton.style.display = 'block';

          //Populate search box
          if(muscleMapping[muscleFilter] !== undefined)
            document.getElementById("exerciseSearch").value = muscleMapping[muscleFilter];
        }
        //Reset storage filter for next click
        sessionStorage.setItem("muscleFilter", "");
        
      } else if(event.target.closest("#assignProgram")) {

        showModal("programList");


      } else if(document.getElementById("trainingRadio").checked && event.target.id == "trainingRadio") {

        summaryRadioClicked = false;
        if(!isProgrammaticClick) {

          //Remove all events first
          //calendar.removeAllEvents();

          //Set the calendar back to today
          calendar.today()

          //Set number of weeks to 5
          updateCalendarWeeks(5);

          //Navigate to user summary view
          document.getElementById("userInfoDetails").style.display = "none";
          document.getElementById("programBuilder").style.display = "block";
          document.getElementById("programBuilderInfo").style.display = "none";

          checkSummaryTrainingCheckBox();

          refreshCalendarLayout();

          //Show week date ranges
          showOrHideWeekRange("block");

          //Set user create program flag
          sessionStorage.setItem("createUserProgram", "true");

        }

        isProgrammaticClick = false;

        if(sessionStorage.getItem("createUserProgram") == true) {

        } else {
          

        }



      } else if(document.getElementById("summaryRadioButton").checked && event.target.id == "summaryRadioButton") {

        //Navigate to user summary view  

        summaryRadioClicked = true;
        if(!isProgrammaticClick) {
          checkAndClearProgram("userInfoDetails");
        }
        

      } else if(event.target.id == "createUser" || event.target.id == "createUserText" || event.target.id == "createUserImage") {

        //Get button
        var userButton = event.target.closest("#createUser");
        var gymName = document.getElementById("gymFullName").innerText;
        userButton.src += `utm_campaign=${gymName}`;

      } else if(event.target.id == "ipadBackButton") {
        //Reset filters on workout summary page
        //workoutSummaryPage.style.display = "block";
        //workoutBuilderPage.style.display = "none";
        settingsBody.style.display = "none";
        equipmentBody.style.display = "none";
        dashboardBody.style.display = "none";

        // Check if there are any exercises in the list 
        // If there is, prompt user to confirm removing list 

        // If they confirm remove items from list and clear filters and hide exercise list
        checkAndClearWorkouts("workoutSummaryPage");

      } else if(event.target.id == "addWeekButton") {
        if(sessionStorage.getItem("createUserProgram") == "true") {
          updateCalendarWeeks(0,"userProgramBuilder");
        } else {
          updateCalendarWeeks();
        }
        

      } else if( event.target.id == "qrImg") {
        //Get link from hidden field
        const workoutLink = event.target.parentElement.parentElement.querySelector("#workoutLink").href;
        const workoutName = event.target.parentElement.parentElement.querySelector("#workoutSummaryName").innerText
        //Insert workout name
        document.getElementById("scanWorkoutName").innerHTML = workoutName;

        //Get gym name to pass through
        var qrGymName = document.getElementById("gymFullName").innerText;
        //Produce QR code and add it to div
        generateQRCode(workoutLink, qrGymName.toLowerCase());

        //Show modal
        showModal("workoutQRDiv");

      } else if(event.target.id == "modalWrapper" || event.target.className == "close-modal" || event.target.className == "exit-qr-scan") {
        //Remove QR code
        if(document.querySelector(".qr-code img") != null) {
          document.querySelector(".qr-code img").remove();
        }
        
        document.getElementById("linkCopiedText").style.display = "none";
        if(event.target.id == "modalWrapper") {
          document.getElementById("modalWrapper").style.display = "none";
          document.getElementById("submitIssueDiv").style.display = "none";
          document.getElementById("workoutQRDiv").style.display = "none";
          document.getElementById("workoutsList").style.display = "none";
          document.getElementById("programList").style.display = "none";
          clearWorkoutExerciseList(true);

          //Update help icon
          document.getElementById("helpDiv").style.backgroundColor = "";
          document.getElementById("helpImage").style.display = "block";
          document.getElementById("helpImageClicked").style.display = "none";
        }

      } else if(event.target.id == "submitWorkoutOrProgram") {

        //Hide confirm close modal
        document.getElementById("confirmCloseBuilder").style.display = "none";

        //Check if workouts or program is active
        if(sessionStorage.getItem("editProgram") == "true" || sessionStorage.getItem("createProgram") == "true" || sessionStorage.getItem("duplicateProgram")== "true") {

          //Attempt to submit workout 
          document.getElementById("saveProgram").click();

        } else {
          //Attempt to submit workout 
          document.getElementById("saveWorkout").click();
        }
  
  
      } else if(event.target.id == "clearText" || event.target.id == "clearTextDiv" || event.target.id == "clearTextImage" || event.target.id == "clearTextBlock") {
        svgPerson.style.display = 'block';
        guideList.style.display = 'none';
        clickExerciseText.style.display = 'none';
        backButton.style.display = 'none';
        resetFilters();

      } else if(event.target.id == "shareWorkout") {

        navigator.clipboard.writeText(sessionStorage.getItem("workoutLink"));
        document.getElementById("linkCopiedText").style.display = "block";
        
      } else if(event.target.id == "removeExercise") {

        const workoutList = document.getElementById("workoutList");
        const removedElement = workoutList.removeChild(event.target.parentElement.parentElement.parentElement.parentElement);
        
        const listLength = workoutList.childNodes.length;
        const saveWorkout = document.getElementById("saveWorkout");
        
        if (listLength == 1) {
          document.getElementById("firstExercisePlaceholder").style.display = "block";
          document.getElementById("experience").innerText = "Beginner";
        } else if(listLength >= 2) {
          if(listLength == 2) {
            //Hide workout button if there is only one exercise in list
            saveWorkout.style.display = "none";
          }
          const firstElement = workoutList.querySelector("ul > li:nth-child(2)");
          const lastElement = workoutList.querySelector(`ul > li:nth-child(${listLength})`);

          if(firstElement) {
            //Remove required attribute of first item
            firstElement.querySelector("#restBetweenExerciseMinutes").removeAttribute('required');
            firstElement.querySelector("#restBetweenExerciseSeconds").removeAttribute('required');

            if(firstElement.querySelector("#exerciseBreaker")) {
              firstElement.querySelector("#exerciseBreaker").style.display = "none";
            }
            if(firstElement.querySelector("#moveUp")) {
              firstElement.querySelector("#moveUp").style.display = "none";
            }	
            if(listLength == 2 && firstElement.querySelector("#moveDown")) {
              firstElement.querySelector("#moveDown").style.display = "none";
            }
          }

          if(lastElement != firstElement && lastElement.querySelector("#moveDown")) {
              lastElement.querySelector("#moveDown").style.display = "none";
          }
        }

        var workoutExerciseItemId = removedElement.querySelector("#itemID").innerText;

        //Check if the guide exercise is still in the list, if not then turn border back to SF blue
        var result = checkIfLastExerciseInList(workoutExerciseItemId);
        if(result) {
          result.style.borderColor = "rgb(12, 8, 213)"
        }
      } else if(event.target.id == "moveUp" || event.target.id == "moveUpLink") {

        var currentExercise = null;
        var previousExercise = null;

        if(event.target.id == "moveUp") {
          currentExercise = event.target.parentElement.parentElement.nextSibling.querySelector("#guidePlaceHolder");
          previousExercise = event.target.parentElement.parentElement.parentElement.parentElement.previousSibling.querySelector("#guidePlaceHolder");
        } else {
          currentExercise = event.target.parentElement.nextSibling.querySelector("#guidePlaceHolder");
          previousExercise = event.target.parentElement.parentElement.parentElement.previousSibling.querySelector("#guidePlaceHolder");
        }


        var temp = currentExercise.removeChild(currentExercise.querySelector("#individualGuide"));

        currentExercise.appendChild(previousExercise.removeChild(previousExercise.querySelector("#individualGuide")));
        previousExercise.appendChild(temp);    


      } else if(event.target.id == "moveDown" || event.target.id == "moveDownLink") {

        var currentExercise = null;
        var previousExercise = null;

        if(event.target.id == "moveDown") {
          currentExercise = event.target.parentElement.parentElement.nextSibling.querySelector("#guidePlaceHolder");
          nextExercise = event.target.parentElement.parentElement.parentElement.parentElement.nextSibling.querySelector("#guidePlaceHolder");
        } else {
          currentExercise = event.target.parentElement.nextSibling.querySelector("#guidePlaceHolder");
          nextExercise = event.target.parentElement.parentElement.nextSibling.querySelector("#guidePlaceHolder");
        }

        var temp = currentExercise.removeChild(currentExercise.querySelector("#individualGuide"));

        currentExercise.appendChild(nextExercise.removeChild(nextExercise.querySelector("#individualGuide")));
        nextExercise.appendChild(temp);  

      } else if (event.target.id == "createWorkout" || event.target.id == "createWorkoutImage" || event.target.id == "createWorkoutText" ||
      event.target.id == "createWorkoutTablet" || event.target.id == "createWorkoutImageTablet" || event.target.id == "createWorkoutTextTablet") {

        //Set create workout flag
        sessionStorage.setItem("createWorkout", true);
        //Go to workout builder
        document.getElementById("workoutBuilderPage").style.display = "block";
        document.getElementById("workoutSummaryPage").style.display = "none";
      } else if (event.target.id == "createProgram" || event.target.id == "createProgramImage" || event.target.id == "createProgramText") {
        //Remove all events first
        calendar.removeAllEvents();

        //Set number of weeks to 5
        updateCalendarWeeks(5);

        //Set program flag to create
        sessionStorage.setItem("createProgram", 'true');

        document.getElementById("programBuilder").style.display = "block";

        //Show form inputs for program builder
        var programBuilderInfo = document.getElementById("programBuilderInfo");
        programBuilderInfo.style.display = "flex";
        programBuilderInfo.style.flexDirection = "row";
        programBuilderInfo.style.alignContent = "flex-end";
        programBuilderInfo.style.justifyContent = "space-between";
        document.getElementById("programBuilderInfo").style.display = "flex";
        
        refreshCalendarLayout();
        document.getElementById("workoutSummaryDiv").style.display = "none";
        document.getElementById("programPage").style.display = "none";

      } else if(event.target.id == "reset-filters" || event.target.id == "reset-filters-ipad" || event.target.id == "reset-filters-modal") {
        resetGeneralFilters(true);
      } else if (event.target.id == "arrowImg" || event.target.id == "filterOn" || event.target.id == "filterButton" || event.target.id == "filtersText" || event.target.id == "filtersImage" ||
        event.target.id == "filterMenuChild" || event.target.classList.contains('filter-title') || event.target.classList.contains('filter-label') 
        || event.target.classList.contains('filter-checkbox') || event.target.classList.contains('clear-filter') || (event.target.tagName == "INPUT" &&  event.target.id != "workoutSearch" && !(event.target.id.includes("radio"))) || event.target.classList.contains('clear-container') || event.target.classList.contains('clear-filters')) {
        document.getElementById("filterMenu").style.display = "block";

      } else if(event.target.closest("#programModalSummary")) {
        




      } else if(event.target.id == "exit-menu" ) {
        document.getElementById("filterMenu").style.display = "none";

      } else if(event.target.classList.contains("dropdownitem")) {
        
      } else if(event.target.classList.contains("dropdownitem")) {
        if(event.target.parentElement.id == "focusAreaDropdown") {
          document.getElementById("focusArea").innerText = event.target.innerText;
          document.getElementById("focusAreaDropdown").style.display = "none";
        } else if(event.target.parentElement.id == "durationDropdown") {
          document.getElementById("estTime").innerText = event.target.innerText;
          document.getElementById("durationDropdown").style.display = "none";
        }
      } else if(event.target.id == "deleteWorkout") {
        //Get row of clicked element:
        var currentWorkoutRow = event.target.parentElement.parentElement.parentElement.parentElement;

        //Hide it
        currentWorkoutRow.style.display = "none";

        //Build object to send to make
        var workout = {};

        //Workout summary ID
        workout["workoutSummaryID"] = currentWorkoutRow.querySelector("#workoutID").innerText;

        //Gym dashboard ID
        workout["gymdashboardID"] = document.getElementById("gymID").innerText;

        //Initialise array to store exercise IDs
        workout["workoutExercises"] = [];

        //Loop through the workout exercises list to get each ID
        var exerciseList = currentWorkoutRow.querySelector("#workoutExerciseList").children;
        for(var i = 0; i < exerciseList.length; i++) {
          workout["workoutExercises"].push(exerciseList[i].querySelector("#exerciseItemID").innerText);
        }
        
        //Send to make to delete workout
        deleteWorkout(workout);


      } else if(event.target.id == "makeWorkoutOfTheWeek") {

        //Object for storing new workout of the week
        var workoutOfTheWeek = {};

        //Get row of clicked element:
        const currentWorkoutRow = event.target.parentElement.parentElement.parentElement.parentElement;
        //Hide previous workout of the week
        const isWorkoutOfTheWeekList = document.querySelectorAll("#isWorkoutOfTheWeek");
        for(var i = 0; i < isWorkoutOfTheWeekList.length; i++) {
          if(isWorkoutOfTheWeekList[i].innerText == "true") {
            isWorkoutOfTheWeekList[i].innerText == "false";
            isWorkoutOfTheWeekList[i].parentElement.querySelector("#workoutOfTheWeekIcon").style.display = "none";
            workoutOfTheWeek["previousWorkoutID"] = isWorkoutOfTheWeekList[i].parentElement.querySelector("#workoutID").innerText;
            workoutOfTheWeek["previousWorkoutName"] = isWorkoutOfTheWeekList[i].parentElement.querySelector("#workoutFullName").innerText;
          }
        }

        //Update workout of the week text or icon selected
        currentWorkoutRow.querySelector("#isWorkoutOfTheWeek").innerText = "true";
        currentWorkoutRow.querySelector("#workoutOfTheWeekIcon").style.display = "block";

        
        workoutOfTheWeek["workoutID"] = currentWorkoutRow.querySelector("#workoutID").innerText;
        workoutOfTheWeek["workoutName"] = currentWorkoutRow.querySelector("#workoutFullName").innerText;

        //Send Post request to make
        updateWorkoutOfTheWeek(workoutOfTheWeek);


      } else if(event.target.id == "workoutSummary") { 
        
        //Note that this is editing a workout
        sessionStorage.setItem('editWorkout', 'true');
        sessionStorage.setItem("viewingEditFirstTime", 'true');
        //Prefill workout builder with the selected workout
        prefillWorkoutBuilder(event.target);

      } else if(event.target.id == "workoutTitleDiv" || event.target.id == "workoutDifficulty" || event.target.id == "workoutDuration" || event.target.id == "workoutLastEdited") {

        //Note that this is editing a workout
        sessionStorage.setItem('editWorkout', 'true');
        sessionStorage.setItem("viewingEditFirstTime", 'true');
        //Prefill workout builder with the selected workout
        prefillWorkoutBuilder(event.target.parentElement);

      } else if(event.target.id == "workoutSummaryName" || event.target.id == "workoutSummaryDescription") {
        
        //Note that this is editing a workout
        sessionStorage.setItem('editWorkout', 'true');
        sessionStorage.setItem("viewingEditFirstTime", 'true');
        //Prefill workout builder with the selected workout
        prefillWorkoutBuilder(event.target.parentElement.parentElement);

      } else if (event.target.id == "duplicateWorkout") {
        //Note that this is dupicating an existing workout
        sessionStorage.setItem('duplicateWorkout', 'true');

        //Prefill workout builder with the selected workout
        prefillWorkoutBuilder(event.target.parentElement.parentElement.parentElement.parentElement);

      } else if(event.target.id == "keepEditing" || event.target.id == "closeBuilderModal" || event.target.id == "closeBuilderModalImage") {
        //Close modal
        document.getElementById("confirmCloseBuilder").style.display = "none";

        if(sessionStorage.getItem("editProgram") == "true" || sessionStorage.getItem("createProgram") == "true" || sessionStorage.getItem("duplicateProgram")== "true" || sessionStorage.getItem("createUserProgram") == "true" ) {

          //Check which radio button is active to reset it
          if(workoutRadioClicked) {
            isProgrammaticClick = true;
            if(document.getElementById("workoutRadio").checked) {
              document.getElementById("programRadio").click();
            } else {
              document.getElementById("workoutRadio").click();
            }

            workoutRadioClicked = false;
          } else if(summaryRadioClicked) {
            isProgrammaticClick = true;
            if(document.getElementById("summaryRadioButton").checked) {
              document.getElementById("trainingRadio").click();
            } else {
              document.getElementById("summaryRadioButton").click();
            }
            summaryRadioClicked = false;
          }

        }

      } else if(event.target.id == "clearExperienceExerciseFilters") {
        resetGeneralFilters();
        
      } else {
        
        //Close filter menu:
        //Hide filter menu if open:
        if(document.getElementById("filterBody").style.display == "flex" && !event.target.classList.value.includes("checkbox-field")) {

          document.getElementById("filterBody").style.display = "none";
          //Rotate arrow back:
          document.getElementById("arrowWrapper").style.transform = 'rotate(0deg)';
          document.getElementById("filterButton").click();

        } else if(document.getElementById("filterBodyIpad").style.display == "flex" && !event.target.classList.value.includes("checkbox-field") && event.target.id != "arrowImgIpad" && event.target.id != "filtersTextIpad" && event.target.id != "filterButtonIpad" && event.target.id != "filtersImageIpad" && event.target.tagName != "SPAN") {

          document.getElementById("filterButtonIpad").click();
        }

        if (document.getElementById("filterBodyModal").style.display == "flex" && !event.target.classList.value.includes("checkbox-field")) {
          document.getElementById("filterBodyModal").style.display = "none";

          //Rotate arrow back:
          document.getElementById("arrowWrapperModal").style.transform = 'rotate(0deg)';
          document.getElementById("filterButtonModal").click();
        }

      }
    }, false);

    //Listen for change events:
    document.addEventListener('change', function (event) {

      if(event.target.id == "estTime") {
        document.getElementById("estTimeDiv").style.borderRadius = "0px";
        document.getElementById("estTimeDiv").style.border = "";
        document.getElementById("durationRequired").style.display = "none";
      } else if (event.target.id == "focusArea") {
        document.getElementById("focusArea").style.borderRadius = "0px";
        document.getElementById("focusArea").style.border = "";
        document.getElementById("focusAreaRequired").style.display = "none";
      } else if(document.getElementById("workoutRadio").checked && event.target.id == "workoutRadio") {
        workoutRadioClicked = true;
        if(!isProgrammaticClick) {
          checkAndClearProgram("workoutSummaryPage", "workoutSummaryDiv");
        }
        

      } else if(document.getElementById("programRadio").checked && event.target.id == "programRadio") {
        workoutRadioClicked = false;
        //Only change screen if human clicks radio button
        if(!isProgrammaticClick) {
          document.getElementById("workoutSummaryDiv").style.display = "none";
          var programPage = document.getElementById("programPage");
          programPage.style.display = "flex";
          programPage.style.flexDirection = "column";
          programPage.style.alignItems = "center";

          checkProgramWorkoutCheckBox();
        }
        resetFilters();

        isProgrammaticClick = false;

      } else if (event.target.type == "radio" && event.target.name == "workoutFocusArea") {

        const filters = document.getElementsByName('workoutFocusArea');
        let isAnyRadioButtonChecked = false;
  
        for (let i = 0; i < filters.length; i++) {
          if (filters[i].checked) {
            isAnyRadioButtonChecked = true;
            break;
          }
        }
        var allFilterStyle = document.getElementById("allFilter").style;
        if(!isAnyRadioButtonChecked) {
          //Colour the 'all filter'
          allFilterStyle.color = "white";
          allFilterStyle.backgroundColor = "#0C08D5";
          allFilterStyle.border = "0px";
          allFilterStyle.borderRadius = "8px";
          
        } else {
          //Reset the 'all filter'
          allFilterStyle.backgroundColor = "transparent";
          allFilterStyle.color = "black";
        }
  
      } else if (event.target.type == "radio" && event.target.name == "workoutFocusAreaModal") {

        const filters = document.getElementsByName('workoutFocusAreaModal');
        let isAnyRadioButtonChecked = false;
  
        for (let i = 0; i < filters.length; i++) {
          if (filters[i].checked) {
            isAnyRadioButtonChecked = true;
            break;
          }
        }
        var allFilterStyle = document.getElementById("allFilterModal").style;
        if(!isAnyRadioButtonChecked) {
          //Colour the 'all filter'
          allFilterStyle.color = "white";
          allFilterStyle.backgroundColor = "#0C08D5";
          allFilterStyle.border = "0px";
          allFilterStyle.borderRadius = "8px";
          
        } else {
          //Reset the 'all filter'
          allFilterStyle.backgroundColor = "transparent";
          allFilterStyle.color = "black";
        }
  
      } else if (event.target.type == "radio" && event.target.name == "programExperience") {

        const filters = document.getElementsByName('programExperience');
        let isAnyRadioButtonChecked = false;
  
        for (let i = 0; i < filters.length; i++) {
          if (filters[i].checked) {
            isAnyRadioButtonChecked = true;
            break;
          }
        }
        var allFilterStyle = document.getElementById("allProgramFilter").style;
        if(!isAnyRadioButtonChecked) {
          //Colour the 'all filter'
          allFilterStyle.color = "white";
          allFilterStyle.backgroundColor = "#0C08D5";
          allFilterStyle.border = "0px";
          allFilterStyle.borderRadius = "8px";
          
        } else {
          //Reset the 'all filter'
          allFilterStyle.backgroundColor = "transparent";
          allFilterStyle.color = "black";
        }
  
      } else if (event.target.type) {
        checkCheckboxFilters().then(res => { 

          //Check if the amount of active filters is more than 0

          if (res[0] > 0) {
            document.getElementById("filterOnModal").style.display = "block";
          } else {
            document.getElementById("filterOnModal").style.display = "none";
          }

          if (res[1] > 0) {
            document.getElementById("filterOnProgramModal").style.display = "block";
          } else {
            document.getElementById("filterOnProgramModal").style.display = "none";
          }

          if(res[2] > 0) {
            document.getElementById("filterOn").style.display = "block";
          } else {
            document.getElementById("clearExperienceExerciseFilters").style.display = "none";
            document.getElementById("filterOn").style.display = "none";
          }

          if (res[4] > 0) {
            document.getElementById("clearExperienceExerciseFilters").style.display = "block";
            document.getElementById("filterOnIpad").style.display = "block";
            document.getElementById("reset-filters-ipad").style.display = "block";
          } else {
            document.getElementById("filterOnIpad").style.display = "none";
            document.getElementById("reset-filters-ipad").style.display = "none";
          }



        });
      }
    }, false);

    document.addEventListener("mouseover",function (event) {
      if(event.target.id == "experienceTag" || event.target.id == "experience") {
        document.getElementById("toolTipText").style.display = "block";
      }
    }, false);

    document.addEventListener("mouseout",function (event) {
      if(event.target.id == "experienceTag" || event.target.id == "experience") {
        document.getElementById("toolTipText").style.display = "none";
      }
    }, false);

    function refreshCalendarLayout() {

      calendar.render();

    }

    function toggleRowPasteStateCSS(row, toggleState) {
      if(row && row.children) {
        var rowChildren = row.children;
        //Iterate through each day in the row and apply css
        for(let i = 1; i < rowChildren.length; i++) {
          if(toggleState) {
            rowChildren[i].querySelector(".fc-daygrid-day-frame").style.backgroundColor = "rgba(12, 8, 213, 0.15)";
          } else {
            rowChildren[i].querySelector(".fc-daygrid-day-frame").style.backgroundColor = "#F0F0F0";
          }
        }
      }
    }

    function toggleDayPasteStateCSS(day, toggleState) {
     
      if(day) {
        //Iterae through each day in the row and apply css
        if(toggleState) {
          day.style.backgroundColor = "rgba(12, 8, 213, 0.15)";
        } else {
          day.style.backgroundColor = "#F0F0F0";
        }
      }
    }
    
    async function resetFilters(onlyCheckboxes=false) {
      window.fsAttributes = window.fsAttributes || [];
      window.fsAttributes.push([
        'cmsfilter',
        async (filterInstances) => {
          // The callback passes a `filterInstances` array with all the `CMSFilters` instances on the page.
          document.getElementById("exerciseSearch").value = "";
          //Get muscle related filters
          const [programModalFilters, workoutModalFilters, summaryFilters, filterInstance] = filterInstances;
          if(filterInstances.length > 1) { 
            !onlyCheckboxes ? await filterInstance.resetFilters(filterKeys=["exercisename","casualmusclefilter"], null) : null;
            await filterInstance.resetFilters(filterKeys=["musclenamefilter"], null);
          } else {
            !onlyCheckboxes ? await summaryFilters.resetFilters(filterKeys=["exercisename","casualmusclefilter"], null) : null;
            await summaryFilters.resetFilters(filterKeys=["musclenamefilter"], null);
          }


          //Clear focus area filters:
          document.getElementById("allFilter").click();
          document.getElementById("allFilter").focus();

        },
      ]);
    }

    function checkSummaryTrainingCheckBox() {
      //Style if going to workouts
      const checkedRadioInput = document.querySelector('input[type="radio"][name="summaryTraining"]:checked');
      const checkedSpanElement = checkedRadioInput.nextElementSibling;
      
      checkedSpanElement.style.backgroundColor = '#FFFFFF';
      checkedSpanElement.style.border = '0px';
      checkedSpanElement.style.borderRadius = '8px';
      checkedSpanElement.style.color = '#0C08D5';

      const uncheckedRadioInputs = document.querySelectorAll('input[type="radio"][name="summaryTraining"]:not(:checked)');

      uncheckedRadioInputs.forEach((radioInput) => {
        const spanElement = radioInput.nextElementSibling;
      
        spanElement.style.backgroundColor = 'initial';
        spanElement.style.border = 'initial';
        spanElement.style.borderRadius = 'initial';
        spanElement.style.color = 'initial';
      });
    }

    function clearMuscleFilters() {

      var muscleCheckboxes = document.querySelectorAll(".muscle-field");
      for(var i = 0; i < muscleCheckboxes.length; i++) {
        if(muscleCheckboxes[i].querySelector("input").checked) {
          muscleCheckboxes[i].querySelector("span").click();
        }
        
      }
    }

    async function resetGeneralFilters(clearButton=false) {

      const checkboxes = document.getElementsByClassName('filter-checkbox');
      for (let i = 0; i < checkboxes.length; i++) { 
        if(checkboxes[i].classList.value.includes('w--redirected-checked')) {
          checkboxes[i].click();
        }
      }

      //Clear focus area filters:
      document.getElementById("allFilter").click();
      document.getElementById("allFilter").focus();

      //Clear textbox filter value:
      document.getElementById("workoutSearch").value = "";
      window.fsAttributes = window.fsAttributes || [];
      window.fsAttributes.push([
        'cmsfilter',
        async (filterInstances) => {
          // The callback passes a `filterInstances` array with all the `CMSFilters` instances on the page.
          document.getElementById("exerciseSearch").value = "";
          //Get muscle related filters
          const [summaryFilters, filterInstance] = filterInstances;
          await summaryFilters.resetFilters(filterKeys=["workoutname-2"], null);

        },
      ]);

      //Hide filter menu if clicked
      var filterDiv = document.getElementById("filterBody").style.display;

      if(filterDiv == "flex" && !clearButton) {

        //Hide filter menu if open:
        document.getElementById("filterBody").style.display = "none";

        //Rotate arrow back:
        document.getElementById("arrowWrapper").style.transform = 'rotate(0deg)';
        document.getElementById("filterButton").click();
      }

      // Hide filter menu in modal workout select if clicked
      var filterDiv = document.getElementById("filterBodyModal").style.display;

      if(filterDiv == "flex" && !clearButton) {

        //Hide filter menu if open:
        document.getElementById("filterBodyModal").style.display = "none";

        //Rotate arrow back:
        document.getElementById("arrowWrapperModal").style.transform = 'rotate(0deg)';
        document.getElementById("filterButtonModal").click();
      }

    }

    //Returns the amount of experience and exercise filters are currently active
    async function checkCheckboxFilters() {

      window.fsAttributes = window.fsAttributes || [];
      window.fsAttributes.push([
        'cmsfilter',
      ])
      return window.fsAttributes.cmsfilter.loading.then(res => {

        //Workouts modal form
        var filterInstance = res[0].filtersData;
        var filtersTotalSize = filterInstance[1].values.size + filterInstance[2].values.size;

        //Program modal form
        var filterInstance1 = res[1].filtersData;
        var filtersTotalSize1 = filterInstance1[1].values.size + filterInstance1[2].values.size;

        //Workouts Summary List
        var filterInstance2 = res[2].filtersData;
        var filtersTotalSize2 = filterInstance2[1].values.size + filterInstance2[2].values.size;

        //Program Summary list
        var filterInstance3 = res[3].filtersData;
        var filtersTotalSize3 = filterInstance3[1].values.size + filterInstance3[2].values.size;

        //Workouts builder page
        var filterInstance4 = res[4].filtersData;
        var filtersTotalSize4 = filterInstance4[1].values.size + filterInstance4[2].values.size;

        return [filtersTotalSize, filtersTotalSize1, filtersTotalSize2, filtersTotalSize3, filtersTotalSize4];
      });

    }
    //Send workout object to make 
    async function sendWorkoutToMake(workout) {
      const editWorkout = sessionStorage.getItem('editWorkout');
      const duplicateWorkout = sessionStorage.getItem('duplicateWorkout');
      const createWorkout = sessionStorage.getItem('createWorkout');

      if(editWorkout == "true" && workout) {

        fetch("https://hook.us1.make.com/pwkfkgb3tfvse8vjuvh0m7y65vemr3q0", {
          method: "POST",
          headers: {'Content-Type': 'application/json'}, 
          body: JSON.stringify(workout)
        }).then(res => {
          //Set flag back
          sessionStorage.setItem('editWorkout', 'false');
          location.href = `${location.href}?showPage=workoutSummaryPage`;
          location.reload();
        });


      } else if((duplicateWorkout == "true" || createWorkout == "true") && workout) {

        fetch("https://hook.us1.make.com/7ukin7wskfgygdmvm3dyyol3aiu49re7", {
          method: "POST",
          headers: {'Content-Type': 'application/json'}, 
          body: JSON.stringify(workout)
        }).then((res) => {
          if (res.ok) {
            return res.text();
          }
          throw new Error('Something went wrong');
        })
        .then((data) => {
          
          sessionStorage.setItem('duplicateWorkout', 'false');
          sessionStorage.setItem('createWorkout', 'false');
          location.href = `${location.href}?showPage=workoutSummaryPage`;
          location.reload();
          
        })
        .catch((error) => {
          console.log(error);
          alert("Could not create workout, please try again");
          location.href = `${location.href}?showPage=workoutSummaryPage`;
        });
        
      }

    }

    //Send new selected workout of the week to make to update webflow cms
    async function updateWorkoutOfTheWeek(workoutOfTheWeek) {
      fetch("https://hook.us1.make.com/2clz3sgj85og9dv45xo1w9s2zwimpv19", {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(workoutOfTheWeek)
      }).then(res => {
        console.log("Workout of the week updated")
      });
    }

    //Delete chosen workout and all of its exercises related to it
    async function deleteWorkout(workout) {
      console.log("sending");
      fetch("https://hook.us1.make.com/eh9374j99jisjiba83t4tl7vulv7c74u", {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(workout)
      }).then(res => {
        console.log("Workout deleted");
        location.reload();
      });
    }

    function addWorkoutListEntry(listOfGuideIDs) {

      //Iterate through all guides
      var listOfGuides = document.getElementById("guideList").children;
      
      for(let i = 0; i < listOfGuides.length; i++) {
        if(listOfGuideIDs.includes(listOfGuides[i].querySelector("#itemID").innerText)) {
          //Add entry in guide to workout mapping
          createWorkoutListEntry(listOfGuides[i].querySelector("#itemID").innerText, listOfGuides[i].firstElementChild);
        }

      }
    }

    function clearWorkoutListEntry() {
      //Iterate through object and make sure each guide has its border colour changed back
      for (var guide in guideToWorkoutObj) {
        //Check if entry has values in it
        if(guideToWorkoutObj[guide].length > 0) {
          guideToWorkoutObj[guide][0].style.borderColor = "rgb(12, 8, 213)";
        }

      }
      //Clear object
      guideToWorkoutObj = {}
    }

    function checkIfLastExerciseInList(workoutKeyID) {

      //Remove an entry from guide to workout object
      var guideDiv = guideToWorkoutObj[workoutKeyID].pop();

      if(guideToWorkoutObj[workoutKeyID].length == 0) {
        return guideDiv;
      }

      return false;

    }

    function generateQRCode(link, gymName) {

      var qrcode = new QRCode(document.querySelector(".qr-code"), {
        text: `${link}?utm_campaign=${gymName}`,
        width: 300, //default 128
        height: 300,
        colorDark : "#0C08D5",
        colorLight : "#FFFFFF",
        correctLevel : QRCode.CorrectLevel.L
      });

      //Set link in session storage
      sessionStorage.setItem("workoutLink", `${link}?utm_campaign=${gymName}`);

    }

    async function sendProgramToMake(program) {

      if(sessionStorage.getItem("editProgram") == "true") {
        sendProgramRequestToMake("https://hook.us1.make.com/3od2849wruj9ermib4axnaitcyamhrs7", program);

      } else if(sessionStorage.getItem("createProgram") == "true") {
        sendProgramRequestToMake("https://hook.us1.make.com/l13ac46rk7sp9d3mnv6zshtscgkjxglm", program);
      }
    } 

    function sendProgramRequestToMake(destination, program) {
      fetch(destination, {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(program)
      }).then((res) => {
        if (res.ok) {
          return res.text();
        }
        throw new Error('Something went wrong');
      })
      .then((data) => {

        alert("Program Created Successfully!");
        //Reset program builder flags
        sessionStorage.setItem("editProgram", "false");
        sessionStorage.setItem("createProgram", "false");
        location.reload();

      })
      .catch((error) => {
        console.log(error);
        alert("Could not create program, please try again");
        location.reload();
      });
    }

    function prefillProgramBuilder(program, programType="builder") {

      // Convert the Start Date strings to Date objects
      var eventsData = "";
      if(programType == "userProgram") {
        eventsData = JSON.parse(program.querySelector("#summaryEventData").innerText);
      } else {
        eventsData = JSON.parse(program.querySelector("#eventData").innerText);
      }


      const events = eventsData.map(event => {
        const startDate = new Date(event["start"]);

        return {
          title: event.title,
          extendedProps: {"length": event.extendedProps.length, "targetArea": event.extendedProps.targetArea, "workoutID": event.extendedProps.workoutID},
          start: startDate,
          allDay: true
        };
      });
      
      // Extract and convert the "start" values into Date objects
      const dates = events.map(obj => obj.start);
      
      // Sort the dates in ascending order
      dates.sort((a, b) => a - b);


      //Set calendar initial date
      calendar.gotoDate( dates[0] )
      
      // Calculate the number of weeks between the first and last dates
      const millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
      const firstDate = dates[0];
      const lastDate = dates[dates.length - 1];
      var weeks = Math.ceil((lastDate - firstDate) / millisecondsPerWeek);

      if(firstDate.getDay() > 4) {
        weeks += 1;
      }
      
      //Populate calendar with events
      updateCalendar(events);

      if(programType == "builder") {
        //Populate name and description.
        document.getElementById("programName").value = program.querySelector("#programSummaryName").innerText;
        document.getElementById("programDescription").value = program.querySelector("#programSummaryDescription").innerText;

        //Populate experience and goal
        document.getElementById("programExperience").value = program.querySelector("#programSummaryExperience").innerText;
        document.getElementById("programGoal").value = program.querySelector("#programSummaryGoal").innerText;

        //Populate hidden program ID field
        document.getElementById("programSummaryID").value = program.querySelector("#programID").innerText;

        //Show Calendar
        document.getElementById("programPage").style.display = "none";
        document.getElementById("programBuilder").style.display = "block";
        //Show form inputs for program builder
        var programBuilderInfo = document.getElementById("programBuilderInfo");
        programBuilderInfo.style.display = "flex";
        programBuilderInfo.style.flexDirection = "row";
        programBuilderInfo.style.alignContent = "flex-end";
        programBuilderInfo.style.justifyContent = "space-between";
        document.getElementById("programBuilderInfo").style.display = "flex";

      }

      refreshCalendarLayout();

      if(weeks > 4) {
        //Update calendar weeks if necessary
        updateCalendarWeeks(weeks);
      } else {
        updateCalendarWeeks(weeks);
      }

      //If going to program builder then hide week start and end dates:
      if(programType == "builder") {
        showOrHideWeekRange("none");
      } else {
        showOrHideWeekRange("block");
      }

      //Show or hide the save training plan button
      // if(programType == "programSelect") {
      //   document.getElementById("saveTrainingPlan").style.display = "block";
      // } else {
      //   document.getElementById("saveTrainingPlan").style.display = "none";
      // }
    }

    function addWorkoutToProgramModalList(events) {

      // Parse events data
      var workouts = JSON.parse(events);

      // Get template element
      var programList = document.getElementById("programModalList");
      var index = 1;
      // Iterate through each object in the JSON array
      workouts.forEach(function(workout) {
        // Extract and fill the required information

        var workoutSummaryItem = programList.firstElementChild.cloneNode(true);

        var workoutName = workout.workoutName;
        var duration = workout.Duration;
        var targetArea = workout["Target Area"];

        workoutSummaryItem.querySelector("#workoutModalHeading").innerText = workoutName;
        workoutSummaryItem.querySelector("#workoutModalDuration").innerText = duration;
        workoutSummaryItem.querySelector("#workoutModalFocusArea").innerText = targetArea;
        workoutSummaryItem.querySelector("#workoutNumber").innerText = `Workout ${index}.`;

        workoutSummaryItem.style.display = "block";
        programList.append(workoutSummaryItem);

        index += 1

      });

      //Add week buttons to paginate through workout, based on number of workouts
      //var numWeeks = document.getElementById("programWeeks").innerText;
      var numWeeks = document.getElementById("selectedProgramWeeks").innerText;
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

      // Sort the workouts array based on the 'Start Date' field
      workouts.sort((a, b) => {
        const dateA = moment(a['Start Date'], 'DD/MM/YYYY');
        const dateB = moment(b['Start Date'], 'DD/MM/YYYY');
        return dateA - dateB;
      });
      
      const weeks = [];
      let currentWeek = [];
      
      for (const workout of workouts) {
        const startDate = moment(workout['Start Date'], 'DD/MM/YYYY');
        let endOfWeek = null;
        
        // Get end of week for current array
        if (currentWeek.length > 0) {
          endOfWeek = getEndOfWeek(currentWeek[0]['Start Date']);
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


    }

    function getEndOfWeek(date) {
      // Parse the input date using Moment.js
      const inputDate = moment(date, 'DD/MM/YYYY');
  
      // Calculate the end of the week (Sunday) using Moment.js
      const endOfWeek = inputDate.endOf('week').isoWeekday(7);
  
      // Format the end of the week as a string in the format "DD/MM/YYYY"
      const formattedEndOfWeek = endOfWeek.format('DD/MM/YYYY');
  
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
          if(workoutListElement.innerText == workout.workoutID ) {
            workoutElement = workoutListElement;
          }
        }
        if (workoutElement && workoutElement.textContent === workout.workoutID) {
  
          var newElement = workoutElement.closest('.collection-item-7').cloneNode(true);
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


    function updateCalendar(events=null) {
      
      //Remove all current events:
      calendar.removeAllEvents();

      //Add events:
      for(let i = 0; i < events.length; i++) {
        calendar.addEvent(events[i]);
      }

    }
    
    function showOrHideWeekRange(display) {
      var weekRanges = document.querySelectorAll(".week-range");
      for(var i = 0; i < weekRanges.length; i++) {
        weekRanges[i].style.display = display;
      }
    }

    function updateCalendarWeeks(overrideWeeks=0, programType="builder") {

      if(overrideWeeks != 0 && overrideWeeks > 4) {

        currentNumberOfWeeks = overrideWeeks;
      
      } else if(overrideWeeks != 0 && overrideWeeks <= 4) {
        currentNumberOfWeeks = 5;
      } else {
        //Increment current number of weeks
        currentNumberOfWeeks += 1;
      }

      calendar.setOption('duration', { weeks: currentNumberOfWeeks });
      
      // Re-render the calendar with the updated view
      calendar.changeView('timeGridDay');
      calendar.changeView('dayGridFourWeek');

      var eventCells = document.querySelectorAll(".fc-daygrid-day-frame");
      for(let i = 0; i < eventCells.length; i++) {
        eventCells[i].style.height = "110px";
        eventCells[i].style.minHeight = "110px";
      }
      if(overrideWeeks == 0) {
        document.querySelector('.fc-scrollgrid-sync-table').scrollIntoView({behavior: "smooth", block: "end", inline: "end"});
      }
      
      calendar.render();

      if(programType == "builder") {
        showOrHideWeekRange("none");
      } else {
        showOrHideWeekRange("block");
      }
    }

    function prefillWorkoutBuilder(workoutSummary, programWorkout=false) {

      if(!programWorkout) {
        //Get all necessary values from row selected
        var workout = getWorkoutExerciseInformation(workoutSummary);
    
        //Hide summary screen and show builder
        document.getElementById("workoutBuilderPage").style.display = "block";
        document.getElementById("workoutSummaryPage").style.display = "none";
    
        //Fill all workout summary fields first
        document.getElementById("workoutName").value = workout.workoutName;
        document.getElementById("estTime").value = workout.workoutDuration;
        document.getElementById("focusArea").value = workout.workoutFocusArea;
        document.getElementById("experience").innerText = workout.workoutDifficulty;
        document.getElementById("workoutDescription").value = workout.workoutSummaryDescription;
        document.getElementById("workoutSummaryID").innerText = workout.workoutSummaryID;
        document.getElementById("workoutSummaryFullName").innerText = workout.workoutFullName;
      } else {
        var workout = workoutSummary;
      }

  
      var listOfGuideIDs = [];
      //Copy guide template and replace all values with exercise from workout
      for(var i = 0; i < workout.exercises.length; i++) {
  
        //Add guide ID to list
        listOfGuideIDs.push(workout.exercises[i].exerciseGuideID);
  
        var copyOfGuide = document.querySelector("#individualGuide:not([addedToList]").cloneNode(true);

        copyOfGuide.setAttribute("addedToList", 'true');

        copyOfGuide.querySelector("#guideName").innerText = workout.exercises[i].exerciseShortName;

        var thumbnailSplit = workout.exercises[i].exerciseThumbnailURL.split(",");
        //Check if there are multiple thumbails, randomly select one if so
        if(thumbnailSplit.length > 1) {
          var randomNumber = Math.random();
          if(randomNumber < 0.5) {
            copyOfGuide.querySelector(".exerciseThumbnail").src = thumbnailSplit[1];
          } else {
            copyOfGuide.querySelector(".exerciseThumbnail").src = thumbnailSplit[0];
          }
        } else {
          copyOfGuide.querySelector(".exerciseThumbnail").src = workout.exercises[i].exerciseThumbnailURL
        }
        copyOfGuide.querySelector("#exerciseMuscleImage").src = workout.exercises[i].exerciseMuscleImage;
  
        //Change ID of exercise name
        copyOfGuide.querySelector("#guideName").id = "workoutExercisename";

        
        //Ensure proper guide ID is set
        copyOfGuide.querySelector("#itemID").innerText = workout.exercises[i].exerciseGuideID;
  
        //Remove info button
        copyOfGuide.querySelector("#guideLinkInfo").remove();
  
        //Copy thumbnail and svg person into a separate div
        var exerciseThumbnail = $(copyOfGuide).find("#exerciseThumbnail").detach();
        var svgPersonDiv = $(copyOfGuide).find("#exerciseInfoRight").detach();
  
        if(!programWorkout) {
          addExerciseToWorkoutList(copyOfGuide, workout.exercises[i], true, exerciseThumbnail, svgPersonDiv);
        } else {
          addExerciseToWorkoutList(copyOfGuide, workout.exercises[i], true, exerciseThumbnail, svgPersonDiv, true);
        }
        
      }
      if(!programWorkout) {
        //Add workout entry for green border colour
        addWorkoutListEntry(listOfGuideIDs);
      }

    }

    //Given a row of a workout, extract all data points within each
    function getWorkoutExerciseInformation(selectedWorkout, programWorkout=false) {
      var workout = {};
  
      // Workout name
      workout["workoutName"] = selectedWorkout.querySelector("#workoutSummaryName").innerText;
      // Workout duration
      workout["workoutDuration"] = selectedWorkout.querySelector("#workoutDuration").innerText;
      // Workout focus area
      workout["workoutFocusArea"] = selectedWorkout.querySelector("#workoutFocusArea").innerText;
      // Workout Difficulty
      workout["workoutDifficulty"] = selectedWorkout.querySelector("#workoutDifficulty").innerText;
      // Workout Description
      workout["workoutSummaryDescription"] = selectedWorkout.querySelector("#workoutSummaryDescription").innerText;
  
      // Only set ID and full name if user is editing the workout
      if(sessionStorage.getItem('editWorkout') == "true" || programWorkout) {
        // Workout ID
        workout["workoutSummaryID"] = selectedWorkout.querySelector("#workoutID").innerText;
        //Workout Full Name
        workout["workoutFullName"] = selectedWorkout.querySelector("#workoutFullName").innerText;
      }
  
  
      var exercises = [];
  
      const workoutListElements = selectedWorkout.querySelector("#workoutExerciseList").children;
      for(var i = 0; i < workoutListElements.length; i++) {
        const workoutDetails = workoutListElements[i];
        var exercise = {};
        // Exercise name
        exercise["exerciseShortName"] = workoutDetails.querySelector("#exerciseShortName").innerText;
        // Thumbnail
        exercise["exerciseThumbnailURL"] = workoutDetails.querySelector("#exerciseThumbnailURL").innerText;
        // SVG man link
        exercise["exerciseMuscleImage"] = workoutDetails.querySelector("#exerciseMuscleImage").innerText;
        // Sets
        exercise["exerciseSets"] = workoutDetails.querySelector("#exerciseSets").innerText;
        // Reps
        exercise["exerciseReps"] = workoutDetails.querySelector("#exerciseReps").innerText;
        // Rest minutes
        exercise["exerciseRestMins"] = workoutDetails.querySelector("#exerciseRestMins").innerText;
        // Rest seconds
        exercise["exerciseRestSecs"] = workoutDetails.querySelector("#exerciseRestSecs").innerText;
        // Rest bewteen minutes
        exercise["exerciseRestBetweenMins"] = workoutDetails.querySelector("#exerciseRestBetweenMins").innerText;
        // Rest between seconds
        exercise["exerciseRestBetweenSecs"] = workoutDetails.querySelector("#exerciseRestBetweenSecs").innerText;
        // Exercise item ID
        exercise["exerciseItemID"] = workoutDetails.querySelector("#exerciseItemID").innerText;
  
        // Exercise Full Name
        exercise["exerciseFullName"] = workoutDetails.querySelector("#exerciseFullName").innerText;
  
        //Exercise Guide ID
        exercise["exerciseGuideID"] = workoutDetails.querySelector("#exerciseGuideID").innerText;
        
        //Add exercise object to exercises list
        exercises.push(exercise);
      }
  
      //Add list of exercises to workout object
      workout["exercises"] = exercises;
  
      return workout;
    }

    function checkAndClearProgram(destinationScreen, secondaryDestination=null) {
      //Check if text boxes have values or events exist
      const programBuilderName = document.getElementById("programName").value;
      const programBuilderDescription = document.getElementById("programDescription").value;
      const programBuilderEvents = calendar.getEvents();

      if(programBuilderName != "" || programBuilderDescription != "" || programBuilderEvents.length > 0) {

        if(programBuilderName != "") {
          document.getElementById("closingText").innerText = `Do you want to save the changes to your workout \"${programBuilderName}\"?`;
        } else {
          document.getElementById("closingText").innerText = "Do you want to save the changes to your program?";
        }

        //Show Modal
        var closeBuilderModal = document.getElementById("confirmCloseBuilder");
        //Set flex styling:
        closeBuilderModal.style.display = "flex";
        closeBuilderModal.style.flexDirection = "column";
        closeBuilderModal.style.justifyContent = "center";
        closeBuilderModal.style.alignItems = "center";
        //Show modal:
        closeBuilderModal.display = "block";

        //Navigate to selected page
        document.getElementById("dontSave").onclick = function() {

          //Close modal
          document.getElementById("confirmCloseBuilder").style.display = "none";
          //Hide and clear program builder or program summary
          document.getElementById("programBuilder").style.display = "none";
          document.getElementById("programPage").style.display = "none";

          //Clear session storage
          sessionStorage.setItem('editProgram', 'false');
          sessionStorage.setItem('duplicateProgram', 'false');
          sessionStorage.setItem('createProgram', 'false');
          sessionStorage.setItem('createUserProgram', 'false');

          //Clear program entries
          clearProgram();

          document.getElementById("workoutRadio").click();
          //Click workout radio button
          checkProgramWorkoutCheckBox();

          document.getElementById("summaryRadioButton").click();
          //Click summary radio button
          checkSummaryTrainingCheckBox();

          if(destinationScreen != "workoutSummaryPage") {
            document.getElementById("workoutSummaryPage").style.display = "none";
            document.getElementById("workoutBuilderPage").style.display = "none";
          } else if(destinationScreen != "usersBody" || destinationScreen != "userInfoDetails") {
            document.getElementById("usersBody").style.display = "none";
            document.getElementById("userSummaryPage").style.display = "none";
          }

          document.getElementById(destinationScreen).style.display = "block";
          
          if(secondaryDestination != null) {
            document.getElementById(secondaryDestination).style.display = "block";
          }
        }

      } else {
        document.getElementById("programBuilder").style.display = "none";
        document.getElementById("programPage").style.display = "none";


        document.getElementById("workoutRadio").click();
        //Click workout radio button
        checkProgramWorkoutCheckBox();

        document.getElementById("summaryRadioButton").click();
        //Click summary radio button
        checkSummaryTrainingCheckBox();

        document.getElementById("workoutSummaryPage").style.display = "none";
        document.getElementById("workoutBuilderPage").style.display = "none";

        if(destinationScreen != "userInfoDetails") {
          document.getElementById("usersBody").style.display = "none";
          document.getElementById("userDetailsPage").style.display = "none";
        }

        
        document.getElementById(destinationScreen).style.display = "block";

        if(secondaryDestination != null) {
          document.getElementById(secondaryDestination).style.display = "block";
        }

        //Clear session storage
        sessionStorage.setItem('editProgram', 'false');
        sessionStorage.setItem('duplicateProgram', 'false');
        sessionStorage.setItem('createProgram', 'false');
        sessionStorage.setItem('createUserProgram', 'false');

        //Clear program entries
        clearProgram();
      }

    }

    function clearProgram() {

      //Clear title
      document.getElementById("programName").value = "";

      //Clear description
      document.getElementById("programDescription").value = "";

      //Clear events
      calendar.removeAllEvents();

    }

    function checkProgramWorkoutCheckBox() {
      //Style if going to workouts
      const checkedRadioInput = document.querySelector('input[type="radio"][name="workoutProgram"]:checked');
      const checkedSpanElement = checkedRadioInput.nextElementSibling;
      
      checkedSpanElement.style.backgroundColor = '#FFFFFF';
      checkedSpanElement.style.border = '0px';
      checkedSpanElement.style.borderRadius = '8px';
      checkedSpanElement.style.color = '#0C08D5';

      const uncheckedRadioInputs = document.querySelectorAll('input[type="radio"][name="workoutProgram"]:not(:checked)');

      uncheckedRadioInputs.forEach((radioInput) => {
        const spanElement = radioInput.nextElementSibling;
      
        spanElement.style.backgroundColor = 'initial';
        spanElement.style.border = 'initial';
        spanElement.style.borderRadius = 'initial';
        spanElement.style.color = 'initial';
      });
    }

    function checkAndClearWorkouts(destinationScreen, secondaryDestination=null) {
      resetGeneralFilters();
      //Check if list size is > 1 and obtain values for workout summary inputs to check if they are empty or not
      const workoutList = document.getElementById("workoutList").children;
      const workoutTitle = document.getElementById("workoutName").value;
      const workoutDuration = document.getElementById("estTime").value;
      const workoutFocusArea = document.getElementById("focusArea").value;
      const workoutDescription = document.getElementById("workoutDescription").value;
      if (workoutList.length > 1 || workoutTitle != "" || workoutDuration != "Duration" || workoutFocusArea != "Focus Area" || workoutDescription != "") {
  
        if (workoutTitle != "") {
          //Set workout name text in modal
          document.getElementById("closingText").innerText = `Do you want to save the changes to your workout \"${workoutTitle}\"?`;
        } else {
          document.getElementById("closingText").innerText = "Do you want to save the changes to your workout?";
        }
  
        var closeBuilderModal = document.getElementById("confirmCloseBuilder");
        //Set flex styling:
        closeBuilderModal.style.display = "flex";
        closeBuilderModal.style.flexDirection = "column";
        closeBuilderModal.style.justifyContent = "center";
        closeBuilderModal.style.alignItems = "center";
        //Show modal:
        closeBuilderModal.display = "block";
  
        //Navigate to selected page
        document.getElementById("dontSave").onclick = function() {

          //Close modal
          document.getElementById("confirmCloseBuilder").style.display = "none";
          //Hide and clear workout builder
          document.getElementById("workoutBuilderPage").style.display = "none";
          document.getElementById("workoutSummaryPage").style.display = "none";

          document.getElementById(destinationScreen).style.display = "block";
  
          //Clear session storage
          sessionStorage.setItem('editWorkout', 'false');
          sessionStorage.setItem('duplicateWorkout', 'false');
          sessionStorage.setItem('createWorkout', 'false');
  
          //Clear workout to guide list mapping
          clearWorkoutListEntry();
  
          clearWorkoutExerciseList();

          if(secondaryDestination != null) {
            document.getElementById(secondaryDestination).style.display = "block";
          }
        }
  
      } else {
        workoutBuilderPage.style.display = "none";
        document.getElementById("workoutSummaryPage").style.display = "none";
        document.getElementById("usersBody").style.display = "none";
        document.getElementById("userDetailsPage").style.display = "none";
        document.getElementById(destinationScreen).style.display = "block";

        if(secondaryDestination != null) {
          document.getElementById(secondaryDestination).style.display = "block";
        }
  
        //Clear session storage
        sessionStorage.setItem('editWorkout', 'false');
        sessionStorage.setItem('duplicateWorkout', 'false');
        sessionStorage.setItem('createWorkout', 'false');
  
        //Clear workout to guide list mapping
        clearWorkoutListEntry();
      }
  
      //Ensure svg man is shown and exercise list is hidden
      //Hide list
      document.getElementById("guideListParent").style.display = "none";
      //Show svg man
      document.getElementById("ajaxContent").style.display = "block";
      //Clear filters
      resetFilters();
    }



    function clearProgramModalList() {

      var programList = document.getElementById("programModalList").children;

      //Show first exercise placeholder
      var programPlaceholder = document.getElementById("selectProgramPlaceholder");
          
      programPlaceholder.style.display = "flex";
      programPlaceholder.style.flexDirection = "column";
      programPlaceholder.style.justifyContent = "center";
      programPlaceholder.style.alignItems = "center";
  
      // Clear workout name
      document.getElementById("selectedProgramName").innerText = "";

      //Reset description value
      document.getElementById("selectedProgramDescription").value = "";
    
      const programFirstElement = programList[0];

      //Loop through list and remove selected exercises
      while(programFirstElement.nextSibling != null) {
        programFirstElement.nextSibling.remove()
      }
      
      //Remove week buttons
      var weekButtonList = document.querySelectorAll(".week-button");
      console.log(weekButtonList);
      for(var i = 0; i < weekButtonList.length; i++) {
        if(weekButtonList[i].id != "week-1") {
          console.log(`removing ${i}`)

          weekButtonList[i].remove();
        }

      }

    }
  
    function clearWorkoutExerciseList(programWorkout=false) {
      var workoutList = "";
      if(!programWorkout) {
        workoutList = document.getElementById("workoutList").children;
        //Show first exercise placeholder
        document.getElementById("firstExercisePlaceholder").style.display = "block";
        //Hide submit button
        document.getElementById("saveWorkout").style.display = "none";
    
        // Clear workout name
        document.getElementById("workoutName").value = "";
        // Reset duration value
        document.getElementById("estTime").value = "Duration";
        // Reset focus area value
        document.getElementById("focusArea").value = "Focus Area";
        //Reset description value
        document.getElementById("workoutDescription").value = "";
        // Reset experience value
        document.getElementById("experience").innerText = "Beginner";
      } else {
        workoutList = document.getElementById("programWorkoutList").children;

        //Show first exercise placeholder
        var workoutProgramPlaceholder = document.getElementById("selectWorkoutPlaceholder");
            
        workoutProgramPlaceholder.style.display = "flex";
        workoutProgramPlaceholder.style.flexDirection = "column";
        workoutProgramPlaceholder.style.justifyContent = "center";
        workoutProgramPlaceholder.style.alignItems = "center";

        //Hide workout summary div
        document.getElementById("workoutProgramSummary").style.display = "none";
    
        // Clear workout name
        document.getElementById("selectedWorkoutName").value = "";

        // Reset duration value
        document.getElementById("selectedWorkoutDuration").value = "";
        // Reset focus area value
        document.getElementById("selectedWorkoutFocusArea").value = "";
        //Reset description value
        document.getElementById("selectedWorkoutDescription").value = "";
        // Reset experience value
        document.getElementById("selectedWorkoutExperience").innerText = "";
      }
      
      const firstElement = workoutList[0];

      //Loop through list and remove selected exercises
      while(firstElement.nextSibling != null) {
        firstElement.nextSibling.remove()
      }

    }

    function showModal(destinationDiv) {

      //Show modal
      var modalStyle = document.getElementById("modalWrapper");

      modalStyle.style.display = "flex";
      modalStyle.style.flexDirection = "column";
      modalStyle.style.justifyContent = "center";
      modalStyle.style.alignItems = "center";
  
      var destinationModalDiv = document.getElementById(destinationDiv);
      destinationModalDiv.style.display = "flex";
      destinationModalDiv.style.flexDirection = "row";
      destinationModalDiv.style.justifyContent = "center";

    }

    /*
      jQuery for limiting number inputs
    */
    $("#sets, #reps, #exerciseRestMinutes, #exerciseRestSeconds, #restBetweenExerciseSeconds, #restBetweenExerciseMinutes").each(function() {
      var id = $(this).attr("id");
    
      switch (id) {
        case "sets":
          $(this).attr({
            "min": 0,
            "value": 3
          });
          break;
        case "reps":
          $(this).attr({
            "min": 0,
            "value": 12
          });
          break;
        case "exerciseRestMinutes":
          $(this).attr({
            "min": 0,
            "max": 9,
            "value": 3
          });
          break;
        case "exerciseRestSeconds":
        case "restBetweenExerciseSeconds":
          $(this).attr({
            "min": 0,
            "max": 45,
            "step": 15,
            "value": 0
          });
          break;
        case "restBetweenExerciseMinutes":
          $(this).attr({
            "min": 0,
            "value": 3
          });
          break;
        default:
          break;
      }
    });
      
    $('#focusArea').each( function () {
      $(this).children('option:first').attr("disabled", "disabled");
    });
    $('#estTime').each( function () {
      $(this).children('option:first').attr("disabled", "disabled");
    });
    $("#focusArea").attr("required", true);
    $("#estTime").attr("required", true);
    
  });
}
