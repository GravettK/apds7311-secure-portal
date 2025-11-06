@echo off
REM SonarQube Scanner Script for Windows
REM Make sure SonarQube is running at http://localhost:9001

echo Running SonarQube scan...
echo.

sonar-scanner ^
  -Dsonar.projectKey=application_testing ^
  -Dsonar.sources=. ^
  -Dsonar.host.url=http://localhost:9001 ^
  -Dsonar.login=sqp_57c9315d2fd07854f27452bcc29ec0017e7b52e8

echo.
echo Scan complete! Check SonarQube UI at http://localhost:9001
pause

