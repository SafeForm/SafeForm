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

  var numberOfExercisesInList = 0;

  var workoutSortable = new Sortable(document.getElementById("workoutList"), {
    animation: 150,
    dragClass: "sortable-ghost",  // Class name for the dragging item
    handle: "#navigationButtons", // Set navigationButtons as the drag handle
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


  //Ensure mobile workout name isnt required on laptop
  if(window.innerWidth > 991) {
    document.getElementById("mobileWorkoutName").removeAttribute("required");
  }

  //Object to keep track of the guide -> exercise workout mapping
  //Object with guide ID as the key and array of guide divs as values
  var guideToWorkoutObj = {};

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
          exerciseInfoDiv.querySelector("#repsInput").value = "";
          exerciseInfoDiv.querySelector("#repsInput").style.display = "none";
          exerciseInfoDiv.querySelector("#repsInput").required = false;

          //Change AMRAP width:
          exerciseInfoDiv.querySelector("#quantityUnit").style.width = "90px";
        }

        //Add to exercise divs
        const workoutItemExercise = workoutItem;
        const exerciseInfoElements = workoutItemExercise.querySelectorAll("#exerciseInfo");

        const lastSetRepInput = exerciseInfoElements[exerciseInfoElements.length - 1];

        exerciseInfoDiv.style.paddingTop = "5px";

        lastSetRepInput.after(exerciseInfoDiv);
      }
      workoutItem.querySelector("#exerciseNotes").value = jsonExercises.exerciseNotes;
      
    }
    
    workoutItem.style.display = "block";
    
    //Reduce headers font size:
    workoutItem.querySelector("#exerciseInfoRight").style.height = "35px";
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
      document.getElementById("workoutList").style.display = "flex";
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
      if(event.target.closest("#setRepInfoParent").querySelectorAll("#exerciseInfo").length > 2) {
      } else {
        //Check after removal
        event.target.closest("#setRepInfoParent").querySelector("#removeSetMobile").style.display = "none";
        //Check if mobile:
        if(window.innerWidth < 992) {
          event.target.closest("#setRepInfoParent").querySelector("#removeExerciseMobile").style.display = "block";
        }
      }
    }

    lastSetRepInput.after(lastExerciseInfo);
  }

  function handleSupersetClick(event) {
    const supersetImage = event.target;

    if(event.target.classList.contains("supersetimageopen")) {

      var supersetParent = supersetImage.closest('.exercise-list-item');
      var nextSibling = supersetParent.nextElementSibling;
      const previousSibling = supersetParent.closest(".exercise-list-item-superset");
      var parentPreviousSibling = null;
      var nextSuperset = null;
      
      if(previousSibling) {
        parentPreviousSibling = previousSibling.closest(".supersetWrapper");
        if(parentPreviousSibling) {
          nextSuperset = parentPreviousSibling.nextElementSibling;
        }
      }


      if(!nextSuperset) {
        supersetParent.querySelector(".supersetparent img").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/64e71cc5a1339301140b4110_closed_superset.webp";
      } else if(nextSuperset && !nextSuperset.classList.contains("supersetWrapper")) {
        supersetParent.querySelector(".supersetparent img").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/64e71cc5a1339301140b4110_closed_superset.webp";
      }

        

      
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
        if(window.innerWidth <= 991) {
          wrapper.style.width = '100%';
        } else {
          wrapper.style.width = '90%';
        }
        
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

        const elements = newDiv.querySelectorAll(".supersetparent");
        elements.forEach(element => {
          element.style.marginRight = "22px";
        });

      } else if(nextSibling && nextSibling.querySelector(".exercise-list-item-superset")) {
        //Now check if next element is in a superset
        supersetParent.querySelector(".exercisegroup").style.border = 'none';
        supersetParent.querySelector(".supersetparent").style.marginRight = "22px";
        nextSibling.querySelector(".supersetparent").style.marginRight = "22px";
        supersetParent.querySelector("#navigationButtons").style.display = 'none';
        nextSibling.querySelector(".exercise-list-item-superset").insertBefore(supersetParent, nextSibling.querySelector(".exercise-list-item-superset").firstChild);

      } else if(previousSibling && supersetParent) {

        if(nextSibling == null) {
          
          nextSibling = supersetParent.closest(".exercise-list-item-superset");
          nextSibling.querySelector(".supersetparent").style.marginRight = "22px";
          if(nextSibling && nextSibling.parentElement && nextSibling.querySelector(".supersetWrapper")) {
          } else {
            //Now check if current element is in a superset
            if(!nextSuperset) {
              supersetParent = previousSibling.parentElement.nextElementSibling;
              supersetParent.style.width = "100%";
              supersetParent.querySelector(".exercisegroup").style.border = 'none';
              if(supersetParent.querySelector("#navigationButtons")) {
                supersetParent.querySelector("#navigationButtons").style.display = 'none';
              }
            } else if(nextSuperset && !nextSuperset.classList.contains("supersetWrapper")) {
              supersetParent = previousSibling.parentElement.nextElementSibling;
              supersetParent.style.width = "100%";
              supersetParent.querySelector(".exercisegroup").style.border = 'none';
              if(supersetParent.querySelector("#navigationButtons")) {
                supersetParent.querySelector("#navigationButtons").style.display = 'none';
              }
            }


            previousSibling.appendChild(supersetParent);
          }
        }

      }


      if(!nextSuperset) {
        //Remove supersetimageopen class
        supersetParent.querySelector(".supersetparent").style.marginRight = "22px";
        supersetImage.classList.remove("supersetimageopen");
        supersetImage.classList.add("supersetimageclosed");
        if(supersetParent.querySelector("#removeFullExercise")) {
          supersetParent.querySelector("#removeFullExercise").style.display = "none";
        }
    
      } else if(nextSuperset && !nextSuperset.classList.contains("supersetWrapper")) {
        //Remove supersetimageopen class
        supersetParent.querySelector(".supersetparent").style.marginRight = "22px";
        supersetImage.classList.remove("supersetimageopen");
        supersetImage.classList.add("supersetimageclosed");
        if(supersetParent.querySelector("#removeFullExercise")) {
          supersetParent.querySelector("#removeFullExercise").style.display = "none";
        }
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
          exercise.querySelector("#removeFullExercise").style.display = "";
          workoutList.insertBefore(exercise, supersetParent.nextSibling);
          if(exercise.nextSibling != null) {
            exercise.querySelector(".supersetparent").style.display = "block";
            exercise.querySelector(".supersetparent").style.marginRight = "";
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
        supersetItem.querySelector(".supersetparent").style.marginRight = "";
        supersetItem.querySelector("#navigationButtons").style.display = "";
        supersetItem.querySelector("#removeFullExercise").style.display = "";
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

    // Change the border color
    guideExercise.style.borderColor = "#CBCBCB";
    document.getElementById("workoutInput").style.color = "black";

    // Set a timeout to revert the border color after 0.5 seconds (500 milliseconds)
    setTimeout(function() {
        guideExercise.style.borderColor = "#6D6D6F";
        document.getElementById("workoutInput").style.color = "";
    }, 100);

  }

  // JavaScript function to prevent form submission on Enter key press
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && event.target.id != "richTextEditor") {
      event.preventDefault(); // Prevent form submission
    }
  });

  const svgPerson = document.getElementById("ajaxContent");
  const guideList = document.getElementById("guideListParent");
  const clickExerciseText = document.getElementById("clickExerciseText");
  const backButton = document.getElementById("clearText");
  const searchBar = document.getElementById("searchBarParent");
  //If search box changes, show list and hide svg man:
  const searchBox = document.getElementById("exerciseSearch");
  searchBox.oninput = function() {
    if(searchBox.value != "") {
      svgPerson.style.display = 'none';
      setTimeout(() => {
        guideList.style.display = 'block';
      }, 150); // 50ms delay
      clickExerciseText.style.display = 'block';
      backButton.style.display = 'block';
      searchBar.style.borderColor = "#6D6D6F";
    } else {
      svgPerson.style.display = 'block';
      guideList.style.display = 'none';
      clickExerciseText.style.display = 'none';
      backButton.style.display = 'none';
      searchBar.style.borderColor = "";
      resetFilters(true);
    }
  }

  //Catching mouse over and out events for showing the thumbnail and svg person
  document.addEventListener('mouseover', function (event) {

    if(event.target.closest("#guidePlaceHolder") && !event.target.closest("#modalWrapper")) {
      //Dont show remove button if in superset
      if(window.innerWidth > 991 && event.target.closest("#guidePlaceHolder").querySelector("#removeFullExercise") && !event.target.closest(".exercise-list-item-superset")) {
        event.target.closest("#guidePlaceHolder").querySelector("#removeFullExercise").style.display = "block";
      } else {
        event.target.closest("#guidePlaceHolder").querySelector("#removeFullExercise").style.display = "none";
      }
      
    }

    if(window.innerWidth > 991 && event.target.closest(".exercise-details-parent") && event.target.closest("#workoutList")) {

      event.target.closest(".exercise-details-parent").querySelector(".remove-set").style.display = "block";
    }
  });

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
  });

  document.getElementById("submitWorkoutBuilderForm").onclick = function(event) {

    var workoutBuilderForm = document.getElementById("workoutBuilderForm");

    //Ensure all fields are filled in
    if (workoutBuilderForm.checkValidity()) {

      var workout = {};

      //Obtain form data
      workout["name"] = document.getElementById("workoutName").value;

      workout["workoutFullName"] = document.getElementById("workoutName").value;
      workout["listOfExercises"] = [];
      workout["exerciseIDs"] = [];
      workout["exerciseSlugs"] = [];
      workout["muscleGroups"] = [];
      workout["gymName"] = "train like me";

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
      document.getElementById("saveWorkout").value = "Please wait...";

      sendWorkoutToMake(workout);      
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

      },
    ]);
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

  function sendLinkInEmail(sendToEmail, workoutLink) {

    fetch("https://hook.us1.make.com/sb2giobvxn4r4yeec6ekzxw5vluv5oy5", {
      method: "POST",
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({'sendToEmail': sendToEmail, 'workoutLink': workoutLink})
    });
  }

  //Send workout object to make 
  async function sendWorkoutToMake(workout) {

    fetch("https://hook.us1.make.com/hxz8vme3ugy8uts8xqm7w4o1dc4tpt8r", {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(workout)
      }).then(res => {

        //Show modal
        if (res.ok) {
          return res.text();
        }
        throw new Error('Something went wrong');

      }).then((data) => {
        
        //Show modal
        document.getElementById("tlmModal").style.display = "flex";

        //Add visible class
        var modalChild = document.getElementById("modalChild");

        // Force reflow to ensure transition works
        void modalChild.offsetHeight;

        modalChild.classList.add("visible");

        //Populate field
        document.getElementById("workoutLink").value = data;

        //Disable workout link
        document.getElementById("workoutLink").disabled = true;

        
      })
      .catch((error) => {
        console.log(error);
        alert("Could not create workout, please try again");
        
        location.reload();
      });

  }

  async function resetGeneralFilters(clearButton=false) {
      
    const checkboxes = document.getElementsByClassName('filter-checkbox');
    for (let i = 0; i < checkboxes.length; i++) { 
      if(checkboxes[i].classList.value.includes('w--redirected-checked')) {
        checkboxes[i].click();
      }
    }

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
            filterInstances[i].resetFilters(filterKeys=["workoutmodalname"], null);
          } else if(filterInstances[i].form.id == "programFormModal") {
            await filterInstances[i].resetFilters(filterKeys=["programname-5"], null);
          }
        }

      },
    ]);

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
        guideToWorkoutObj[guide][0].style.borderColor = "#cbcbcb";
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

  document.getElementById('mobileWorkoutName').addEventListener('input', function() {
    document.getElementById('workoutName').value = this.value;
  });

  // Select the input element by its class or ID
  const workoutInput = document.querySelector('#mobileWorkoutName');

  // Add an event listener for focus
  workoutInput.addEventListener('focus', () => {
    workoutInput.placeholder = ''; // Remove the placeholder on focus
  });

  // Add an event listener for blur (when the input loses focus)
  workoutInput.addEventListener('blur', () => {
    workoutInput.placeholder = 'Workout Name'; // Restore the placeholder when focus is lost
  });

  //Listen for click events specifically for in paste state when clicking on cells
  //Otherwise if in paste state and not clicked on a day cancel paste state
  //Click listener
  document.addEventListener('click', function(event) {

    if(event.target.id == "saveWorkout") {
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
      
    }

    if(event.target.id == "tlmModal" || event.target.id == "closeModal") {
      document.getElementById("tlmModal").style.display = "none";
      document.getElementById("saveWorkout").value = "Share Workout";
    }

    if(event.target.id == "removeExercise") {
      //Check that there is one left
      if(event.target.closest("#setRepInfoParent")) {
        if(event.target.closest("#setRepInfoParent").querySelectorAll("#exerciseInfo").length >= 2) {
          event.target.closest("#exerciseInfo").remove();
        }
        
      }
    }

    if(event.target.id == "sendEmail") {

      //Get workout link:
      var workoutLink = document.getElementById("workoutLink").value;
      //Send To Email

      var sendEmailTextBox = document.getElementById("sendToEmail")
      var sendToEmail = sendEmailTextBox.value;

      var sentText = document.getElementById("copiedSendText")

      // Check validity of the email input
      if (sendEmailTextBox.reportValidity()) {
        // If valid, proceed with sending the email
        sentText.style.display = "block";

        // Hide the "copied" message after 2 seconds
        setTimeout(function() {
          sentText.style.display = "none";
        }, 1500);
        sendLinkInEmail(sendToEmail, workoutLink);
      }
    }

    if(event.target.id == "copyWorkoutLink") {

      //Put in clipboard
      navigator.clipboard.writeText(document.getElementById("workoutLink").value);

      var copiedText = document.getElementById("copiedText");
      copiedText.style.display = "block";

      // Hide the "copied" message after 2 seconds
      setTimeout(function() {
          copiedText.style.display = "none";
      }, 1000);

    }

    if(!event.target.closest(".search-filters-parent") && document.getElementById("searchFilterImg").classList.contains("filtericonclicked")) {
      document.getElementById("searchFilterImg").click();
      document.getElementById("clearTextImage").click();

    }

    if(event.target.closest("#individualGuide")) {

      //Make sure when info button is clicked the exercise isnt added to the list
      if(event.target.id != "guideLinkInfo" && event.target.id != "guideLinkInfoImage") {
        event.target.closest("#individualGuide").style.borderColor = "rgb(109, 109, 111)";

        var copyOfGuide = event.target.closest("#individualGuide").cloneNode(true);
        
        //Remove info button
        copyOfGuide.querySelector("#guideLinkInfo").style.display = "none";
  
        //Copy thumbnail and svg person into a separate div
        var exerciseThumbnail = $(copyOfGuide).find("#exerciseThumbnail").detach();

        //Change ID of exercise name
        copyOfGuide.querySelector("#guideName").id = "workoutExercisename";
  
        //Ensure copy border colour is grey
        copyOfGuide.style.borderColor = "rgb(109, 109, 111)";

        //Remove shadow
        copyOfGuide.style.boxShadow = "none";

        addExerciseToWorkoutList(copyOfGuide, null, null, null, null);

        createWorkoutListEntry(copyOfGuide.querySelector("#itemID").innerText, event.target.closest("#individualGuide"));

        //Update workout input text
        numberOfExercisesInList += 1;
        document.getElementById("workoutInput").innerText = `Workout (${numberOfExercisesInList})`;

      }
    }

    if(event.target.id == "machine-parent") {
      document.getElementById("pin-checkbox").click();
      document.getElementById("plate-checkbox").click();
    }

    if(event.target.id == "searchFilterImg" || event.target.id == "exerciseSearchFilterImg") { 

      //Check if clicked or not
      if(event.target.classList.contains("filtericon")) {
        //Not clicked - change to filled
        event.target.classList.remove("filtericon");
        event.target.classList.add("filtericonclicked");
      } else {
        event.target.classList.add("filtericon");
        event.target.classList.remove("filtericonclicked");
      }
    
    }

    if (event.target.nodeName == "path") {

      var muscleFilter = sessionStorage.getItem("muscleFilter");

      //Ensure muscle filter exists
      if(muscleFilter && muscleFilter != "") {
        muscleFilter = muscleFilter.replaceAll(" ", "-");

        // hide SVG man:
        svgPerson.style.display = 'none';

        setTimeout(() => {
          guideList.style.display = 'block';
        }, 150); // 50ms delay

        clickExerciseText.style.display = 'block';
        backButton.style.display = 'block';

        document.getElementById("exerciseSearch").value = muscleMapping[muscleFilter];
        document.getElementById("exerciseSearch").dispatchEvent(new Event('input', { bubbles: true }));
      }
      //Reset storage filter for next click
      sessionStorage.setItem("muscleFilter", "");
      
    }

    if(event.target.closest("#clearText")) {
      svgPerson.style.display = 'block';
      guideList.style.display = 'none';
      clickExerciseText.style.display = 'none';
      backButton.style.display = 'none';
      resetFilters();
    }

    if(event.target.id == "removeSetMobile") {
      var previousExerciseInfo = event.target.closest(".div-block-501").previousSibling;
      if(previousExerciseInfo.id == "exerciseInfo") {
        previousExerciseInfo.querySelector("#removeExercise").click();
      }
    }

    if(event.target.closest(".addset") || event.target.id == "addSetMobile") {

      if(event.target.closest(".exercise-list-item-superset")) {
        const exercisesInSuperset = event.target.closest(".exercise-list-item-superset").querySelectorAll(".exercise-list-item");
        for(var i = 0; i < exercisesInSuperset.length; i++) {
          handleAddSet(exercisesInSuperset[i].querySelector(".addset"));
        }
      } else {
        handleAddSet(event.target);
      }

      if(event.target.id == "addSetMobile") {
        event.target.closest("#setRepInfoParent").querySelector("#removeSetMobile").style.display = "block";
        event.target.closest("#setRepInfoParent").querySelector("#removeExerciseMobile").style.display = "none";
      }


    }

    if(event.target.id == "removeFullExercise" || event.target.id == "removeExerciseMobile") {
        
      const workoutList = document.getElementById("workoutList");
      const removedElement = workoutList.removeChild(event.target.closest(".exercise-list-item"));
      
      const listLength = workoutList.childNodes.length;
      const saveWorkout = document.getElementById("saveWorkout");
      
      if (listLength == 1) {
        document.getElementById("firstExercisePlaceholder").style.display = "block";
        document.getElementById("workoutList").style.display = "none";
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
        result.style.borderColor = "#cbcbcb"
      }

      //Update workout input text
      numberOfExercisesInList -= 1;
      if(numberOfExercisesInList > 0) {
        document.getElementById("workoutInput").innerText = `Workout (${numberOfExercisesInList})`;
      } else {
        document.getElementById("workoutInput").innerText = `Workout`;
      }
    
    }


    if(event.target.id == "clearExperienceExerciseFilters") {

      document.getElementById("searchFilterImg").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/65a20d9f411a1103276ef909_filter.webp";
      resetGeneralFilters();
      document.getElementById("clearTextImage").click();
      
    }
    
  });

   //Listen for change events:
   document.addEventListener('change', function (event) {

    if(event.target.id == "quantityUnit") {
      if(event.target.value.toLowerCase() == "amrap" ) {
        //Hide reps input
        event.target.closest("#exerciseInfo").querySelector("#repsInput").value = "";
        event.target.closest("#exerciseInfo").querySelector("#repsInput").style.display = "none";
        event.target.closest("#exerciseInfo").querySelector("#repsInput").required = false;
        //Change AMRAP width:
        event.target.closest("#exerciseInfo").querySelector("#quantityUnit").style.width = "90px";
      } else {
        event.target.closest("#exerciseInfo").querySelector("#repsInput").style.display = "flex";
        event.target.closest("#exerciseInfo").querySelector("#repsInput").required = true;  
        event.target.closest("#exerciseInfo").querySelector("#quantityUnit").style.width = "65px";
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

      //Check if changed to lbs
      if(event.target.value.toLowerCase() == "lbs") {

        const measureInputs = document.querySelectorAll('#measureInput');

        measureInputs.forEach(input => {
          if (input.value.toLowerCase() === 'kg') {
            input.value = 'Lbs';
          }
        });

      } else if(event.target.value.toLowerCase() == "kg") {
        const measureInputs = document.querySelectorAll('#measureInput');

        measureInputs.forEach(input => {
          if (input.value.toLowerCase() === 'lbs') {
            input.value = 'Kg';
          }
        });
      }

    }

    if (event.target.type) {
      checkCheckboxFilters().then(res => { 
        if (res["workoutBuilderForm"] !== undefined) {
          if (res["workoutBuilderForm"] > 0) {
            document.getElementById("searchFilterImg").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/668d17c04c0f7acb2b57aa05_Union.webp";
            
            document.getElementById("clearExperienceExerciseFilters").style.display = "block";
            //document.getElementById("filterOnIpad").style.display = "block";
            //document.getElementById("reset-filters-ipad").style.display = "block";
          } else {
            document.getElementById("searchFilterImg").src = "https://uploads-ssl.webflow.com/627e2ab6087a8112f74f4ec5/65a20d9f411a1103276ef909_filter.webp";
            //document.getElementById("filterOnIpad").style.display = "none";
            //document.getElementById("reset-filters-ipad").style.display = "none";
          }

        } 
      });
    }
  });

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

}
