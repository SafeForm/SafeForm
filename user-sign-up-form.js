//Grab and store url parameters if they exist
const urlParams = new URLSearchParams(window.location.search);

// Get the parameter values
var gymId = urlParams.get('pt');
var disableForm = false;

// Check if the parameters exist
if (urlParams.has('utm_campaign') && urlParams.has('gym_id')) {
  // Store the values in sessionStorage
  sessionStorage.setItem('gymId', gymId);
} 

//If no parameter, check if gym is already saved
if(gymId == null) {
  gymId = localStorage.getItem("gymId");
  //If its still empty, then alert and lock form
  if(gymId == null) {
    disableFormFunc();
  }
}

//Listen for changes on password textbox and update cognito password text box
const pwTextBox = document.getElementById('password');

pwTextBox.addEventListener('change', function(event) {
  // Check if the text box value has changed
  if (pwTextBox.value !== this.dataset.originalValue) {

    // Get the new value from the text box
    const newValue = pwTextBox.value;

    // Update the original value
    this.dataset.originalValue = newValue;

    //Set cognito textbox value
    document.getElementById('cognitoPasswordField').value = btoa(newValue);
  }
});

var cognitoComplete = false;
var capturedEvent = null; // Variable to store the captured event

const signUpForm = document.getElementById('sign-up-button');
signUpForm.addEventListener('click', async function(event) {

  if (!cognitoComplete && !disableForm) {

    event.preventDefault();
    capturedEvent = event;
    
    const username = document.getElementById('email').value;
    const usernameValidation = document.getElementById("email").reportValidity();

    const cognitoPw = atob(document.getElementById('cognitoPasswordField').value);
    
    const firstName = document.getElementById('first-name').value;
    const firstNameValidation = document.getElementById("first-name").reportValidity();

    const lastName = document.getElementById('last-name').value;
    const lastNameValidation = document.getElementById("last-name").reportValidity();

    const password = document.getElementById('password').value;
    const passwordValidation = document.getElementById("password").reportValidity();

    const dob = document.getElementById('dob').value;
    const dobValidation = document.getElementById("dob").reportValidity();

    const gender = document.getElementById('gender').value;
    const genderValidation = document.getElementById("gender").reportValidity();

    const height = document.getElementById('height').value;
    const heightValidation = document.getElementById("height").reportValidity();

    const weight = document.getElementById('weight').value;
    const weightValidation = document.getElementById("weight").reportValidity();

    const experience = document.getElementById('experience').value;
    const experienceValidation = document.getElementById("experience").reportValidity();

    // Get all radio buttons in the group
    var radioButtons = document.getElementsByName('trainingType');

    // Initialize a variable to store the selected radio button's value
    var trainingType = '';

    // Loop through the radio buttons to find the selected one
    for (var i = 0; i < radioButtons.length; i++) {
        if (radioButtons[i].checked) {
            selectedValue = radioButtons[i].value;
            break; // Exit the loop once a selected radio button is found
        }
    }

    const goals = document.getElementById('goals').value;
    const goalsValidation = document.getElementById("goals").reportValidity();

    const injury = document.getElementById('injury').value;
    const injuryValidation = document.getElementById("injury").reportValidity();

    const hasPaid = "false"
    
    if(usernameValidation && firstNameValidation && lastNameValidation && passwordValidation && dobValidation
      && genderValidation && heightValidation && weightValidation && experienceValidation && goalsValidation && injuryValidation) {
      document.getElementById("ms-loader").style.display = "flex";
      // Sign up user to cognito
      await signUpUser(username, username, cognitoPw, firstName, lastName, "Users", hasPaid, dob, gender, height, weight, experience, trainingType, goals, injury);
    }

    
  } else if(disableForm) {
    event.preventDefault();
  }
});

function disableFormFunc() {
  alert("Something went wrong, please ask your personal trainer for a new link.");
  // Disable interactive elements on the page
  const interactiveElements = document.querySelectorAll('button, input, select, textarea, a, #sign-up-button');
  interactiveElements.forEach(element => {
    element.disabled = true;
  });
  disableForm = true;
}

// Function to replay the captured event
function replayEvent() {
  if (capturedEvent) {
    // Trigger the captured event
    //capturedEvent.target.dispatchEvent(capturedEvent);
    signUpForm.click();

    // Reset the captured event
    capturedEvent = null;
  }
}


async function getPoolData() {

  //Combine user ID and their IP to ensure this device can only access their keys
  var userID = crypto.randomUUID();

  var userIP = "";
  await $.getJSON('https://ipinfo.io', function(data){
    userIP = data["ip"];
  });

  var userKey = { "key": userID + userIP };
  //Send request to validate user
  var cognitoDetails = {};

  //Send to server to verify user key
  await fetch("https://hook.us1.make.com/fhc5tz6midcsf1vnulpua2czatssd538", {
    method: "POST",
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify(userKey)
  }).then((res) => {
    if (res.ok) {
      return res.text();
    }
    throw new Error('Something went wrong');
  })
  .then((data) => {
    cognitoDetails = JSON.parse(data);
    return cognitoDetails;
  })
  .catch((error) => {
    return error;
  });
  return cognitoDetails;
}

var userPool;

function getUserPool() {
  if (userPool !== undefined) {
    return Promise.resolve(userPool); // Return a resolved Promise if the userPool value is already defined
  }

  return getPoolData().then((value) => {
    userPool = new AmazonCognitoIdentity.CognitoUserPool(value);
    return userPool;
  }).catch((error) => {
    return new Error('Unable to retrieve details'); // Throw an error instead of showing an alert
  });
}

var cognitoUser;

async function getUser(userName){
	if (cognitoUser===undefined){
	    var userData = {
	        Username : userName,
	        Pool : await getUserPool()
	        };
    	cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
	}
	return cognitoUser;
}

async function signUpUser(userName, userEmail, userPassword, firstName, lastName, group, hasPaid, dob, gender, height, weight, experience, trainingType, goals, injury) {	 

	let dataEmail = {
	    Name : 'email',
	    Value : userEmail
	};
	let dataName = {
	    Name : 'preferred_username',
	    Value : userName
	};	
  let dataGroup = {
    Name : 'custom:group',
    Value : group
  };	
  let dataFirstName = {
    Name : 'given_name',
    Value : firstName
  };	
  let dataLastName = {
    Name : 'family_name',
    Value : lastName
  };	
  let dataHasPaid = {
    Name : 'custom:hasPaid',
    Value : hasPaid
  };	
  let dataDOB = {
    Name : 'custom:dob',
    Value : dob
  };	
  let dataGender = {
    Name : 'gender',
    Value : gender
  };	
  let dataHeight = {
    Name : 'custom:height',
    Value : height
  };
  let dataWeight = {
    Name : 'custom:weight',
    Value : weight
  };	
  let dataExperience = {
    Name : 'custom:experience',
    Value : experience
  };	
  let dataTrainingType = {
    Name : 'custom:trainingType',
    Value : trainingType
  };	
  let dataGoals = {
    Name : 'custom:goals',
    Value : goals
  };	
  let dataInjury = {
    Name : 'custom:physical-limitations',
    Value : injury
  };

  //var userDetails = {"email":userEmail, "firstName":firstName, "lastName":lastName, "phone_number":phone, "group":group}
	var attributeList = [ new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail),
						  new AmazonCognitoIdentity.CognitoUserAttribute(dataName), new AmazonCognitoIdentity.CognitoUserAttribute(dataGroup), new AmazonCognitoIdentity.CognitoUserAttribute(dataLastName), new AmazonCognitoIdentity.CognitoUserAttribute(dataFirstName), new AmazonCognitoIdentity.CognitoUserAttribute(dataHasPaid), new AmazonCognitoIdentity.CognitoUserAttribute(dataDOB), new AmazonCognitoIdentity.CognitoUserAttribute(dataGender), new AmazonCognitoIdentity.CognitoUserAttribute(dataHeight), new AmazonCognitoIdentity.CognitoUserAttribute(dataWeight), new AmazonCognitoIdentity.CognitoUserAttribute(dataExperience), new AmazonCognitoIdentity.CognitoUserAttribute(dataTrainingType), new AmazonCognitoIdentity.CognitoUserAttribute(dataGoals), new AmazonCognitoIdentity.CognitoUserAttribute(dataInjury)];

  var userPool = await getUserPool();

  userPool.signUp(userName, userPassword, attributeList, null, async function(err, result){
    
    if (err) {
      document.getElementById("ms-loader").style.display = "none";

      console.log(err);
      alert(`${err.message} - please try again`);
      //location.reload();
    }
    else {
      //Success now sign user in
      cognitoUser = result.user;
      cognitoComplete = true;
      console.log("Signed up to cognto")
      replayEvent()
    }
  });

}
