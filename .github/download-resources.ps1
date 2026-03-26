# GitHub Copilot Resources Downloader
# This script downloads agents, instructions, and skills from awesome-copilot

param(
    [switch]$All,
    [switch]$Agents,
    [switch]$Instructions,
    [switch]$Skills,
    [switch]$Update,
    [string[]]$AgentNames,
    [string[]]$InstructionNames,
    [string[]]$SkillNames
)

$BaseUrl = "https://raw.githubusercontent.com/github/awesome-copilot/main"

# Create directories if they don't exist
$Directories = @("agents", "instructions", "skills", "hooks")
foreach ($dir in $Directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✓ Created directory: $dir" -ForegroundColor Green
    }
}

# Function to download a resource
function Download-Resource {
    param(
        [string]$Type,
        [string]$Name,
        [string]$Extension
    )
    
    $url = "$BaseUrl/$Type/$Name.$Extension"
    $output = "$Type/$Name.$Extension"
    
    Write-Host "Downloading $Name ($Type)..." -NoNewline
    try {
        Invoke-WebRequest -Uri $url -OutFile $output -ErrorAction Stop
        Write-Host " ✓" -ForegroundColor Green
        return $true
    } catch {
        Write-Host " ✗ Failed: $_" -ForegroundColor Red
        return $false
    }
}

# Function to download a skill (different structure)
function Download-Skill {
    param([string]$Name)
    
    $skillDir = "skills/$Name"
    if (-not (Test-Path $skillDir)) {
        New-Item -ItemType Directory -Path $skillDir -Force | Out-Null
    }
    
    $url = "$BaseUrl/skills/$Name/SKILL.md"
    $output = "$skillDir/SKILL.md"
    
    Write-Host "Downloading skill: $Name..." -NoNewline
    try {
        Invoke-WebRequest -Uri $url -OutFile $output -ErrorAction Stop
        Write-Host " ✓" -ForegroundColor Green
        return $true
    } catch {
        Write-Host " ✗ Failed: $_" -ForegroundColor Red
        return $false
    }
}

# Priority resources
$PriorityAgents = @(
    "github-actions-expert",
    "devops-expert",
    "lingodotdev-i18n",
    "se-product-manager-advisor",
    "context-architect",
    "se-technical-writer"
)

$PriorityInstructions = @(
    "astro",
    "github-actions-ci-cd-best-practices",
    "localization",
    "markdown-accessibility",
    "a11y",
    "markdown"
)

$PrioritySkills = @(
    "github-issues",
    "gh-cli",
    "git-commit",
    "create-github-issues-feature-from-implementation-plan",
    "documentation-writer",
    "conventional-commit",
    "markdown-to-html"
)

# Download based on parameters
if ($All -or $Update -or (!$Agents -and !$Instructions -and !$Skills -and !$AgentNames -and !$InstructionNames -and !$SkillNames)) {
    Write-Host "`n=== Downloading Priority Agents ===" -ForegroundColor Cyan
    foreach ($agent in $PriorityAgents) {
        Download-Resource -Type "agents" -Name $agent -Extension "agent.md"
    }
    
    Write-Host "`n=== Downloading Priority Instructions ===" -ForegroundColor Cyan
    foreach ($instruction in $PriorityInstructions) {
        Download-Resource -Type "instructions" -Name $instruction -Extension "instructions.md"
    }
    
    Write-Host "`n=== Downloading Priority Skills ===" -ForegroundColor Cyan
    foreach ($skill in $PrioritySkills) {
        Download-Skill -Name $skill
    }
}

# Download specific agents
if ($AgentNames) {
    Write-Host "`n=== Downloading Specified Agents ===" -ForegroundColor Cyan
    foreach ($agent in $AgentNames) {
        Download-Resource -Type "agents" -Name $agent -Extension "agent.md"
    }
}

# Download specific instructions
if ($InstructionNames) {
    Write-Host "`n=== Downloading Specified Instructions ===" -ForegroundColor Cyan
    foreach ($instruction in $InstructionNames) {
        Download-Resource -Type "instructions" -Name $instruction -Extension "instructions.md"
    }
}

# Download specific skills
if ($SkillNames) {
    Write-Host "`n=== Downloading Specified Skills ===" -ForegroundColor Cyan
    foreach ($skill in $SkillNames) {
        Download-Skill -Name $skill
    }
}

Write-Host "`n=== Download Complete ===" -ForegroundColor Green
Write-Host "Resources downloaded to .github/ directory" -ForegroundColor Gray

# Summary
Write-Host "`nInstalled:" -ForegroundColor Cyan
$agentCount = (Get-ChildItem -Path "agents" -Filter "*.agent.md" -ErrorAction SilentlyContinue).Count
$instructionCount = (Get-ChildItem -Path "instructions" -Filter "*.instructions.md" -ErrorAction SilentlyContinue).Count
$skillCount = (Get-ChildItem -Path "skills" -Directory -ErrorAction SilentlyContinue).Count
Write-Host "  - $agentCount agents"
Write-Host "  - $instructionCount instructions"
Write-Host "  - $skillCount skills"

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Open VS Code in this repository"
Write-Host "  2. Install agents via 'GitHub Copilot: Install Custom Agent'"
Write-Host "  3. Instructions in copilot-instructions.md are automatically active"
Write-Host "  4. Reference skills in your Copilot prompts"
Write-Host "`nFor help, see .github/README.md" -ForegroundColor Gray

<#
.SYNOPSIS
    Downloads GitHub Copilot custom resources from awesome-copilot repository

.DESCRIPTION
    This script downloads agents, instructions, and skills from the github/awesome-copilot
    repository to enhance your GitHub Copilot experience for the p5.js translation tracker project.

.PARAMETER All
    Download all priority resources (default if no parameters specified)

.PARAMETER Agents
    Download only priority agents

.PARAMETER Instructions
    Download only priority instructions

.PARAMETER Skills
    Download only priority skills

.PARAMETER Update
    Re-download all existing resources to update them

.PARAMETER AgentNames
    Specify custom agent names to download

.PARAMETER InstructionNames
    Specify custom instruction names to download

.PARAMETER SkillNames
    Specify custom skill names to download

.EXAMPLE
    .\download-resources.ps1
    Downloads all priority resources

.EXAMPLE
    .\download-resources.ps1 -Update
    Re-downloads all priority resources

.EXAMPLE
    .\download-resources.ps1 -AgentNames "expert-react-frontend-engineer","expert-nextjs-developer"
    Downloads specific agents

.EXAMPLE
    .\download-resources.ps1 -InstructionNames "typescript-mcp-server"
    Downloads specific instructions

.LINK
    https://awesome-copilot.github.com/
#>
