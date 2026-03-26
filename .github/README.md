# GitHub Copilot Resources for p5.js Translation Tracker

This directory contains custom GitHub Copilot configurations for the p5.js website translation tracker project.

## 📁 Directory Structure

```
.github/
├── agents/                    # Custom Copilot agents (6)
│   ├── github-actions-expert.agent.md
│   ├── devops-expert.agent.md
│   ├── lingodotdev-i18n.agent.md
│   ├── se-product-manager-advisor.agent.md
│   ├── context-architect.agent.md
│   └── se-technical-writer.agent.md
│
├── instructions/              # Coding standards & guidelines (6)
│   ├── astro.instructions.md
│   ├── github-actions-ci-cd-best-practices.instructions.md
│   ├── localization.instructions.md
│   ├── markdown-accessibility.instructions.md
│   ├── a11y.instructions.md
│   └── markdown.instructions.md
│
├── skills/                    # Reusable automation skills (7)
│   ├── github-issues/
│   ├── gh-cli/
│   ├── git-commit/
│   ├── create-github-issues-feature-from-implementation-plan/
│   ├── documentation-writer/
│   ├── conventional-commit/
│   └── markdown-to-html/
│
├── hooks/                     # Session hooks (to be configured)
├── workflows/                 # GitHub Actions workflows
├── copilot-instructions.md    # Main instructions file
└── README.md                  # This file
```

## 🚀 Quick Start

### 1. Installing Agents in VS Code

Agents are specialized AI assistants for specific tasks. To use them:

**Option A: Manual Installation**
1. Open VS Code
2. Press `Ctrl+Shift+P`
3. Type "GitHub Copilot: Install Custom Agent"
4. Browse to `.github/agents/` and select an agent file

**Option B: Via Extension**
1. Install "VS Code Agent Manager" extension
2. It will auto-detect agents in `.github/agents/`
3. Click "Install" next to each agent

**Using Agents:**
In any Copilot chat, mention the agent:
```
@github-actions-expert How do I extend the translation tracker workflow?
@lingodotdev-i18n Generate translation stubs for Spanish
```

### 2. Instructions (Already Active!)

The `copilot-instructions.md` file is automatically picked up by GitHub Copilot. It contains:
- Astro development standards
- Localization/i18n guidelines
- GitHub Actions best practices
- Markdown & accessibility requirements

**No additional setup needed** - Copilot will follow these instructions when:
- Writing code in matching file types (`.astro`, `.ts`, `.md`, etc.)
- Creating workflows in `.github/workflows/`
- Generating translations
- Writing documentation

### 3. Using Skills

Skills are reusable automation templates. To use:

**Example: Create Translation Issues**
```bash
# In VS Code Copilot Chat:
Use the create-github-issues-feature-from-implementation-plan skill to create issues for Spanish translation tasks
```

**Example: Generate Commit Messages**
```bash
# In VS Code Copilot Chat:
Use the conventional-commit skill to create a commit message for my translation changes
```

## 📚 Available Agents

| Agent | Purpose | Use Case |
|-------|---------|----------|
| **@github-actions-expert** | GitHub Actions & CI/CD | Extend workflows, fix automation |
| **@devops-expert** | Pipeline design | Build → Deploy → Monitor setup |
| **@lingodotdev-i18n** | Localization expert | Generate stubs, manage translations |
| **@se-product-manager-advisor** | Issue management | Create/organize GitHub issues |
| **@context-architect** | Multi-file changes | Refactoring, dependency mapping |
| **@se-technical-writer** | Documentation | Write guides, API docs, tutorials |

## 📋 Available Instructions

Instructions are automatically applied to matching file types:

| Instruction | Applies To | Purpose |
|-------------|------------|---------|
| **Astro** | `*.astro, *.ts, *.js` | Astro best practices |
| **GitHub Actions** | `.github/workflows/*.yml` | Workflow security & optimization |
| **Localization** | `*.md, localization/**/*` | Translation guidelines |
| **Markdown Accessibility** | `*.md, *.mdx` | Accessible documentation |
| **A11y** | All files | General accessibility |
| **Markdown** | `*.md` | Markdown formatting |

## ⚡ Available Skills

| Skill | Purpose | Example Usage |
|-------|---------|---------------|
| **github-issues** | Manage issues | Create translation tracking issues |
| **gh-cli** | GitHub CLI reference | Automate repo management |
| **git-commit** | Commit messages | Generate conventional commits |
| **create-github-issues-feature-from-implementation-plan** | Plan → Issues | Break down features into tasks |
| **documentation-writer** | Write docs | Generate contributor guides |
| **conventional-commit** | Commit formatting | Format commit messages |
| **markdown-to-html** | Markdown conversion | Build preview systems |

## 🎯 Common Use Cases

### Extending the Translation Tracker

**Ask:**
```
@github-actions-expert Extend the translation tracker workflow to:
1. Track all content types (not just reference docs)
2. Generate stub files for missing translations
3. Create issues for each missing translation
```

### Generating Translation Stubs

**Ask:**
```
@lingodotdev-i18n Analyze the English docs in src/content/ and generate
translation stub files for Spanish (es-es), Chinese (zh-cn), Korean (ko-kr),
and Hindi (hi-in). Include metadata headers with source file references.
```

### Creating Translation Issues

**Ask:**
```
Use the create-github-issues-feature-from-implementation-plan skill to create
GitHub issues for all missing Spanish translations. Label them with "translation"
and "es".
```

### Auto-Closing Issues on PR Merge

**Ask:**
```
@github-actions-expert Create a workflow that automatically closes translation
issues when their corresponding PR is merged. Parse issue numbers from PR
descriptions using the format "Closes #123".
```

### Building a Progress Dashboard

**Ask:**
```
@se-technical-writer Create a translation progress dashboard page that reads
translation stub files and calculates completion percentages for each language.
Use the markdown-to-html skill to generate a static HTML report.
```

## 🔧 Configuration Files

### Main Configuration
- **copilot-instructions.md** - Project-wide instructions for GitHub Copilot
  - Automatically detected by Copilot
  - No manual activation needed
  - Edit to customize project guidelines

### VS Code Settings (Optional)
You can add to `.vscode/settings.json`:
```json
{
  "github.copilot.customInstructionPath": ".github/copilot-instructions.md",
  "github.copilot.chat.agentsPath": ".github/agents"
}
```

## 📖 Resources & Documentation

### Official Resources
- [Awesome GitHub Copilot](https://awesome-copilot.github.com/)
- [GitHub Copilot Documentation](https://docs.github.com/copilot)
- [Custom Agents Guide](https://docs.github.com/copilot/customizing-copilot/creating-custom-agents)

### Downloaded From
All resources were downloaded from:
- **Repository**: github/awesome-copilot
- **Agents**: `https://raw.githubusercontent.com/github/awesome-copilot/main/agents/`
- **Instructions**: `https://raw.githubusercontent.com/github/awesome-copilot/main/instructions/`
- **Skills**: `https://raw.githubusercontent.com/github/awesome-copilot/main/skills/`

### Full Catalog
- **179 Agents** available at: https://awesome-copilot.github.com/agents/
- **171 Instructions** available at: https://awesome-copilot.github.com/instructions/
- **244 Skills** available at: https://awesome-copilot.github.com/skills/

## 🔄 Updating Resources

To update agents/instructions/skills:

```bash
# Re-download all resources
cd .github
pwsh download-resources.ps1

# Or download individual resources
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/github/awesome-copilot/main/agents/github-actions-expert.agent.md" -OutFile "agents/github-actions-expert.agent.md"
```

## 🤝 Contributing

When adding new agents, instructions, or skills:

1. Place files in the appropriate directory
2. Follow naming conventions: `name.agent.md`, `name.instructions.md`, `name/SKILL.md`
3. Update this README with new resources
4. Test with GitHub Copilot in VS Code
5. Document use cases and examples

## 📝 Notes

- **Agents** require manual installation in VS Code (or via Agent Manager extension)
- **Instructions** are automatically picked up from `copilot-instructions.md`
- **Skills** are referenced in prompts (no installation needed)
- All resources work with **GitHub Copilot Chat** in VS Code
- Compatible with **GitHub Copilot CLI** where applicable

## ✅ Verification

To verify your setup is working:

1. **Instructions**: Open a `.astro` file and ask Copilot to explain the Islands Architecture - it should reference project standards
2. **Agents**: Type `@` in Copilot Chat - you should see installed agents
3. **Skills**: Ask Copilot to list available skills in the project

## 🆘 Troubleshooting

**Copilot not following instructions?**
- Ensure `copilot-instructions.md` exists in `.github/`
- Check file matches your file type in `applyTo:` field
- Restart VS Code

**Agents not showing up?**
- Install "VS Code Agent Manager" extension
- Manually install via `Ctrl+Shift+P` → "GitHub Copilot: Install Custom Agent"
- Check `.github/agents/` directory exists

**Skills not working?**
- Skills are reference materials, not executable
- Mention skill name in your prompt
- Ask Copilot to apply the skill's methodology

---

**Setup Date**: 2026-03-20  
**Project**: p5.js Website Translation Tracker  
**Resources Version**: Awesome GitHub Copilot (Latest)

For questions or issues, please open an issue in the repository.
