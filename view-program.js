MemberStack.onReady.then(async function(member) {  
  if(!member.loggedIn) {
    document.getElementById("sign-in").style.display = "block";    	
  }
});
