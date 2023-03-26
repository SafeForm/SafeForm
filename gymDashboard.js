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

window.addEventListener('load', (event) => {
  MemberStack.onReady.then(function(member) {  
    var membership = member.membership  
    var memberID = member["id"];
    var equipmentStatus = member["equipment-upload-complete"];
    console.log(equipmentStatus);
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

        // Check if there are any exercises in the list 
        // If there is, prompt user to confirm removing list 

        // If they confirm remove items from list and clear filters and hide exercise list
        checkAndClearWorkouts("workoutSummaryPage");

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
  
  //Object to keep track of the guide -> exercise workout mapping
  //Object with guide ID as the key and array of guide divs as values
  var guideToWorkoutObj = {};

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

  //Catching mouse over and out events for showing the thumbnail and svg person
  document.addEventListener('mouseover', function (event) {

    if(event.target.id == "workoutExercisename") {
        
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

    if(event.target.id == "workoutExercisename") {
      event.target.parentElement.parentElement.parentElement.parentElement.querySelector("#thumbnailAndMuscleDiv").style.display = "none";
      //Underline text
      event.target.style.textDecoration = "none";
    } else if (event.target.id == "thumbnailAndMuscleDiv") {
      event.target.style.display = "none";
    }

  }, false);

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

  //Listen for click events:
  document.addEventListener('click', function (event) {

    if (event.target.nodeName == "path") {
      var muscleFilter = sessionStorage.getItem("muscleFilter");
      
      //Ensure muscle filter exists
      if(muscleFilter && muscleFilter != "") {
        muscleFilter = muscleFilter.replaceAll(" ", "-");
        document.querySelector(`.${muscleFilter}-filter`).click();
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
      
    }  else if( event.target.id == "qrImg") {
      //Get link from hidden field
      const workoutLink = event.target.parentElement.parentElement.querySelector("#workoutLink").href;
      const workoutName = event.target.parentElement.parentElement.querySelector("#workoutSummaryName").innerText
      //Insert workout name
      document.getElementById("scanWorkoutName").innerHTML = workoutName;
      //Produce QR code and add it to div
      generateQRCode(workoutLink);

    } else if(event.target.id == "modalWrapper" || event.target.className == "close-modal" || event.target.className == "exit-qr-scan") {
      //Remove QR code
      document.querySelector(".qr-code img").remove();

    } else if(event.target.id == "clearText" || event.target.id == "clearTextDiv" || event.target.id == "clearTextImage" || event.target.id == "clearTextBlock") {
      svgPerson.style.display = 'block';
      guideList.style.display = 'none';
      clickExerciseText.style.display = 'none';
      backButton.style.display = 'none';
      resetFilters();

    } else if(event.target.id == "submitWorkout") {

      //Hide confirm close modal
      document.getElementById("confirmCloseBuilder").style.display = "none";

      //Attempt to submit workout 
      document.getElementById("saveWorkout").click();

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

      var temp = currentExercise.removeChild(currentExercise.querySelector("#individualGuide"));

      currentExercise.appendChild(nextExercise.removeChild(nextExercise.querySelector("#individualGuide")));
      nextExercise.appendChild(temp);  

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

      console.log(workout);
      
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

    } else if(event.target.id == "keepEditingWorkout" || event.target.id == "closeBuilderModal" || event.target.id == "closeBuilderModalImage") {
      //Close modal
      document.getElementById("confirmCloseBuilder").style.display = "none";

    } else if(event.target.id == "clearExperienceExerciseFilters") {
      resetGeneralFilters();
      
    } else {
      document.getElementById("filterMenu").style.display = "none";
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
    } else if (event.target.type) {
      checkCheckboxFilters().then(res => { 
        //Check if the amount of active filters is more than 0
        if(res > 0) {
          document.getElementById("clearExperienceExerciseFilters").style.display = "block";
          document.getElementById("filterOn").style.display = "block";
        } else {
          document.getElementById("clearExperienceExerciseFilters").style.display = "none";
          document.getElementById("filterOn").style.display = "none";
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
  
  async function resetFilters(onlyCheckboxes=false) {
    window.fsAttributes = window.fsAttributes || [];
    window.fsAttributes.push([
      'cmsfilter',
      async (filterInstances) => {
        // The callback passes a `filterInstances` array with all the `CMSFilters` instances on the page.
        document.getElementById("exerciseSearch").value = "";
        //Get muscle related filters
        const [filterInstance] = filterInstances;
        !onlyCheckboxes ? await filterInstance.resetFilters(filterKeys=["exercisename","casualmusclefilter"], null) : null;
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
      var filterInstance = res[0].filtersData;
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

  //Delete chosen workout and all of its exercises related to it
  async function deleteWorkout(workout) {
    console.log("sending");
    fetch("https://hook.us1.make.com/eh9374j99jisjiba83t4tl7vulv7c74u", {
      method: "POST",
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify(workout)
    }).then(res => {
      console.log("Workout deleted")
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

  function checkIfLastExerciseInList(workoutKeyID) {
    console.log(workoutKeyID)
    //Remove an entry from guide to workout object
    var guideDiv = guideToWorkoutObj[workoutKeyID].pop();

    if(guideToWorkoutObj[workoutKeyID].length == 0) {
      return guideDiv;
    }

    return false;

  }

  function generateQRCode(link) {

    var qrcode = new QRCode(document.querySelector(".qr-code"), {
      text: `${link}`,
      width: 300, //default 128
      height: 300,
      colorDark : "#0C08D5",
      colorLight : "#FFFFFF",
      correctLevel : QRCode.CorrectLevel.H
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

    var listOfGuideIDs = [];
    //Copy guide template and replace all values with exercise from workout
    for(var i = 0; i < workout.exercises.length; i++) {

      //Add guide ID to list
      listOfGuideIDs.push(workout.exercises[i].exerciseGuideID);

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

      //Change ID of exercise name
      copyOfGuide.querySelector("#guideName").id = "workoutExercisename";

      //Ensure proper guide ID is set
      copyOfGuide.querySelector("#itemID").innerText = workout.exercises[i].exerciseGuideID;

      //Remove info button
      copyOfGuide.querySelector("#guideLinkInfo").remove();

      //Copy thumbnail and svg person into a separate div
      var exerciseThumbnail = $(copyOfGuide).find("#exerciseThumbnail").detach();
      var svgPersonDiv = $(copyOfGuide).find("#exerciseInfoRight").detach();

      addExerciseToWorkoutList(copyOfGuide, workout.exercises[i], true, exerciseThumbnail, svgPersonDiv);

    } 
    //Add workout entry for green border colour
    addWorkoutListEntry(listOfGuideIDs);
    console.log(guideToWorkoutObj);

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
      //Exercise Guide ID
      exercise["exerciseGuideID"] = workoutDetails.querySelector("#exerciseGuideID").innerText;
      
      //Add exercise object to exercises list
      exercises.push(exercise);
    }

    //Add list of exercises to workout object
    workout["exercises"] = exercises;

    return workout;
  }

  function addExerciseToWorkoutList(copyOfGuide, exerciseInformation=null, prefill=null, thumbnail=null, svgPerson=null) {

    //Get current guide and add to workout list
    const workoutList = document.getElementById("workoutList");

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
      setRepInfo.querySelector("#reps").value = exerciseInformation.exerciseReps;
      setRepInfo.querySelector("#sets").value = exerciseInformation.exerciseSets;
      setRepInfo.querySelector("#exerciseRestMinutes").value = exerciseInformation.exerciseRestMins;
      setRepInfo.querySelector("#exerciseRestSeconds").value = exerciseInformation.exerciseRestSecs;
      workoutItem.querySelector("#restBetweenExerciseMinutes").value = exerciseInformation.exerciseRestBetweenMins;
      workoutItem.querySelector("#restBetweenExerciseSeconds").value = exerciseInformation.exerciseRestBetweenSecs;
      workoutExerciseItemID.innerText = exerciseInformation.exerciseItemID;
      workoutExerciseFullName.innerText = exerciseInformation.exerciseFullName;
      
    }
    
    //Remove link to guide:
    copyOfGuide.href = "#";
    
    //Remove old template
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
      workoutList.scrollIntoView({behavior: "smooth", block: "end", inline: "end"});
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
      document.getElementById("dontSaveWorkout").onclick = function() {
        //Close modal
        document.getElementById("confirmCloseBuilder").style.display = "none";
        //Hide and clear workout builder
        document.getElementById("workoutBuilderPage").style.display = "none";
        //Show selected page
        document.getElementById(destinationScreen).style.display = "block";

        //Clear session storage
        sessionStorage.setItem('editWorkout', 'false');
        sessionStorage.setItem('duplicateWorkout', 'false');
        sessionStorage.setItem('createWorkout', 'false');

        //Clear workout to guide list mapping
        clearWorkoutListEntry();

        clearWorkoutExerciseList();
      }

    } else {
      workoutBuilderPage.style.display = "none";
      
      document.getElementById(destinationScreen).style.display = "block";

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
    "max" : 9,
    "value": 3
  });
  $("#exerciseRestSeconds").attr({
    "min" : 0,
    "max": 45,
    "step": 15,
    "value": 0
  });
  $("#restBetweenExerciseSeconds").attr({
    "min" : 0,
    "max": 45,
    "step": 15,
    "value": 0
  });
  $("#restBetweenExerciseMinutes").attr({
    "min" : 0,
    "value": 3
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
