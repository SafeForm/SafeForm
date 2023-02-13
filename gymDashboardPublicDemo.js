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
  var muscleElement = exerciseList[i].querySelector("#scientificPrimaryMuscle");

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

document.addEventListener('DOMContentLoaded', (event) => {

  //Object to keep track of the guide -> exercise workout mapping
  //Object with guide ID as the key and array of guide divs as values
  var guideToWorkoutObj = {};
  
  const svgPerson = document.getElementById("ajaxContent");
  const guideList = document.getElementById("guideListParent");
  const clickExerciseText = document.getElementById("clickExerciseText");
  
  
  //If search box changes, show list and hide svg man:
  const searchBox = document.getElementById("exerciseSearch");
  searchBox.oninput = function() {
    if(searchBox.value != "") {
      svgPerson.style.display = 'none';
      guideList.style.display = 'block';
      clickExerciseText.style.display = 'block';
    } else {
      svgPerson.style.display = 'block';
      guideList.style.display = 'none';
      clickExerciseText.style.display = 'none';
    }
  }

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
      //Remove underline text
      event.target.style.textDecoration = "none";
    } else if (event.target.id == "thumbnailAndMuscleDiv") {
      event.target.style.display = "none";
    }

  }, false);

  document.addEventListener('submit', function (event) {

    if(event.target.id == "workoutBuilderForm") {
      var workout = {};

      //Obtain form data
      workout["name"] = document.getElementById("workoutName").value;
      workout["length"] = document.getElementById("estTime").value;
      workout["description"] = document.getElementById("workoutDescription").value;
      workout["focusArea"] = document.getElementById("focusArea").value;
      //workout["gymName"] = document.getElementById("gymField").innerText;
      //workout["gymID"] = document.getElementById("gymID").innerText;
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
        //Save workout details
        //sessionStorage.setItem('workout', JSON.stringify(workout));
  
        //Send workout to make
        sendWorkoutToMake(workout);
  
        //Show email modal
        var modalWrapperStyle = document.getElementById("modalWrapper").style
        modalWrapperStyle.display = "flex";
        modalWrapperStyle.alignItems = "center";
        modalWrapperStyle.justifyContent = "center";
  
        var emailCollectDiv = document.getElementById("emailCollectDiv").style
        emailCollectDiv.display = "flex";
        emailCollectDiv.alignItems = "stretch";
        emailCollectDiv.justifyContent = "center";
        emailCollectDiv.flexDirection = "row";
        
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
    } else if (event.target.id == "collectEmailForm") {
      //Unblur image
      let qr_code_img = document.querySelector(".qr-code img");
      qr_code_img.style.filter = "blur(0px)";
    } 
  }, false);


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
        addExerciseToWorkoutList(copyOfGuide, exerciseThumbnail, svgPersonDiv);
        //Change border colour of guide exercise
        guideExercises[i].style.borderColor = "rgb(8, 213, 139)";
  
        createWorkoutListEntry(copyOfGuide.querySelector("#itemID").innerText, guideExercises[i]);

      }

    }
  }


  //Listen for click events:
  document.addEventListener('click', function (event) {
    if (event.target.nodeName == "path") {
      // hide SVG man:
      svgPerson.style.display = 'none';
      guideList.style.display = 'block';
      clickExerciseText.style.display = 'block';

      // Get stored muscle value from svg man, then find the related radio button and select
      var muscleFilter = sessionStorage.getItem("muscleFilter");
      muscleFilter = muscleFilter.replaceAll(" ", "-")
      document.querySelector(`.${muscleFilter}-filter`).click();

      //Populate search box
      document.getElementById("exerciseSearch").value = muscleMapping[muscleFilter];

    } else if(event.target.id == "clearText") {
      svgPerson.style.display = 'block';
      guideList.style.display = 'none';
      clickExerciseText.style.display = 'none';
      resetFilters();

    } else if (event.target.id == "product" || event.target.id == "pricing" || event.target.id == "contactUs" || event.target.id == "home" ) {

      checkAndClearWorkouts(event);

    } else if (event.target.id == "homeImage") {
      checkAndClearWorkouts(event);

    } else if (event.target.id == "exerciseLibrary" || event.target.id == "blog") {
      checkAndClearWorkouts(event);

    } else if(event.target.id == "keepEditingWorkout") {
      //Close modal
      document.getElementById("confirmCloseBuilder").style.display = "none";

    } else if(event.target.id == "submitWorkout") {

      //Hide confirm close modal
      document.getElementById("confirmCloseBuilder").style.display = "none";

      //Attempt to submit workout 
      document.getElementById("saveWorkout").click();

    } else if (event.target.id == "resources") {

      //Deal with this somehow

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
      console.log(nextExercise);


    } else if(event.target.id == "reset-filters") {
      resetGeneralFilters();
    } else if(event.target.id == "exit-menu" ) {
      document.getElementById("filterMenu").style.display = "none";

    } else if(event.target.classList.contains("dropdownitem")) {
      if(event.target.parentElement.id == "focusAreaDropdown") {
        document.getElementById("focusArea").innerText = event.target.innerText;
        document.getElementById("focusAreaDropdown").style.display = "none";
      } else if(event.target.parentElement.id == "durationDropdown") {
        document.getElementById("estTime").innerText = event.target.innerText;
        document.getElementById("durationDropdown").style.display = "none";
      }
    } else if(event.target.id == "clearExperienceExerciseFilters") {
      resetGeneralFilters();
      
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
      checkCheckboxFilters().then(res => { 
        if(res > 0) {
          document.getElementById("clearExperienceExerciseFilters").style.display = "block";
        } else {
          document.getElementById("clearExperienceExerciseFilters").style.display = "none";
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
        const filterInstance = filterInstances[0];
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

      var filterInstance = res[0].filtersData;
      filtersTotalSize = filterInstance[1].values.size + filterInstance[2].values.size;
      return filtersTotalSize;
    });

  }

  //Send workout object to make 
  async function sendWorkoutToMake(workout) {

    if(workout) {

      fetch("https://hook.us1.make.com/7yvpm815u7i19m3u2joxeibcobztww2m", {
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

        //Generate QR Code
        generateQRCode(data);
        
      })
      .catch((error) => {
        console.log(error);
        alert("Could not create workout, please try again");
      });
    }

  }

  function addExerciseToWorkoutList(copyOfGuide, thumbnail, svgPerson, exerciseInformation=null, prefill=null) {

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

    //Make svg person smaller
    svgPerson[0].style.width = "80%";
    thumbnail[0].style.width = "100%";
    
    //Add guide to workout exercise template
    workoutItem.querySelector("#guidePlaceHolder").append(copyOfGuide);

    
    workoutItem.style.display = "block";
    
    //Reduce headers font size:
    workoutItem.querySelector("#workoutExercisename").style.fontSize = "20px";
    workoutItem.querySelector("#exerciseDifficultyParent").style.display = "none";

    //Add thumbnail and svg person to hover div
    $(workoutItem).find("#thumbnailAndMuscleDiv").append(thumbnail);
    $(workoutItem).find("#thumbnailAndMuscleDiv").append(svgPerson);

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
      if(listLength >= 3) {
        workoutItem.querySelector("#restBetweenExerciseMinutes").setAttribute("required", "");
        workoutItem.querySelector("#restBetweenExerciseSeconds").setAttribute("required", "");
      }
    }
    
    const saveWorkout = document.getElementById("saveWorkout");

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
  }

  function checkIfLastExerciseInList(workoutKeyID) {

    //Remove an entry from guide to workout object
    var guideDiv = guideToWorkoutObj[workoutKeyID].pop();

    if(guideToWorkoutObj[workoutKeyID].length == 0) {
      return guideDiv;
    }

    return false;

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

      //Prevent navigation
      destinationScreen.preventDefault();

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

        //Show selected page
        if(destinationScreen.target.id == "homeImage") {
          window.location = destinationScreen.target.parentElement.parentElement.href;
        } else {
          window.location = destinationScreen.target.href;
        }


      }

    } 

    //Ensure svg man is shown and exercise list is hidden
    //Hide list
    document.getElementById("guideListParent").style.display = "none";
    //Show svg man
    document.getElementById("ajaxContent").style.display = "block";
    //Clear filters
    resetFilters();
  }

  function generateQRCode(link) {

    var qrcode = new QRCode(document.querySelector(".qr-code"), {
      text: `${link}`,
      width: 300, //default 128
      height: 300,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.M
    });

    //Initially blur image
    let qr_code_img = document.querySelector(".qr-code img");
    qr_code_img.style.filter = "blur(5px)";

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
  
});
