import { me } from "companion";
import { settingsStorage } from "settings";
import * as messaging from "messaging";

// CHANGE THIS TO YOUR SERVER!
const BAILOUT_ENDPOINT = "https://CHANGEME.ngrok.io/bail";

if (!me.permissions.granted("access_internet")) {
   console.log("We're not allowed to access the internet :-(");
}

// Listen for the onmessage event
messaging.peerSocket.onmessage = function(evt) {
  if (evt.data.type == 'event') {
    if (evt.data.event == 'bailout') {
      console.log("WE'RE BAILING!");
      let phoneNumber = JSON.parse(settingsStorage.getItem("phoneNumber")).name
      fetch(BAILOUT_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({number: phoneNumber }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }
  
  console.log(JSON.stringify(evt.data));
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
}