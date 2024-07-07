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

async function main() {

  //Make a sortable list:
  var sortable = new Sortable(document.getElementById("programWorkoutList"), {
    animation: 150,
    swapThreshold: 0.2, // Adjust this value as needed
  });

  var workoutSortable = new Sortable(document.getElementById("workoutList"), {
    animation: 150,
    dragClass: "sortable-ghost",  // Class name for the dragging item
    onEnd: function (evt) {
      // Get all superset elements
      var supersetIcons = document.getElementById("workoutList").querySelectorAll(".supersetparent");
      
      // Loop through the superset elements and set visibility
      supersetIcons.forEach(function(icon, index) {
        if (index === supersetIcons.length - 1) {
          // Hide the last superset element
          icon.style.display = 'none';
        } else {
          // Show all other superset elements
          icon.style.display = 'flex';
        }
      });

      // Restore .div-block-502 after dragging ends
      var supersetparent = evt.item.querySelector('.div-block-502');
      if (supersetparent) {
        supersetparent.style.display = '';
      }
    },
    setData: function (/** DataTransfer */dataTransfer, /** HTMLElement*/dragEl) {
      // Temporarily hide .div-block-502 while dragging
      var supersetparent = dragEl.querySelector('.div-block-502');
      if (supersetparent) {
        supersetparent.style.display = 'none';
      }
    },
  });

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
    "erector-spinae":"Lower Back",
    "hips":"Hips"
  }

  var reverseMuscleMapping = {
    "Chest": "Pectoralis Major",
    "Quads": "Quadriceps",
    "Abs": "Rectus abdominis",
    "Biceps": "Biceps brachii",
    "Triceps": "Triceps brachii",
    "Shoulders": "Deltoids",
    "Obliques": "Obliques",
    "Traps": "Trapezius",
    "Lats": "Latissimus Dorsi",
    "Forearms": "Palmaris longus",
    "Glutes": "Gluteus Maximus",
    "Hamstrings": "Hamstrings",
    "Calves": "Gastrocnemius",
    "Lower Back": "Erector Spinae",
    "Hips":"Hips"
  };  

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
  var currentUserProgram = null;
  var workoutIndexCount = [];
  var userInputsChanged = false;
  var addStaffMemberFromSettings = false;
  var tableArr = [];
  sessionStorage.setItem("createUserProgram", "false");
  var prefillingProgram = true;
  var updatingCalendar = false;
  var exerciseCategories = new Set();
  var primaryMuscles = new Set();
  var secondaryMuscles = new Set();
  var responseData = "";
  sessionStorage.setItem("editExercise", "false");
  var updatedMedia = false;
  var currentCopiedWorkout = "";
  var globalWeightUnit = "";

  sessionStorage.setItem("createChallenge", 'false');
  sessionStorage.setItem("editChallenge", 'false');
    
  //Object to keep track of the guide -> exercise workout mapping
  //Object with guide ID as the key and array of guide divs as values
  var guideToWorkoutObj = {};

  //List to keep track of users training plan (list of programs added to their schedule)
  //Structure is each element in list is an object of the structure {"programID": "value", "programName": "value", "events": "value"}
 var userTrainingPlan = [];

  //Populate gym name text box value
  document.getElementById("gymNameTextBox").value = document.getElementById("gymFullName").innerText;

  //Request and get extra workout summary details for workouts that have more than 5 exercises
  const workoutSummaryListItems = document.querySelectorAll("#workoutSummaryList .workoutsummaryitem");
  for (var i = 0; i < workoutSummaryListItems.length; i++) {

    var workoutSummaryElement = workoutSummaryListItems[i];
    //Check if number of workouts is more than 5
    var nestedCollectionItems = workoutSummaryElement.querySelectorAll(".w-dyn-item");

    //Add each item into the new div so far:
    for(var j = 0; j < nestedCollectionItems.length; j++) {
      var clonedItem = nestedCollectionItems[j].cloneNode(true);
      workoutSummaryElement.querySelector("#newCollectionList").appendChild(clonedItem)
    }
  }

  addWorkoutDetails();

  //Check if any workouts have more than 5 (CMS limit) exercises and add them if not
  addMoreThanFiveWorkouts();

  //Add pending users
  addPendingUsers();

  addStatusToUsers();

  loadAndUpdateAllSummaries();

  //Calculate the days until the clients program ends or weight inputs aren't complete
  calculateProgramUrgencyDays();

  fetchDataFromWebhook()
  .then(result => {
    // Store the result in a variable
    responseData = result;
  })
  .catch(error => {
    // Handle errors if needed
    console.error('Error:', error);
  });

  // Add a blur event listener to the text input
  document.getElementById('videoLink').addEventListener('blur', function() {
    console.log("Updating media")
    updatedMedia = true;
  });

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

  function styleNavButtons(destinationButton) {
    
    //Reset background colour of all buttons:
    var navButtons = document.querySelectorAll(".navbutton");
    var middleNavButtons = document.querySelectorAll(".middlenavbutton");

    // Change background color to transparent for elements with class "navButton"
    for (var i = 0; i < navButtons.length; i++) {
      navButtons[i].classList.remove("clickednavbutton");
      navButtons[i].firstElementChild.style.display = "block";
      navButtons[i].firstElementChild.nextElementSibling.style.display = "none";
      navButtons[i].style.backgroundColor = "rgba(0,0,0,0)";
    }

    // Change background color to transparent for elements with class "middleNavButton"
    for (var i = 0; i < middleNavButtons.length; i++) {
      middleNavButtons[i].classList.remove("clickednavbutton");
      middleNavButtons[i].firstElementChild.style.display = "block";
      middleNavButtons[i].firstElementChild.nextElementSibling.style.display = "none";
      middleNavButtons[i].style.backgroundColor = "rgba(0,0,0,0)";
    }

    //Show required button
    var destinationDiv = document.getElementById(destinationButton);

    if(destinationButton == "dashboardPage") {
      destinationDiv.querySelector(".homeimage").style.display = "none";
      destinationDiv.querySelector(".naviconclicked").style.display = "block";
    } else if(destinationButton == "equipmentPage") {
      destinationDiv.querySelector(".equipment").style.display = "none";
      destinationDiv.querySelector(".equipmentclicked").style.display = "block";
    } else if(destinationButton == "userPage" ) {
      destinationDiv.querySelector(".users").style.display = "none";
      destinationDiv.querySelector(".users-clicked").style.display = "block";
    } else if(destinationButton == "challengesPage" ) {
      // destinationDiv.querySelector(".challenges").style.display = "none";
      // destinationDiv.querySelector(".challenges-clicked").style.display = "block";
    }else {
      destinationDiv.querySelector(".navicon").style.display = "none";
      destinationDiv.querySelector(".naviconclicked").style.display = "block";
    }
    //Colour div
    destinationDiv.classList.add("clickednavbutton");
    destinationDiv.style.backgroundColor = "#0C08D5";
  }

  function calculateWorkoutUrgencyDays() {

    //Adding urgency to client list
    const clientList = document.querySelectorAll("#clientList #userSummary");

    for(var i = 0; i < clientList.length; i++) {

      var fullProgramData = clientList[i].querySelector("#summaryFullEventData").innerText;
      var daysDifference = 0;

      if(fullProgramData != null && fullProgramData != "") {
        daysDifference = findEmptyWorkoutInput(JSON.parse(fullProgramData));
      }

      updateUrgencyDayText(clientList[i].querySelector("#customWorkouts"), daysDifference);

      styleWorkoutUrgencyDay(clientList[i].querySelector("#customWorkouts"), daysDifference);
    }
  }

  function addStatusToUsers() {
    //Set onclicks for user summary list
    var userSummaryList = document.querySelectorAll("#userSummary");
    for(let i = 0; i < userSummaryList.length; i++) {
      (function(userSummary) {
        var userStatus = userSummary.querySelector("#status").innerHTML;
        if(userStatus.toLowerCase() == "active") {
          userSummary.querySelector("#statusImg").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/653f6d26a948539fdb22c969_Active.webp";
        } else if(userStatus.toLowerCase() == "pending") {
          userSummary.querySelector("#statusImg").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/653f6d26b85dced5a62e2e02_Pending.webp";
        } else if(userStatus.toLowerCase() == "deactivated") {
          userSummary.querySelector("#statusImg").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/653f6d265b3f926a01a4b832_Deactivated.webp";
        }
          
      })(userSummaryList[i]);
    }
  }

  function calculateProgramUrgencyDays() {

    //Adding urgency to client list
    const clientList = document.querySelectorAll("#clientList #userSummary");

    for(var i = 0; i < clientList.length; i++) {

      if(clientList[i].querySelector("#customWorkouts").innerText == "x days") {
        //Get program date difference
        var customProgramDate = clientList[i].querySelector("#customProgram").innerText;

        // Parse the date using Moment.js
        var programDate = moment(customProgramDate, "YYYY-MM-DD");

        // Get today's date
        var today = moment();

        // Calculate the difference in days
        var daysDifference = programDate.diff(today, 'days');

        if(!customProgramDate) {
          daysDifference = 0;
        }

        updateUrgencyDayText(clientList[i].querySelector("#customProgram"), daysDifference);

        if(clientList[i].querySelector("#status").innerText.toLowerCase() == "active") {
          styleProgramUrgencyDay(clientList[i].querySelector("#customProgram"), daysDifference);
        }
      }
      
      
    }
  }

  function findEmptyWorkoutInput(jsonData) {
    // Get the current date
    const currentDate = moment().format("YYYY-MM-DD");
  
    let daysUntilStartDate = 0; // Initialise as 0 days
  
    // Iterate through the JSON array
    jsonData.some(item => { // Use .some() to stop iteration when a result is found
      // Check if 'loadAmount' is an empty string and 'quantityUnit' is not 'RIR' or 'RPE'
      var isBodyweight = checkIfExerciseIsBodyweight(item.guideID);

      if (item.loadAmount === "" && item.quantityUnit !== "RIR" && item.quantityUnit !== "RPE" && item.quantityUnit !== "%1RM" && !isBodyweight) {
        // Parse the 'startDate' attribute as a moment date
        const startDate = moment(item.startDate, "YYYY-MM-DD");

        // Check if 'startDate' is after the current date
        if (startDate.isSame(currentDate) || startDate.isAfter(currentDate)) {

          // Calculate the number of days until 'startDate'
          daysUntilStartDate = startDate.diff(currentDate, 'days');
          return true; // Exit the loop when a result is found
        }
      }
      return false; // Continue to the next item
    });
  
    return daysUntilStartDate; // Return the result
  }

  function checkIfExerciseIsBodyweight(guideID) {
    var guideList = document.querySelectorAll("#guideList .w-dyn-item");
    var foundBodyweightExercise = false; // Initialize the flag
  
    for (var i = 0; i < guideList.length; i++) {
      if(guideID == guideList[i].querySelector("#itemID").innerText) {
        var loadingMechanism = guideList[i].querySelector("#loadingMechanism").innerText;
        if (loadingMechanism == "Bodyweight" || loadingMechanism == "Band") {
          foundBodyweightExercise = true;
          break; // Exit the loop
        }
      }
    }
  
    return foundBodyweightExercise; // Return the flag's value
  }
  
  

  function updateUrgencyDayText(element, daysDifference) {
    if(daysDifference > 0) {
      element.innerText = `${daysDifference} days`;
    } else if(daysDifference == 1) {
      element.innerText = "1 day";
    } else {
      element.innerText = "0 days";
    }
  }

  function styleProgramUrgencyDay(element, daysDifference) {
    if(element.classList.contains("w-dyn-bind-empty")) {
      element.classList.remove("w-dyn-bind-empty");
    }
    if(daysDifference < 7) {
      element.style.backgroundColor = "rgba(238,29,41,0.25)";
      element.style.borderColor = "rgb(238,29,41)";
      element.style.color = "#EE1D29";
    } else if(daysDifference >= 7 && daysDifference < 14) {
      element.style.backgroundColor = "rgba(250,123,5,0.25)";
      element.style.borderColor = "#FA7B05";
      element.style.color = "#FA7B05";
    } else {
      element.style.backgroundColor = "rgba(8,213,139,0.25)";
      element.style.borderColor = "#08D58B";
      element.style.color = "#08D58B";
    }
    element.style.borderWidth = "1px";
    element.style.borderStyle = "solid";
  }

  function styleWorkoutUrgencyDay(element, daysDifference) {

    if(daysDifference < 2) {
      element.style.backgroundColor = "rgba(238,29,41,0.25)";
      element.style.borderColor = "rgb(238,29,41)";
      element.style.color = "#EE1D29";
    } else if(daysDifference >= 2 && daysDifference <= 5) {
      element.style.backgroundColor = "rgba(250,123,5,0.25)";
      element.style.borderColor = "#FA7B05";
      element.style.color = "#FA7B05";
    } else {
      element.style.backgroundColor = "rgba(8,213,139,0.25)";
      element.style.borderColor = "#08D58B";
      element.style.color = "#08D58B";
    }
    element.style.borderWidth = "1px";
    element.style.borderStyle = "solid";
    
  }

  function fetchDataFromWebhook() {
    const webhookUrl = "https://hook.us1.make.com/r3lx6402qp8qlikrak2cwq7tw13is7ws";
  
    return fetch(webhookUrl, {
      method: 'GET',
    })
      .then(response => {
        // Check if the request was successful (status code 2xx)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Return the response text
        return response.text();
      })
      .catch(error => {
        // Handle errors
        console.error('Fetch error:', error.message);
      });
  }

  function addPendingUsers() {

    for(var i = 1; i <= 20; i++) {
      if(localStorage.getItem(`newClientName-${i}`) != undefined) {
        var clientName = localStorage.getItem(`newClientName-${i}`);
        var clientEmail = localStorage.getItem(`newClientEmail-${i}`);
        if(checkIfEmailInList(clientEmail)) {
          localStorage.removeItem(`newClientName-${i}`);
          localStorage.removeItem(`newClientEmail-${i}`);
        } else {

          var firstName = clientName.split(' ')[0];
          var lastName = clientName.split(' ')[1];

          //Add client name to list
          var clientRow = document.querySelector("#clientList .w-dyn-item");

          //Check if there is no first item
          if(!clientRow) {
            clientRow = document.querySelector("#userSummaryEmpty").cloneNode(true);
            clientRow.style.display = 'grid';
          }

          if(clientRow) {
            clientRow = clientRow.cloneNode(true);
            clientRow.querySelector("#initials").innerText = firstName[0]+lastName[0];
            clientRow.querySelector("#userSummaryName").innerText = firstName + " " + lastName;
            clientRow.querySelector("#clientJoined").innerText = "";
            clientRow.querySelector("#clientType").innerText = "";
            clientRow.querySelector("#customWorkouts").innerText = "";
            clientRow.querySelector("#customWorkouts").style.backgroundColor = "";
            clientRow.querySelector("#customProgram").innerText = "";
            clientRow.querySelector("#summaryUserSlug").innerText = "";
            clientRow.querySelector("#customProgram").style.backgroundColor = "";
            clientRow.querySelector("#status").innerText = "Pending";
            clientRow.querySelector("#statusImg").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/653f6d26b85dced5a62e2e02_Pending.webp";
            clientRow.onclick = null; // Remove the old event
  
            clientRow.onclick = (event) => { 
              //Hide user summary list
              document.getElementById("userSummaryPage").style.display = "block";

              if(!event.target.closest("#userOptionsLink") && event.target.id != "copyInviteLinkDropdown") {
                alert("Please wait for your client to fill out the form before making a program"); 
              }

              document.getElementById("programPage").style.display = "none";
              document.getElementById("programBuilder").style.display = "none";
              document.getElementById("userDetailsPage").style.display = "none";
  
              
              return
            };

            if(document.querySelector("#clientList .w-dyn-item")) {
              document.getElementById("clientList").appendChild(clientRow);
            } else {

            //If not then append to list wrapper
            
            //Insert cloned item in wrapper list
            var listWrapper = document.querySelector(".clientlistwrapper");

            // Add clonedExercise as the first child of wrapper
            listWrapper.insertBefore(clientRow, listWrapper.firstChild);
            //Hide empty state
            document.querySelector(".userlistemptystate").style.display = "none";
            }
            
          }
          
        }

      }

    }

  }

  function checkIfEmailInList(email) {

    var clientList = document.querySelectorAll("#clientList .w-dyn-item");
    var emailFound = false;
    for(var i = 0; i < clientList.length; i++) {
      if(clientList[i].querySelector("#summaryUserEmail").innerText == email) {
        emailFound = true;
        break;
      }
    }
    return emailFound;

  }

  function addCustomWorkouts() {

    //List all custom exercises
    var customGuides = document.getElementById("exerciseLibraryList");
    if(customGuides) {
      customGuides = customGuides.children;
    } else {
      return;
    }

    for(var i = 0; i < customGuides.length; i++) {
      var exerciseUploadName = customGuides[i].querySelector("#exerciseLibraryName").innerText;
      var guideID = customGuides[i].querySelector("#exerciseLibraryID").innerText;
      var uploadPrimaryMuscles = customGuides[i].querySelector("#primaryExerciseLibraryMuscles").innerText;
      var uploadScientificMuscles = customGuides[i].querySelector("#primaryScientificExerciseLibraryMuscles").innerText;
      var videoThumbnail = customGuides[i].querySelector(".exerciseThumbnail").src;
      var muscleImage = customGuides[i].querySelector("#customExerciseMuscleImage").innerText;
      var guideLink = customGuides[i].querySelector("#libraryVideoSlug").innerText;
      var exeriseCategory = customGuides[i].querySelector("#exerciseLibraryCategory").innerText;

      var formData = new FormData();
      formData.append('exerciseName', exerciseUploadName);
      formData.append('primaryCasualMuscles', uploadPrimaryMuscles);
      formData.append('primaryScientificMuscles', uploadScientificMuscles);
      formData.append('guideID', guideID);
      formData.append('videoThumbnail', videoThumbnail);
      formData.append('gymName', document.getElementById("gymFullName").innerText);
      formData.append('muscleImage', muscleImage);
      formData.append('guideLink', guideLink);
      formData.append('exeriseCategory', exeriseCategory);

      cloneAndFillExerciseList(formData, true);

    }
    
  }

  async function resetFilters(onlyCheckboxes=false, addedItem=null) {
    window.fsAttributes = window.fsAttributes || [];
    window.fsAttributes.push([
      'cmsfilter',
      async (filterInstances) => {
        // The callback passes a `filterInstances` array with all the `CMSFilters` instances on the page.
        document.getElementById("exerciseSearch").value = "";

        for(var i = 0; i < filterInstances.length; i++)  {
          var formID = filterInstances[i].form.id;
          if(formID == "workoutBuilderForm") {
            if(addedItem) {
              filterInstances[i].listInstance.renderItems(true);
              filterInstances[i].listInstance.addItems([addedItem])
            }

            !onlyCheckboxes ? await filterInstances[i].resetFilters(filterKeys=["exercisename","casualmusclefilter"], null) : null;

            await filterInstances[i].resetFilters(filterKeys=["musclenamefilter"], null);

          } else if(formID == "userSummaryForm") {
            await filterInstances[i].resetFilters(filterKeys=["clientproduct"], null);
            await filterInstances[i].resetFilters(filterKeys=["clientproduct"], null);
          } else if(formID == "workoutSummaryFilters") {
            !onlyCheckboxes ? await filterInstances[i].resetFilters(filterKeys=["exercisename","casualmusclefilter"], null) : null;
          } 
        }

        //Clear focus area filters:
        document.getElementById("allFilter").click();
        document.getElementById("allFilter").focus();

      },
    ]);
  }


  function cloneAndFillExerciseList(formData, customGuide=false) {
    // Clone the first element
    const firstListItem = document.querySelector("#individualGuide:not([addedToList]").parentElement;
    const clonedElement = firstListItem.cloneNode(true);
    const guideListItem = clonedElement.querySelector("#individualGuide");
    //Add onclick
    guideListItem.onclick = (event) => {

      // Make sure when the info button is clicked, the exercise isn't added to the list
      if (event.target.id !== "guideLinkInfo" && event.target.id !== "guideLinkInfoImage") {
        var copyOfGuide = event.target.closest("#individualGuide").cloneNode(true);

        // Remove info button
        copyOfGuide.querySelector("#guideLinkInfo").style.display = "none";

        // Copy thumbnail and svg person into a separate div
        var exerciseThumbnail = $(copyOfGuide).find("#exerciseThumbnail").detach();
        var svgPersonDiv = $(copyOfGuide).find("#exerciseInfoRight").detach();

        // Change ID of exercise name
        copyOfGuide.querySelector("#guideName").id = "workoutExercisename";

        copyOfGuide.querySelector("#itemID").innerText = formData.get('guideID');

        // Ensure copy border colour is BF blue
        copyOfGuide.style.borderColor = "rgb(12, 8, 213)";

        addExerciseToWorkoutList(copyOfGuide, null, null, exerciseThumbnail, svgPersonDiv);

        createWorkoutListEntry(copyOfGuide.querySelector("#itemID").innerText, guideListItem);
      }
    };
  
    // Update fields with form data
    clonedElement.querySelector('#guideName').innerText = formData.get('exerciseName');
    clonedElement.querySelector('#exerciseDifficulty').innerText = ''; // Clear experience field
    clonedElement.querySelector('#itemID').innerText = formData.get('guideID');
    clonedElement.querySelector('#loadingMechanism').innerText = formData.get('exeriseCategory');
    
    // Clear and update casualMuscle field
    const casualMuscleFields = clonedElement.querySelectorAll('#casualMuscle');
    casualMuscleFields.forEach((field, index) => {
      if (index === 0) {
        field.innerText = formData.get('primaryCasualMuscles');
      } else {
        field.remove(); // Remove the extra elements
      }
    });

    // Clear and update scientificPrimaryMuscle field
    const scientificPrimaryMuscleFields = clonedElement.querySelectorAll('#scientificPrimaryMuscle');
    scientificPrimaryMuscleFields.forEach((field, index) => {
      if (index === 0) {
        field.innerText = formData.get('primaryScientificMuscles');
      } else {
        field.remove(); // Remove the extra elements
      }
    });
    
    // Clear gym fields and leave only one
    const gymFields = clonedElement.querySelectorAll('.text-block-52');
    gymFields.forEach((field, index) => {
      if (index === 0) {
        field.innerText = formData.get('gymName');
      } else {
        field.remove(); 
      }
    });



    //Set muscle image
    if(customGuide) {
      //Set muscle image
      clonedElement.querySelector('#exerciseMuscleImage').src = formData.get("muscleImage");

      //Set thumbnail
      clonedElement.querySelector('#exerciseThumbnail img').src = formData.get("videoThumbnail"); 

      //Set slug
      clonedElement.querySelector('#guideLinkInfo').href = `/guides/${formData.get("guideLink")}`; 


    } else {
      const newMuscleValue = formData.get('primaryScientificMuscles').toLowerCase().replace(/ /g, '-');
      clonedElement.querySelector('#exerciseMuscleImage').src = `https://d3l49f0ei2ot3v.cloudfront.net/WEBPs/${newMuscleValue}.webp`; 

      clonedElement.querySelector('#exerciseThumbnail img').src = ''; // Clear image source
    }
  

    clonedElement.querySelector('#exerciseDifficulty').innerText = ''; // Clear experience field
    clonedElement.querySelector('#exerciseName').innerText = ''; 

    //Update temp id
    clonedElement.querySelector('#exerciseListTempID').innerText = formData.get("tempID");

    resetFilters(false, clonedElement);
  
    // Append the cloned element to the document or do whatever is needed with it
    document.getElementById("guideList").insertBefore(clonedElement, firstListItem);

  }

  async function addWorkoutDetails() {

    // Select all elements with class 'userSummary'
    var workoutSummaries = document.querySelectorAll('#workoutSummaryList .workoutsummaryitem');

    // Define a function to perform the loading and updating for a single workout summary
    function loadAndUpdateWorkoutSummary(workoutSummary) {
      var summaryWorkoutSlug = $(workoutSummary).find('#workoutLink').prop("href");

      var summaryWorkoutNameField = $(workoutSummary).find('#workoutSummaryName');
      var summaryWorkoutDescriptionField = $(workoutSummary).find('#workoutSummaryDescription');
      var summaryWorkoutJSONField = $(workoutSummary).find('#workoutJSON');

      if (summaryWorkoutSlug) {

        // Use $.get to fetch the content of #fullEventData from the specified URL
        var getRequest = $.get(summaryWorkoutSlug, function (data, status) {
          if (status === 'success') {
            // Find #fullEventData in the fetched content and update the field
            var workoutName = $(data).find('#workoutHeaderName').html();
            var workoutDescription = $(data).find('#workoutDescription').html();
            //var workoutJSON = $(data).find('div').prevObject[39].id;
            var workoutJSON = $(data).find('#workoutJSON').html();

            summaryWorkoutNameField.html(workoutName);
            summaryWorkoutDescriptionField.html(workoutDescription);
            summaryWorkoutJSONField.html(workoutJSON);

          } else {
            alert('Error loading workout data for ' + summaryWorkoutSlug);
          }
        });
      
        return getRequest;
      } else {
        // Return a resolved promise
        return $.when();
      }
    }
    
  
    // Create an array to store the load requests for each user summary
    var loadRequests = [];
    
    // Iterate over each user summary and initiate the loading process
    $.each(workoutSummaries, function (index, workoutSummary) {
      var loadRequest = loadAndUpdateWorkoutSummary(workoutSummary);
      loadRequests.push(loadRequest);
    });

  }

  async function addMoreThanFiveWorkouts() {
    // Request and get extra workout summary details for workouts that have more than 5 exercises
    var workoutSummaryListItemsList = document.querySelectorAll("#workoutSummaryList .workoutsummaryitem");
    
    // Cache to store the workout details to avoid duplicate requests
    var workoutCache = {};
  
    // Function to perform the asynchronous $.get request for a single workout
    async function getWorkoutDetails(workoutSlug) {
      // Check if the result is already in the cache
      if (workoutCache[workoutSlug]) {
        return workoutCache[workoutSlug];
      }
  
      var url = window.location.origin + '/guides/' + workoutSlug;
      const data = await $.get(url);
      var $page = $(data);
    
      // Extract information from the retrieved page
      var workoutDetails = {
        workoutName: $page.find('#guideName').text(),
        exerciseFullName: $page.find('#fullGuideName').text(),
        exerciseGuideID: $page.find('#guideID').text(),
        exerciseItemID: $page.find('#guideID').text(),
        exerciseThumbnailURL: $page.find('#guideThumbnailURL').text(),
        exerciseMuscles: $page.find('#exerciseMuscles').text(),
        exerciseSets: "",
        muscleHighlightImage: $page.find('#muscleHighlightImage').attr('src')
      };
  
      // Store the result in the cache
      workoutCache[workoutSlug] = workoutDetails;
      
      return workoutDetails;
    }
  
    // Step 1: Collect all unique slugs
    var uniqueSlugs = new Set();
    
    for (var i = 0; i < workoutSummaryListItemsList.length; i++) {
      var workoutSummaryElement = workoutSummaryListItemsList[i];
      var workoutIDs = workoutSummaryElement.querySelector("#workoutIDs").innerText;
  
      if (workoutIDs != "" && workoutIDs != null && workoutIDs != undefined) {
        workoutIDs = workoutIDs.split(/,\s*/);
  
        if (workoutIDs.length > 5) {
          var existingIDs = workoutSummaryElement.querySelectorAll("#newCollectionList #exerciseLink");
          var existingIDArr = [];
  
          for (var j = 0; j < existingIDs.length; j++) {
            if (existingIDs[j].href.split("/").length > 4) {
              existingIDArr.push(existingIDs[j].href.split("/")[4]);
            }
          }
          const differenceArr = workoutIDs.filter(item => !existingIDArr.includes(item));
          differenceArr.forEach(slug => {
            if (slug) {
              uniqueSlugs.add(slug);
            }
          });
        }
      }
    }
  
    // Step 2: Make requests for all unique slugs
    var fetchPromises = Array.from(uniqueSlugs).map(slug => getWorkoutDetails(slug));
    await Promise.all(fetchPromises);
  
    // Step 3: Use the cache to populate the workout details
    for (var i = 0; i < workoutSummaryListItemsList.length; i++) {
      var workoutSummaryElement = workoutSummaryListItemsList[i];
      var workoutIDs = workoutSummaryElement.querySelector("#workoutIDs").innerText;
  
      if (workoutIDs != "" && workoutIDs != null && workoutIDs != undefined) {
        workoutIDs = workoutIDs.split(/,\s*/);
  
        if (workoutIDs.length > 5) {
          var existingIDs = workoutSummaryElement.querySelectorAll("#newCollectionList #exerciseLink");
          var existingIDArr = [];
  
          for (var j = 0; j < existingIDs.length; j++) {
            if (existingIDs[j].href.split("/").length > 4) {
              existingIDArr.push(existingIDs[j].href.split("/")[4]);
            }
          }
          const differenceArr = workoutIDs.filter(item => !existingIDArr.includes(item));
          for (var x = 0; x < differenceArr.length; x++) {
            if (differenceArr[x] != "") {
              var workoutSlug = differenceArr[x];
              // Get the cached workout details
              const workoutDetails = workoutCache[workoutSlug];
              if (workoutDetails) {
                // Now clone current row, replace values, append to end of cms nested list
                var clonedRow = workoutSummaryElement.querySelector(".w-dyn-item").cloneNode(true);
                clonedRow.querySelector("#exerciseShortName").innerText = workoutDetails.workoutName;
                clonedRow.querySelector("#exerciseFullName").innerText = workoutDetails.exerciseFullName;
                clonedRow.querySelector("#exerciseGuideID").innerText = workoutDetails.exerciseGuideID;
                clonedRow.querySelector("#exerciseItemID").innerText = workoutDetails.exerciseItemID;
                clonedRow.querySelector("#exerciseThumbnailURL").innerText = workoutDetails.exerciseThumbnailURL;
                clonedRow.querySelector("#exerciseSets").innerText = workoutDetails.exerciseSets;
                clonedRow.querySelector("#exerciseMuscleImage").innerText = workoutDetails.muscleHighlightImage;
                clonedRow.querySelector("#exerciseMuscles").innerText = workoutDetails.exerciseMuscles;
  
                workoutSummaryElement.querySelector("#newCollectionList").appendChild(clonedRow);
              }
            }
          }
        }
      }
    }
  }
  
  
   

  async function loadAndUpdateAllSummaries() {
    // Select all elements with class 'userSummary'
    var userSummaries = document.querySelectorAll('#userSummary');
  
    // Define a function to perform the loading and updating for a single user summary
    function loadAndUpdateSummary(userSummary) {
      var summaryUserSlug = $(userSummary).find('#summaryUserSlug').text().trim();
      var summaryFullEventDataField = $(userSummary).find('#summaryFullEventData');
      var summaryEventDataField = $(userSummary).find('#summaryEventData');

      var summaryUserName = $(userSummary).find('#userSummaryName').text();

      var programURL = window.location.origin + '/user-programs/' + summaryUserSlug;
      
      if (summaryUserSlug) {
        // Use $.get to fetch the content of #fullEventData from the specified URL
        var getRequest = $.get(programURL, function (data, status) {
          if (status === 'success') {
            // Find #fullEventData in the fetched content and update the field
            var fullEventData = $(data).find('#programFullEventData').html();
            var summaryEventData = $(data).find('#programEventData').html();
            summaryFullEventDataField.html(fullEventData);
            summaryEventDataField.html(summaryEventData);

          } else {
            alert('Error loading program data for ' + summaryUserName);
          }
        });
      
        return getRequest;
      } else {
        // Return a resolved promise
        return $.when();
      }
    }
    
  
    // Create an array to store the load requests for each user summary
    var loadRequests = [];
    
    // Iterate over each user summary and initiate the loading process
    $.each(userSummaries, function (index, userSummary) {

      if(userSummary.querySelector("#summaryEventData").innerText == "") {
        var loadRequest = loadAndUpdateSummary(userSummary);
        loadRequests.push(loadRequest);
      }

    });

    // Use $.when to wait for all load requests to complete
    $.when.apply($, loadRequests).then(function () {
      // Any additional code to run after all requests have completed
      calculateWorkoutUrgencyDays();
    });
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

  //Setting onclicks for exercise library items
  var exerciseLibraryItems = document.querySelectorAll(".exerciseguideitem");
  for(var i = 0; i < exerciseLibraryItems.length; i++) {
    exerciseLibraryItems[i].onclick = (event) => {

      if(!event.target.id.includes("exerciseOptions") && event.target.id != "deleteExercise") {
        //Prefill modal
        prefillExerciseLibraryForm(event.target.closest(".exerciseguideitem"));

        //Show Modal
        var createExerciseModal = document.getElementById("createExerciseModal");
        //Set flex styling:
        createExerciseModal.style.display = "flex";
        createExerciseModal.style.flexDirection = "column";
        createExerciseModal.style.justifyContent = "center";
        createExerciseModal.style.alignItems = "center";

      } else {
        
      }


    }
  }

  function prefillTaskModal(taskItem) {

    //Task Name
    document.getElementById("taskInputName").value = taskItem.querySelector("#taskListName").innerText;

    //Task Content Link
    document.getElementById("taskContentLink").value = taskItem.querySelector("#taskListContentLink").innerText;

    //Task Content file name

    if(taskItem.querySelector("#taskListFilename").innerText != "") {
      document.getElementById("contentContainer").innerText = `File: ${taskItem.querySelector("#taskListFilename").innerText}`
      document.getElementById("taskContentUploaded").style.display = "none";
    }

    // Select the image element
    const imgElement = taskItem.querySelector("#taskListContentImage img");
    // Check if the src attribute is not empty or contains only whitespace
    if (imgElement.getAttribute('src').trim() !== "") {
      document.getElementById("uploadImage2").src = imgElement.src;
      document.getElementById("taskProductFile").style.display = "none";
    }

    //Affiliate code / description
    document.getElementById("taskDescription").value = taskItem.querySelector("#taskListDescription").innerText;

    //Task id
    document.getElementById("taskID").value = taskItem.querySelector("#taskListItemID").innerText;

    document.getElementById("submitTask").innerText = "Update";

    sessionStorage.setItem("editTask", "true");

    taskItem.classList.add("editedTask");

  }

    function prefillExerciseLibraryForm(exerciseItem) {

      //Set edit flag
      sessionStorage.setItem("editExercise", "true");
      var exercideUploadName = exerciseItem.querySelector("#exerciseLibraryName").innerHTML;

      // Exercise name
      document.getElementById("uploadExerciseName").value = exercideUploadName;

      // Category
      const category = exerciseItem.querySelector("#exerciseLibraryCategory").innerText;

      const categories = category.split(",");

      var categoryOptions = document.querySelectorAll(".categorytext");

      categories.forEach(function(categoryItem) {
        for(var j = 0; j < categoryOptions.length; j++) {
          if(categoryItem == categoryOptions[j].innerText) {
            exerciseCategories.add(categoryItem);
            categoryOptions[j].classList.add("categorytextselected");
            categoryOptions[j].classList.remove("categorytext");
            break;
          }
        }
      });

      //Primary muscle
      const selectedPrimaryMuscle = exerciseItem.querySelector("#primaryExerciseLibraryMuscles").innerHTML;

      const selectedPrimaryMuscles = selectedPrimaryMuscle.split(",");

      var selectedPrimaryMuscleOptions = document.querySelectorAll(".primarymuscletext");

      selectedPrimaryMuscles.forEach(function(primaryMuscle) {
        for(var j = 0; j < selectedPrimaryMuscleOptions.length; j++) {
          if(primaryMuscle.trim() == selectedPrimaryMuscleOptions[j].innerText) {
            primaryMuscles.add(primaryMuscle);
            selectedPrimaryMuscleOptions[j].classList.add("primarytextselected");
            selectedPrimaryMuscleOptions[j].classList.remove("primarymuscletext");
            break;
          }
        }
      });

      //Seconday muscle
      const selectedSecondaryMuscle = exerciseItem.querySelector("#secondaryExerciseLibraryMuscles").innerHTML;

      const selectedSecondaryMuscles = selectedSecondaryMuscle.split(",");

      var selectedSecondaryMuscleOptions = document.querySelectorAll(".secondarymuscletext");

      selectedSecondaryMuscles.forEach(function(secondaryMuscle) {
        for(var j = 0; j < selectedSecondaryMuscleOptions.length; j++) {
          if(secondaryMuscle == selectedSecondaryMuscleOptions[j].innerText) {
            secondaryMuscles.add(secondaryMuscle);
            selectedSecondaryMuscleOptions[j].classList.add("secondarytextselected");
            selectedSecondaryMuscleOptions[j].classList.remove("secondarymuscletext");
            break;
          }
        }
      });

      //exercise notes
      var exerciseNotes = exerciseItem.querySelector('#libraryExerciseNotes').innerHTML;

      //Set exercise note field
      document.querySelector(".editor").innerHTML = exerciseNotes;

      // Video link
      const uploadType = exerciseItem.querySelector("#uploadType").innerText;
      
      if(uploadType.toLowerCase() == "true") {
        document.getElementById("videoLink").value = exerciseItem.querySelector("#libraryVideoLink").innerHTML;
      } else {
        document.getElementById("fileNameContainer").innerText = `File: ${exercideUploadName}.mp4`
        document.getElementById("fileUploadLink").innerText = exerciseItem.querySelector("#libraryVideoLink").innerHTML;
      }

      //Update text
      document.getElementById("submitCreateExercise").innerText = "Update";

      //Guide Id
      document.getElementById("libraryFormGuideID").innerText = exerciseItem.querySelector("#exerciseLibraryID").innerText;
      

    }

    function addExerciseToWorkoutList(copyOfGuide, exerciseInformation=null, prefill=null, thumbnail=null, svgPerson=null, programWorkout= false, jsonExercises=null, exerciseList=null) {
      //Get current guide and add to workout list
      var workoutList = "";
      if(!programWorkout) {
        workoutList = document.getElementById("workoutList");
      } else {
        workoutList = document.getElementById("programWorkoutList");
      }
      if(jsonExercises != null && exerciseList != null) {
        for(var i = 0; i < exerciseList.length; i++) {
          createWorkoutExerciseElement(exerciseList[i][0], workoutList, exerciseInformation[i], prefill, exerciseList[i][1], exerciseList[i][2], programWorkout, i, jsonExercises[i]); 
        }
      } else {
        createWorkoutExerciseElement(copyOfGuide, workoutList, exerciseInformation, prefill, thumbnail, svgPerson, programWorkout); 
      }


    }

    function createWorkoutExerciseElement(copyOfGuide, workoutList, exerciseInformation, prefill, thumbnail, svgPerson, programWorkout, index=0, jsonExercises=null) {

      const workoutItemTemplate = workoutList.querySelector("ul > li:first-child");
      
      var workoutItem = workoutItemTemplate.cloneNode(true);

      //Add set rep info into guide template
      const setRepInfo = workoutItem.querySelector("#guidePlaceHolder").cloneNode(true);
      setRepInfo.id = "setRepInfoParent";
      setRepInfo.style.width = "100%";
      copyOfGuide.append(setRepInfo);
      copyOfGuide.style.border = "none";
  
      //Add workout Exercise ID and Name into guide template as well
      var workoutExerciseItemID = workoutItem.querySelector("#workoutExerciseItemID").cloneNode(true);
      copyOfGuide.append(workoutExerciseItemID);
  
      var workoutExerciseFullName = workoutItem.querySelector("#workoutExerciseFullName").cloneNode(true);
      copyOfGuide.append(workoutExerciseFullName);

      copyOfGuide.style.width = "100%";

      workoutItem.querySelector("#removeExercise").remove();
      workoutItem.querySelector(".div-block-501").remove();

      copyOfGuide.id = "guideCopy";

      //Remove the first occurances of item id and name for workout for each set
      copyOfGuide.querySelector("#workoutExerciseItemID").remove();
      copyOfGuide.querySelector("#workoutExerciseFullName").remove();

      //Add guide to workout exercise template
      workoutItem.querySelector("#guidePlaceHolder").append(copyOfGuide);

      //If extra information is provided fill in fields
      if(exerciseInformation != null) {
        if(!programWorkout) {
          workoutItem.querySelector(".repsinput").value = exerciseInformation.exerciseReps;
          workoutItem.querySelector(".setrestinputm").value = exerciseInformation.exerciseRestMins;
          workoutItem.querySelector(".setrestinput").value = exerciseInformation.exerciseRestSecs;
        } else {
          //Formatting of items
          workoutItem.querySelector("#navigationButtons").remove();
          workoutItem.querySelector("#guidePlaceHolder").width = "100%";
          workoutItem.querySelector(".exercisegroup").style.display = "block";

          workoutItem.querySelector("#removeExercise").style.display = "none";
          workoutItem.querySelector(".repsinput").innerText = exerciseInformation.exerciseReps;
          workoutItem.querySelector(".setrestinputm").innerText = exerciseInformation.exerciseRestMins;
          workoutItem.querySelector(".setrestinput").innerText = exerciseInformation.exerciseRestSecs;
        }
        copyOfGuide.querySelector("#itemID").innerText = exerciseInformation.exerciseItemID;

        copyOfGuide.querySelector("#workoutExerciseItemID").innerText = exerciseInformation.exerciseItemID;
        copyOfGuide.querySelector("#workoutExerciseFullName").innerText = exerciseInformation.exerciseFullName;
      }

      workoutItem.querySelector(".supersetparent img").addEventListener('click', handleSupersetClick);
      //Remove link to guide:
      copyOfGuide.href = "#";
      
      //Remove old template items
      workoutItem.querySelector("#setRepInfo").remove();
      workoutItem.querySelector("#workoutExerciseFullName").remove();
      workoutItem.querySelector("#workoutExerciseItemID").remove();
      workoutItem.querySelector("#exerciseInfo").remove();

      //Prefill rest values
      workoutItem.querySelector("#exerciseRestMin").value = 2;
      workoutItem.querySelector("#exerciseRestSec").value = 0;

      //Ensure reps input when adding from list is required
      //Code below will handle the rest for rir and rpe required
      workoutItem.querySelector("#repsInput").required = true;

      //Place remove button in the correct location
      const removeFullExercise = workoutItem.querySelector("#removeFullExercise").cloneNode(true);
      workoutItem.querySelector("#removeFullExercise").remove();
      workoutItem.querySelector("#exerciseInfoDiv").firstChild.after(removeFullExercise);
      workoutItem.querySelector("#exerciseInfoDiv").style.flexDirection = "row";

      //Add sets and fill in set rep info
      if(jsonExercises != null) {
        // JSONexercises is an object that contains an array of information about each set
        for(var x = 0; x < jsonExercises.exercises.length; x++) {

          var exerciseInfo = jsonExercises.exercises[x];
          //Clone exercise info div 
          var exerciseInfoDiv = workoutItem.querySelector("#exerciseInfo").cloneNode(true);

          //Fill in values
          exerciseInfoDiv.querySelector("#measureInput").value = exerciseInfo.measure;
          exerciseInfoDiv.querySelector(".repsinput").value = exerciseInfo.reps;
          exerciseInfoDiv.querySelector("#quantityUnit").value = exerciseInfo.quantityUnit;
          exerciseInfoDiv.querySelector("#loadAmountInput").value = exerciseInfo.loadAmount;
          exerciseInfoDiv.querySelector("#exerciseRestSec").value = exerciseInfo.exerciseRestSeconds;
          exerciseInfoDiv.querySelector("#exerciseRestMin").value = exerciseInfo.exerciseRestMinutes;

          //Show relevant input
          if(exerciseInfo.measure.toLowerCase() == "rir" || exerciseInfo.measure.toLowerCase() == "rpe") {
            exerciseInfoDiv.querySelector(".middle-item").style.display = "none";
            exerciseInfoDiv.querySelector(".middle-loadamount").style.display = "flex";
            exerciseInfoDiv.querySelector("#loadAmountInput").required = true;
            exerciseInfoDiv.querySelector(".repsinput").required = false;
          } else if(exerciseInfo.measure.toLowerCase() == "zone") {
            //Show load amount input
            exerciseInfoDiv.closest("#exerciseInfo").querySelector(".middle-loadamount").style.display = "flex";
            exerciseInfoDiv.closest("#exerciseInfo").querySelector(".middle-loadamount").style.width = "10%";
            exerciseInfoDiv.closest("#exerciseInfo").querySelector("#loadAmountInput").required = true;   
            exerciseInfoDiv.closest("#exerciseInfo").querySelector(".middle-item").style.display = "flex";
            exerciseInfoDiv.closest("#exerciseInfo").querySelector("#repsInput").required = true; 
          } else {
            exerciseInfoDiv.querySelector(".repsinput").required = true;
            exerciseInfoDiv.querySelector("#loadAmountInput").required = false;
          }

          if(exerciseInfo.quantityUnit.toLowerCase() == "amrap") {
            //Hide reps input
            exerciseInfoDiv.querySelector("#repsInput").style.display = "none";
            exerciseInfoDiv.querySelector("#repsInput").required = false;
          }

          //Add to exercise divs
          const workoutItemExercise = workoutItem;
          const exerciseInfoElements = workoutItemExercise.querySelectorAll("#exerciseInfo");

          const lastSetRepInput = exerciseInfoElements[exerciseInfoElements.length - 1];

          exerciseInfoDiv.style.paddingTop = "5px";
  
          exerciseInfoDiv.querySelector("#removeExercise").onclick = (event) => {

            //Check that there is one left
            if(event.target.closest("#setRepInfoParent").querySelectorAll("#exerciseInfo").length >= 2) {
              event.target.closest("#exerciseInfo").remove();
            }
            
          }
  
          lastSetRepInput.after(exerciseInfoDiv);
        }
        workoutItem.querySelector("#exerciseNotes").value = jsonExercises.exerciseNotes;
        
      }
  
      //Make svg person smaller
      svgPerson[0].firstChild.style.width = "80px";
      svgPerson[0].firstChild.style.height = "80px";
      svgPerson[0].firstChild.querySelector("#exerciseMuscleImage").style.width = "80px";
      svgPerson[0].firstChild.querySelector("#exerciseMuscleImage").style.height = "80px";
      svgPerson[0].style.width = "80px";
      svgPerson[0].style.height = "80px";
      thumbnail[0].firstChild.style.width = "80px";
      thumbnail[0].firstChild.style.height = "80px";
      thumbnail[0].style.width = "80px";
      thumbnail[0].style.height = "80px";
    
      //Add thumbnail and svg person to hover div
      $(workoutItem).find("#thumbnailAndMuscleDiv").append(thumbnail);
      $(workoutItem).find("#thumbnailAndMuscleDiv").append(svgPerson);
      
      workoutItem.style.display = "block";
      
      //Reduce headers font size:
      workoutItem.querySelector("#workoutExercisename").style.fontSize = "16px";
      workoutItem.querySelector("#exerciseDifficultyParent").style.display = "none";
      if(globalWeightUnit == "lbs") {
        workoutItem.querySelector("#measureInput").selectedIndex = 1;
      }

      //Add to 'workouts' list
      workoutList.appendChild(workoutItem);

      const listLength = workoutList.querySelectorAll(".exercise-list-item").length - 1;

      //Ensure required fields are set as required
      if(listLength >= 2) {
        //Hide superset button at the end
        if(!programWorkout) {
          workoutItem.previousSibling.querySelector(".supersetparent").style.display = "block";
        }
      }
      
      const saveWorkout = document.getElementById("saveWorkout");
      if (sessionStorage.getItem("editWorkout") == "true") {
        saveWorkout.value = "Save Changes";
      } 

      //Hiding and showing move icons and break icon between exercises
      if(listLength == 1) {
        saveWorkout.style.display = "block";
        document.getElementById("firstExercisePlaceholder").style.display = "none";
        workoutItem.querySelector(".supersetparent").style.display = "none";

      } else if(listLength == 2) {
        if(!programWorkout) {
          workoutItem.querySelector("#moveUp").style.display = "block";
          workoutItem.querySelector("#moveDown").style.display = "none";
        }

        if(!programWorkout && !workoutItem.previousSibling.classList.contains("exercise-list-item")) {
          workoutItem.querySelector(".supersetparent").style.display = "block";
        } else {
          workoutItem.querySelector(".supersetparent").style.display = "none";
        }
        
        document.getElementById("firstExercisePlaceholder").style.display = "none";

      } else if(listLength == 3) {

        if(!programWorkout) {
          workoutItem.querySelector("#moveDown").style.display = "none";
          workoutItem.querySelector("#moveUp").style.display = "block";
          workoutItem.querySelector(".supersetparent").style.display = "none";
          //Check if previous is superset
          if(!workoutItem.previousSibling.classList.contains("exercise-list-item")) {
            var previousElement = workoutItem.previousSibling;
            previousElement.querySelectorAll("#moveDown")[1].style.display = "block";
            workoutItem.querySelector(".supersetparent").style.display = "block";
            previousElement.querySelectorAll(".supersetparent")[1].style.display = "block";
          } else {
            workoutItem.previousSibling.querySelector("#moveDown").style.display = "block";
          }
        }
        
        saveWorkout.style.display = "block";

      } else if(listLength > 3) {
        if(!programWorkout) {

          workoutItem.querySelector(".supersetparent").style.display = "block";
          //Check if previous is superset
          if(!workoutItem.previousSibling.classList.contains("exercise-list-item")) {

            var previousElement = workoutItem.closest(".exercise-list-item").previousSibling;

            var moveDownElements = previousElement.querySelectorAll("#moveDown");
            var moveUpElements = previousElement.querySelectorAll("#moveUp");
            var supersetIconElements = previousElement.querySelectorAll(".supersetparent");
            
            // Set the style.display property for all moveDown elements - if superset
            for (var i = 0; i < moveDownElements.length; i++) {
              moveDownElements[i].style.display = "block";
            }
            
            // Set the style.display property for all moveUp elements - if superset
            for (var i = 0; i < moveUpElements.length; i++) {
              moveUpElements[i].style.display = "block";
            }

            // Set the style.display property for all superset icon elements - if superset
            for (var i = 0; i < supersetIconElements.length; i++) {
              supersetIconElements[i].style.display = "block";
            }


          } else {
            workoutItem.previousSibling.querySelector("#moveDown").style.display = "block";
            workoutItem.previousSibling.querySelector("#moveUp").style.display = "block";
          }

          workoutItem.querySelector("#moveDown").style.display = "none";
          workoutItem.querySelector(".supersetparent").style.display = "none";
          workoutItem.querySelector("#moveUp").style.display = "block";
        }

        saveWorkout.style.display = "block";

      }

      //If second exercise find parent and click superset button
      if(index == 1) {
        var previousExercise = workoutItem.closest(".exercise-list-item").previousSibling;
        previousExercise.querySelector(".supersetparent img").click();
      } else if(index > 1) {
        //For all others get last element in superset list and click superset image
        var previousExercise = workoutItem.closest(".exercise-list-item").previousSibling.querySelector(".exercise-list-item-superset").lastChild;
        console.log(previousExercise)
        previousExercise.querySelector(".supersetparent img").click();
      }

      //Scroll list to bottom to show user
      //Ensure when user is editing workout it does not scroll initially
      if (sessionStorage.getItem("viewingEditFirstTime") == "false" && !prefill) {
        workoutList.scrollIntoView({behavior: "smooth", block: "end"});
      } else {
        sessionStorage.setItem("viewingEditFirstTime", 'false');
      }


      //Remove original exerciseInfo
      if(workoutItem.querySelectorAll("#exerciseInfo").length >= 2) {
        workoutItem.querySelector("#exerciseInfo").remove();
      }

      //Remove unecessary things in workout program builder
      if(programWorkout) {
        workoutItem.paddingBottom = 0;
        workoutItem.paddingTop = 0;
        workoutItem.querySelector("#removeFullExercise").remove();
        workoutItem.querySelector(".supersetparent").style.display = "none";
        workoutItem.querySelector(".addset").style.display = "none";
        //Check if notes is empty 
        if(workoutItem.querySelector("#exerciseNotes").value == "") {
          workoutItem.querySelector("#exerciseNotes").style.display = "none";
        }
        var removeButtons = workoutItem.querySelectorAll("#removeExercise");
        for(var i = 0; i < removeButtons.length; i++) {
          removeButtons[i].style.display = "none";
        }

      }
      
    }

    function handleAddSet(eventTarget) {

      const workoutItemExercise = eventTarget.closest(".exercise-list-item");

        const exerciseInfoElements = workoutItemExercise.querySelectorAll("#exerciseInfo");

        //Get selected options from cloned element
        const measureInput = exerciseInfoElements[exerciseInfoElements.length - 1].querySelector("#measureInput").value;
        const quantityUnit = exerciseInfoElements[exerciseInfoElements.length - 1].querySelector("#quantityUnit").value;

        const lastExerciseInfo = exerciseInfoElements[exerciseInfoElements.length - 1].cloneNode(true);
        lastExerciseInfo.querySelector("#measureInput").value = measureInput;
        lastExerciseInfo.querySelector("#quantityUnit").value = quantityUnit;

        lastExerciseInfo.style.paddingTop = "5px";
      
        const lastSetRepInput = exerciseInfoElements[exerciseInfoElements.length - 1];

        //Set onclick for new remove set button
        lastExerciseInfo.querySelector("#removeExercise").onclick = (event) => {
          //Check that there is one left
          if(event.target.closest("#setRepInfoParent").querySelectorAll("#exerciseInfo").length >= 2) {
            event.target.closest("#exerciseInfo").remove();
          }
          //lastExerciseInfo.remove();
        }

        lastSetRepInput.after(lastExerciseInfo);
    }

    function handleSupersetClick(event) {
      const supersetImage = event.target;

      if(event.target.classList.contains("supersetimageopen")) {

        var supersetParent = supersetImage.closest('.exercise-list-item');
        var nextSibling = supersetParent.nextElementSibling;
        const previousSibling = supersetParent.closest(".exercise-list-item-superset");

        supersetParent.querySelector(".supersetparent img").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/64e71cc5a1339301140b4110_closed_superset.webp";

        //Make sure not end of list and the next element isn't already in a superset
        if(nextSibling != null && !nextSibling.querySelector(".exercise-list-item-superset")) {
          nextSibling.querySelector("#removeFullExercise").style.display = "none";

          // Create a new div with styling
          const newDiv = document.createElement('li');
          newDiv.classList.add('exercise-list-item-superset');
          
          newDiv.style.width = '100%';
          newDiv.style.marginTop = '10px';
          newDiv.style.display = "flex";
          newDiv.style.flexDirection = "column";
          newDiv.style.alignItems = "center";

          // Create the .drag-item element
          const dragItem = document.createElement('img');
          dragItem.src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/6688c08ca05b38cf0e64d623_drag.webp";
          dragItem.classList.add('drag-item');
          dragItem.style.marginLeft = "10px";

          // Create a wrapper for newDiv and dragItem
          const wrapper = document.createElement('li');
          wrapper.style.display = 'flex';
          wrapper.style.alignItems = 'center';
          wrapper.style.width = '90%';
          wrapper.style.backgroundColor = 'white';
          wrapper.style.border = '2px solid #CBCBCB';
          wrapper.classList.add("supersetWrapper");
          wrapper.style.borderRadius = '8px';

          // Append the drag item to the wrapper
          if(event.target.closest("#workoutList")) {
            wrapper.appendChild(dragItem);
          }

          // Append the new div to the wrapper
          wrapper.appendChild(newDiv);

          // Insert the wrapper before the superset parent
          supersetParent.parentNode.insertBefore(wrapper, supersetParent);

          // Append parent and next sibling elements to the new div
          newDiv.appendChild(supersetParent);
          if (nextSibling) {
            newDiv.appendChild(nextSibling);
          }

          // Remove existing border styling from #guideCopy
          newDiv.querySelectorAll('.exercisegroup').forEach(guideCopy => {
            guideCopy.style.border = 'none';
            var exerciseItem = guideCopy.closest(".exercise-list-item");
            if(exerciseItem.querySelector("#navigationButtons")) {
              exerciseItem.querySelector("#navigationButtons").style.display = "none";
            }
            exerciseItem.style.width = "100%";
          });

        } else if(nextSibling && nextSibling.querySelector(".exercise-list-item-superset")) {
          //Now check if next element is in a superset
          supersetParent.querySelector(".exercisegroup").style.border = 'none';
          supersetParent.querySelector("#navigationButtons").style.display = 'none';
          nextSibling.querySelector(".exercise-list-item-superset").insertBefore(supersetParent, nextSibling.querySelector(".exercise-list-item-superset").firstChild);

        } else if(previousSibling && supersetParent) {

          if(nextSibling == null) {
            
            nextSibling = supersetParent.closest(".exercise-list-item-superset");
            if(nextSibling && nextSibling.parentElement && nextSibling.querySelector(".supersetWrapper")) {
            } else {
              //Now check if current element is in a superset
              supersetParent = previousSibling.parentElement.nextElementSibling;
              supersetParent.style.width = "100%";
              supersetParent.querySelector(".exercisegroup").style.border = 'none';
              if(supersetParent.querySelector("#navigationButtons")) {
                supersetParent.querySelector("#navigationButtons").style.display = 'none';
              }

              previousSibling.appendChild(supersetParent);
            }
          }

        }

        //Remove supersetimageopen class
        supersetImage.classList.remove("supersetimageopen");
        supersetImage.classList.add("supersetimageclosed");
        if(supersetParent.querySelector("#removeFullExercise")) {
          supersetParent.querySelector("#removeFullExercise").style.display = "none";
        }
      
        
      } else {

        const supersetParent = supersetImage.closest('.exercise-list-item-superset').parentElement;
        var supersetItem = supersetImage.closest('.exercise-list-item');
        const workoutList = document.getElementById('workoutList'); // Assuming 'workoutList' is the ID of your list

        supersetItem.style.width = "";
        //Change superset image back  
        supersetImage.src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/64e71cc7674f21dd849120ea_open_superset.webp";
      
        // Get the exercises inside the superset parent
        const exercisesToRestore = Array.from(supersetParent.querySelectorAll('.exercise-list-item'));
        if(exercisesToRestore.length == 2) {
          supersetParent.querySelector(".drag-item").remove()
          // Remove borders from #guideCopy elements
          supersetParent.querySelectorAll('.exercisegroup').forEach(guideCopy => {
            guideCopy.style.border = '';
          });

          exercisesToRestore.reverse();
          // Insert exercises back into the workout list
          exercisesToRestore.forEach(exercise => {
            exercise.style.width = "";
            exercise.querySelector("#navigationButtons").style.display = "";
            workoutList.insertBefore(exercise, supersetParent.nextSibling);
            if(exercise.nextSibling != null) {
              exercise.querySelector(".supersetparent").style.display = "block";
            }
            
          });
          // Remove the superset parent div
          supersetParent.parentNode.removeChild(supersetParent);
        } else {
          //If at start of list
          if(supersetParent.querySelector(".exercise-list-item-superset").firstChild == supersetItem) {
            workoutList.insertBefore(supersetItem, supersetParent);
            supersetItem.querySelector(".exercisegroup").style.border = '';
          } else if(supersetParent.querySelector(".exercise-list-item-superset").lastChild == supersetItem.nextElementSibling) {
            //If at end of list
            supersetItem = supersetItem.nextElementSibling;
            supersetItem.querySelector(".exercisegroup").style.border = '';
            insertAfter(supersetItem, supersetParent);
            supersetItem.style.width = "";
            
          }

          supersetItem.querySelector("#navigationButtons").style.display = "";
        }

        supersetImage.classList.add("supersetimageopen");
        supersetImage.classList.remove("supersetimageclosed");


      }
      
    }

    function insertAfter(newNode, referenceNode) {
      referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
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

  window.addEventListener('load', (event) => {
    //Start workouts button clicked
    document.getElementById("workoutRadio").click();
    checkProgramWorkoutCheckBox();

    document.getElementById("trainingRadio").click();
    checkSummaryTrainingCheckBox();


    MemberStack.onReady.then(function(member) {  
      var membership = member.membership  
      var memberID = member["id"];
      var equipmentStatus = member["equipment-upload-complete"];

      //Get weight unit and click relevant one
      var weightUnit = member.weightUnit;

      //If it is equal to kg or 
      if(weightUnit && weightUnit.toLowerCase() == "lbs") {
        //Click lbs radio button
        document.getElementById("lbsRadio").click();

        //Set first template element in workout list to lbs
        globalWeightUnit = "lbs";
        
      } else {
        //Catch all for kgs
        document.getElementById("kgRadio").click();
        globalWeightUnit = "kg";
      }

      document.addEventListener('click', function(event) {

        if(event.target.name == "weightUnit") {
          member.updateProfile({
            "weightUnit": event.target.value
          }, true);

          globalWeightUnit = event.target.value
        }

      });

      const baseURL = window.location.origin;
      //set link to dashboard page
      const path = window.location.pathname;

      const urlID = path.split("/")[2];	

      /*
      
        - Check if specified parameters are in URL from workout builder submitting to show appropriate page
      */
      url = new URL(window.location.href.replace("#",""));

      if (url.searchParams.has('showPage')) {
        var showPage = url.searchParams.get('showPage');

        //Hide and show necessary pages
        if(showPage == "workoutSummaryPage") {
          document.getElementById("usersBody").style.display = "none";
          document.getElementById("workoutSummaryPage").style.display = "block";
          styleNavButtons("workoutsPage");
        } else if(showPage == "programSummary") {

          document.getElementById("workoutSummaryPage").style.display = "none";
          document.getElementById("workoutSummaryPage").style.display = "block";
          styleNavButtons("workoutsPage");
          document.getElementById("programRadio").click();
          checkProgramWorkoutCheckBox();

        } else if(showPage == "user") {
          var userIDParam = url.searchParams.get('id');
          const userIDList = document.querySelectorAll("#summaryItemId");
          var foundUser = false;
          for(var i = 0; i < userIDList.length; i++) {
            if(userIDList[i].innerText == userIDParam) {
              foundUser = userIDList[i];
              break;
            }
            
          }
          //Find cms item with the user id
          if(foundUser != false) {
            //Get parent summary div
            const parentProgramSummary = foundUser.closest("#userSummary");
            parentProgramSummary.click();
          }
          styleNavButtons("userPage");

        } else if(showPage == "challengeSummary") {

          document.getElementById("workoutSummaryPage").style.display = "none";
          document.getElementById("challengesBody").style.display = "block";
          styleNavButtons("challengesPage");

        } else {
          styleNavButtons("userPage");
        }

      } else {
        styleNavButtons("workoutsPage");
      }

      const exerciseLibrary = document.getElementById("customExercisePage");
      const dashboardBody = document.getElementById("dashboardBody");
      const settingsBody = document.getElementById("settingsBody");
      const usersBody = document.getElementById("usersBody");
      const userDetailDiv = document.getElementById("userDetailsPage");

      document.getElementById("workoutsPage").onclick = function() {
        //Reset filters on workout summary page
        settingsBody.style.display = "none";
        settingsBody.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        exerciseLibrary.style.display = "none";
        exerciseLibrary.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        dashboardBody.style.display = "none";
        dashboardBody.style.backgroundColor = 'rgba(0, 0, 0, 0)';

        // Check if there are any exercises in the list 
        // If there is, prompt user to confirm removing list 
        // If they confirm remove items from list and clear filters and hide exercise list
        if(sessionStorage.getItem("editProgram") == "true" || sessionStorage.getItem("createProgram") == "true" || sessionStorage.getItem("duplicateProgram")== "true" || sessionStorage.getItem("createUserProgram") == "true") {
          checkAndClearProgram("workoutSummaryPage", "workoutsPage");
        } else if (sessionStorage.getItem("editChallenge") == "true" || sessionStorage.getItem("createChallenge") == "true") {
          checkAndClearChallenge("workoutSummaryPage", "workoutsPage");
        } else {
          checkAndClearWorkouts("workoutSummaryPage", "workoutsPage");
        }

      };

      if(equipmentStatus == "complete") {

        document.getElementById("equipmentListContainer").style.display = 'block';

        document.getElementById("equipmentPage").onclick = function() {
          //exerciseLibrary.style.display = "block";
          dashboardBody.style.display = "none";
          dashboardBody.style.backgroundColor = 'rgba(0, 0, 0, 0)';
          settingsBody.style.display = "none";
          settingsBody.style.backgroundColor = 'rgba(0, 0, 0, 0)';
          //workoutBuilderPage.style.display = "none";
          //Reset filters on workout or program summary page
          if(sessionStorage.getItem("editProgram") == "true" || sessionStorage.getItem("createProgram") == "true" || sessionStorage.getItem("duplicateProgram") == "true" || sessionStorage.getItem("createUserProgram") == "true" ) {
            checkAndClearProgram("customExercisePage", "equipmentPage");
          } else if (sessionStorage.getItem("editChallenge") == "true" || sessionStorage.getItem("createChallenge") == "true") {
            checkAndClearChallenge("customExercisePage", "equipmentPage");
          } else {
            checkAndClearWorkouts("customExercisePage", "equipmentPage");
          }
          
        };

        document.getElementById("challengesPage").onclick = function() {

          dashboardBody.style.display = "none";
          dashboardBody.style.backgroundColor = 'rgba(0, 0, 0, 0)';
          settingsBody.style.display = "none";
          settingsBody.style.backgroundColor = 'rgba(0, 0, 0, 0)';
          exerciseLibrary.style.display = "none";
          exerciseLibrary.style.backgroundColor = 'rgba(0, 0, 0, 0)';

          //Reset filters on workout or program summary page
          if(sessionStorage.getItem("editProgram") == "true" || sessionStorage.getItem("createProgram") == "true" || sessionStorage.getItem("duplicateProgram")== "true" || sessionStorage.getItem("createUserProgram") == "true") {
            checkAndClearProgram("challengesBody", "challengesPage");
          } else if (sessionStorage.getItem("editChallenge") == "true" || sessionStorage.getItem("createChallenge") == "true") {
            checkAndClearChallenge("challengesBody", "challengesPage");
          } else {
            checkAndClearWorkouts("challengesBody", "challengesPage");
          }
          
        };

        document.getElementById("userPage").onclick = function() {
          dashboardBody.style.display = "none";
          dashboardBody.style.backgroundColor = 'rgba(0, 0, 0, 0)';
          settingsBody.style.display = "none";
          settingsBody.style.backgroundColor = 'rgba(0, 0, 0, 0)';
          exerciseLibrary.style.display = "none";
          exerciseLibrary.style.backgroundColor = 'rgba(0, 0, 0, 0)';

          //Reset filters on workout or program summary page
          if(sessionStorage.getItem("editProgram") == "true" || sessionStorage.getItem("createProgram") == "true" || sessionStorage.getItem("duplicateProgram")== "true" || sessionStorage.getItem("createUserProgram") == "true") {
            checkAndClearProgram("usersBody", "userPage", "userSummaryPage");
          } else if (sessionStorage.getItem("editChallenge") == "true" || sessionStorage.getItem("createChallenge") == "true") {
            checkAndClearChallenge("usersBody", "userPage", "userSummaryPage");
          } else {
            checkAndClearWorkouts("usersBody", "userPage", "userSummaryPage");
          }
          
        };

        document.getElementById("dashboardPage").onclick = function() {
          exerciseLibrary.style.display = "none";
          exerciseLibrary.style.backgroundColor = 'rgba(0, 0, 0, 0)';
          settingsBody.style.display = "none";
          settingsBody.style.backgroundColor = 'rgba(0, 0, 0, 0)';

          //Reset filters on workout summary page
          if(sessionStorage.getItem("editProgram") == "true" || sessionStorage.getItem("createProgram") == "true" || sessionStorage.getItem("duplicateProgram") == "true" || sessionStorage.getItem("createUserProgram") == "true") {
            checkAndClearProgram("dashboardBody", "dashbaordPage");
          } else if (sessionStorage.getItem("editChallenge") == "true" || sessionStorage.getItem("createChallenge") == "true") {
            checkAndClearChallenge("dashboardBody", "dashbaordPage");
          } else {
            checkAndClearWorkouts("dashboardBody", "dashbaordPage");
          }
        };

        document.getElementById("settingsPage").onclick = function() {
          exerciseLibrary.style.display = "none";
          exerciseLibrary.style.backgroundColor = 'rgba(0, 0, 0, 0)';
          dashboardBody.style.display = "none";
          dashboardBody.style.backgroundColor = 'rgba(0, 0, 0, 0)';
          
          //Reset filters on workout summary page
          if(sessionStorage.getItem("editProgram") == "true" || sessionStorage.getItem("createProgram") == "true" || sessionStorage.getItem("duplicateProgram")== "true" || sessionStorage.getItem("createUserProgram") == "true") {
            checkAndClearProgram("settingsBody", "settingsPage");
          } else if (sessionStorage.getItem("editChallenge") == "true" || sessionStorage.getItem("createChallenge") == "true") {
            checkAndClearChallenge("settingsBody", "settingsPage");
          } else {
            checkAndClearWorkouts("settingsBody", "settingsPage");
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
      contentHeight: "100%",
      eventOverlap: true,
      eventOrder: 'start',
      duration: { weeks: currentNumberOfWeeks},
      views: {
        dayGridFourWeek: {
          dayHeaderContent: function(info) {
            var dayOfWeek = info.date.getDay();
            return dayOfWeek === 0 ? 7 : dayOfWeek; // Convert Sunday (0) to 7

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
        var startChallenge = document.getElementById("challengeStartDate").value;
        var endChallenge = document.getElementById("challengeEndDate").value;

        styleStartAndEndDates(startChallenge, endChallenge);

        if((sessionStorage.getItem("createChallenge") == "true" || sessionStorage.getItem("editChallenge") == "true")) {
          document.getElementById("workoutTaskPlaceholderText").innerHTML = "<strong>Start by selecting a workout or task</strong>";
          document.getElementById("workoutTaskPlaceholderText").innerHTML = "<strong>Start by selecting a workout or task</strong>";
          document.getElementById("selectProgramWorkout").innerText = "Create Day";
          document.getElementById("selectWorkoutHeader").style.display = "none";
          
          if(!(startChallenge && endChallenge)) {
          
            return
  
          }
        } else {
          document.getElementById("workoutTaskPlaceholderText").innerHTML = "<strong>Start by selecting a workout</strong>";
          document.getElementById("selectProgramWorkout").innerText = "Select Workout";
          document.getElementById("selectWorkoutHeader").style.display = "";
        }

        if(!(isPasteState || isEventPasteState || addProgram) && (info.jsEvent.target.tagName != "IMG" || info.jsEvent.target.closest(".add-event-button"))) {

          var eventBackgroundColor = info.jsEvent.target.closest(".fc-daygrid-day-frame");
          if(eventBackgroundColor) {
            eventBackgroundColor = eventBackgroundColor.style.backgroundColor;
          }

          if(eventBackgroundColor != "rgb(203, 203, 203)") {

            selectedDate = info.dateStr;

            //Check if any events and click on them in the workout modal list
            var allEvents = calendar.getEvents();
            var dayEvents = allEvents.filter(function (event) {
              return !event.extendedProps.weeklyTask && moment(event.start).isSame(moment(selectedDate), 'day'); // '[]' to include the start and end dates
            });

            for(var i = 0; i < dayEvents.length; i++) {

              var listID = "";
              var itemID = "";
              var itemSelector = "";

              if(dayEvents[i].extendedProps.workoutID) {
                listID = "#workoutSummaryProgram";
                itemID = dayEvents[i].extendedProps.workoutID;
                itemSelector = "#workoutIDProgram";
              } else if(dayEvents[i].extendedProps.taskID) {
                listID = "#taskItem";
                itemID = dayEvents[i].extendedProps.taskID;
                itemSelector = "#taskItemID";
              }

              clickModalListItem(listID, itemID, itemSelector);
              document.getElementById("selectProgramWorkout").innerText = "Update Day";

            }

            //Show workouts modal
            showModal("workoutsList");
          }
        } else if (setFromPaste) {
          isPasteState = false;
          isEventPasteState = false;
          setFromPaste = false;
          addProgram = false;
          populateGodMode();

        }

      },
      eventDidMount: function(info) {

        var eventEl = info.el;

        var eventElParent = eventEl.closest(".fc-daygrid-day-frame");
        
        if(info.event.extendedProps.weeklyTask || sessionStorage.getItem("weeklyTask") == "true") {

          eventEl.classList.add("weekly-task-event");

          //Remove events from the first day and append to weekly column
          var weeklyTaskCell = eventElParent.parentElement.previousSibling;
          if(weeklyTaskCell) {
            weeklyTaskCell = weeklyTaskCell.querySelector(".fc-daygrid-day-events");
            if(weeklyTaskCell) {
              weeklyTaskCell.appendChild(eventEl);
            }
            
          }
            
        }

        //Check if it already has day controls
        if(eventElParent.querySelectorAll(".delete-event-button").length == 0) {
          // Create a copy and delete button element
          var deleteButtonEl = document.createElement('button');
          var copyButtonEl = document.createElement('button');
          var addButtonEl = document.createElement('button');

          copyButtonEl.className = 'copy-event-button';
          deleteButtonEl.className = 'delete-event-button';
          addButtonEl.className = 'add-event-button';

          var originalCellDay = "";
          var originalCell = "";

          // Create an image element for the delete button
          var deleteImageEl = document.createElement('img');
          deleteImageEl.src = 'https://uploads-ssl.webflow.com/622f1b68bc1e4510618e0b04/6461eb594bc9d89c2d285060_trashIcon.webp';

          // Create an image element for the delete button
          var copyImageEl = document.createElement('img');
          copyImageEl.src = 'https://uploads-ssl.webflow.com/622f1b68bc1e4510618e0b04/646ddea577e978678ad7eecb_copyButtonNew.webp';

          // Create an image element for the delete button
          var addEventEl = document.createElement('img');
          addEventEl.src = 'https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/650444503758530596912def_addWorkout.png';
        
          // Append the image element to the delete button
          deleteButtonEl.appendChild(deleteImageEl);
          copyButtonEl.appendChild(copyImageEl);
          addButtonEl.appendChild(addEventEl);

          // Append the delete button to the event element
          eventElParent.appendChild(deleteButtonEl);

          eventElParent.appendChild(copyButtonEl);
          eventElParent.appendChild(addButtonEl);
        
          // Add a hover event listener to show/hide the delete button
          eventElParent.addEventListener('mouseenter', function(event) {
            copyButtonEl.style.display = 'block';
            deleteButtonEl.style.display = 'block';
            addButtonEl.style.display = 'block';
            if(eventElParent.querySelector(".fc-event") != null) {
              eventElParent.querySelector(".fc-event").style.cursor = "grab";
            }
            
          });
        
          eventElParent.addEventListener('mouseleave', function(event) {

            //Get date of hovered date 
            var hoveredEventDate = new Date(event.target.closest('.fc-daygrid-day-frame').parentElement.getAttribute("data-date"));
            var copiedJSON = sessionStorage.getItem('copiedEvent');
            if(copiedJSON && JSON.parse(copiedJSON).length && JSON.parse(copiedJSON).length > 0) {
              var copiedEventDate = new Date(JSON.parse(copiedJSON)[0].start);
            }
            
            hoveredEventDate.setHours(hoveredEventDate.getHours() - 10);

            if(isEventPasteState && (hoveredEventDate.getTime() == copiedEventDate.getTime())) {
              copyButtonEl.style.display = 'block';
              deleteButtonEl.style.display = 'block';
              addButtonEl.style.display = 'block';
            } else {
              copyButtonEl.style.display = 'none';
              deleteButtonEl.style.display = 'none';
              addButtonEl.style.display = 'none';
            }

          });
          

          // Add a click event listener to remove the event
          deleteImageEl.addEventListener('click', function(event) {

            event.stopPropagation(); // Prevent event propagation to the parent elements

            var eventClickedDate = event.target.closest(".fc-day").getAttribute("data-date");

            // List all events, then filter for events within the week
            var allEvents = calendar.getEvents();
            var dayEvents = allEvents.filter(function (event) {
              return !event.extendedProps.weeklyTask && moment(event.start).isSame(moment(eventClickedDate), 'day'); // '[]' to include the start and end dates
            });
          
            // Remove the week events from the calendar
            dayEvents.forEach(function (event) {
              event.remove();
            });

            //Remove copy and delete buttons
            event.target.closest(".fc-daygrid-day-frame").querySelector(".copy-event-button").remove();
            event.target.remove();

            //Populate god mode:
            populateGodMode();

          });

          // Add a click event listener to copy the events
          copyImageEl.addEventListener('click', function(event) {

            event.stopPropagation(); // Prevent event propagation to the parent elements

            //Save the copy button
            clickedEventCopyButton = event.target;

            // Get the clicked date from the calendar
            var eventClickedDate = event.target.closest(".fc-day").getAttribute("data-date");

            // List all events for the clicked date
            var allEvents = calendar.getEvents();
            var dayEvents = allEvents.filter(function(event) {
              return !event.extendedProps.weeklyTask && moment(event.start).isSame(moment(eventClickedDate), 'day');
            });

            // Create an array to store event details
            var eventsArray = [];

            //Set image to pressed state
            copyImageEl.src = "https://uploads-ssl.webflow.com/622f1b68bc1e4510618e0b04/646ddeb5b0ba0c6aee88f383_copyPressedNew.webp";

            // Iterate through the events and store their details
            dayEvents.forEach(function(event) {
              if(event.extendedProps.uniqueWorkoutID) {
                //Update unique workout ID
                event.extendedProps.uniqueWorkoutID = uuidv4();
                
              } else {
                //Update unique task ID
                event.extendedProps.uniqueTaskID = uuidv4();
              }
              var eventDetails = {
                allDay: event.allDay,
                extendedProps: event.extendedProps,
                start: eventClickedDate,
                title: event.title
              };
              eventsArray.push(eventDetails);
            });

            // Store the events array in sessionStorage
            sessionStorage.setItem('copiedEvent', JSON.stringify(eventsArray));
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

            //Get destination day background colour
            var destinationDayElement = stoppedEventDay.toISOString().slice(0, 10); // Get the destination day in YYYY-MM-DD format
            var destinationDayFrame = document.querySelector(`.fc-daygrid-day[data-date="${destinationDayElement}"] .fc-daygrid-day-frame`);
            var destinationDayBackgroundColor = destinationDayFrame.style.backgroundColor;

            //Check if greyed out day 
            if(destinationDayBackgroundColor == "rgb(203, 203, 203)" ) {
              info.revert(); // Revert the drop
              return
            }

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
        }

        //Populate god mode:
        populateGodMode();


        return eventEl;
      },

      eventContent: function(info) {
        var targetArea = info.event.extendedProps.targetArea;
        var duration = info.event.extendedProps.length;
        
        var eventContentHTML = '<div class="fc-content">' +
            '<div class="fc-title">' + info.event.title + '</div>' +
            '<div class="fc-details">' + (targetArea ? targetArea + '<br>' : "") /*+ duration */ + '</div>' +
            '</div>';
    
        return {
            html: eventContentHTML,
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
            
            //Create weekly task
            var eventCopy = $(this).find("[role=gridcell]")[0].cloneNode(true);
            eventCopy.style.display = "none";

            eventCopy.onclick = function(e) {

              //Ensure it is on tasks
              document.getElementById("showModalTasks").click();

              selectedDate = e.target.closest(".fc-day").getAttribute("data-date");

              //Check if any events and click on them in the workout modal list
              var allEvents = calendar.getEvents();
              var dayEvents = allEvents.filter(function (event) {
                return event.extendedProps.weeklyTask && moment(event.start).isSame(moment(selectedDate), 'day'); // '[]' to include the start and end dates
              });

              for(var i = 0; i < dayEvents.length; i++) {

                var listID = "";
                var itemID = "";
                var itemSelector = "";
                if(dayEvents[i].extendedProps.workoutID) {
                  listID = "#workoutSummaryProgram";
                  itemID = dayEvents[i].extendedProps.workoutID;
                  itemSelector = "#workoutIDProgram";
                } else if(dayEvents[i].extendedProps.taskID) {
                  listID = "#taskItem";
                  itemID = dayEvents[i].extendedProps.taskID;
                  itemSelector = "#taskItemID";
                }

                clickModalListItem(listID, itemID, itemSelector);
              }

              showModal("workoutsList");

              sessionStorage.setItem("weeklyTask", "true");
            };
            
            eventCopy.classList.add("weekly-task");
            
            if(sessionStorage.getItem("createChallenge") == "true" || sessionStorage.getItem("editChallenge") == "true") {
              $(this).prepend(eventCopy);
            }

            $(this).prepend(buttonsContainerHtml);
          
          }
      
          index++;
        });
      },
      firstDay: 1, // Monday
    });
    
    calendar.render();

    //Get all program summaries and set onclicks
    var programList = document.querySelectorAll("#programSummary");
    for(let i = 0; i < programList.length; i++) {
      (function(program) {
        program.onclick = (event) => {
          if(event.target.id != "addUserProgram" && event.target.id != "deleteProgram" && !event.target.id.includes("programOptions")) {
            //Prefill program screen
            prefillProgramBuilder(program);

            //Set edit program flag
            sessionStorage.setItem("editProgram", 'true');

            hideOrShowGodModeSwitch();
          }

        }
      })(programList[i]);
    }

    //Get all challenge summaries and set onclicks
    var challengeList = document.querySelectorAll("#challengeSummary");
    for(let i = 0; i < challengeList.length; i++) {
      (function(challenge) {
        challenge.onclick = (event) => {
          if(event.target.id != "deleteChallenge" && !event.target.id.includes("challengeOptions")) {
            //Set edit challenge flag
            sessionStorage.setItem("editChallenge", 'true');

            //Prefill challenge screen
            prefillChallengeBuilder(challenge);

            hideOrShowGodModeSwitch();
          }

        }
      })(challengeList[i]);
    }

    //Set onclicks for all tasks
    var taskItems = document.querySelectorAll(".taskitem");
    for(var i = 0; i < taskItems.length; i++) {
      (function(task) {
        task.onclick = () => {
          prefillWorkoutTaskList(task, "task");
        }
      })(taskItems[i]);
    }


    //Set onclicks for all workouts
    var mainWorkoutList = document.querySelectorAll(".workoutsummaryitem");

    var desiredDate = "";
    var newEvent = "";

    //Set onclicks for programs in modal
    var programListModal = document.querySelectorAll("#programModalSummary");
    for(var i = 0; i < programListModal.length; i++) {
      (function(programItem) {
        programItem.onclick = () => {

          workoutIndexCount = [];

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

          //Get program experience
          document.getElementById("selectedProgramExperience").innerText = programItem.querySelector("#programExperienceModal").innerText;

          //Get program goal
          document.getElementById("selectedProgramGoal").innerText = programItem.querySelector("#programGoalModal").innerText;

          //Set program full name
          document.getElementById("programFullNameModal").innerText = programItem.querySelector("#programFullNameModal").innerText;

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

          document.getElementById("week-1").click();


        }
      })(programListModal[i]);

    }

    //Set onclick for program workout select
    document.getElementById("selectProgramWorkout").onclick = () => {

      if(sessionStorage.getItem("createChallenge") == "true" || sessionStorage.getItem("editChallenge") == "true") {

        desiredDate = selectedDate;

        if(sessionStorage.getItem("weeklyTask") == "false") {
          //Clear existing events
          // List all events, then filter for events within the week
          var allEvents = calendar.getEvents();
          var dayEvents = allEvents.filter(function (event) {
            return !event.extendedProps.weeklyTask && moment(event.start).isSame(moment(selectedDate), 'day'); // '[]' to include the start and end dates
          });
        
          // Remove the week events from the calendar
          dayEvents.forEach(function (event) {
            event.remove();
          });

          
        } else {
          var allEvents = calendar.getEvents();
          var dayEvents = allEvents.filter(function (event) {
            return event.extendedProps.weeklyTask && moment(event.start).isSame(moment(selectedDate), 'day'); // '[]' to include the start and end dates
          });
        
          // Remove the week events from the calendar
          dayEvents.forEach(function (event) {
            event.remove();
          });

          const weeklyElement = document.querySelector(`td[data-date="${desiredDate}"].weekly-task`);
          const eventElements = weeklyElement.querySelectorAll(".fc-event");
          for(var i = 0; i < eventElements.length; i++) {
            eventElements[i].remove();
          }
        }

        const workoutTaskList = document.getElementById("programWorkoutList").children;

        for(var i = 1; i < workoutTaskList.length; i++) {
          
          var eventElement = workoutTaskList[i].firstChild;
          // Create a new event object with the desired date
          if(eventElement.id == "workoutItem") {
            newEvent = {
              title: eventElement.querySelector('#workoutSummaryNameProgram').innerText,
              details: eventElement.querySelector('#workoutDurationProgram').innerText,
              extendedProps: {
                targetArea: eventElement.querySelector('#workoutFocusAreaProgram').innerText,
                length: eventElement.querySelector('#workoutDurationProgram').innerText,
                workoutID: eventElement.querySelector('#itemID').innerText,
                uniqueWorkoutID: uuidv4()
              },
              start: desiredDate,
              allDay: true
            };
          } else if(eventElement.id == "taskItem") {
            newEvent = {
              title: eventElement.querySelector('#taskName').innerText,
              extendedProps: {
                taskID: eventElement.querySelector('#itemID').innerText,
                uniqueTaskID: uuidv4()
              },
              start: desiredDate,
              allDay: true
            };    
          }
          if(sessionStorage.getItem("weeklyTask") == "true") {
            newEvent.extendedProps["weeklyTask"] = "true";
          }

          addEventToCalendar();
        
        }

      } else {
        addEventToCalendar();
      }

      sessionStorage.setItem("weeklyTask", "false")
      clearWorkoutExerciseList(true);

      // Hide modal
      document.getElementById("modalWrapper").style.display = "none";
      document.getElementById("workoutsList").style.display = "none";
      document.getElementById("programList").style.display = "none";
    }

    //Set onclick for program select modal
    document.getElementById("selectProgramModal").onclick = () => {

      //Put user in 'add program' state
      addProgram = true;

      //Update training plan to indicate to user to click a week
      document.getElementById("trainingPlanName").innerText = "Click a week to select when the programs starts.";

      //Navigate to user summary view
      document.getElementById("userInfoDetails").style.display = "none";
      document.getElementById("programBuilder").style.display = "block";
      document.getElementById("programBuilderInfo").style.display = "none";
      document.getElementById("saveProgramDiv").style.display = "block";

      document.getElementById("trainingRadio").click();

      // Hide modal
      document.getElementById("modalWrapper").style.display = "none";
      document.getElementById("workoutsList").style.display = "none";

      document.getElementById("programList").style.display = "none";

      //Add a week to the calendar
      document.getElementById("addWeekButton").click();

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

    // JavaScript function to prevent form submission on Enter key press
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' && event.target.id != "richTextEditor") {
        event.preventDefault(); // Prevent form submission
      }
    });

    //Catching mouse over and out events for showing the thumbnail and svg person
    document.addEventListener('mouseover', function (event) {

      if(event.target.closest("#guidePlaceHolder") && !event.target.closest("#modalWrapper")) {
        //Dont show remove button if in superset
        if(event.target.closest("#guidePlaceHolder").querySelector("#removeFullExercise") && !event.target.closest(".exercise-list-item-superset")) {
          event.target.closest("#guidePlaceHolder").querySelector("#removeFullExercise").style.display = "block";
        } else {
          event.target.closest("#guidePlaceHolder").querySelector("#removeFullExercise").style.display = "none";
        }
        
      }

      if(event.target.closest(".exercise-details-parent") && event.target.closest("#workoutList")) {

        event.target.closest(".exercise-details-parent").querySelector(".remove-set").style.display = "block";
      }
      
      if((event.target.classList.contains('fc-daygrid-day-frame') || event.target.classList.contains('fc-details') ||  event.target.classList.contains('fc-daygrid-day-events') ||event.target.classList.contains('fc-daygrid-day-top') || event.target.closest(".add-event-button")) ) {

        //Check if cell has an event
        var eventElement = event.target.closest(".fc-daygrid-day-frame");
        if(eventElement) {
          eventElement = eventElement.querySelector(".fc-event-main");
        }
        const hoveredRow = event.target.closest('[role="row"]');
        const hoveredDay = event.target.closest('.fc-daygrid-day-frame');

        //Hide date
        if(hoveredDay) {
          if(hoveredDay.style.backgroundColor != "rgb(203, 203, 203)") {
            if(hoveredDay.querySelector('.fc-col-header-cell-cushion')) {
              hoveredDay.querySelector('.fc-col-header-cell-cushion').style.display = "none";
            }
            
          }
        }

        if(isPasteState || isEventPasteState || addProgram) {
          if(isPasteState || addProgram) {
            toggleRowPasteStateCSS(hoveredRow, true);
          } else {
            toggleDayPasteStateCSS(hoveredDay, true);
          }
        } else if(eventElement == null) {
          toggleBorderCSS(hoveredDay, true);
        }

      } 
    }, false);

    document.addEventListener('mouseout', function (event) {


      if(event.target.closest(".exercise-details-parent") && event.target.closest("#workoutList")) {
        // Append the drag item to the wrapper
        event.target.closest(".exercise-details-parent").querySelector("#removeExercise").style.display = "none";
      }

      if(event.target.closest("#guidePlaceHolder")) {
        
        if(event.target.closest("#guidePlaceHolder").querySelector("#removeFullExercise") && !event.target.closest(".exercise-list-item-superset")) {
          event.target.closest("#guidePlaceHolder").querySelector("#removeFullExercise").style.display = "none";
        } 
      }

      if((event.target.classList.contains('fc-daygrid-day-frame') || event.target.classList.contains('fc-details') ||  event.target.classList.contains('fc-daygrid-day-events') || event.target.closest(".add-event-button"))) {
        var hoveredRow = event.target.closest('[role="row"]');
        const hoveredDay = event.target.closest('.fc-daygrid-day-frame');

        //Show date
        if(hoveredDay) {
          if(hoveredDay.querySelector('.fc-col-header-cell-cushion')) {
            hoveredDay.querySelector('.fc-col-header-cell-cushion').style.display = "";
          }
          
        }

        toggleRowPasteStateCSS(hoveredRow, false);
        toggleBorderCSS(hoveredDay, false);

      }

    }, false);

    document.getElementById("createStaffForm").onsubmit = function(event) {

      
      //Get necessary details from form and submit to make
      const gymStaffName = document.getElementById("staffInputName").value;
      const gymStaffEmail = document.getElementById("staffMemberEmail").value;

      var staffMember = {};
      staffMember["name"] = gymStaffName;
      staffMember["email"] = gymStaffEmail;
      staffMember["gymID"] = document.getElementById("gymID").innerText;
      
      //Add to staff list
      var staffList = document.getElementById("staffMemberList");
      if(staffList == null) {
        staffList = document.createElement("div");
        staffList.className = "staffmemberlist w-dyn-items";
        staffList.setAttribute("role", "list");
        //Add to cms list
        // Get the first child of the parent element
        var parentElement = document.getElementById("staffMemberListParent");
        var firstChild = parentElement.firstChild;
        // Insert staffList before the first child
        parentElement.insertBefore(staffList, firstChild);

        //Hide Empty state
        document.getElementById("staffEmpty").style.display = "none";
      
      }

      // Create a div element for the cms list
      var staffItem = document.createElement("div");
      staffItem.className = "w-dyn-item";
      staffItem.setAttribute("role", "listitem");

      // Create a div element for the staff div
      var staffDiv = document.createElement("div");
      staffDiv.className = "staffdiv";
      staffDiv.id = "staffDiv";
      
      // Create a div element for the staff name
      var staffNameDiv = document.createElement("div");
      staffNameDiv.textContent = gymStaffName;
      staffNameDiv.className = "staffname";
      staffNameDiv.id = "staffName";

      // Create a div element for the staff email
      var staffEmailDiv = document.createElement("div");
      staffEmailDiv.textContent = gymStaffEmail;
      staffEmailDiv.className = "hidden-staff-field";
      staffEmailDiv.id = "staffEmail";

      // Append the staff name and staff email elements to the staffdiv
      staffDiv.appendChild(staffNameDiv);
      staffDiv.appendChild(staffEmailDiv);
      staffItem.appendChild(staffDiv);
      staffList.appendChild(staffItem);

      createStaffMember(staffMember);

      if(!addStaffMemberFromSettings) {
        //Use staff and email to create QR code
        const createStaffGymName = document.getElementById("gymFullName").innerText;
        const createStaffGymID = document.getElementById("gymID").innerText;
      
        //Create QR Code
        var createUserlink = ``;
        //Create QR Code
        if(createStaffGymName.toLowerCase() == "uts - activatefit gym") {
          createUserlink = `https://app.bene-fit.io/user-sign-up?utm_campaign=${createStaffGymName}&gym_id=${createStaffGymID}&staff_email=${gymStaffEmail}&payment=false`;
        } else {
          createUserlink = `https://app.bene-fit.io/user-sign-up?utm_campaign=${createStaffGymName}&gym_id=${createStaffGymID}&staff_email=${gymStaffEmail}`;
        }
        
        generateQRCode(createUserlink);

        //Show sign up instructions
        var createUserModal = document.getElementById("createUserModal");
        createUserModal.style.display = "flex";
        createUserModal.style.flexDirection = "column";
        createUserModal.style.alignItems = "center";
      }

      //Hide staff add modal
      document.getElementById("staffSelectModal").style.display = "none";
      document.getElementById("addStaffMember").style.display = "none";
      document.getElementById("selectStaffMember").style.display = "block";

      addStaffMemberFromSettings = false;


      //Reset form
      event.target.reset();

    }

    document.getElementById("saveProgram").addEventListener("click", function(event) {
      //List events from calendar
      var events = calendar.getEvents();
      if(events.length == 0) {
        event.preventDefault();
        alert("Please add some workouts to the program before you submit it!");
      } else {
        document.getElementById("saveProgram").click();
      }
    });

    document.getElementById("programForm").onsubmit = function() {
      var program = {};
      var programWorkoutsArr = [];

      //List events from calendar
      var events = calendar.getEvents();

      program["programName"] = document.getElementById("programName").value;
      program["programDescription"] = document.getElementById("programDescription").value;
      program["experience"] = document.getElementById("programExperience").value;
      program["programGoal"] = document.getElementById("programGoal").value;

      // Loop through the events and remove events with empty workoutID
      for (var i = events.length - 1; i >= 0; i--) {
        var event = events[i];
        if (event.extendedProps.workoutID === "") {
          event.remove();
        } else {
          programWorkoutsArr.push(event.extendedProps.workoutID);
        }
      }

      // Calculate number of weeks between start of first event and end of last event
      var numWeeks = Math.ceil((events[events.length-1].start.getTime() - events[0].start.getTime()) / (1000 * 60 * 60 * 24 * 7));

      programWorkoutsArr = programWorkoutsArr.reverse();
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

      program["extendedJSON"] = JSON.stringify(createExtendedProgram(JSON.parse(program.eventData)));

      sendProgramToMake(program);

    }

    document.getElementById("saveChallenge").addEventListener("click", function(event) {
      //List events from calendar
      var events = calendar.getEvents();
      events = events.filter(function (event) {
        return !event.extendedProps.weeklyTask;
      });

      if(events.length == 0) {
        event.preventDefault();
        alert("Please add some workouts/tasks to the challenge before you submit it!");
      } else {
        document.getElementById("saveChallenge").click();
      }
    });

    document.getElementById("challengeForm").onsubmit = function() {
      var challenge = {};
      var challengeWorkoutsArr = [];
      var challengeTasksArr = [];

      //List events from calendar
      var events = calendar.getEvents();

      challenge["challengeName"] = document.getElementById("challengeInputName").value;
      challenge["challengeDescription"] = document.getElementById("challengeDescription").value;
      challenge["startDate"] = document.getElementById("challengeStartDate").value;
      challenge["endDate"] = document.getElementById("challengeEndDate").value;

      // Loop through the events and remove events with empty workoutID
      for (var i = events.length - 1; i >= 0; i--) {
        var event = events[i];
        if (event.extendedProps.workoutID === "") {
          event.remove();
        } else {
          //Check if workout
          if(event.extendedProps.workoutID) {
            challengeWorkoutsArr.push(event.extendedProps.workoutID);
          } else if (event.extendedProps.taskID) {
            //Check if tasks
            challengeTasksArr.push(event.extendedProps.taskID);
          }
        }
      }

      // Calculate number of weeks between start of first event and end of last event
      var numWeeks = Math.ceil((new Date(challenge["endDate"]).getTime() - new Date(challenge["startDate"]).getTime()) / (1000 * 60 * 60 * 24 * 7));
      challenge["numberOfWeeks"] = numWeeks;
      challengeWorkoutsArr = challengeWorkoutsArr.reverse();
      challengeTasksArr = challengeTasksArr.reverse();

      challenge["eventData"] = JSON.stringify(events);

      challenge["workoutIDs"] = challengeWorkoutsArr;
      challenge["taskIDs"] = challengeTasksArr;

      challenge["gymName"] = document.getElementById("gymFullName").innerText;
      challenge["gymID"] = document.getElementById("gymID").innerText;

      if(sessionStorage.getItem('editChallenge') == "true") {
        challenge["programID"] = document.getElementById("challengeSummaryID").value;
      } 

      challenge["extendedJSON"] = JSON.stringify(createExtendedProgram(JSON.parse(challenge.eventData)));

      sendChallengeToMake(challenge);

      
    };

    document.getElementById("submitWorkoutBuilderForm").onclick = function(event) {

      var workoutBuilderForm = document.getElementById("workoutBuilderForm");
      
      //Ensure all fields are filled in
      if (workoutBuilderForm.checkValidity()) {

        var workout = {};

        //Obtain form data
        workout["name"] = document.getElementById("workoutName").value;
        workout["length"] = document.getElementById("estTime").value;
        workout["description"] = document.getElementById("workoutDescription").value;
        workout["focusArea"] = document.getElementById("focusArea").value;
        workout["gymName"] = document.getElementById("gymFullName").innerText;
        workout["gymID"] = document.getElementById("gymID").innerText;
        workout["workoutID"] = document.getElementById("workoutSummaryID").innerText;
        workout["workoutFullName"] = document.getElementById("workoutSummaryFullName").innerText;
        workout["listOfExercises"] = [];
        workout["exerciseIDs"] = [];
        workout["exerciseSlugs"] = [];
        workout["muscleGroups"] = [];
  
        const workoutList = document.getElementById("workoutList").children;
  
        //Loop through list and obtain rest of data and add to object 
        for(var i = 1; i < workoutList.length; i++) {
          var workoutExercise = {};
  
          var exerciseList = [];
          //Check if list element is superset
          if(workoutList[i].classList.contains("supersetWrapper")) {

            var supersetExerciseList = [];
            const supersetExercises = workoutList[i].querySelectorAll(".exercise-list-item");

            //If it is, iterate through each item in the superset
            for(var k = 0; k < supersetExercises.length; k++) {
              
              const setInformation = supersetExercises[k].querySelectorAll("#exerciseInfo");
              const exerciseName = supersetExercises[k].querySelector("#workoutExercisename");
              var exerciseSlug = supersetExercises[k].querySelector("#guideLinkInfo").href.split("/");
              var muscleGroups = supersetExercises[k].querySelectorAll("#scientificPrimaryMuscle");
              for(var m = 0; m < muscleGroups.length; m++) {
                workout.muscleGroups.push(muscleGroups[m].innerText);
              }
  
              if(exerciseSlug.length > 4) {
                workout.exerciseSlugs.push(exerciseSlug[4]);
              }
             
              exerciseList = [];
              workoutExercise = {};
              for(var j = 0; j < setInformation.length; j++) {
  
                var exerciseInformation = {};
                exerciseInformation["measure"] = setInformation[j].querySelector("#measureInput").value;
                exerciseInformation["quantityUnit"] = setInformation[j].querySelector("#quantityUnit").value;
                exerciseInformation["reps"] = setInformation[j].querySelector("#repsInput").value;
                exerciseInformation["exerciseRestSeconds"] = setInformation[j].querySelector("#exerciseRestSec").value;
                exerciseInformation["exerciseRestMinutes"] = setInformation[j].querySelector("#exerciseRestMin").value;
                exerciseInformation["loadAmount"] = setInformation[j].querySelector("#loadAmountInput").value;
                
                exerciseList.push(exerciseInformation);
              }
              workoutExercise["exerciseName"] = exerciseName.innerText;
              workoutExercise["exerciseNotes"] = supersetExercises[k].querySelector("#exerciseNotes").value;
              workoutExercise["sets"] = setInformation.length;
              workoutExercise["exercises"] = exerciseList;
      
              workoutExercise["guideID"] = supersetExercises[k].querySelector("#itemID").innerText;
              workout.exerciseIDs.push(supersetExercises[k].querySelector("#itemID").innerText);
              workoutExercise["workoutExerciseItemID"] = supersetExercises[k].querySelector("#itemID").innerText;
              workoutExercise["workoutExerciseFullName"] = supersetExercises[k].querySelector("#workoutExercisename").innerText;
              supersetExerciseList.push(workoutExercise);
            }
  
            workout.listOfExercises.push(supersetExerciseList);
  
          } else {
            var exerciseSlug = workoutList[i].querySelector("#guideLinkInfo").href.split("/");
            if(exerciseSlug.length > 4) {
              workout.exerciseSlugs.push(exerciseSlug[4]);
            }
            var muscleGroups = workoutList[i].querySelectorAll("#scientificPrimaryMuscle");
            for(var m = 0; m < muscleGroups.length; m++) {
              workout.muscleGroups.push(muscleGroups[m].innerText);
            }
           
            const setInformation = workoutList[i].querySelectorAll("#exerciseInfo");
            const exerciseName = workoutList[i].querySelector("#workoutExercisename");
            for(var j = 0; j < setInformation.length; j++) {
              var exerciseInformation = {};
              exerciseInformation["measure"] = setInformation[j].querySelector("#measureInput").value;
              exerciseInformation["quantityUnit"] = setInformation[j].querySelector("#quantityUnit").value;
              exerciseInformation["reps"] = setInformation[j].querySelector("#repsInput").value;
              exerciseInformation["exerciseRestSeconds"] = setInformation[j].querySelector("#exerciseRestSec").value;
              exerciseInformation["exerciseRestMinutes"] = setInformation[j].querySelector("#exerciseRestMin").value;
              exerciseInformation["loadAmount"] = setInformation[j].querySelector("#loadAmountInput").value;
              exerciseList.push(exerciseInformation);
            }
            workoutExercise["exerciseName"] = exerciseName.innerText;
            workoutExercise["exerciseNotes"] = workoutList[i].querySelector("#exerciseNotes").value;
            workoutExercise["sets"] = setInformation.length;
            workoutExercise["exercises"] = exerciseList;
    
            workoutExercise["guideID"] = workoutList[i].querySelector("#itemID").innerText;
            workout.exerciseIDs.push(workoutList[i].querySelector("#itemID").innerText);
            workoutExercise["workoutExerciseItemID"] = workoutList[i].querySelector("#itemID").innerText;
            workoutExercise["workoutExerciseFullName"] = workoutList[i].querySelector("#workoutExercisename").innerText;
            workout.listOfExercises.push([workoutExercise]);
          }
  
        }
  
        workout["stringOfExercises"] = JSON.stringify(workout.listOfExercises);
        workout.exerciseSlugs = workout.exerciseSlugs.join(", ")
        workout.muscleGroups = workout.muscleGroups.join(", ");
  
        //Make sure they have selected a duration and focus area
        if(!workout["length"].includes("Duration") && !workout["focusArea"].includes("Focus Area")) {
          document.getElementById("saveWorkout").value = "Please wait...";
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
          
    }

    //Listen for click events specifically for in paste state when clicking on cells
    //Otherwise if in paste state and not clicked on a day cancel paste state
    document.addEventListener('click', function(event) {

      if(!event.target.closest(".search-filters-parent") && document.getElementById("searchFilterImg").classList.contains("filtericonclicked")) {
        document.getElementById("searchFilterImg").click();
      }

      if(!event.target.closest(".search-filters-parent") && document.getElementById("exerciseSearchFilterImg").classList.contains("filtericonclicked")) {
        document.getElementById("exerciseSearchFilterImg").click();
      }

      if(!event.target.closest(".client-filters")) {
        var clientFilterArrow = document.querySelector(".clientfilterarrow");
        var rotatedValue = clientFilterArrow.style.transform.match(/rotateX\(([^)]+)\)/);
        
        if(rotatedValue && rotatedValue.length > 0) {
          if(rotatedValue[1] == "180deg") {
            //Click div to activate 'webflow interation'
            document.querySelector(".client-filters").click();
          }

        }
      }

      //Check if in paste state and anywhere in the row is clicked
      if((event.target.classList.contains('fc-daygrid-day-frame') || event.target.classList.contains('fc-details') || event.target.classList.contains('fc-daygrid-day-events')) && (isPasteState || isEventPasteState || addProgram)) {
        //Get entire row of paste button
        var weekRow = event.target.closest('[role="row"]');
        var dayCell = event.target.closest('.fc-daygrid-day-frame');

        if(isPasteState || addProgram) {
          
          if (weekRow) {

            document.getElementById("trainingPlanName").innerText = document.getElementById("userProgramProgramName").innerText;

            //Obtain saved copied events
            var copiedEvents = null;
            if(addProgram) {
              copiedEvents = JSON.parse(userProgramEvents);
            } else {
              copiedEvents = JSON.parse(sessionStorage.getItem('copiedEvents'));
            }

            if (copiedEvents && copiedEvents.length > 0) {

              var numProgramWeeks = document.getElementById("selectedProgramWeeks").innerText;

              //Get start time of entire week
              var startTime = new Date(weekRow.querySelector('[role="gridcell"]').getAttribute("data-date"));

              // Calculate the start and end dates of the week of interest
              var endOfWeek = new Date(startTime.getTime() + (7 * 24 * 60 * 60 * 1000));

              var millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;

              var weekCounter = 0;
              var currentEndOfWeek = null;
              var incrementWeeks = false;
 
              const sortedCopiedEvents = copiedEvents.slice().sort((a, b) => {
                const dateA = moment(a.start, 'YYYY-MM-DD');
                const dateB = moment(b.start, 'YYYY-MM-DD');
                return dateA.diff(dateB);
              });

              var lastWorkout = new Date(sortedCopiedEvents[sortedCopiedEvents.length - 1].start);
              var firstWorkout = new Date(sortedCopiedEvents[0].start);
              var programClash = false;

              //Iterate through each existing program and check if there will be a clash with the new program
              for(const program of userTrainingPlan) {
                const programStartWeek = new Date(program.startWeek);
                const programEndWeek = new Date(program.endWeek);

                var weeksBetween = Math.floor((programEndWeek - programStartWeek) / millisecondsPerWeek);
                
                if (lastWorkout.getTime() > startTime.getTime()) {
                  var difference = Math.floor((lastWorkout.getTime() - startTime.getTime()) / millisecondsPerWeek);
                  lastWorkout.setDate(lastWorkout.getDate() - ((difference * 7)));
                } else if (lastWorkout.getTime() < startTime.getTime() ) {
                  var difference = Math.ceil((startTime.getTime() - lastWorkout.getTime()) / millisecondsPerWeek);
                  lastWorkout.setDate(lastWorkout.getDate() + ((difference * 7)));
                }

                if (firstWorkout.getTime() > startTime.getTime()) {
                  var difference = Math.floor((firstWorkout.getTime() - startTime.getTime()) / millisecondsPerWeek);
                  firstWorkout.setDate(firstWorkout.getDate() - ((difference * 7)));
                } else if (firstWorkout.getTime() < startTime.getTime() ) {
                  var difference = Math.ceil((startTime.getTime() - firstWorkout.getTime()) / millisecondsPerWeek);
                  firstWorkout.setDate(firstWorkout.getDate() + ((difference * 7)));
                }

                lastWorkout.setDate(lastWorkout.getDate() + ((weeksBetween * 7)));

                programClash = (lastWorkout >= programStartWeek && lastWorkout <= programEndWeek || firstWorkout >= programStartWeek && firstWorkout <= programEndWeek);

                if(programClash) {
                  break;
                }
              
              }

              if(isPasteState || !programClash ) {

                sortedCopiedEvents.forEach(function(event, index, events) {

                  event.start = new Date(event.start); 
  
                  currentEndOfWeek = new Date (getEndOfWeek(event.start));
  
                  if(index < events.length - 1) {
                    if(new Date(events[index + 1].start).getTime() > currentEndOfWeek.getTime()) {
                      incrementWeeks = true;
                    }
                  }
                  
                  startTime.setHours(0, 0, 0, 0);
  
                  // Filter the events within the week of interest
                  if(!addProgram) {
                    var eventsInWeek = calendar.getEvents().filter(function(existingEvent) {
                      var existingEventStart = existingEvent.start;
                      return (
                        existingEventStart >= startTime && existingEventStart <= endOfWeek
                      );
                    });
                  }
  
                  // Calculate the difference between copied event and selected paste week
                  if (event.start.getTime() > startTime.getTime()) {
  
                    var difference = Math.floor((event.start.getTime() - startTime.getTime()) / millisecondsPerWeek);
                    event.start.setDate(event.start.getDate() - ((difference * 7)));
                    
                  } else if (event.start.getTime() < startTime.getTime()) {
                    
                    var difference = Math.ceil((startTime.getTime() - event.start.getTime()) / millisecondsPerWeek);
                    event.start.setDate(event.start.getDate() + ((difference * 7)));
  
                  }
  
                  event.start.setDate(event.start.getDate() + ((weekCounter * 7)));
  
                  // If event added that exceeds calendar view, add another week
                  if(event.start > calendar.view.currentEnd) {
                    updateCalendarWeeks(0, "userProgram");
                  }
  
                  //Increase week counter if week elapsed
                  if(incrementWeeks) {
                    weekCounter += 1;
                    incrementWeeks = false;
                  }
  
                  if(!addProgram) {
                    // Check if there are any duplicate events within the week
                    var duplicateEventExists = eventsInWeek.some(function(existingEvent) {
                      return existingEvent.start.toDateString() === event.start.toDateString();
                    });
                  }

                  if(event.extendedProps.uniqueTaskID) {
                    //Update unique task ID
                    event.extendedProps.uniqueTaskID = uuidv4();
                  } else {
                    //Update unique workout ID
                    event.extendedProps.uniqueWorkoutID = uuidv4();
                  }

                  if(!duplicateEventExists && !addProgram) {
                    // Add event to calendar
                    calendar.addEvent(event);
                  } else if(addProgram) {
                    calendar.addEvent(event);

                  } else if(sessionStorage.getItem("createChallenge") || sessionStorage.getItem("editChallenge")) {
                    calendar.addEvent(event);
                  }

  
                });
                
                if(addProgram) {

                  //add program to global userProgram list
                  var programObj = {};
                  programObj["programName"] = document.getElementById("selectedProgramName").innerText;
                  programObj["programID"] = userProgramWorkoutID;
                  programObj["events"] = sortedCopiedEvents;
                  programObj["startWeek"] = moment(new Date(sortedCopiedEvents[0].start)).format("YYYY-MM-DD");;
                  var endOfProgram = new Date (getEndOfWeek(sortedCopiedEvents[0].start));
                  programObj["endWeek"] = moment(new Date (endOfProgram.setDate(endOfProgram.getDate() + (numProgramWeeks-1)*7))).format("YYYY-MM-DD");;
  
                  userTrainingPlan.push(programObj);
  
                  //Sort the programs by start week
                  userTrainingPlan.sort(function(a, b) {
                    var dateA = moment(a.startWeek, "YYYY-MM-DD");
                    var dateB = moment(b.startWeek, "YYYY-MM-DD");
                    return dateA - dateB;
                  });
  
                }

                if(sessionStorage.getItem("createUserProgram") == "true" ) {
                  getProgramBreakers();
                }
                
                // Clear program list
                clearProgramModalList();
                setFromPaste = true;

              } else {
                alert("A program already exists there! Please select another one or make some more room");
              }
              
            }
          }

        } else {

          var copiedEvent = JSON.parse(sessionStorage.getItem('copiedEvent'));
          var clickedDate = new Date(dayCell.parentElement.getAttribute("data-date"));

          if (copiedEvent && clickedDate) {
            // Create a new event objects with the copied event details
            copiedEvent.forEach(function(event) {

              if(event.extendedProps.length) {
                //Update unique workout ID
                event.extendedProps.uniqueWorkoutID = uuidv4();
                
              } else {
                //Update unique task ID
                event.extendedProps.uniqueTaskID = uuidv4();
              }

              var newEvent = {
                title: event.title,
                start: clickedDate,
                end: clickedDate, // Set the end date as the same as start for all-day events
                allDay: event.allDay,
                extendedProps: event.extendedProps
              };
  
              // Add the new event to the calendar
              calendar.addEvent(newEvent);
              
            });

            setFromPaste = true;

          }
 
        }

        toggleRowPasteStateCSS(weekRow, false);
        toggleDayPasteStateCSS(dayCell, false);

        
      } else {
        isPasteState = false;
        isEventPasteState = false;
      }

    });

    //Click listener
    //Listen for click events:
    document.addEventListener('click', function (event) {

      if(event.target.id == "clearClientFilters") {
        resetFilters();
      }

      if(event.target.id == "challengeStartDate" || event.target.id == "challengeEndDate") {
        event.target.showPicker();
      }

      if(event.target.closest(".exerciseguideitem")) {
        
        if(!event.target.id.includes("exerciseOptions") && event.target.id != "deleteExercise") {
          //Prefill modal
          prefillExerciseLibraryForm(event.target.closest(".exerciseguideitem"));
  
          //Show Modal
          var createExerciseModal = document.getElementById("createExerciseModal");
          //Set flex styling:
          createExerciseModal.style.display = "flex";
          createExerciseModal.style.flexDirection = "column";
          createExerciseModal.style.justifyContent = "center";
          createExerciseModal.style.alignItems = "center";
        }
      }

      if(event.target.closest("#taskSummary")) {
        //Prefill Modal
        prefillTaskModal(event.target.closest("#taskSummary"));

        //Show Modal
        var createTaskModal = document.getElementById("createTaskModal");
        //Set flex styling:
        createTaskModal.style.display = "flex";
        createTaskModal.style.flexDirection = "column";
        createTaskModal.style.justifyContent = "center";
        createTaskModal.style.alignItems = "center";

      }

      if(event.target.closest("#individualGuide")) {
        //Make sure when info button is clicked the exercise isnt added to the list
        if(event.target.id != "guideLinkInfo" && event.target.id != "guideLinkInfoImage") {
          var copyOfGuide = event.target.closest("#individualGuide").cloneNode(true);
          
          //Remove info button
          copyOfGuide.querySelector("#guideLinkInfo").style.display = "none";
    
          //Copy thumbnail and svg person into a separate div
          var exerciseThumbnail = $(copyOfGuide).find("#exerciseThumbnail").detach();
          var svgPersonDiv = $(copyOfGuide).find("#exerciseInfoRight").detach();

          //Change ID of exercise name
          copyOfGuide.querySelector("#guideName").id = "workoutExercisename";
    
          //Ensure copy border colour is SF blue
          copyOfGuide.style.borderColor = "rgb(12, 8, 213)";

          addExerciseToWorkoutList(copyOfGuide, null, null, exerciseThumbnail, svgPersonDiv);

          createWorkoutListEntry(copyOfGuide.querySelector("#itemID").innerText, event.target.closest("#individualGuide"));

        }
      }

      if(event.target.closest("#userSummary")) {
        var userSummary = event.target.closest("#userSummary");
        if(!event.target.id.includes("userOptions") && event.target.id != "copyInviteLinkDropdown") {
          //Fill user name
          document.getElementById("userFullName").innerText = userSummary.querySelector("#userSummaryName").innerText;
          var userNameArr = userSummary.querySelector("#userSummaryName").innerText.split(" ");
          if(userNameArr.length > 0) {
            document.getElementById("user-firstName").value = userNameArr[0];
            document.getElementById("user-lastName").value = userNameArr[1];
          }

          prefillingProgram = true;

          //Fill account type
          document.getElementById("accountType").innerText = userSummary.querySelector("#summaryAccountType").innerText;

          //Fill program ends
          document.getElementById("programEnds").innerText = userSummary.querySelector("#summaryProgramEnds").innerText;
          //Fill experience
          document.getElementById("experienceLevel").innerText = userSummary.querySelector("#summaryExperience").innerText;
          document.getElementById("user-experience").value = userSummary.querySelector("#summaryExperience").innerText;

          //Fill goals
          document.getElementById("userGoals").innerText = userSummary.querySelector("#summaryGoal").innerText;
          document.getElementById("user-goals").value = userSummary.querySelector("#summaryGoal").innerText;
        
          //Fill user created
          document.getElementById("userCreated").innerText = userSummary.querySelector("#summaryUserCreated").innerText;
          //Fill user email
          document.getElementById("userEmail").innerText = userSummary.querySelector("#summaryUserEmail").innerText;
          document.getElementById("user-email").value = userSummary.querySelector("#summaryUserEmail").innerText;

          //Fill user DOB
          document.getElementById("user-dob").value = userSummary.querySelector("#dob").innerText;

          //Fill user gender
          document.getElementById("user-gender").value = userSummary.querySelector("#gender").innerText;

          //Fill user height
          document.getElementById("user-height").value = userSummary.querySelector("#height").innerText;

          //Fill user weight
          document.getElementById("user-weight").value = userSummary.querySelector("#weight").innerText;

          //Fill mobile phone
          document.getElementById("userPhone").innerText = userSummary.querySelector("#summaryUserPhone").innerText;
          //Fill user notes
          document.getElementById("userNotes").value = userSummary.querySelector("#summaryUserNotes").innerText;
          //Fill limitations/injuries
          document.getElementById("userLimitations").value = userSummary.querySelector("#summaryUserLimitations").innerText;
          document.getElementById("user-injury").value = userSummary.querySelector("#summaryUserLimitations").innerText;

          //Fill user ID
          document.getElementById("userID").innerText = userSummary.querySelector("#summaryItemId").innerText;
          //Fill user program ID
          document.getElementById("userProgramID").innerText = userSummary.querySelector("#summaryProgramId").innerText;
          //Fill program name
          document.getElementById("userProgramProgramName").innerText = userSummary.querySelector("#summaryProgramName").innerText;
          //Fill user memberstack ID
          document.getElementById("userMemberstackID").innerText = userSummary.querySelector("#summaryUserMemberstackID").innerText;

          var userType = userSummary.querySelector("#type").innerText;
          if(userType.toLowerCase() == "online") {
            document.getElementById("user-online").click();
          } else if(userType.toLowerCase() == "hybrid") {
            document.getElementById("user-hybrid").click();
          } else if(userType.toLowerCase() == "in person") {
            document.getElementById("user-inperson").click();
          }
          
          //Fill calendar
          prefillProgramBuilder(userSummary, "userProgramInitial");
          //TODO: Fill program name

          //Clear tables if any exist:
          if(document.querySelector(".week-tables") != null) {
            const tables = document.querySelectorAll('.week-table');
            tableArr = [];
            for(const table of tables) {
              table.remove();
            }
          }

          prefillProgramTable(userSummary, "create");

          currentUserProgram = userSummary;

          //Hide user summary list
          document.getElementById("userSummaryPage").style.display = "none";

          // Show user details
          document.getElementById("userDetailsPage").style.display = "block";

          //Show user program
          document.getElementById("trainingRadio").click();

          hideOrShowGodModeSwitch();

          prefillingProgram = false;

      } else {
        //Reset text on button
        event.target.closest(".dropdown-3").querySelector("#copyInviteLinkDropdown").innerText = "Copy invite link";
      }
      }

      if(event.target.closest("#workoutSummaryProgram")) {

        var workout = event.target.closest("#workoutSummaryProgram");

        if(sessionStorage.getItem("createChallenge") != "true" && sessionStorage.getItem("editChallenge") != "true") {
          
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
              uniqueWorkoutID: uuidv4()
            },
            start: desiredDate,
            allDay: true
          };

        } else {

          prefillWorkoutTaskList(workout, "workout");
        }
      }

      if(event.target.id == "showModalWorkouts") {
        document.getElementById("workoutModalForm").style.display = "flex";
        document.getElementById("taskModalForm").style.display = "none";

        if(!event.target.classList.contains("workouttaskbtnclicked")) {

          event.target.classList.add("workouttaskbtnclicked");
          event.target.classList.remove("workouttaskbtn");

          document.getElementById("showModalTasks").classList.add("workouttaskbtn");
          document.getElementById("showModalTasks").classList.remove("workouttaskbtnclicked");

        } 
      }

      if(event.target.id == "showModalTasks") {
        document.getElementById("taskModalForm").style.display = "flex";
        document.getElementById("workoutModalForm").style.display = "none";

        if(!event.target.classList.contains("workouttaskbtnclicked")) {
          event.target.classList.add("workouttaskbtnclicked");
          event.target.classList.remove("workouttaskbtn");

          document.getElementById("showModalWorkouts").classList.add("workouttaskbtn");
          document.getElementById("showModalWorkouts").classList.remove("workouttaskbtnclicked");

        }
      }

      if(event.target.closest("#createTask")) {
        document.getElementById("createTask").style.display = "none";
        document.getElementById("cancelTask").style.display = "flex";

        const taskItem = document.getElementById("addTaskTemplate").cloneNode(true);
        taskItem.style.display = "grid";
        let taskList = document.getElementById("taskListModal");

        //Empty state
        if(taskList == null) {
          taskList = document.querySelector(".taskwrapperlist");
          taskList.querySelector(".w-dyn-empty").style.display = "none";
        } 

        // Get the first child of taskList
        const firstChild = taskList.firstChild;


        //Ensure new input field is added
        var newID = uuidv4();
        taskItem.querySelector(".placeholder").setAttribute('for', newID);
        taskItem.querySelector("#attachmentInput").id = newID;
        taskItem.querySelectorAll("input")[1].style.display = "none";
        
        // Insert taskItem before the firstChild
        taskList.insertBefore(taskItem, firstChild);

      }

      if(event.target.id == "machine-parent") {
        document.getElementById("pin-checkbox").click();
        document.getElementById("plate-checkbox").click();
      }
      
      
      if(event.target.id == "programSheetImg" || event.target.id == "programCalendarImg" ) {

        //Style buttons
        checkCalendarSheetButtons(event.target.id);

        if(event.target.id == "programSheetImg") {

          //Show program sheet view
          document.getElementById("programSheet").style.display = "flex";
          document.getElementById("programSheet").style.flexDirection = "column";

          //Get current user ID and find their program
          const userID  = document.getElementById("userID").innerText;
          //Get user list and find user info based on ID
          let program = null;
          var userSummaryList = document.querySelectorAll("#userSummary");
          for(let i = 0; i < userSummaryList.length; i++) {
            if(userSummaryList[i].querySelector("#summaryItemId").innerText == userID) {
              program = userSummaryList[i];
              break;
            }
          }

          prefillProgramTable(program, action="update");

          //Hide program calendar view
          document.getElementById("programCalendar").style.display = "none";

          //Hide assign program button
          document.querySelector(".assignprogrambutton").style.display = "none";

        } else {
            //Show program calendar view
            document.getElementById("programCalendar").style.display = "block";
  
            //Hide program sheet view
            document.getElementById("programSheet").style.display = "none";
            calendar.render();

            //Show assign program button
            document.querySelector(".assignprogrambutton").style.display = "";
        }

      } 
      
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

        // Get the week row
        var weekRow = event.target.closest('[role="row"]');
        // Get the start date of the week
        var weekStart = moment(weekRow.querySelector('[role="gridcell"]').getAttribute("data-date"));
        // Calculate the end date of the week by adding 7 days
        var weekEnd = weekStart.clone().add(7, 'days');
        
        // Adjust for timezone offset (assuming it's in hours, e.g., +10 for Sydney)
        var timezoneOffset = 11; // Adjust this to match your timezone offset
        
        weekStart.subtract(timezoneOffset, 'hours');
        weekEnd.subtract(timezoneOffset, 'hours');
        
        // List all events, then filter for events within the week
        var allEvents = calendar.getEvents();
        var weekEvents = allEvents.filter(function (event) {
          return !event.extendedProps.weeklyTask && moment(event.start).isBetween(weekStart, weekEnd, null, '[]'); // '[]' to include the start and end dates
        });

        // Store the week events in session storage
        sessionStorage.setItem('copiedEvents', JSON.stringify(weekEvents));
        
      } else if (event.target.classList.contains('delete-events-button')) {

        // Get the week row
        var weekRow = event.target.closest('[role="row"]');
        var weekRowChildren = weekRow.children;
        // Get the start date of the week
        var weekStart = moment(weekRow.querySelector('[role="gridcell"]').getAttribute("data-date"));

        // Calculate the end date of the week by adding 7 days
        var weekEnd = weekStart.clone().add(7, 'days');
      
        // Adjust for timezone offset (assuming it's in hours, e.g., +10 for Sydney)
        var timezoneOffset = 11; // Adjust this to match your timezone offset
      
        weekStart.subtract(timezoneOffset, 'hours');
        weekEnd.subtract(timezoneOffset, 'hours');
      
        // List all events, then filter for events within the week
        var allEvents = calendar.getEvents();
        var weekEvents = allEvents.filter(function (event) {
          return moment(event.start).isBetween(weekStart, weekEnd, null, '[]'); // '[]' to include the start and end dates
        });
      
        // Remove the week events from the calendar
        weekEvents.forEach(function (event) {
          event.remove();
        });
      
        // Remove copy and delete buttons from the row
        for (var i = 1; i < weekRowChildren.length; i++) {
          var copyButton = weekRowChildren[i].querySelector('.copy-event-button');
          var deleteButton = weekRowChildren[i].querySelector('.delete-event-button');
          if (copyButton && deleteButton) {
            copyButton.remove();
            deleteButton.remove();
          }
        }

        getUserTrainingPlan();
        removeEmptyPrograms(weekRow);
        getUserTrainingPlan();
        getProgramBreakers();
        //Populate god mode:
        populateGodMode();

      } else if(event.target.closest("#addStaffMemberSettings")) {
        addStaffMemberFromSettings = true;

      } else if(event.target.id == "addUserProgram") {

        //Hide program page
        //Show user page
        document.getElementById("userPage").click();

      
      } else if(event.target.id == "searchFilterImg" || event.target.id == "exerciseSearchFilterImg") { 

        //Check if clicked or not
        if(event.target.classList.contains("filtericon")) {
          //Not clicked - change to filled
          event.target.classList.remove("filtericon");
          event.target.classList.add("filtericonclicked");
        } else {
          event.target.classList.add("filtericon");
          event.target.classList.remove("filtericonclicked");
        }


      
      } else if(event.target.id == "closeCreateUserModal" || event.target.id == "createUserModal") {

        document.getElementById("linkCopiedTextSignUp").style.display = "none";

        //Hide modal
        document.getElementById("createUserModal").style.display = "none";
        //Remove QR code
        var userQrImg = document.getElementById("createUserQrCode").querySelector("img");
        if(userQrImg) {
          userQrImg.remove()
        }


      } else if(event.target.id == "closeAddStaffModal" || event.target.id == "closeStaffSelectModal" || event.target.id == "staffSelectModal" ) {

        document.getElementById("staffSelectModal").style.display = "none";
        document.getElementById("addStaffMember").style.display = "none";
        document.getElementById("selectStaffMember").style.display = "block";

      } else if (event.target.nodeName == "path") {

        var muscleFilter = sessionStorage.getItem("muscleFilter");

        //Ensure muscle filter exists
        if(muscleFilter && muscleFilter != "") {
          muscleFilter = muscleFilter.replaceAll(" ", "-");

          // hide SVG man:
          svgPerson.style.display = 'none';
          guideList.style.display = 'block';
          clickExerciseText.style.display = 'block';
          backButton.style.display = 'block';

          document.getElementById("exerciseSearch").value = muscleMapping[muscleFilter];
          document.getElementById("exerciseSearch").dispatchEvent(new Event('input', { bubbles: true }));
        }
        //Reset storage filter for next click
        sessionStorage.setItem("muscleFilter", "");
        
      } else if(event.target.closest("#saveTrainingPlan")) {

        event.target.closest("#saveTrainingPlan").querySelector("#assignProgramText").innerText = "Please Wait..."
        //Check if existing user program exists

        if(document.getElementById("userProgramID").innerText == "") {
          createUserProgram();
        } else {
          updateUserProgram();
        }
      
      } else if(event.target.closest("#assignProgram")) {
        //Submit user details
        if(document.getElementById("userDetailsPage").style.display == "block") {
          saveUserDetails();
        }

        clearProgramModalList();
        showModal("programList");

      } else if(event.target.closest("#saveUserDetails")) {

        // save user details
        //saveUserDetails();

      
      } else if(document.getElementById("trainingRadio").checked && event.target.id == "trainingRadio") {

        summaryRadioClicked = false;
        if(!isProgrammaticClick) {

          //Submit user details
          if(document.getElementById("userDetailsPage").style.display == "block") {
            saveUserDetails();
          }

          //Remove all events first
          //calendar.removeAllEvents();

          //Navigate to user summary view
          document.getElementById("userInfoDetails").style.display = "none";
          document.getElementById("programBuilder").style.display = "block";
          document.getElementById("programBuilderInfo").style.display = "none";
          document.getElementById("saveProgramDiv").style.display = "block";

          document.getElementById("saveTrainingPlan").style.display = "flex";
          document.getElementById("saveTrainingPlan").style.alignContent = "center";
          document.getElementById("saveTrainingPlan").style.justifyContent = "center";

          //Set program name in training plan
          document.getElementById("trainingPlanName").style.display = "block";
          document.getElementById("trainingPlanName").innerText = document.getElementById("userProgramProgramName").innerText;

          checkSummaryTrainingCheckBox();

          refreshCalendarLayout();
          updateCalendarWeeks(0, "userProgram");

          if(!addProgram) {
            prefillProgramBuilder(currentUserProgram, "userProgram");
          }
          

          //Show week date ranges
          showOrHideWeekRange("block");

          //Set user create program flag
          sessionStorage.setItem("createUserProgram", "true");

          //document.getElementById("saveUserDetails").style.display = "none";

        }

        isProgrammaticClick = false;

      } else if(document.getElementById("summaryRadioButton").checked && event.target.id == "summaryRadioButton") {

        //Navigate to user summary view  

        summaryRadioClicked = true;
        if(!isProgrammaticClick) {
          checkAndClearProgram("userInfoDetails", "userPage");
        }
        

      }  else if(event.target.id == "ipadBackButton") {
        //Reset filters on workout summary page
        //workoutSummaryPage.style.display = "block";
        //workoutBuilderPage.style.display = "none";
        settingsBody.style.display = "none";
        exerciseLibrary.style.display = "none";
        dashboardBody.style.display = "none";

        // Check if there are any exercises in the list 
        // If there is, prompt user to confirm removing list 

        // If they confirm remove items from list and clear filters and hide exercise list
        checkAndClearWorkouts("workoutSummaryPage");

      } else if(event.target.id == "addWeekButton" || event.target.classList.contains("italic-text-9")) {
        updatingCalendar = true;
        if(sessionStorage.getItem("createUserProgram") == "true") {
          updateCalendarWeeks(0,"userProgramBuilder");
        } else {
          updateCalendarWeeks();
        }
        

      } else if( event.target.id == "copyWorkoutImg") {

        event.preventDefault();

        //Copy to clipboard
        const workoutLink = event.target.closest("#workoutSummary").querySelector("#workoutLink").href;
        navigator.clipboard.writeText(workoutLink);
        event.target.closest("#workoutSummary").querySelector("#copiedText").style.display = "block";

        // Reset the image source after 2 seconds
        setTimeout(function () {
          event.target.closest("#workoutSummary").querySelector("#copiedText").style.display = "none";
        }, 1000);

      } else if(event.target.id == "modalWrapper" || event.target.className == "close-modal" || event.target.className == "exit-qr-scan") {
        //Remove QR code
        if(document.querySelector(".qr-code img") != null) {
          document.querySelector(".qr-code img").remove();
        }

        sessionStorage.setItem("weeklyTask", "false");
        
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

      } else if(event.target.id == "saveWorkout") {

        event.preventDefault();

        const workoutListForm = document.getElementById("workoutListForm");

        // Select all elements with the 'required' attribute
        const requiredElements = workoutListForm.querySelectorAll('[required]');
        
        // Convert NodeList to an array and reverse it
        const reversedRequiredElements = Array.from(requiredElements).reverse();

        // Iterate through reversed required elements
        reversedRequiredElements.forEach(element => {
          // Use reportValidity to show the validation message
          element.reportValidity();
        });
        
        // Check overall form validity
        const formValidity = workoutListForm.checkValidity();
        
        if (formValidity) {
          // The entire form is valid, submit other workout form
          document.getElementById("submitWorkoutBuilderForm").click();
        } 
        
      } else if(event.target.id == "submitWorkoutOrProgram") {

        //Hide confirm close modal
        document.getElementById("confirmCloseBuilder").style.display = "none";

        //Check if workouts or program is active
        if(sessionStorage.getItem("createUserProgram") == "true") {
          //Attempt to submit user program
          document.getElementById("saveTrainingPlan").click();

        } else if(sessionStorage.getItem("editProgram") == "true" || sessionStorage.getItem("createProgram") == "true" || sessionStorage.getItem("duplicateProgram")== "true") {

          //Attempt to submit base program 
          document.getElementById("saveProgram").click();

        } else if(sessionStorage.getItem("editChallenge") == "true" || sessionStorage.getItem("createChallenge") == "true") {
          //Attempt to challenge
          document.getElementById("saveChallenge").click();
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
        
      } else if(event.target.id == "copyInviteLink" ) {

        event.preventDefault();
        navigator.clipboard.writeText(event.target.href);
        event.target.innerText = "Copied!";
        event.target.style.color = "#ffffff";
        event.target.style.backgroundColor = "#0c08d5";

      } else if(event.target.id == "copyInviteLinkDropdown") {

        const ptGymIDLink = document.getElementById("gymID").innerText;
        navigator.clipboard.writeText(window.location.origin + `/onboarding-form?pt=${ptGymIDLink}`);
        event.target.innerText = "Copied!";

      } else if(event.target.id == "shareSignUpLink") {
        // navigator.clipboard.writeText(sessionStorage.getItem("shareSignUpLink"));
        // document.getElementById("linkCopiedTextSignUp").style.display = "block"; 

        var firstNameSignUp = document.getElementById("first-name-sign-up").value;
        var lastNameSignUp = document.getElementById("last-name-sign-up").value;
        var emailSignUp = document.getElementById("email-sign-up").value;
        
        if(firstNameSignUp != "" && lastNameSignUp != "" && emailSignUp != "") {

          for(var i = 1; i <= 20; i++) {
            if(localStorage.getItem(`newClientName-${i}`) == undefined) {
              localStorage.setItem(`newClientName-${i}`, firstNameSignUp + " " + lastNameSignUp);
              localStorage.setItem(`newClientEmail-${i}`, emailSignUp);
              break;
            }
          }
          
          event.target.style.display = "none";
          document.getElementById("copyInviteLink").style.display = "flex";

          //Add client name to list
          var clientRow = document.querySelector("#clientList .w-dyn-item");
          if(clientRow) {
            clientRow = clientRow.cloneNode(true);
          } else {
            clientRow = document.querySelector("#userSummaryEmpty").cloneNode(true);
            clientRow.style.display = 'grid';
          }

          clientRow.querySelector("#initials").innerText = firstNameSignUp[0]+lastNameSignUp[0];
          clientRow.querySelector("#userSummaryName").innerText = firstNameSignUp + " " + lastNameSignUp;
          clientRow.querySelector("#clientJoined").innerText = "";
          clientRow.querySelector("#clientType").innerText = "";
          clientRow.querySelector("#customWorkouts").innerText = "";
          clientRow.querySelector("#customWorkouts").style.backgroundColor = "white";
          clientRow.querySelector("#customProgram").innerText = "";
          clientRow.querySelector("#customProgram").style.borderColor = "white";
          clientRow.querySelector("#customProgram").style.backgroundColor = "white";
          clientRow.querySelector("#status").innerText = "Pending";
          clientRow.querySelector("#statusImg").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/653f6d26b85dced5a62e2e02_Pending.webp";
          clientRow.onclick = null; // Remove the old event


          clientRow.onclick = (event) => { 
            //Hide user summary list
            document.getElementById("userSummaryPage").style.display = "block";
            if(!event.target.closest("#userOptionsLink") && event.target.id != "copyInviteLinkDropdown") {
              alert("Please wait for your client to fill out the form before making a program"); 

            }
            document.getElementById("programPage").style.display = "none";
            document.getElementById("programBuilder").style.display = "none";
            document.getElementById("userDetailsPage").style.display = "none";


            
            return
          };

          //Check if user list has items in it
          if(document.querySelector("#clientList .w-dyn-item")) {

            document.getElementById("clientList").appendChild(clientRow);

          } else {
            //If not then append to list wrapper
            
            //Insert cloned item in wrapper list
            var listWrapper = document.querySelector(".clientlistwrapper");

            // Add clonedExercise as the first child of wrapper
            listWrapper.insertBefore(clientRow, listWrapper.firstChild);
            //Hide empty state
            document.querySelector(".userlistemptystate").style.display = "none";

          }

          //Append gym id to onboard form
          const ptGymID = document.getElementById("gymID").innerText;
          document.getElementById("copyInviteLink").href += `?pt=${ptGymID}`

        } else {
          alert("Please fill in all user details");
        }

      } else if(event.target.closest(".addset")) {

        if(event.target.closest(".exercise-list-item-superset")) {
          const exercisesInSuperset = event.target.closest(".exercise-list-item-superset").querySelectorAll(".exercise-list-item");
          for(var i = 0; i < exercisesInSuperset.length; i++) {
            handleAddSet(exercisesInSuperset[i].querySelector(".addset"));
          }
        } else {
          handleAddSet(event.target);
        }

        

      } else if(event.target.id == "removeFullExercise") {
        
        const workoutList = document.getElementById("workoutList");
        const removedElement = workoutList.removeChild(event.target.closest(".exercise-list-item"));
        
        const listLength = workoutList.childNodes.length;
        const saveWorkout = document.getElementById("saveWorkout");
        
        if (listLength == 1) {
          document.getElementById("firstExercisePlaceholder").style.display = "block";

          //Hide workout button if there is only one exercise in list
          saveWorkout.style.display = "none";
          
        } else if(listLength >= 2) {

          const firstElement = workoutList.querySelector("ul > li:nth-child(2)");
          const lastElement = workoutList.querySelector(`ul > li:nth-child(${listLength})`);

          if(listLength == 2) {
            //Hide superset button
            if(firstElement) {
              firstElement.querySelector(".supersetparent").style.display = "none";
            }
          }
          
          if(firstElement) {
            if(firstElement.querySelector("#moveUp")) {
              firstElement.querySelector("#moveUp").style.display = "none";
            }	
            if(listLength == 2 && firstElement.querySelector("#moveDown")) {
              firstElement.querySelector("#moveDown").style.display = "none";
            }
          }

          if(lastElement != firstElement && lastElement && lastElement.querySelector("#moveDown")) {
              lastElement.querySelector("#moveDown").style.display = "none";
              lastElement.querySelector(".supersetparent").style.display = "none";
          }
        }

        var workoutExerciseItemId = removedElement.querySelector("#itemID").innerText;

        //Check if the guide exercise is still in the list, if not then turn border back to SF blue
        var result = checkIfLastExerciseInList(workoutExerciseItemId);
        if(result) {
          result.style.borderColor = "rgb(12, 8, 213)"
        }
      
      } else if(event.target.id == "moveUp" || event.target.id == "moveUpLink") {
        

        var currentExercise = event.target.closest(".exercise-list-item").querySelector("#guidePlaceHolder");

        //Check the first element in a superset up arrow is not clicked
        const previousSibling = event.target.closest(".exercise-list-item").previousSibling;
        if(previousSibling != null && !previousSibling.classList.contains("exercise-list-item-superset")) {
          var previousExercise = previousSibling.querySelector("#guidePlaceHolder");

          var temp = currentExercise.removeChild(currentExercise.querySelector("#guideCopy"));
  
          currentExercise.appendChild(previousExercise.removeChild(previousExercise.querySelector("#guideCopy")));
          previousExercise.appendChild(temp);    
        }
     

      } else if(event.target.id == "moveDown" || event.target.id == "moveDownLink") {

        var currentExercise = event.target.closest(".exercise-list-item").querySelector("#guidePlaceHolder");
        const nextSibling = event.target.closest(".exercise-list-item").nextSibling;
        //Check the last element in a superset down button is clicked
        if(nextSibling != null && !nextSibling.classList.contains("exercise-list-item-superset")) {
          var nextExercise = nextSibling.querySelector("#guidePlaceHolder");
        
          var temp = currentExercise.removeChild(currentExercise.querySelector("#guideCopy"));
  
          currentExercise.appendChild(nextExercise.removeChild(nextExercise.querySelector("#guideCopy")));
          nextExercise.appendChild(temp); 
        }
 

      } else if(event.target.closest("#createTaskButton")) {

        //Show Modal
        var createTaskModal = document.getElementById("createTaskModal");
        //Set flex styling:
        createTaskModal.style.display = "flex";
        createTaskModal.style.flexDirection = "column";
        createTaskModal.style.justifyContent = "center";
        createTaskModal.style.alignItems = "center";

        sessionStorage.setItem("editTask", "false");
        sessionStorage.setItem("createTask", "true");
      
      } else if(event.target.closest("#submitTask")) {

        const taskForm = document.getElementById("taskForm");
        if(taskForm.checkValidity()) {
          submitTaskForm();
        } else {
          document.getElementById("taskInputName").reportValidity();
        }
        
      
      } else if(event.target.closest("#createExercise") || event.target.closest("#emptyCreateExercise") || event.target.closest("#addCustomExerciseWorkout")) {

        //Show Modal
        var createExerciseModal = document.getElementById("createExerciseModal");
        //Set flex styling:
        createExerciseModal.style.display = "flex";
        createExerciseModal.style.flexDirection = "column";
        createExerciseModal.style.justifyContent = "center";
        createExerciseModal.style.alignItems = "center";

        sessionStorage.setItem("editExercise", "false");
        

      } else if(event.target.id == "submitCreateExercise") {

        var exerciseForm = document.getElementById("exerciseForm");
        const videoValid = checkInvalidVideoLink();
        const videoLinkValue = document.getElementById("videoLink").value;
        const videoInput = document.getElementById('videoInput');
        var uploadedVideoText = document.getElementById("fileNameContainer").innerText;

        if(exerciseCategories.size == 0) {
          alert("Please select a category for the exercise.");
          
          document.getElementById("categoryParent").style.borderColor = '#EE1D29';

        } else if(primaryMuscles.size == 0) {

          alert("Please select a primary muscle for the exercise.");
          
          document.getElementById("primaryParent").style.borderColor = '#EE1D29';

        } else if(videoLinkValue != "" && videoValid.includes("Invalid")) {

          //Highlight video input as error - videoValid
          alert(videoValid);

        } else if(videoLinkValue == "" && uploadedVideoText == "" && videoInput.files.length == 0) {
          alert("Please add media to your exercise");
        } else if(exerciseForm.checkValidity()) {
          //Submit exercise form
          submitExerciseUploadForm();
        } else {
          document.getElementById("uploadExerciseName").reportValidity();
        }



      } else if(event.target.id == "closeTaskModal") {
        hideAndClearTaskModal();
      
      } else if(event.target.id == "closeCreateExerciseModal") {
        updatedMedia = false;
        hideAndClearExerciseUploadModal();

      } else if(event.target.classList.contains("categorytext")) {

        event.target.classList.add("categorytextselected");
        event.target.classList.remove("categorytext");

        exerciseCategories.add(event.target.innerHTML);
        document.getElementById("categoryParent").style.borderColor = '#cacaca';
      
      } else if(event.target.classList.contains("primarymuscletext")) {

        event.target.classList.add("primarytextselected");
        event.target.classList.remove("primarymuscletext");

        primaryMuscles.add(event.target.innerHTML);
        document.getElementById("primaryParent").style.borderColor = '#cacaca';
      
      } else if(event.target.classList.contains("secondarymuscletext")) {

        event.target.classList.add("secondarytextselected");
        event.target.classList.remove("secondarymuscletext");

        secondaryMuscles.add(event.target.innerHTML);
      
      } else if(event.target.classList.contains("categorytextselected")) {
        event.target.classList.remove("categorytextselected");
        event.target.classList.add("categorytext");

        exerciseCategories.delete(event.target.innerHTML);
      
      } else if(event.target.classList.contains("primarytextselected")) {
        event.target.classList.remove("primarytextselected");
        event.target.classList.add("primarymuscletext");

        primaryMuscles.delete(event.target.innerHTML);
      
      } else if(event.target.classList.contains("secondarytextselected")) {
        event.target.classList.remove("secondarytextselected");
        event.target.classList.add("secondarymuscletext");

        secondaryMuscles.delete(event.target.innerHTML);
      
      } else if (event.target.id == "createWorkout" || event.target.id == "createWorkoutImage" || event.target.id == "createWorkoutText" ||
      event.target.id == "createWorkoutTablet" || event.target.id == "createWorkoutImageTablet" || event.target.id == "createWorkoutTextTablet") {
        //Hide save button
        document.getElementById("saveWorkout").style.display = "none";
        //Show place holder
        document.getElementById("firstExercisePlaceholder").style.display = "block";
        //Change text for submit button
        const saveWorkout = document.getElementById("saveWorkout");
        saveWorkout.value = "Create Workout";

        //Set create workout flag
        sessionStorage.setItem("createWorkout", true);
        //Go to workout builder
        document.getElementById("workoutBuilderPage").style.display = "block";
        document.getElementById("workoutSummaryPage").style.display = "none";
      } else if (event.target.closest("#createChallenge")) {
        //Remove all events first
        calendar.removeAllEvents();

        document.getElementById("calendarTitle").innerText = "Day";

        //Set number of weeks to 2
        updateCalendarWeeks(2, "challenge");

        addDatePickers();

        //Set program flag to create
        sessionStorage.setItem("createChallenge", 'true');

        document.getElementById("programBuilder").style.display = "block";

        document.getElementById("workout-task-select").style.display = "flex";

        //Show form inputs for program builder
        var programBuilderInfo = document.getElementById("challengeBuilderInfo");
        programBuilderInfo.style.display = "flex";
        programBuilderInfo.style.flexDirection = "row";
        programBuilderInfo.style.alignContent = "flex-end";
        programBuilderInfo.style.justifyContent = "space-between";
        
        document.getElementById("challengeBuilderInfo").style.display = "flex";
        
        refreshCalendarLayout();

        if(document.getElementById("weeklyTasksCheckbox").checked) {
          document.getElementById("weeklyTasksCheckbox").click();
        }
        
        //Hide assign program:
        document.querySelector(".programinfodiv").style.display = "none";
        document.getElementById("challengesBody").style.display = "none";
        //Hide add week
        document.querySelector("#addWeekButton").style.display = "none";

        document.getElementById("saveChallenge").innerText = "Create";
        document.getElementById("saveChallenge").value = "Create";
        
      
      } else if (event.target.id == "createProgram" || event.target.id == "createProgramImage" || event.target.id == "createProgramText") {
        //Remove all events first
        calendar.removeAllEvents();

        //Set number of weeks to 4
        updateCalendarWeeks(4);

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

        hideOrShowGodModeSwitch();

      } else if(event.target.id == "reset-filters" || event.target.id == "reset-filters-ipad" || event.target.id == "reset-filters-modal" || event.target.id == "reset-filters-program-modal" || event.target.id == "reset-filters-users" ) {
        resetGeneralFilters(true);
      } else if (event.target.id == "arrowImg" || event.target.id == "filterOn" || event.target.id == "filterButton" || event.target.id == "filtersText" || event.target.id == "filtersImage" ||
        event.target.id == "filterMenuChild" || event.target.classList.contains('filter-title') || event.target.classList.contains('filter-label') 
        || event.target.classList.contains('filter-checkbox') || event.target.classList.contains('clear-filter') || (event.target.tagName == "INPUT" &&  event.target.id != "workoutSearch" && !(event.target.id.includes("radio"))) || event.target.classList.contains('clear-container') || event.target.classList.contains('clear-filters')) {
        document.getElementById("filterMenu").style.display = "block";

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
      } else if(event.target.id == "deleteProgram") {
        //Get row of clicked element:
        var currentProgramRow = event.target.closest(".programsummary");

        //Build object to send to make
        var program = {};

        //Workout summary ID
        program["programSummaryID"] = currentProgramRow.querySelector("#programID").innerText;

        //Gym dashboard ID
        program["gymdashboardID"] = document.getElementById("gymID").innerText;

        event.target.innerText = "Deleting...";

        //Send to make to delete workout
        deleteProgram(program, currentProgramRow, event.target);

      } else if(event.target.id == "deleteExercise") {

        //Get row of clicked element:
        var currentExerciseRow = event.target.closest(".exerciseguideitem");

        //Build object to send to make
        var exercise = {};

        //Workout summary ID
        exercise["exerciseSummaryID"] = currentExerciseRow.querySelector("#exerciseLibraryID").innerText;

        //Gym dashboard ID
        exercise["gymdashboardID"] = document.getElementById("gymID").innerText;

        //Gym name
        exercise["gymName"] = document.getElementById("gymID").innerText;

        event.target.innerText = "Deleting...";
        //Send to make to delete workout
        deleteExercise(exercise, currentExerciseRow, event.target);

      
      } else if(event.target.id == "deleteWorkout") {
        //Get row of clicked element:
        var currentWorkoutRow = event.target.closest(".workoutsummaryitem");

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
        event.target.innerText = "Deleting...";
        //Send to make to delete workout
        deleteWorkout(workout, currentWorkoutRow, event.target);


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
        prefillWorkoutBuilder(event.target.parentElement);

      } else if(event.target.id == "workoutTitleDiv" || event.target.id == "workoutDifficulty" || event.target.id == "workoutDuration" || event.target.id == "workoutLastEdited") {

        //Note that this is editing a workout
        sessionStorage.setItem('editWorkout', 'true');
        sessionStorage.setItem("viewingEditFirstTime", 'true');
        //Prefill workout builder with the selected workout
        prefillWorkoutBuilder(event.target.closest("#workoutSummary").parentElement);

      } else if(event.target.id == "workoutSummaryName" || event.target.id == "workoutSummaryDescription") {
        
        //Note that this is editing a workout
        sessionStorage.setItem('editWorkout', 'true');
        sessionStorage.setItem("viewingEditFirstTime", 'true');
        //Prefill workout builder with the selected workout
        prefillWorkoutBuilder(event.target.closest("#workoutSummary").parentElement);

      } else if (event.target.id == "duplicateWorkout") {
        //Note that this is dupicating an existing workout
        sessionStorage.setItem('duplicateWorkout', 'true');

        //Prefill workout builder with the selected workout
        prefillWorkoutBuilder(event.target.closest("#workoutSummary").parentElement);

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

        document.getElementById("searchFilterImg").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/65a20d9f411a1103276ef909_filter.webp";
        resetGeneralFilters();
        
      } else if(event.target.id == "clearCustomExerciseFilters") {
        document.getElementById("exerciseSearchFilterImg").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/65a20d9f411a1103276ef909_filter.webp";
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
        
        if (document.getElementById("filterBodyProgramModal").style.display == "flex" && !event.target.classList.value.includes("checkbox-field")) {
          document.getElementById("filterBodyProgramModal").style.display = "none";

          //Rotate arrow back:
          document.getElementById("arrowWrapperProgramModal").style.transform = 'rotate(0deg)';
          document.getElementById("filterButtonProgramModal").click();
        }

        if (document.getElementById("userFilterBody").style.display == "flex" && !event.target.classList.value.includes("checkbox-field")) {
          document.getElementById("userFilterBody").style.display = "none";

          //Rotate arrow back:
          document.getElementById("userArrowWrapper").style.transform = 'rotate(0deg)';
          document.getElementById("userFilterButton").click();
        }

      }
    }, false);

    document.addEventListener('input', function(event) {
      if(event.target.id == "userNotes" || event.target.id == "userLimitations") {
        userInputsChanged = true;
      }
    });

    //Listen for change events:
    document.addEventListener('change', function (event) {

      if(event.target.id == "quantityUnit") {
        if(event.target.value.toLowerCase() == "amrap" ) {
          //Hide reps input
          event.target.closest("#exerciseInfo").querySelector("#repsInput").style.display = "none";
          event.target.closest("#exerciseInfo").querySelector("#repsInput").required = false;     
        } else {
          event.target.closest("#exerciseInfo").querySelector("#repsInput").style.display = "flex";
          event.target.closest("#exerciseInfo").querySelector("#repsInput").required = true;  
        }
      }

      if(event.target.id == "weeklyTasksCheckbox") {
        var display = "none";
        if(event.target.checked) {
          display = ""
        } 

        var weeklyTaskElements = document.querySelectorAll(".weekly-task");

        for(var i = 0; i < weeklyTaskElements.length; i++) {
          weeklyTaskElements[i].style.display = display;
        }
        
      }

      if(event.target.id == "measureInput") {

        if(event.target.value.toLowerCase() == "rpe" || event.target.value.toLowerCase() == "rir") {
          //Hide reps input
          event.target.closest("#exerciseInfo").querySelector(".middle-item").style.display = "none";
          event.target.closest("#exerciseInfo").querySelector("#repsInput").required = false;     
          //Show load amount input
          event.target.closest("#exerciseInfo").querySelector(".middle-loadamount").style.display = "flex";
          event.target.closest("#exerciseInfo").querySelector("#loadAmountInput").required = true;     
          event.target.closest("#exerciseInfo").querySelector(".middle-loadamount").style.width = "";

        } else if(event.target.value.toLowerCase() == "zone") {
          //Show load amount input
          event.target.closest("#exerciseInfo").querySelector(".middle-loadamount").style.display = "flex";
          event.target.closest("#exerciseInfo").querySelector(".middle-loadamount").style.width = "10%";
          event.target.closest("#exerciseInfo").querySelector("#loadAmountInput").required = true;   
          event.target.closest("#exerciseInfo").querySelector(".middle-item").style.display = "flex";
          event.target.closest("#exerciseInfo").querySelector("#repsInput").required = true; 
        
        } else {
          //Hide reps input
          event.target.closest("#exerciseInfo").querySelector(".middle-item").style.display = "flex";
          event.target.closest("#exerciseInfo").querySelector("#loadAmountInput").required = false;   
          
          //Show load amount input
          event.target.closest("#exerciseInfo").querySelector(".middle-loadamount").style.display = "none";
          event.target.closest("#exerciseInfo").querySelector("#repsInput").required = true; 
            
        }
      }

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
          checkAndClearProgram("workoutSummaryPage", "workoutsPage", "workoutSummaryDiv");
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

          if (res["workoutFormModal"] !== undefined) {

            if (res["workoutFormModal"] > 0) {
              document.getElementById("filterOnModal").style.display = "block";
            } else {
              document.getElementById("filterOnModal").style.display = "none";
            }
          }

          if (res["programFormModal"] !== undefined) {

            if (res["programFormModal"] > 0) {
              document.getElementById("filterOnProgramModal").style.display = "block";
            } else {
              document.getElementById("filterOnProgramModal").style.display = "none";
            }
          }
              
          if (res["workoutSummaryFilters"] !== undefined) {

            if(res["workoutSummaryFilters"] > 0) {
              document.getElementById("filterOn").style.display = "block";
            } else {
              document.getElementById("clearExperienceExerciseFilters").style.display = "none";
              document.getElementById("filterOn").style.display = "none";
            }
          } 

          if (res["programSummaryForm"] !== undefined) {}
          
          if (res["workoutBuilderForm"] !== undefined) {
            if (res["workoutBuilderForm"] > 0) {
              document.getElementById("searchFilterImg").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/65a20d9f736b28beba8a0a8a_filterFilled.webp";
              document.getElementById("clearExperienceExerciseFilters").style.display = "block";
              document.getElementById("filterOnIpad").style.display = "block";
              document.getElementById("reset-filters-ipad").style.display = "block";
            } else {
              document.getElementById("searchFilterImg").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/65a20d9f411a1103276ef909_filter.webp";
              document.getElementById("filterOnIpad").style.display = "none";
              document.getElementById("reset-filters-ipad").style.display = "none";
            }

          } 
          
          if (res["userSummaryForm"] !== undefined) {
            if (res["userSummaryForm"] > 0) {
              document.getElementById("clearClientFilters").style.display = "block";
              document.getElementById("clientFilterImage").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/65a20d9f736b28beba8a0a8a_filterFilled.webp";

            } else {
              document.getElementById("clearClientFilters").style.display = "none";
              document.getElementById("clientFilterImage").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/65a20d9f411a1103276ef909_filter.webp";
            }

          } 
          
          if (res["exerciseLibraryForm"] !== undefined) {

            if (res["exerciseLibraryForm"] > 0) {
              document.getElementById("exerciseSearchFilterImg").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/65a20d9f736b28beba8a0a8a_filterFilled.webp";
              document.getElementById("clearCustomExerciseFilters").style.display = "block";
              document.getElementById("exerciseFilterBodyIpad").style.display = "block";
            } else {
              document.getElementById("exerciseSearchFilterImg").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/65a20d9f411a1103276ef909_filter.webp";
              document.getElementById("exerciseFilterBodyIpad").style.display = "none";
            }
          }         
        });
      }
    }, false);

    document.addEventListener("mouseover",function (event) {

      if(event.target.closest("#workoutsPage") || event.target.closest("#navPanel")) {
        //document.getElementById("navPanel").style.display = "flex";
      }
      
      if(event.target.id == "experienceTag" || event.target.id == "experience") {
        document.getElementById("toolTipText").style.display = "block";
      }

      
      if(event.target.closest("#dashboardPage")) {
        if(!event.target.closest("#dashboardPage").classList.contains("clickednavbutton")) {
          event.target.closest("#dashboardPage").style.backgroundColor = "rgba(102, 106, 112, 0.55)";
        } else {
          event.target.closest("#dashboardPage").style.backgroundColor = "#0C08D5";
        }
      }

      if(event.target.closest("#equipmentPage")) {
        if(!event.target.closest("#equipmentPage").classList.contains("clickednavbutton")) {
          event.target.closest("#equipmentPage").style.backgroundColor = "rgba(102, 106, 112, 0.55)";
        } else {
          event.target.closest("#equipmentPage").style.backgroundColor = "#0C08D5";
        }
      }

      if(event.target.closest("#challengesPage")) {
        if(!event.target.closest("#challengesPage").classList.contains("clickednavbutton")) {
          event.target.closest("#challengesPage").style.backgroundColor = "rgba(102, 106, 112, 0.55)";
        } else {
          event.target.closest("#challengesPage").style.backgroundColor = "#0C08D5";
        }
      }

      if(event.target.closest("#workoutsPage")) {
        if(!event.target.closest("#workoutsPage").classList.contains("clickednavbutton")) {
          event.target.closest("#workoutsPage").style.backgroundColor = "rgba(102, 106, 112, 0.55)";
        } else {
          event.target.closest("#workoutsPage").style.backgroundColor = "#0C08D5";
        }
      }

      if(event.target.closest("#userPage")) {
        if(!event.target.closest("#userPage").classList.contains("clickednavbutton")) {
          event.target.closest("#userPage").style.backgroundColor = "rgba(102, 106, 112, 0.55)";
        } else {
          event.target.closest("#userPage").style.backgroundColor = "#0C08D5";
        }
      }
      

      if(event.target.closest("#settingsPage")) {
        if(!event.target.closest("#settingsPage").classList.contains("clickednavbutton")) {
          event.target.closest("#settingsPage").style.backgroundColor = "rgba(102, 106, 112, 0.55)";
        } else {
          event.target.closest("#settingsPage").style.backgroundColor = "#0C08D5";
        }
      }

      if(event.target.closest("#helpDiv")) {
        if(!event.target.closest("#helpDiv").classList.contains("clickednavbutton")) {
          event.target.closest("#helpDiv").style.backgroundColor = "rgba(102, 106, 112, 0.55)";
        } else {
          event.target.closest("#helpDiv").style.backgroundColor = "#0C08D5";
        }
      }
      
    }, false);

    document.addEventListener("mouseout",function (event) {

      if(event.target.closest(".navbar")) {
        //document.getElementById("navPanel").style.display = "none";
      }

      if(event.target.id == "experienceTag" || event.target.id == "experience") {
        document.getElementById("toolTipText").style.display = "none";
      }

      if(event.target.closest("#dashboardPage")) {
        if(!event.target.closest("#dashboardPage").classList.contains("clickednavbutton")) {
          event.target.closest("#dashboardPage").style.backgroundColor = "";
        } else {
          event.target.closest("#dashboardPage").style.backgroundColor = "#0C08D5";
        }
      }

      if(event.target.closest("#equipmentPage")) {
        if(!event.target.closest("#equipmentPage").classList.contains("clickednavbutton")) {
          event.target.closest("#equipmentPage").style.backgroundColor = "";
        } else {
          event.target.closest("#equipmentPage").style.backgroundColor = "#0C08D5";
        }
      }

      if(event.target.closest("#workoutsPage")) {
        if(!event.target.closest("#workoutsPage").classList.contains("clickednavbutton")) {
          event.target.closest("#workoutsPage").style.backgroundColor = "";
        } else {
          event.target.closest("#workoutsPage").style.backgroundColor = "#0C08D5";
        }
      }

      if(event.target.closest("#challengesPage")) {
        if(!event.target.closest("#challengesPage").classList.contains("clickednavbutton")) {
          event.target.closest("#challengesPage").style.backgroundColor = "";
        } else {
          event.target.closest("#challengesPage").style.backgroundColor = "#0C08D5";
        }
      }

      if(event.target.closest("#userPage")) {
        if(!event.target.closest("#userPage").classList.contains("clickednavbutton")) {
          event.target.closest("#userPage").style.backgroundColor = "";
        } else {
          event.target.closest("#userPage").style.backgroundColor = "#0C08D5";
        }
      }
      if(event.target.closest("#settingsPage")) {
        if(!event.target.closest("#settingsPage").classList.contains("clickednavbutton")) {
          event.target.closest("#settingsPage").style.backgroundColor = "";
        } else {
          event.target.closest("#settingsPage").style.backgroundColor = "#0C08D5";
        }
      }
      if(event.target.closest("#helpDiv")) {
        if(!event.target.closest("#helpDiv").classList.contains("clickednavbutton")) {
          event.target.closest("#helpDiv").style.backgroundColor = "";
        } else {
          event.target.closest("#helpDiv").style.backgroundColor = "#0C08D5";
        }
      }

    }, false);

    function styleStartAndEndDates(startChallengeValue, endChallengeValue) {

      var dateParent = document.getElementById("dateParent");

      if(startChallengeValue == endChallengeValue) {
        dateParent.style.borderColor = "#EE1D29";
        document.getElementById("requiredDatesText").style.display = "block";
        
      } else {
        dateParent.style.borderColor = "#cacaca";
        document.getElementById("requiredDatesText").style.display = "none";
      }
    }

    function addEventToCalendar() {

      // Add the new event to the calendar
      calendar.addEvent(newEvent);

      //Check if no programs have been added - and just workout is added, create program to ensure the data is saved
      if (Object.keys(userTrainingPlan).length === 0) {
        const startOfWeek = moment(newEvent.start).startOf('week').format('YYYY-MM-DD');
        const endOfWeek = moment(newEvent.start).endOf('week').format('YYYY-MM-DD');
        //add program to global userProgram list
        var programObj = {};
        programObj["programName"] = document.getElementById("trainingPlanName").innerText;
        programObj["programID"] = "none";
        programObj["events"] = [newEvent];
        programObj["startWeek"] = startOfWeek;
        programObj["endWeek"] = endOfWeek;

        userTrainingPlan.push(programObj);

        //Sort the programs by start week
        userTrainingPlan.sort(function(a, b) {
          var dateA = moment(a.startWeek, "YYYY-MM-DD");
          var dateB = moment(b.startWeek, "YYYY-MM-DD");
          return dateA - dateB;
        });

      }

    }

    function checkInvalidVideoLink() {

      const videoLink = document.getElementById("videoLink").value;

      // Define regex patterns for YouTube and Vimeo video links
      const youtubePattern = /(https?:\/\/)?(www\.)?(youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;

      const vimeoPattern = /https?:\/\/(www\.)?vimeo\.com\/\d+/i;

      // Check if the link is a valid YouTube or Vimeo link
      if (youtubePattern.test(videoLink)) {
          // Extract video ID from YouTube link
          const videoIdMatch = videoLink.match(youtubePattern);
          if (videoIdMatch) {
              return `YouTube Video ID: ${videoIdMatch[4]}`;
          } else {
              return 'Invalid YouTube link';
          }

      } else if (vimeoPattern.test(videoLink)) {
          // Extract video ID from Vimeo link
          const videoIdMatch = videoLink.match(/\/(\d+)/);
          if (videoIdMatch) {
              return `Vimeo Video ID: ${videoIdMatch[1]}`;
          } else {
              return 'Invalid Vimeo link';
          }

      } else {
          return 'Invalid video link. Supported platforms: YouTube, Vimeo.';
      }
    }

    function clickModalListItem(listID, itemID, listItemSelector) {

      var listItems = document.querySelectorAll(listID);
      for(var i = 0; i < listItems.length; i++) {
        if(listItems[i].querySelector(listItemSelector).innerText == itemID) {
          listItems[i].click();
          break;
        }
      }

    }

    function submitTaskForm() {

      const taskName = document.getElementById("taskInputName").value;
      const taskContentLink = document.getElementById("taskContentLink").value;
      const taskDescription = document.getElementById("taskDescription").value;

      const formData = new FormData();
      formData.append('name', taskName);
      formData.append('taskContentLink', taskContentLink);
      formData.append('taskDescription', taskDescription);
      formData.append('gymID', document.getElementById("gymID").innerText);
      formData.append('taskID', document.getElementById("taskID").value);

      //Task content
      var taskContent = document.getElementById("contentInput");
    
      if (taskContent.files && taskContent.files.length > 0) {
        var file = taskContent.files[0]; // Get the first file
        formData.append('taskFile', file);
      }

      //Task product image
      var taskImage = document.getElementById("affiliateInput");
    
      if (taskImage.files && taskImage.files.length > 0) {
        var file = taskImage.files[0]; // Get the first file
        formData.append('taskImage', file);
      }

      if(sessionStorage.getItem("editTask") == "true") {

        submitTaskToMake("https://hook.us1.make.com/ojgq4bok6717v1x8rh6fobyn5n0bjzon", "update", null, formData);
        updateSelectedTask();
        hideAndClearTaskModal();
      } else {
        var newTask = addNewTaskToList(formData);
        submitTaskToMake("https://hook.us1.make.com/9rqng7uxekaivq5oczbo32fswndx6ey8", "create", newTask, formData);
      }

    }

    function submitExerciseUploadForm() {

      //Exercise name
      const exerciseUploadName = document.getElementById("uploadExerciseName").value;

      //Categories - use exerciseCategories
      const categoriesString = Array.from(exerciseCategories).join(',');

      //Primary Muscles
      const uploadPrimaryMuscles = Array.from(primaryMuscles).join(',');
      const uploadScientificMuscles = Array.from(primaryMuscles).map(muscle => reverseMuscleMapping[muscle]);


      //Secondary Muscles
      const uploadSecondaryMuscles = Array.from(secondaryMuscles).join(',');
      const secondaryScientificMuscles = Array.from(secondaryMuscles).map(muscle => reverseMuscleMapping[muscle]);


      //Exercise Notes
      const exerciseNotes = document.querySelector(".editor").innerHTML;

      //Link
      const videoLink = document.getElementById("videoLink").value;

      //Video upload
      const videoInput = document.getElementById('videoInput');
      var videoFile = null;
      if(videoInput.files.length > 0) {
        videoFile = videoInput.files[0];
      }

      //Now add all of these to form data
      const formData = new FormData();
      const tempID = uuidv4();
      var videoThumbnail = "";
      formData.append('exerciseName', exerciseUploadName);
      formData.append('categories', categoriesString);
      formData.append('primaryCasualMuscles', uploadPrimaryMuscles);
      formData.append('primaryScientificMuscles', uploadScientificMuscles);
      formData.append('secondaryCasualMuscles', uploadSecondaryMuscles);
      formData.append('secondaryScientificMuscles', secondaryScientificMuscles);
      formData.append('gymID', document.getElementById("gymID").innerText);
      formData.append('gymName', document.getElementById("gymFullName").innerText);
      formData.append('tempID', tempID);
      formData.append('guideID', document.getElementById("libraryFormGuideID").innerText);
      formData.append('mediaUpdated', updatedMedia);
      formData.append('exerciseNotes', exerciseNotes);
      
      if(videoFile) {
        if(sessionStorage.getItem("editExercise") == 'false') {
          handleVideoUpload(formData, videoFile);
        } else {
          // Your JW Player script link
          var jwPlayerScriptLink = document.getElementById("fileUploadLink").innerText;

          // Define a regular expression pattern to extract the media ID
          var regex = /\/players\/([a-zA-Z0-9_-]+)-/;

          // Use the exec method to match the pattern in the link
          var match = regex.exec(jwPlayerScriptLink);

          // Check if there is a match and get the media ID
          if (match && match[1]) {
            var mediaID = match[1];
            handleVideoUpload(formData, videoFile, "update", mediaID);
          } else {
            handleVideoUpload(formData, videoFile, "updateUpload");
          }
        }
        
      } else if(updatedMedia && videoLink != "") {

        formData.append('videoLink', videoLink);
        videoThumbnail = getVideoThumbnail(videoLink);
        formData.append('videoThumbnail', videoThumbnail);

        if(sessionStorage.getItem("editExercise") == 'false') {
          sendNewExerciseToMake(formData);
        } else {
          sendNewExerciseToMake(formData, "update");
        }
        
      } else {
        sendNewExerciseToMake(formData, "update");
      }

      if(sessionStorage.getItem("editExercise") == 'false') {
        cloneAndFillExerciseLibrary(formData);
        cloneAndFillExerciseList(formData);
      } else {
        updateExerciseLibraryItem(formData, videoFile);
        updateExerciseListItem(formData, videoFile);
      }

      hideAndClearExerciseUploadModal();

    }

    function getVideoThumbnail(videoLink) {
      // Define regex patterns for YouTube and Vimeo video links
      const youtubePattern = /(https?:\/\/)?(www\.)?(youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
      const vimeoPattern = /https?:\/\/(www\.)?vimeo\.com\/\d+/i;
  
      // Check if the link is a valid YouTube or Vimeo link
      if (youtubePattern.test(videoLink)) {
          // Extract video ID from YouTube link
          const videoIdMatch = videoLink.match(youtubePattern);
          if (videoIdMatch) {
              const videoId = videoIdMatch[4];
              return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
          } else {
              throw new Error('Invalid YouTube link');
          }
      } else if (vimeoPattern.test(videoLink)) {
          // Extract video ID from Vimeo link
          const videoIdMatch = videoLink.match(/\/(\d+)/);
          if (videoIdMatch) {
              const videoId = videoIdMatch[1];
              // You may need to make an API call to Vimeo to get the thumbnail URL
              // This is just a placeholder URL, replace it with the actual Vimeo API call
              return `https://vumbnail.com/${videoId}_medium.jpg`;
              
          } else {
              throw new Error('Invalid Vimeo link');
          }
      } else {
          throw new Error('Invalid video link. Supported platforms: YouTube, Vimeo.');
      }
    }

    function updateExerciseLibraryItem(formData, videoFile=null) {

      // Find element in list that was edited
      const exerciseItems = document.querySelectorAll(".exerciseguideitem");
      for(var i = 0; i < exerciseItems.length; i++) {
        var exerciseItem = exerciseItems[i];
        if(exerciseItem.querySelector("#exerciseLibraryID").innerText == formData.get('guideID')) {

          exerciseItem.querySelector("#exerciseLibraryName").innerText = formData.get('exerciseName');
          exerciseItem.querySelector("#primaryExerciseLibraryMuscles").innerText = formData.get('primaryCasualMuscles');
          exerciseItem.querySelector("#secondaryExerciseLibraryMuscles").innerText = formData.get('secondaryCasualMuscles');

          //Update category
          exerciseItem.querySelector("#exerciseLibraryCategory").innerText = formData.get("categories");

          var videoLink = formData.get('videoLink');
          var uploadType = videoLink ? true : false; // Check if videoLink is not empty

          exerciseItem.querySelector('#exerciseLibraryTempID').innerText = formData.get("tempID");


          if(uploadType) {
            exerciseItem.querySelector("#uploadType").innerText = "true";
            exerciseItem.querySelector("#libraryVideoLink").innerText = videoLink;
            exerciseItem.querySelector(".exerciseThumbnail").src = formData.get('videoThumbnail');
          } else if(videoFile) { //Only update if media was updated
            exerciseItem.querySelector("#uploadType").innerText = "false";
            exerciseItem.querySelector(".exerciseThumbnail").parentElement.style.backgroundColor = 'rgba(0, 0, 0, 0)';
            exerciseItem.querySelector(".exerciseThumbnail").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/65597db995abd34586f5f3b7_playButton.webp";

          }

          break;
        }
      }
      updatedMedia = false;
    }

    function updateExerciseListItem(formData, videoFile) {

      const workoutExerciseList = document.querySelectorAll("#guideList .collection-item-10");
      for(var i = 0; i < workoutExerciseList.length; i++) {
        var exerciseItem = workoutExerciseList[i];
        if(exerciseItem.querySelector("#itemID").innerText == formData.get('guideID')) {
          exerciseItem.querySelector('#guideName').innerText = formData.get('exerciseName');
          exerciseItem.querySelector('#exerciseDifficulty').innerText = ''; // Clear experience field

          // Clear and update casualMuscle field
          const casualMuscleFields = exerciseItem.querySelectorAll('#casualMuscle');
          casualMuscleFields.forEach((field, index) => {
            if (index === 0) {
              field.innerText = formData.get('primaryCasualMuscles');
            } else {
              field.remove(); // Remove the extra elements
            }
          });

          // Clear and update scientificPrimaryMuscle field
          const scientificPrimaryMuscleFields = exerciseItem.querySelectorAll('#scientificPrimaryMuscle');
          scientificPrimaryMuscleFields.forEach((field, index) => {
            if (index === 0) {
              field.innerText = formData.get('primaryScientificMuscles');
            } else {
              field.remove(); // Remove the extra elements
            }
          });

          //Set muscle image
          const newMuscleValue = formData.get('primaryScientificMuscles').toLowerCase().replace(/ /g, '-');
          exerciseItem.querySelector('#exerciseMuscleImage').src = `https://d3l49f0ei2ot3v.cloudfront.net/WEBPs/${newMuscleValue}.webp`; 

          // Clear image and experience 
          if(videoFile) {
            exerciseItem.querySelector('#exerciseThumbnail img').src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/65597db995abd34586f5f3b7_playButton.webp";
          } else {
            exerciseItem.querySelector('#exerciseThumbnail img').src = formData.get('videoThumbnail');
          }
          
          exerciseItem.querySelector('#exerciseDifficulty').innerText = ''; // Clear experience field
          exerciseItem.querySelector('#exerciseName').innerText = ''; 

          //Update temp id
          exerciseItem.querySelector('#exerciseListTempID').innerText = formData.get("tempID");

          resetFilters(false, exerciseItem);
          break;
        }
        
      }
    }

    function cloneAndFillExerciseLibrary(formData) {

      const firstListItem = document.querySelector(".exerciseguideitem");
      var exerciseLibraryList = document.querySelector("#exerciseLibraryList");
      var clonedExercise = null;

      if(firstListItem && exerciseLibraryList) {
        //Clone record in list
        clonedExercise = firstListItem.cloneNode(true)
      } else {
        clonedExercise = document.querySelector(".equipment-grid-empty").cloneNode(true);
        clonedExercise.classList.add('exerciseguideitem');
        clonedExercise.style.display = "grid";
      }

      clonedExercise.querySelector(".exerciseThumbnail").parentElement.style.backgroundColor = 'rgba(0, 0, 0, 0)';
      
      //Update thumbnail
      clonedExercise.querySelector(".exerciseThumbnail").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/6555e09dff2373b364d5262a_Spinner-1s-200px%20(1).gif";
      
      //Update exercise name
      clonedExercise.querySelector("#exerciseLibraryName").innerText = formData.get("exerciseName");

      //Update muscles
      clonedExercise.querySelector("#primaryExerciseLibraryMuscles").innerText = formData.get("primaryCasualMuscles");

      //Update category
      clonedExercise.querySelector("#exerciseLibraryCategory").innerText = formData.get("categories");

      //Clear guideID
      clonedExercise.querySelector("#exerciseLibraryID").innerText = "";
      
      //Add temporaryID
      clonedExercise.querySelector("#exerciseLibraryTempID").innerText = formData.get("tempID");

      if(firstListItem && exerciseLibraryList) {
        //Insert at top of list
        document.getElementById("exerciseLibraryList").insertBefore(clonedExercise, firstListItem);
      } else {
        //Insert cloned item in wrapper list
        var listWrapper = document.querySelector(".customexerciselistwrapper");

        // Add clonedExercise as the first child of wrapper
        listWrapper.insertBefore(clonedExercise, listWrapper.firstChild);
        //Hide empty state
        document.querySelector(".exerciseemptystate").style.display = "none";
        
      }

    }

    function parseReturnedVideoLink(videoLink) {
      const youtubePattern = /(https?:\/\/)?(www\.)?(youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
      const vimeoPattern = /https?:\/\/(www\.)?vimeo\.com\/(\d+)/i;

      if (youtubePattern.test(videoLink)) {
          const videoIdMatch = videoLink.match(youtubePattern);
          if (videoIdMatch) {
              return {
                  source: 'youtube',
                  id: videoIdMatch[4]
              };
          } else {
              return { source: 'unknown', id: null };
          }
      } else if (vimeoPattern.test(videoLink)) {
          const videoIdMatch = videoLink.match(vimeoPattern);
          if (videoIdMatch) {
              return {
                  source: 'vimeo',
                  id: videoIdMatch[2]
              };
          } else {
              return { source: 'unknown', id: null };
          }
      } else {
          return { source: 'unknown', id: null };
      }
    }

    

    function updateSelectedTask() {
      var taskItem = document.querySelector(".editedTask");
      if (!taskItem) return; // Exit if no task is selected
    
      // Update task name
      taskItem.querySelector("#taskListName").innerText = document.getElementById("taskInputName").value;
    
      // Update task content link
      taskItem.querySelector("#taskListContentLink").innerText = document.getElementById("taskContentLink").value;
    
      // Update task content file name
      const contentContainerText = document.getElementById("contentContainer").innerText;
      const fileNamePrefix = "File: ";
      if (contentContainerText.startsWith(fileNamePrefix)) {
        taskItem.querySelector("#taskListFilename").innerText = contentContainerText.substring(fileNamePrefix.length);
      } else {
        taskItem.querySelector("#taskListFilename").innerText = "";
      }
    
      // Update the image src attribute if it is not empty or contains only whitespace
      const newImgSrc = document.getElementById("uploadImage2").src;
      if (newImgSrc.trim() !== "") {
        taskItem.querySelector("#taskListContentImage img").src = newImgSrc;
      }
    
      // Update affiliate code / description
      taskItem.querySelector("#taskListDescription").innerText = document.getElementById("taskDescription").value;
    
      // Update task id
      taskItem.querySelector("#taskListItemID").innerText = document.getElementById("taskID").value;
    
      // Remove the editedTask class
      taskItem.classList.remove("editedTask");
    
      // Reset the submit button text
      document.getElementById("submitTask").innerText = "Create";
    
      // Reset the edit task flag
      sessionStorage.setItem("editTask", "false");
    }

    function hideAndClearTaskModal() {

      //Task Name
      document.getElementById("taskInputName").value = "";

      //Task Content Link
      document.getElementById("taskContentLink").value = "";

      //Task Content file name
      document.getElementById("contentContainer").innerText = "";

      //Product thumbnail file name
      document.getElementById("uploadImage2").src = "https://assets-global.website-files.com/627e2ab6087a8112f74f4ec5/65504c5a73ed7d0d9ae8c2c6_Upload.webp";

      //Affiliate code / description
      document.getElementById("taskDescription").value = "";

      //Task id
      document.getElementById("taskID").value = "";

      //Clear file inputs
      document.getElementById("affiliateInput").value = "";

      document.getElementById("contentInput").value = "";

      //Hide Modal
      var createTaskModal = document.getElementById("createTaskModal");
      //Set flex styling:
      createTaskModal.style.display = "none";

      document.getElementById("taskContentUploaded").style.display = "block";
      document.getElementById("taskProductFile").style.display = "block";
      sessionStorage.setItem("createTask", "false");
      sessionStorage.setItem("editTask", "false");

    }
    

    function hideAndClearExerciseUploadModal() {

      sessionStorage.setItem("editExercise", "false");
      //Hide modal
      document.getElementById("createExerciseModal").style.display = "none";

      //Clear form
      document.getElementById("exerciseForm").reset();

      //Clear exercise notes
      document.querySelector(".editor").innerHTML = "";

      //Unclick all categories clicked
      const clickedCategories = document.querySelectorAll(".categorytextselected");
      for(var i = 0; i < clickedCategories.length; i++) {
        clickedCategories[i].click();
      }

      //Unclick all primary clicked
      const clickedPMuscles = document.querySelectorAll(".primarytextselected");
      for(var i = 0; i < clickedPMuscles.length; i++) {
        clickedPMuscles[i].click();
      }

      //Unclick all secondary clicked
      const clickedSMuscles = document.querySelectorAll(".secondarytextselected");
      for(var i = 0; i < clickedSMuscles.length; i++) {
        clickedSMuscles[i].click();
      }

      // Clear the file input field manually
      var fileInput = document.getElementById("videoInput");
      fileInput.value = "";

      // Also, clear the file name container
      var fileNameContainer = document.getElementById('fileNameContainer');
      fileNameContainer.innerHTML = '';

      document.getElementById('fileUploaded').innerHTML = "Click to select from files";

      //Update text
      document.getElementById("submitCreateExercise").innerText = "Create";

      //Clear video upload link
      document.getElementById("fileUploadLink").innerText = "";

    }

    async function handleVideoUpload(formData, videoFile, method="create", mediaID=null) {

      const videoInput = videoFile;
      var httpMethod = "POST";
      var url = 'https://api.jwplayer.com/v2/sites/7BsvKr6C/media';

      if (method === "update" && mediaID) {
        // Step 1: Call the delete API
        const deleteOptions = {
          method: 'DELETE',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `${responseData}`,
          },
        };
    
        try {
          const deleteResponse = await fetch(`https://api.jwplayer.com/v2/sites/7BsvKr6C/media/${mediaID}`, deleteOptions);
          const deleteData = await deleteResponse;
    
          if (!deleteResponse.ok) {
            throw new Error(`Failed to delete media: ${deleteData.message}`);
          }
    
        } catch (deleteError) {
          console.error('Error during media delete:', deleteError.message || deleteError);
          alert("Error during media update");
          return; // Abort further processing if delete fails
        }
      }

      if (videoInput) {
        try {
          // Step 1: Create the media
          const createMediaResponse = await fetch(url, {
            method: httpMethod,
            headers: {
              'Authorization': `${responseData}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              "upload": { "method": "direct" },
              "metadata": {
                "title": formData.get('exerciseName'),
                "custom_params": {
                  "tempID": formData.get('tempID'),
                },
              },
            })
          });
    
          if (!createMediaResponse.ok) {
            throw new Error('Failed to create media');
          }
    
          // Assuming the response is JSON, check content type
          const contentType = createMediaResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const createMediaData = await createMediaResponse.json();
            
            //Now send details about upload video to make
            formData.append('mediaID', createMediaData.id);

            if(method == 'create') {
              sendNewExerciseToMake(formData, "create");
            } else {
              //Update make function
              sendNewExerciseToMake(formData, "update");
            }
            
            const uploadLink = createMediaData.upload_link;
    
            const blobData = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (event) => resolve(event.target.result);
              reader.readAsArrayBuffer(videoInput);
            });
    
            // Make the fetch call for uploading the file
            const uploadResponse = await fetch(uploadLink, {
              method: 'PUT',
              body: blobData,
            });
    
            if (!uploadResponse.ok) {
              throw new Error('Network response was not ok');
            }
    
            const uploadData = await uploadResponse.text();

            // Upload was successful, now check the status of the media
            let mediaStatus = await checkMediaStatus(createMediaData.id);

            while (mediaStatus.status !== 'ready') {
              // If the status is not ready, wait for 30 seconds before checking again
              await new Promise(resolve => setTimeout(resolve, 30000));
              mediaStatus = await checkMediaStatus(createMediaData.id);
            }

            // Create and fill in thumbnail
            const thumbnailObj = {
              "mediaID": createMediaData.id,
              "tempID": formData.get('tempID'),
            };
            
            getThumbnailURL(thumbnailObj);
    
          } else {
            throw new Error('Invalid content type');
          }
    
        } catch (error) {
          console.error('Error during file upload:', error.message || error);
          alert("Error during file upload");
          // Handle errors
        }
      } else {
        alert('No video file selected.');
      }
    }
    
    async function checkMediaStatus(mediaId) {

      const response = await fetch(`https://api.jwplayer.com/v2/sites/7BsvKr6C/media/${mediaId}`, {
        method: 'GET',
        headers: {
          'Authorization': `${responseData}`,
          'Content-Type': 'application/json',
        },
      });
    
      if (!response.ok) {
        throw new Error('Failed to fetch media status');
      }

      const mediaData = await response.json();
      return mediaData;
    }


    async function sendNewExerciseToMake(formData, method="create") {
      //Set edit flag
      var webhookURL = "https://hook.us1.make.com/93vu9fx588jvfr37ql52m7ppm83bqlrk";
      if(method == "update") {
        webhookURL = "https://hook.us1.make.com/fok1fl8k66a2mbvp34fwl7f3km9c8l0a";
      } 

      fetch(webhookURL, {
        method: "POST",
        body: formData,
      }).then((res) => {
        if (res.ok) {
          return res.text();
        }
        throw new Error('Something went wrong');
      })
      .then((data) => {
        const exerciseJSON = JSON.parse(data);
        if(exerciseJSON.srcType != "none") {

          //Find exercise item with temp id
          const exerciseLibItems = document.querySelectorAll(".exerciseguideitem");
          for(var i = 0; i < exerciseLibItems.length; i++) {
            var exerciseLibTempID = exerciseLibItems[i].querySelector("#exerciseLibraryTempID").innerText;
            if(exerciseLibTempID == exerciseJSON.tempID) {
              //Found exercise
              exerciseLibItems[i].querySelector("#exerciseLibraryID").innerText = exerciseJSON.itemID;
              exerciseLibItems[i].querySelector(".exerciseThumbnail").parentElement.style.backgroundColor = 'black';

              //If video upload
              if(exerciseJSON.srcType == "upload") {
                //Hide loading gif
                exerciseLibItems[i].querySelector(".exerciseThumbnail").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/65597db995abd34586f5f3b7_playButton.webp";

              } else {
                //If link upload
                const returnedVideoObj = parseReturnedVideoLink(exerciseJSON.videoSrc);
                //Update thumbnail source
                exerciseLibItems[i].querySelector(".exerciseThumbnail").src = exerciseJSON.thumbnailURL;
                exerciseLibItems[i].querySelector(".exerciseThumbnail").parentElement.style.borderRadius = 8;

              }

              break;
            }
          }


          const workoutGuideItems = document.querySelectorAll("#individualGuide");

          for(var i = 0; i < workoutGuideItems.length; i++) {
            var workoutItemTempID = workoutGuideItems[i].querySelector("#exerciseListTempID").innerText;
            if(workoutItemTempID == exerciseJSON.tempID) {
              if(exerciseJSON.srcType == "upload") {
                //Hide loading gif
                workoutGuideItems[i].querySelector(".exerciseThumbnail").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/65597db995abd34586f5f3b7_playButton.webp";
              } else {
                //If link upload
                const returnedVideoObj = parseReturnedVideoLink(exerciseJSON.videoSrc);
                //Update thumbnail source
                workoutGuideItems[i].querySelector(".exerciseThumbnail").src = exerciseJSON.thumbnailURL;
              }
              workoutGuideItems[i].querySelector("#itemID").innerText = exerciseJSON.itemID;
              
              workoutGuideItems[i].querySelector("#guideLinkInfo").href = `/guides/${exerciseJSON.slug}`;

              break;
            }
          }
        }
      })
      .catch((error) => {
        console.log(error);
        alert("Could not create exercise, please try again");

        // Update the current URL to the new URL
      });
        

    }

    async function getThumbnailURL(thumbnailObj) {

      fetch("https://hook.us1.make.com/8y3ke5sqkvywu0rsdlse4eytnosmuf12", {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(thumbnailObj)
      }).then((res) => {
        if (res.ok) {
          return res.text();
        }
        throw new Error('Something went wrong');
      })
      .then((data) => {

        const thumbnailObj = JSON.parse(data);

        //Find exercise item with temp id
        const exerciseLibItems = document.querySelectorAll(".exerciseguideitem");
        for(var i = 0; i < exerciseLibItems.length; i++) {
          var exerciseLibTempID = exerciseLibItems[i].querySelector("#exerciseLibraryTempID").innerText;
          if(exerciseLibTempID == thumbnailObj.tempID) {

            exerciseLibItems[i].querySelector(".exerciseThumbnail").src = thumbnailObj.thumbnailURL;
            break;
          }
        }

        const workoutGuideItems = document.querySelectorAll("#individualGuide");

        for(var i = 0; i < workoutGuideItems.length; i++) {
          var workoutItemTempID = workoutGuideItems[i].querySelector("#exerciseListTempID").innerText;
          if(workoutItemTempID == thumbnailObj.tempID) {
            workoutGuideItems[i].querySelector(".exerciseThumbnail").src = thumbnailObj.thumbnailURL;
            break;
          }
        }

        
      })
      .catch((error) => {
        
      });

    }

    function populateGodMode() {
      
      prefillProgramTable(null, action="update");

    }

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
            var cellBackgroundColor = rowChildren[i].querySelector(".fc-daygrid-day-frame").style.backgroundColor;
            if(cellBackgroundColor != "rgb(203, 203, 203)") {
              rowChildren[i].querySelector(".fc-daygrid-day-frame").style.backgroundColor = "#F0F0F0";
            }
            
          }
        }
      }
    }

    function hideOrShowGodModeSwitch() {

      //Check if base program - then hide god mode button otherwise show it
      if(sessionStorage.getItem("createUserProgram") == "false") {
        document.querySelector(".programinfodiv").style.display = "none";
      } else {
        document.querySelector(".programinfodiv").style.display = "flex";
      }

      //Ensure that calendar view always shows first
      document.getElementById("programCalendarImg").click()
    }

    function toggleDayPasteStateCSS(day, toggleState) {
     
      if(day) {
        //Iterate through each day in the row and apply css
        if(toggleState) {
          day.style.backgroundColor = "rgba(12, 8, 213, 0.15)";
        } else {
          if(day.style.backgroundColor != "rgb(203, 203, 203)") {
            day.style.backgroundColor = "#F0F0F0";
          }
        }
      }
    }

    function toggleBorderCSS(hoveredDay, toggleState) {

      
      if(hoveredDay) {
        var dayBackgroundColor = hoveredDay.closest(".fc-daygrid-day-frame").style.backgroundColor;

        var eventElParent = hoveredDay.closest(".fc-daygrid-day-frame");

        //Add plus button if it doesnt exist
        if(!eventElParent.querySelector('.add-event-button')) {
  
          // Create a copy and delete button element
          var addButtonEl = document.createElement('button');
  
          addButtonEl.className = 'add-event-button';
  
          // Create an image element for the delete button
          var addImageEl = document.createElement('img');
          addImageEl.src = 'https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/650444503758530596912def_addWorkout.png';
        
          // Append the image element to the delete button
          addButtonEl.appendChild(addImageEl);
  
          // Append the delete button to the event element
          eventElParent.appendChild(addButtonEl);
        
        }

        if (toggleState && dayBackgroundColor != "rgb(203, 203, 203)") {
          // Add the grey border with the specified width and color
          hoveredDay.style.border = '1px solid #6D6D6F';
          hoveredDay.querySelector('.add-event-button').style.display = "block";
        } else {
          // Remove the border when toggleState is false
          hoveredDay.style.border = 'none';
          //Check if it has an exercise:
          if(!hoveredDay.querySelector(".fc-event")) {
            hoveredDay.querySelector('.add-event-button').style.display = "none";
          }
          
        }
      }

    }

    function checkCalendarSheetButtons(destination) {

      var programSheetButton = document.getElementById("programSheetImg");
      var programCalendarButton = document.getElementById("programCalendarImg");
      if(destination == "programSheetImg") {

        //Change images of both
        programSheetButton.src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/65114d1a3b1baa67e77633ed_clickedSheet.png";
        programCalendarButton.src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/65114d1a22f0acaafdf46d4f_nonClickedCalendar.webp";

        //Apply styles for each
        programSheetButton.classList.add("programsheetradioclicked");
        programSheetButton.classList.remove("programsheetradionotclicked");
        
        programCalendarButton.classList.add("programcalendarradionotclicked");
        programCalendarButton.classList.remove("programcalendarradioclicked");

        //Change body overflow to scroll
        document.querySelector(".body-33").style.overflow = 'scroll';
        
      } else if(destination == "programCalendarImg") {

        //Change images of both
        programSheetButton.src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/65114d1d4705805c41288167_nonClickedSheet.webp";
        programCalendarButton.src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/65114d1f80f5beddfae1a599_clickedCalendar.png";

        //Apply styles for each
        programSheetButton.classList.add("programsheetradionotclicked");
        programSheetButton.classList.remove("programsheetradioclicked");
        
        programCalendarButton.classList.add("programcalendarradioclicked");
        programCalendarButton.classList.remove("programcalendarradionotclicked");

        //Change body overflow to hidden
        document.querySelector(".body-33").style.overflow = 'hidden';
  

      }

    }

    function checkSummaryTrainingCheckBox() {
      //Style if going to workouts
      const checkedRadioInput = document.querySelector('input[type="radio"][name="summaryTraining"]:checked');
      const checkedSpanElement = checkedRadioInput.nextElementSibling;
      
      checkedSpanElement.style.backgroundColor = '#0C08D5';
      checkedSpanElement.style.border = '0px';
      checkedSpanElement.style.borderRadius = '8px';
      checkedSpanElement.style.color = '#FFFFFF';

      const uncheckedRadioInputs = document.querySelectorAll('input[type="radio"][name="summaryTraining"]:not(:checked)');

      uncheckedRadioInputs.forEach((radioInput) => {
        const spanElement = radioInput.nextElementSibling;
      
        spanElement.style.backgroundColor = 'initial';
        spanElement.style.border = 'initial';
        spanElement.style.borderRadius = 'initial';
        spanElement.style.color = 'initial';
      });
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
      window.fsAttributes = window.fsAttributes || [];
      window.fsAttributes.push([
        'cmsfilter',
        async (filterInstances) => {
          // The callback passes a `filterInstances` array with all the `CMSFilters` instances on the page.
          document.getElementById("exerciseSearch").value = "";

          for(var i = 0; i < filterInstances.length; i++) {
            if(filterInstances[i].form.id == "workoutSummaryFilters") {
              await filterInstances[i].resetFilters(filterKeys=["workoutname-2"], null);
            } else if(filterInstances[i].form.id == "workoutFormModal") {
              //filterInstances[i].resetFilters(filterKeys=["workoutmodalname"], null);
            } else if(filterInstances[i].form.id == "programFormModal") {
              await filterInstances[i].resetFilters(filterKeys=["programname-5"], null);
            }
          }

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
        var filtersTotalSizes = {};

        for(var i = 0; i < res.length; i++) {
          var filtersTotalSize = 0;
          var formID = res[i].form.id;
          if(formID == "workoutBuilderForm") {
            filtersTotalSize = res[i].filtersData[2].values.size + res[i].filtersData[3].values.size;
          } else if(formID == "exerciseLibraryForm") {
            filtersTotalSize = res[i].filtersData[1].values.size;
          } else {
            filtersTotalSize = res[i].filtersData[1].values.size + res[i].filtersData[2].values.size;
          }
          filtersTotalSizes[formID] = filtersTotalSize;
        }
        return filtersTotalSizes;
      });

    }

    async function submitTaskToMake(url, method="create", taskElement, task) {
      fetch(url, {
        method: "POST",
        body: task
      }).then((res) => {
        if (res.ok) {
          return res.text();
        }
        throw new Error('Something went wrong');
      })
      .then((data) => {

        //Set itemID text
        if(method == "create") {
          taskElement.querySelector("#taskListItemID").innerText = data;
          sessionStorage.setItem("createTask", "false");
        } 

      })
      .catch((error) => {
        console.log(error);
        alert("Could not create task, please try again");

        //Clear first element

        //Reset cancel button
      });

    }

    function addNewTaskToList(formData) {
      // Find the first .exerciseguideitem element to clone
      const templateItem = document.querySelector('.tasklistitem');
  
      if (!templateItem) {
          console.error('Template item not found');
          return;
      }
  
      // Clone the template item
      const newTaskItem = templateItem.cloneNode(true);
  
      // Fill in the gaps with the data from formData
      newTaskItem.querySelector('#taskListName').innerText = formData.get('name');
      newTaskItem.querySelector('#taskListContentLink').innerText = formData.get('taskContentLink');
      newTaskItem.querySelector('#taskListDescription').innerText = formData.get('taskDescription');
  
      const taskFile = formData.get('taskFile');
      const taskImage = formData.get('taskImage');
  
      if (taskFile) {
          newTaskItem.querySelector('#taskListFilename').innerText = taskFile.name;
      }
  
      if (taskImage) {
          newTaskItem.querySelector('#taskListContentImage').innerHTML = taskImage.name;
      }

      newTaskItem.querySelector('#taskListCreated').innerText = moment().format('MMMM D, YYYY');
  
      // Add the new task item to the start of the exerciseLibraryList
      const exerciseLibraryList = document.getElementById('taskList');
      exerciseLibraryList.insertBefore(newTaskItem, exerciseLibraryList.firstChild);

      return newTaskItem;


    }


    //Send workout object to make 
    async function sendWorkoutToMake(workout) {
      const editWorkout = sessionStorage.getItem('editWorkout');
      const duplicateWorkout = sessionStorage.getItem('duplicateWorkout');
      const createWorkout = sessionStorage.getItem('createWorkout');
      sessionStorage.setItem("tempWorkout", JSON.stringify(workout));

      if(editWorkout == "true" && workout) {

        fetch("https://hook.us1.make.com/itgaod39imi9bt9skusjtrls4etuymhk", {
          method: "POST",
          headers: {'Content-Type': 'application/json'}, 
          body: JSON.stringify(workout)
        }).then(res => {
          //Set flag back
          sessionStorage.setItem('editWorkout', 'false');
          // Get the current URL without parameters
          const baseURLWithoutParams = window.location.origin + window.location.pathname;

          // Construct the new URL with the parameter
          const newURL = `${baseURLWithoutParams}?showPage=workoutSummaryPage`;

          // Update the current URL to the new URL
          window.location.href = newURL;
        });


      } else if((duplicateWorkout == "true" || createWorkout == "true") && workout) {

        fetch("https://hook.us1.make.com/irudmbj6taymsr1l856twzmrzqj6q2na", {
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
          // Get the current URL without parameters
          const baseURLWithoutParams = window.location.origin + window.location.pathname;

          // Construct the new URL with the parameter
          const newURL = `${baseURLWithoutParams}?showPage=workoutSummaryPage`;

          // Update the current URL to the new URL
          window.location.href = newURL;
          
        })
        .catch((error) => {
          console.log(error);
          alert("Could not create workout, please try again");
          // Get the current URL without parameters
          const baseURLWithoutParams = window.location.origin + window.location.pathname;

          // Construct the new URL with the parameter
          const newURL = `${baseURLWithoutParams}?showPage=workoutSummaryPage`;

          // Update the current URL to the new URL
          window.location.href = newURL;
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

    async function deleteProgram(program, currentProgramRow, deleteButton) {

      fetch("https://hook.us1.make.com/863lqxkf6tcsjnn6f4g8a5n421ckdjsu", {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(program)
      }).then(res => {
        deleteButton.innerText = "Delete";
        if (res.ok) {

          //Get program ID and remove from program modal list as well
          const programID = currentProgramRow.querySelector("#programID").innerText;

          const programModalList = document.querySelectorAll(".programmodalitem");

          var foundProgram = null;
          for(var i = 0; i < programModalList.length; i++) {

            if(programModalList[i].querySelector("#programIDModal").innerText == programID) {
              foundProgram = programModalList[i];
              break;
            }
          }

          if(foundProgram != null) {
            foundProgram.remove();
          }

          //Remove program from list using js - next refresh should delete
          currentProgramRow.remove();
          return res.text();
        }
        throw new Error("Something went wrong")
      })
      .then((data) => {

      })
      .catch((error) => {
        alert("Could not delete program - as it is currently assigned to a user");
      });
    }

    async function deleteExercise(exercise, currentExerciseRow, deleteButton) {

      fetch("https://hook.us1.make.com/2297sux71d0air9mkb5edl0nc6hswn1o", {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(exercise)
      }).then(res => {
        deleteButton.innerText = "Delete";

        if (res.ok) {

          //Get workout ID and remove from workout builder list as well
          const exerciseID = currentExerciseRow.querySelector("#exerciseLibraryID").innerText;
          const workoutExerciseList = document.querySelectorAll("#guideList .collection-item-10");

          var foundWorkout = null;
          for(var i = 0; i < workoutExerciseList.length; i++) {

            if(workoutExerciseList[i].querySelector("#itemID").innerText == exerciseID) {
              foundWorkout = workoutExerciseList[i];
              break;
            }
          }

          if(foundWorkout != null) {
            foundWorkout.remove();
          }

          //Remove workout from list using js - next refresh should delete
          currentExerciseRow.remove();

          return res.text();
        }
        throw new Error("Something went wrong")
      })
      .then((data) => {

      })
      .catch((error) => {
        alert("Could not delete exercise - as it exists in a current workout");
      });

    }

    //Delete chosen workout and all of its exercises related to it
    async function deleteWorkout(workout, currentWorkoutRow, deleteButton) {

      fetch("https://hook.us1.make.com/eh9374j99jisjiba83t4tl7vulv7c74u", {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(workout)
      }).then(res => {
        deleteButton.innerText = "Delete";
        if (res.ok) {

          //Get workout ID and remove from workout modal list as well
          const workoutProgramID = currentWorkoutRow.querySelector("#workoutID").innerText;

          const workoutProgramList = document.querySelectorAll(".workoutmodalitem");

          var foundWorkout = null;
          for(var i = 0; i < workoutProgramList.length; i++) {

            if(workoutProgramList[i].querySelector("#workoutIDProgram").innerText == workoutProgramID) {
              foundWorkout = workoutProgramList[i];

              break;
            }
          }

          if(foundWorkout != null) {
            foundWorkout.remove();
          }
          //Remove workout from list using js - next refresh should delete
          currentWorkoutRow.remove();


          return res.text();
        }
        throw new Error("Something went wrong")
      })
      .then((data) => {
        individualGuide
      })
      .catch((error) => {
        alert("Could not delete workout - as it exists in a current program");
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

      // Remove an entry from guide to workout object
      if (guideToWorkoutObj.hasOwnProperty(workoutKeyID) && Array.isArray(guideToWorkoutObj[workoutKeyID]) && guideToWorkoutObj[workoutKeyID].length > 0) {
        var guideDiv = guideToWorkoutObj[workoutKeyID].pop();

        if (guideToWorkoutObj[workoutKeyID].length == 0) {
          return guideDiv;
        }
      }
      return false;
    }

    function generateQRCode(link, gymName=null) {

      if(gymName != null) {
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
      } else {
        var qrcode = new QRCode(document.querySelector("#createUserQrCode"), {
          text: `${link}`,
          width: 250, //default 128
          height: 250,
          colorDark : "#0C08D5",
          colorLight : "#FFFFFF",
          correctLevel : QRCode.CorrectLevel.L
        });
        sessionStorage.setItem("shareSignUpLink", `${link}`);
      }

    }
    
    function saveUserDetails() {

      if(userInputsChanged) {
        //Extract user details
        var userDetailsObj = {};
        userDetailsObj["notes"] = document.getElementById("userNotes").value;
        userDetailsObj["limitations"] = document.getElementById("userLimitations").value;
        userDetailsObj["userName"] = document.getElementById("userFullName").innerText;
        userDetailsObj["userID"] = document.getElementById("userID").innerText;

        fetch("https://hook.us1.make.com/2nq6l90x38nxaqxhitvm323wku5y1cl8", {
          method: "POST",
          headers: {'Content-Type': 'application/json'}, 
          body: JSON.stringify(userDetailsObj)
        }).then((res) => {
          if (res.ok) {
            return res.text();
          }
          throw new Error('Something went wrong');
        })
        .then((data) => {
          //Reset program builder flags
        })
        .catch((error) => {
          console.log(error);
          alert("Could not create program, please try again");
          location.reload();
        });
      }

      userInputsChanged = false;


    }

    function createUserProgram() {

      getUserTrainingPlan("create");

      var userProgram = {};
      // Name of user program - user name + program name
      userProgram["userName"] = `${document.getElementById("userFullName").innerText}`;
      // Description
      userProgram["description"] = document.getElementById("selectedProgramDescription").innerText;
      // Experience
      userProgram["experience"] = document.getElementById("selectedProgramExperience").innerText;
      // Goal 
      userProgram["goal"] = document.getElementById("selectedProgramGoal").innerText;

      //Program Full Name
      userProgram["programName"] = `${document.getElementById("userFullName").innerText}'s program`;
      
      // User ID
      userProgram["userID"] = document.getElementById("userID").innerText;

      // Event data
      userProgram["events"] = JSON.stringify(userTrainingPlan);

      //Memberstack ID
      userProgram["userMemberstackID"] = document.getElementById("userMemberstackID").innerText;

      if(userTrainingPlan.length > 0) {
        const firstDate = userTrainingPlan[0].startWeek;
        const lastDate = userTrainingPlan[0].endWeek;
        // Start date
        userProgram["startDate"] = firstDate;
        // End date
        userProgram["endDate"] = lastDate;

        const millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;

        userProgram["numberOfWeeks"] = Math.ceil((new Date(lastDate) - new Date(firstDate)) / millisecondsPerWeek);

        // List of webflow workout IDs
        var userProgramWorkouts = [];
        // List of webflow workout IDs
        // Loop through the events and log their titles to the console
        for (var i = 0; i < userTrainingPlan[0].events.length; i++) {
          userProgramWorkouts.push(userTrainingPlan[0].events[i].extendedProps.workoutID);
        }
        userProgram["workoutList"] = userProgramWorkouts;
      } else {
        userProgram["endDate"] = moment(new Date).format("YYYY-MM-DD");
      }
      
      //Check if program sheet modified
      if(sessionStorage.getItem("programSheetLoaded") == "true") {

        var fullTableData = [];

        for(table of tableArr) {

          fullTableData = fullTableData.concat(table.getData());

        }
        userProgram["fullTableData"] = JSON.stringify(fullTableData);
        sessionStorage.setItem("programSheetChanged", "false");
      } 

      userProgram["thumbnailURL"] = document.getElementById("defaultThumbnail").innerText;

      sendUserProgramToMake(userProgram, "create");

    }

    function updateUserProgram() {

      getUserTrainingPlan("submit");

      var userProgram = {};
      
      // User Program ID
      userProgram["userProgramID"] = document.getElementById("userProgramID").innerText;

      // user ID
      userProgram["userID"] = document.getElementById("userID").innerText;

      //Program Full Name
      userProgram["programName"] = `${document.getElementById("userFullName").innerText}'s program`;

      //User Full name
      userProgram["userName"] = `${document.getElementById("userFullName").innerText}`;

      // Event data
      userProgram["events"] = JSON.stringify(userTrainingPlan);


      if(userTrainingPlan.length > 0) {
        const firstDate = userTrainingPlan[0].startWeek;
        const lastDate = userTrainingPlan[0].endWeek;
        // Start date
        userProgram["startDate"] = firstDate;
        // End date
        userProgram["endDate"] = lastDate;

        const millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;

        userProgram["numberOfWeeks"] = Math.ceil((new Date(lastDate) - new Date(firstDate)) / millisecondsPerWeek);

        // List of webflow workout IDs
        var userProgramWorkouts = [];
        // List of webflow workout IDs
        // Loop through the events and log their titles to the console
        for (var i = 0; i < userTrainingPlan[0].events.length; i++) {
          userProgramWorkouts.push(userTrainingPlan[0].events[i].extendedProps.workoutID);
        }
        userProgram["workoutList"] = userProgramWorkouts;
      } else {
        userProgram["endDate"] = moment(new Date).format("YYYY-MM-DD");
      }

      //Check if program sheet modified
      if(sessionStorage.getItem("programSheetLoaded") == "true") {

        var fullTableData = [];

        for(table of tableArr) {

          fullTableData = fullTableData.concat(table.getData());

        }
        userProgram["fullTableData"] = JSON.stringify(fullTableData);
        sessionStorage.setItem("programSheetChanged", "false");
      } 

      sendUserProgramToMake(userProgram, "update");

    }

    function getUserTrainingPlan(action="obtainPlan") {

      //Sort the programs by start week
      userTrainingPlan.sort(function(a, b) {
        var dateA = moment(a.startWeek, "YYYY-MM-DD");
        var dateB = moment(b.startWeek, "YYYY-MM-DD");
        return dateA - dateB;
      });

      userTrainingPlan.forEach((obj, index) => {
        // Retrieve the program start and end dates from the object
        const programStart = new Date(obj.startWeek);
        const programEnd = new Date(obj.endWeek);
        programStart.setHours(0, 0, 0, 0);
        programEnd.setHours(0, 0, 0, 0);

        // Retrieve the next startWeek, if it exists
        const nextStartWeek = index < userTrainingPlan.length - 1 ? moment(userTrainingPlan[index + 1].startWeek).format('YYYY-MM-DD') : null;

        // Fetch events from FullCalendar that fall within the program start and next startWeek
        const events = calendar.getEvents().filter(event => {
          const eventStart = event.start;

          // Check if last program or the event is before the next startWeek
          if ((index === userTrainingPlan.length - 1 && eventStart >= programStart) || (nextStartWeek && eventStart >= programStart && eventStart < moment(nextStartWeek).toDate())) {
            return true;
          }
          return false;
        });

        //Sort the events by start date
        events.sort(function(a, b) {
          var dateA = moment(a.start, "YYYY-MM-DD");
          var dateB = moment(b.start, "YYYY-MM-DD");
          return dateA - dateB;
        });

        // Update the start and end week fields of the object
        if (events.length > 0) {
          const firstEvent = events[0];
          const lastEvent = events[events.length - 1];
          const startOfWeek = moment(firstEvent.start).startOf('week').format('YYYY-MM-DD');
          const endOfWeek = moment(lastEvent.start).endOf('week').format('YYYY-MM-DD');
          (action != "obtainPlan") ? obj.startWeek = startOfWeek : null; //Only update start week date if submitting training plan 
          obj.endWeek = endOfWeek;
        }

        // Add the fetched events to the 'events' attribute of the object
        obj.events = events.map(event => event.toPlainObject());

      });

      // Second loop to remove objects with empty events attributes
      for (let i = userTrainingPlan.length - 1; i >= 0; i--) {
        const obj = userTrainingPlan[i];
        if (obj.events.length === 0 || (new Date() > moment(obj.endWeek).toDate())) {
          userTrainingPlan.splice(i, 1);
        }
      }
    }

    function removeEmptyPrograms(weekRow) {
      var programBreakerDiv = weekRow.previousSibling;
      //Get the program breaker nearest to the week row
      //Check if it is the first one
      while(programBreakerDiv != null && !programBreakerDiv.classList.contains("program-breaker-div")) {
        programBreakerDiv = programBreakerDiv.previousSibling;
      }

      if(programBreakerDiv != null) {
  
        var foundProgram = false;
        var programToRemove = null;
        //If the start date of the program isn't in the users training plan object then remove the program breaker div
        userTrainingPlan.forEach((obj, index) => {
          if(moment(obj.startWeek).format("YYYY-MM-DD") == programBreakerDiv.id) {
            foundProgram = true;
            programToRemove = obj;
          }
        });
  
        if(!foundProgram) {
  
          programBreakerDiv.remove();
          // Removing the program from the list
          userTrainingPlan = userTrainingPlan.filter(function(obj) {
            return obj !== programToRemove;
          });
  
        }
      }

      
    }

    function addProgramNameBreaker(weekRow, programBreakerName) {

      const eventWidth = document.querySelector(".fc-daygrid-day-frame").offsetWidth;
      var newRow = document.createElement('tr');
      newRow.id = weekRow.querySelector(".fc-day").getAttribute("data-date");
      newRow.style.textAlign = "center";
      newRow.classList.add("program-breaker-div");
      newRow.style.height = "18px";
      var newCell = document.createElement('td');
      newCell.setAttribute('colspan', '8');
      newCell.style.textAlign = 'center'; // Center-align the cell contents
      newCell.style.paddingLeft = `${eventWidth}px`;
    
      var textDiv = document.createElement('div'); // Create a new div element
      textDiv.classList.add("program-breaker");
      textDiv.textContent = programBreakerName;
      textDiv.style.paddingBottom = "10px";
    
      newCell.appendChild(textDiv); // Append the div to the cell
    
      newRow.appendChild(newCell);
      // Insert the new row before the current row
      weekRow.parentNode.insertBefore(newRow, weekRow);

    }

    function getProgramBreakers() {
      
      const weekRows = [];
      if(document.querySelectorAll(".program-breaker").length < userTrainingPlan.length ) {
        if(userTrainingPlan != null) {
          var programBreakerDivs = document.querySelectorAll('.program-breaker-div');
          programBreakerDivs.forEach(function(div) {
            div.parentNode.removeChild(div);
          });
          userTrainingPlan.forEach((obj, index) => {
            const date = moment(obj.startWeek).format("YYYY-MM-DD");
    
            const cell = calendarEl.querySelector(`[data-date="${date}"]`);
            if(cell != null) {
              const weekRow = cell.closest('[role="row"]');
              weekRows.push([weekRow, obj.programName]);
            }
          });
          for(var i = 0; i < weekRows.length; i++) {
            const [weekRow, programName] = weekRows[i];
            addProgramNameBreaker(weekRow, programName);
          }
        }
      }

    }

    async function createStaffMember(staffMember) {

      fetch("https://hook.us1.make.com/ld0136fy2iag6vubvocby4hd635nf74c", {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(staffMember)
      }).then((res) => {
        if (res.ok) {
          return res.text();
        }
        throw new Error('Something went wrong');
      })
      .then((data) => {

      })
      .catch((error) => {
        console.log(error);
        alert("Could not create staff member, please try again");
        location.reload();
      });

    }
    
    async function sendUserProgramToMake(program, type) {

      if(type == "update") {
        const paramUserID = program["userID"];
        fetch("https://hook.us1.make.com/hq253ggn54ha5cxydo0def1rmo2zq8rx", {
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
          alert("Program Updated Successfully!");
          // Get the current URL without parameters
          const baseURLWithoutParams = window.location.origin + window.location.pathname;

          // Construct the new URL with the parameter
          const newURL = `${baseURLWithoutParams}`;

          // Update the current URL to the new URL
          window.location.href = newURL;
        })
        .catch((error) => {
          console.log(error);
          alert("Could not update program, please try again");
          location.reload();
        });
        sessionStorage.setItem("createUserProgram", "false");
      } else if (type == "create") {
        const paramUserID = program["userID"];
        fetch("https://hook.us1.make.com/xc19h2x675jb99nsrlya5bvj8gcw1txp", {
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
          
          // Get the current URL without parameters
          const baseURLWithoutParams = window.location.origin + window.location.pathname;

          // Construct the new URL with the parameter
          const newURL = `${baseURLWithoutParams}`;

          // Update the current URL to the new URL
          window.location.href = newURL;
        })
        .catch((error) => {
          alert("Could not create program, please try again");
          // Get the current URL without parameters
          const baseURLWithoutParams = window.location.origin + window.location.pathname;

          // Construct the new URL with the parameter
          const newURL = `${baseURLWithoutParams}`;

          // Update the current URL to the new URL
          window.location.href = newURL;
        });
        sessionStorage.setItem("createUserProgram", "false");
      }

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
        // Get the current URL without parameters
        const baseURLWithoutParams = window.location.origin + window.location.pathname;

        // Construct the new URL with the parameter
        const newURL = `${baseURLWithoutParams}?showPage=programSummary`;

        // Update the current URL to the new URL
        window.location.href = newURL;
      })
      .catch((error) => {
        console.log(error);
        alert("Could not create program, please try again");
        // Get the current URL without parameters
        const baseURLWithoutParams = window.location.origin + window.location.pathname;

        // Construct the new URL with the parameter
        const newURL = `${baseURLWithoutParams}?showPage=programSummary`;

        // Update the current URL to the new URL
        window.location.href = newURL;
      });
    }

    function sendChallengeToMake(challenge) {
      if(sessionStorage.getItem("editChallenge") == "true") {
        sendChallengeRequestToMake("https://hook.us1.make.com/gjg639uf16sessrm3cfwptl83f6itdmi", challenge);

      } else if(sessionStorage.getItem("createChallenge") == "true") {
        sendChallengeRequestToMake("https://hook.us1.make.com/prlvfssjs63ycqe6xffed6ssqk3pl9s2", challenge);
      }
    }

    function sendChallengeRequestToMake(destination, challenge) {
      fetch(destination, {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(challenge)
      }).then((res) => {
        if (res.ok) {
          return res.text();
        }
        throw new Error('Something went wrong');
      })
      .then((data) => {

        alert("Challenge Saved Successfully!");
        //Reset program builder flags
        sessionStorage.setItem("editChallange", "false");
        sessionStorage.setItem("createChallange", "false");
        // Get the current URL without parameters
        const baseURLWithoutParams = window.location.origin + window.location.pathname;

        // Construct the new URL with the parameter
        const newURL = `${baseURLWithoutParams}?showPage=challengeSummary`;

        // Update the current URL to the new URL
        window.location.href = newURL;
      })
      .catch((error) => {
        console.log(error);
        alert("Could not create challenge, please try again");
        // Get the current URL without parameters
        const baseURLWithoutParams = window.location.origin + window.location.pathname;

        // Construct the new URL with the parameter
        const newURL = `${baseURLWithoutParams}?showPage=challengeSummary`;

        // Update the current URL to the new URL
        window.location.href = newURL;
      });
    }

    function prefillProgramTable(program, action="create") {
      //If first time filling table when page is loaded
      let tableData;

      //Check if sheet hasnt been updated and cms is empty
      if(action == "create") {

        //Check if table data doesnt exist
        if(program.querySelector("#summaryFullEventData") != null && program.querySelector("#summaryFullEventData").innerText != "") {
          tableData = program.querySelector("#summaryFullEventData").innerText;
          tableData = JSON.parse(tableData);
        } else {
          // The rest
          const summaryEventData = program.querySelector("#summaryEventData");

          //Ensure a program exists
          if(summaryEventData.innerText != "") {
            const eventJSON = JSON.parse(summaryEventData.innerText);
    
            const updatedProgram = addFullWorkoutsToProgram(eventJSON);
      
            tableData = translateProgramDataToTable(updatedProgram);

          } else {
            //Hide god mode button
          }

        }

        fillProgramTable(tableData,false);

      } else if(action == "update" && !prefillingProgram && !isPasteState && !updatingCalendar && !addProgram && !isEventPasteState) {
        // Get new json data from calendar
        console.log("populating god mode");
        
        getUserTrainingPlan();
        var fullTableData = null;
        // Get table data version of this
        const updatedProgram = addFullWorkoutsToProgram(userTrainingPlan);

        let newTableData;
        if(updatedProgram.length > 0) {
          
          newTableData = translateProgramDataToTable(updatedProgram);

          newTableData = ensureSameRowCount(newTableData);

        } else {
          newTableData = [];
        }
        

        // Compare against existing saved data - check from tablearr or from cms json
        if(sessionStorage.getItem("programSheetChanged") == "true" || tableArr.length > 0) {
          //Check if program sheet modified

          fullTableData = [];
          for(table of tableArr) {
            
            fullTableData = fullTableData.concat(table.getData());
          }

        } else if(program && program.querySelector("#summaryFullEventData").innerText != "") {

          fullTableData = program.querySelector("#summaryFullEventData").innerText;
          fullTableData = JSON.parse(fullTableData);
        } 


        if(fullTableData != null)  {
          // Fill in new table data from calendar based on existing data
          tableData = fillNewTableData(newTableData, fullTableData);
          fillProgramTable(tableData,true);
        } else {
          fillProgramTable(newTableData,false);
        }


      }

    }

    function ensureSameRowCount(jsonData) {
      // Sort the JSON data by the 'week' attribute
      // Define a custom sorting function
      const customSort = (a, b) => {
        const weekA = parseInt(a.week.match(/\d+/)[0]); // Extract and convert week to numeric value
        const weekB = parseInt(b.week.match(/\d+/)[0]);

        return weekA - weekB; // Compare and sort based on numeric value
      };

      // Sort the array using the custom sorting function
      jsonData.sort(customSort);

      var groupedData = {};
      var currentWeek = null;
      var currentWorkout = null;
      var currentWorkoutNumber = 1;

      // Loop through the sorted JSON data
      jsonData.forEach(function (obj, index) {
        var curWeek = obj.week;
        var curWorkout = obj.workoutNumber;

        // Increment the workout number for the next iteration
        if((currentWorkout !== curWorkout) && index != 0) {
          currentWorkoutNumber++;
        }

        // Check if the current week is different from the previous week
        if (curWeek !== currentWeek && index != 0) {
          // Reset the workout number for the new week
          currentWorkoutNumber = 1;
          currentWeek = curWeek;
        }

        // Use 'currentWorkoutNumber' as the index for 'groupedData'
        if (!groupedData[currentWorkoutNumber]) {
          groupedData[currentWorkoutNumber] = [];
        }
        groupedData[currentWorkoutNumber].push(obj);
        
        currentWeek = obj.week;
        currentWorkout = obj.workoutNumber
      });

      // Loop through each workoutNumber group
      for (var workoutNumber in groupedData) {
        if (groupedData.hasOwnProperty(workoutNumber)) {
          var workoutData = groupedData[workoutNumber];
          // Find the week with the maximum number of objects
          var maxWeekLength = Math.max.apply(
            null,
            workoutData.map(function (obj) {
              var weekData = workoutData.filter(function (item) {
                return item.week === obj.week;
              });
              var uniqueExercises = new Set(weekData.map(function (item) {
                return item.exercise;
              }));
              return weekData.length + uniqueExercises.size;
            })
          );


          // Fill in missing rows in each week to match the maximum
          workoutData.forEach(function (obj) {
            var currentWeekLength = workoutData.filter(function (item) {
              return item.week === obj.week;
            }).length;
            
            var uniqueExercises = new Set(
              workoutData
                .filter(function (item) {
                  return item.week === obj.week;
                })
                .map(function (item) {
                  return item.exercise;
                })
            );
            
            currentWeekLength += uniqueExercises.size;

            var rowsToAdd = maxWeekLength - currentWeekLength;
            if (rowsToAdd > 0) {
              for (var i = 0; i < rowsToAdd; i++) {
                // Create a blank object and push it to the group
                var blankObj = {
                  week: obj.week,
                  workoutName: obj.workoutName,
                  exercise: "",
                  reps: "",
                  load: "",
                  loadAmount: "",
                  exerciseRestMinutes: "",
                  exerciseRestSeconds: "",
                  quantityUnit: "",
                  notes: "",
                  workoutNumber: obj.workoutNumber,
                  setNumber: currentWeekLength + i,
                  results: "",
                  uniqueWorkoutID: "",
                };
                workoutData.push(blankObj);
              }
            }
          });
        }
      }

      // The updated data with matching row counts
      var updatedData = Object.values(groupedData).reduce(function (acc, group) {
        return acc.concat(group);
      }, []);

      return updatedData;

    }
    
    function fillNewTableData(newData, oldData) {
      // Loop through each item in newData
      for (let i = 0; i < newData.length; i++) {
        const newItem = newData[i];

        // Find a matching item in oldData based on week, workoutName, and exercise
        const matchingItem = oldData.find((oldItem) => {
          return (
            oldItem.workoutName === newItem.workoutName &&
            oldItem.exercise === newItem.exercise && 
            (oldItem.week === newItem.week && oldItem.workoutNumber === newItem.workoutNumber || oldItem.uniqueWorkoutID === newItem.uniqueWorkoutID) &&
            oldItem.setNumber === newItem.setNumber
          );
        });

        // If a matching item is found, copy values from oldData to newData
        if (matchingItem) {
          newItem.reps = matchingItem.reps;
          newItem.load = matchingItem.load;
          newItem.notes = matchingItem.notes;
          newItem.results = matchingItem.results;
          if(matchingItem.loadAmount != undefined && matchingItem.loadAmount != "") {
            newItem.loadAmount = matchingItem.loadAmount;
          } else {
            newItem.loadAmount = "";
          }
          
        }
      }

      return newData;

    }

    function prefillProgramBuilder(program, programType="builder") {

      // Convert the Start Date strings to Date objects
      var eventsData = "";
      //Check if user training plan is empty

      document.getElementById("workout-task-select").style.display = "none";
      document.getElementById("showModalWorkouts").click();

      if(userTrainingPlan.length == 0) {
        const summaryEventData = program.querySelector("#summaryEventData");
        const eventDataElement = program.querySelector("#eventData");
        if(programType == "userProgram" || programType == "userProgramInitial") {
          if(summaryEventData && summaryEventData.innerText != "") {
            eventsData = JSON.parse(summaryEventData.innerText);
          }
        } else {
          if(eventDataElement && eventDataElement.innerText != "") {
            eventsData = JSON.parse(program.querySelector("#eventData").innerText);
          }
        }
        userTrainingPlan = [...eventsData];
      } else {
        eventsData = [...userTrainingPlan];
      }

      if(eventsData != "" && eventsData.length > 0) {
        const events = [];
        const weekRows = [];
        var objStructure = "programBuilder";
  
        if(eventsData[0].events != null) {
          objStructure = "trainingPlan";
        }
  
        if(objStructure == "trainingPlan") {
          eventsData.forEach((obj, index) => {
            if(index = 0) {
    
              if(programType == "userProgram") {
                const date = moment(obj.startWeek).format("YYYY-MM-DD");
      
                const cell = calendarEl.querySelector(`[data-date="${date}"]`);
                
                const weekRow = cell.closest('[role="row"]');
                weekRows.push([weekRow, obj.programName])
              }
    
            }
            obj.events.forEach(event => {
              const startDate = new Date(event.start);

              var extendedProps = {
                length: event.extendedProps.length,
                targetArea: event.extendedProps.targetArea,
                workoutID: event.extendedProps.workoutID,
                uniqueWorkoutID: (event.extendedProps.uniqueWorkoutID != undefined) ? event.extendedProps.uniqueWorkoutID : uuidv4()
              };

              if (event.extendedProps.completedID !== undefined) { 
                extendedProps.completedID = event.extendedProps.completedID;
              }
              
              events.push({
                title: event.title,
                extendedProps: extendedProps,
                start: startDate,
                allDay: true
              });
            });
          });
        } else {
          eventsData.forEach((event, index) => {
            const startDate = new Date(event.start);
            events.push({
              title: event.title,
              extendedProps: {
                length: event.extendedProps.length,
                targetArea: event.extendedProps.targetArea,
                workoutID: event.extendedProps.workoutID,
                uniqueWorkoutID: (event.extendedProps.uniqueWorkoutID != undefined) ? event.extendedProps.uniqueWorkoutID : uuidv4()
              },
              start: startDate,
              allDay: true
            });
          });
        }
        
        // Extract and convert the "start" values into Date objects
        const dates = events.map(obj => obj.start);
        
        // Sort the dates in ascending order
        dates.sort((a, b) => a - b);
        //Set calendar initial date
        if(programType == "userProgram") {
          calendar.today();
        } else {
          calendar.gotoDate( dates[0] );
        }
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
  
        refreshCalendarLayout();
  
        if(programType == "userProgram") {
          getProgramBreakers();
        }
      }

    }

    function prefillChallengeBuilder(challenge) {

      // Convert the Start Date strings to Date objects
      var eventsData = "";
      //Check if user training plan is empty
      const baseData = challenge.querySelector("#challengeSummaryEventData");
      const extendedData = challenge.querySelector("#challengeSummaryExtendedData");
      const weeks = challenge.querySelector("#challengeSummaryWeeks").innerText;
      eventsData = JSON.parse(baseData.innerText);

      if(eventsData != "" && eventsData.length > 0) {
        const events = [];
        
        // Extract and convert the "start" values into Date objects
        const dates = eventsData.map(obj => obj.start);
        
        // Sort the dates in ascending order
        dates.sort((a, b) => a - b);
        //Set calendar initial date
        calendar.gotoDate( dates[0] );

        addDatePickers();

        //Prefill name
        document.getElementById("challengeInputName").value = challenge.querySelector("#challengeSummaryName").innerText;
        //Prefill description
        document.getElementById("challengeDescription").value = challenge.querySelector("#challengeSummaryDescription").innerText;
        //Prefill start and end date
        document.getElementById("challengeStartDate").value = challenge.querySelector("#challengeSummaryStartDate").innerText;
        document.getElementById("challengeEndDate").value = challenge.querySelector("#challengeSummaryEndDate").innerText;

        //Prefill challenge ID
        document.getElementById("challengeSummaryID").value = challenge.querySelector("#challengeSummaryItemID").innerText;

        document.getElementById("calendarTitle").innerText = "Day";

        //Set number of weeks to number of weeks
        updateCalendarWeeks(weeks, "challenge");

        showOrHideWeekRange("block");

        //Populate calendar with events
        updateCalendar(eventsData, "challenges");

        //Set challenge flag to edit
        sessionStorage.setItem("editChallenge", 'true');

        document.getElementById("programBuilder").style.display = "block";

        document.getElementById("workout-task-select").style.display = "flex";

        //Show form inputs for program builder
        var programBuilderInfo = document.getElementById("challengeBuilderInfo");
        programBuilderInfo.style.display = "flex";
        programBuilderInfo.style.flexDirection = "row";
        programBuilderInfo.style.alignContent = "flex-end";
        programBuilderInfo.style.justifyContent = "space-between";
        
        document.getElementById("challengeBuilderInfo").style.display = "flex";
        
        //Hide assign program:
        document.querySelector(".programinfodiv").style.display = "none";
        document.getElementById("challengesBody").style.display = "none";
        //Hide add week
        document.querySelector("#addWeekButton").style.display = "none";

        //Change text:
        document.getElementById("saveChallenge").innerText = "Update";
        document.getElementById("saveChallenge").value = "Update";
  
        refreshCalendarLayout();
  
      }

    }

    // Function to group data by week
    function groupDataByWeek(data) {
      const groupedData = {};
      
      if(data == undefined || data == null) {
        return [];
      }
      data.forEach(item => {
        const week = item.week;
        if (!groupedData[week]) {
          groupedData[week] = [];
        }
        groupedData[week].push(item);
      });
      return groupedData;
    }

    async function selectRowsInGroup(table, workoutName) {
      // Assuming your Tabulator instance is named 'table'
      var rowDataArr = [];
      table.getRows().forEach(function (row) {
        // Get the data for the row
        var rowData = row.getData();
        var rowObj = {};

        // Check if the row belongs to the specified workoutName
        if (rowData.workoutName === workoutName) {
          currentCopiedWorkout = workoutName;
          // Select the row
          row.select();
        }
      });

      table.copyToClipboard();
      table.deselectRow();

    }

    function fillProgramTable(tabledata, reset=false) {

      // Create Tabulator tables for each week's data
      const groupedData = groupDataByWeek(tabledata);

      if(groupedData != []) {
        const weekTablesContainer = document.querySelector(".week-tables"); // Updated selector

        if(reset) {
          //Remove existing tables
          const tables = document.querySelectorAll('.week-table');
          tableArr = [];
          for(const table of tables) {
            table.remove();
          }
        }
  
        const weeksWidth = Object.keys(groupedData).length * 600;
        weekTablesContainer.style.width = `${weeksWidth}px`;
  
        let weekNumber = 1;
        var numberOfWeeks = Object.keys(groupedData).length;

        for (const week in groupedData) {
          const weekData = groupedData[week];
          const tableDiv = document.createElement("div");
          tableDiv.className = "week-table";

          const table = new Tabulator(tableDiv, {
            clipboard: true, // Enable clipboard module
            clipboardCopyConfig: {
              columnHeaders:false, //do not include column headers in clipboard output
              columnGroups:true, //include column groups in column headers for printed table
              rowGroups:true, //include row groups in clipboard output
              columnCalcs:false, //do not include column calculation rows in clipboard output
              dataTree:false, //do not include data tree in printed table
              formatCells:true, //show raw cell values without formatter
          },
            clipboardPasteAction:async function(rowData){
              const clipboardText = await navigator.clipboard.readText();
              
              // Split the clipboardText into an array of lines
              const lines = clipboardText.trim().split('\n');

              // Initialize an array to store the resulting workouts
              const workouts = [];

              // Initialize an object to store the current workout details
              let currentWorkout = {};
              let foundWorkout = false;
              var exerciseCount = 1;
              // "id": workoutName+workoutNameIndex[workoutName],
              // Iterate through each line in the clipboardText
              var workoutNameIndexObj = {}
              for (let i = 0; i < lines.length; i++) {
                // Get the current line
                const line = lines[i];

                // Check if the line is a numeric value (indicating a new workout)
                if (/\s*-\s*/.test(line) && foundWorkout) {
                  // If the line contains a pattern resembling an exercise description,
                  // set the 'exercise' field in the currentWorkout
                  currentWorkout['exercise'] = line.trim();
                } else if (currentWorkout && !line.includes('workout') && foundWorkout) {
                    
                  // reps, loadAmount, and notes information. Split the line and store the values
                  const values = line.split(/\t/);

                  currentWorkout['id'] = currentWorkout.workoutName+workoutNameIndexObj[currentWorkout.workoutName];
                  currentWorkout['reps'] = values[0];
                  currentWorkout['loadAmount'] = values[1] || '';
                  currentWorkout['notes'] = values[2] || '';
                  exerciseCount += 1;
                  if(currentWorkout && currentWorkout['exercise']) {
                    // Push a copy of the currentWorkout into the workouts array
                    workouts.push({ ...currentWorkout });
                    workoutNameIndexObj[currentWorkout.workoutName] += 1;
                  }
              } else if(foundWorkout && /\bworkout\b.*\d/.test(line)) {
                //A new workout
                foundWorkout = false;
              } else {
                //If its not just a number
                if (line && !line.includes('workout') && !line.trim().match(/^\d+$/)) {
                  foundWorkout = true;
                  currentWorkout = { workoutName: lines[i].trim() };
                  workoutNameIndexObj[lines[i].trim()] = 1;
                }
                  
                }
              }

              this.table.updateData(workouts).then(function(){
                  //run code after data has been updated
                  //Update all buttons

              })
              .catch(function(error){
                //handle error updating data
                console.log(error)
              });
              
            },
            data: weekData,
            layout: "fitColumns", // Set the layout option to 'fitData'
            groupBy: ["workoutNumber", "workoutName", "exercise"],
            groupHeader: function (value, count, data, group) {
              if (group.getField() === "workoutName") {
                return `<span style='font-family: Manrope; color: black; font-size: 16px; font-weight: 600;'>${value}</span>`;

              } else if (group.getField() == "workoutNumber") {
                return "";
              } else {
                // Check if the "exercise" value is empty or null, and don't show the group if it is
                if (value == "") {
                  return "";
                } else {
                  return `<span class='exerciseGroupName' style='font-family: Manrope; color: black; font-size: 14px'>${value}</span>`;
                }
              }
            },

            columns: [
              {
                title: `Week ${weekNumber}`,
                headerHozAlign: "center",
                titleFormatter: function (cell, formatterParams, onRendered) {
                  // Create a container div for the title and the copy button
                  const container = document.createElement("div");
              
                  // Create the title element
                  const title = document.createElement("span");
                  title.textContent = `${cell.getValue()}`;
                  title.style.fontFamily = "Manrope";
                  title.style.color = "black";
                  title.style.fontSize = "16px";
                  title.style.fontWeight = "600";
                  title.classList.add("week-title");
              
                  // Create the copy button as an image
                  const copyButton = document.createElement("img");
                  copyButton.src = "https://uploads-ssl.webflow.com/622f1b68bc1e4510618e0b04/646ddea577e978678ad7eecb_copyButtonNew.webp";  // Add the URL of your copy button image
                  copyButton.alt = "Copy";
                  copyButton.classList.add("copy-week-button"); 
                  copyButton.title = "Click entire week";  // Set hover text
                  copyButton.addEventListener("click", function () {
                    // Call your copy function here
                    this.src = "https://uploads-ssl.webflow.com/622f1b68bc1e4510618e0b04/646ddeb5b0ba0c6aee88f383_copyPressedNew.webp";
                    table.selectRow();
                    table.copyToClipboard();
                    table.deselectRow();

                    var pasteButtons = document.querySelectorAll(".paste-week-button");
                    pasteButtons.forEach (pasteButton => {
                      if(pasteButton != this.nextElementSibling) {
                        pasteButton.src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/6578342aad3d8d106ce4b69e_paste_god_mode.webp"; 
                        pasteButton.style.display = "";
                      }
                    });

                    //Hide all copy buttons
                    var copyButtons = document.querySelectorAll(".copy-week-button");
                    copyButtons.forEach (copyButton => {
                      if(copyButton != this) {
                        copyButton.style.display = "none";
                      }
                    });

                    });

                // Create the copy button as an image
                const pasteButton = document.createElement("img");
                pasteButton.src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/6578342aad3d8d106ce4b69e_paste_god_mode.webp";  
                pasteButton.alt = "Paste";
                pasteButton.classList.add("paste-week-button"); 
                pasteButton.title = "Paste entire week";  // Set hover text
                pasteButton.style.display = "none";  // Set hover text

                pasteButton.addEventListener("click", async function () {

                  const clipboardText = await navigator.clipboard.readText();
              
                  // Split the clipboardText into an array of lines
                  const lines = clipboardText.trim().split('\n');
    
                  // Initialize an array to store the resulting workouts
                  const workouts = [];
    
                  // Initialize an object to store the current workout details
                  let currentWorkout = {};
                  let foundWorkout = false;
                  var exerciseCount = 1;
                  // "id": workoutName+workoutNameIndex[workoutName],
                  // Iterate through each line in the clipboardText
                  var workoutNameIndexObj = {}
                  for (let i = 0; i < lines.length; i++) {
                    // Get the current line
                    const line = lines[i];

                    // Check if the line is a numeric value (indicating a new workout)
                    if (/\s*-\s*/.test(line) && foundWorkout) {
                      // If the line contains a pattern resembling an exercise description,
                      // set the 'exercise' field in the currentWorkout
                      currentWorkout['exercise'] = line.trim();
                    } else if (currentWorkout && !line.includes('workout') && foundWorkout ) {
                        
                      // reps, loadAmount, and notes information. Split the line and store the values
                      const values = line.split(/\t/);

                      currentWorkout['id'] = currentWorkout.workoutName+workoutNameIndexObj[currentWorkout.workoutName];
                      currentWorkout['reps'] = values[0];
                      currentWorkout['loadAmount'] = values[1] || '';
                      currentWorkout['notes'] = values[2] || '';
                      exerciseCount += 1;
                      if(currentWorkout && currentWorkout['exercise']) {

                        // Push a copy of the currentWorkout into the workouts array
                        workouts.push({ ...currentWorkout });
                        workoutNameIndexObj[currentWorkout.workoutName] += 1;
                      }
                  } else if(foundWorkout && /\bworkout\b.*\d/.test(line)) {
                    //A new workout
                    foundWorkout = false;

                  } else {
                    //If its not just a number
                    if (line && !line.includes('workout') && !line.trim().match(/^\d+$/) && !foundWorkout) {
                      foundWorkout = true;
                      currentWorkout = { workoutName: lines[i].trim() };
                      if(!workoutNameIndexObj[lines[i].trim()]) {
                        workoutNameIndexObj[lines[i].trim()] = 1;
                      }
                     
                    }
                      
                    }
                  }

                  table.updateData(workouts).then(function(){
                    //Update all buttons
                    var copyButtons = document.querySelectorAll(".copy-week-button")
                    copyButtons.forEach(copyButton => {
                      copyButton.src = "https://uploads-ssl.webflow.com/622f1b68bc1e4510618e0b04/646ddea577e978678ad7eecb_copyButtonNew.webp";
                    });
                  })
                  .catch(function(error){
                    //handle error updating data
                    console.log(error)
                  });

                  this.src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/657d3bf4b8e1715feca010fd_pasteBlue.webp";

                  // Pause for 1 second to show blue
                  setTimeout(function (button) {
                    //Hide all paste buttons
                    var copyButtons = document.querySelectorAll(".copy-week-button");
                    copyButtons.forEach (copyButton => {
                      copyButton.style.display = "";
                      copyButton.src = "https://uploads-ssl.webflow.com/622f1b68bc1e4510618e0b04/646ddea577e978678ad7eecb_copyButtonNew.webp";
                    });
                    //Hide all paste buttons
                    var pasteButtons = document.querySelectorAll(".paste-week-button");
                    pasteButtons.forEach (pasteButton => {
                      pasteButton.style.display = "none";
                    });
                    
                  }, 200);

                });
              
                  // Append the title and copy button to the container
                  container.appendChild(title);
                  container.appendChild(copyButton);
                  container.appendChild(pasteButton);
              
                  return container;
              },
              
               
                columns: [
                  { title: "Quantity", field: "reps", clipboard:true, hozAlign: "center", headerHozAlign:"center", width: 80, headerSort: false, editor:"input", resizable:false, formatter: function(cell, formatterParams, onRendered) {
                    var currentWeek = sessionStorage.getItem("currentWeek");
                    //Get week column
                    var parentColumn = cell.getColumn().getParentColumn();
                    //Style if current week
                    var weekColumnValue = parentColumn.getElement().querySelector(".tabulator-col-title");

                    if(weekColumnValue.innerText == currentWeek) {
                      weekColumnValue.style.color = '#0C08D5';
                      var weekTable = parentColumn.getElement().closest('.week-table');
                      const weekTableOffset = weekTable.offsetLeft;
                      const parentTableOffset = document.querySelector("#programSheet");

                      //document.querySelector("#programSheet").offsetLeft = weekTableOffset;
                      parentTableOffset.scrollTo({
                        left: (weekTableOffset - parentTableOffset.offsetLeft),
                      });
  
                    }
                    // Get the data from the row
                    var data = cell.getRow().getData();
                    
                    // Combine "reps" and "quantityUnit" into a single string
                    var combinedValue = data.reps;
                    if(data.quantityUnit != undefined) {
                      combinedValue = data.reps + " " + data.quantityUnit;
                    }
                    
                    // Return the combined value for display
                    return combinedValue;
                }, cellEdited:function(cell){

                  var rowData = cell.getRow().getData();
                  if (rowData.exercise === "") { 
                    cell.setValue("");
                  }
                  //Set edited flag to true for checking
                  sessionStorage.setItem("programSheetChanged", "true");

                },},
                  { title: "Minutes Rest", field: "exerciseRestMinutes", visible: false },
                  { title: "Seconds Rest", field: "exerciseRestSeconds", visible: false },
                  { title: "Workout ID", field: "workoutID", visible: false },
                  { title: "Unique Workout ID", field: "uniqueWorkoutID", visible: false },
                  { title: "Load", field: "loadAmount", hozAlign: "center" , clipboard:true, headerHozAlign:"center", width: 80, headerSort: false, resizable:false, editor:"input", cellEdited:function(cell){
             
                    var rowData = cell.getRow().getData();
                    if (rowData.exercise === "") { 
                      cell.setValue("");
                    }

                    //Set edited flag to true for checking
                    sessionStorage.setItem("programSheetChanged", "true");
                    
                  }, formatter: function(cell, formatterParams, onRendered) {

                    // Get the data from the row
                    var data = cell.getRow().getData();
                    var value = cell.getValue();
                    
                    // Combine "reps" and "quantityUnit" into a single string
                    var combinedValue = data.loadAmount;
                    if(data.load != undefined ) {
                      combinedValue = data.loadAmount + " " + data.load ;
                    }
    
                    // Return the combined value for display
                    return combinedValue;
                }},
                  { title: "Notes", clipboard:true, field: "notes", hozAlign: "center",  headerHozAlign:"center", width: 250, headerSort: false, editor:"input", resizable:true, cellEdited:function(cell){
                    var rowData = cell.getRow().getData();
                    if (rowData.exercise === "") { 
                      cell.setValue("");
                    }
                    //Set edited flag to true for checking
                    sessionStorage.setItem("programSheetChanged", "true");

                  }},
                  { title: "Results", field: "results", hozAlign: "center" , headerHozAlign:"center",  headerSort: false, resizable:false , cellEdited:function(cell){
                    var rowData = cell.getRow().getData();
                    if (rowData.exercise === "") { 
                      cell.setValue("");
                    }
                    //Set edited flag to true for checking
                    sessionStorage.setItem("programSheetChanged", "true");

                  }}
                ],
              },
            ],
          });   

          //Set flag to confirm table loaded:
          sessionStorage.setItem("programSheetLoaded", "true");
          
          if(tableArr.length < numberOfWeeks) {
            tableArr.push(table);
          }

          weekTablesContainer.appendChild(tableDiv);
          weekNumber++;
        }
      } 

    }

    function translateProgramDataToTable(updatedProgram) {

      // Extract the startWeek from the first program
      var startWeek = moment(updatedProgram[0].startWeek);
      // Current date
      var currentDate = moment();

      // Calculate the difference in weeks
      var weeksDifference = currentDate.diff(startWeek, 'weeks');

      //Store this in session storage to retreive later
      sessionStorage.setItem("currentWeek", `Week ${weeksDifference+1}`);

      // Initialize an empty array to store the converted data
      var convertedData = [];

      // Iterate over each program in updatedProgram
      for (var programIndex = 0; programIndex < updatedProgram.length; programIndex++) {
        var program = updatedProgram[programIndex];
        
        // Iterate over the events in the current program
        //Iterating through workouts
        var previousWeek = 0;
        var totalExerciseCount = 1;
        var workoutNameIndex = {};
        for (var i = 0; i < program.events.length; i++) {
          var event = program.events[i];
          
          // Calculate the week number based on the difference between event start and startWeek
          var week = moment(event.start).diff(startWeek, 'weeks') + 1;
          if(previousWeek != week) {
            previousWeek = week;
            totalExerciseCount = 1;
            workoutNameIndex = {};
          }
          // Use the 'title' as the workoutName

          var workoutName = event.title;

          var workoutJSON = event.workoutJSON;
          var uniqueWorkoutID = event.extendedProps.uniqueWorkoutID;

          var exerciseCount = 1;
          // Iterate over the workoutJSON and create objects for each exercise
          //Iterating through exercises in workout - supersets or individual exercises
          if(workoutJSON) {
            for (var j = 0; j < workoutJSON.length; j++) {
              var exerciseData = workoutJSON[j];
  
              var isSuperset = false;
              if(exerciseData.length > 1) {
                isSuperset = true;
              }
  
              // Define an array of labels from A to E
              var labelArray = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
  
              // Iterate over all exercises within exerciseData
              //Iterating through supersets or exercise
              for (var k = 0; k < exerciseData.length; k++) {
                  var individualExercise = exerciseData[k];
  
                  // Iterate over all exercises within individualExercise
                  // Iterating through sets in exercise
                  for (var l = 0; l < individualExercise.exercises.length; l++) {
                      var exercise = individualExercise.exercises[l];
                      if (workoutNameIndex[workoutName]) {
                          workoutNameIndex[workoutName] += 1;
                      } else {
                          workoutNameIndex[workoutName] = 1;
                      }
  
                      // Calculate the label based on the value of k
                      var labelIndex = k % labelArray.length;
                      var exerciseLabel = labelArray[labelIndex];
  
                      // Create an exercise object for each exercise
                      var exerciseObject = {
                        "id": workoutName + workoutNameIndex[workoutName],
                        "week": "Week " + week,
                        "workoutName": workoutName,
                        "workoutID": event.extendedProps.workoutID,
                        "exercise": isSuperset ? `${exerciseCount}${exerciseLabel} - ${individualExercise.exerciseName}` : `${exerciseCount} - ${individualExercise.exerciseName}`,
                        "reps": exercise.reps,
                        "load": exercise.measure,
                        "loadAmount": (exercise.loadAmount != undefined) ? exercise.loadAmount : "",
                        "exerciseRestMinutes": exercise.exerciseRestMinutes,
                        "exerciseRestSeconds": exercise.exerciseRestSeconds,
                        "quantityUnit": exercise.quantityUnit,
                        "notes": individualExercise.exerciseNotes,
                        "workoutNumber": `workout ${i}`,
                        "setNumber": l,
                        "results": "",
                        "startDate": event.start,
                        "guideID": individualExercise.guideID,
                        "uniqueWorkoutID": uniqueWorkoutID
                      };
  
                      // Push the exercise object to the convertedData array
                      convertedData.push(exerciseObject);
                  }
              }
              exerciseCount += 1; //Increment exercise count
            }
          }
          
        }
      }

      // Now 'convertedData' contains the converted data in the format of your first JSON object
      return convertedData;
    }

    function addFullWorkoutsToProgram(programJSON) {

      var workouts = [];
      for(program of programJSON) {

        var index = 0;
        for(const workout of program.events) {
          const workoutID = workout.extendedProps.workoutID;

          const workoutElem = getWorkoutElement(workoutID);
          if(workoutElem) {
            const workoutJSON = workoutElem.querySelector("#workoutJSON").innerText;
            workout.workoutJSON = JSON.parse(workoutJSON);
          }

          index += 1;
        }
      }
      return programJSON;

    }

    function createExtendedProgram(programJSON) {

      for(const workout of programJSON) {
        if(workout.extendedProps.workoutID) {
          const workoutID = workout.extendedProps.workoutID;
          const workoutElem = getWorkoutElement(workoutID);
          const workoutJSON = workoutElem.querySelector("#workoutJSON").innerText;
          workout.workoutJSON = JSON.parse(workoutJSON);
        }
      }

      return programJSON;

    }

    function getWorkoutElement(workoutID) {

      const workoutSummaryList = document.querySelectorAll(".workoutsummaryitem");

      for(const workout of workoutSummaryList) {
        const workoutListID = workout.querySelector("#workoutID").innerText;

        if(workoutListID == workoutID) {
          //Found id now return the workout element
          return workout;
        }
      }

      return null;

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
        var workoutName = workout.title;
        var duration = workout.extendedProps.length;
        var targetArea = workout.extendedProps.targetArea;
        var workoutID = workout.extendedProps.workoutID;

        workoutSummaryItem.querySelector("#workoutModalHeading").innerText = workoutName;
        workoutSummaryItem.querySelector("#workoutModalDuration").innerText = duration;
        workoutSummaryItem.querySelector("#workoutModalFocusArea").innerText = targetArea;
        workoutSummaryItem.querySelector("#workoutModalID").innerText = workoutID;
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

        if (currentWeek.length === 0 || startDate.isBefore(moment(endOfWeek))) {
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
      const workoutListWorkouts = document.getElementById('programModalList').cloneNode(true).children;
      const workoutList = document.getElementById('programModalList');
    
      // Add event listeners to the buttons
      buttons.forEach((button, index) => {
        button.addEventListener('click', (event) => {
          displayWorkouts(index, workoutList, workoutListWorkouts, weeks);
          $('#weekParentDiv .w-button').removeClass('current-week').addClass("week-button");
          event.target.classList.remove("week-button");
          event.target.classList.add("current-week");
        });
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
      
      // Get the selected week's workouts from the JSON structure
      const selectedWeekWorkouts = weeks[weekIndex];

      //Get workout index to start of the selected week
      var addedWorkout = 1;
      for(var i = 0; i < weekIndex; i++) {
        addedWorkout += weeks[i].length;
      }

      //var addedWorkout = 1;
      // Iterate over the selected week's workouts
      selectedWeekWorkouts.forEach((workout, index) => {

        // Get the workout element based on the workout ID
        var workoutElement = null;
        var foundIndex = "";
        for(var i = 1; i < workoutListWorkouts.length; i++) {
          const workoutListElement = workoutListWorkouts[i].querySelector("#workoutModalID");
          const workoutIndex = workoutListWorkouts[i].querySelector("#workoutNumber").innerText
          if(workoutListElement.innerText == workout.extendedProps.workoutID && `Workout ${i}.` == workoutIndex) {
            foundIndex = i;
            workoutElement = workoutListElement;
          }
        }

        if (workoutElement && workoutElement.textContent === workout.extendedProps.workoutID ) {
          var newElement = workoutElement.closest('.workout-item-template').cloneNode(true);
          newElement.querySelector("#workoutNumber").innerText = `Workout ${addedWorkout}.`;
          workoutList.appendChild(newElement);
          addedWorkout += 1;
          workoutIndexCount += 1;
        }
      });
  
    }

    function updateCalendar(events=null, source="default") {
      
      //Remove all current events:
      calendar.removeAllEvents();

      //Add events:
      for(let i = 0; i < events.length; i++) {
        calendar.addEvent(events[i]);
        if(source == "challenges") {
          if(events[i].extendedProps.weeklyTask) {
            document.getElementById("weeklyTasksCheckbox").click();
          }
        }
      }
      if(sessionStorage.getItem("createUserProgram") == "true" ) {
        getProgramBreakers();
      }
      updatingCalendar = false;

    }
    
    function showOrHideWeekRange(display) {
      var weekRanges = document.querySelectorAll(".week-range");
      for(var i = 0; i < weekRanges.length; i++) {
        weekRanges[i].style.display = display;
      }
    }

    function addDatePickers() {
      // Get a reference to the existing text input
     const startDate = document.getElementById('challengeStartDate');
     const endDate = document.getElementById('challengeEndDate');

     const startDateElement = convertToDatePicker(startDate, "Start Date");
     const endDateElement = convertToDatePicker(endDate, "End Date");
 
     // Add event listeners to the date picker elements
     startDateElement.addEventListener('input', handleDateInputChange);
     endDateElement.addEventListener('input', handleDateInputChange);
 
   }
 
   function convertToDatePicker(textField, placeholder) {
     // Create a new date input element
     const datePicker = document.createElement('input');
     datePicker.type = 'date';
     
     datePicker.className = textField.className; // Copy the existing classes to maintain styling
     //datePicker.name = textField.name;
     //datePicker.dataset.name = textField.dataset.name;
     datePicker.placeholder = placeholder; // Date input's default placeholder format
     datePicker.required = textField.required;
     datePicker.id = textField.id;
     datePicker.setAttribute("data-date-format", "DD MMM");
 
     // Replace the existing text input with the new date input
     textField.parentNode.replaceChild(datePicker, textField);
 
     return datePicker;
   }
 
   // Function to handle input changes
   function handleDateInputChange() {

    
     // Get references to the date picker elements
     const startDateElement = document.getElementById('challengeStartDate');
     const endDateElement = document.getElementById('challengeEndDate');

     styleStartAndEndDates(startDateElement.value, endDateElement.value);
 
    // Check if both date picker elements have values
    if (startDateElement.value && endDateElement.value) {

      //startDateElement.value = formatDateInput(new Date(startDateElement.value))
      //endDateElement.value = formatDateInput(new Date(endDateElement.value));
         // Parse the date values
         const startDate = new Date(startDateElement.value);
         const endDate = new Date(endDateElement.value);
 
         // Check if end date is after start date
         if (endDate < startDate) {
             alert("End date must be after start date!");
             // Clear the end date input field
             endDateElement.value = "";
             return; // Exit the function without further processing
         }
 
         //Calculate the number of weeks
         const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000; // Number of milliseconds in a week
         const numberOfWeeks = Math.ceil((endDate - startDate) / millisecondsPerWeek);

         calendar.gotoDate( startDate );
 
         //Update calendar with number of weeks and style cells
         updateCalendarWeeks(numberOfWeeks+1, "challenge");
     }
   }

    function updateCalendarWeeks(overrideWeeks=0, programType="builder") {
      if(overrideWeeks != 0 && overrideWeeks > 4) {

        currentNumberOfWeeks = overrideWeeks;
      
      } else if(programType != "challenge" && overrideWeeks != 0 && overrideWeeks <= 4) {
        currentNumberOfWeeks = 4;
      } else if(programType != "challenge") {
        //Increment current number of weeks
        currentNumberOfWeeks += 1;
      } else {
        currentNumberOfWeeks = overrideWeeks;
      }

      calendar.setOption('duration', { weeks: currentNumberOfWeeks });
      
      // Re-render the calendar with the updated view
      calendar.changeView('timeGridDay');
      calendar.changeView('dayGridFourWeek');

      var eventCells = document.querySelectorAll(".fc-daygrid-day-frame");
      for(let i = 0; i < eventCells.length; i++) {
        if(programType != "challenge") {
          eventCells[i].style.height = "110px";
        } else {

          eventCells[i].style.height = "260px";
          eventCells[i].style.overflow = "scroll";
          eventCells[i].style.marginBottom = "10px";

          //Check if date cell is before start date
          var cellDate = new Date(eventCells[i].parentElement.getAttribute("data-date"));
          var formattedDate = formatDate(cellDate); // Format the date to 'DD MMM' format

          var challengeStartDate = document.getElementById("challengeStartDate").value;
          var challengeEndDate = document.getElementById("challengeEndDate").value;

          // Create a new element to display the formatted date
          var dateElement = document.createElement('div');
          if(eventCells[i].parentElement.classList.contains("weekly-task")) {
            dateElement.textContent = "Weekly Task";
          } else {
            dateElement.textContent = formattedDate;
          }
          
          dateElement.classList.add('fc-col-header-cell-cushion'); // You can style this class as per your need

          // Prepend the date element to the event cell
          eventCells[i].prepend(dateElement);

          if(challengeStartDate && challengeEndDate) {
            if(cellDate < new Date(challengeStartDate) || cellDate > new Date(challengeEndDate)) {
              if(!eventCells[i].parentElement.classList.contains("weekly-task")) {
                eventCells[i].style.backgroundColor = "#CBCBCB";
              }
              
            }
          }
        }

        eventCells[i].style.minHeight = "110px";

      }

      if(overrideWeeks == 0) {
        document.querySelector('.fc-scrollgrid-sync-table').scrollIntoView(false) //{behavior: "smooth", block: "end", inline: "nearest"});
        document.querySelector('.fc-scrollgrid-sync-table').scrollBy(0, 150); // Adjust the second parameter (50) to control the extra scroll amount
      }
      
      calendar.render();

      if(programType == "builder" || programType == "challenge") {
        showOrHideWeekRange("none");
      } else {
        showOrHideWeekRange("block");
      }
      if(sessionStorage.getItem("createUserProgram") == "true" ) {
        getProgramBreakers();
      }
      updatingCalendar = false;

    }

    // Function to format date to 'DD MMM' format
    function formatDate(date) {
      var options = { day: 'numeric', month: 'short' };
      return date.toLocaleDateString('en-US', options);
    }

    function prefillWorkoutTaskList(element, type="task") {

      const workoutTaskList = document.getElementById("programWorkoutList");

      document.getElementById("workoutProgramSummary").style.display = "flex";
      document.getElementById("selectWorkoutPlaceholder").style.display = "none";
      document.getElementById("selectedWorkoutDescription").style.display = "none";
      document.querySelector(".workoutmodalinfo").style.display = "none";
      
      // Split the original string by "-"
      var parts = selectedDate.split("-");

      if(parts.length > 2) {
        // Rearrange the parts to form the new string in the format "DD-MM-YYYY"
        var newDate = moment(selectedDate).format('DD MMMM');

        // Set the formatted date to the element with the ID "selectedWorkoutName"
        document.getElementById("selectedWorkoutName").innerText = newDate;
      } else {
        document.getElementById("selectedWorkoutName").innerText = selectedDate;
      }

      //Clone guide element
      var listElement = document.getElementById("individualGuide").cloneNode(true);
      listElement.style.marginBottom = "10px"; 
      listElement.style.width = "100%";

      const removeItem = document.getElementById("removeFullExercise").cloneNode(true);
      removeItem.id = "removeItem";
      // Event listener for mouseover
      listElement.addEventListener("mouseover", function() {
        removeItem.style.display = "block";
        listElement.style.cursor = 'grab'
      });

      // Event listener for mouseout
      listElement.addEventListener("mouseout", function() {
        removeItem.style.display = "none";
      });

      // Event listener for onclick
      removeItem.addEventListener("click", function() {
        listElement.parentElement.remove();
      });
      listElement.querySelector(".exerciseheaderdiv").appendChild(removeItem);
      listElement.querySelector(".exerciseheaderdiv").style.justifyContent = "space-between";

      var listItem = document.createElement("li");
      listItem.appendChild(listElement);
      listItem.style.width = "90%";

      listElement.style.backgroundColor = "white";
      
      if(type == "workout") {

        listElement.querySelector("#guideName").innerText = element.querySelector("#workoutSummaryNameProgram").innerText;
        listElement.querySelector("#guideName").id = "workoutSummaryNameProgram"
        listElement.querySelector("#exerciseInfoRight").style.display = "";
        listElement.id = "workoutItem";
        
        listElement.querySelector("#exerciseListTempID").innerText = element.querySelector("#workoutDurationProgram").innerText;
        listElement.querySelector("#exerciseListTempID").id = "workoutDurationProgram";

        listElement.querySelector("#exerciseDifficulty").innerText = element.querySelector("#workoutFocusAreaProgram").innerText;
        listElement.querySelector("#exerciseDifficulty").id = "workoutFocusAreaProgram";

        listElement.querySelector("#itemID").innerText = element.querySelector("#workoutIDProgram").innerText;

      } else if(type == "task") {
        listElement.querySelector("#guideName").innerText = element.querySelector("#taskName").innerText;
        listElement.querySelector("#guideName").id = "taskName";
        listElement.querySelector("#itemID").innerText = element.querySelector("#taskItemID").innerText;

        listElement.querySelector("#exerciseInfoRight").style.display = "none";
        listElement.id = "taskItem";
      }

      workoutTaskList.appendChild(listItem);

    }

    function prefillWorkoutBuilder(workoutSummary, programWorkout=false) {

      var workoutJSON = "";

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
        document.getElementById("workoutDescription").value = workout.workoutSummaryDescription;
        document.getElementById("workoutSummaryID").innerText = workout.workoutSummaryID;
        document.getElementById("workoutSummaryFullName").innerText = workout.workoutFullName;
        if(workout.workoutJSON != "") {
          workoutJSON = JSON.parse(workout.workoutJSON);
        }
        
      } else {
        var workout = workoutSummary;
        workoutJSON = JSON.parse(workoutSummary.workoutJSON);
      }

      var listOfGuideIDs = [];
      var count = 0;

      // Create an array to store the reordered exercises
      const reorderedExercises = [];

      // Iterate through workoutJSON to maintain the order
      workoutJSON.forEach(exercises => {
        exercises.forEach(exercise => {
          const guideID = exercise.guideID;
          const matchingExercise = workout.exercises.find(item => item.exerciseGuideID === guideID);
          if (matchingExercise) {
            reorderedExercises.push(matchingExercise);
          } else {
            console.log("Couldnt find: ", guideID)
          }
        });
      });

      // Update workout.exercises with the reordered exercises
      workout.exercises = reorderedExercises;

      //Copy guide template and replace all values with exercise from workout
      for(var i = 0; i < workout.exercises.length; i++) {
        var incrementIndex = false;
        var jsonExercises = null;
        var exerciseList = [];
        var incrementAmount = 1;
        var exerciseInfo = [];

        if(workoutJSON != "" && workoutJSON[count] && workoutJSON[count].length > 1 ) {

          jsonExercises = workoutJSON[count];

          for (let j = 0; j < jsonExercises.length; j++) {
            exerciseList.push(createGuideCopy(workout, i + j));
            exerciseInfo.push(workout.exercises[i+j]);
            //Add guide ID to list
            listOfGuideIDs.push(workout.exercises[i+j].exerciseGuideID);
          }

          incrementAmount = jsonExercises.length - 1;
          count += 1;
          incrementIndex = true;

        } else if (workoutJSON != "" && count <= workoutJSON.length) {

          jsonExercises = workoutJSON[count];
          exerciseList = [createGuideCopy(workout, i)];
          exerciseInfo.push(workout.exercises[i]);
          listOfGuideIDs.push(workout.exercises[i].exerciseGuideID);
          count += 1;
        }

        var [copyOfGuide, exerciseThumbnail, svgPersonDiv] = createGuideCopy(workout, i);

        if(incrementIndex) { //check if superset
          addExerciseToWorkoutList(copyOfGuide, exerciseInfo, true, exerciseThumbnail, svgPersonDiv, programWorkout, jsonExercises, exerciseList);
          i += incrementAmount; //increase i by superset size 
        } else {
          addExerciseToWorkoutList(copyOfGuide, exerciseInfo, true, exerciseThumbnail, svgPersonDiv, programWorkout, jsonExercises, exerciseList);
        }
        
      }
      if(!programWorkout) {
        //Add workout entry for green border colour
        addWorkoutListEntry(listOfGuideIDs);
      }

    }

    function createGuideCopy(workout, i) {
  
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
      copyOfGuide.querySelector("#guideLinkInfo").style.display = "none";

      //Update link
      var workoutSlugs = workout.workoutIDs.split(', ');
      copyOfGuide.querySelector("#guideLinkInfo").href = window.location.origin + '/guides/' + workoutSlugs[i];

      //Update scientific muscle 
      copyOfGuide.querySelector("#scientificPrimaryMuscle").innerText = workout.exercises[i].exerciseMuscles;

      //Copy thumbnail and svg person into a separate div
      var exerciseThumbnail = $(copyOfGuide).find("#exerciseThumbnail").detach();
      var svgPersonDiv = $(copyOfGuide).find("#exerciseInfoRight").detach();
      return [copyOfGuide, exerciseThumbnail, svgPersonDiv];
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
      // Workout Description
      workout["workoutSummaryDescription"] = selectedWorkout.querySelector("#workoutSummaryDescription").innerText;

      workout["workoutIDs"] = selectedWorkout.querySelector("#workoutIDs").innerText;

      workout["workoutMuscleGroups"] = selectedWorkout.querySelector("#workoutMuscleGroups").innerText;
  
      // Only set ID and full name if user is editing the workout
      if(sessionStorage.getItem('editWorkout') == "true" || programWorkout) {
        // Workout ID
        workout["workoutSummaryID"] = selectedWorkout.querySelector("#workoutID").innerText;
        //Workout Full Name
        workout["workoutFullName"] = selectedWorkout.querySelector("#workoutFullName").innerText;
      }

  
      var exercises = [];
      const workoutListElements = selectedWorkout.querySelector("#newCollectionList").children;
      
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

        // Muscle Groups
        exercise["exerciseMuscles"] = workoutDetails.querySelector("#exerciseMuscles").innerText;
  
        //Exercise Guide ID
        exercise["exerciseGuideID"] = workoutDetails.querySelector("#exerciseGuideID").innerText;

        //Add exercise object to exercises list
        exercises.push(exercise);
      }

      //Get workout JSON
      workout["workoutJSON"] = selectedWorkout.querySelector("#workoutJSON").innerText;
  
      //Add list of exercises to workout object
      workout["exercises"] = exercises;
  
      return workout;
    }

    function checkAndClearChallenge(destinationScreen, destinationButton, secondaryDestination=null) {
      //Check if text boxes have values or events exist
      const challengeName = document.getElementById("challengeInputName").value;
      const challengeDescription = document.getElementById("challengeDescription").value;
      const challengeEvents = calendar.getEvents();
      const challengeStartDate = document.getElementById("challengeStartDate");
      const challengeEndDate = document.getElementById("challengeEndDate");

      if(challengeName != "" || challengeDescription != "" || challengeEvents.length > 0 || challengeStartDate.value != "" || challengeEndDate.value != "") {

        if(challengeName != "") {
          document.getElementById("closingText").innerText = `Do you want to save the changes to your challenge \"${challengeName}\"?`;
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
        
          //Reset user training plan:
          userTrainingPlan = [];

          //Close modal
          document.getElementById("confirmCloseBuilder").style.display = "none";
          //Hide and clear program builder or program summary
          document.getElementById("programBuilder").style.display = "none";

          //Re-show add week button
          document.querySelector("#addWeekButton").style.display = "flex";

          document.getElementById("challengeBuilderInfo").style.display = "none";

          //Clear session storage
          sessionStorage.setItem('editChallenge', 'false');
          sessionStorage.setItem('createChallenge', 'false');

          //Clear program entries
          clearChallenge();

          document.getElementById("workoutRadio").click();
          //Click workout radio button
          checkProgramWorkoutCheckBox();

          document.getElementById("summaryRadioButton").click();
          //Click summary radio button
          checkSummaryTrainingCheckBox();

          if(destinationScreen != "workoutSummaryPage") {
            document.getElementById("workoutSummaryPage").style.display = "none";
            document.getElementById("workoutBuilderPage").style.display = "none";
          }

          if(destinationScreen != "usersBody" && destinationScreen != "userInfoDetails") {
            document.getElementById("usersBody").style.display = "none";
            document.getElementById("userSummaryPage").style.display = "none";
            
          } else if(destinationScreen == "usersBody") {
            document.getElementById("userDetailsPage").style.display = "none";
          }

          document.getElementById(destinationScreen).style.display = "block";

          if(destinationScreen == "userInfoDetails") {

            document.getElementById(destinationScreen).style.display = "flex";
            document.getElementById(destinationScreen).style.justifyContent = "center";
          }
          
          if(secondaryDestination != null) {
            document.getElementById(secondaryDestination).style.display = "block";
          }

          styleNavButtons(destinationButton)

        }

      } else {

        //Remove training plan header
        document.getElementById("trainingPlanName").style.display = "none";
        document.getElementById("saveTrainingPlan").style.display = "none";
        document.getElementById("programBuilder").style.display = "none";
        document.getElementById("programPage").style.display = "none";
        document.getElementById("challengesBody").style.display = "none";
        document.getElementById("challengeBuilderInfo").style.display = "none";
        
        //Re-show add week button
        document.querySelector("#addWeekButton").style.display = "flex";

        document.getElementById("workoutSummaryPage").style.display = "none";
        document.getElementById("workoutBuilderPage").style.display = "none";

        if(destinationScreen != "usersBody" && destinationScreen != "userInfoDetails") {
          document.getElementById("usersBody").style.display = "none";
          document.getElementById("userDetailsPage").style.display = "none";
          document.getElementById("userSummaryPage").style.display = "none";
        } else if(destinationScreen == "usersBody") {
          document.getElementById("userDetailsPage").style.display = "none";
        }

        
        document.getElementById(destinationScreen).style.display = "block";

        if(destinationScreen == "userInfoDetails") {
          document.getElementById(destinationScreen).style.display = "flex";
          document.getElementById(destinationScreen).style.justifyContent = "center";
        }

        if(secondaryDestination != null) {
          document.getElementById(secondaryDestination).style.display = "block";
        }

        //Clear session storage
        sessionStorage.setItem('editChallenge', 'false');
        sessionStorage.setItem('createChallenge', 'false');

        styleNavButtons(destinationButton)

        //Clear program entries
        clearChallenge();
      }
    }

    function checkAndClearProgram(destinationScreen, destinationButton, secondaryDestination=null) {
      //Check if text boxes have values or events exist
      const programBuilderName = document.getElementById("programName").value;
      const programBuilderDescription = document.getElementById("programDescription").value;
      const programBuilderEvents = calendar.getEvents();
      const experiencePicker = document.getElementById("programExperience");
      const goalPicker = document.getElementById("programGoal");

      if(programBuilderName != "" || programBuilderDescription != "" || programBuilderEvents.length > 0 || experiencePicker.selectedIndex != 0 || goalPicker.selectedIndex != 0) {

        if(programBuilderName != "") {
          document.getElementById("closingText").innerText = `Do you want to save the changes to your program \"${programBuilderName}\"?`;
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
          
          //Remove training plan header
          document.getElementById("trainingPlanName").style.display = "none";

          //Reset user training plan:
          userTrainingPlan = [];

          document.getElementById("saveTrainingPlan").style.display = "none";

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
          }

          if(destinationScreen != "usersBody" && destinationScreen != "userInfoDetails") {
            document.getElementById("usersBody").style.display = "none";
            document.getElementById("userSummaryPage").style.display = "none";
            
          } else if(destinationScreen == "usersBody") {
            document.getElementById("userDetailsPage").style.display = "none";
          }

          document.getElementById(destinationScreen).style.display = "block";

          if(destinationScreen == "userInfoDetails") {

            document.getElementById(destinationScreen).style.display = "flex";
            document.getElementById(destinationScreen).style.justifyContent = "center";
          }
          
          if(secondaryDestination != null) {

            document.getElementById(secondaryDestination).style.display = "block";
          }

          styleNavButtons(destinationButton)

        }

      } else {

        //Remove training plan header
        document.getElementById("trainingPlanName").style.display = "none";
        document.getElementById("saveTrainingPlan").style.display = "none";
        document.getElementById("programBuilder").style.display = "none";
        document.getElementById("programPage").style.display = "none";
        document.getElementById("challengesBody").style.display = "none";

        document.getElementById("workoutRadio").click();
        //Click workout radio button
        checkProgramWorkoutCheckBox();

        document.getElementById("summaryRadioButton").click();
        //Click summary radio button
        checkSummaryTrainingCheckBox();

        document.getElementById("workoutSummaryPage").style.display = "none";
        document.getElementById("workoutBuilderPage").style.display = "none";

        if(destinationScreen != "usersBody" && destinationScreen != "userInfoDetails") {
          document.getElementById("usersBody").style.display = "none";
          document.getElementById("userDetailsPage").style.display = "none";
          document.getElementById("userSummaryPage").style.display = "none";
        } else if(destinationScreen == "usersBody") {
          document.getElementById("userDetailsPage").style.display = "none";
        }

        
        document.getElementById(destinationScreen).style.display = "block";

        if(destinationScreen == "userInfoDetails") {
          document.getElementById(destinationScreen).style.display = "flex";
          document.getElementById(destinationScreen).style.justifyContent = "center";
        }

        if(secondaryDestination != null) {
          document.getElementById(secondaryDestination).style.display = "block";
        }

        //Clear session storage
        sessionStorage.setItem('editProgram', 'false');
        sessionStorage.setItem('duplicateProgram', 'false');
        sessionStorage.setItem('createProgram', 'false');
        sessionStorage.setItem('createUserProgram', 'false');

        styleNavButtons(destinationButton)

        //Clear program entries
        clearProgram();
      }

    }

    function clearChallenge() {

      //Clear title
      document.getElementById("challengeInputName").value = "";

      //Clear description
      document.getElementById("challengeDescription").value = "";
      document.getElementById("challengeStartDate").value = "";
      document.getElementById("challengeEndDate").value = "";

      //Clear events
      calendar.removeAllEvents();

    }

    function clearProgram() {

      //Clear title
      document.getElementById("programName").value = "";

      //Clear description
      document.getElementById("programDescription").value = "";

      const experiencePicker = document.getElementById("programExperience");

      // Reset the selected option to the default (first) option
      experiencePicker.selectedIndex = 0;

      const goalPicker = document.getElementById("programGoal");

      document.getElementById("programBuilderInfo").style.display = "none"

      // Reset the selected option to the default (first) option
      goalPicker.selectedIndex = 0;

      //Clear events
      calendar.removeAllEvents();

    }

    function checkProgramWorkoutCheckBox() {
      //Style if going to workouts
      const checkedRadioInput = document.querySelector('input[type="radio"][name="workoutProgram"]:checked');
      const checkedSpanElement = checkedRadioInput.nextElementSibling;
      
      checkedSpanElement.style.backgroundColor = '#0C08D5';
      checkedSpanElement.style.border = '0px';
      checkedSpanElement.style.borderRadius = '8px';
      checkedSpanElement.style.color = '#FFFFFF';

      const uncheckedRadioInputs = document.querySelectorAll('input[type="radio"][name="workoutProgram"]:not(:checked)');

      uncheckedRadioInputs.forEach((radioInput) => {
        const spanElement = radioInput.nextElementSibling;
      
        spanElement.style.backgroundColor = 'initial';
        spanElement.style.border = 'initial';
        spanElement.style.borderRadius = 'initial';
        spanElement.style.color = 'initial';
      });
    }

    function checkAndClearWorkouts(destinationScreen, destinationButton, secondaryDestination=null) {
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

          styleNavButtons(destinationButton)
  
          //Clear workout to guide list mapping
          clearWorkoutListEntry();
  
          clearWorkoutExerciseList();

          if(secondaryDestination != null) {
            document.getElementById(secondaryDestination).style.display = "block";
          }

          if(destinationScreen != "userDetailsPage") {
            document.getElementById("userDetailsPage").style.display = "none";
          }
        }
  
      } else {
        //Submit user details
        if(document.getElementById("userDetailsPage").style.display == "block") {
          saveUserDetails();
        }
        workoutBuilderPage.style.display = "none";
        document.getElementById("workoutSummaryPage").style.display = "none";
        document.getElementById("usersBody").style.display = "none";
        document.getElementById("userDetailsPage").style.display = "none";
        document.getElementById("challengesBody").style.display = "none";
        document.getElementById(destinationScreen).style.display = "block";

        if(secondaryDestination != null) {
          document.getElementById(secondaryDestination).style.display = "block";
        }
  
        //Clear session storage
        sessionStorage.setItem('editWorkout', 'false');
        sessionStorage.setItem('duplicateWorkout', 'false');
        sessionStorage.setItem('createWorkout', 'false');

        styleNavButtons(destinationButton);
  
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

      document.getElementById("programSummaryModal").style.display = "none";

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
      var weekButtonList = document.querySelectorAll("#weekParentDiv .w-button");
      for(var i = 0; i < weekButtonList.length; i++) {
        if(weekButtonList[i].id != "week-1") {
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
            "value": 2
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
            "value": 2
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
