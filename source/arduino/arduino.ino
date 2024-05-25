//#include <SoftwareSerial.h>

/*
  arduino.ino
  NOTE: The file and the folder that contains it must have the same name!!!!
        The VSCode Arduino plugin won't compile and download it otherwise!!!


  Passthrough code performs two functions:
  1. Monitor battery voltage from analog input A0 and pass to the host through Serial.
  2. Monitor remote commands coming from Serial1, and pass them to the host through Serial.
*/

unsigned long timeOfLastUpdate = millis();

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 115200 bits per second:

  // Serial connects to the Sonar controller, our host.
  Serial.begin(115200);
  //Serial.setTimeout(10);

  // Serial1 connects to a remote command source.
  Serial1.begin(115200);
  //Serial1.setTimeout(10);

  // We will be blinking the builting LED, just for fun.
  pinMode(LED_BUILTIN, OUTPUT);
}

char buffer[200];
int gotLinefeed = 0;

// the loop routine runs over and over again forever:
void loop() {
  int availableCommand = Serial1.available();
  if (availableCommand > 0)
  {
    digitalWrite(LED_BUILTIN, HIGH);
    if (availableCommand > 200)
      availableCommand = 200;

    availableCommand = Serial1.readBytes(buffer, availableCommand);
    gotLinefeed = buffer[availableCommand - 1] == '\n';
    Serial.write(buffer, availableCommand);
  }

  availableCommand = Serial.available();
  if (availableCommand > 0)
  {
    digitalWrite(LED_BUILTIN, HIGH);
    if (availableCommand > 200)
      availableCommand = 200;
    availableCommand = Serial.readBytes(buffer, availableCommand);
    Serial1.write(buffer, availableCommand);
  }

  // We want to periodically send voltage and other status, regardless of remote commands.
  unsigned long now = millis();

  // Do an update if either it is time or we have a remote command.
  if (((now - timeOfLastUpdate) > 500) && gotLinefeed)
  {
    // Blink the builtin LED every time we send status to the host.
    digitalWrite(LED_BUILTIN, HIGH);

    // Set up for next time.
    timeOfLastUpdate = now;

    // read the input on analog pin 0:
    int batteryVoltage = analogRead(A8);
    int referenceVoltage = analogRead(A9);

    // The JSON object will have one property at least.
    String command = "{\"Command\":\"Status\",\"batteryVoltage\":";
    command += String(batteryVoltage, DEC);
    command += ",\"referenceVoltage\":";
    command += String(referenceVoltage, DEC);
    command += "}";

    // Send whatever JSON object we have accumulated to the host.
    Serial.println(command);
  }
  digitalWrite(LED_BUILTIN, LOW);
/*
  // We want to periodically send voltage and other status, regardless of remote commands.
  unsigned long now = millis();

  // Capture whether a remote command is available.
  int availableCommand = Serial1.available();

  // Do an update if either it is time or we have a remote command.
  if (((now - timeOfLastUpdate) > 500) || (availableCommand > 0))
  {
    // Blink the builtin LED every time we send status to the host.
    digitalWrite(LED_BUILTIN, HIGH);

    // Set up for next time.
    timeOfLastUpdate = now;

    // read the input on analog pin 0:
    int sensorValue = analogRead(A0);

    // The JSON object will have one property at least.
    String command = "{\"Voltage\":";
    command += String(sensorValue, DEC);

    bool includeRemote = false;
    if (availableCommand > 0)
    {
      // There is a remote command, so incude it in the JSON object.
      // NOTE: It is expected that the remote command is terminated with \n.
      // NOTE: It is expected that the remote command is formatted appropriately
      //       to be the value of a JSON property, such as a quoted string, decimal number,
      //       True/False, short array, or another JSON object.
      String piCommand = Serial1.readStringUntil('\n');
      if (piCommand != NULL)
      {
        String remote = ",\"Remote\":";
        remote += piCommand;
        command += remote;
        includeRemote = true;
      }
    }

    // Close the JSON object.
    command += "}";

    // Send whatever JSON object we have accumulated to the host.
    Serial.println(command);

    // If we got a remote command, return a response.
    // NOTE: We expect our host to return a response JSON object terminated with \n.
    if (includeRemote)
    {
      String response = Serial.readStringUntil('\n');
      Serial1.println(response);
    }
  }
  digitalWrite(LED_BUILTIN, LOW);
*/
}
