#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ANSI color codes for fun output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const { bright, green, yellow, blue, magenta, cyan, red, reset } = colors;

// Fun ASCII art
const logo = `
${magenta}╔═══════════════════════════════════════════════════════════════╗${reset}
${magenta}║${reset}  ${cyan}🚀 PROJECT RENAMER 3000${reset} ${magenta}║${reset}
${magenta}║${reset}     ${yellow}Transform your template into something awesome!${reset}     ${magenta}║${reset}
${magenta}╚═══════════════════════════════════════════════════════════════╝${reset}
`;

function log(message, color = reset) {
  console.log(`${color}${message}${reset}`);
}

function logStep(step, message) {
  log(`${bright}${blue}[${step}]${reset} ${message}`);
}

function logSuccess(message) {
  log(`${green}✅ ${message}${reset}`);
}

function logWarning(message) {
  log(`${yellow}⚠️  ${message}${reset}`);
}

function logError(message) {
  log(`${red}❌ ${message}${reset}`);
}

// Validation functions
function validateProjectName(name) {
  if (!name) {
    throw new Error('Project name is required');
  }
  
  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new Error('Project name must contain only lowercase letters, numbers, and hyphens');
  }
  
  if (name.length < 2) {
    throw new Error('Project name must be at least 2 characters long');
  }
  
  if (name.length > 50) {
    throw new Error('Project name must be less than 50 characters long');
  }
  
  if (name.startsWith('-') || name.endsWith('-')) {
    throw new Error('Project name cannot start or end with a hyphen');
  }
  
  return true;
}

function validateScopeName(scope) {
  if (!scope) {
    throw new Error('Scope name is required');
  }
  
  if (!/^[a-z0-9-]+$/.test(scope)) {
    throw new Error('Scope name must contain only lowercase letters, numbers, and hyphens');
  }
  
  if (scope.length < 2) {
    throw new Error('Scope name must be at least 2 characters long');
  }
  
  if (scope.length > 30) {
    throw new Error('Scope name must be less than 30 characters long');
  }
  
  return true;
}

// File processing functions
function updateJsonFile(filePath, updater) {
  if (!fs.existsSync(filePath)) {
    logWarning(`File not found: ${filePath}`);
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    const updated = updater(json);
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2) + '\n');
    logSuccess(`Updated ${path.relative(rootDir, filePath)}`);
  } catch (error) {
    logError(`Failed to update ${filePath}: ${error.message}`);
  }
}

function updateTextFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    logWarning(`File not found: ${filePath}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    for (const [search, replace] of replacements) {
      const regex = new RegExp(search, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, replace);
        changed = true;
      }
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content);
      logSuccess(`Updated ${path.relative(rootDir, filePath)}`);
    }
  } catch (error) {
    logError(`Failed to update ${filePath}: ${error.message}`);
  }
}

function getReplacements(projectName, scopeName) {
  return [
    // Package names
    ['fullstack-pb-template', projectName],
    ['@project/', `@${scopeName}/`],
    
    // Docker image names
    ['dastro/fullstack-pb-template', `${scopeName}/${projectName}`],
    
    // Documentation references
    ['FULLSTACK-PB-TEMPLATE', projectName.toUpperCase()],
    ['Fullstack is a comprehensive', `${projectName} is a comprehensive`],
    
    // Workspace references in commands
    [`yarn workspace @project/`, `yarn workspace @${scopeName}/`],
    [`yarn focus @project/`, `yarn focus @${scopeName}/`],
    
    // Import statements
    [`from '@project/shared`, `from '@${scopeName}/shared`],
    [`import.*@project/shared`, `import.*@${scopeName}/shared`],
  ];
}

async function main() {
  console.log(logo);
  
  // Get command line arguments
  const args = process.argv.slice(2);
  let projectName = args[0];
  let scopeName = args[1];
  
  // Interactive prompts if not provided
  if (!projectName) {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const question = (prompt) => new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
    
    log(`${bright}Let's set up your awesome project!${reset}\n`);
    
    projectName = await question(`${cyan}📦 What's your project name? ${yellow}(e.g., my-awesome-app)${reset}: `);
    scopeName = await question(`${cyan}🏷️  What's your npm scope? ${yellow}(e.g., mycompany)${reset}: `);
    
    rl.close();
  }
  
  // Validate inputs
  try {
    validateProjectName(projectName);
    validateScopeName(scopeName);
  } catch (error) {
    logError(error.message);
    process.exit(1);
  }
  
  log(`\n${bright}Configuration:${reset}`);
  log(`  ${blue}Project Name:${reset} ${projectName}`);
  log(`  ${blue}Scope Name:${reset} @${scopeName}`);
  log(`  ${blue}Workspaces:${reset} @${scopeName}/app, @${scopeName}/functions, @${scopeName}/shared\n`);
  
  // Confirm before proceeding
  if (!args[0]) {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const confirm = await new Promise((resolve) => {
      rl.question(`${yellow}Continue with this configuration? ${bright}(y/N)${reset}: `, resolve);
    });
    
    rl.close();
    
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      log(`${yellow}Operation cancelled.${reset}`);
      process.exit(0);
    }
  }
  
  const replacements = getReplacements(projectName, scopeName);
  
  // Step 1: Update package.json files
  logStep('1/6', 'Updating package.json files...');
  
  // Root package.json
  updateJsonFile(path.join(rootDir, 'package.json'), (json) => ({
    ...json,
    name: projectName,
    scripts: {
      ...json.scripts,
      'migrate:generate': `yarn workspace @${scopeName}/shared migrate:generate`,
      'migrate:status': `yarn workspace @${scopeName}/shared migrate:status`,
      dev: `concurrently "yarn workspace @${scopeName}/shared dev" "yarn workspace @${scopeName}/app dev" "yarn workspace @${scopeName}/functions dev" "./pocketbase/pocketbase serve --http=\\"0.0.0.0:8080\\""`,
    }
  }));
  
  // App package.json
  updateJsonFile(path.join(rootDir, 'app/package.json'), (json) => ({
    ...json,
    name: `@${scopeName}/app`,
    dependencies: {
      ...json.dependencies,
      [`@${scopeName}/shared`]: 'workspace:*'
    }
  }));
  
  // Functions package.json
  updateJsonFile(path.join(rootDir, 'functions/package.json'), (json) => ({
    ...json,
    name: `@${scopeName}/functions`,
    dependencies: {
      ...json.dependencies,
      [`@${scopeName}/shared`]: 'workspace:*'
    }
  }));
  
  // Shared package.json
  updateJsonFile(path.join(rootDir, 'shared/package.json'), (json) => ({
    ...json,
    name: `@${scopeName}/shared`,
    description: `Shared zod schemas for ${projectName}`
  }));
  
  // Step 2: Update README files
  logStep('2/6', 'Updating documentation...');
  
  updateTextFile(path.join(rootDir, 'README.md'), replacements);
  updateTextFile(path.join(rootDir, 'functions/README.md'), replacements);
  
  // Step 3: Update GitHub workflows
  logStep('3/6', 'Updating GitHub workflows...');
  
  const workflowFiles = [
    '.github/workflows/release-please.yml',
    '.github/workflows/nightly-docker-build.yml',
    '.github/workflows/docker-publish.yml'
  ];
  
  workflowFiles.forEach(file => {
    updateTextFile(path.join(rootDir, file), replacements);
  });
  
  // Step 4: Update steering files
  logStep('4/6', 'Updating steering documentation...');
  
  const steeringFiles = [
    '.kiro/steering/tech.md',
    '.kiro/steering/structure.md',
    '.kiro/steering/schema-driven-migrations.md'
  ];
  
  steeringFiles.forEach(file => {
    updateTextFile(path.join(rootDir, file), replacements);
  });
  
  // Step 5: Clean up yarn.lock and node_modules
  logStep('5/6', 'Cleaning up dependencies...');
  
  try {
    // Remove yarn.lock to force regeneration with new package names
    if (fs.existsSync(path.join(rootDir, 'yarn.lock'))) {
      fs.unlinkSync(path.join(rootDir, 'yarn.lock'));
      logSuccess('Removed yarn.lock');
    }
    
    // Remove node_modules directories
    const nodeModulesDirs = [
      'node_modules',
      'app/node_modules',
      'functions/node_modules',
      'shared/node_modules'
    ];
    
    nodeModulesDirs.forEach(dir => {
      const fullPath = path.join(rootDir, dir);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        logSuccess(`Removed ${dir}`);
      }
    });
  } catch (error) {
    logWarning(`Failed to clean dependencies: ${error.message}`);
  }
  
  // Step 6: Reinstall dependencies
  logStep('6/6', 'Reinstalling dependencies...');
  
  try {
    execSync('yarn install', { 
      cwd: rootDir, 
      stdio: 'inherit',
      timeout: 120000 // 2 minutes timeout
    });
    logSuccess('Dependencies reinstalled successfully');
  } catch (error) {
    logError('Failed to reinstall dependencies. Please run "yarn install" manually.');
  }
  
  // Success message
  log(`\n${green}${bright}🎉 Project renamed successfully!${reset}\n`);
  
  log(`${bright}Your project is now configured as:${reset}`);
  log(`  ${blue}📦 Project:${reset} ${projectName}`);
  log(`  ${blue}🏷️  Scope:${reset} @${scopeName}`);
  log(`  ${blue}🔧 Workspaces:${reset}`);
  log(`    • @${scopeName}/app (React frontend)`);
  log(`    • @${scopeName}/functions (Express backend)`);
  log(`    • @${scopeName}/shared (Shared library)`);
  
  log(`\n${bright}Next steps:${reset}`);
  log(`  ${cyan}1.${reset} Update your git remote: ${yellow}git remote set-url origin <your-repo-url>${reset}`);
  log(`  ${cyan}2.${reset} Start development: ${yellow}yarn dev${reset}`);
  log(`  ${cyan}3.${reset} Build your awesome project! ${magenta}🚀${reset}`);
  
  log(`\n${bright}Happy coding! 🎯${reset}`);
}

// Run the script
main().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});