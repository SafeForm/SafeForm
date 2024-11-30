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
  sessionStorage.setItem("numberOfGuides", 0);
  sessionStorage.setItem("onlyFinish", "false");
  var currentSwappedExercise = "";
  var currentSwappedExerciseID = "";
  var swappingExerciseID = "";
  let activeTimer = null; // Track the active timer
  let activeRestDiv = null; // Track the active restDiv
  let remainingTime = null; // Track the remaining time for the active timer
  monitorUserActivity()

  var guideLinks = document.querySelectorAll("#guideLink");

  for(var i = 0; i < guideLinks.length; i++) {
    var exerciseID = guideLinks[i].closest("#inputSectionBlock").querySelector("#exerciseItemID").innerText;

    //Get JSON
    var similarExerciseJSON = guideLinks[i].closest("#inputSectionBlock").querySelector("#similarExerciseJSON").innerText;
    getSimilarExercise(guideLinks[i].href, exerciseID, similarExerciseJSON);
  }

  var similarButtons = document.querySelectorAll("#swapExercise");
  for (var i = 0; i < similarButtons.length; i++) {
    //similarButtons[i].style.display = "block";
    similarButtons[i].onclick = (event) => {

      document.body.style.overflow = "hidden";

      var parentDiv = document.getElementById("similarExercisesParent");
      var bodyDiv = document.getElementById("similarExercisesBody");
      
      //Grab list based on exerciseID and place in similar exercise drawer component
      var exerciseID = event.target.closest("#inputSectionBlock").querySelector("#originalExerciseItemID").innerText;
      currentSwappedExercise = event.target.closest("#inputSectionBlock").querySelector("#exerciseShortNameInput").innerText;
      //currentSwappedExerciseID = event.target.closest("#inputSectionBlock").querySelector("#exerciseItemID").innerText;
      currentSwappedExerciseID = exerciseID;
      var similarExerciseList = document.querySelector(`[similarexerciselist="${exerciseID}"`);

      if(similarExerciseList) {
        similarExerciseList.style.display = "flex";
        document.getElementById("similarExerciseListParent").append(similarExerciseList);
      }

      parentDiv.style.display = "flex";
      
      // Force reflow to ensure transition works
      void bodyDiv.offsetHeight;
  
      bodyDiv.classList.add("visible");
    }
  }

  document.getElementById("similarExercisesParent").onclick = (event) => {
    document.body.style.overflow = "";
    if (event.target.id === "similarExercisesParent") {
      var bodyDiv = document.getElementById("similarExercisesBody");
  
      bodyDiv.classList.remove("visible");

      //Check if there is a list in there and put it back to the parent div list
      if(bodyDiv.querySelector("#realSimilarExerciseList")) {
        //Grab and put it back to the other parent div
        document.querySelector("#similarExerciseLists").append(bodyDiv.querySelector("#realSimilarExerciseList"))
      }
      // Add an event listener for transition end
      bodyDiv.addEventListener('transitionend', function handler() {
        // Remove the event listener once it has been executed
        bodyDiv.removeEventListener('transitionend', handler);
  
        // Now hide the parent div
        event.target.style.display = "none";
      });

      //Hide select buttons
      document.getElementById("selectSwapExerciseParent").style.display = "none";
    }
  }

  //Add workout flag to guide links
  var exerciseLinks = document.querySelectorAll("#exerciseInfo, #guideLink");
  for(var i = 0; i < exerciseLinks.length; i++) {
    exerciseLinks[i].href += "?isWorkout=true";
  }

  //Hide the first exercise breaker of the exercise list
  var exerciseList = document.getElementById("listOfExercises").children;

  var utm_campaign = document.getElementById("utm_campaign").innerText;
  const urlParams = new URLSearchParams(window.location.search);
  var fromProgram = false;
  if(urlParams.has("fromProgram")) {
    fromProgram = true;
  }
  var fromFreeProgram = false;
  if(urlParams.has("fromFreeProgram")) {
    fromFreeProgram = true;
  }
  var fromChallenge = false;
  if(urlParams.has("fromChallenge")) {
    fromChallenge = true;
  }

  //Add inputs for each exercise based on number of sets
  const inputList = document.querySelectorAll("#inputList .w-dyn-item");

  //Get and filter down full program to this exact workout  
  var currentProgram = null;
  if(sessionStorage.getItem("currentFullProgram") != "" && sessionStorage.getItem("currentFullProgram") != null && sessionStorage.getItem("currentFullProgram") != undefined) {
    currentProgram = JSON.parse(sessionStorage.getItem("currentFullProgram"));
  }
  
  weekToFilter = "";
  workoutName = "";
  fullWorkoutID = "";
  weekWorkouts = "";
  currentWorkoutIndex = "";
  workoutInformation = "";
  var loadUnit = "kg";

  var uniqueWorkoutID = sessionStorage.getItem("currentWorkout");

  if(uniqueWorkoutID) {
    uniqueWorkoutID = uniqueWorkoutID.split("+");
    if(uniqueWorkoutID.length > 0) {
      uniqueWorkoutID = uniqueWorkoutID[0]
    } else {
      uniqueWorkoutID = null;
    }
  }

  if(uniqueWorkoutID && localStorage.getItem("startedWorkout") == uniqueWorkoutID) {
    document.getElementById("startWorkout").innerText = "Continue Workout";
  }

  if((fromChallenge || fromProgram) && currentProgram != undefined && currentProgram != null) {
    weekToFilter = "Week " + sessionStorage.getItem("currentWeekNumber");

    workoutName = document.querySelector(".workout-summary-header h1").innerText;
    fullWorkoutID = document.getElementById("workoutItemID").innerText; 
    weekWorkouts = currentProgram.filter(item => item.week === weekToFilter);
    if(weekWorkouts.length == 0) {
      weekWorkouts = currentProgram
    }
    currentWorkoutIndex = sessionStorage.getItem("workoutIndex");
    var isWorkoutNumberInt = false;
    weekWorkouts.forEach(function(weekWorkout) {
      if(typeof weekWorkout.workoutNumber == 'number') {
        isWorkoutNumberInt = true;
      }
    });
    
    if(isWorkoutNumberInt) {

      //First try filter with workout ID
      if(uniqueWorkoutID) {
        workoutInformation = weekWorkouts.filter(item => item.uniqueWorkoutID == uniqueWorkoutID);
      } else {
        workoutInformation = weekWorkouts.filter(item => item.workoutID == fullWorkoutID);
      }

      if(workoutInformation.length == 0) {
        //If not then filter with workout name
        workoutInformation = weekWorkouts.filter(item => item.workoutName == workoutName);
      }
    } else {
      if(fromChallenge) {
        workoutInformation = weekWorkouts.filter(item => item.extendedProps.workoutID == fullWorkoutID);
      } else {

        if(uniqueWorkoutID) {
          workoutInformation = weekWorkouts.filter(item => item.uniqueWorkoutID == uniqueWorkoutID);
        } else {
          workoutInformation = weekWorkouts.filter(item => item.workoutID == fullWorkoutID);
        }

      }
      
      if(workoutInformation.length == 0) {
        workoutInformation = weekWorkouts.filter(item => item.workoutName == workoutName);
      }

    }

  } 

  MemberStack.onReady.then(async function(member) {  
    var metadata = null;

    if(member.loggedIn) {
      metadata = await member.getMetaData();
    }
    
    var thisWorkoutID = sessionStorage.getItem("currentWorkout");

    if(thisWorkoutID) {
      thisWorkoutID = thisWorkoutID.split("+");
      if(thisWorkoutID.length > 0) {
        thisWorkoutID = thisWorkoutID[0];
      }
      //Check for any exercise IDs that need to be swapped
      if(metadata[thisWorkoutID]) {
        swapInitialLoadExercises(metadata[thisWorkoutID], "workout");
      } else {
        swapInitialLoadExercises(metadata, "program");
      }
    } else {
      thisWorkoutID = document.getElementById("workoutItemID").innerText;
    }
    
    if(member.loggedIn && member.memberPage) {
      document.getElementById("home").href = window.location.origin + `/${member.memberPage}`;
    }
    
    var currentProgram = {
      [sessionStorage.getItem("programID")]: sessionStorage.getItem("currentWeekNumber"),
      ["currentProgram"]: sessionStorage.getItem("programID")
    }
    
    if(member.loggedIn) {
      await member.updateMetaData(currentProgram);
    }
    
    //Get load measurement unit
    if(member.loggedIn && member.weightunit) {
      loadUnit = member.weightunit;
    }

    if(!loadUnit && localStorage.getItem("weightUnit")) {
      loadUnit = localStorage.getItem("weightUnit");
    } 
    
    var duplicateExercises = [];
    //Iterate through existing exercise list and change names
    for(var i = 0; i < inputList.length; i++) {
      var exerciseName = inputList[i].querySelector("#exerciseShortNameInput").innerText;
      var exerciseID = inputList[i].querySelector("#exerciseItemID").innerText;
      
      for (const exercise of workoutInformation) {

        if(exercise.guideID && exercise.guideID == exerciseID) {

          if(!duplicateExercises.includes(exercise.exercise)) {
            inputList[i].querySelector("#exerciseShortNameInput").innerText = exercise.exercise;
            duplicateExercises.push(exercise.exercise)
            break;
          }

        } else if(exercise.title && exercise.title.includes(exerciseName)) {
          inputList[i].querySelector("#exerciseShortNameInput").innerText = exercise.title;
          break;
        }
      }
    }

    var memberJSON = {};
    if(member.loggedIn) {
      memberJSON = await member.getMetaData();
    }
    
    for(var i = 0; i < inputList.length; i++) {
      var inputGuideID = inputList[i].querySelector("#originalExerciseItemID").innerText;
      var exerciseFullName = inputList[i].querySelector("#exerciseShortNameInput").innerText;

      var exerciseInformation = [];
      
      if(!workoutInformation || workoutInformation.length == 0 || fromChallenge) {

        if(fromChallenge) {
          const formattedArray = [].concat(...workoutInformation[0].workoutJSON);
          var flattenedArray = [];
          formattedArray.forEach((exercise) => {
            if(exercise.guideID) {
              flattenedArray.push(exercise);
            } else {
              var subExerciseList = Object.values(exercise)[0];
        
              subExerciseList.forEach((subExercise) => {
                flattenedArray.push(subExercise);
              });
            }
          });
          exerciseInformation = flattenedArray.filter(item => item.guideID && item.guideID.includes(inputGuideID));
        } else {
          const newWorkoutInformation = JSON.parse(document.getElementById("workoutJSON").innerText);
          const flatWorkoutInformation = newWorkoutInformation.flat(); // Flatten the nested arrays
          flatWorkoutInformation.forEach((exercise) => {

            //Check the format
            if(exercise.guideID && exercise.guideID.includes(inputGuideID)) {
              exerciseInformation.push(exercise)
            } else if(!exercise.guideID) {

              var exerciseInfo = Object.values(exercise)[0];
              exerciseInfo.forEach((subExercise) => {
                if(subExercise.guideID && subExercise.guideID.includes(inputGuideID)) {
                  exerciseInformation.push(subExercise)
                }
              })
            }

          });
        }

        const newArray = [];
        var exerciseInformationIndex = 0;
        if(exerciseInformation.length > 0 && i < exerciseInformation.length) {
          exerciseInformationIndex = i;
        }
        // Iterate over exercises array and construct new objects
        exerciseInformation[exerciseInformationIndex].exercises.forEach((exercise, index) => {
          newArray.push({
            "exercise": exerciseInformation[exerciseInformationIndex]?.exerciseName ?? "",
            "reps": exercise?.reps ?? "",
            "load": exercise?.measure || "Kg",  // Default to "Kg" if measure is missing or empty
            "loadAmount": exercise?.loadAmount ?? "",
            "exerciseRestMinutes": exercise?.exerciseRestMinutes === "" ? "0" : (exercise?.exerciseRestMinutes ?? "0"),
            "exerciseRestSeconds": exercise?.exerciseRestSeconds === "" ? "0" : (exercise?.exerciseRestSeconds ?? "0"),
            "quantityUnit": exercise?.quantityUnit ?? "",
            "notes": exerciseInformation[exerciseInformationIndex]?.exerciseNotes ?? "",
            "setNumber": index,
            "guideID": exerciseInformation[exerciseInformationIndex]?.guideID ?? "",
            "uniqueWorkoutID": exerciseInformation[exerciseInformationIndex]?.uniqueWorkoutID ?? ""
          });
        });

        exerciseInformation = newArray
      } else {
        exerciseInformation = workoutInformation.filter(item => item.guideID && item.guideID.includes(inputGuideID) && item.exercise == exerciseFullName);
      }

      //Get number of sets for that exercise

      var numberOfSets = exerciseInformation.length;
      if(numberOfSets == 0) {
        numberOfSets = 3;
      }

      //Get rest info for that exercise
      const restDiv = inputList[i].querySelector(".exercise-info-input");
      var newRestDiv = restDiv.cloneNode(true);
      newRestDiv.style.display = "flex";

      //Get input section for cloning
      const inputSectionPlaceholder = inputList[i].querySelector("#inputSection");
      var exerciseInputSection = inputList[i].querySelector("#inputSectionBlock");
      const exerciseName = exerciseInputSection.querySelector("#exerciseNameInput").innerText;
      const exerciseID = exerciseInputSection.querySelector("#exerciseItemID").innerText;
      var weightInput = exerciseInputSection.querySelector("#weight");
      var repsInput = exerciseInputSection.querySelector("#reps");
      
      const newExerciseInformation = exerciseInformation;

      //Check if it is an empty filler exercise from god mode:
      if(exerciseInformation.length > 0 && exerciseInformation[0].exercise != "") {

        weightInput.addEventListener('blur', function(event) {

          const inputValue = event.target.value;

          if((event.target.placeholder.toLowerCase() == "kg/lbs" || event.target.placeholder.toLowerCase().includes(loadUnit)) && !event.target.value.toLowerCase().includes(loadUnit.toLowerCase()) && event.target.value != "") {
            event.target.value = `${inputValue}`;
          } else if(event.target.placeholder.toLowerCase().includes("rpe") && !event.target.value.toLowerCase().includes("rpe")) {
            event.target.value = `RPE ${inputValue}`;
          } else if(event.target.placeholder.toLowerCase().includes("rir") && !event.target.value.toLowerCase().includes("rir")) {  
            event.target.value = `${inputValue} RIR`;
          } else if(event.target.placeholder.toLowerCase().includes("%1rm") && !event.target.value.toLowerCase().includes("%1rm")) {
            event.target.value = `${inputValue} %1RM`;
          } else if(event.target.placeholder.toLowerCase().includes("zone") && !event.target.value.toLowerCase().includes("zone")) {
            event.target.value = `Zone ${inputValue}`;
          }

          const exerciseBlock = event.target.closest("#inputSectionBlock");
          const exerciseName = exerciseBlock.querySelector("#exerciseNameInput");
          const exerciseID = exerciseBlock.querySelector("#exerciseItemID");
          var allWeightInputs = event.target.closest("#inputSectionBlock").querySelectorAll("#weight");
          allWeightInputs = getTextboxValue(allWeightInputs);
          updateExerciseDetails(exerciseID.innerText, exerciseName.innerText, allWeightInputs, 0, "weight");

          //Check if reps also has a value then auto complete set
          const updatedRepsInput = exerciseBlock.querySelector("#reps");
          if(updatedRepsInput.value != "") {
            exerciseBlock.querySelector("#completeExercise").click();
          }

        });

        repsInput.addEventListener('blur', function(event) {
          const inputValue = event.target.value;

          if(event.target.placeholder.toLowerCase().includes("km") && !event.target.value.toLowerCase().includes("km")) {  
            event.target.value = `${inputValue} km`;
          } else if(event.target.placeholder.toLowerCase().includes("mi") && !event.target.value.toLowerCase().includes("mi")) {  
            event.target.value = `${inputValue} mi`;
          } else if(event.target.placeholder.toLowerCase().includes("secs") && !event.target.value.toLowerCase().includes("secs")) {  
            event.target.value = `${inputValue} secs`;
          } else if(event.target.placeholder.toLowerCase().includes("reps") && !event.target.value.toLowerCase().includes("reps")) {  
            event.target.value = `${inputValue} reps`;
          } else if(event.target.placeholder.toLowerCase().includes("emom") && !event.target.value.toLowerCase().includes("emom")) {  
            event.target.value = `${inputValue} emom`;
          }
          else if(event.target.placeholder.toLowerCase().includes("amrap") && !event.target.value.toLowerCase().includes("amrap")) {  
            event.target.value = `${inputValue}`;
          }
          var allRepInputs = event.target.closest("#inputSectionBlock").querySelectorAll("#reps");
          allRepInputs = getTextboxValue(allRepInputs);

          const exerciseBlock = event.target.closest("#inputSectionBlock");
          const exerciseName = exerciseBlock.querySelector("#exerciseNameInput");
          const exerciseID = exerciseBlock.querySelector("#exerciseItemID");

          updateExerciseDetails(exerciseID.innerText, exerciseName.innerText, allRepInputs, 0, "reps");
          //Check if weight also has a value then auto complete set
          const updatedWeightInput = exerciseBlock.querySelector("#weight");
          if(updatedWeightInput != "") {
            exerciseBlock.querySelector("#completeExercise").click();
          }
        });

        //Set placeholder of the first rep input text box for each exercise
        if(exerciseInformation[0].quantityUnit.toLowerCase() == "amrap") {
          inputList[i].querySelector("#reps").placeholder = `${exerciseInformation[0].quantityUnit}`;
        } else {
          inputList[i].querySelector("#reps").placeholder = `${exerciseInformation[0].reps} ${exerciseInformation[0].quantityUnit}`;
        }

        //Set value of notes
        inputList[i].querySelector("#notes").innerText = `${exerciseInformation[0].notes}`;
        //Check if load has inputs from PT
        if(exerciseInformation[0].loadAmount.toLowerCase() != "") {

          if(exerciseInformation[0].load.toLowerCase() == loadUnit.toLowerCase()) {
            inputList[i].querySelector("#weight").placeholder = `${exerciseInformation[0].loadAmount} ${exerciseInformation[0].load.toLowerCase()}`;
            document.querySelectorAll("#load")[i].innerText = `${exerciseInformation[0].loadAmount} ${exerciseInformation[0].load.toLowerCase()}`;
          } else {
            if(exerciseInformation[0].load.toLowerCase() == "%1rm") {
              inputList[i].querySelector("#weight").placeholder = `${exerciseInformation[0].loadAmount} ${exerciseInformation[0].load}`;
            } else if(exerciseInformation[0].load.toLowerCase() == "kg") {
              //We need to convert from lbs to kg
              inputList[i].querySelector("#weight").placeholder = `${lbsToKg(exerciseInformation[0].loadAmount)} ${loadUnit}`;
              document.querySelectorAll("#load")[i].innerText = `${lbsToKg(exerciseInformation[0].loadAmount)} ${loadUnit}`;
            } else if(exerciseInformation[0].load.toLowerCase() == "lbs") {
              inputList[i].querySelector("#weight").placeholder = `${kgToLbs(exerciseInformation[0].loadAmount)} ${loadUnit}`;
              document.querySelectorAll("#load")[i].innerText = `${kgToLbs(exerciseInformation[0].loadAmount)} ${loadUnit}`;
            } else {
              inputList[i].querySelector("#weight").placeholder = `${exerciseInformation[0].load} ${exerciseInformation[0].loadAmount}`;
              document.querySelectorAll("#load")[i].innerText = `${exerciseInformation[0].load} ${exerciseInformation[0].loadAmount}`;
            }
          }
        }

        var memberJSONExerciseName = memberJSON[exerciseID];
        if(memberJSONExerciseName == undefined) {
          memberJSONExerciseName = memberJSON[exerciseName];
        }

        const summaryWeightLoad = document.querySelectorAll("#load");

        if(memberJSONExerciseName != undefined) {

          var workoutKeys = Object.keys(memberJSONExerciseName.workouts);
          var foundKey = workoutKeys.find(key => key == uniqueWorkoutID);
          var numberOfSetsComplete = memberJSONExerciseName.workouts[foundKey];

          if(numberOfSetsComplete != undefined && numberOfSetsComplete > 0) {
            exerciseInputSection.querySelector("#completeExercise").classList.add("pre-complete");
          }
          
          if(memberJSONExerciseName.weight != undefined) {
            
            if(i < summaryWeightLoad.length && summaryWeightLoad[i].innerText.toLowerCase() != "bodyweight" && memberJSONExerciseName.weight[0] && memberJSONExerciseName.weight[0] != "") {

              if(exerciseInformation[0].load.toLowerCase() == loadUnit.toLowerCase()) {
                document.querySelectorAll("#load")[i].innerText = `${memberJSONExerciseName.weight[0]} ${exerciseInformation[0].load}`;
              } else {
                document.querySelectorAll("#load")[i].innerText = `${memberJSONExerciseName.weight[0]} ${loadUnit}`;
              }
            } 

            //If text is still just load amount - then hide
            if(i < summaryWeightLoad.length && summaryWeightLoad[i].innerText.toLowerCase() != "bodyweight" && summaryWeightLoad[i].innerText.toLowerCase() != "band" && summaryWeightLoad[i].innerText.toLowerCase() == exerciseInformation[0].load.toLowerCase()) {
              document.querySelectorAll("#load")[i].parentElement.style.display = "none";
            }

            //Inputting in the first weight text box
            var arrayLength = memberJSONExerciseName.weight.length;
            if (arrayLength > 0 && memberJSONExerciseName.weight[0].toLowerCase().includes(loadUnit.toLowerCase())) {
              weightInput.placeholder = `${memberJSONExerciseName.weight[0]}`;

            } else if (arrayLength > 0 && memberJSONExerciseName.weight[0] != undefined && memberJSONExerciseName.weight[0] != "") {
              if(exerciseInformation[0].load.toLowerCase() == loadUnit.toLowerCase()) {
                weightInput.placeholder = `${memberJSONExerciseName.weight[0]} ${exerciseInformation[0].load}`;
              } else {
                weightInput.placeholder = `${memberJSONExerciseName.weight[0]} ${loadUnit}`;
              }
            }
          } else {
            if(i < summaryWeightLoad.length && summaryWeightLoad[i].innerText.toLowerCase() != "bodyweight" && summaryWeightLoad[i].innerText.toLowerCase() != "band" && summaryWeightLoad[i].innerText.toLowerCase() == exerciseInformation[0].load.toLowerCase()) {
              document.querySelectorAll("#load")[i].parentElement.style.display = "none";
            }
          }

          if(memberJSONExerciseName.reps != undefined) {
            if(memberJSONExerciseName.reps.length > 0) {
              if (memberJSONExerciseName.reps[0].toLowerCase().includes(exerciseInformation[0].quantityUnit.toLowerCase())) {
                repsInput.placeholder = `${memberJSONExerciseName.reps[0]}`;
              } else if(memberJSONExerciseName.reps[0] != "") {
                repsInput.placeholder = `${memberJSONExerciseName.reps[0]} ${exerciseInformation[0].quantityUnit}`;
              }
            }
          }
        } else {
          if(i < summaryWeightLoad.length && summaryWeightLoad[i].innerText.toLowerCase() != "bodyweight" && summaryWeightLoad[i].innerText.toLowerCase() != "band" && summaryWeightLoad[i].innerText.toLowerCase() == exerciseInformation[0].load.toLowerCase()) {
            document.querySelectorAll("#load")[i].parentElement.style.display = "none";
          }
        }

        //Fill in rest fields
        inputList[i].querySelector("#inputRest").innerText = `${exerciseInformation[0].exerciseRestMinutes}m ${exerciseInformation[0].exerciseRestSeconds}s rest`;

        inputList[i].querySelector("#inputRest").classList.add("rest-input")
      }

      for (var j = 0; j < numberOfSets - 1; j++) {
        (function(j) {
          newRestDiv = restDiv.cloneNode(true);

          var newInputSection = inputSectionPlaceholder.cloneNode(true);
          var newWeightInput = newInputSection.querySelector("#weight");
          var newRepsInput = newInputSection.querySelector("#reps");
          
          //Reset values
          newRepsInput.value = "";
          newWeightInput.value = "";
          newRestDiv.style.display = "flex";
          
          //Check if it is an empty filler exercise from god mode:
          if(exerciseInformation.length > 0 && exerciseInformation[j+1] && exerciseInformation[j+1].exercise != "") {
            //Set quantity/reps field
            if(exerciseInformation[j+1].quantityUnit.toLowerCase() == "amrap") {
              newRepsInput.placeholder = `${exerciseInformation[j+1].quantityUnit}`
            } else {
              newRepsInput.placeholder = `${exerciseInformation[j+1].reps} ${exerciseInformation[j+1].quantityUnit}`;
            }
            
            //Set weight field if exists
            //Check if load has inputs from PT
            if(exerciseInformation[0].loadAmount.toLowerCase() != "") {
              if(exerciseInformation[j+1].load.toLowerCase() == loadUnit.toLowerCase()) {
                newWeightInput.placeholder = `${exerciseInformation[j+1].loadAmount} ${exerciseInformation[j+1].load}`;
              } else {

                if(exerciseInformation[0].load.toLowerCase() == "%1rm") {
                  inputList[i].querySelector("#weight").placeholder = `${exerciseInformation[0].loadAmount} ${exerciseInformation[0].load}`;
                } else if(exerciseInformation[0].load.toLowerCase() == "kg") {
                  //We need to convert from lbs to kg
                  newWeightInput.placeholder = `${lbsToKg(exerciseInformation[j+1].loadAmount)} ${loadUnit}`;
                } else if(exerciseInformation[0].load.toLowerCase() == "lbs") {
                  newWeightInput.placeholder = `${kgToLbs(exerciseInformation[j+1].loadAmount)} ${loadUnit}`;
                } else {
                  newWeightInput.placeholder = `${exerciseInformation[j+1].load} ${exerciseInformation[j+1].loadAmount}`;
                  newWeightInput.innerText = `${exerciseInformation[j+1].load} ${exerciseInformation[j+1].loadAmount}`;
                }

              }
            }
            //Set rest
            newRestDiv.querySelector("#inputRest").innerText = `${exerciseInformation[j+1].exerciseRestMinutes}m ${exerciseInformation[j+1].exerciseRestSeconds}s  rest`;
          }
  
          newWeightInput.addEventListener('blur', function(event) {
            const inputValue = event.target.value;

            if((event.target.placeholder.toLowerCase() == "kg/lbs" || event.target.placeholder.toLowerCase().includes(loadUnit)) && !event.target.value.toLowerCase().includes(loadUnit.toLowerCase()) && event.target.value != "") {
              event.target.value = `${inputValue}`;
            } if(event.target.placeholder.toLowerCase().includes("rir") && !event.target.value.toLowerCase().includes("rir")) {  
              event.target.value = `${inputValue} RIR`;
            } else if(event.target.placeholder.toLowerCase().includes("rpe") && !event.target.value.toLowerCase().includes("rpe")) {
              event.target.value = `RPE ${inputValue}`;
            } else if(event.target.placeholder.toLowerCase().includes("%1rm") && !event.target.value.toLowerCase().includes("%1rm")) {
              event.target.value = `${inputValue} %1RM`;
            } else if(event.target.placeholder.toLowerCase().includes("zone") && !event.target.value.toLowerCase().includes("zone")) {
              event.target.value = `Zone ${inputValue}`;
            }

            var allWeightInputs = event.target.closest("#inputSectionBlock").querySelectorAll("#weight");
            allWeightInputs = getTextboxValue(allWeightInputs);

            const exerciseBlock = event.target.closest("#inputSectionBlock");
            const exerciseName = exerciseBlock.querySelector("#exerciseNameInput");
            const exerciseID = exerciseBlock.querySelector("#exerciseItemID");
                    
            updateExerciseDetails(exerciseID.innerText, exerciseName.innerText, allWeightInputs, j+1, "weight");
            //Check if weight also has a value then auto complete set
            const newUpdatedRepsInput = newInputSection.querySelector("#reps");

            if(newUpdatedRepsInput.value != "") {
              newInputSection.querySelector("#completeExercise").click();
            }
          });
          
          newRepsInput.addEventListener('blur', function(event) {

            const inputValue = event.target.value;

            if(event.target.placeholder.toLowerCase().includes("km") && !event.target.value.toLowerCase().includes("km")) {  
              event.target.value = `${inputValue} km`;
            } else if(event.target.placeholder.toLowerCase().includes("mi") && !event.target.value.toLowerCase().includes("mi")) {  
              event.target.value = `${inputValue} mi`;
            } else if(event.target.placeholder.toLowerCase().includes("secs") && !event.target.value.toLowerCase().includes("secs")) {  
              event.target.value = `${inputValue} secs`;
            } else if(event.target.placeholder.toLowerCase().includes("reps") && !event.target.value.toLowerCase().includes("reps")) {  
              event.target.value = `${inputValue} reps`;
            } else if(event.target.placeholder.toLowerCase().includes("emom") && !event.target.value.toLowerCase().includes("emom")) {  
              event.target.value = `${inputValue} emom`;
            }
            else if(event.target.placeholder.toLowerCase().includes("amrap") && !event.target.value.toLowerCase().includes("amrap")) {  
              event.target.value = `${inputValue}`;
            }
      
            const exerciseBlock = event.target.closest("#inputSectionBlock");
            const exerciseName = exerciseBlock.querySelector("#exerciseNameInput");
            const exerciseID = exerciseBlock.querySelector("#exerciseItemID");

            var allRepInputs = event.target.closest("#inputSectionBlock").querySelectorAll("#reps");
            allRepInputs = getTextboxValue(allRepInputs);
      
            updateExerciseDetails(exerciseID.innerText, exerciseName.innerText, allRepInputs, j+1, "reps");
            const newUpdatedWeightInput = newInputSection.querySelector("#weight");

            //Check if weight also has a value then auto complete set
            if(newUpdatedWeightInput.value != "") {
              newInputSection.querySelector("#completeExercise").click();
            }
          });
          
          if(memberJSONExerciseName != undefined) {

            var workoutKeys = Object.keys(memberJSONExerciseName.workouts);

            var foundKey = workoutKeys.find(key => key == uniqueWorkoutID);
            var numberOfSetsComplete = memberJSONExerciseName.workouts[foundKey];
            newInputSection.querySelector("#completeExercise").classList.remove("pre-complete");
            if(numberOfSetsComplete != undefined && numberOfSetsComplete > j+1) {
              newInputSection.querySelector("#completeExercise").classList.add("pre-complete");
            }
            
            if(memberJSONExerciseName.weight != undefined) {
              if(memberJSONExerciseName.weight[j+1] != undefined) {

                if (memberJSONExerciseName.weight[j+1].toLowerCase().includes(loadUnit.toLowerCase())) {
                  newWeightInput.placeholder = `${memberJSONExerciseName.weight[j+1]}`;
                } else if(memberJSONExerciseName.weight[j+1] != "") {
                  newWeightInput.placeholder = `${memberJSONExerciseName.weight[j+1]} ${loadUnit}`;
                }

              }

            }

            if(memberJSONExerciseName.reps != undefined) {
              if(memberJSONExerciseName.reps.length > j+1) {
                if (exerciseInformation[j+1] && memberJSONExerciseName.reps[j+1].includes(exerciseInformation[j+1].quantityUnit.toLowerCase())) {
                  newRepsInput.placeholder = `${memberJSONExerciseName.reps[j+1]}`;
                } else if(exerciseInformation[j+1] && memberJSONExerciseName.reps[j+1] != "") {
                  newRepsInput.placeholder = `${memberJSONExerciseName.reps[j+1]} ${exerciseInformation[j+1].quantityUnit}`;
                }
              } 
            }
          } 

          if(j < numberOfSets - 1) {
            exerciseInputSection.appendChild(newRestDiv);
          }
          
          exerciseInputSection.appendChild(newInputSection);
          newInputSection.querySelector("#setNumber").innerText = j+2;


        })(j); // Pass the value of j into the immediately-invoked function expression (IIFE)
      }
    }

    //Set onclicks for each complete image
    const completeButtons = document.querySelectorAll("#completeExercise");

    var numberOfSets = completeButtons.length;
    var completedSets = 0;
    
    //Record in memberstack
    const workoutID = sessionStorage.getItem("currentWorkout");
    completeButtons.forEach((button, index) => {
      
      //Get exercise name
      const completedExercisename = button.closest("#inputSectionBlock").querySelector("#exerciseNameInput").innerText;
      const completedExerciseID = button.closest("#inputSectionBlock").querySelector("#exerciseItemID").innerText;

      var exerciseInfo = memberJSON[completedExercisename];
      if(exerciseInfo && exerciseInfo.workouts != undefined) {
        var numCompletedSets = exerciseInfo.workouts[workoutID];
        var setNumber = parseInt(button.closest("#inputSection").querySelector("#setNumber").innerText);

        if(setNumber <= numCompletedSets) {

          const repsValue = button.closest("#inputSection").querySelector("#reps").placeholder;
          button.closest("#inputSection").querySelector("#reps").value  = repsValue;

          hideCompleteButton(button);

        }
      }

      button.addEventListener("click", () => {

        //Get both input boxes from that row
        var inputBoxes = button.closest("#inputSection").querySelectorAll("input");

        inputBoxes.forEach((element) => {
          //Check if it has a value
          if(element.value == "") {
            //Check if it had a previous value
            if(element.placeholder.split(" ").length > 1) {
              element.value = element.placeholder
            }
          }
        });

        hideCompleteButton(button);

        let restDiv = button.closest("#inputSection").nextElementSibling;

        if (restDiv) {
          restDiv = restDiv.querySelector("#inputRest");
        }
      
        // Pause the previous timer if it's running
        pauseTimer();
      
        if (restDiv && !button.classList.contains("pre-complete")) {
          let restTime = parseTime(restDiv.textContent); // Parse new time
          activeRestDiv = restDiv;
          remainingTime = null; // Reset paused time for the new timer
          activeTimer = startTimer(restTime, restDiv);
        } else {
          activeRestDiv = null;
        }

        //Increment 'completed sets' counter
        completedSets += 1;

        if(completedSets == numberOfSets) {
          document.getElementById("finishWorkout").click;
        }

        if((workoutID != null && workoutID != "") && !button.classList.contains("pre-complete") && member.loggedIn) {
          var workoutIDUnique = workoutID.split("+");
          var setNumber = parseInt(button.closest("#inputSection").querySelector("#setNumber").innerText);

          if(workoutIDUnique.length > 0) {
            workoutIDUnique = workoutIDUnique[0];
            updateWorkoutDetails(completedExerciseID, completedExercisename, workoutIDUnique, setNumber);
          } else {
            updateWorkoutDetails(completedExerciseID, completedExercisename, workoutID, setNumber);
          }
          
        }
        
      });

      if(button.classList.contains("pre-complete")) {
        button.click();
      }

    });

    document.getElementById("finishWorkout").onclick = async () => {
      
      if(member.loggedIn) {
        //Get user metadata
        memberJSON = await member.getMetaData();
        var workoutID = sessionStorage.getItem("currentWorkout");

        if(workoutID && workoutID.split("+").length > 0) {
          workoutID = workoutID.split("+")[0];
        }
        
        if(fromChallenge) {

          var memberProgress = {
            [workoutID]: {"challenge" : "true"}
          }

          if(memberJSON[workoutID]) {
            memberProgress = {[workoutID] : {...memberJSON[workoutID], "challenge" : "true"}}
          } 

          await member.updateMetaData(memberProgress);

          //Navigate back to challenge page
          window.location = sessionStorage.getItem("challengePage");
          
        } else {
          
          //Get program JSON and modify it to include the new workout id
          const userProgram = JSON.parse(sessionStorage.getItem("currentProgram"));
          const workoutIndex = sessionStorage.getItem("workoutIndex");
          
          var workoutObj = {};
          workoutObj["memberJSON"] = JSON.stringify(memberJSON);
          workoutObj["member"] = member;
          workoutObj["programName"] = sessionStorage.getItem("programName");
          workoutObj["programID"] = sessionStorage.getItem("programID");
          
          if(userProgram != null) {
            var uniqueWorkoutIDToFind = workoutID.split("+");
            if(uniqueWorkoutIDToFind && uniqueWorkoutIDToFind.length > 0) {
              uniqueWorkoutIDToFind = uniqueWorkoutIDToFind[0];
            }
            var foundObject = {};
            //Find corresponding unique workout ID
            var numberOfCompletedWorkouts = 0;
            userProgram[0].events.forEach(event => {
              if (event.extendedProps.uniqueWorkoutID === uniqueWorkoutIDToFind) {
                foundObject = event;
              }

              if(event.extendedProps.completedID) {
                numberOfCompletedWorkouts += 1;
              }

            });

            if(userProgram[0].events.length == numberOfCompletedWorkouts + 1) {
              workoutObj["programCompleted"] = true;
            }

            //Set the completed ID
            foundObject["extendedProps"]["completedID"] = workoutID;

            workoutObj["userProgram"] = JSON.stringify(userProgram);

          } 
          localStorage.setItem("completedWorkout", workoutID);
          if(workoutObj["programID"]) {
            sendWorkoutDetailsToMake(workoutObj);
          } else {
            const programPageLink = document.getElementById("myProgram").href;
            if(localStorage.getItem("currentTrainingPlan")) {
              window.location = localStorage.getItem("currentTrainingPlan");
            } else {
              window.location = programPageLink;
            }
            
          }
          
        }

      } else {
        location.reload();
      }
      
    };

    //Set onclick for start button
    document.getElementById("startWorkout").onclick = () => {

      localStorage.setItem("startedWorkout", uniqueWorkoutID);

      //document.getElementById("workoutInput").click();

      document.getElementById("workoutNavigation").style.display = "none";
      
      if(document.getElementById("shareWorkout").style.display != "block") {
        document.getElementById("finishWorkoutDiv").style.display = "flex";
        document.getElementById("finishWorkoutDiv").style.justifyContent = "center";
      }
      
      // Now everything is filled out - move the input sections to the summary elements
      const inputElements = document.querySelectorAll('[inputexercise]');

      // Loop through the elements and do something
      inputElements.forEach((inputElement, index) => {

        const exerciseId = inputElement.getAttribute('inputexercise');
      
        // Clean up inputElement
        const inputBlock = inputElement.querySelector("#inputSectionBlock");
        inputBlock.style.width = "100%";

        inputElement.querySelector("#inputHeaderDiv").style.display = "none";
        //inputElement.style.height = "0px";
        inputElement.style.transition = "height 1000ms ease";

        // Find corresponding summary element
        var guideSummaryElements = document.querySelectorAll(`[workoutexercise="${exerciseId}"]`);
        var guideSummaryElement = guideSummaryElements[0];
        if(guideSummaryElements.length > 1) {
          guideSummaryElement = guideSummaryElements[index];
        }

        if (guideSummaryElement) {
          const exerciseInfo = guideSummaryElement.querySelector("#exerciseInfo");
          if (exerciseInfo) {
            exerciseInfo.style.transition = "none";
            // Temporarily set height to its current value
            var initialHeight = exerciseInfo.offsetHeight; // Get current height

            var initialInputHeight = inputElement.offsetHeight; // Get current height
            inputElement.style.height = `${initialInputHeight}px`;
            exerciseInfo.style.height = `auto`;
            // Append the inputElement
            setTimeout(() => {
              exerciseInfo.appendChild(inputElement);
              // Trigger height transition by calculating new height
              var newHeight = exerciseInfo.scrollHeight; // Total height with content
              const inputElementHeight = inputElement.scrollHeight;

              //exerciseInfo.style.height = `${newHeight}px`;
              inputElement.style.height = `${inputElementHeight}px`;

              inputElement.addEventListener(
                "transitionend",
                () => {
                  inputElement.style.height = 'auto';
                },
                { once: true }
              );

            }, 0); // Small timeout to ensure DOM changes are applied

          }
        }
      });
    }

    function calculateExerciseNumber(element) {

    }

    //Click listeners:
    document.addEventListener('click', async function(event) {

      if(event.target.closest("#guidePlaceHolder")) {

        //Disable scrolling on screen behing
        document.querySelector("body").style.overflow = "hidden";

        //Grab guide stuff
        var exerciseParent = event.target.closest("[workoutexercise]");

        var selectedGuideID = exerciseParent.getAttribute("workoutexercise");

        //Get guide contents
        var guideInfo = document.querySelector(`[guidesummarycontents="${selectedGuideID}"]`);
        var guideBody = document.getElementById("guideSummaryBody");
        //Show guide drawer component
        document.getElementById("guideSummaryParent").style.display = "flex";

        // Force reflow to ensure transition works
        void guideBody.offsetHeight;
    
        guideBody.classList.add("visible");

        guideBody.appendChild(guideInfo);

      }

      if(event.target.id == "guideSummaryParent" || event.target.id == "closeVideoModal") {
        
        var guideBody = document.getElementById("guideSummaryBody");

        //Get id:
        var selectedGuideID = guideBody.querySelector("#guideSummaryContents").getAttribute("guidesummarycontents");

        //Find corresponding home for the guide:
        var guideHome = document.querySelector(`[guidesummarycontentsparent="${selectedGuideID}"]`);
        guideHome.appendChild(guideBody.querySelector("#guideSummaryContents"));

        guideBody.classList.remove("visible");

        setTimeout(() => {
          document.getElementById("guideSummaryParent").style.display = "none";
        }, 350);

        //Allow scrolling again
        document.querySelector("body").style.overflow = "";

      }

      if(event.target.closest(".user-page")) {

        // Change screen to current / rest of program / back
        var selectedExercise = event.target.closest(".user-page")
        var selectedExerciseName = selectedExercise.querySelector(".similar-exercise-name").innerText;

        swappingExerciseID = selectedExercise.getAttribute('similarexerciseitem');
      
        //Hide list for now
        document.querySelector("#similarExerciseListParent #realSimilarExerciseList").style.display = "none";

        //Change text:
        document.getElementById("swapExerciseText").innerText = `Swap '${selectedExerciseName}' with '${currentSwappedExercise}'`
        
        document.getElementById("selectSwapExerciseParent").style.display = "flex";

        //Append list back to original location
        //document.querySelector("#similarExerciseLists").append(document.querySelector("#similarExerciseListParent #realSimilarExerciseList"));

      }

      if(event.target.id == "cancelSwapExercise") {
        //Hide button controls div
        document.getElementById("selectSwapExerciseParent").style.display = "none";
        //Show similar exercises
        document.querySelector("#similarExerciseListParent #realSimilarExerciseList").style.display = "block";
      }

      if(event.target.id == "currentWorkout") {
        //Update memberstack
        var workoutID = sessionStorage.getItem("currentWorkout");

        if(workoutID && workoutID.split("+").length > 0) {
          workoutID = workoutID.split("+")[0];
        }

        //Current exercise
        var swappedExercise = {
          [workoutID]: {[currentSwappedExerciseID] : swappingExerciseID}
        }

        if(memberJSON[workoutID]) {
          swappedExercise = {[workoutID] : {...memberJSON[workoutID], [currentSwappedExerciseID] : swappingExerciseID}}
        } 

        await member.updateMetaData(swappedExercise);

        //Swap exercises - write function
        //Get actual ID of current exercise
        swapExercises(currentSwappedExerciseID, swappingExerciseID)

        //Hide draw component
        document.getElementById("similarExercisesParent").click();

      }

      if(event.target.id == "entireProgram") {

        //Current exercise id as key
        var swappedExercise = {
          [currentSwappedExerciseID]: {"swappedExercise" : swappingExerciseID}
        }

        if(memberJSON[currentSwappedExerciseID]) {
          swappedExercise = {[currentSwappedExerciseID] : {...memberJSON[currentSwappedExerciseID], "swappedExercise" : swappingExerciseID}}
        } 

        await member.updateMetaData(swappedExercise);

        //Swap exercises - write function
        swapExercises(currentSwappedExerciseID, swappingExerciseID)

        //Hide draw component
        document.getElementById("similarExercisesParent").click();
      }

    });
  


  });

  //Check if there is no gym filter
  if (utm_campaign != null && utm_campaign != "utm_campaign") {
    localStorage.setItem('gym_name', utm_campaign);
    //Find all links on the page and add utm parameter for future filtering
    var pageLinks = document.querySelectorAll("a");
    for(var i = 0; i < pageLinks.length; i++) {
      if(pageLinks[i].id != "startWorkout" && pageLinks[i].id != "shareLink" && pageLinks[i].id != "closeMenu" && pageLinks[i].id != "clearFilters") {
        if(pageLinks[i].id == "home" && utm_campaign.toLowerCase() == "alfie robertson - fitness") {
          pageLinks[i].href = "";
        } else {
          pageLinks[i].href = pageLinks[i].href += `?utm_campaign=${utm_campaign}`;
        }
      } else if (pageLinks[i].id == "clearFilters") {
        pageLinks[i].href = pageLinks[i].href;
      }
    }
  }

  if(fromFreeProgram) {
    document.getElementById("startWorkout").style.display = "none"
  }

  //Setting destination of back button
  document.getElementById('backFromWorkout').onclick = function() {
    if(fromChallenge) {
      window.location = sessionStorage.getItem("challengePage");
    } else if(fromProgram) {
      history.back()
    } else if(fromFreeProgram) {
      window.location = localStorage.getItem("freeProgramLink");
    } else if (localStorage.getItem("initialWorkoutPage") == "wow") {
      if (utm_campaign != null && utm_campaign != "utm_campaign") {
        window.location = `${window.location.origin}/workouts/workout-navigation?utm_campaign=${utm_campaign}`;
      } else {
       window.location = `${window.location.origin}/workouts/workout-navigation`;
      }
    } else {
      if (utm_campaign != null && utm_campaign != "utm_campaign") {
        window.location = `${window.location.origin}/workouts/workout-summary?utm_campaign=${utm_campaign}`;
      } else {
        window.location = `${window.location.origin}/workouts/workout-summary`;
      }

    }
  }

  var workoutJSON = JSON.parse(document.getElementById("workoutJSON").innerText);

  const formattedArray = [].concat(...workoutJSON);
  var flattenedArray = [];
  formattedArray.forEach((exercise) => {
    if(exercise.guideID) {
      flattenedArray.push(exercise);
    } else {
      var subExerciseList = Object.values(exercise)[0];

      subExerciseList.forEach((subExercise) => {
        flattenedArray.push(subExercise);
      });
    }
  });

  exerciseList = document.querySelectorAll("#listOfExercises .w-dyn-item");

  //Fill workout list with values from workout json
  //Iterate through existing exercise list and change names
  for(var i = 0; i < exerciseList.length; i++) {
    
    if(flattenedArray[i].exercises[0].measure.toLowerCase() == "rpe" || flattenedArray[i].exercises[0].measure.toLowerCase() == "rir") {
      exerciseList[i].querySelector("#repInput").innerText = flattenedArray[i].exercises[0].loadAmount;
      exerciseList[i].querySelector("#quantityUnit").innerText = "\u00A0" + flattenedArray[i].exercises[0].measure;
    } else {
      if(flattenedArray[i].exercises[0].quantityUnit.toLowerCase() == "amrap") {
        exerciseList[i].querySelector("#quantityUnit").innerText = flattenedArray[i].exercises[0].quantityUnit;
      } else {
        exerciseList[i].querySelector("#repInput").innerText = flattenedArray[i].exercises[0].reps;
        exerciseList[i].querySelector("#quantityUnit").innerText = "\u00A0" + flattenedArray[i].exercises[0].quantityUnit;
      }

    }
    
    exerciseList[i].querySelector("#repInput").classList.remove("w-dyn-bind-empty");
    exerciseList[i].querySelector("#setInput").innerText = flattenedArray[i].sets;
    if(flattenedArray[i].sets == 1) {
      if(exerciseList[i].querySelector("#setInput").nextElementSibling) {
        exerciseList[i].querySelector("#setInput").nextElementSibling.innerText = "\u00A0 set";
      }
      
    }
    
    exerciseList[i].querySelector("#setInput").classList.remove("w-dyn-bind-empty");
    if(flattenedArray[i].exercises[0].exerciseRestSeconds == 0) {
      flattenedArray[i].exercises[0].exerciseRestSeconds = "00";
    }
    exerciseList[i].querySelector("#restMinutes").innerText = `${flattenedArray[i].exercises[0].exerciseRestMinutes}:${flattenedArray[i].exercises[0].exerciseRestSeconds}`;
    exerciseList[i].querySelector("#restMinutes").classList.remove("w-dyn-bind-empty");
    exerciseList[i].querySelector("#exerciseNotes").innerText = flattenedArray[i].exerciseNotes;
  }


  var workoutExercises = [];
  //Get all workout names and store them
  var duplicateGuides = [];
  var duplicateExerciseNames = [];

  for(var i = 0; i < exerciseList.length; i++) {
    //Set reps input
    var shortName = exerciseList[i].querySelector("#exerciseShortName").innerText;
    var guideID = exerciseList[i].querySelector("#workoutExerciseItemID").innerText;
    var fullExerciseName = "";

    if(flattenedArray.length == 0) {
      //Set default values
      //Hide rest div
      exerciseList[i].querySelector("#weightDiv").style.display = "none";
      exerciseList[i].querySelector("#repInput").innerText = 10;
      exerciseList[i].querySelector("#repInput").classList.remove("w-dyn-bind-empty");
      exerciseList[i].querySelector("#setInput").innerText = 3;
      exerciseList[i].querySelector("#setInput").classList.remove("w-dyn-bind-empty");
      exerciseList[i].querySelector("#restMinutes").innerText = "2:00";
      exerciseList[i].querySelector("#restMinutes").classList.remove("w-dyn-bind-empty");
      exerciseList[i].querySelector("#exerciseNotes").innerText = "";
      
    }

  }

  document.addEventListener('click', function (event) {

    if(event.target.id == "shareLink" || event.target.id == "shareImage") {

      const shareData = {
        title: 'BeneFit Workout',
        text: 'Try out my latest workout!',
        url: location.href
      }
      showShareNavigation(shareData);
    } else if (event.target.id == "home" || event.target.id == "homeImage" || event.target.id == "exerciseLibrary" || event.target.id == "workouts") {
      localStorage.setItem("onlyFinish", "false");
    }

  }, false);

  //Set current workout link in storage
  localStorage.setItem("currentWorkout", document.URL);

  //Set exercises in storage
  localStorage.setItem("workoutExercises", JSON.stringify(workoutExercises));

  //Represent supersets where applicable
  var workoutJSONObj = JSON.parse(document.getElementById("workoutJSON").innerText);
  var exerciseCount = 0;
  //Compare to listOfExercises > workoutExerciseItemID and remove if not in there
  var listOfExercises = document.querySelectorAll("#listOfExercises .w-dyn-item");
  var inputListExercises = document.querySelectorAll("#inputList .w-dyn-item");
  workoutJSONObj.forEach((exercise, index) => {
    var exerciseGroupName = "";
    if(!Array.isArray(exercise)) {
      exerciseGroupName = Object.keys(exercise)[0]
      exercise = Object.values(exercise)[0];
    }

    if(exercise.length > 1) {

      // Create a new div with styling
      const newDiv = document.createElement('div');
      newDiv.classList.add('exercise-list-item-superset');
      newDiv.style.borderRadius = '8px';
      newDiv.style.marginBottom = '20px';
      newDiv.style.border = '1px solid #CBCBCB';
      newDiv.style.backgroundColor = "white";
      newDiv.style.display = "flex";
      newDiv.style.flexDirection = "column";
      newDiv.style.alignItems = "center";
      const supersetText = document.createElement('div');
      if(exerciseGroupName != "") {
        supersetText.innerText = exerciseGroupName;
      } else {
        supersetText.innerText = "Superset";
      }
      
      
      supersetText.classList.add("superset-text")
      
      //Add 'superset text to list'
      listOfExercises[exerciseCount].parentNode.insertBefore(supersetText, listOfExercises[exerciseCount]);
      //Add new div to list
      listOfExercises[exerciseCount].parentNode.insertBefore(newDiv, listOfExercises[exerciseCount]);

      //Cloning superset parent list
      const inputNewDiv = newDiv.cloneNode(true);
      const supersetTextInput = supersetText.cloneNode(true);

      // Insert the new div before the superset parent
      inputListExercises[exerciseCount].parentNode.insertBefore(supersetTextInput, inputListExercises[exerciseCount]);

      inputListExercises[exerciseCount].parentNode.insertBefore(inputNewDiv, inputListExercises[exerciseCount]);
        
      exercise.forEach((item, index) => {
        newDiv.appendChild(listOfExercises[exerciseCount]);

        inputNewDiv.appendChild(inputListExercises[exerciseCount]);

        listOfExercises[exerciseCount].style.marginBottom = 0;
        
        listOfExercises[exerciseCount].querySelector("#exerciseInfo").style.border = "none";
        listOfExercises[exerciseCount].querySelector("#exerciseInfo").style.marginBottom = 0;
        listOfExercises[exerciseCount].querySelector("#exerciseInfo").style.marginTop = 0;

        inputListExercises[exerciseCount].querySelector("#inputSectionBlock").style.border = "none";
        inputListExercises[exerciseCount].querySelector("#inputSectionBlock").style.marginBottom = 0;
        inputListExercises[exerciseCount].querySelector("#inputSectionBlock").style.marginTop = 0;
        exerciseCount += 1;
      })
      
    } else {
      exerciseCount += 1;
    }
    
  });

  function swapInitialLoadExercises(swappedExercisesJSON, swappedLevel="workout") {
    //Get all current exercises
    var workoutExerciseIDs = document.querySelectorAll("#workoutExerciseItemID");

    //Iterate through them
    for(var i = 0; i < workoutExerciseIDs.length; i++) {
      //Check if they exist in swappedExercisesJSON
      var indexedExercise = swappedExercisesJSON[workoutExerciseIDs[i].innerText];
      if(indexedExercise) {
        //If they do then call swap exercise function
        if(swappedLevel == "workout") {
          swapExercises(workoutExerciseIDs[i].innerText, indexedExercise)
        } else {
          if(indexedExercise["swappedExercise"]) {
            swapExercises(workoutExerciseIDs[i].innerText, indexedExercise["swappedExercise"])
          }
          
        }
        
      }
      
    }
  }

  function swapExercises(initialExercise, swappedExercise) {

    // Update Workout summary list values
    var initialExerciseElement = document.querySelector(`[workoutExercise="${initialExercise}"]`);

    var initialInputExerciseElement = document.querySelector(`[inputExercise="${initialExercise}"]`);

    var swappedExerciseElement = document.querySelector(`[similarexerciseitem="${swappedExercise}"]`);

    //link (href) #exerciseInfo
    initialExerciseElement.querySelector("#exerciseInfo").href = swappedExerciseElement.querySelector("#similarGuideLink").href + "?isWorkout=true";

    //Img (src) #exerciseThumbnail
    initialExerciseElement.querySelector(".exerciseThumbnail").src = swappedExerciseElement.querySelector(".exerciseThumbnail").src;

    //Text #exerciseShortName
    // Get the existing text from #exerciseShortName
    const exerciseShortNameText = initialExerciseElement.querySelector("#exerciseShortName").innerText;

    // Extract the prefix if it exists (pattern: one or more characters followed by " - ")
    const prefixMatch = exerciseShortNameText.match(/^[^\-]* - /);
    const prefix = prefixMatch ? prefixMatch[0] : "";
    // Get the text from #similarGuideName
    const similarGuideNameText = swappedExerciseElement.querySelector("#similarGuideName").innerText;
    // Combine the prefix (if any) with the similar guide name
    const newText = prefix + similarGuideNameText;
    // Set the combined text to #exerciseShortName
    initialExerciseElement.querySelector("#exerciseShortName").innerText = newText;

    //Text #workoutExerciseItemID
    initialExerciseElement.querySelector("#workoutExerciseItemID").innerText = swappedExerciseElement.querySelector("#similarGuideID").innerText;

    //Input list

    //# exerciseItemID innerText
    initialInputExerciseElement.querySelector("#exerciseItemID").innerText = swappedExerciseElement.querySelector("#similarGuideID").innerText;

    //#exerciseShortNameInput innerText
    initialInputExerciseElement.querySelector("#exerciseShortNameInput").innerText = newText

    //#guideLink href
    initialInputExerciseElement.querySelector("#guideLink").href = swappedExerciseElement.querySelector("#similarGuideLink").href + "?isWorkout=true";

    //#exerciseNameInput innerText
    initialInputExerciseElement.querySelector("#exerciseNameInput").innerText = swappedExerciseElement.querySelector("#similarGuideName").innerText;

    //Remove from similar exercise list
    swappedExerciseElement.parentElement.remove();

    clearInputs(initialInputExerciseElement);

  }

  function clearInputs(inputElement) {
    var inputSections = inputElement.querySelectorAll("#inputSection");
    var inputElementID = inputElement.getAttribute("inputexercise");
    for(var i = 0; i < inputSections.length; i++) {
      //Background color
      inputSections[i].style.backgroundColor = "";

      //Border color - outer
      inputSections[i].style.borderColor = "";

      //Border color of each input
      inputSections[i].querySelector("#reps").style.borderColor = "";
      inputSections[i].querySelector("#weight").style.borderColor = "";

      //Complete button
      inputSections[i].querySelector("#completedExercise").style.display = "";
      inputSections[i].querySelector("#completeExercise").style.display = "";

      //Clear Rep input
      inputSections[i].querySelector("#reps").value = "";

      var inputValues = workoutInformation.filter(item => item.guideID && item.guideID.includes(inputElementID));

      if(inputValues[i].quantityUnit.toLowerCase() == "amrap") {
        inputSections[i].querySelector("#reps").placeholder = `${inputValues[0].quantityUnit}`;
      } else {
        inputSections[i].querySelector("#reps").placeholder = `${inputValues[0].reps} ${inputValues[0].quantityUnit}`;
      }
      
      //Clear Weight input
      inputSections[i].querySelector("#weight").value = "";
      inputSections[i].querySelector("#weight").placeholder = "Kg/Lbs";

    }
  }

  function getTextboxValue(nodeList) {
    if (!nodeList || !nodeList.length) {
      return [];
    }
  
    const valuesArray = [];
  
    nodeList.forEach((element) => {
      if (element.tagName.toLowerCase() === "input") {
        valuesArray.push(element.value.split(" ")[0]);
      }
    });
  
    return valuesArray;
  }

  async function getSimilarExercise(url, exerciseID, similarExerciseJSON) {
    var getRequest = $.get(url, function (data, status) {
      if (status === 'success') {
        // Find similar exercise list (adjust this based on your actual data structure)
        var similarExerciseList = $(data)[61]; // Example: Assuming you are extracting a specific element
  
        // Set the custom attribute 'similarExerciseList' with the exerciseID
        $(similarExerciseList).attr('similarExerciseList', exerciseID);
  
        // Append the modified element to a container on your page
        $('#similarExerciseLists').append(similarExerciseList);

        if(similarExerciseJSON != "") {
          similarExerciseJSON = similarExerciseJSON.replace(/'/g, '"')
        
          similarExerciseJSON = JSON.parse(similarExerciseJSON);
    
          for(var j = 0; j < similarExerciseJSON.length; j++) {
            if(similarExerciseJSON[j]["exercise_id"]) {

              var foundExerciseList = document.querySelector(`[similarExerciseItem="${similarExerciseJSON[j]["exercise_id"]}"]`);

              //Find each element with id, and fill in data
              if(foundExerciseList) {
                foundExerciseList.querySelector("#similarEquipment").innerText = `Equipment: ${similarExerciseJSON[j]["loading_mechanism"]}`;
                foundExerciseList.querySelector("#similarDifficulty").innerText = `Exercise Type: ${similarExerciseJSON[j]["exercise_type"]}`;
              }
      
            }
          }
        }
  
      } else {
        alert('Error loading workout data for ' + summaryWorkoutSlug);
      }
      
    });
  }

  
  
  /**
   * Converts kilograms to pounds.
   * @param {number} kilograms - The weight in kilograms.
   * @returns {number} - The equivalent weight in pounds.
   */
  function kgToLbs(kilograms) {
   
    // 1 kilogram is approximately 2.20462 pounds
    const pounds = kilograms * 2.20462;
    return Math.round(pounds);
  }

  /**
   * Converts pounds to kilograms.
   * @param {number} pounds - The weight in pounds.
   * @returns {number} - The equivalent weight in kilograms.
   */
  function lbsToKg(pounds) {
    // 1 pound is approximately 0.453592 kilograms
    const kilograms = pounds * 0.453592;
    return Math.round(kilograms);
  }
  
  function checkEmptyQuantity(exerciseInformation) {
    // Flag to keep track of empty loadAmount
    let allEmpty = true;

    // Iterate through each object in the exerciseInformation array
    for (let exercise of exerciseInformation) {
        // If any loadAmount is not empty, update the flag and break the loop
        if (exercise.reps !== "") {
            allEmpty = false;
            break;
        }
    }

    return allEmpty; // Return the flag indicating whether all loadAmount fields are empty
  }

  function checkBodyWeight(exerciseElement) {
    if(exerciseElement) {
      if(exerciseElement.querySelector("#exerciseLoadingMechanism")) {
        const loadingMechanism = exerciseElement.querySelector("#exerciseLoadingMechanism").innerText.toLowerCase();
        if(loadingMechanism == "bodyweight" || loadingMechanism == "swiss ball" || loadingMechanism == "band") {
          return true;
        }
      }
    } 
    return false;
  }

  function checkSameLoadAmount(exerciseInformation) {

    const firstLoadAmount = exerciseInformation[0].loadAmount;
    const firstLoadQuantity = exerciseInformation[0].load;

    // Check if all loadAmounts are the same as the first one
    for (let exercise of exerciseInformation) {
        if (firstLoadQuantity == exercise.load && exercise.loadAmount !== firstLoadAmount) {
          return false; // Return false if any loadAmount is different
        }
    }
    return true; // Return true if all loadAmounts are the same
  }

  function checkSameQuantityUnit(exerciseInformation) {

    const firstLoadAmount = exerciseInformation[0].reps;
    const firstQuantityUnit = exerciseInformation[0].quantityUnit;

    // Check if all loadAmounts are the same as the first one
    for (let exercise of exerciseInformation) {
        if (firstQuantityUnit == exercise.quantityUnit && exercise.reps !== firstLoadAmount) {
          return false; // Return false if any loadAmount is different
        }
    }
    return true; // Return true if all loadAmounts are the same
  }

  function getLoadAmountMin(exerciseInformation) {

    var minLoadAmount = exerciseInformation[0].loadAmount;
    const firstLoadQuantity = exerciseInformation[0].load;

    // Find the minimum loadAmount
    for (let exercise of exerciseInformation) {
        if (firstLoadQuantity == exercise.load && exercise.loadAmount !== "" && exercise.loadAmount < minLoadAmount) {
            minLoadAmount = exercise.loadAmount;
        }
    }

    return minLoadAmount !== "" ? minLoadAmount : null; // Return the minimum loadAmount found or null if none is valid
  }

  function numberOfIncompleteWorkouts() {
    const userProgram = sessionStorage.getItem("currentProgram");
  }

  
  function getQuantityAmountMin(exerciseInformation) {

    var minQuantityAmount = exerciseInformation[0].reps;
    const firstQuantityAmount = exerciseInformation[0].quantityUnit;

    // Find the minimum loadAmount
    for (let exercise of exerciseInformation) {
        if (firstQuantityAmount == exercise.quantityUnit && exercise.reps !== "" && exercise.reps < minQuantityAmount) {
          minQuantityAmount = exercise.reps;
        }
    }

    return minQuantityAmount !== "" ? minQuantityAmount : null; // Return the minimum loadAmount found or null if none is valid
  }

  function getLoadAmountMax(exerciseInformation) {

    var maxLoadAmount = exerciseInformation[0].loadAmount;
    const firstLoadQuantity = exerciseInformation[0].load;

    // Find the maximum loadAmount
    for (let exercise of exerciseInformation) {
        if (firstLoadQuantity == exercise.load && exercise.loadAmount !== "" && exercise.loadAmount > maxLoadAmount) {
            maxLoadAmount = exercise.loadAmount;
        }
    }

    return maxLoadAmount !== "" ? maxLoadAmount : null; // Return the maximum loadAmount found or null if none is valid
  }

  function getQuantityAmountMax(exerciseInformation) {

    var maxQuantityAmount = exerciseInformation[0].reps;
    const firstQuantityAmount = exerciseInformation[0].quantityUnit;

    // Find the minimum loadAmount
    for (let exercise of exerciseInformation) {
        if (firstQuantityAmount == exercise.quantityUnit && exercise.reps !== "" && exercise.reps > maxQuantityAmount) {
          maxQuantityAmount = exercise.reps;
        }
    }

    return maxQuantityAmount !== "" ? maxQuantityAmount : null; // Return the minimum loadAmount found or null if none is valid
  }

  async function showShareNavigation(shareData) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      console.log(err);
    }
  }

  async function sendWorkoutDetailsToMake(workoutObj) {
    fetch("https://hook.us1.make.com/bzcdv18wn5vn11k018czjnfii7ljspgs", {
      method: "POST",
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify(workoutObj)
    }).then((res) => {
      if (res.ok) {
        return res.text();
      }
      throw new Error('Something went wrong');
    })
    .then((data) => {


      if(localStorage.getItem("currentTrainingPlan")) {
        window.location = localStorage.getItem("currentTrainingPlan");
      } else {
        const programPageLink = document.getElementById("myProgram").href;
        window.location = programPageLink;
      }

      
    })
    .catch((error) => {
      const programPageLink = document.getElementById("myProgram").href;
      window.location = programPageLink;
    });
  }

  async function updateWorkoutDetails(exerciseID, exerciseName, workoutID, value) {
    MemberStack.onReady.then(async function(member) {  

      document.getElementById("startWorkout").innerText = "Continue Workout";

      var metadata = await member.getMetaData();

      //First check using exercise ID as the key
      var exerciseInfo = metadata[exerciseID];

      //If it is empty resort to exercise name as key
      if(exerciseInfo == undefined) {
        exerciseInfo = metadata[exerciseName];
      }

      var workoutsMap = null;
      if(exerciseInfo == undefined) {
        workoutsMap =  new Map();
        exerciseInfo = {"weight": [], "reps":[], "workouts": new Map()};
      } else if(exerciseInfo.workouts.length == 0) {
        workoutsMap =  new Map();
        exerciseInfo["workouts"] = workoutsMap;
        
      }

      var workoutsMap = exerciseInfo.workouts;
      //If no workouts recorded
      workoutsMap[workoutID] = value;

      exerciseInfo.workouts = workoutsMap;

      const updatedJSON = {[exerciseID] : exerciseInfo};
      member.updateMetaData(updatedJSON);


    });
  }

  function parseTime(timeString) {
    let timeParts = timeString.split(" ");
    let minutes = parseInt(timeParts[0].replace("m", "")) || 0;
    let seconds = parseInt(timeParts[1].replace("s", "")) || 0;
    return minutes * 60 + seconds;
  }

  function formatTime(seconds) {
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s rest`;
  }

  function startTimer(initialTime, restDiv) {
    let timeRemaining = initialTime;
    lastUpdatedTimestamp = Date.now();
    sessionStorage.setItem("activeRestDivId", restDiv.id);
    sessionStorage.setItem("timerDuration", timeRemaining);
    sessionStorage.setItem("lastUpdatedTimestamp", lastUpdatedTimestamp);
  
    let timerInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastUpdatedTimestamp) / 1000);
  
      if (elapsed > 3) {
        // Detect user absence and adjust time
        timeRemaining -= elapsed;
        if (timeRemaining <= 0) {
          completeTimer(restDiv);
          return;
        }
      } else {
        timeRemaining--;
      }
  
      lastUpdatedTimestamp = now;
      sessionStorage.setItem("timerDuration", timeRemaining);
      sessionStorage.setItem("lastUpdatedTimestamp", lastUpdatedTimestamp);
  
      restDiv.style.color = "black";
      restDiv.textContent = formatTime(timeRemaining);
  
      if (timeRemaining <= 0) {
        completeTimer(restDiv);
      }
    }, 1000);
  
    return timerInterval; // Return the timer interval ID to track it
  }

  // Pause the current timer and store remaining time
  function pauseTimer() {
    if (activeTimer) {
      clearInterval(activeTimer); // Stop the interval
      activeTimer = null; // Reset the timer reference
      if (activeRestDiv) {
        remainingTime = parseTime(activeRestDiv.textContent);
        sessionStorage.setItem("timerDuration", remainingTime);
        sessionStorage.setItem("lastUpdatedTimestamp", Date.now());
        activeRestDiv.style.color = "#cbcbcb";
      }
    }
  }
  function resumeTimer() {
    const activeDivId = sessionStorage.getItem("activeRestDivId");
    const duration = parseInt(sessionStorage.getItem("timerDuration"));
    const lastUpdated = parseInt(sessionStorage.getItem("lastUpdatedTimestamp"));
    const now = Date.now();
  
    if (activeDivId && duration && lastUpdated) {
      const elapsed = Math.floor((now - lastUpdated) / 1000);
      const remainingTime = duration - elapsed;
  
      const restDiv = document.querySelector(`#${activeDivId}`);
      if (remainingTime <= 0) {
        completeTimer(restDiv);
      } else {
        activeRestDiv = restDiv;
        activeTimer = startTimer(remainingTime, restDiv);
      }
    }
  }

  // Start monitoring user absence
  function monitorUserActivity() {
    setInterval(() => {
      const lastUpdated = parseInt(sessionStorage.getItem("lastUpdatedTimestamp"));
      if (lastUpdated) {
        const now = Date.now();
        const elapsed = Math.floor((now - lastUpdated) / 1000);

        if (elapsed > 3 && activeRestDiv) {
          const remaining = parseInt(sessionStorage.getItem("timerDuration"));
          const timeRemaining = remaining - elapsed;
  
          if (timeRemaining <= 0) {
            completeTimer(activeRestDiv);
          } else {
            pauseTimer(); // Sync remaining time
            resumeTimer();
          }
        }
      }
    }, 1000);
  }

  function completeTimer(restDiv) {
    clearInterval(activeTimer);
    restDiv.innerHTML = "0m 0s rest";
    restDiv.style.color = "#CBCBCB";
    activeTimer = null;
    activeRestDiv = null;
    sessionStorage.removeItem("activeRestDivId");
    sessionStorage.removeItem("timerDuration");
    sessionStorage.removeItem("lastUpdatedTimestamp");
  }

  function hideCompleteButton(button) {

      // Hide the clicked element
      button.style.display = "none";
      //Get input section sibling to update the next set
      var setInputSection = button.closest("#inputSection");

      var nextInputSection = setInputSection.nextElementSibling;

      while (nextInputSection) {
        if (nextInputSection.id === "inputSection") {
          break;
        }
        nextInputSection = nextInputSection.nextElementSibling;
      }

      button.closest("#inputSection").querySelector("#reps").style.backgroundColor = "#0003FF";
      button.closest("#inputSection").querySelector("#reps").style.color = "white";
      button.closest("#inputSection").querySelector("#reps").placeholder = "";
      button.closest("#inputSection").querySelector("#weight").style.backgroundColor = "#0003FF";
      button.closest("#inputSection").querySelector("#weight").style.color = "white";
      button.closest("#inputSection").querySelector("#weight").placeholder = "";
      button.closest("#inputSection").querySelector("#setNumber").style.backgroundColor = "#0003FF";
      button.closest("#inputSection").querySelector("#setNumber").style.color = "white";

      if(nextInputSection) {
        if(nextInputSection.querySelector("#completedExercise").style.display != "block") {
          nextInputSection.querySelector("#completeExercise").style.display = "block";
        }
        
      }
      
      // Find the next sibling element with the id "completedExercise"
      const nextCompletedImage = button.nextElementSibling;

      if (nextCompletedImage && nextCompletedImage.id === "completedExercise") {
        nextCompletedImage.style.display = "block"; // Or any other display value you prefer
      }
  }

  async function updateExerciseDetails(exerciseID, exerciseName, inputValue, setNumber=null, type, inputArray) {
    MemberStack.onReady.then(async function(member) {  

      document.getElementById("startWorkout").innerText = "Continue Workout";

      var metadata = await member.getMetaData();

      //First check using exercise ID as the key
      var exerciseInfo = metadata[exerciseID];

      //If it is empty resort to exercise name as key
      if(exerciseInfo == undefined) {
        exerciseInfo = metadata[exerciseName];
      }

      if(exerciseInfo == undefined) {
        exerciseInfo = {"weight": [], "reps":[], "workouts":[], "guideName": exerciseName};
      }

      var updatedJSON = {};
      exerciseInfo["guideName"] = exerciseName;
      if(type == "reps") {
        
        exerciseInfo.reps = inputValue;
        updatedJSON = {[exerciseID] : exerciseInfo};

      } else {

        exerciseInfo.weight = inputValue;
        updatedJSON = {[exerciseID] : exerciseInfo};

      }

      await member.updateMetaData(updatedJSON);

    });
  }

}
