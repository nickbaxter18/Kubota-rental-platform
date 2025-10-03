#!/bin/bash

# AI Terminal Access Control Script
# Provides secure command execution for AI assistants

# Define safe commands that AI can execute without approval
SAFE_COMMANDS=(
    "pnpm install"
    "pnpm build"
    "pnpm test"
    "pnpm lint"
    "pnpm type-check"
    "git status"
    "git log --oneline -10"
    "git diff"
    "git add ."
    "git commit -m"
    "git push"
    "docker-compose ps"
    "docker-compose logs"
    "kubectl get pods"
    "kubectl get services"
    "kubectl get deployments"
    "npm run dev"
    "npm run build"
    "jest"
    "vitest"
    "playwright test"
    "pnpm run dev"
    "pnpm run build"
    "pnpm run test"
    "pnpm run lint"
    "node --version"
    "npm --version"
    "git --version"
    "docker --version"
    "kubectl version --client"
)

# Define commands that require user approval
APPROVAL_REQUIRED_COMMANDS=(
    "production.deploy"
    "db.migrate"
    "secrets.rotate"
    "branch.delete"
    "npm.publish"
    "docker.push"
    "kubectl.apply.production"
    "git push --force"
    "git reset --hard"
    "rm -rf"
)

# Function to check if command is safe
is_safe_command() {
    local cmd="$1"
    for safe_cmd in "${SAFE_COMMANDS[@]}"; do
        if [[ "$cmd" == "$safe_cmd" || "$cmd" =~ ^$safe_cmd ]]; then
            return 0
        fi
    done
    return 1
}

# Function to check if command requires approval
requires_approval() {
    local cmd="$1"
    for approval_cmd in "${APPROVAL_REQUIRED_COMMANDS[@]}"; do
        if [[ "$cmd" =~ $approval_cmd ]]; then
            return 0
        fi
    done
    return 1
}

# Function to log AI command execution
log_ai_command() {
    local command="$1"
    local status="$2"
    local timestamp=$(date -Iseconds)

    echo "{\"timestamp\":\"$timestamp\",\"command\":\"$command\",\"executedBy\":\"AI\",\"status\":\"$status\",\"cwd\":\"$(pwd)\"}" >> .ai-command.log
}

# Main execution logic
main() {
    local full_command="$*"

    # Log the command attempt
    log_ai_command "$full_command" "attempted"

    # Check if command is safe
    if is_safe_command "$full_command"; then
        echo "🤖 AI: Executing safe command: $full_command"
        eval "$full_command"
        local exit_code=$?

        if [ $exit_code -eq 0 ]; then
            log_ai_command "$full_command" "success"
            echo "✅ AI: Command completed successfully"
        else
            log_ai_command "$full_command" "failed"
            echo "❌ AI: Command failed with exit code $exit_code"
        fi

        return $exit_code

    # Check if command requires approval
    elif requires_approval "$full_command"; then
        echo "🔒 AI: Command requires user approval: $full_command"
        echo "⏳ AI: Requesting user approval..."

        # In VS Code, this would trigger a user prompt
        # For now, we'll log it and ask for manual execution
        log_ai_command "$full_command" "approval_required"

        echo ""
        echo "🔐 SECURE OPERATION REQUIRES APPROVAL"
        echo "Command: $full_command"
        echo ""
        echo "Please run this command manually or approve in VS Code UI"
        echo ""

        return 1

    # Unknown command - require approval
    else
        echo "❓ AI: Unknown command pattern: $full_command"
        echo "🔒 AI: Requesting user approval for safety..."

        log_ai_command "$full_command" "unknown_pattern"

        echo ""
        echo "🔐 UNKNOWN COMMAND PATTERN"
        echo "Command: $full_command"
        echo ""
        echo "This command pattern is not recognized."
        echo "Please run manually or add to SAFE_COMMANDS in ai-terminal-access.sh"
        echo ""

        return 1
    fi
}

# Execute main function with all arguments
main "$@"
