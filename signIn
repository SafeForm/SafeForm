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
    console.log(error);
    alert("Unable to sign up, please refresh and try again");
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
    throw new Error('Unable to retrieve details'); // Throw an error instead of showing an alert
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

//Submit user details
var email = "";
var tempPassword = "";
var user = {};
document.getElementById("forgotPasswordLink").addEventListener("click", function(event) {

  //Form for entering email:
  const emailSendDiv = document.querySelector('[ms-forgot-password]');
  emailSendDiv.addEventListener('submit', async function(event) {
    email = document.getElementById('forgotPasswordEmail').value;
    console
  });

  //Form for password reset
  const passwordResetDiv = document.querySelector('[ms-reset-password]');
  
  passwordResetDiv.addEventListener('submit', async function(event) {
    //event.preventDefault();
    tempPassword = document.getElementById('confirmPassword').value;
    user["email"] = email;
    user["password"] = tempPassword;
    console.log(user);

    fetch("https://hook.us1.make.com/o8loetjrnkwzpaunnot3v3vh41jraos0", {
      method: "POST",
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify(user)
    }).then((res) => {
      if (res.ok) {
        return res.text();
      }
      throw new Error('Something went wrong');
    })
    .catch((error) => {
      console.log(error);
    });

  });

});
