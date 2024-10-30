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


  document.getElementById('fc-sign-up').addEventListener('click', async function(event) {

    var fc = {};
    fc["email"] = document.getElementById("email").value;
    
    sendFCToMake(fc);
  
  });
  
  async function sendFCToMake(fc) {
    try {
      const response = await fetch("https://hook.us1.make.com/zt36ux3jg2xv15xvyo09l3qhtu3gxev6", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(fc)
      });
  
      if (response.ok) {
        console.log("Data sent successfully.");
      } else {
        console.log("Error sending data:", response.statusText);
      }
    } catch (error) {
      console.log("Error:", error);
    }
  }
  



}
