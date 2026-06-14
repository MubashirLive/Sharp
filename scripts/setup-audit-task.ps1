# One-time setup. Run as Admin (or with -RunAsCurrentUser).
# Creates "SHARP_Nightly_Audit" Windows Task Scheduler job at 02:30 daily.

$taskName = "SHARP_Nightly_Audit"
$scriptPath = "C:\Users\MUBASHIR\Documents\GitHub\Sharp\scripts\run-audit.ps1"

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

$trigger = New-ScheduledTaskTrigger -Daily -At "02:30"

$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Highest

$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Hours 4)

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings `
    -Description "Nightly SHARP code audit - writes docs/REPORT_2.md" `
    -Force

Write-Host "Scheduled task '$taskName' registered for 02:30 daily."
Write-Host "Test now with:  Start-ScheduledTask -TaskName '$taskName'"
$removeCmd = 'Unregister-ScheduledTask -TaskName ' + $taskName + ' -Confirm:$false'
Write-Host "Remove with:    $removeCmd"
