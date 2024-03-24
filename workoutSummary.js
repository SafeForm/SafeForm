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

  //Add workout flag to guide links
  const exerciseLinks = document.querySelectorAll("#exerciseInfo");
  for(var i = 0; i < exerciseLinks.length; i++) {
    exerciseLinks[i].href += "?isWorkout=true";
  }

  //Hide the first exercise breaker of the exercise list
  const exerciseList = document.getElementById("listOfExercises").children;

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

  if(fromProgram && currentProgram != undefined && currentProgram != null) {
    weekToFilter = "Week " + sessionStorage.getItem("currentWeekNumber");
    workoutName = document.querySelector(".workout-summary-header h1").innerText;
    fullWorkoutID = document.getElementById("workoutItemID").innerText; 
    weekWorkouts = currentProgram.filter(item => item.week === weekToFilter);

    currentWorkoutIndex = sessionStorage.getItem("workoutIndex");
    var isWorkoutNumberInt = false;
    weekWorkouts.forEach(function(weekWorkout) {
      if(typeof weekWorkout.workoutNumber == 'number') {
        isWorkoutNumberInt = true;
      }
    });

    if(isWorkoutNumberInt) {

      //First try filter with workout ID
      workoutInformation = weekWorkouts.filter(item => item.workoutNumber == currentWorkoutIndex && item.workoutID == fullWorkoutID);

      if(workoutInformation.length == 0) {
        //If not then filter with workout name
        workoutInformation = weekWorkouts.filter(item => item.workoutNumber == currentWorkoutIndex && item.workoutName == workoutName);
      }
    } else {
      workoutInformation = weekWorkouts.filter(item => item.workoutNumber.replace('workout ', '') == currentWorkoutIndex && item.workoutID == fullWorkoutID);
      if(workoutInformation.length == 0) {
        workoutInformation = weekWorkouts.filter(item => item.workoutNumber.replace('workout ', '') == currentWorkoutIndex && item.workoutName == workoutName);
        
      }

    }

    //Extract guideIDs from workoutInformation
    const uniqueGuideIDs = [...new Set(workoutInformation.map(item => item.guideID))];

    //Compare to listOfExercises > workoutExerciseItemID and remove if not in there
    const listOfExercises = document.querySelectorAll("#listOfExercises .w-dyn-item");

    listOfExercises.forEach(item => {
      const workoutExerciseItemID = item.querySelector("#workoutExerciseItemID").innerText;
      if (uniqueGuideIDs.length > 0 && !uniqueGuideIDs.includes(workoutExerciseItemID)) {
        //item.parentNode.removeChild(item);
      }
    });
    
    //Repeat same process for input list
    inputList.forEach(item => {
      const inputExerciseItemID = item.querySelector("#exerciseItemID").innerText;

      if (uniqueGuideIDs.length > 0 && !uniqueGuideIDs.includes(inputExerciseItemID)) {
        //item.parentNode.removeChild(item);
      }
    });

  } 

  MemberStack.onReady.then(async function(member) {  

    if(member.memberPage) {
      document.getElementById("home").href = window.location.origin + `/${member.memberPage}`;
    }

    if(fromProgram && member.loggedIn && currentProgram) {

      //Get load measurement unit
      if(member.weightunit) {
        loadUnit = member.weightunit;
      }

      if(!loadUnit && localStorage.getItem("weightUnit")) {
        loadUnit = localStorage.getItem("weightUnit");
      } 

      //Iterate through existing exercise list and change names
      for(var i = 0; i < inputList.length; i++) {
        var exerciseName = inputList[i].querySelector("#exerciseShortNameInput").innerText;
        var exerciseID = inputList[i].querySelector("#exerciseItemID").innerText;

        for (const exercise of workoutInformation) {
          if(exercise.exercise.includes(exerciseName)) {
            inputList[i].querySelector("#exerciseShortNameInput").innerText = exercise.exercise;
            break;
          }
        }
      }

      var memberJSON = await member.getMetaData();

      for(var i = 0; i < inputList.length; i++) {
        var inputGuideID = inputList[i].querySelector("#exerciseItemID").innerText;

        const exerciseInformation = workoutInformation.filter(item => item.guideID && item.guideID.includes(inputGuideID));

        //Get number of sets for that exercise
        var numberOfSets = exerciseInformation.length;
        if(numberOfSets == 0) {
          numberOfSets = 3;
        }

        //Get rest info for that exercise
        const restDiv = inputList[i].querySelector("#inputRest");
        var newRestDiv = restDiv.cloneNode(true);
        newRestDiv.style.display = "flex";

        //Get input section for cloning
        const inputSectionPlaceholder = inputList[i].querySelector("#inputSection");
        var exerciseInputSection = inputList[i].querySelector("#inputSectionBlock");
        const exerciseName = exerciseInputSection.querySelector("#exerciseNameInput").innerText;
        const exerciseID = exerciseInputSection.querySelector("#exerciseItemID").innerText;

        var weightInput = exerciseInputSection.querySelector("#weight");
        var repsInput = exerciseInputSection.querySelector("#reps");

        //Check if it is an empty filler exercise from god mode:
        if(exerciseInformation.length > 0 && exerciseInformation[0].exercise != "") {

          weightInput.addEventListener('blur', function(event) {
            const inputValue = event.target.value;
            
            if(!event.target.value.toLowerCase().includes(loadUnit.toLowerCase()) && event.target.value != "") {
              event.target.value = `${inputValue} ${loadUnit}`;
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
            if(!event.target.value.toLowerCase().includes(exerciseInformation[0].quantityUnit.toLowerCase()) && event.target.value != "") {
              event.target.value = `${inputValue} ${exerciseInformation[0].quantityUnit}`;
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
          inputList[i].querySelector("#reps").placeholder = `${exerciseInformation[0].reps} ${exerciseInformation[0].quantityUnit}`;

          //Set value of notes
          inputList[i].querySelector("#notes").innerText = `${exerciseInformation[0].notes}`;

          //Check if load has inputs from PT
          if(exerciseInformation[0].loadAmount.toLowerCase() != "") {
            
            if(exerciseInformation[0].load.toLowerCase() == loadUnit.toLowerCase()) {
              inputList[i].querySelector("#weight").placeholder = `${exerciseInformation[0].loadAmount} ${exerciseInformation[0].load.toLowerCase()}`;
              document.querySelectorAll("#load")[i].innerText = `${exerciseInformation[0].loadAmount} ${exerciseInformation[0].load.toLowerCase()}`;
            } else {
              if(loadUnit.toLowerCase() == "kg") {
                //We need to convert from lbs to kg
                inputList[i].querySelector("#weight").placeholder = `${lbsToKg(exerciseInformation[0].loadAmount)} ${loadUnit}`;
                document.querySelectorAll("#load")[i].innerText = `${lbsToKg(exerciseInformation[0].loadAmount)} ${loadUnit}`;
              } else {
                
                inputList[i].querySelector("#weight").placeholder = `${kgToLbs(exerciseInformation[0].loadAmount)} ${loadUnit}`;
                document.querySelectorAll("#load")[i].innerText = `${kgToLbs(exerciseInformation[0].loadAmount)} ${loadUnit}`;
              }
            }
          }

          var memberJSONExerciseName = memberJSON[exerciseID];

          if(memberJSONExerciseName == undefined) {
            memberJSONExerciseName = memberJSON[exerciseName];
          }
          const summaryWeightLoad = document.querySelectorAll("#load");

          if(memberJSONExerciseName != undefined) {
            
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
          inputList[i].querySelector("#inputRest").innerText = `${exerciseInformation[0].exerciseRestMinutes}m ${exerciseInformation[0].exerciseRestSeconds}s`;
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

            const completeButton = newInputSection.querySelector("#completeExercise");
            completeButton.style.display = "none";

            //Check if it is an empty filler exercise from god mode:
            if(exerciseInformation.length > 0 && exerciseInformation[j+1] && exerciseInformation[j+1].exercise != "") {
              //Set quantity/reps field
              newRepsInput.placeholder = `${exerciseInformation[j+1].reps} ${exerciseInformation[j+1].quantityUnit}`

              //Set weight field if exists
              //Check if load has inputs from PT
              if(exerciseInformation[0].loadAmount.toLowerCase() != "") {
                if(exerciseInformation[j+1].load.toLowerCase() == loadUnit.toLowerCase()) {
                  newWeightInput.placeholder = `${exerciseInformation[j+1].loadAmount} ${exerciseInformation[j+1].load}`;
                } else {
                  if(loadUnit.toLowerCase() == "kg") {
                    //We need to convert from lbs to kg
                    newWeightInput.placeholder = `${lbsToKg(exerciseInformation[j+1].loadAmount)} ${loadUnit}`;
                  } else {
                    newWeightInput.placeholder = `${kgToLbs(exerciseInformation[j+1].loadAmount)} ${loadUnit}`;
                  }

                }
              }

              //Set rest
              newRestDiv.innerText = `${exerciseInformation[j+1].exerciseRestMinutes}m ${exerciseInformation[j+1].exerciseRestSeconds}s`;
            }
    
            newWeightInput.addEventListener('blur', function(event) {
              const inputValue = event.target.value;
              if(!event.target.value.toLowerCase().includes(loadUnit.toLowerCase()) && event.target.value != "") {
                event.target.value = `${inputValue} ${loadUnit}`;
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

              if(!event.target.value.toLowerCase().includes(exerciseInformation[j+1].quantityUnit.toLowerCase()) && event.target.value != "") {
                event.target.value = `${inputValue} ${exerciseInformation[j+1].quantityUnit}`;
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
                  if (memberJSONExerciseName.reps[j+1].includes(exerciseInformation[j+1].quantityUnit.toLowerCase())) {
                    newRepsInput.placeholder = `${memberJSONExerciseName.reps[j+1]}`;
                  } else if(memberJSONExerciseName.reps[j+1] != "") {
                    newRepsInput.placeholder = `${memberJSONExerciseName.reps[j+1]} ${exerciseInformation[j+1].quantityUnit}`;
                  }
                } 
              }
            } 

            if(j < numberOfSets - 1) {
              exerciseInputSection.appendChild(newRestDiv);
            }
            
            exerciseInputSection.appendChild(newInputSection);

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
          if((index%3 + 1) <= numCompletedSets) {

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

          //Increment 'completed sets' counter
          completedSets += 1;

          if(completedSets == numberOfSets) {
            document.getElementById("finishWorkout").click;
          }

          if(workoutID != null || workoutID != "") {
            updateWorkoutDetails(completedExerciseID, completedExercisename, workoutID, (index)%3 + 1);
          }
          
        });

      });

    } else {
      //User not signed in or not coming from program
      document.getElementById("summarySwitch").style.display = "none";

      var workoutJSON = JSON.parse(document.getElementById("workoutJSON").innerText);
      
      const flattenedArray = [].concat(...workoutJSON);
      const exerciseList = document.querySelectorAll("#listOfExercises .w-dyn-item");

      //Fill workout list with values from workout json
       //Iterate through existing exercise list and change names
       for(var i = 0; i < exerciseList.length; i++) {
        exerciseList[i].querySelector("#repInput").innerText = flattenedArray[i].exercises[0].reps;
        exerciseList[i].querySelector("#quantityUnit").innerText = "\u00A0" + flattenedArray[i].exercises[0].quantityUnit;
        exerciseList[i].querySelector("#repInput").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#setInput").innerText = flattenedArray[i].sets;
        exerciseList[i].querySelector("#setInput").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#restMinutes").innerText = flattenedArray[i].exercises[0].exerciseRestMinutes;
        exerciseList[i].querySelector("#restMinutes").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#restSeconds").innerText = flattenedArray[i].exercises[0].exerciseRestSeconds;
        exerciseList[i].querySelector("#restSeconds").classList.remove("w-dyn-bind-empty");
       }

    }

    document.getElementById("finishWorkout").onclick = async () => {
      
      if(member.loggedIn) {
        //Get user metadata
        memberJSON = await member.getMetaData();

        //Get program JSON and modify it to include the new workout id
        const userProgram = JSON.parse(sessionStorage.getItem("currentProgram"));
        const workoutIndex = sessionStorage.getItem("workoutIndex");
        const workoutID = sessionStorage.getItem("currentWorkout");
        var workoutObj = {};
        workoutObj["memberJSON"] = JSON.stringify(memberJSON);
        workoutObj["member"] = member;
        workoutObj["programName"] = sessionStorage.getItem("programName");
        workoutObj["programID"] = sessionStorage.getItem("programID");
        if(userProgram != null) {

          userProgram[0].events[[workoutIndex]]["extendedProps"]["completedID"] = workoutID;
          
          workoutObj["userProgram"] = JSON.stringify(userProgram);

        } 

        sendWorkoutDetailsToMake(workoutObj);

        localStorage.setItem("completedWorkout", workoutID)

      } else {
        var baseURL = window.location.origin;
        window.location = baseURL + "/workouts/workout-navigation"

      }
      
    };

    //Set onclick for start button
    document.getElementById("startWorkout").onclick = () => {

      if(currentProgram && member.loggedIn) {
      
        document.getElementById("workoutInput").click();

        document.getElementById("workoutNavigation").style.display = "none";
        
        if(document.getElementById("shareWorkout").style.display != "block") {
          document.getElementById("finishWorkoutDiv").style.display = "block";
        }
        
      } else {

        document.getElementById("workoutNavigation").style.display = "none";
  
        if(document.getElementById("shareWorkout").style.display != "block") {
          document.getElementById("finishWorkoutDiv").style.display = "block";
        }
      }

    };


  });

  //Check if there is no gym filter
  if (utm_campaign != null && utm_campaign != "utm_campaign") {
    localStorage.setItem('gym_name', utm_campaign);
    //Find all links on the page and add utm parameter for future filtering
    var pageLinks = document.querySelectorAll("a");
    for(var i = 0; i < pageLinks.length; i++) {
      if(pageLinks[i].id != "shareLink" && pageLinks[i].id != "closeMenu" && pageLinks[i].id != "clearFilters") {
        pageLinks[i].href = pageLinks[i].href += `?utm_campaign=${utm_campaign}`;
      } else if (pageLinks[i].id == "clearFilters") {
        pageLinks[i].href = pageLinks[i].href;
      }
    }
  }

  //If coming direct to site, only show finish button
  if ((document.referrer == "" || sessionStorage.getItem("onlyFinish") == "true") || (!fromProgram && !currentProgram)) {
    sessionStorage.setItem("onlyFinish", "true");
    document.getElementById("workoutNavigation").style.display = "none";
    document.getElementById("shareWorkout").style.display = "block";
  } else {
    sessionStorage.setItem("onlyFinish", "false");
  }

  if(fromFreeProgram) {
    document.getElementById("startWorkout").style.display = "none"
  }

  //Setting destination of back button
  document.getElementById('backFromWorkout').onclick = function() {
    if(fromProgram) {
      const myProgramLink = document.getElementById("myProgram").href;
      window.location = myProgramLink;
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

  var workoutExercises = [];
  //Get all workout names and store them
  var duplicateGuides = [];
  var duplicateExerciseNames = [];
  for(var i = 0; i < exerciseList.length; i++) {
    //Set reps input
    var shortName = exerciseList[i].querySelector("#exerciseShortName").innerText;
    var guideID = exerciseList[i].querySelector("#workoutExerciseItemID").innerText;

    if(workoutInformation != "") {
      for (const exercise of workoutInformation) {
        if(exercise.guideID == guideID) {
          if(!duplicateGuides.includes(guideID) || !duplicateExerciseNames.includes(exercise.exercise)) {
            exerciseList[i].querySelector("#exerciseShortName").innerText = exercise.exercise;
            duplicateGuides.push(guideID);
            duplicateExerciseNames.push(exercise.exercise)
            break;
          } 

        }
      }

      const exerciseInformation = workoutInformation.filter(item => item.guideID == guideID);

      //Check if it is an empty filler exercise from god mode:
      if(exerciseInformation.length > 0 && exerciseInformation[0].exercise != "") {

        //Hide rest div
        exerciseList[i].querySelector("#restDiv").style.display = "none";

        //Another if to check if the exercise is bodyweight
        if(checkBodyWeight(exerciseList[i])) {
          exerciseList[i].querySelector("#load").innerText = "Bodyweight";
        } else if(checkSameLoadAmount(exerciseInformation) ) {
          //Another if to check if the amounts are the same - 'amount unit.. 12 Kg' 
          
          if(exerciseInformation[0].load.toLowerCase() == loadUnit.toLowerCase() ) {
            exerciseList[i].querySelector("#load").innerText = `${exerciseInformation[0].loadAmount} ${exerciseInformation[0].load}`;
          } else {
            if(exerciseInformation[0].loadAmount != "") {
              if(loadUnit.toLowerCase() == "kg") {
                //We need to convert from lbs to kg
                exerciseList[i].querySelector("#load").innerText = `${lbsToKg(exerciseInformation[0].loadAmount)} ${loadUnit}`;
              } else {
                exerciseList[i].querySelector("#load").innerText = `${kgToLbs(exerciseInformation[0].loadAmount)} ${loadUnit}`;
              }
            }

          }

        } else {
          //Another if statement to check if there is a range - 'amount range unit.. 12-15 Kg' 
          var minLoad = getLoadAmountMin(exerciseInformation)
          var maxLoad = getLoadAmountMax(exerciseInformation)
          exerciseList[i].querySelector("#load").innerText = `${minLoad}-${maxLoad} ${exerciseInformation[0].load}`;
        }

        //Another if to check if the exercise is bodyweight
        if(checkEmptyQuantity(exerciseInformation)) {
          //Check if there is no quantity amount
          exerciseList[i].querySelector("#quantityUnit").innerText = "-";
          exerciseList[i].querySelector("#quantityUnit").closest("#quantityParent").style.display = "none";
        } else if(checkSameQuantityUnit(exerciseInformation)) {
          //Another if to check if the amounts are the same - 'amount unit.. 12 Reps'
          exerciseList[i].querySelector("#repInput").innerText = `${exerciseInformation[0].reps}`;
          exerciseList[i].querySelector("#quantityUnit").innerText = "\u00A0" + `${exerciseInformation[0].quantityUnit}`;
        } else {
          //Another if statement to check if there is a range - 'amount range unit.. 12-15 Kg' 
          var minLoad = getQuantityAmountMin(exerciseInformation)
          var maxLoad = getQuantityAmountMax(exerciseInformation)
          exerciseList[i].querySelector("#repInput").innerText = `${minLoad}-${maxLoad}`;
          exerciseList[i].querySelector("#quantityUnit").innerText = "\u00A0" + `${exerciseInformation[0].quantityUnit}`;
        }
        
        exerciseList[i].querySelector("#repInput").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#setInput").innerText = exerciseInformation.length;
        exerciseList[i].querySelector("#setInput").classList.remove("w-dyn-bind-empty");

        var loadingMechanism = exerciseList[i].querySelector("#exerciseLoadingMechanism").innerText;
        workoutExercises.push(`${shortName},${loadingMechanism}`);
      } else {
        //Hide rest div
        exerciseList[i].querySelector("#weightDiv").style.display = "none";
        if(exerciseInformation.length > 0) {
          exerciseList[i].querySelector("#repInput").innerText = exerciseInformation[0].reps;
          exerciseList[i].querySelector("#restMinutes").innerText = exerciseInformation[0].exerciseRestMinutes;
          exerciseList[i].querySelector("#restSeconds").innerText = exerciseInformation[0].exerciseRestSeconds;
          exerciseList[i].querySelector("#setInput").innerText = exerciseInformation.length;
        } else {
          exerciseList[i].querySelector("#setInput").innerText = 3;
          exerciseList[i].querySelector("#repInput").innerText = 12;
          exerciseList[i].querySelector("#restMinutes").innerText = 2;
          exerciseList[i].querySelector("#restSeconds").innerText = 0;
        }
        
        exerciseList[i].querySelector("#repInput").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#setInput").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#restMinutes").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#restSeconds").classList.remove("w-dyn-bind-empty");
        var loadingMechanism = exerciseList[i].querySelector("#exerciseLoadingMechanism").innerText;
        workoutExercises.push(`${shortName},${loadingMechanism}`);
      }
    } else {

      //Set default values
      //Hide rest div
      exerciseList[i].querySelector("#weightDiv").style.display = "none";
      exerciseList[i].querySelector("#repInput").innerText = 10;
      exerciseList[i].querySelector("#repInput").classList.remove("w-dyn-bind-empty");
      exerciseList[i].querySelector("#setInput").innerText = 3;
      exerciseList[i].querySelector("#setInput").classList.remove("w-dyn-bind-empty");
      exerciseList[i].querySelector("#restMinutes").innerText = 2;
      exerciseList[i].querySelector("#restMinutes").classList.remove("w-dyn-bind-empty");
      exerciseList[i].querySelector("#restSeconds").innerText = 0;
      exerciseList[i].querySelector("#restSeconds").classList.remove("w-dyn-bind-empty");
    }

  }

  document.addEventListener('click', function (event) {

    if(event.target.id == "shareLink" || event.target.id == "shareImage") {

      const shareData = {
        title: 'BeneFit Workout',
        text: 'Try out my latest workout called {{wf {&quot;path&quot;:&quot;short-name&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}!',
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
    
    if(exercise.length > 1) {

      // Create a new div with styling
      const newDiv = document.createElement('div');
      newDiv.classList.add('exercise-list-item-superset');
      newDiv.style.borderRadius = '8px';
      newDiv.style.marginBottom = '10px';
      newDiv.style.border = '2px solid #CBCBCB';
      newDiv.style.backgroundColor = "white";
      newDiv.style.display = "flex";
      newDiv.style.flexDirection = "column";
      newDiv.style.alignItems = "center";
      const supersetText = document.createElement('div');
      supersetText.innerText = "Superset";

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
      const programPageLink = document.getElementById("myProgram").href;
      window.location = programPageLink;

      
    })
    .catch((error) => {
      const programPageLink = document.getElementById("myProgram").href;
      window.location = programPageLink;
    });
  }

  async function updateWorkoutDetails(exerciseID, exerciseName, workoutID, value) {
    MemberStack.onReady.then(async function(member) {  

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
        exerciseInfo = {"weight": [], "reps":[], "workouts": workoutsMap};
      } else if(exerciseInfo.workouts == null) {
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
