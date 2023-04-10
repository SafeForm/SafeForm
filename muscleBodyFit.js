if (document.readyState !== 'loading') {
  main();
} else {
  document.addEventListener('DOMContentLoaded', function () {
      main();
  });
}
function main() {

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
  
  const svgPerson = document.getElementById("ajaxContent");
  const guideList = document.getElementById("guideListParent");
  const infoText = document.getElementById("clickForMoreInfoText");
  const backDiv = document.getElementById("backDiv");
  const backButton = document.getElementById("clearText");

  url = new URL(window.location.href);

  var tempMuscleFilter = sessionStorage.getItem("savedMuscleFilter");
  //Go back to where user was browsing if coming back from guides
  if(url.searchParams.get("backLink") && tempMuscleFilter != "" && tempMuscleFilter) {
    
    svgPerson.style.display = 'none';
    guideList.style.display = 'block';
    infoText.style.display = 'block';
    //Check if ipad and below
    if(screen.width <= 950) {
      backDiv.style.display = 'block';
    } else {
      backButton.style.display = 'block';
    }

    //Show filters button
    document.getElementById("showFiltersBtn").style.display = "block";

    //Populate search box
    document.getElementById("exerciseSearch").value = muscleMapping[tempMuscleFilter];

    //Filter
    tempMuscleFilter = tempMuscleFilter.replaceAll(" ", "-");
    document.querySelector(`.${tempMuscleFilter}-filter`).click();

    
  }
  
  var exerciseLinks = document.getElementById("guideList").querySelectorAll("a");
  for(var i = 0; i < exerciseLinks.length; i++) {
    exerciseLinks[i].href += `?fromLibrary=true`;
  }
  
  //If search box changes, show list and hide svg man:
  const searchBox = document.getElementById("exerciseSearch");
  searchBox.oninput = function() {
    if(searchBox.value != "") {
      svgPerson.style.display = 'none';
      guideList.style.display = 'block';
      infoText.style.display = 'block';
      if(screen.width <= 950) {
      	backDiv.style.display = 'block';
      } else {
      	backButton.style.display = 'block';
      }
      //Show filters button
      document.getElementById("showFiltersBtn").style.display = "block";
      
    } else {
      svgPerson.style.display = 'block';
      guideList.style.display = 'none';
      infoText.style.display = 'none';
      if(screen.width <= 950) {
      	backDiv.style.display = 'none';
      } else {
      	backButton.style.display = 'none';
      }
      resetFilters(true);
      //Hide filters button
      document.getElementById("showFiltersBtn").style.display = "none";
    }
  }
  
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
        infoText.style.display = 'block';
        if(screen.width <= 950) {
          backDiv.style.display = 'block';
        } else {
          backButton.style.display = 'block';
        }
        
        //Populate search box
        document.getElementById("exerciseSearch").value = muscleMapping[muscleFilter];
        
        //Show filters button
        document.getElementById("showFiltersBtn").style.display = "block";
      }
      //Reset storage filter for next click
      sessionStorage.setItem("muscleFilter", "");
      sessionStorage.setItem("savedMuscleFilter", muscleFilter);

    } else if(event.target.id == "clearText" || event.target.id == "clearTextDiv" || event.target.id == "clearTextImage" || event.target.id == "clearTextBlock") {
      svgPerson.style.display = 'block';
      guideList.style.display = 'none';
      if(screen.width <= 950) {
      	backDiv.style.display = 'none';
      } else {
      	backButton.style.display = 'none';
      }
      infoText.style.display = 'none';
      //Hide filters button
      document.getElementById("showFiltersBtn").style.display = "none";
      resetFilters();
    } else if(event.target.id == "prev") {
      svgPerson.style.display = 'block';
      guideList.style.display = 'none';
      if(screen.width <= 950) {
      	backDiv.style.display = 'none';
      } else {
      	backButton.style.display = 'none';
      }
      infoText.style.display = 'none';
      //Hide filters button
      document.getElementById("showFiltersBtn").style.display = "none";
      resetFilters();
    } else if(event.target.id == "clearExperienceExerciseFilters") {
      resetGeneralFilters();
    } else if(event.target.id == "menu-clearExperienceExerciseFilters") {
      resetGeneralFilters();
    } else if (event.target.id == "exerciseLibraryHeading") {
      svgPerson.style.display = 'block';
      guideList.style.display = 'none';
      resetFilters();
    } else if (event.target.id == "showFiltersBtn") {
    
    	//Show page cover divs
      document.getElementById("pageCoverDiv").style.display = "block";
      document.getElementById("pageCoverDivLowerHalf").style.display = "block";
      
    
    } else if (event.target.id == "pageCoverDiv" || event.target.id == "pageCoverDivLowerHalf") {
      //Hide page cover divs
      document.getElementById("pageCoverDiv").style.display = "none";
      document.getElementById("pageCoverDivLowerHalf").style.display = "none";

    }
  }, false);

  //Listen for change events:
  document.addEventListener('change', function (event) {
		if (event.target.type) {
      checkCheckboxFilters().then(res => { 
        //Check if the amount of active filters is more than 0
        if(res > 0) {
          document.getElementById("clearExperienceExerciseFilters").style.display = "block";
          document.getElementById("menu-clearExperienceExerciseFilters").style.display = "block";
          document.getElementById("showFiltersBtn").style.borderColor = "#08D58B";
        } else {
          document.getElementById("clearExperienceExerciseFilters").style.display = "none";
          document.getElementById("menu-clearExperienceExerciseFilters").style.display = "none";
          document.getElementById("showFiltersBtn").style.borderColor = "#0C08D5";
        }

      });
    }
  }, false);
  
  //Splitting gym name text to ensure filtering works correctly
  //Iterate through list
  var exerciseList = document.getElementById("guideList").children;

  for(let i = 0; i < exerciseList.length; i++) {
		
    //Obtain the muscle text exerciseList
    var muscleElement = exerciseList[i].querySelector("#scientificPrimaryMuscle");
    
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
        
        const [filterInstance] = filterInstances;

				await filterInstance.resetFilters(filterKeys=["musclenamefilter"], null);
        !onlyCheckboxes ? await filterInstance.resetFilters(filterKeys=["exercisename","casualmusclefilter"], null) : null;
        

      },
    ]);
  }
  
  //Returns the amount of experience and exercise filters are currently active
  async function checkCheckboxFilters() {
    var filtersTotalSize = 0;
    window.fsAttributes = window.fsAttributes || [];
    window.fsAttributes.push([
      'cmsfilter',
    ])
    return window.fsAttributes.cmsfilter.loading.then(res => {
      var filterInstance = res[0].filtersData;
      filtersTotalSize = filterInstance[0].values.size + filterInstance[1].values.size;
      return filtersTotalSize;
    });
  }
  
  async function resetGeneralFilters() {

    const checkboxes = document.getElementsByClassName('filter-checkbox');
    for (let i = 0; i < checkboxes.length; i++) { 
      if(checkboxes[i].classList.value.includes('w--redirected-checked')) {
        checkboxes[i].click();
      }
    }

  }
  
}
