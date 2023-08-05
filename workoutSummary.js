const devModeFlag = localStorage.getItem("devMode");
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

  document.getElementById("summarySwitch").style.display = "block";

  //Add inputs for each exercise based on number of sets
  const inputList = document.getElementById("inputList").children;

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
    exerciseInputSection.appendChild(newRestDiv);

    for(var j = 0; j < numberOfSets-1; j++) {

      newRestDiv = restDiv.cloneNode(true);

      var newInputSection = inputSectionPlaceholder.cloneNode(true);
      newRestDiv.style.display = "flex";
      
      
      exerciseInputSection.appendChild(newInputSection);
      if(j < numberOfSets - 2) {
        exerciseInputSection.appendChild(newRestDiv);
      }
      
    }


  }


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
}
