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

async function main() {

  //Check what page the user is on:
  const pathname = window.location.pathname;
  var baseURL = window.location.origin;


  //Check if user is logged in
  MemberStack.onReady.then(function(member) {  

    // check if member is logged in  
    if(!member.loggedIn) {
      alert("Cannot find user, please try again");
      var baseURL = window.location.origin;
      window.location = baseURL + "/user-sign-in";
    }

    if(pathname == "/user-space/user-account-info") {
      if(member.memberPage) {
        document.getElementById("home").href = window.location.origin + `/${member.memberPage}`;
      }
      const weightUnit = member.weightunit;
      if(weightUnit) {
        if(weightUnit == "kg") {
          document.getElementById("kgRadio").previousElementSibling.classList.add("w--redirected-checked");
        } else {
          document.getElementById("lbsRadio").previousElementSibling.classList.add("w--redirected-checked");
        }
      } else {
        document.getElementById("kgRadio").previousElementSibling.classList.add("w--redirected-checked");
      }
    }


  })


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
      nextPage = window.location.origin + "/workouts/workout-navigation";
    } else {
      nextPage = "https://buy.stripe.com/4gw15Lgh7gKaare28G";
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

  } else if(pathname == "/user-space/user-account-info") {

    document.getElementById('first-name').addEventListener('blur', function(event) {
      const firstName = document.getElementById("first-name").value;
      updateProfile("first-name", firstName, null, true);
    });

    document.getElementById('last-name').addEventListener('blur', function(event) {
      const lastName = document.getElementById("last-name").value;
      updateProfile("last-name", lastName, null, true);
    });

    document.addEventListener('click', function(event) {

      if(event.target.id == "kgRadio" || event.target.id == "lbsRadio") {

        if(event.target.id == "kgRadio") {
          updateProfile("weightUnit", "kg", null, true);
          localStorage.setItem("weightUnit", "kg");
        } else {
          updateProfile("weightUnit", "lbs", null, true);
          localStorage.setItem("weightUnit", "lbs");
        }
      }

    });

    /*
    document.getElementById('experience').addEventListener('blur', function(event) {
      const experience = document.getElementById("experience").value;
      updateProfile("experience", experience, null, true);
    });
    
    document.getElementById('goals').addEventListener('blur', function(event) {
      const goals = document.getElementById("goals").value;
      updateProfile("goals", goals, null, true);
    });
    
    document.getElementById('workout-frequency').addEventListener('blur', function(event) {
      const workoutFrequency = document.getElementById("workout-frequency").value;
      updateProfile("workout-frequency", workoutFrequency, null, true);
    });
    
    document.getElementById('workout-duration').addEventListener('blur', function(event) {
      const workoutDuration = document.getElementById("workout-duration").value;
      updateProfile("workout-duration", workoutDuration, null, true);
    });
    
    document.getElementById('height').addEventListener('blur', function(event) {
      const height = document.getElementById("height").value;
      updateProfile("height", height, null, true);
    });
    
    document.getElementById('weight').addEventListener('blur', function(event) {
      const weight = document.getElementById("weight").value;
      updateProfile("weight", weight, null, true);
    });
    
    document.getElementById('physical-limitations').addEventListener('blur', function(event) {
      const physicalLimitations = document.getElementById("physical-limitations").value;
      updateProfile("physical-limitations", physicalLimitations, null, true);
    });
    */
  }

  async function updateProfile(attributeKey, attributeValue, nextPage, userProfile=false) {
    MemberStack.onReady.then(async function(member) {  
      
      if(attributeKey == "first-name") {
        await member.updateProfile({
          "first-name": attributeValue
        }, true);
        attributeKey = "given_name";
        member["first-name"] = attributeValue;
      } else if (attributeKey == "last-name") {
        await member.updateProfile({
          "last-name": attributeValue
        }, true);
        member["last-name"] = attributeValue;
        attributeKey = "family_name";
      } else if (attributeKey == "mobile") {
        await member.updateProfile({
          "mobile": attributeValue
        }, true);
        member["mobile"] = attributeValue;
        attributeKey = "phone";
      } else if (attributeKey == "weightUnit") {
        await member.updateProfile({
          "weightunit": attributeValue
        }, true);
        member["weightunit"] = attributeValue;
      } else if (attributeKey == "height") {
        await member.updateProfile({
          "height": attributeValue
        }, true);
        member["height"] = attributeValue;
      } else if (attributeKey == "weight") {
        await member.updateProfile({
          "weight": attributeValue
        }, true);
        member["weight"] = attributeValue;
      } else if(attributeKey == "experience") {
        await member.updateProfile({
          "experience": attributeValue
        }, true);
        member["experience"] = attributeValue;
      } else if (attributeKey == "goals") {
        await member.updateProfile({
          "goals": attributeValue
        }, true);
        member["goals"] = attributeValue;
      } else if (attributeKey == "workout-frequency") {
        await member.updateProfile({
          "workout-frequency": attributeValue
        }, true);
        member["workout-frequency"] = attributeValue;
      } else if(attributeKey == "workout-duration") {
        await member.updateProfile({
          "workout-duration": attributeValue
        }, true);
        member["workout-duration"] = attributeValue;
      } else if(attributeKey == "userDetails") {
        var gymName = localStorage.getItem('fromGym');
        member.updateProfile({
          "height": attributeValue.height,
          "weight": attributeValue.weight,
          "gender": attributeValue.gender,
          "dob": attributeValue.dob,
          "current-gym": gymName
        }, true);

        attributeValue = {"custom:height": attributeValue.height, "custom:weight": attributeValue.weight, "gender": attributeValue.gender, "custom:dob": attributeValue.dob, "custom:currentGym": gymName};

        await updateAttributes(member["email"], atob(member["cognito-password"]), attributeKey, attributeValue, nextPage);
        return;

      } else if(attributeKey == "physical-limitations") {

        // // Retrieve values from sessionStorage
        var gymName = localStorage.getItem('fromGym');
        var gymId = sessionStorage.getItem('gymId');
        var staffEmail = sessionStorage.getItem('staffEmail');

        await member.updateProfile({
          "physical-limitations": attributeValue
        }, true);
        member["physical-limitations"] = attributeValue;
        var userObj = member;
        userObj["initials"] = member["first-name"][0] + member["last-name"][0];

        // Add sessionStorage values to userObj
        userObj["gymName"] = gymName;
        userObj["gymId"] = gymId;
        userObj["staffName"] = staffEmail;
        userObj["physical-limitations"] = attributeValue;

        var webhook = "";
        if(staffEmail != null)  {
          webhook = "https://hook.us1.make.com/bcljq4gu8uo3v3lgoq85sv6hdihdqo1u";
        } else {
          webhook = "https://hook.us1.make.com/g3wit8xuonhumsifktuj3bknz783x70q"
        }

        if(!userProfile) {
          await createUserInWebflow(webhook, userObj);
        }

      }

      var cognitoKey = ""

      if(attributeKey != "given_name" && attributeKey != "family_name") {
        cognitoKey = "custom:"+attributeKey;
      } else {
        cognitoKey = attributeKey;
      }

      await updateAttributes(member["email"], atob(member["cognito-password"]), cognitoKey, attributeValue, nextPage);

      if(userProfile) {
        updateUserWebflow(member);
      }
    });
    
  }

  async function updateUserWebflow(member) {
    fetch("https://hook.us1.make.com/r4f3zmq1xspprsmr8qhb85cmga2sfn3a", {
      method: "POST",
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify(member)
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

  async function updateAttributes(userName, password, attributeKey, attributeValue, nextPage=null) {
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
          if(nextPage != null) {
            document.location.href = nextPage;
          }
          
        });
      },
      onFailure: function (err) {
        console.log('Error authenticating user:', err);
        alert("Cannot find user, please try again");
        var baseURL = window.location.origin;
        window.location = baseURL+"/user-sign-in";
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
