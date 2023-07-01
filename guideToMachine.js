if (document.readyState !== 'loading') {
  main();
} else {
  document.addEventListener('DOMContentLoaded', function () {
      main();
  });
}

function main() {

  //Get details from memberstack:
  MemberStack.onReady.then(function(member) {  
    //var membership = member.membership  
    var memberID = member["id"];
    var gymName = member["gym-name"]
    var gymLocation = member["gym-location"]

    document.getElementById("memberstackField").innerText = `${gymName} - ${gymLocation}`;

    document.getElementById("gymFilter").innerText = `${gymName} - ${gymLocation}`;

    document.getElementById("gymName").innerText = `${gymName} - ${gymLocation}`;

  });

  url = new URL(window.location.href);
  //Get QR code reference from url
  if(url.searchParams.has("qrCode")) {
    document.getElementById("qrField").innerText = url.searchParams.get("qrCode");
  }



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
    "erector-spinae":"Lower Back"
  }


  //Get utm campaign and store in storage
  const gymName = document.getElementById("gymFilter").innerText;
  localStorage.setItem("fromGym", gymName);
  const savedGymName = localStorage.getItem("fromGym");

  const svgPerson = document.getElementById("ajaxContent");
  const guideList = document.getElementById("guideListParent");
  const infoText = document.getElementById("clickForMoreInfoText");
  const backDiv = document.getElementById("backDiv");
  const backButton = document.getElementById("clearText");
  const noMachines = document.getElementById("noMachinesButton");
  var smithMachineSelect = false;

  var listOfGuides = document.querySelectorAll("#individualGuide");
  //Add onClick to each item in list
  for(var i = 0; i < listOfGuides.length; i++) {
    var guide = listOfGuides[i].cloneNode(true);
    listOfGuides[i].onclick = function() {
      
      //Clone selected guide
      var clonedGuide = this.cloneNode(true);

      clonedGuide.id = "clonedGuide"
      clonedGuide.style.display = "none";
      

      //Check if single or multi machine
      if(document.getElementById("singleMachine").previousSibling.checked) {

        //Add to cloned section
        document.getElementById("checkSelectedGuide").appendChild(clonedGuide);
        //Add name to modal
        document.getElementById("modalMachineName").innerText = `'${clonedGuide.querySelector("#guideName").innerText}'`;

        //Show Modal
        var modalStyle = document.getElementById("modal").style;
        modalStyle.display = "flex";
        modalStyle.flexDirection = "column";
        modalStyle.justifyContent = "center";
        modalStyle.alignItems = "center";

      } else if(document.getElementById("multiMachine").previousSibling.checked) {

        //Ensure border colour is green
        this.firstChild.style.borderColor = "#08D58B";
        //Update multi machine text if multi selected

        //Check if in list first:
        var duplicate = false;
        var clonedGuides = document.querySelectorAll("#clonedGuide");
        for(var i = 0; i < clonedGuides.length; i++) {
          if(clonedGuide.querySelector("#itemID").innerHTML == clonedGuides[i].querySelector("#itemID").innerHTML) {
            duplicate = true;
            clonedGuides[i].remove();
            break;
          }
        }

        if(duplicate) {
          //Exercise has been clicked again - need to remove it
          this.firstChild.style.borderColor = "#0C08D5";
          document.getElementById("exerciseList").innerHTML = document.getElementById("exerciseList").innerHTML.replace(`<li> ${clonedGuide.querySelector("#guideName").innerText} </li>`, "");
          document.getElementById("multiMachineNum").innerText = document.querySelectorAll("#clonedGuide").length;
        } else {
          //Add to multi list
          //Add to cloned section
          document.getElementById("checkSelectedGuide").appendChild(clonedGuide);
          document.getElementById("multiMachineNum").innerText = document.querySelectorAll("#clonedGuide").length;
          document.getElementById("exerciseList").innerHTML += `<li> ${clonedGuide.querySelector("#guideName").innerText} </li>`
        }

      }

    }
  }

  //If search box changes, show list and hide svg man:
  const searchBox = document.getElementById("exerciseSearch");
  searchBox.oninput = function() {
    if(searchBox.value != "") {
      svgPerson.style.display = 'none';
      guideList.style.display = 'block';
      noMachines.style.display = 'block';
      infoText.style.display = 'block';
      //Check if ipad and below
      if(screen.width <= 950) {
        backDiv.style.display = 'block';
      } else {
        backButton.style.display = 'block';
      }

    } else {
      svgPerson.style.display = 'block';
      guideList.style.display = 'none';
      noMachines.style.display = 'none';
      infoText.style.display = 'none';
      if(screen.width <= 950) {
        backDiv.style.display = 'none';
      } else {
        backButton.style.display = 'none';
      }
      resetFilters(true);

    }
  }


  //Listen for change events:
  document.addEventListener('change', function (event) {
    //Check if cable machine is selected and single / multi cable was selected
    if(document.getElementById("cableCheckbox").checked) {
      if(document.getElementById("singleMachine").previousSibling.checked && event.target.id == "singleMachineCheckbox") {
        //Show modal with single cable header
        var modalStyle = document.getElementById("modal").style;
        modalStyle.display = "flex";
        modalStyle.flexDirection = "column";
        modalStyle.justifyContent = "center";
        modalStyle.alignItems = "center";

        document.getElementById("modalMachineName").innerText = "'Single Cable'";
      } else if(document.getElementById("multiMachine").previousSibling.checked && event.target.id == "multiMachineCheckbox") {
        //Show modal with multi cable header
        var modalStyle = document.getElementById("modal").style;
        modalStyle.display = "flex";
        modalStyle.flexDirection = "column";
        modalStyle.justifyContent = "center";
        modalStyle.alignItems = "center";
        document.getElementById("modalMachineName").innerText = "'Cable Machine'"

      }
    }
    
  });

  //Listen for click events:
  document.addEventListener('click', function (event) {
    if (event.target.nodeName == "path") {
      var muscleFilter = sessionStorage.getItem("muscleFilter");
      
      //Ensure muscle filter exists
      if(muscleFilter && muscleFilter != "") {
        muscleFilter = muscleFilter.replaceAll(" ", "-");
        document.querySelector(`.${muscleFilter}-filter`).click();
        //Click ab/adductors if quads are selected
        if(muscleFilter == "quadriceps") {
          document.querySelector(".adductors-filter").click();
          document.querySelector(".abductors-filter").click();
        }
        // hide SVG man:
        svgPerson.style.display = 'none';
        guideList.style.display = 'block';
        noMachines.style.display = 'block';
        infoText.style.display = 'block';
        if(screen.width <= 950) {
          backDiv.style.display = 'block';
        } else {
          backButton.style.display = 'block';
        }

        //Populate search box
        document.getElementById("exerciseSearch").value = muscleMapping[muscleFilter];
      }
      //Reset storage filter for next click
      sessionStorage.setItem("muscleFilter", "");

    } else if (event.target.id == "submitManualInput") {
      document.getElementById("modalMachineName").innerText = document.getElementById("manualInputName").value;

      //Clear any items previously selected:
      var guides = document.querySelectorAll("#clonedGuide");
      var modalGuideList = document.querySelector("#exerciseList").children;
      var guidesToRemove = [];
      for(var i = 0; i < guides.length; i++) {
        guidesToRemove.push(guides[i]);
      }

      for(var i = 0; i < modalGuideList.length; i++) {
        guidesToRemove.push(modalGuideList[i]);
      }

      for(var i = 0; i < guidesToRemove.length; i++) {
        guidesToRemove[i].remove();
      }

      //Update multi machine numbers
      document.getElementById("multiMachineNum").innerText = document.querySelectorAll("#clonedGuide").length;


    } else if(event.target.id == "hideManualInput") {

      //Show multi machine button if multi selected
      if(document.getElementById("multiMachine").previousSibling.checked) {
        document.getElementById("submitMulti").style.display = "block";
      }

    } else if(event.target.id == "noMachinesButton") {
      //Hide multi machine button if multi selected
      if(document.getElementById("multiMachine").previousSibling.checked) {
        document.getElementById("submitMulti").style.display = "none";
      }
    } else if(event.target.id == "pinButton") {
      //Apply pin filter
      document.getElementById("pinCheckbox").click();
    } else if(event.target.id == "plateButton") {
      //Apply plate filter
      document.getElementById("plateCheckbox").click();
    } else if(event.target.id == "bodyButton") {
      //Apply body filter
      document.getElementById("bodyCheckbox").click();
    }else if(event.target.id == "cableButton") {
      //Apply cable filter
      document.getElementById("cableCheckbox").click();
    } else if(event.target.id == "smithMachine") {
      //Update machine name in modal text
      if(smithMachineSelect) {
        smithMachineSelect = false;
      } else {
        document.getElementById("modalMachineName").innerText = "'Smith Machine'"
        smithMachineSelect = true;
      }

    } else if(event.target.id == "singleMachine") { 
      //Ensure 'cloned exercises' are clear
      var guides = document.querySelectorAll("#clonedGuide");
      var guidesToRemove = [];
      for(var i = 0; i < guides.length; i++) {
        guidesToRemove.push(guides[i]);
      }
      for(var i = 0; i < guidesToRemove.length; i++) {
        guidesToRemove[i].remove();
      }

      //Update multi machine numbers
      document.getElementById("multiMachineNum").innerText = document.querySelectorAll("#clonedGuide").length;
      

    } else if(event.target.id == "multiMachine") {

      var guides = document.querySelectorAll("#clonedGuide");
      var modalGuideList = document.querySelector("#exerciseList").children;
      var guidesToRemove = [];
      for(var i = 0; i < guides.length; i++) {
        guidesToRemove.push(guides[i]);
      }

      for(var i = 0; i < modalGuideList.length; i++) {
        guidesToRemove.push(modalGuideList[i]);
      }

      for(var i = 0; i < guidesToRemove.length; i++) {
        guidesToRemove[i].remove();
      }
      //Update multi machine numbers
      document.getElementById("multiMachineNum").innerText = document.querySelectorAll("#clonedGuide").length;


    } else if(event.target.id == "submitMulti") {

      //Clear name in modal
      document.getElementById("modalMachineName").innerText = "";

      //Show Modal
      var modalStyle = document.getElementById("modal").style;
      modalStyle.display = "flex";
      modalStyle.flexDirection = "column";
      modalStyle.justifyContent = "center";
      modalStyle.alignItems = "center";
      
    } else if(event.target.id == "confirmSelection") {
      if(smithMachineSelect) {
        sendDetailsToMake("smithMachine");
      } else if(document.getElementById("cableCheckbox").checked) {
        sendDetailsToMake("cable");
      } else {
        sendDetailsToMake();
      }
      
      //document.getElementById("guideSelect").submit();
    
    } else if(event.target.id == "changeSelection") {
      document.getElementById("clonedGuide").remove();

    } else if(event.target.id == "clearText" || event.target.id == "clearTextDiv" || event.target.id == "clearTextImage" || event.target.id == "clearTextBlock") {
      svgPerson.style.display = 'block';
      guideList.style.display = 'none';
      noMachines.style.display = 'none';
      if(screen.width <= 950) {
        backDiv.style.display = 'none';
      } else {
        backButton.style.display = 'none';
      }
      infoText.style.display = 'none';

      resetFilters();
    } else if(event.target.id == "prev") {
      svgPerson.style.display = 'block';
      guideList.style.display = 'none';
      noMachines.style.display = 'none';

      if(screen.width <= 950) {
        backDiv.style.display = 'none';
      } else {
        backButton.style.display = 'none';
      }
      infoText.style.display = 'none';

      resetFilters();
    } else if(event.target.id == "clearExperienceExerciseFilters") {
      resetGeneralFilters();
    } else if(event.target.id == "menu-clearExperienceExerciseFilters") {
      resetGeneralFilters();
    } else if (event.target.id == "exerciseLibraryHeading") {
      svgPerson.style.display = 'block';
      guideList.style.display = 'none';
      noMachines.style.display = 'none';
      resetFilters();
    } else if (event.target.id == "pageCoverDiv" || event.target.id == "pageCoverDivLowerHalf") {
      //Hide page cover divs
      document.getElementById("pageCoverDiv").style.display = "none";
      document.getElementById("pageCoverDivLowerHalf").style.display = "none";

    }
  }, false);

  /*
    Splitting up if there is multiple gym & muscle values to make sure we are filtering each
  */
  //Iterate through list
  var exerciseList = document.querySelectorAll("#individualGuide");
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

  //Check if list is empty:
  window.fsAttributes = window.fsAttributes || [];
  window.fsAttributes.push([
    'cmsfilter',
    (filterInstances) => {

      // The callback passes a `filterInstances` array with all the `CMSFilters` instances on the page.
      const [filterInstance] = filterInstances;
      
      let filterData = filterInstance.filtersData;
      
      // The `renderitems` event runs whenever the list renders items after filtering.
      filterInstance.listInstance.on('renderitems', (renderedItems) => {
        if(renderedItems.length == 0) {
          infoText.style.display = "none";
        }
      });
    },
  ]);

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

  async function resetFilters(onlyCheckboxes=false) {
    window.fsAttributes = window.fsAttributes || [];
    window.fsAttributes.push([
      'cmsfilter',
      async (filterInstances) => {
                
        //Clear Text
        document.getElementById("exerciseSearch").value = "";
        // The callback passes a `filterInstances` array with all the `CMSFilters` instances on the page.
        const [filterInstance] = filterInstances;
        !onlyCheckboxes ? await filterInstance.resetFilters(filterKeys=["exercisename","casualmusclefilter"], null) : null;
        await filterInstance.resetFilters(filterKeys=["musclenamefilter"], null);
      },
    ]);
  }

  async function resetGeneralFilters() {

    const checkboxes = document.getElementsByClassName('filter-checkbox');
    for (let i = 0; i < checkboxes.length; i++) { 
      if(checkboxes[i].classList.value.includes('w--redirected-checked')) {
        checkboxes[i].click();
      }
    }

  }

  async function sendDetailsToMake(machineOverride="") {
    var machineObj = {};
    var arrOfGuides = [];

    var manualInputName = document.getElementById("manualInputName").value;

    //Get qr code ref
    machineObj["qrCodeRef"] = document.getElementById("qrField").innerText;
    //Get gym name
    machineObj["gymName"] = document.getElementById("memberstackField").innerText;

    if(machineOverride == "smithMachine") {
      machineObj["manualInputName"] = "smith";
      submitDetailsToMake(machineObj)
    } else if(machineOverride == "cable") {
      if(document.getElementById("singleMachine").previousSibling.checked) {
        machineObj["manualInputName"] = "single cable";
        submitDetailsToMake(machineObj)
      } else if(document.getElementById("multiMachine").previousSibling.checked) {
        machineObj["manualInputName"] = "cable";
        submitDetailsToMake(machineObj)
      }

    //Normal single or multi machine
    } else if(machineOverride == "" && manualInputName == "") {
      //Get required details from guide

      var guides = document.querySelectorAll("#clonedGuide");
      for(var i = 0; i < guides.length; i++) {
        arrOfGuides.push(guides[i].querySelector("#itemID").innerText)
      }

      machineObj["guides"] = arrOfGuides;
      submitDetailsToMake(machineObj)

    } else {

      //Get manual input machine name
      machineObj["manualInputName"] = manualInputName;

      //Get manual input image
      var file = document.getElementById('manualInputImage').files[0];
      console.log(file);
      //Check if file exists
      if(file) {
        // Create a new file reader
        const reader = new FileReader();

        // Define a callback function to handle the file contents
        reader.onload = (event) => {
          // Get the contents of the file
          const contents = event.target.result;
          
          // Do something with the contents
          machineObj["manualInputImage"] = contents;

          submitDetailsToMake(machineObj);
        };

        // Read the file
        await reader.readAsDataURL(file);
      } else {
        submitDetailsToMake(machineObj);
      }
      
    }

    
  }

  function submitDetailsToMake(machineObj) {
    fetch("https://hook.us1.make.com/0ojtjqwa1v79hv7qtm2cvrjsthd636ds", {
      method: "POST",
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify(machineObj)
    }).then((res) => {
      if (res.ok) {
        return res.text();
      }
      throw new Error('Something went wrong');
    })
    .then((data) => {
      
      alert("Sucessfully onboarded machine!");
      location.reload()

      //Show sucess message saying to scan the next code
    })
    .catch((error) => {
      console.log(error);
      alert("Could not save new piece of equipment, please try again");
      location.reload()
    });
  }

}


