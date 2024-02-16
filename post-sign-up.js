if (document.readyState !== 'loading') {
  mainFunc();
} else {
  document.addEventListener('DOMContentLoaded', function () {
    mainFunc();
  });
}

function mainFunc() {
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
          setTimeout(() => {
            window.location.href = window.location.origin + `/user-programs/${responseData}`;
        }, 7000);

        } else {
          console.log("Empty member page");
        }
      } catch (error) {
        // Handle any errors that occurred during the fetch
        console.error('Error checking member page:', error);
      }
    }

    // Check for member page every 7 seconds
    const intervalId = setInterval(checkMemberPage, 5000);

  });
}
