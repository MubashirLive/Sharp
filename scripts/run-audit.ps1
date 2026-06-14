# SHARP nightly audit runner
# Invoked by Windows Task Scheduler at 02:30 daily.

$ErrorActionPreference = "Continue"
$repo = "C:\Users\MUBASHIR\Documents\GitHub\Sharp"
$promptFile = Join-Path $repo "docs\AUDIT_PROMPT.md"
$reportFile = Join-Path $repo "docs\REPORT_2.md"
$stamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$logFile = Join-Path $repo "docs\audit-runs\run-$stamp.log"

# Ensure log dir + write proof-of-life as the FIRST action
$logDir = Split-Path $logFile
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
"== audit start $stamp ==" | Out-File -FilePath $logFile
"cwd: $repo" | Out-File -Append $logFile
"user: $env:USERNAME" | Out-File -Append $logFile
"claude: $(Get-Command claude -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source)" |
    Out-File -Append $logFile

Set-Location $repo

# Stamp report header
"# SHARP Audit Run @ $stamp`nBranch: $(git rev-parse --abbrev-ref HEAD 2>$null)`nCommit: $(git rev-parse HEAD 2>$null)`n" |
    Out-File -FilePath $reportFile

# Read prompt
$prompt = Get-Content $promptFile -Raw
"prompt bytes: $($prompt.Length)" | Out-File -Append $logFile

# Invoke Claude. Pass prompt as a file path arg to avoid pipe issues
# in non-interactive scheduler context.
$argList = @(
    '-p'
    '--dangerously-skip-permissions'
    '--bare'
    '--add-dir', $repo
    "--append-system-prompt", "Read every file from disk. Begin by listing the repo structure with `ls`. Then execute the audit end-to-end and write the full report to docs\REPORT_2.md. Do not summarize in chat."
    $prompt
)
"running: claude $($argList -join ' ')" | Out-File -Append $logFile

& claude @argList 2>&1 | Out-File -Append $logFile
$exit = $LASTEXITCODE
"claude exit: $exit" | Out-File -Append $logFile
"== audit end $stamp ==" | Out-File -Append $logFile
