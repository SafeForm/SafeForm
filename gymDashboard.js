
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
          equipmentBody.style.display = "block";
          dashboardBody.style.display = "none";
          settingsBody.style.display = "none";
          workoutBuilderPage.style.display = "none";
          workoutSummaryPage.style.display = "none";
          //Reset filters on workout summary page
          resetGeneralFilters();
        };

        document.getElementById("dashboardPage").onclick = function() {
          dashboardBody.style.display = "block";
          equipmentBody.style.display = "none";
          settingsBody.style.display = "none";
          workoutBuilderPage.style.display = "none";
          workoutSummaryPage.style.display = "none";
          //Reset filters on workout summary page
          resetGeneralFilters();
        };

        document.getElementById("settingsPage").onclick = function() {
          settingsBody.style.display = "block";
          equipmentBody.style.display = "none";
          dashboardBody.style.display = "none";
          workoutBuilderPage.style.display = "none";
          workoutSummaryPage.style.display = "none";
          //Reset filters on workout summary page
          resetGeneralFilters();
        };
        
        document.getElementById("workoutsPage").onclick = function() {
          //Reset filters on workout summary page
          resetGeneralFilters();
          workoutSummaryPage.style.display = "block";
        	workoutBuilderPage.style.display = "none";
          settingsBody.style.display = "none";
          equipmentBody.style.display = "none";
          dashboardBody.style.display = "none";

        };

      } else {
        document.getElementById("equipmentListContainer").style.display = 'none';
        document.getElementById("notUploaded").style.display = "block";
      }

    })
    
    //Object for saving removed guides in case they need to be added later
    var selectdGuides = {};
    
    const svgPerson = document.getElementById("ajaxContent");
    const guideList = document.getElementById("guideListParent");
    const clearFilters = document.getElementById("clearFilters");

    //set onclick for clear button
    document.getElementById("clearFilters").onclick = function() {

    }
    
    //If search box changes, show list and hide svg man:
    const searchBox = document.getElementById("exerciseSearch");
    searchBox.oninput = function() {
    	if(searchBox.value != "") {
        svgPerson.style.display = 'none';
        guideList.style.display = 'block';
        clearFilters.style.display = 'block';
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
      workout["listOfExercises"] = [];
      workout["experience"] = document.getElementById("experience").innerText;;

      const workoutList = document.getElementById("workoutList").children;
      
      //Loop through list and obtain rest of data and add to object 
      for(var i = 1; i < workoutList.length; i++) {
        var workoutExercise = {}
        i == 2 ? workoutExercise["restBetweenSeconds"] = workoutList[i].querySelector("#restBetweenExerciseSeconds").value : null;
        i == 2 ? workoutExercise["restBetweenMinutes"] = workoutList[i].querySelector("#restBetweenExerciseMinutes").value : null;

        workoutExercise["sets"] = workoutList[i].querySelector("#sets").value;
        workoutExercise["reps"] = workoutList[i].querySelector("#reps").value;
        workoutExercise["exerciseRestSeconds"] = workoutList[i].querySelector("#exerciseRestSeconds").value;
        workoutExercise["exerciseRestMinutes"] = workoutList[i].querySelector("#exerciseRestMinutes").value;
        
        workoutExercise["guideID"] = workoutList[i].querySelector("#itemID").innerText;
        workout.listOfExercises.push(workoutExercise);
      }
      console.log("sending");

      //Make sure they have selected a duration and focus area
      if(!workout["length"].includes("Duration...") && !workout["focusArea"].includes("Focus Area...")) {
        //Send to make and navigate back to workout summary
        sendWorkoutToMake(workout);      
      } else {
        if(workout["length"] == "Duration...") {
          document.getElementById("estTime").style.borderRadius = "8px";
          document.getElementById("estTime").style.border = "2px solid red";
        } else if(workout["focusArea"] == "Focus Area...") {
          document.getElementById("focusArea").style.borderRadius = "8px";
          document.getElementById("focusArea").style.border = "2px solid red";
        }
      }
    }

    //Listen for click events:
    document.addEventListener('click', function (event) {

      if (event.target.nodeName == "path") {
        // hide SVG man:
        svgPerson.style.display = 'none';
        guideList.style.display = 'block';
        clearFilters.style.display = 'block';

        // Get stored muscle value from svg man, then find the related radio button and select
        var muscleFilter = sessionStorage.getItem("muscleFilter");
        muscleFilter = muscleFilter.replaceAll(" ", "-")
        document.querySelector(`.${muscleFilter}-filter`).click();

      //Adding workout exercise to list
      } else if(event.target.id == "selectWorkoutImage" || event.target.id == "selectWorkout") {

        //Get Guide next to pressed button
        var copyOfGuide = '';
        if (event.target.nodeName == "A") {
        	copyOfGuide = event.target.previousSibling.cloneNode(true);
        } else {
        	copyOfGuide = event.target.parentElement.previousSibling.cloneNode(true);
        }

        //Get current guide and add to workout list
        const workoutList = document.getElementById("workoutList");
        
        const workoutItemTemplate = workoutList.querySelector("ul > li:first-child");
        
        var workoutItem = workoutItemTemplate.cloneNode(true);
        
        //Add set rep info into guide template
        const setRepInfo = workoutItem.querySelector("#setRepInfo").cloneNode(true);
        copyOfGuide.append(setRepInfo);
        
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
        if(listLength > 2) {
          workoutItem.querySelector("#reps").setAttribute("required", "");
          workoutItem.querySelector("#sets").setAttribute("required", "");
          workoutItem.querySelector("#exerciseRestMinutes").setAttribute("required", "");
          workoutItem.querySelector("#exerciseRestSeconds").setAttribute("required", "");
          workoutItem.querySelector("#restBetweenExerciseMinutes").setAttribute("required", "");
          workoutItem.querySelector("#restBetweenExerciseSeconds").setAttribute("required", "");
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
      } else if(event.target.id == "clearFilters" || event.target.id == "clearText") {
        svgPerson.style.display = 'block';
        guideList.style.display = 'none';
        clearFilters.style.display = 'none';
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
      } else if(event.target.id == "moveUp") {
      	const currentExercise = event.target.parentElement.nextSibling.querySelector("#guidePlaceHolder");
        const previousExercise = event.target.parentElement.parentElement.parentElement.previousSibling.querySelector("#guidePlaceHolder");
        
      	var temp = currentExercise.removeChild(currentExercise.firstChild);
        currentExercise.appendChild(previousExercise.removeChild(previousExercise.firstChild));
        previousExercise.appendChild(temp);       
      } else if(event.target.id == "moveDown") {
        const currentExercise = event.target.parentElement.nextSibling.querySelector("#guidePlaceHolder");
        const nextExercise = event.target.parentElement.parentElement.parentElement.nextSibling.querySelector("#guidePlaceHolder");
        var temp = currentExercise.removeChild(currentExercise.firstChild);
        currentExercise.appendChild(nextExercise.removeChild(nextExercise.firstChild));
        nextExercise.appendChild(temp);  
      } else if (event.target.id == "createWorkout" || event.target.id == "createWorkoutImage" || event.target.id == "createWorkoutText") {
        //Go to workout builder
        document.getElementById("workoutBuilderPage").style.display = "block";
        document.getElementById("workoutSummaryPage").style.display = "none";
      } else if(event.target.id == "reset-filters") {
        resetGeneralFilters();
      } else if (event.target.id == "filterButton" || event.target.id == "filtersText" || event.target.id == "filtersImage" || 
        event.target.id == "filterMenuChild" || event.target.classList.contains('filter-title') || event.target.classList.contains('filter-label') 
        || event.target.classList.contains('filter-checkbox') || event.target.classList.contains('clear-filter') || (event.target.tagName == "INPUT" &&  event.target.id != "workoutSearch") || event.target.classList.contains('clear-container') || event.target.classList.contains('clear-filters')) {
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
      } else {
        document.getElementById("filterMenu").style.display = "none";
      }
    }, false);

    //Listen for click events:
    document.addEventListener('change', function (event) {
      if(event.target.id == "estTime") {
        document.getElementById("estTime").style.borderRadius = "0px";
        document.getElementById("estTime").style.border = "";
      } else if (event.target.id == "focusArea") {
        document.getElementById("focusArea").style.borderRadius = "0px";
        document.getElementById("focusArea").style.border = "";
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
          const [filterInstance] = filterInstances;
          await filterInstance.resetFilters(filterKeys=["exercisename"], null);
          await filterInstance.resetFilters(filterKeys=["musclenamefilter"], null)
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

    async function sendWorkoutToMake(workout) {
      fetch("https://hook.us1.make.com/7ukin7wskfgygdmvm3dyyol3aiu49re7", {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(workout)
      }).then(res => {
        location.href = `${location.href}?showPage=workoutSummaryPage`;
        location.reload();

      });
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
