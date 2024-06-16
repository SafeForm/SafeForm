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

  //Show all status
  var workoutStatus = document.querySelectorAll("#workoutStatus");
  for(var i = 0; i < workoutStatus.length; i++) {
    workoutStatus[i].style.display = "block";
  }

  MemberStack.onReady.then(async function(member) {  

    var metadata = await member.getMetaData();

    // Get the programs list
    var programsList = document.getElementById("programsList");
    if(programsList) {
      programsList = programsList.children;
      const programsArray = Array.from(programsList); // Create a separate array of elements

      for (var i = 0; i < programsArray.length; i++) {
        var programID = programsArray[i].querySelector(".programid").innerText;

        if (metadata["currentProgram"] == programID) {
          programsArray[i].querySelector("#workoutStatus").classList.remove("not-started");
          programsArray[i].querySelector("#workoutStatus").classList.add("in-progress");
          
          // Move to in progress div
          document.querySelector("#inProgressDiv").appendChild(programsArray[i]);
        }
        
        if (metadata[programID] && programsArray[i].querySelector(".completed").innerText.toLowerCase() != "true") {
          var totalNumberOfWeeks = programsArray[i].querySelector("#workoutStatus").innerText;
          programsArray[i].querySelector("#workoutStatus").innerText = `${metadata[programID]} / ${totalNumberOfWeeks} weeks`;
        } else {
          var totalNumberOfWeeks = programsArray[i].querySelector("#workoutStatus").innerText;
          programsArray[i].querySelector("#workoutStatus").innerText = `${totalNumberOfWeeks} weeks`;
        }

        if (programsArray[i].querySelector(".completed").innerText.toLowerCase() == "true") {
          programsArray[i].querySelector("#workoutStatus").classList.remove("not-started");
          programsArray[i].querySelector("#workoutStatus").classList.add("finished");
          
          // Move to done div
          document.querySelector("#doneDiv").appendChild(programsArray[i]);
        }

      }
    }
    

    var challengeList = document.getElementById("challengesList");
    if(challengeList) {
      var challengeList = challengeList.children;
      const challengesArray = Array.from(challengeList); // Create a separate array of elements
      const currentDate = new Date(); // Get the current date

      for (var i = 0; i < challengesArray.length; i++) {
        const challengeEndDateText = challengesArray[i].querySelector(".completed").innerText; // in the form 2024-05-31
        const challengeEndDate = new Date(challengeEndDateText); // Convert to Date object

        const challengeStatusElement = challengesArray[i].querySelector("#workoutStatus");
        
        if (currentDate <= challengeEndDate) {
          // Challenge is in progress
          challengeStatusElement.classList.remove("not-started");
          challengeStatusElement.classList.add("in-progress");
          challengeStatusElement.innerText = "In Progress";
          
          // Move to in progress div
          document.querySelector("#inProgressDiv").appendChild(challengesArray[i]);
        } else {
          // Challenge is finished
          challengeStatusElement.classList.remove("not-started");
          challengeStatusElement.classList.add("finished");
          challengeStatusElement.innerText = "Finished";
          
          // Move to done div
          document.querySelector("#doneDiv").appendChild(challengesArray[i]);
        }
      }
    }
    

    var headerDivs = document.querySelectorAll(".program-type-header");
    for(var i = 0; i < headerDivs.length; i++) {

      if(headerDivs[i].children.length > 1) {
        
        if(headerDivs[i].querySelector("#todoHeader")) {
          if(((challengeList && challengeList.length > 0) || (programsList && programsList.length > 0))) {
            headerDivs[i].style.display = "block";
          }
        } else {
          headerDivs[i].style.display = "block";
        }
        
      }
    }





  });

}
