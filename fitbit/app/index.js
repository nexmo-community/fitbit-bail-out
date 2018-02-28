import document from "document";
import * as messaging from "messaging";

const CONNECTED_ICON = "connected.png";
const DISCONNECTED_ICON = "disconnected.png";

class BailOutUI {
  constructor() {
    // Look up our two UI elements:
    this.bailOutButton = document.getElementById("bailoutbutton");
    this.connectivityIcon = document.getElementById("connectivityicon");

    // These two methods are callbacks, so we need to bind them to this instance:
    this.bailOutActivate = this.bailOutActivate.bind(this);
    this.connectivityCheck = this.connectivityCheck.bind(this);

    this.bailOutButton.onactivate = this.bailOutActivate;

    // Once a second, we see if we're connected to the companion app:
    setInterval(this.connectivityCheck, 1000);
  }

  // Send a message to the companion app, telling it to trigger a "bail out".
  bailOutActivate() {
    messaging.peerSocket.send({
      type: "event",
      event: "bailout"
    });
  }

  // Check if we have a connection to the campanion app, and update the UI accordingly.
  connectivityCheck() {
    this.updateConnectivity(
      messaging.peerSocket.readyState == messaging.peerSocket.OPEN
    );
  }

  // Update the UI to indicate if we're connected to the companion app or not.
  updateConnectivity(connected) {
    this.connectivityIcon.href = connected ? CONNECTED_ICON : DISCONNECTED_ICON;
  }
}

var ui = new BailOutUI();
