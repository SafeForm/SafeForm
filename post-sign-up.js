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
        const response = await fetch("https://hook.us1.make.com/gyuuh5tiw2ey28dqrt9xpqjq633l925h", {
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
          //sessionStorage.setItem("memberPage", responseData)
          localStorage.removeItem("memberstack");
          window.location.href = window.location.origin + `/users/${responseData}`;

        } else {
          console.log("Empty member page");
        }
      } catch (error) {
        // Handle any errors that occurred during the fetch
        console.error('Error checking member page:', error);
      }
    }

    //First check if they are a 1:1 client or not
    if(member.loggedIn && !member.height) {
      // Check for member page every 2 seconds
      const intervalId = setInterval(checkMemberPage, 2000);
    } else {
      window.location.href = window.location.origin + "/post-sign-up-1-1";
    }
    

  });
}
