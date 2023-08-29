    var utmGymName = document.getElementById("utm_campaign").innerText;
    console.log(utmGymName);
    var randomNumber = Math.random();
    var thumbnailArray = '{{wf {&quot;path&quot;:&quot;thumbnailurl&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}'.split(',');
    if (utmGymName == "sam druce - fitness") {
      var encodedJSON = '{{wf {&quot;path&quot;:&quot;mediajson-2&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}';
      var mediaJSON = encodedJSON.replace(/&quot;/g, "\"");

      var parsedMediaJSON = JSON.parse(mediaJSON);
      var mediaIdToStore = null;
      for (var i = 0; i < parsedMediaJSON.length; i++) {
        if (parsedMediaJSON[i].MediaTrainerName === 'Sam Druce') {
          mediaIdToStore = parsedMediaJSON[i].MediaId;
          break; // No need to continue looping once we've found a match
        }
      }
      
      if (mediaIdToStore !== null) {
        //Find the video in thumbnail array with the media id
        if (thumbnailArray.length > 1) {
          if (thumbnailArray[0].includes(mediaIdToStore)) {
            document.getElementById("videoThumbnail-{{wf {&quot;path&quot;:&quot;slug&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}").src = thumbnailArray[0];
          } else {
            document.getElementById("videoThumbnail-{{wf {&quot;path&quot;:&quot;slug&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}").src = thumbnailArray[1];
          }
        } else {
          document.getElementById("videoThumbnail-{{wf {&quot;path&quot;:&quot;slug&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}").src = '{{wf {&quot;path&quot;:&quot;thumbnailurl&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}';
        }

      }
    } else {
      if (thumbnailArray.length > 1) {
        if (randomNumber < 0.5) {
          document.getElementById("videoThumbnail-{{wf {&quot;path&quot;:&quot;slug&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}").src = thumbnailArray[0];
        } else {
          document.getElementById("videoThumbnail-{{wf {&quot;path&quot;:&quot;slug&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}").src = thumbnailArray[1];
        }
      } else {
        document.getElementById("videoThumbnail-{{wf {&quot;path&quot;:&quot;slug&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}").src = '{{wf {&quot;path&quot;:&quot;thumbnailurl&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}';
      }
    }
