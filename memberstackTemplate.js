const devdevMode = localStorage.getItem("devMode");
if (document.readyState !== 'loading') {
  if(devdevMode != undefined) {
    mainFunc();
  }
  
} else {
  document.addEventListener('DOMContentLoaded', function () {
    if(devdevMode != undefined) {
      mainFunc();
    }
  });
}

function mainFunc() {

  //Check if user is logged in
  MemberStack.onReady.then(function(member) {  

    if(member.memberPage) {
      document.getElementById("home").href = window.location.origin + `/${member.memberPage}`;
    }

  });

}
