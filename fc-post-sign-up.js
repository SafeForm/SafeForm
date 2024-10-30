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

  MemberStack.onReady.then(async function (member) {
  
    // Function to check member page and redirect if not set
    async function checkMemberPage() {
      
      var membershipId = member.id;

      try {
        const response = await fetch("https://hook.us1.make.com/ydj7ilofvdjdrcrvys8h9jo3df4yb9vv", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            memberID: membershipId,
          }),
        });

        const responseData = await response.text();

        // If the response is not empty, redirect the user to the page
        if (responseData.trim().toLowerCase() != 'accepted') {

          localStorage.removeItem("memberstack");
          window.location.href = window.location.origin + `/gym-dashboard/${responseData}`;

        } else {
          console.log("Empty member page");
        }
      } catch (error) {
        // Handle any errors that occurred during the fetch
        console.error('Error checking member page:', error);
      }
    }

    if(member.loggedIn) {
      // Check for member page every 3 seconds
      const intervalId = setInterval(checkMemberPage, 3000);
    } else {
      console.log("Checking")
    }
    

  });
}
