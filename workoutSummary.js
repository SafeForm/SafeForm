if (document.readyState !== 'loading') {
  main();
} else {
  document.addEventListener('DOMContentLoaded', function () {
      main();
  });
}

async function main() {

  //Add inputs for each exercise based on number of sets
  const inputList = document.getElementById("inputList").children;

  MemberStack.onReady.then(async function(member) {  

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
        if(!event.target.value.includes("kg")) {
          event.target.value = `${inputValue} kg`;
        }
  
        const exerciseBlock = event.target.closest("#inputSectionBlock");
        const exerciseName = exerciseBlock.querySelector("#exerciseNameInput");
  
        updateExerciseDetails(exerciseName.innerText, inputValue, null, "weight");
      });

      repsInput.addEventListener('blur', function(event) {
        const inputValue = event.target.value;
        if(!event.target.value.includes("reps")) {
          event.target.value = `${inputValue} reps`;
        }
  
        const exerciseBlock = event.target.closest("#inputSectionBlock");
        const exerciseName = exerciseBlock.querySelector("#exerciseNameInput");
  
        updateExerciseDetails(exerciseName.innerText, inputValue, 0, "reps");
      });

      var memberJSONExerciseName = memberJSON[exerciseName];
      
      if(memberJSONExerciseName != undefined) {

        if(memberJSONExerciseName.weight != undefined) {
          if (memberJSONExerciseName.weight.includes("kg")) {
            weightInput.value = `${memberJSONExerciseName.weight}`;
          } else {
            weightInput.value = `${memberJSONExerciseName.weight} kg`;
          }
        }

        if(memberJSONExerciseName.reps != undefined) {
          if(memberJSONExerciseName.reps.length > 0) {
            if (memberJSONExerciseName.reps[0].includes("reps")) {
              repsInput.value = `${memberJSONExerciseName.reps[0]}`;
            } else {
              repsInput.value = `${memberJSONExerciseName.reps[0]} reps`;
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
          newRestDiv.style.display = "flex";

          const completeButton = newInputSection.querySelector("#completeExercise")
          completeButton.addEventListener("click", () => {

            // Hide the clicked element
            completeButton.style.display = "none";
        
            // Find the next sibling element with the id "completedExercise"
            const nextCompletedImage = completeButton.nextElementSibling;
            if (nextCompletedImage && nextCompletedImage.id === "completedExercise") {
              nextCompletedImage.style.display = "block"; // Or any other display value you prefer
            }
              
            });
  
          newWeightInput.addEventListener('blur', function(event) {

            const inputValue = event.target.value;
            if(!event.target.value.includes("kg")) {
              event.target.value = `${inputValue} kg`;
            }
            const exerciseBlock = event.target.closest("#inputSectionBlock");
            const exerciseName = exerciseBlock.querySelector("#exerciseNameInput");
      
            updateExerciseDetails(exerciseName.innerText, inputValue, null, "weight");
          });
  
          newRepsInput.addEventListener('blur', function(event) {
            const inputValue = event.target.value;

            if(!event.target.value.includes("reps")) {
              event.target.value = `${inputValue} reps`;
            }
      
            const exerciseBlock = event.target.closest("#inputSectionBlock");
            const exerciseName = exerciseBlock.querySelector("#exerciseNameInput");
      
            updateExerciseDetails(exerciseName.innerText, inputValue, j+1, "reps");
          });

          newRepsInput.value = "";
          
          if(memberJSONExerciseName != undefined) {

            if(memberJSONExerciseName.weight != undefined) {
              if (memberJSONExerciseName.weight.includes("kg")) {
                newWeightInput.value = `${memberJSONExerciseName.weight}`;
              } else {
                newWeightInput.value = `${memberJSONExerciseName.weight} kg`;
              }
            }

            if(memberJSONExerciseName.reps != undefined) {
              if(memberJSONExerciseName.reps.length > j+1) {
                if (memberJSONExerciseName.reps[j+1].includes("reps")) {
                  newRepsInput.value = `${memberJSONExerciseName.reps[j+1]}`;
                } else {
                  newRepsInput.value = `${memberJSONExerciseName.reps[j+1]} reps`;
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

  });

  //Set onclicks for each complete image
  const completeButtons = document.querySelectorAll("#completeExercise");

  // Loop through each element and set the onclick handler
  completeButtons.forEach(button => {
    button.addEventListener("click", () => {

    // Hide the clicked element
    button.style.display = "none";

    // Find the next sibling element with the id "completedExercise"
    const nextCompletedImage = button.nextElementSibling;
    if (nextCompletedImage && nextCompletedImage.id === "completedExercise") {
      nextCompletedImage.style.display = "block"; // Or any other display value you prefer
    }
      
    });
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
  if (document.referrer == "" || localStorage.getItem("onlyFinish") == "true") {
    localStorage.setItem("onlyFinish", "true");
    document.getElementById("workoutNavigation").style.display = "none";
    document.getElementById("shareWorkout").style.display = "block";
  } else {
    localStorage.setItem("onlyFinish", "false");
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

  async function updateExerciseDetails(exerciseName, inputValue, setNumber=null, type) {
    MemberStack.onReady.then(async function(member) {  

      var metadata = await member.getMetaData();

      //Get info from exercise
      var exerciseInfo = metadata[exerciseName];
      console.log(exerciseInfo);

      if(exerciseInfo == undefined) {
        exerciseInfo = {"weight": "", "reps":[]};
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
        exerciseInfo.weight = inputValue;
        const updatedJSON = {[exerciseName] : exerciseInfo};

        member.updateMetaData(updatedJSON);
      }

    });
  }

}
