
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
        document.getElementById("equipmentListContainer").style.display = 'block';
        document.getElementById("equipmentPage").onclick = function() {
          equipmentBody.style.display = "block";
          dashboardBody.style.display = "none";
          settingsBody.style.display = "none";
        };

        document.getElementById("dashboardPage").onclick = function() {
          dashboardBody.style.display = "block";
          equipmentBody.style.display = "none";
          settingsBody.style.display = "none";
        };

        document.getElementById("settingsPage").onclick = function() {
          settingsBody.style.display = "block";
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
      svgPerson.style.display = 'block';
      guideList.style.display = 'none';
      clearFilters.style.display = 'none';
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

    //Listen for click events:
    document.addEventListener('click', function (event) {

      // If the clicked element doesn't have the right selector, bail
      if (event.target.nodeName == "path") {
        // hide SVG man:
        svgPerson.style.display = 'none';
        guideList.style.display = 'block';
        clearFilters.style.display = 'block';
        

        // Get stored muscle value from svg man, then find the related radio button and select
        var muscleFilter = sessionStorage.getItem("muscleFilter");
        muscleFilter = muscleFilter.replaceAll(" ", "-")
        document.querySelector(`.${muscleFilter}-filter`).click();

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
        workoutItem.querySelector("#exerciseDifficulty").remove();
        
        //Add to 'workouts' list
        workoutList.appendChild(workoutItem);
        
        const listLength = workoutList.childNodes.length;
        console.log(listLength);

        //Hiding and showing move icons and break icon between exercises
        if(listLength == 2) {
        	workoutItem.querySelector("#moveDown").style.display = "none";
        } else if(listLength == 3) {
        	workoutItem.querySelector("#exerciseBreaker").style.display = "block";
          workoutItem.querySelector("#moveDown").style.display = "none";
          workoutItem.querySelector("#moveUp").style.display = "block";
          workoutItem.previousSibling.querySelector("#moveDown").style.display = "block";
        } else if(listLength > 3) {
        	workoutItem.querySelector("#exerciseBreaker").style.display = "block";
          workoutItem.previousSibling.querySelector("#moveDown").style.display = "block";
          workoutItem.previousSibling.querySelector("#moveUp").style.display = "block";
          workoutItem.querySelector("#moveDown").style.display = "none";
          workoutItem.querySelector("#moveUp").style.display = "block";
        }

      } else if(event.target.id == "clearFilters") {
      	resetFilters();
      } else if(event.target.id == "removeExercise") {
      	const workoutList = document.getElementById("workoutList");
        workoutList.removeChild(event.target.parentElement.parentElement.parentElement.parentElement);
        
        const listLength = workoutList.childNodes.length;
        if(listLength >= 2) {
          const firstElement = workoutList.querySelector("ul > li:nth-child(2)");
          const lastElement = workoutList.querySelector(`ul > li:nth-child(${listLength})`);

          if(firstElement) {
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

	};
