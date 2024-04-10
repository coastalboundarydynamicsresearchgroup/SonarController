#include <SoftwareSerial.h>

/*
  arduino.ino
  NOTE: The file and the folder that contains it must have the same name!!!!
        The VSCode Arduino plugin won't compile and download it otherwise!!!


  Reads an analog input on pin 0, prints the result to the Serial Monitor.
  Graphical representation is available using Serial Plotter (Tools > Serial Plotter menu).
  Attach the center pin of a potentiometer to pin A0, and the outside pins to +5V and ground.

  This example code is in the public domain.

  https://www.arduino.cc/en/Tutorial/BuiltInExamples/AnalogReadSerial
*/

unsigned long timeOfLastUpdate = 0;

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(115200);
  Serial1.begin(115200);
  Serial1.setTimeout(10);

  pinMode(LED_BUILTIN, OUTPUT);
}

// the loop routine runs over and over again forever:
void loop() {
  digitalWrite(LED_BUILTIN, HIGH);

  unsigned long now = millis();
  String piCommand = Serial1.readString();
  if (((now - timeOfLastUpdate) > 500) || (piCommand != NULL))
  {
    timeOfLastUpdate = now;

    // read the input on analog pin 0:
    int sensorValue = analogRead(A0);

    // print out the value you read:
    Serial.print("{\"Voltage\":");
    Serial.print(sensorValue);

    if (piCommand != NULL)
    {
      Serial.print(",\"Remote\":");
      Serial.print(piCommand);
    }

    Serial.println("}");
  }

  digitalWrite(LED_BUILTIN, LOW);
  delay(100);  // delay in between reads for stability
}
