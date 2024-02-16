//Grab and store url parameters if they exist
const urlParams = new URLSearchParams(window.location.search);

// Get the parameter values
const fcID = urlParams.get('fcID');
const programID = urlParams.get('programID');
var disableForm = false;

//If no parameter, lock form - because everything will break
if(fcID == null || programID == null) {
  disableFormFunc();
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

  const username = document.getElementById('email').value;

  const cognitoPw = atob(document.getElementById('cognitoPasswordField').value);
  
  const firstName = document.getElementById('firstName').value;

  const lastName = document.getElementById('lastName').value;

  const password = document.getElementById('password').value;

  const kgRadio = document.getElementById('kgRadio');
  const lbsRadio = document.getElementById('lbsRadio');

  let weightUnit = "kg";
  if(kgRadio.checked) {
    weightUnit = "kg"
  }

  if(lbsRadio.checked) {
    weightUnit = "lbs"
  }

  if (!cognitoComplete && !disableForm) {

    event.preventDefault();
    capturedEvent = event;

    const passwordValidation = document.getElementById("password").reportValidity();
    const lastNameValidation = document.getElementById("lastName").reportValidity();
    const firstNameValidation = document.getElementById("firstName").reportValidity();
    const usernameValidation = document.getElementById("email").reportValidity();

    if(!(kgRadio.checked || lbsRadio.checked)) {
      alert("Please select a weight unit");
    }
    
    if(usernameValidation && firstNameValidation && lastNameValidation && passwordValidation && (kgRadio.checked || lbsRadio.checked)) {
      document.getElementById("ms-loader").style.display = "flex";
      // Sign up user to cognito
      await signUpUser(username, username, cognitoPw, firstName, lastName, weightUnit, "Users");
    }

    
  } else if(disableForm) {
    event.preventDefault();
  } else {
    // Submit data to make webhook

    var client = {};
    client["email"] = username;
    client["initials"] = firstName[0]+lastName[0];
    client["firstName"] = firstName;
    client["lastName"] = lastName;
    client["programID"] = programID;
    client["fcID"] = fcID;
    
    sendClientToMake(client);

  }
});

function disableFormFunc() {
  alert("Something went wrong, please ask your trainer for a new link.");
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

async function sendClientToMake(client) {
  fetch("https://hook.us1.make.com/chy8xfy3f84peh54zhs8rar7io6i3q9v", {
    method: "POST",
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify(client)
  }).then((res) => {
    if (res.ok) {
      return res.text();
    }
    throw new Error('Something went wrong');
  })
  .then((data) => {
  

  })
  .catch((error) => {

  });
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

async function signUpUser(userName, userEmail, userPassword, firstName, lastName, weightUnit, group) {	 

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

  let dataWeightUnit = {
    Name : 'custom:weightUnit',
    Value : weightUnit
  }

  //var userDetails = {"email":userEmail, "firstName":firstName, "lastName":lastName, "phone_number":phone, "group":group}
	var attributeList = [ new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail),
						  new AmazonCognitoIdentity.CognitoUserAttribute(dataName), new AmazonCognitoIdentity.CognitoUserAttribute(dataGroup), new AmazonCognitoIdentity.CognitoUserAttribute(dataLastName), new AmazonCognitoIdentity.CognitoUserAttribute(dataFirstName), new AmazonCognitoIdentity.CognitoUserAttribute(dataWeightUnit)];

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
