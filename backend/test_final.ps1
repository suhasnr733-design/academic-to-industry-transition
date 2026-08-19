# test_working_api.ps1
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "   ✅ WORKING API TEST" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# 1. Login
Write-Host "`n1. Logging in as admin..." -ForegroundColor Yellow
try {
    $loginResult = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/v1/auth/login" -Method Post -Body (@{username="admin";password="Admin@123"} | ConvertTo-Json) -ContentType "application/json"
    $token = $loginResult.access_token
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 40))..." -ForegroundColor Cyan
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 2. Profile
Write-Host "`n2. Getting profile..." -ForegroundColor Yellow
try {
    $profile = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/v1/auth/profile" -Headers @{Authorization = "Bearer $token"}
    Write-Host "✅ Profile retrieved!" -ForegroundColor Green
    Write-Host "   ID: $($profile.id)" -ForegroundColor Cyan
    Write-Host "   Username: $($profile.username)" -ForegroundColor Cyan
    Write-Host "   Email: $($profile.email)" -ForegroundColor Cyan
    Write-Host "   Full Name: $($profile.full_name)" -ForegroundColor Cyan
    Write-Host "   Role: $($profile.role)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Profile failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Admin Stats
Write-Host "`n3. Getting admin stats..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/v1/admin/stats" -Headers @{Authorization = "Bearer $token"}
    Write-Host "✅ Stats retrieved!" -ForegroundColor Green
    Write-Host "   Total Users: $($stats.total_users)" -ForegroundColor Cyan
    Write-Host "   Total Resumes: $($stats.total_resumes)" -ForegroundColor Cyan
    Write-Host "   Total Jobs: $($stats.total_jobs)" -ForegroundColor Cyan
    Write-Host "   Active Users: $($stats.active_users)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Stats failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. All Users
Write-Host "`n4. Getting all users..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/v1/admin/users" -Headers @{Authorization = "Bearer $token"}
    Write-Host "✅ Users retrieved!" -ForegroundColor Green
    $users.users | Format-Table username, role, full_name, email
} catch {
    Write-Host "❌ Users list failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Jobs (Public)
Write-Host "`n5. Getting jobs (public)..." -ForegroundColor Yellow
try {
    $jobs = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/v1/jobs"
    Write-Host "✅ Found $($jobs.jobs.Count) jobs" -ForegroundColor Green
    $jobs.jobs | Format-Table title, company, location, job_type
} catch {
    Write-Host "❌ Jobs failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Test John User (if exists)
Write-Host "`n6. Testing John user..." -ForegroundColor Yellow
try {
    $johnResult = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/v1/auth/login" -Method Post -Body (@{username="john";password="JohnPass123!"} | ConvertTo-Json) -ContentType "application/json"
    $johnToken = $johnResult.access_token
    Write-Host "✅ John login successful!" -ForegroundColor Green
    
    $johnProfile = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/v1/auth/profile" -Headers @{Authorization = "Bearer $johnToken"}
    Write-Host "   John Profile: $($johnProfile.full_name) ($($johnProfile.role))" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️ John login failed (user may not exist)" -ForegroundColor Yellow
}

Write-Host "`n====================================" -ForegroundColor Cyan
Write-Host "   ✅ TEST COMPLETE" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Save token for later
$token | Out-File -FilePath "token.txt"
Write-Host "`n✅ Token saved to token.txt" -ForegroundColor Yellow