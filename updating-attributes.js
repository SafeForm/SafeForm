if (document.readyState !== 'loading') {
  main();
} else {
  document.addEventListener('DOMContentLoaded', function () {
      main();
  });
}

async function main() {


  //Check if user is logged in
  MemberStack.onReady.then(function(member) {  

    // check if member is logged in  
    if(!member.loggedIn) {
      alert("Cannot find user, please try again");
      window.location = "https://safeform.app/user-sign-up";
    }
  })

  //Check what page the user is on:
  const pathname = window.location.pathname;
  var baseURL = "https://safeform.app";
  if(pathname == "/user-sign-up-experience") {
    var nextPage = baseURL+"/user-sign-up-goals";
    document.getElementById("beginner").onclick = async function () {
      await updateProfile("experience", "Beginner", nextPage);
    }
    
    document.getElementById("intermediate").onclick = async function () {
      await updateProfile("experience", "Intermediate", nextPage); 
    }
    
    document.getElementById("advanced").onclick = async function () { 
      await updateProfile("experience", "Advanced", nextPage);
    }

  } else if (pathname == "/user-sign-up-goals") {
    var nextPage = baseURL+"/user-sign-up-frequency";
    document.getElementById("lose-weight").onclick = function () { 
      updateProfile("goals", "Lose Weight", nextPage);
    }
    
    document.getElementById("get-toned").onclick = function () { 
      updateProfile("goals", "Get Toned", nextPage);
    }
    
    document.getElementById("feel-better").onclick = function () { 
      updateProfile("goals", "Feel Better", nextPage);
    }
    
    document.getElementById("gain-muscle").onclick = function () { 
      updateProfile("goals", "Gain Muscle", nextPage);
    }

  } else if(pathname == "/user-sign-up-frequency") {
    var nextPage = baseURL+"/user-sign-up-workout-duration";
    
    // Select all buttons with the class "frequency-link"
    const buttons = document.querySelectorAll(".frequency-link");

    // Loop through each button and set the onclick event
    buttons.forEach(button => {
      button.onclick = function() {
        // Your onclick logic goes here
        // You can access the clicked button using the "this" keyword
        const frequencyValue = this.textContent.match(/\d+/)[0];

        updateProfile("workout-frequency", frequencyValue, nextPage);
      };
    });

  } else if(pathname == "/user-sign-up-workout-duration") {
    var nextPage = baseURL+"/user-sign-up-notification";

    // Select all buttons with the class "frequency-link"
    const buttons = document.querySelectorAll(".frequency-link");

    // Loop through each button and set the onclick event
    buttons.forEach(button => {
      button.onclick = function() {
        // Your onclick logic goes here
        // You can access the clicked button using the "this" keyword
        if(this.id == "45-mins") {
          updateProfile("workout-duration", "45", nextPage);
        } else if(this.id == "60-mins") {
          updateProfile("workout-duration", "60", nextPage);
        } else if(this.id == "30-mins") {
          updateProfile("workout-duration", "30", nextPage);
        }

      };
    });

  } else if(pathname == "/user-sign-up-details") {

    var nextPage = baseURL+"/user-sign-up-limitations";
    
    document.getElementById("next").onclick = function () {
      //Get height value
      const userHeightElement = document.getElementById("height");
      const userHeight = userHeightElement.value.replace(/\D/g, '');

      if(userHeightElement.value != userHeight) {
        userHeightElement.setCustomValidity('Please enter numbers only.');
      } else {
        userHeightElement.setCustomValidity('');
      }
      const heightValidation = document.getElementById("height").reportValidity();

      //Get weight value
      const userWeightElement = document.getElementById("weight");
      const userWeight = userWeightElement.value.replace(/\D/g, '');
      if(userWeightElement.value != userWeight) {
        userWeightElement.setCustomValidity('Please enter numbers only.');
      } else {
        userWeightElement.setCustomValidity('');
      }
      const weightValidation = document.getElementById("weight").reportValidity();

      //Get gender value
      const userGender = document.getElementById("gender").value;
      const genderValidation = document.getElementById("gender").reportValidity();

      //Get dob value
      const userDOB = document.getElementById("dob");
      const pattern = /^(0[1-9]|[1-2]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
      if (!pattern.test(userDOB.value)) {
        userDOB.setCustomValidity('Please enter a valid date in the format DD/MM/YYYY');
      } else {
        userDOB.setCustomValidity('');
      }
      const userDOBValidation = document.getElementById("dob").reportValidity();

      if(heightValidation && weightValidation && genderValidation && userDOBValidation ) {
        const userDetails = {"height": userHeight, "weight":userWeight, "gender":userGender, "dob":userDOB.value};
        updateProfile("userDetails", userDetails, nextPage);
      }

    }

  } else if(pathname == "/user-sign-up-limitations") {

    const payment = sessionStorage.getItem('payment');
    var nextPage = "";
    if(payment == 'false' || payment != null) { 
      nextPage = "https://www.safeform.app/workouts/workout-navigation";
    } else {
      nextPage = "https://buy.stripe.com/dR6eWBfd31Pg42Q00z";
    }

    document.getElementById("no").onclick = () => {

      updateProfile("physical-limitations", "None", nextPage);

    }

    document.getElementById("yes").onclick = () => {
      //hide no button
      document.getElementById("no").parentElement.style.display = "none";

      //Show text input
      document.getElementById("physical-limitations").style.display = "block";

      //Show next button
      document.getElementById("next").style.display = "block";

    }

    document.getElementById("next").onclick = () => {

      //Get value from text box
      const physicalLimitations = document.getElementById("physical-limitations").value;
      updateProfile("physical-limitations", physicalLimitations, nextPage);

    }

  }

  async function updateProfile(attributeKey, attributeValue, nextPage) {
    MemberStack.onReady.then(async function(member) {  
      if(attributeKey == "experience") {
        member.updateProfile({
          "experience": attributeValue
        }, true);
      } else if (attributeKey == "goals") {
        member.updateProfile({
          "goals": attributeValue
        }, true);
      } else if (attributeKey == "workout-frequency") {
        member.updateProfile({
          "workout-frequency": attributeValue
        }, true);
      } else if(attributeKey == "workout-duration") {
        member.updateProfile({
          "workout-duration": attributeValue
        }, true);
      } else if(attributeKey == "userDetails") {
        var gymName = sessionStorage.getItem('gymName');
        member.updateProfile({
          "height": attributeValue.height,
          "weight": attributeValue.weight,
          "gender": attributeValue.gender,
          "dob": attributeValue.dob,
          "current-gym": gymName
        }, true);

        attributeValue = {"custom:height": attributeValue.height, "custom:weight": attributeValue.weight, "gender": attributeValue.gender, "custom:dob": attributeValue.dob, "custom:currentGym": gymName};

        await updateAttributes(member["email"], member["cognito-password"], attributeKey, attributeValue, nextPage);
        return;

      } else if(attributeKey == "physical-limitations") {

        // // Retrieve values from sessionStorage
        var gymName = sessionStorage.getItem('gymName');
        var gymId = sessionStorage.getItem('gymId');
        var staffEmail = sessionStorage.getItem('staffEmail');

        member.updateProfile({
          "physical-limitations": attributeValue
        }, true);

        var userObj = member;
        userObj["initials"] = member["first-name"][0] + member["last-name"][0];

        // Add sessionStorage values to userObj
        userObj["gymName"] = gymName;
        userObj["gymId"] = gymId;
        userObj["staffName"] = staffEmail;
        userObj["physical-limitations"] = attributeValue;

        var webhook = "";
        if(staffEmail != null) {
          webhook = "https://hook.us1.make.com/bcljq4gu8uo3v3lgoq85sv6hdihdqo1u";
        } else {
          webhook = "https://hook.us1.make.com/g3wit8xuonhumsifktuj3bknz783x70q"
        }

        await createUserInWebflow(webhook, userObj);

      }

      var cognitoKey = "custom:"+attributeKey;

      await updateAttributes(member["email"], member["cognito-password"], cognitoKey, attributeValue, nextPage);
    });
    
  }

  async function createUserInWebflow(webhook, userObj) {
    fetch(webhook, {
      method: "POST",
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify(userObj)
    }).then((res) => {
      if (res.ok) {
        return res.text();
      }
      throw new Error('Something went wrong');
    })
    .then((data) => {
     
    })
    .catch((error) => {
      console.log(error);
      alert("Unable to update details - please try again");
      location.reload();
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

  async function updateAttributes(userName, password, attributeKey, attributeValue, nextPage) {
    // Initialize the Amazon Cognito identity object
    var poolData = await getPoolData();
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  
    // Set up the user's authentication credentials
    var authenticationData = {
      Username: userName,
      Password: password,
    };
  
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
  
    // Create a Cognito user object
    var userData = {
      Username: userName,
      Pool: userPool
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  
    // Authenticate the user
    await cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: async function (result) {
        console.log('User authenticated successfully:', result);
  
        // Define the new attribute values to update
        var attributeList = [];
  
        if (attributeKey == 'userDetails') {
          for (const [key, value] of Object.entries(attributeValue)) {
            var attribute = new AmazonCognitoIdentity.CognitoUserAttribute({
              Name: key,
              Value: value
            });
            attributeList.push(attribute);
          }
        } else {
          var attribute = new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: attributeKey,
            Value: attributeValue
          });
          attributeList.push(attribute);
        }
        // Call the updateUserAttributes function to update the user's attributes
        await cognitoUser.updateAttributes(attributeList, function (err, result) {
          if (err) {
            console.log('Error updating user attributes:', err);
            return;
          }
          console.log('User attributes updated successfully:', result);
          document.location.href = nextPage;
        });
      },
      onFailure: function (err) {
        console.log('Error authenticating user:', err);
        alert("Cannot find user, please try again");
        window.location = "https://safeform.app/user-sign-up";
      }
    });
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
      //throw new Error('Unable to retrieve details'); // Throw an error instead of showing an alert
      return error
    });
  }

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

  var cognitoUser;
}
