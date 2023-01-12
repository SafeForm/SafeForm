var muscleMapping = {
  "pectoralis-major":"Chest",
  "quadriceps":"Quads",
  "pyramidalis":"Abs",
  "biceps-brachii":"Biceps",
  "triceps-brachii":"Triceps",
  "deltoids":"Shoulders",
  "epigastrium":"Abs",
  "obliques":"Obliques",
  "adductors":"Inner Thigh",
  "trapezius":"Traps",
  "latissimus-dorsi":"Lats",
  "palmaris-longus":"Forearms",
  "gluteus-maximus":"Glutes",
  "hamstrings":"Hamstrings",
  "gastrocnemius":"Calves",
  "erector-spinae":"Lower Back"
}
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

window.onload = (event) => {
  
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
      const workoutBuilderPage = document.getElementById("workoutBuilderPage");
      const workoutSummaryPage = document.getElementById("workoutSummaryPage");

      document.getElementById("equipmentListContainer").style.display = 'block';
      document.getElementById("equipmentPage").onclick = function() {
        //equipmentBody.style.display = "block";
        dashboardBody.style.display = "none";
        settingsBody.style.display = "none";
        //workoutBuilderPage.style.display = "none";
        workoutSummaryPage.style.display = "none";
        //Reset filters on workout summary page
        checkAndClearWorkouts("equipmentBody")
      };

      document.getElementById("dashboardPage").onclick = function() {
        //dashboardBody.style.display = "block";
        equipmentBody.style.display = "none";
        settingsBody.style.display = "none";
        //workoutBuilderPage.style.display = "none";
        workoutSummaryPage.style.display = "none";
        //Reset filters on workout summary page
        checkAndClearWorkouts("dashboardBody")
      };

      document.getElementById("settingsPage").onclick = function() {
        //settingsBody.style.display = "block";
        equipmentBody.style.display = "none";
        dashboardBody.style.display = "none";
        //workoutBuilderPage.style.display = "none";
        workoutSummaryPage.style.display = "none";
        //Reset filters on workout summary page
        checkAndClearWorkouts("settingsBody")
      };
      
      document.getElementById("workoutsPage").onclick = function() {
        //Reset filters on workout summary page
        //workoutSummaryPage.style.display = "block";
        //workoutBuilderPage.style.display = "none";
        settingsBody.style.display = "none";
        equipmentBody.style.display = "none";
        dashboardBody.style.display = "none";
        sessionStorage.setItem('editWorkout', 'false');
        sessionStorage.setItem('duplicateWorkout', 'false');
        sessionStorage.setItem('createWorkout', 'false');

        // Check if there are any exercises in the list 
        // If there is, prompt user to confirm removing list 

        // If they confirm remove items from list and clear filters and hide exercise list
        checkAndClearWorkouts("workoutSummaryPage");

      };

    } else {
      document.getElementById("equipmentListContainer").style.display = 'none';
      document.getElementById("notUploaded").style.display = "block";
    }

  })

  /*
    - Iterate through workout summaries and show the 'workout of the week' icon if set
  */
  const workoutSummaryList = document.getElementById("workoutSummaryList").children;

  for(let i = 0; i < workoutSummaryList.length; i++) {
    
    const isWorkoutOfTheWeek = workoutSummaryList[i].querySelector("#isWorkoutOfTheWeek").innerText;
    if(isWorkoutOfTheWeek == "true") {
      workoutSummaryList[i].querySelector("#workoutOfTheWeekIcon").style.display = "block";
      break;
    }
  }
  
  //Object for saving removed guides in case they need to be added later
  var selectdGuides = {};
  
  const svgPerson = document.getElementById("ajaxContent");
  const guideList = document.getElementById("guideListParent");
  
  //If search box changes, show list and hide svg man:
  const searchBox = document.getElementById("exerciseSearch");
  searchBox.oninput = function() {
    if(searchBox.value != "") {
      svgPerson.style.display = 'none';
      guideList.style.display = 'block';
    } else {
      svgPerson.style.display = 'block';
      guideList.style.display = 'none';
    }
  }

  document.getElementById("workoutBuilderForm").onsubmit = function() {

    var workout = {};

    //Obtain form data
    workout["name"] = document.getElementById("workoutName").value;
    workout["length"] = document.getElementById("estTime").value;
    workout["description"] = document.getElementById("workoutDescription").value;
    workout["focusArea"] = document.getElementById("focusArea").value;
    workout["gymName"] = document.getElementById("gymField").innerText;
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

  //Listen for click events:
  document.addEventListener('click', function (event) {

    if (event.target.nodeName == "path") {
      // hide SVG man:
      svgPerson.style.display = 'none';
      guideList.style.display = 'block';

      // Get stored muscle value from svg man, then find the related radio button and select
      var muscleFilter = sessionStorage.getItem("muscleFilter");
      muscleFilter = muscleFilter.replaceAll(" ", "-")
      document.querySelector(`.${muscleFilter}-filter`).click();

      //Populate search box
      document.getElementById("exerciseSearch").value = muscleMapping[muscleFilter];

    //Adding workout exercise to list
    } else if(event.target.id == "selectWorkoutImage" || event.target.id == "selectWorkout") {

      //Get Guide next to pressed button
      var copyOfGuide = '';
      if (event.target.nodeName == "A") {
        copyOfGuide = event.target.previousSibling.cloneNode(true);
      } else {
        copyOfGuide = event.target.parentElement.previousSibling.cloneNode(true);
      }

      addExerciseToWorkoutList(copyOfGuide);
      

    } else if(event.target.id == "clearText") {
      svgPerson.style.display = 'block';
      guideList.style.display = 'none';
      resetFilters();

    } else if(event.target.id == "removeExercise") {

      const workoutList = document.getElementById("workoutList");
      workoutList.removeChild(event.target.parentElement.parentElement.parentElement.parentElement);
      
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

      console.log(currentExercise.firstChild);
      var temp = currentExercise.removeChild(currentExercise.querySelector("#individualGuide"));
      console.log(temp);
      currentExercise.appendChild(previousExercise.removeChild(previousExercise.querySelector("#individualGuide")));
      previousExercise.appendChild(temp);    
      console.log(event.target.id);   

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
      console.log(currentExercise)
      console.log(currentExercise.firstChild);
      var temp = currentExercise.removeChild(currentExercise.querySelector("#individualGuide"));
      console.log(temp);
      currentExercise.appendChild(nextExercise.removeChild(nextExercise.querySelector("#individualGuide")));
      nextExercise.appendChild(temp);  
      console.log(event.target.id);

    } else if (event.target.id == "createWorkout" || event.target.id == "createWorkoutImage" || event.target.id == "createWorkoutText") {

      //Set create workout flag
      sessionStorage.setItem("createWorkout", true);
      //Go to workout builder
      document.getElementById("workoutBuilderPage").style.display = "block";
      document.getElementById("workoutSummaryPage").style.display = "none";
    } else if(event.target.id == "reset-filters") {
      resetGeneralFilters();
    } else if (event.target.id == "filterButton" || event.target.id == "filtersText" || event.target.id == "filtersImage" || 
      event.target.id == "filterMenuChild" || event.target.classList.contains('filter-title') || event.target.classList.contains('filter-label') 
      || event.target.classList.contains('filter-checkbox') || event.target.classList.contains('clear-filter') || (event.target.tagName == "INPUT" &&  event.target.id != "workoutSearch" && !(event.target.id.includes("radio"))) || event.target.classList.contains('clear-container') || event.target.classList.contains('clear-filters')) {
      document.getElementById("filterMenu").style.display = "block";
    } else if(event.target.id == "exit-menu" ) {
      document.getElementById("filterMenu").style.display = "none";

    } else if(event.target.classList.contains("dropdownitem")) {
      
    }else if(event.target.classList.contains("dropdownitem")) {
      if(event.target.parentElement.id == "focusAreaDropdown") {
        document.getElementById("focusArea").innerText = event.target.innerText;
        document.getElementById("focusAreaDropdown").style.display = "none";
      } else if(event.target.parentElement.id == "durationDropdown") {
        document.getElementById("estTime").innerText = event.target.innerText;
        document.getElementById("durationDropdown").style.display = "none";
      }
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

      //Prefill workout builder with the selected workout
      prefillWorkoutBuilder(event.target);

    } else if(event.target.id == "workoutTitleDiv" || event.target.id == "workoutDifficulty" || event.target.id == "workoutDuration" || event.target.id == "workoutLastEdited") {

      //Note that this is editing a workout
      sessionStorage.setItem('editWorkout', 'true');

      //Prefill workout builder with the selected workout
      prefillWorkoutBuilder(event.target.parentElement);

    } else if(event.target.id == "workoutSummaryName" || event.target.id == "workoutSummaryDescription") {
      
      //Note that this is editing a workout
      sessionStorage.setItem('editWorkout', 'true');

      //Prefill workout builder with the selected workout
      prefillWorkoutBuilder(event.target.parentElement.parentElement);

    } else if (event.target.id == "duplicateWorkout") {
      //Note that this is dupicating an existing workout
      sessionStorage.setItem('duplicateWorkout', 'true');

      //Prefill workout builder with the selected workout
      prefillWorkoutBuilder(event.target.parentElement.parentElement.parentElement.parentElement);

    } else if(event.target.id == "keepEditingWorkout" || event.target.id == "closeBuilderModal" || event.target.id == "closeBuilderModalImage") {
      //Close modal
      document.getElementById("confirmCloseBuilder").style.display = "none";

    } else if(event.target.id == "clearExperienceExerciseFilters") {
      resetGeneralFilters();
      
    } else {
      console.log(event.target)
      document.getElementById("filterMenu").style.display = "none";
    }
  }, false);

  //Listen for click events:
  document.addEventListener('change', function (event) {
    if(event.target.id == "estTime") {
      document.getElementById("estTimeDiv").style.borderRadius = "0px";
      document.getElementById("estTimeDiv").style.border = "";
      document.getElementById("durationRequired").style.display = "none";
    } else if (event.target.id == "focusArea") {
      document.getElementById("focusArea").style.borderRadius = "0px";
      document.getElementById("focusArea").style.border = "";
      document.getElementById("focusAreaRequired").style.display = "none";
    } else if (event.target.type) {
      console.log(event.target.type == "checkbox");
      checkCheckboxFilters().then(res => { 
        //Check if the amount of active filters is more than 0
        if(res > 0) {
          document.getElementById("clearExperienceExerciseFilters").style.display = "block";
          if(event.target.id.includes("exercise-checkbox")) {
            svgPerson.style.display = 'none';
            guideList.style.display = 'block';
          }
        } else {
          document.getElementById("clearExperienceExerciseFilters").style.display = "none";
          if(event.target.id.includes("exercise-checkbox")) {
            svgPerson.style.display = 'block';
            guideList.style.display = 'none';
          }
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
  
  async function resetFilters() {
    window.fsAttributes = window.fsAttributes || [];
    window.fsAttributes.push([
      'cmsfilter',
      async (filterInstances) => {
        // The callback passes a `filterInstances` array with all the `CMSFilters` instances on the page.
        
        //Get muscle related filters
        const filterInstance = filterInstances[1];
        await filterInstance.resetFilters(filterKeys=["exercisename"], null);
        await filterInstance.resetFilters(filterKeys=["musclenamefilter"], null);

      },
    ]);
  }

  async function resetGeneralFilters() {

    const checkboxes = document.getElementsByClassName('filter-checkbox');
    for (let i = 0; i < checkboxes.length; i++) { 
      if(checkboxes[i].classList.value.includes('w--redirected-checked')) {
        checkboxes[i].click();
      }
    }

  }

  //Returns the amount of experience and exercise filters are currently active
  async function checkCheckboxFilters() {
    var filtersTotalSize = 0;
    window.fsAttributes = window.fsAttributes || [];
    window.fsAttributes.push([
      'cmsfilter',
    ])
    return window.fsAttributes.cmsfilter.loading.then(res => {
      var filterInstance = res[1].filtersData;
      filtersTotalSize = filterInstance[1].values.size + filterInstance[2].values.size;
      return filtersTotalSize;
    });

  }

  //Send workout object to make 
  async function sendWorkoutToMake(workout) {
    const editWorkout = sessionStorage.getItem('editWorkout');
    const duplicateWorkout = sessionStorage.getItem('duplicateWorkout');
    const createWorkout = sessionStorage.getItem('createWorkout');

    if(editWorkout == "true") {
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

    } else if(duplicateWorkout == "true" || createWorkout == "true") {

      fetch("https://hook.us1.make.com/7ukin7wskfgygdmvm3dyyol3aiu49re7", {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(workout)
      }).then(res => {
        sessionStorage.setItem('duplicateWorkout', 'false');
        sessionStorage.setItem('createWorkout', 'false');
        location.href = `${location.href}?showPage=workoutSummaryPage`;
        location.reload();
        
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

  function prefillWorkoutBuilder(workoutSummary) {
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

    //Copy guide template and replace all values with exercise from workout
    for(var i = 0; i < workout.exercises.length; i++) {
      var copyOfGuide = document.getElementById("individualGuide").cloneNode(true);
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

      addExerciseToWorkoutList(copyOfGuide, workout.exercises[i]);

    } 
  }

  //Given a row of a workout, extract all data points within each
  function getWorkoutExerciseInformation(selectedWorkout) {
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
    if(sessionStorage.getItem('editWorkout') == "true") {
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
      
      //Add exercise object to exercises list
      exercises.push(exercise);
    }

    //Add list of exercises to workout object
    workout["exercises"] = exercises;

    return workout;
  }

  function addExerciseToWorkoutList(copyOfGuide, exerciseInformation=null) {

    //Get current guide and add to workout list
    const workoutList = document.getElementById("workoutList");

    const workoutItemTemplate = workoutList.querySelector("ul > li:first-child");
    
    var workoutItem = workoutItemTemplate.cloneNode(true);
    
    //Add set rep info into guide template
    const setRepInfo = workoutItem.querySelector("#setRepInfo").cloneNode(true);
    copyOfGuide.append(setRepInfo);

    //If extra information is provided fill in fields
    if(exerciseInformation != null) {

      setRepInfo.querySelector("#reps").value = exerciseInformation.exerciseReps;
      setRepInfo.querySelector("#sets").value = exerciseInformation.exerciseSets;
      setRepInfo.querySelector("#exerciseRestMinutes").value = exerciseInformation.exerciseRestMins;
      setRepInfo.querySelector("#exerciseRestSeconds").value = exerciseInformation.exerciseRestSecs;
      workoutItem.querySelector("#restBetweenExerciseMinutes").value = exerciseInformation.exerciseRestBetweenMins;
      workoutItem.querySelector("#restBetweenExerciseSeconds").value = exerciseInformation.exerciseRestBetweenSecs;
      workoutItem.querySelector("#workoutExerciseItemID").innerText = exerciseInformation.exerciseItemID;
      workoutItem.querySelector("#workoutExerciseFullName").innerText = exerciseInformation.exerciseFullName;

    }
    
    //Remove link to guide:
    copyOfGuide.href = "#";
    
    //Remove old template
    workoutItem.querySelector("#setRepInfo").remove();
    
    //Add guide to workout exercise template
    workoutItem.querySelector("#guidePlaceHolder").append(copyOfGuide);

    
    workoutItem.style.display = "block";
    
    //Reduce headers font size:
    workoutItem.querySelector("#guideName").style.fontSize = "20px";
    workoutItem.querySelector("#exerciseDifficultyParent").style.display = "none";

    //Add to 'workouts' list
    workoutList.appendChild(workoutItem);

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
      if(listLength >= 3) {
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
      workoutItem.querySelector("#moveDown").style.display = "none";
      saveWorkout.style.display = "none";
      document.getElementById("firstExercisePlaceholder").style.display = "none";
    } else if(listLength == 3) {
      workoutItem.querySelector("#exerciseBreaker").style.display = "block";
      workoutItem.querySelector("#moveDown").style.display = "none";
      workoutItem.querySelector("#moveUp").style.display = "block";
      workoutItem.previousSibling.querySelector("#moveDown").style.display = "block";
      saveWorkout.style.display = "block";
    } else if(listLength > 3) {
      workoutItem.querySelector("#exerciseBreaker").style.display = "block";
      workoutItem.previousSibling.querySelector("#moveDown").style.display = "block";
      workoutItem.previousSibling.querySelector("#moveUp").style.display = "block";
      workoutItem.querySelector("#moveDown").style.display = "none";
      workoutItem.querySelector("#moveUp").style.display = "block";
      saveWorkout.style.display = "block";
    }

  }

  function checkAndClearWorkouts(destinationScreen) {
    resetGeneralFilters();
    //Check if list size is > 1 and obtain values for workout summary inputs to check if they are empty or not
    const workoutList = document.getElementById("workoutList").children;
    const workoutTitle = document.getElementById("workoutName").value;
    const workoutDuration = document.getElementById("estTime").value;
    const workoutFocusArea = document.getElementById("focusArea").value;
    const workoutDescription = document.getElementById("workoutDescription").value;
    if (workoutList.length > 1 || workoutTitle != "" || workoutDuration != "Duration" || workoutFocusArea != "Focus Area" || workoutDescription != "") {
      var closeBuilderModal = document.getElementById("confirmCloseBuilder");
      //Set flex styling:
      closeBuilderModal.style.display = "flex";
      closeBuilderModal.style.flexDirection = "column";
      closeBuilderModal.style.justifyContent = "center";
      closeBuilderModal.style.alignItems = "center";
      //Show modal:
      closeBuilderModal.display = "block";

      //Navigate to selected page
      document.getElementById("dontSaveWorkout").onclick = function() {
        //Close modal
        document.getElementById("confirmCloseBuilder").style.display = "none";
        //Hide and clear workout builder
        document.getElementById("workoutBuilderPage").style.display = "none";
        //Show selected page
        document.getElementById(destinationScreen).style.display = "block";

        clearWorkoutExerciseList();
      }

    } else {
      workoutBuilderPage.style.display = "none";
      
      document.getElementById(destinationScreen).style.display = "block";
      //workoutSummaryPage.style.display = "block";
    }

    //Ensure svg man is shown and exercise list is hidden
    //Hide list
    document.getElementById("guideListParent").style.display = "none";
    //Show svg man
    document.getElementById("ajaxContent").style.display = "block";
    //Clear filters
    resetFilters();
  }

  function clearWorkoutExerciseList() {
    const workoutList = document.getElementById("workoutList").children;
    const firstElement = workoutList[0]
    //Loop through list and remove selected exercises
    while(firstElement.nextSibling != null) {
      firstElement.nextSibling.remove()
    }
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
  }

  /*
    jQuery for limiting number inputs
  */
  $("#sets").attr({
    "min" : 0,
    "value": 3
  });
  $("#reps").attr({
    "min" : 0,
    "value": 12
  });
  $("#exerciseRestMinutes").attr({
    "min" : 0,
    "value": 1
  });
  $("#exerciseRestSeconds").attr({
    "min" : 0,
    "max": 45,
    "step": 15,
    "value": 30
  });
  $("#restBetweenExerciseSeconds").attr({
    "min" : 0,
    "max": 45,
    "step": 15,
    "value": 30
  });
  $("#restBetweenExerciseMinutes").attr({
    "min" : 0,
    "value": 1
  });
  $('#focusArea').each( function () {
    $(this).children('option:first').attr("disabled", "disabled");
  });
  $('#estTime').each( function () {
    $(this).children('option:first').attr("disabled", "disabled");
  });
  $("#focusArea").attr("required", true);
  $("#estTime").attr("required", true);
  
};
