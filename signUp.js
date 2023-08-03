//Grab and store url parameters if they exist
const urlParams = new URLSearchParams(window.location.search);

// Get the parameter values
const gymName = urlParams.get('utm_campaign');
const gymId = urlParams.get('gym_id');

// Check if the parameters exist
if (urlParams.has('utm_campaign') && urlParams.has('gym_id')) {
  // Store the values in sessionStorage
  sessionStorage.setItem('fromGym', gymName);
  sessionStorage.setItem('gymId', gymId);
} 
var disableForm = false;
if(gymId == null) {
  document.getElementById("selectStaffMember").style.display = "none";
  alert("Something went wrong, please scan the QR code from a staff member again.");
  // Disable interactive elements on the page
  const interactiveElements = document.querySelectorAll('button, input, select, textarea, a, #sign-up-button');
  interactiveElements.forEach(element => {
    element.disabled = true;
  });
  disableForm = true;
}

if(urlParams.has('payment')) {
  sessionStorage.setItem('payment', 'false');
}

if(urlParams.has('staff_email')) {
  const staffEmail = urlParams.get('staff_email');
  sessionStorage.setItem('staffEmail', 'false');
  //Hide modal
  document.getElementById("staffSelectModal").style.display = "none";
} else {

  //Set onclicks for each staff button
  const staffMembers = document.getElementById("staffMemberList").children;

  // Iterate through each staff member element and set the onclick event
  for (let i = 0; i < staffMembers.length; i++) {
    const staffMember = staffMembers[i];
    var staffMemberNameElement = staffMember.querySelector("#staffName");
    var staffMemberName = staffMemberNameElement.innerText;

    // Split the name into an array containing first name and last name
    var nameParts = staffMemberName.split(" ");

    // Extract the first name (index 0) and the first letter of the last name (index 1)
    var firstName = nameParts[0];
    var lastNameInitial = nameParts[1] ? nameParts[1].charAt(0) : "";

    // Create the new text in the format "First Name L", where L is the first letter of the last name.
    var newName = lastNameInitial ? `${firstName} ${lastNameInitial}` : firstName;

    // Update the element's text with the new name
    staffMemberNameElement.innerText = newName;
    // Set the onclick event for each staff member element
    staffMember.onclick = function () {

      const staffEmail = staffMember.querySelector("#staffEmail").innerText;
      sessionStorage.setItem('staffEmail', staffEmail);

      //Hide modal
      document.getElementById("staffSelectModal").style.display = "none";

    };
  }
}

window.fsAttributes = window.fsAttributes || [];
window.fsAttributes.push([
  'cmsfilter',
  (filterInstances) => {
    // The callback passes a `filterInstances` array with all the `CMSFilters` instances on the page.
    const [filterInstance] = filterInstances;
    
    // The `renderitems` event runs whenever the list renders items after filtering.
    filterInstance.listInstance.on('renderitems', (renderedItems) => {

      document.getElementById("staffMemberListParent").style.display = "block";
      if(renderedItems.length == 0) {
        document.getElementById("staffSelectModal").style.display = "none";
       }
    });
  },
]);


//Listen for changes on password textbox and update cognito password text box
const pwTextBox = document.getElementById('password');

//Set value for hasPaid field
document.getElementById("hasPaid").value = "false";

pwTextBox.addEventListener('change', function(event) {
  // Check if the text box value has changed
  if (pwTextBox.value !== this.dataset.originalValue) {

    // Get the new value from the text box
    const newValue = pwTextBox.value;

    // Update the original value
    this.dataset.originalValue = newValue;

    //Set cognito textbox value
    document.getElementById('cognitoPasswordField').value = newValue;
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

    const cognitoPw = document.getElementById('cognitoPasswordField').value;
    
    const firstName = document.getElementById('firstName').value;
    const firstNameValidation = document.getElementById("firstName").reportValidity();

    const lastName = document.getElementById('lastName').value;
    const lastNameValidation = document.getElementById("lastName").reportValidity();

    const phone = document.getElementById('phone').value.toString();;
    const phoneValidation = document.getElementById("phone").reportValidity();

    const password = document.getElementById('password').value;
    const passwordValidation = document.getElementById("password").reportValidity();

    const hasPaid = "false"
    
    if(usernameValidation && firstNameValidation && lastNameValidation && phoneValidation && passwordValidation) {
      document.getElementById("ms-loader").style.display = "flex";
      // Sign up user to cognito
      await signUpUser(username, username, cognitoPw, firstName, lastName, phone, "Users", hasPaid);
      console.log("Signed up to cognto")
      cognitoComplete = true;
    }

    
  } else if(disableForm) {
    event.preventDefault();
  }
});

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

async function signUpUser(userName, userEmail, userPassword, firstName, lastName, phone, group, hasPaid) {	 

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
  let dataPhone = {
    Name : 'custom:phone',
    Value : phone
  };	
  let dataHasPaid = {
    Name : 'custom:hasPaid',
    Value : hasPaid
  };	
  var userDetails = {"email":userEmail, "firstName":firstName, "lastName":lastName, "phone_number":phone, "group":group}
	var attributeList = [ new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail),
						  new AmazonCognitoIdentity.CognitoUserAttribute(dataName), new AmazonCognitoIdentity.CognitoUserAttribute(dataGroup), new AmazonCognitoIdentity.CognitoUserAttribute(dataLastName), new AmazonCognitoIdentity.CognitoUserAttribute(dataFirstName), new AmazonCognitoIdentity.CognitoUserAttribute(dataPhone), new AmazonCognitoIdentity.CognitoUserAttribute(dataHasPaid)];

  var userPool = await getUserPool();

  userPool.signUp(userName, userPassword, attributeList, null, async function(err, result){
    
    if (err) {
      console.log(err);
      alert(`${err.message} - please try again`);
      location.reload();
    }
    else {
      //Success now sign user in
      cognitoUser = result.user;
      replayEvent()
    }
  });

}
