#!/usr/bin/env node

/**
 * Release script for lambda-running
 * Automates the process of publishing new versions of the package to npm
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Utility to run shell commands
function runCommand(command) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Create readline interface for user input
let rl;

// Initialize readline interface
function initReadline() {
  if (!rl || rl.closed) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }
}

// Close readline interface
function closeReadline() {
  if (rl && !rl.closed) {
    rl.close();
  }
}

// Prompt for user input
function prompt(question) {
  return new Promise((resolve) => {
    initReadline(); // Ensure we have an active readline interface
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Main release function
async function release() {
  // Define promptForReleaseNotes function at function body root
  async function promptForReleaseNotes(newVersion) {
    console.log('\nPlease enter release notes (enter an empty line to finish):');
    let notes = '';

    const collectNotes = async () => {
      let line = await prompt('> ');
      if (line.trim() === '') {
        console.log('\nRelease notes saved.');
        // Don't close rl here, we'll need it later
        continueRelease(newVersion, notes);
        return;
      }
      notes += line + '\n';
      collectNotes();
    };

    collectNotes();
  }

  try {
    // Check for uncommitted changes
    try {
      execSync('git diff-index --quiet HEAD --');
    } catch (e) {
      const answer = await prompt('You have uncommitted changes. Continue anyway? (y/n): ');
      if (answer.toLowerCase() !== 'y') {
        console.log('Release cancelled.');
        closeReadline();
        return;
      }
    }

    // Read current version from package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;
    console.log(`Current version: ${currentVersion}`);

    // Ask for version increment type
    console.log('\nVersion increment options:');
    console.log('1. patch (0.1.0 -> 0.1.1) - Bug fixes');
    console.log('2. minor (0.1.0 -> 0.2.0) - New features, backward compatible');
    console.log('3. major (0.1.0 -> 1.0.0) - Breaking changes');
    console.log('4. custom - Enter your own version');

    const versionType = await prompt('\nEnter your choice (1-4): ');

    let newVersion;
    if (versionType === '4') {
      newVersion = await prompt('Enter the new version (x.y.z): ');
    } else {
      // Run npm version without git tag and commit
      const versionArg =
        {
          1: 'patch',
          2: 'minor',
          3: 'major',
        }[versionType] || 'patch';

      // Update version in package.json
      const [major, minor, patch] = currentVersion.split('.').map(Number);

      if (versionArg === 'patch') {
        newVersion = `${major}.${minor}.${patch + 1}`;
      } else if (versionArg === 'minor') {
        newVersion = `${major}.${minor + 1}.0`;
      } else if (versionArg === 'major') {
        newVersion = `${major + 1}.0.0`;
      }
    }

    // Confirm the new version
    console.log(`\nNew version will be: ${newVersion}`);
    const confirmVersion = await prompt('Proceed with this version? (y/n): ');

    if (confirmVersion.toLowerCase() !== 'y') {
      console.log('Release cancelled.');
      closeReadline();
      return;
    }

    // Update package.json with new version
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`Updated package.json to version ${newVersion}`);

    // Check if release notes file already exists
    const releaseDir = path.join(process.cwd(), 'releases');
    const releaseNotesPath = path.join(releaseDir, `v${newVersion}.md`);
    let releaseNotes = '';

    if (fs.existsSync(releaseNotesPath)) {
      // Use existing release notes file
      console.log(`\nFound existing release notes at ${releaseNotesPath}`);
      releaseNotes = fs.readFileSync(releaseNotesPath, 'utf8');

      // Extract content after the header
      const contentMatch = releaseNotes.match(/# Version [^\n]*\n\n([\s\S]*)/);
      if (contentMatch && contentMatch[1]) {
        releaseNotes = contentMatch[1];
      }

      console.log('\nRelease notes content:');
      console.log('---------------------');
      console.log(releaseNotes);
      console.log('---------------------');

      const useExistingNotes = await prompt('\nUse these release notes? (y/n): ');
      if (useExistingNotes.toLowerCase() !== 'y') {
        // If user doesn't want to use existing notes, prompt for them
        await promptForReleaseNotes(newVersion);
        return;
      }

      // Continue with existing notes
      continueRelease(newVersion, releaseNotes);
    } else {
      // If release notes file doesn't exist, create it
      console.log(`\nNo release notes found for version ${newVersion}.`);
      await promptForReleaseNotes(newVersion);
    }
  } catch (error) {
    console.error('Error during release process:', error);
    closeReadline(); // Close readline on error
  }
}

// Continue the release process after getting release notes
async function continueRelease(newVersion, releaseNotes) {
  try {
    // Save release notes to a file
    const releaseDir = path.join(process.cwd(), 'releases');
    if (!fs.existsSync(releaseDir)) {
      fs.mkdirSync(releaseDir, { recursive: true });
    }

    const releaseNotesPath = path.join(releaseDir, `v${newVersion}.md`);

    // Only write the file if it doesn't already exist or we collected new notes
    if (!fs.existsSync(releaseNotesPath) || releaseNotes.trim() !== '') {
      fs.writeFileSync(releaseNotesPath, `# Version ${newVersion}\n\n${releaseNotes}`);
      console.log(`Release notes saved to ${releaseNotesPath}`);
    }

    // Run build script
    console.log('\nBuilding the package...');
    if (!runCommand('npm run build')) {
      const answer = await prompt('Build failed. Continue anyway? (y/n): ');
      if (answer.toLowerCase() !== 'y') {
        console.log('Release cancelled.');
        return;
      }
    }

    // Run tests if available
    console.log('\nRunning tests...');
    if (!runCommand('npm test')) {
      const answer = await prompt('Tests failed. Continue anyway? (y/n): ');
      if (answer.toLowerCase() !== 'y') {
        console.log('Release cancelled.');
        return;
      }
    }

    // Publish to npm
    console.log('\nPublishing to npm...');
    if (!runCommand('npm publish')) {
      console.log('Failed to publish to npm. Please check the errors above.');
      return;
    }

    // Optionally create a git tag
    const createTag = await prompt('\nCreate git tag for this release? (y/n): ');
    if (createTag.toLowerCase() === 'y') {
      runCommand(`git tag -a v${newVersion} -m "Version ${newVersion}"`);

      const pushTag = await prompt('Push tag to remote repository? (y/n): ');
      if (pushTag.toLowerCase() === 'y') {
        runCommand('git push --tags');
      }
    }

    console.log(`\n🎉 Successfully released version ${newVersion}!`);
  } catch (error) {
    console.error('Error during release process:', error);
  } finally {
    closeReadline(); // Always close readline when finished
  }
}

// Start the release process
release();
