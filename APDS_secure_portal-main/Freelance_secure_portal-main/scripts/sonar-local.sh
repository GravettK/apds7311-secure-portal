#!/usr/bin/env bash
set -euo pipefail

# Local SonarQube scan helper (macOS/Linux)
# Requirements: SonarQube running at http://localhost:9001
# Usage: ./sonar-local.sh
#        Or: SONAR_TOKEN=your_token ./sonar-local.sh

# Default token (update if you regenerate it)
DEFAULT_TOKEN="sqp_57c9315d2fd07854f27452bcc29ec0017e7b52e8"

# Use provided token or default
SONAR_TOKEN="${SONAR_TOKEN:-$DEFAULT_TOKEN}"

# Change to project root directory (parent of scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Running SonarQube scan from: $PROJECT_ROOT"
echo "Project Key: application_testing"
echo "SonarQube URL: http://localhost:9001"
echo ""

# Check if sonar-scanner is already in PATH
if command -v sonar-scanner &> /dev/null; then
  echo "Using system sonar-scanner..."
  sonar-scanner \
    -Dsonar.projectKey=application_testing \
    -Dsonar.sources=. \
    -Dsonar.host.url=http://localhost:9001 \
    -Dsonar.login="$SONAR_TOKEN"
else
  echo "SonarScanner not found in PATH. Downloading and installing..."
  
  SCANNER_VERSION=4.7.0.2747
  SCANNER_HOME="$HOME/.sonar/sonar-scanner-$SCANNER_VERSION-macosx"
  
  mkdir -p "$HOME/.sonar"
  
  # Check if already downloaded
  if [ ! -d "$SCANNER_HOME" ]; then
    echo "Downloading SonarScanner..."
    curl --create-dirs -sSLo "$HOME/.sonar/sonar-scanner.zip" \
      "https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-$SCANNER_VERSION-macosx.zip"
    echo "Extracting..."
    unzip -o "$HOME/.sonar/sonar-scanner.zip" -d "$HOME/.sonar/" >/dev/null
  fi
  
  export PATH="$SCANNER_HOME/bin:$PATH"
  export SONAR_SCANNER_OPTS="-server"
  
  sonar-scanner \
    -Dsonar.projectKey=application_testing \
    -Dsonar.sources=. \
    -Dsonar.host.url=http://localhost:9001 \
    -Dsonar.login="$SONAR_TOKEN"
fi

echo ""
echo "Scan complete! Check SonarQube UI at http://localhost:9001"


