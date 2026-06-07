# Contributing to VolcanoStrat AI

Thank you for your interest in contributing to VolcanoStrat AI! This project is a global volcanic hydrostratigraphy and aquifer modeling platform that transforms complex well-log descriptions into standardized, scientifically defensible hydrostratigraphic units.

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [How Can I Contribute?](#-how-can-i-contribute)
- [Development Setup](#-development-setup)
- [Pull Request Guidelines](#-pull-request-guidelines)
- [Coding Standards](#-coding-standards)
- [Testing](#-testing)
- [Reporting Issues](#-reporting-issues)
- [Feature Requests](#-feature-requests)
- [Acknowledging Contributions](#-acknowledging-contributions)

## 🤝 Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior to [wagari.mosisa@ju.edu.et](mailto:wagari.mosisa@ju.edu.et).

## 🌟 How Can I Contribute?

### Reporting Bugs

This is one of the most valuable ways to contribute. When reporting bugs:

1. **Use the GitHub issue tracker**
2. **Check existing issues** - Make sure the bug hasn't already been reported
3. **Provide detailed information:**
   - Steps to reproduce
   - Expected vs. actual behavior
   - Screenshots or error messages
   - Browser/OS information (for frontend issues)
   - Python version and dependencies (for backend issues)
   - Sample data that triggers the bug (if applicable)

### Suggesting Enhancements

We welcome feature requests and improvement suggestions:

1. Open a GitHub issue
2. Clearly describe the feature and its use case
3. Explain why it would be valuable to the project
4. Include any relevant examples or mockups

### Contributing Code

We accept contributions via Pull Requests:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests for new functionality
5. Ensure all existing tests pass
6. Submit a Pull Request

### Improving Documentation

Better documentation helps all users. You can:

1. Fix typos or unclear explanations
2. Add examples and use cases
3. Improve API documentation
4. Create tutorials or guides

### Testing and Quality Assurance

Help us maintain quality by:

1. Writing unit and integration tests
2. Testing on different platforms and environments
3. Reviewing Pull Requests
4. Reporting edge cases and unexpected behaviors

## 💻 Development Setup

### Prerequisites

- **Git**
- **Python 3.9+** (for backend)
- **Node.js 18+** (for frontend)
- **npm** (comes with Node.js)

### Local Development (TWO TERMINAL METHOD)

#### Terminal 1: Backend

```bash
# Clone the repository
git clone https://github.com/wagarimosisa-jit/volcanostrat-ai.git
cd volcanostrat-ai

# Set up Python virtual environment
cd backend
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

#### Terminal 2: Frontend

```bash
# From the project root
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will be available at `http://localhost:3000`

### Using Docker (Alternative)

```bash
# Build and run with Docker Compose
docker-compose up
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

### Environment Variables

Create a `.env` file in the backend directory based on `.env.example`:

```env
# Backend
PYTHONUNBUFFERED=1
PYTHONDONTWRITEBYTECODE=1

# Frontend
REACT_APP_API_URL=http://localhost:8000
```

## 📝 Pull Request Guidelines

### Before Submitting

1. **Check for existing PRs** - Make sure your feature/fix isn't already being worked on
2. **Create an issue** - Discuss your proposed changes before starting work
3. **Keep PRs focused** - Each PR should address one specific issue or feature
4. **Write good commit messages** - Clear, descriptive messages help maintainers understand your changes

### Pull Request Requirements

1. **Title**: Clear and descriptive
2. **Description**: Explain what the PR does and why it's needed
3. **Linked Issues**: Reference any related GitHub issues
4. **Tests**: Include tests for new functionality
5. **Documentation**: Update relevant documentation
6. **Screenshots**: For UI changes, include before/after screenshots

### Review Process

1. **Automated Checks**: All CI tests must pass
2. **Code Review**: At least one maintainer must approve
3. **Testing**: Maintainers may request additional tests or changes
4. **Merge**: Once approved, a maintainer will merge your PR

## 📛 Coding Standards

### Python (Backend)

- **Style**: Follow [PEP 8](https://pep8.org/) guidelines
- **Type Hints**: Use Python type hints for better code clarity
- **Imports**: Group imports (standard library, third-party, local) with blank lines between
- **Docstrings**: Use Google-style docstrings for all functions and classes
- **Line Length**: Maximum 120 characters per line
- **Naming**: Use snake_case for variables and functions, PascalCase for classes

### JavaScript/React (Frontend)

- **Style**: Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- **JSX**: Use consistent JSX formatting
- **Props**: Use destructuring for component props
- **State**: Use React hooks for state management
- **Naming**: Use camelCase for variables and functions, PascalCase for components
- **Imports**: Group imports (React, third-party, local, CSS) with blank lines between

### General Standards

- **Comments**: Write clear, useful comments that explain why, not what
- **Error Handling**: Always handle errors gracefully
- **Performance**: Be mindful of performance implications
- **Security**: Never commit sensitive data (API keys, passwords, etc.)
- **Backwards Compatibility**: Avoid breaking changes when possible

## 🧪 Testing

### Running Tests

#### Backend Tests

```bash
cd backend
# Run all tests
python -m pytest

# Run specific test file
python -m pytest tests/test_module.py

# Run with coverage
python -m pytest --cov=app
```

#### Frontend Tests

```bash
cd frontend
# Run all tests
npm test
```

### Writing Tests

- **Unit Tests**: Test individual functions in isolation
- **Integration Tests**: Test how components work together
- **End-to-End Tests**: Test complete user flows
- **Edge Cases**: Test boundary conditions and error cases
- **Performance Tests**: Test with large datasets

## 🐛 Reporting Issues

### Bug Report Template

```markdown
## Description

A clear and concise description of what the bug is.

## Steps to Reproduce

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior

A clear description of what you expected to happen.

## Actual Behavior

A clear description of what actually happened.

## Screenshots

If applicable, add screenshots to help explain your problem.

## Environment

- OS: [e.g. Windows 10, macOS 13, Ubuntu 22.04]
- Browser: [e.g. Chrome 120, Firefox 115, Safari 16]
- Python Version: [e.g. 3.9.13]
- Node.js Version: [e.g. 18.16.0]

## Additional Context

Add any other context about the problem here.

## Sample Data

If the bug is triggered by specific data, please attach a sample (with sensitive information removed).
```

## 💡 Feature Requests

### Feature Request Template

```markdown
## Is your feature request related to a problem?

A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

## Describe the solution you'd like

A clear and concise description of what you want to happen.

## Describe alternatives you've considered

A clear and concise description of any alternative solutions or features you've considered.

## Additional Context

Add any other context or screenshots about the feature request here.

## Use Case

Describe the use case or scenario where this feature would be valuable.

## Priority

- [ ] Low - Nice to have
- [ ] Medium - Would be useful
- [ ] High - Important for my workflow
- [ ] Critical - Blocking my work
```

## 🙏 Acknowledging Contributions

We follow the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind are welcome!

Types of contributions that will be recognized:

- 🐛 **Bug reports** - Reporting issues
- 💡 **Ideas** - Suggesting new features or improvements
- ⚠️ **Issue triage** - Helping manage issues
- 📝 **Documentation** - Improving docs
- 🐧 **Testing** - Adding or improving tests
- 📦 **Packages** - Improving the build system or dependencies
- 💬 **Questions** - Answering questions
- 🗣 **Discussions** - Participating in discussions
- 🎨 **Design** - Improving UI/UX
- 📊 **Examples** - Adding examples or use cases
- 🔧 **Tooling** - Improving tooling or infrastructure
- 📖 **Tutorials** - Creating tutorials or guides
- 🤝 **Mentoring** - Helping others contribute
- 🛡️ **Security** - Reporting security issues

## 📞 Getting Help

If you need help with:

- **Using the project**: Check the [README](README.md) or [documentation](docs/)
- **Development questions**: Open a GitHub Discussion
- **Bug reports**: Open a GitHub Issue
- **Private matters**: Contact [wagari.mosisa@ju.edu.et](mailto:wagari.mosisa@ju.edu.et)

## 🏆 Recognition

All meaningful contributions will be recognized in:

1. **GitHub Contributors** - Automatic via GitHub's contributor graph
2. **CHANGELOG** - Major contributions documented in release notes
3. **README** - Significant contributors may be added to the README
4. **Special Thanks** - Exceptional contributions may receive special recognition

## 📜 License

By contributing to this project, you agree that your contributions will be licensed under the [MIT License](LICENSE).

## 🎉 Thank You!

Your contributions help make VolcanoStrat AI better for everyone. Whether you're reporting bugs, suggesting features, writing code, or improving documentation, we appreciate your help!

---

**Maintainer:** Wagari Mosisa Kitessa  
**Contact:** [wagari.mosisa@ju.edu.et](mailto:wagari.mosisa@ju.edu.et)  
**Repository:** [volcanostrat-ai](https://github.com/wagarimosisa-jit/volcanostrat-ai)
