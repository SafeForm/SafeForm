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

  //Add workout flag to guide links
  var exerciseLinks = document.querySelectorAll("#exerciseInfo, #guideLink");
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
    
    var metadata = await member.getMetaData();

    if(member.memberPage) {
      document.getElementById("home").href = window.location.origin + `/${member.memberPage}`;
    }

    var currentProgram = {
      [sessionStorage.getItem("programID")]: sessionStorage.getItem("currentWeekNumber"),
      ["currentProgram"]: sessionStorage.getItem("programID")
    }

    await member.updateMetaData(currentProgram);
    

    if((fromChallenge || fromProgram) && member.loggedIn && currentProgram) {

      //Get load measurement unit
      if(member.weightunit) {
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

      var memberJSON = await member.getMetaData();

      for(var i = 0; i < inputList.length; i++) {
        var inputGuideID = inputList[i].querySelector("#exerciseItemID").innerText;
        var exerciseFullName = inputList[i].querySelector("#exerciseShortNameInput").innerText;

        var exerciseInformation = [];
        if(fromChallenge) {
          const flattenedArray = [].concat(...workoutInformation[0].workoutJSON);
          exerciseInformation = flattenedArray.filter(item => item.guideID && item.guideID.includes(inputGuideID));

          const newArray = [];

          // Iterate over exercises array and construct new objects
          exerciseInformation[0].exercises.forEach((exercise, index) => {
            
            newArray.push({
              "exercise": exerciseInformation[0].exerciseName,
              "reps": exercise.reps,
              "load": exercise.measure,
              "loadAmount": exercise.loadAmount,
              "exerciseRestMinutes": exercise.exerciseRestMinutes,
              "exerciseRestSeconds": exercise.exerciseRestSeconds,
              "quantityUnit": exercise.quantityUnit,
              "notes": exerciseInformation[0].exerciseNotes,
              "setNumber": index,
              "guideID": exerciseInformation[0].guideID,
              "uniqueWorkoutID": exerciseInformation[0].uniqueWorkoutID
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
  
              if(exerciseInformation[0].load.toLowerCase() == "kg") {
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
                  if(exerciseInformation[0].load.toLowerCase() == "kg") {
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
            // Get the rest time from the div and parse it
            let restDiv = button.closest("#inputSection").nextElementSibling;
            if(restDiv) {
              let restTime = parseTime(restDiv.textContent);
  
              // Start the timer with the parsed rest time
              startTimer(restTime, restDiv);
            }

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

          // Get the rest time from the div and parse it
          let restDiv = button.closest("#inputSection").nextElementSibling;
          if(restDiv && !button.classList.contains("pre-complete")) {
            let restTime = parseTime(restDiv.textContent);

            // Start the timer with the parsed rest time
            startTimer(restTime, restDiv);
          }


          //Increment 'completed sets' counter
          completedSets += 1;

          if(completedSets == numberOfSets) {
            document.getElementById("finishWorkout").click;
          }

          if((workoutID != null || workoutID != "") && !button.classList.contains("pre-complete")) {
            var workoutIDUnique = workoutID.split("+");

            if(workoutIDUnique.length > 0) {
              workoutIDUnique = workoutIDUnique[0];
              updateWorkoutDetails(completedExerciseID, completedExercisename, workoutIDUnique, (index)%3 + 1);
            } else {
              updateWorkoutDetails(completedExerciseID, completedExercisename, workoutID, (index)%3 + 1);
            }
            
          }
          
        });

        if(button.classList.contains("pre-complete")) {
          button.click();
        }

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
        if(flattenedArray[i].exercises[0].exerciseRestSeconds == 0) {
          flattenedArray[i].exercises[0].exerciseRestSeconds = "00";
        }
        exerciseList[i].querySelector("#restMinutes").innerText = `${flattenedArray[i].exercises[0].exerciseRestMinutes}:${flattenedArray[i].exercises[0].exerciseRestSeconds}`;
        exerciseList[i].querySelector("#restMinutes").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#exerciseNotes").innerText = flattenedArray[i].exerciseNotes;

       }

    }

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
            [workoutID]: "true"
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


        localStorage.setItem("completedWorkout", workoutID)

      } else {
        var baseURL = window.location.origin;
        window.location = baseURL + "/workouts/workout-navigation"

      }
      
    };

    //Set onclick for start button
    document.getElementById("startWorkout").onclick = () => {

      localStorage.setItem("startedWorkout", uniqueWorkoutID);

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

    if(localStorage.getItem("startedWorkout") == uniqueWorkoutID) {
      document.getElementById("startWorkout").click();
    }


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

  //If coming direct to site, only show finish button
  if ((document.referrer == "" || sessionStorage.getItem("onlyFinish") == "true") || (!fromProgram && !currentProgram)) {
    sessionStorage.setItem("onlyFinish", "true");
    document.getElementById("workoutNavigation").style.display = "none";
  } else {
    sessionStorage.setItem("onlyFinish", "false");
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

  var workoutExercises = [];
  //Get all workout names and store them
  var duplicateGuides = [];
  var duplicateExerciseNames = [];
  for(var i = 0; i < exerciseList.length; i++) {
    //Set reps input
    var shortName = exerciseList[i].querySelector("#exerciseShortName").innerText;
    var guideID = exerciseList[i].querySelector("#workoutExerciseItemID").innerText;
    var fullExerciseName = "";

    if(workoutInformation != "") {
      for (const exercise of workoutInformation) {
        if(exercise.guideID == guideID) {
          if(!duplicateGuides.includes(guideID) || !duplicateExerciseNames.includes(exercise.exercise)) {
            exerciseList[i].querySelector("#exerciseShortName").innerText = exercise.exercise;
            fullExerciseName = exercise.exercise;
            duplicateGuides.push(guideID);
            duplicateExerciseNames.push(exercise.exercise)
            break;
          } 

        }
      }
      var exerciseInformation = [];
      if(fullExerciseName != "") {
        exerciseInformation = workoutInformation.filter(item => item.guideID == guideID && item.exercise == fullExerciseName);
      } else {
        exerciseInformation = workoutInformation.filter(item => item.guideID == guideID );
      }


       
      if(fromChallenge) {
        const flattenedArray = [].concat(...workoutInformation[0].workoutJSON);
        exerciseInformation = flattenedArray.filter(item => item.guideID == guideID);

        const newArray = [];
        // Iterate over exercises array and construct new objects
        exerciseInformation[0].exercises.forEach((exercise, index) => {
          newArray.push({
            "exercise": exerciseInformation[0].exerciseName,
            "reps": exercise.reps,
            "load": exercise.measure,
            "loadAmount": exercise.loadAmount,
            "exerciseRestMinutes": exercise.exerciseRestMinutes,
            "exerciseRestSeconds": exercise.exerciseRestSeconds,
            "quantityUnit": exercise.quantityUnit,
            "notes": exerciseInformation[0].exerciseNotes,
            "setNumber": index,
            "guideID": exerciseInformation[0].guideID,
            "uniqueWorkoutID": exerciseInformation[0].uniqueWorkoutID
          });
        });

        exerciseInformation = newArray
      } 

      //Check if it is an empty filler exercise from god mode:
      if(exerciseInformation.length > 0 && exerciseInformation[0].exercise != "") {

        //Another if to check if the exercise is bodyweight
        if(checkBodyWeight(exerciseList[i])) {

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
          //exerciseList[i].querySelector("#load").innerText = `${minLoad}-${maxLoad} ${exerciseInformation[0].load}`;
          exerciseList[i].querySelector("#load").innerText = `${minLoad} ${exerciseInformation[0].load}`;
        }

        //Another if to check if the exercise is bodyweight
        if(checkEmptyQuantity(exerciseInformation)) {
          //Check if there is no quantity amount
          exerciseList[i].querySelector("#quantityUnit").innerText = "-";
          exerciseList[i].querySelector("#quantityUnit").closest("#quantityParent").style.display = "none";
          
          //Show RPE
          var hiddenInfo = exerciseList[i].querySelector(".hidden-exercise-info");
          hiddenInfo.classList.remove("hidden-exercise-info");
          hiddenInfo.classList.add("exercise-info");


        } else if(checkSameQuantityUnit(exerciseInformation)) {
          //Another if to check if the amounts are the same - 'amount unit.. 12 Reps'
          exerciseList[i].querySelector("#repInput").innerText = `${exerciseInformation[0].reps}`;
          exerciseList[i].querySelector("#quantityUnit").innerText = "\u00A0" + `${exerciseInformation[0].quantityUnit}`;
        } else {
          //Another if statement to check if there is a range - 'amount range unit.. 12-15 Kg' 
          var minLoad = getQuantityAmountMin(exerciseInformation)
          var maxLoad = getQuantityAmountMax(exerciseInformation)
          //exerciseList[i].querySelector("#repInput").innerText = `${minLoad}-${maxLoad}`;
          exerciseList[i].querySelector("#repInput").innerText = `${minLoad}`;
          exerciseList[i].querySelector("#quantityUnit").innerText = "\u00A0" + `${exerciseInformation[0].quantityUnit}`;
        }

        if(exerciseInformation[0].exerciseRestSeconds == 0) {
          exerciseInformation[0].exerciseRestSeconds = "00";
        }

        exerciseList[i].querySelector("#restMinutes").innerText = `${exerciseInformation[0].exerciseRestMinutes}:${exerciseInformation[0].exerciseRestSeconds}`;

        exerciseList[i].querySelector("#exerciseNotes").innerText = exerciseInformation[0].notes

        exerciseList[i].querySelector("#repInput").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#setInput").innerText = exerciseInformation.length;
        exerciseList[i].querySelector("#setInput").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#setInput").classList.remove("w-dyn-bind-empty");
        
        var loadingMechanism = exerciseList[i].querySelector("#exerciseLoadingMechanism").innerText;
        workoutExercises.push(`${shortName},${loadingMechanism}`);
      } else {
        
        if(exerciseInformation.length > 0) {
          exerciseList[i].querySelector("#repInput").innerText = exerciseInformation[0].reps;
          if(exerciseInformation[0].exerciseRestSeconds == 0) {
            exerciseInformation[0].exerciseRestSeconds = "00";
          }
          exerciseList[i].querySelector("#restMinutes").innerText = `${exerciseInformation[0].exerciseRestMinutes}:${exerciseInformation[0].exerciseRestSeconds}`;
          exerciseList[i].querySelector("#setInput").innerText = exerciseInformation.length;
          exerciseList[i].querySelector("#exerciseNotes").innerText = exerciseInformation[0].notes
        } else {
          exerciseList[i].querySelector("#setInput").innerText = 3;
          exerciseList[i].querySelector("#repInput").innerText = 12;
          exerciseList[i].querySelector("#restMinutes").innerText = "2:00";
          exerciseList[i].querySelector("#exerciseNotes").innerText = "";
        }
        
        exerciseList[i].querySelector("#repInput").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#setInput").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#restMinutes").classList.remove("w-dyn-bind-empty");
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
      newDiv.style.boxShadow = "0 4px 4px 0px rgba(0, 0, 0, 0.25)";
      const supersetText = document.createElement('div');
      supersetText.innerText = "Superset";
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
        listOfExercises[exerciseCount].querySelector("#exerciseInfo").style.boxShadow = "0 0px 0px 0px rgba(0, 0, 0, 0)";
        listOfExercises[exerciseCount].querySelector("#exerciseInfo").style.marginBottom = 0;
        listOfExercises[exerciseCount].querySelector("#exerciseInfo").style.marginTop = 0;

        inputListExercises[exerciseCount].querySelector("#inputSectionBlock").style.border = "none";
        inputListExercises[exerciseCount].querySelector("#inputSectionBlock").style.boxShadow = "0 0px 0px 0px rgba(0, 0, 0, 0)";
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
    let minutes = parseInt(timeParts[0].replace("m", ""));
    let seconds = parseInt(timeParts[1].replace("s", ""));
    return minutes * 60 + seconds;
  }

  function startTimer(initialTime, restDiv) {
    let timeRemaining = initialTime;
    let timerInterval = setInterval(() => {
    restDiv.style.color = "black";
    if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        restDiv.innerHTMl = "<br>";
        restDiv.style.color = "#CBCBCB";
    } else {
        timeRemaining--;
        // Update the div content with the remaining time
        let minutes = Math.floor(timeRemaining / 60);
        let seconds = timeRemaining % 60;
        restDiv.textContent = `${minutes}m ${seconds}s`;
    }
    }, 1000);
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

      //Style outside div
      button.closest("#inputSection").style.backgroundColor = "#DBDAFF";
      button.closest("#inputSection").style.borderColor = "#0C08D5";

      button.closest("#inputSection").querySelector("#reps").style.borderColor = "#0C08D5";
      button.closest("#inputSection").querySelector("#weight").style.borderColor = "#0C08D5";

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
