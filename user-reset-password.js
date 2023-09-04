if (document.readyState !== 'loading') {
  main();
} else {
  document.addEventListener('DOMContentLoaded', function () {
      main();
  });
}

function main() {

  MemberStack.onReady.then(async function(member) {  

    const resetPasswordState = localStorage.getItem("resetPassword");
    //Check if password needs to be updated
    if(resetPasswordState == "true") {
      
      const userDetails = {"email": member["email"]};

      fetch("https://hook.us1.make.com/2edfoau3ur5o4khjvnfsypvglnnxordh", {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(userDetails)
      }).then((res) => {
        if (res.ok) {
          return res.text();
        }
        throw new Error('Something went wrong');
      })
      .then((data) => {
        if(data != "Accepted") {
          //Update details in cognito
          const tempPW = atob(member["cognito-password"]);
          resetPassword(member["email"], tempPW, data)
          // Update details in memberstack
          member.updateProfile({
            "cognito-password": btoa(data),
          }, false)
        }
      })
      .catch((error) => {
        console.log(error);
      });
      localStorage.setItem("resetPassword", "false");
    }

  });

  async function resetPassword(username, tempPassword, newPassword) {
    
    const userPool = await getUserPool(); // Get the user pool instance
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser({ Username: username, Pool: userPool });
    const authenticationData = { Username: username, Password: tempPassword };
    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
    
    // Initiate the password reset
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function(result) {
        cognitoUser.changePassword(tempPassword, newPassword, function(err, result) {
          if (err) {
            console.error(err);
          } else {
            console.log(result);
          }
        });
      },
      onFailure: function(err) {
        console.error(err);
        alert('Failed to authenticate user. Please contact your trainer.');
        localStorage.setItem("resetPassword", "true");
      }
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
      console.log(error);
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
}
