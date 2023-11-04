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

  //Add inputs for each exercise based on number of sets
  const inputList = document.getElementById("inputList").children;
  
  //Get and filter down full program to this exact workout
  const currentProgram = JSON.parse(sessionStorage.getItem("currentFullProgram"));

  weekToFilter = "";
  workoutName = "";
  weekWorkouts = "";
  currentWorkoutIndex = "";
  workoutInformation = "";
  
  if(fromProgram && currentProgram != undefined && currentProgram != null) {
    weekToFilter = "Week " + sessionStorage.getItem("currentWeekNumber");
    workoutName = document.querySelector(".workout-summary-header h1").innerHTML;
    weekWorkouts = currentProgram.filter(item => item.week === weekToFilter);

    currentWorkoutIndex = sessionStorage.getItem("workoutIndex");
    workoutInformation = weekWorkouts.filter(item => item.workoutNumber == currentWorkoutIndex && item.workoutName == workoutName);

  } 

  MemberStack.onReady.then(async function(member) {  

    if(fromProgram && member.loggedIn) {

      //Iterate through existing exercise list and change names
      for(var i = 0; i < inputList.length; i++) {
        var exerciseName = inputList[i].querySelector("#exerciseShortNameInput").innerText;
        
        for (const exercise of workoutInformation) {
          if(exercise.exercise.includes(exerciseName)) {
            inputList[i].querySelector("#exerciseShortNameInput").innerText = exercise.exercise;
            //inputList[i].querySelector("#exerciseShortNameInput").innerText = exercise.exercise;
            break;
          }
        }
      }

      var memberJSON = await member.getMetaData();

      for(var i = 0; i < inputList.length; i++) {

        var inputShortName = inputList[i].querySelector("#exerciseShortNameInput").innerText;
        const exerciseInformation = workoutInformation.filter(item => item.exercise.includes(inputShortName));

        //Get number of sets for that exercise
        const numberOfSets = exerciseInformation.length;

        //Get rest info for that exercise
        const restDiv = inputList[i].querySelector("#inputRest");
        var newRestDiv = restDiv.cloneNode(true);
        newRestDiv.style.display = "flex";

        //Get input section for cloning
        const inputSectionPlaceholder = inputList[i].querySelector("#inputSection");
        var exerciseInputSection = inputList[i].querySelector("#inputSectionBlock");
        const exerciseName = exerciseInputSection.querySelector("#exerciseNameInput").innerText;
        var weightInput = exerciseInputSection.querySelector("#weight");
        var repsInput = exerciseInputSection.querySelector("#reps");

        //Check if it is an empty filler exercise from god mode:
        if(exerciseInformation.length > 0 && exerciseInformation[0].exercise != "") {

          weightInput.addEventListener('blur', function(event) {
            const inputValue = event.target.value;
            if(!event.target.value.toLowerCase().includes(exerciseInformation[0].load.toLowerCase()) && event.target.value != "") {
              event.target.value = `${inputValue} ${exerciseInformation[0].load}`;
            }

            const exerciseBlock = event.target.closest("#inputSectionBlock");
            const exerciseName = exerciseBlock.querySelector("#exerciseNameInput");

            updateExerciseDetails(exerciseName.innerText, inputValue, 0, "weight");

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

            const exerciseBlock = event.target.closest("#inputSectionBlock");
            const exerciseName = exerciseBlock.querySelector("#exerciseNameInput");

            updateExerciseDetails(exerciseName.innerText, inputValue, 0, "reps");
            //Check if weight also has a value then auto complete set
            const updatedWeightInput = exerciseBlock.querySelector("#weight");
            if(updatedWeightInput != "") {
              exerciseBlock.querySelector("#completeExercise").click();
            }
          });

          var memberJSONExerciseName = memberJSON[exerciseName];

          if(memberJSONExerciseName != undefined) {
            if(memberJSONExerciseName.weight != undefined) {
              var arrayLength = memberJSONExerciseName.weight.length;
              
              if (arrayLength > 0 && memberJSONExerciseName.weight[arrayLength-1] != undefined && memberJSONExerciseName.weight[arrayLength-1].toLowerCase().includes(exerciseInformation[0].load.toLowerCase())) {
                weightInput.value = `${memberJSONExerciseName.weight[arrayLength-1]}`;
              } else if (arrayLength > 0 && memberJSONExerciseName.weight[arrayLength-1] != undefined) {
                weightInput.value = `${memberJSONExerciseName.weight[arrayLength-1]} ${exerciseInformation[0].load}`;
              }
            }

            if(memberJSONExerciseName.reps != undefined) {
              if(memberJSONExerciseName.reps.length > 0) {
                if (memberJSONExerciseName.reps[0].toLowerCase().includes(exerciseInformation[0].quantityUnit.toLowerCase())) {
                  repsInput.placeholder = `${memberJSONExerciseName.reps[0]}`;
                } else {
                  repsInput.placeholder = `${memberJSONExerciseName.reps[0]} ${exerciseInformation[0].quantityUnit}`;
                }
              }
              
            }
            
          }



          //Set placeholder of the first rep input text box for each exercise
          inputList[i].querySelector("#reps").placeholder = `${exerciseInformation[0].reps} ${exerciseInformation[0].quantityUnit}`;

          //Set value of notes
          inputList[i].querySelector("#notes").innerText = `${exerciseInformation[0].notes}`;

          //Check if load has inputs from PT
          if(exerciseInformation[0].loadAmount.toLowerCase() != "") {
            inputList[i].querySelector("#weight").value = `${exerciseInformation[0].loadAmount} ${exerciseInformation[0].load}`;
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
            newRepsInput.value = "";
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
                newWeightInput.value = `${exerciseInformation[j+1].loadAmount} ${exerciseInformation[j+1].load}`;
              }

              //Set rest
              newRestDiv.innerText = `${exerciseInformation[j+1].exerciseRestMinutes}m ${exerciseInformation[j+1].exerciseRestSeconds}s`;
            }
    
            newWeightInput.addEventListener('blur', function(event) {
              const inputValue = event.target.value;
              if(!event.target.value.toLowerCase().includes(exerciseInformation[j+1].load.toLowerCase()) && event.target.value != "") {
                event.target.value = `${inputValue} ${exerciseInformation[j+1].load}`;
              }
              const exerciseBlock = event.target.closest("#inputSectionBlock");
              const exerciseName = exerciseBlock.querySelector("#exerciseNameInput");
        
              updateExerciseDetails(exerciseName.innerText, inputValue, j+1, "weight");
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
        
              updateExerciseDetails(exerciseName.innerText, inputValue, j+1, "reps");
              const newUpdatedWeightInput = newInputSection.querySelector("#weight");

              //Check if weight also has a value then auto complete set
              if(newUpdatedWeightInput.value != "") {
                newInputSection.querySelector("#completeExercise").click();
              }
            });
            
            if(memberJSONExerciseName != undefined) {

              if(memberJSONExerciseName.weight != undefined) {
                if(memberJSONExerciseName.weight[j+1] != undefined) {
                  if (memberJSONExerciseName.weight[j+1].toLowerCase().includes(exerciseInformation[j+1].load.toLowerCase())) {
                    newWeightInput.value = `${memberJSONExerciseName.weight[j+1]}`;
                  } else {
                    newWeightInput.value = `${memberJSONExerciseName.weight[j+1]} ${exerciseInformation[j+1].load}`;
                  }

                }

              }

              if(memberJSONExerciseName.reps != undefined) {
                if(memberJSONExerciseName.reps.length > j+1) {
                  if (memberJSONExerciseName.reps[j+1].includes(exerciseInformation[j+1].quantityUnit.toLowerCase())) {
                    newRepsInput.placeholder = `${memberJSONExerciseName.reps[j+1]}`;
                  } else {
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

          hideCompleteButton(button);

          //Increment 'completed sets' counter
          completedSets += 1;

          if(completedSets == numberOfSets) {
            document.getElementById("finishWorkout").click;
          }

          if(workoutID != null || workoutID != "") {
            updateWorkoutDetails(completedExercisename, workoutID, (index)%3 + 1);
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
        exerciseList[i].querySelector("#repInput").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#setInput").innerText = flattenedArray[i].sets;
        exerciseList[i].querySelector("#setInput").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#restMinutes").innerText = 3;
        exerciseList[i].querySelector("#restMinutes").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#restSeconds").innerText = 0;
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

      } else {
        var baseURL = window.location.origin;
        window.location = baseURL + "/workouts/workout-navigation"

      }
      
    };

    //Set onclick for start button
    document.getElementById("startWorkout").onclick = () => {

      if(member.loggedIn) {
      
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
  if ((document.referrer == "" || sessionStorage.getItem("onlyFinish") == "true") && !fromProgram) {
    sessionStorage.setItem("onlyFinish", "true");
    document.getElementById("workoutNavigation").style.display = "none";
    document.getElementById("shareWorkout").style.display = "block";
  } else {
    sessionStorage.setItem("onlyFinish", "false");
  }

  //Setting destination of back button
  document.getElementById('backFromWorkout').onclick = function() {
    if(fromProgram) {
      const myProgramLink = document.getElementById("myProgram").href;
      window.location = myProgramLink;
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
      if(exerciseInformation[0].exercise != "") {

        exerciseList[i].querySelector("#repInput").innerText = exerciseInformation[0].reps;
        exerciseList[i].querySelector("#repInput").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#setInput").innerText = exerciseInformation.length;
        exerciseList[i].querySelector("#setInput").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#restMinutes").innerText = exerciseInformation[0].exerciseRestMinutes;
        exerciseList[i].querySelector("#restMinutes").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#restSeconds").innerText = exerciseInformation[0].exerciseRestSeconds;
        exerciseList[i].querySelector("#restSeconds").classList.remove("w-dyn-bind-empty");
        var loadingMechanism = exerciseList[i].querySelector("#exerciseLoadingMechanism").innerText;
        workoutExercises.push(`${shortName},${loadingMechanism}`);
      } else {

        exerciseList[i].querySelector("#repInput").innerText = exerciseInformation[0].reps;
        exerciseList[i].querySelector("#repInput").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#setInput").innerText = exerciseInformation.length;
        exerciseList[i].querySelector("#setInput").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#restMinutes").innerText = exerciseInformation[0].exerciseRestMinutes;
        exerciseList[i].querySelector("#restMinutes").classList.remove("w-dyn-bind-empty");
        exerciseList[i].querySelector("#restSeconds").innerText = exerciseInformation[0].exerciseRestSeconds;
        exerciseList[i].querySelector("#restSeconds").classList.remove("w-dyn-bind-empty");
        var loadingMechanism = exerciseList[i].querySelector("#exerciseLoadingMechanism").innerText;
        workoutExercises.push(`${shortName},${loadingMechanism}`);
      }
    } else {
      //Set default values
      exerciseList[i].querySelector("#repInput").innerText = 10;
      exerciseList[i].querySelector("#repInput").classList.remove("w-dyn-bind-empty");
      exerciseList[i].querySelector("#setInput").innerText = 3;
      exerciseList[i].querySelector("#setInput").classList.remove("w-dyn-bind-empty");
      exerciseList[i].querySelector("#restMinutes").innerText = 3;
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

  async function updateWorkoutDetails(exerciseName, workoutID, value) {
    MemberStack.onReady.then(async function(member) {  

      var metadata = await member.getMetaData();
      var exerciseInfo = metadata[exerciseName];

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

      const updatedJSON = {[exerciseName] : exerciseInfo};

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

  async function updateExerciseDetails(exerciseName, inputValue, setNumber=null, type) {
    MemberStack.onReady.then(async function(member) {  

      var metadata = await member.getMetaData();
      //Get info from exercise
      var exerciseInfo = metadata[exerciseName];

      if(exerciseInfo == undefined) {
        exerciseInfo = {"weight": [], "reps":[], "workouts":[]};
      }
 
      if(type == "reps") {
        //If no rep info recorded
        var repsArr = exerciseInfo.reps;

        if(repsArr == null) {
          //Reps array is empty so just put input value into array and update
          var exerciseRepsObj = [inputValue];
        } else {
          //There is rep info
          //Check if index in reps array exists first
          if(setNumber < repsArr.length) {
            repsArr[setNumber] = inputValue;
          } else {
            repsArr.push(inputValue)
          }
          var exerciseRepsObj = repsArr;
          
        }
        exerciseInfo.reps = exerciseRepsObj;
        
        const updatedJSON = {[exerciseName] : exerciseInfo};

        member.updateMetaData(updatedJSON);

      } else {

        //If no rep info recorded
        var weightArr = exerciseInfo.weight;

        if(weightArr == null) {
          //Reps array is empty so just put input value into array and update
          var exerciseRepsObj = [inputValue];
        } else {
          //There is rep info
          //Check if index in reps array exists first
          if(setNumber < weightArr.length) {
            weightArr[setNumber] = inputValue;
          } else {
            weightArr.push(inputValue)
          }

          var exerciseRepsObj = weightArr;
        }
          

        exerciseInfo.weight = exerciseRepsObj;
        const updatedJSON = {[exerciseName] : exerciseInfo};

        member.updateMetaData(updatedJSON);
      }

    });
  }

}
