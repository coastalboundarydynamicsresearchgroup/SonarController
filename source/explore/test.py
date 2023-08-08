from sonar import SonarCommChannel

sonar = SonarCommChannel()

with sonar:
  with open('./sonar.dat', 'wb') as file:
    for _ in range(301):
      sonar_data = sonar.send_switch()
      file.write(sonar_data)



