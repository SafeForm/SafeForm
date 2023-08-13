
if (document.readyState !== 'loading') {
  if(devModeFlag != null) {
    mainFuncLocal();
  }
} else {
  document.addEventListener('DOMContentLoaded', function () {
  if(devModeFlag != null) {
    mainFuncLocal();
  }
  });
}

function mainFuncLocal() {

  //Add inputs for each exercise based on number of sets
  const inputList = document.getElementById("inputList").children;

  MemberStack.onReady.then(async function(member) {  

    if(member.loggedIn) {

      var memberJSON = await member.getMetaData();


      for(var i = 0; i < inputList.length; i++) {

        //Get number of sets for that exercise
        const numberOfSets = parseInt(inputList[i].querySelector("#setsInput").innerText);
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

        weightInput.addEventListener('blur', function(event) {
          const inputValue = event.target.value;
          if(!event.target.value.includes("kg") && event.target.value != "") {
            event.target.value = `${inputValue} kg`;
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
          if(!event.target.value.includes("reps") && event.target.value != "") {
            event.target.value = `${inputValue} reps`;
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
            if (memberJSONExerciseName.weight.includes("kg")) {
              weightInput.value = `${memberJSONExerciseName.weight[0]}`;
            } else {
              weightInput.value = `${memberJSONExerciseName.weight[0]} kg`;
            }
          }

          if(memberJSONExerciseName.reps != undefined) {
            if(memberJSONExerciseName.reps.length > 0) {
              if (memberJSONExerciseName.reps[0].includes("reps")) {
                repsInput.placeholder = `${memberJSONExerciseName.reps[0]}`;
              } else {
                repsInput.placeholder = `${memberJSONExerciseName.reps[0]} reps`;
              }
            }
            
          }
          
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
    
            newWeightInput.addEventListener('blur', function(event) {

              const inputValue = event.target.value;
              if(!event.target.value.includes("kg") && event.target.value != "") {
                event.target.value = `${inputValue} kg`;
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

              if(!event.target.value.includes("reps") && event.target.value != "") {
                event.target.value = `${inputValue} reps`;
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
                  if (memberJSONExerciseName.weight.includes("kg")) {
                    newWeightInput.value = `${memberJSONExerciseName.weight[j+1]}`;
                  } else {
                    newWeightInput.value = `${memberJSONExerciseName.weight[j+1]} kg`;
                  }
                }

              }

              if(memberJSONExerciseName.reps != undefined) {
                if(memberJSONExerciseName.reps.length > j+1) {
                  if (memberJSONExerciseName.reps[j+1].includes("reps")) {
                    newRepsInput.placeholder = `${memberJSONExerciseName.reps[j+1]}`;
                  } else {
                    newRepsInput.placeholder = `${memberJSONExerciseName.reps[j+1]} reps`;
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
     
      //Record in memberstack
      const workoutID = sessionStorage.getItem("currentWorkout");
      completeButtons.forEach((button, index) => {
        
        //Get exercise name
        const completedExercisename = button.closest("#inputSectionBlock").querySelector("#exerciseNameInput").innerText;

        var exerciseInfo = memberJSON[completedExercisename];
        if(exerciseInfo.workouts != undefined) {
          var numCompletedSets = exerciseInfo.workouts[workoutID];
          if((index%3 + 1) <= numCompletedSets) {

            const repsValue = button.closest("#inputSection").querySelector("#reps").placeholder;
            button.closest("#inputSection").querySelector("#reps").value  = repsValue;

            hideCompleteButton(button);
          }
        }

        button.addEventListener("click", () => {

          hideCompleteButton(button);

          if(workoutID != null || workoutID != "") {
            updateWorkoutDetails(completedExercisename, workoutID, (index)%3 + 1);
          }
          
        });

      });


      document.getElementById("finishWorkout").onclick = async () => {
        
        if(member.loggedIn) {
          //Get user metadata
          memberJSON = await member.getMetaData();

          //Get program JSON and modify it to include the new workout id
          const userProgram = JSON.parse(sessionStorage.getItem("currentProgram"));
          const workoutIndex = sessionStorage.getItem("workoutIndex");
          const workoutID = sessionStorage.getItem("currentWorkout");
          var workoutObj = {};
          workoutObj["memberJSON"] = memberJSON;
          workoutObj["member"] = member;
          workoutObj["programName"] = sessionStorage.getItem("programName");
          workoutObj["programID"] = sessionStorage.getItem("programID");
          if(userProgram != null) {

            userProgram[0].events[[workoutIndex]]["completedID"] = workoutID;
            
            workoutObj["userProgram"] = userProgram;

          } 
          sendWorkoutDetailsToMake(workoutObj);

        } else {
          var baseURL = window.location.origin;
          window.location = baseURL + "/workouts/workout-navigation"

        }
        
      };

    }

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


  //Hide the first exercise breaker of the exercise list
  const exerciseList = document.getElementById("listOfExercises").children;

  var utm_campaign = document.getElementById("utm_campaign").innerText;
  const urlParams = new URLSearchParams(window.location.search);
  var fromProgram = false;
  if(urlParams.has("fromProgram")) {
    fromProgram = true;
  }

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
  if (document.referrer == "" || sessionStorage.getItem("onlyFinish") == "true") {
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
  for(var i = 0; i < exerciseList.length; i++) {

    var shortName = exerciseList[i].querySelector("#exerciseShortName").innerText;
    var loadingMechanism = exerciseList[i].querySelector("#exerciseLoadingMechanism").innerText;
    workoutExercises.push(`${shortName},${loadingMechanism}`);

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
      //TO DO SEND TO PROGRAM PAGE
      var baseURL = window.location.origin;
      window.location = baseURL + "/workouts/workout-navigation"

      
    })
    .catch((error) => {
      //TO DO SEND TO PROGRAM PAGE
      var baseURL = window.location.origin;
      window.location = baseURL + "/workouts/workout-navigation"
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
      console.log(metadata);
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
          console.log(repsArr)
          var exerciseRepsObj = repsArr;
          
        }
        exerciseInfo.reps = exerciseRepsObj;
        
        const updatedJSON = {[exerciseName] : exerciseInfo};
        console.log(updatedJSON);
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
