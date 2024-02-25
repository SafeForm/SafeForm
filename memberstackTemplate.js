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

  //Check if user is logged in
  MemberStack.onReady.then(function(member) {  

    if(member.memberPage) {
      document.getElementById("home").href = window.location.origin + `/${member.memberPage}`;
    }

  });

}
