# Script to generate sample data for African political parties
# This creates essential JSON files for each party

$basePath = "C:\Dev\Accounting-As-A-Service\src\CompanyApp.VoterApp\wwwroot\sample-data"

# Define parties with their details
$parties = @(
    # Kenya
    @{ Code = "uda"; Name = "United Democratic Alliance"; Country = "Kenya"; Color = "#FFD700" },
    @{ Code = "odm"; Name = "Orange Democratic Movement"; Country = "Kenya"; Color = "#FFA500" },
    @{ Code = "jubilee"; Name = "Jubilee Party"; Country = "Kenya"; Color = "#DC143C" },
    
    # Nigeria
    @{ Code = "apc"; Name = "All Progressives Congress"; Country = "Nigeria"; Color = "#0000FF" },
    @{ Code = "pdp"; Name = "People's Democratic Party"; Country = "Nigeria"; Color = "#FF0000" },
    @{ Code = "lp"; Name = "Labour Party"; Country = "Nigeria"; Color = "#DC143C" },
    
    # Tanzania
    @{ Code = "ccm"; Name = "Chama Cha Mapinduzi"; Country = "Tanzania"; Color = "#FFD700" },
    @{ Code = "chadema"; Name = "Chama cha Demokrasia na Maendeleo"; Country = "Tanzania"; Color = "#0000FF" },
    @{ Code = "actz"; Name = "Alliance for Change and Transparency"; Country = "Tanzania"; Color = "#00FF00" },
    
    # Uganda
    @{ Code = "nrm"; Name = "National Resistance Movement"; Country = "Uganda"; Color = "#FFD700" },
    @{ Code = "nup"; Name = "National Unity Platform"; Country = "Uganda"; Color = "#DC143C" },
    @{ Code = "fdc"; Name = "Forum for Democratic Change"; Country = "Uganda"; Color = "#0000FF" },
    
    # Ghana
    @{ Code = "npp"; Name = "New Patriotic Party"; Country = "Ghana"; Color = "#0000FF" },
    @{ Code = "ndc"; Name = "National Democratic Congress"; Country = "Ghana"; Color = "#00FF00" },
    @{ Code = "cpp"; Name = "Convention People's Party"; Country = "Ghana"; Color = "#DC143C" }
)

Write-Host "`n" -NoNewline
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Creating Sample Data for African Political Parties        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$totalFiles = 0

foreach ($party in $parties) {
    $partyPath = Join-Path $basePath $party.Code
    $partyName = $party.Name
    $country = $party.Country
    
    Write-Host "Creating files for $partyName ($($party.Code))..." -ForegroundColor Yellow
    
    # 1. parties.json
    $partiesJson = @"
[
  {
    "Id": 1,
    "PartyAffiliationId": 1,
    "PartyName": "$partyName",
    "Name": "$partyName",
    "ShortCode": "$($party.Code.ToUpper())",
    "Color": "$($party.Color)"
  }
]
"@
    $partiesJson | Out-File -FilePath (Join-Path $partyPath "parties.json") -Encoding UTF8
    $totalFiles++
    
    # 2. voters.json (sample voters)
    $votersJson = @"
[
  {
    "Id": "1",
    "FirstName": "John",
    "LastName": "Doe",
    "Email": "john.doe@example.com",
    "PhoneNumber": "+254712345678",
    "NationalId": "12345678",
    "DateOfBirth": "1985-05-15",
    "Gender": "Male",
    "Address": "123 Main Street",
    "City": "Capital City",
    "Region": "Central",
    "RegistrationDate": "2023-01-15",
    "VoterStatus": "Active",
    "PartyAffiliation": "$partyName"
  },
  {
    "Id": "2",
    "FirstName": "Jane",
    "LastName": "Smith",
    "Email": "jane.smith@example.com",
    "PhoneNumber": "+254787654321",
    "NationalId": "87654321",
    "DateOfBirth": "1990-08-22",
    "Gender": "Female",
    "Address": "456 Park Avenue",
    "City": "Capital City",
    "Region": "Central",
    "RegistrationDate": "2023-02-10",
    "VoterStatus": "Active",
    "PartyAffiliation": "$partyName"
  }
]
"@
    $votersJson | Out-File -FilePath (Join-Path $partyPath "voters.json") -Encoding UTF8
    $totalFiles++
    
    # 3. members.json
    $membersJson = @"
[
  {
    "Id": "1",
    "FirstName": "Alice",
    "LastName": "Johnson",
    "Email": "alice.johnson@$($party.Code).org",
    "PhoneNumber": "+254700111222",
    "MembershipNumber": "MEM001",
    "JoinDate": "2020-01-01",
    "MembershipStatus": "Active",
    "Branch": "Central Branch",
    "Position": "Branch Secretary"
  },
  {
    "Id": "2",
    "FirstName": "Bob",
    "LastName": "Williams",
    "Email": "bob.williams@$($party.Code).org",
    "PhoneNumber": "+254700222333",
    "MembershipNumber": "MEM002",
    "JoinDate": "2020-03-15",
    "MembershipStatus": "Active",
    "Branch": "East Branch",
    "Position": "Treasurer"
  }
]
"@
    $membersJson | Out-File -FilePath (Join-Path $partyPath "members.json") -Encoding UTF8
    $totalFiles++
    
    # 4. branches.json
    $branchesJson = @"
[
  {
    "Id": "1",
    "Name": "Central Branch",
    "Region": "Central",
    "Address": "123 Party HQ Street",
    "Chairman": "Alice Johnson",
    "Secretary": "John Smith",
    "MemberCount": 250,
    "EstablishedDate": "2015-01-01"
  },
  {
    "Id": "2",
    "Name": "East Branch",
    "Region": "Eastern",
    "Address": "456 East Avenue",
    "Chairman": "Bob Williams",
    "Secretary": "Mary Brown",
    "MemberCount": 180,
    "EstablishedDate": "2016-03-15"
  }
]
"@
    $branchesJson | Out-File -FilePath (Join-Path $partyPath "branches.json") -Encoding UTF8
    $totalFiles++
    
    # 5. campaigns.json
    $campaignsJson = @"
[
  {
    "Id": "1",
    "Name": "2024 General Election Campaign",
    "StartDate": "2024-01-01",
    "EndDate": "2024-12-31",
    "Budget": 5000000,
    "Status": "Active",
    "Campaign Manager": "Campaign Director",
    "TargetVoters": 100000
  }
]
"@
    $campaignsJson | Out-File -FilePath (Join-Path $partyPath "campaigns.json") -Encoding UTF8
    $totalFiles++
    
    # 6. events.json
    $eventsJson = @"
[
  {
    "Id": "1",
    "Title": "Party Rally - Central Region",
    "Description": "Major campaign rally in the capital city",
    "EventDate": "2024-06-15",
    "Location": "National Stadium",
    "ExpectedAttendees": 50000,
    "Status": "Scheduled"
  },
  {
    "Id": "2",
    "Title": "Youth Forum",
    "Description": "Engaging with young voters",
    "EventDate": "2024-07-20",
    "Location": "University Hall",
    "ExpectedAttendees": 2000,
    "Status": "Scheduled"
  }
]
"@
    $eventsJson | Out-File -FilePath (Join-Path $partyPath "events.json") -Encoding UTF8
    $totalFiles++
    
    # 7. provinces.json
    $provincesJson = @"
[
  {
    "Id": "1",
    "Name": "Central Province",
    "Code": "CP",
    "Population": 2500000,
    "RegisteredVoters": 1500000
  },
  {
    "Id": "2",
    "Name": "Eastern Province",
    "Code": "EP",
    "Population": 1800000,
    "RegisteredVoters": 1000000
  },
  {
    "Id": "3",
    "Name": "Western Province",
    "Code": "WP",
    "Population": 2000000,
    "RegisteredVoters": 1200000
  }
]
"@
    $provincesJson | Out-File -FilePath (Join-Path $partyPath "provinces.json") -Encoding UTF8
    $totalFiles++
    
    # 8. constituencies.json
    $constituenciesJson = @"
[
  {
    "Id": "1",
    "Name": "Central Constituency",
    "Code": "CC001",
    "Province": "Central Province",
    "RegisteredVoters": 45000,
    "PollingStations": 25
  },
  {
    "Id": "2",
    "Name": "East Constituency",
    "Code": "EC001",
    "Province": "Eastern Province",
    "RegisteredVoters": 38000,
    "PollingStations": 20
  }
]
"@
    $constituenciesJson | Out-File -FilePath (Join-Path $partyPath "constituencies.json") -Encoding UTF8
    $totalFiles++
    
    # 9. polling-stations.json
    $pollingStationsJson = @"
[
  {
    "Id": "1",
    "Name": "Central Primary School",
    "Code": "PS001",
    "Constituency": "Central Constituency",
    "Address": "123 School Road",
    "RegisteredVoters": 1800,
    "PresidingOfficer": "Officer Name"
  },
  {
    "Id": "2",
    "Name": "East Community Center",
    "Code": "PS002",
    "Constituency": "East Constituency",
    "Address": "456 Community Avenue",
    "RegisteredVoters": 1500,
    "PresidingOfficer": "Another Officer"
  }
]
"@
    $pollingStationsJson | Out-File -FilePath (Join-Path $partyPath "polling-stations.json") -Encoding UTF8
    $totalFiles++
    
    # 10. poll-agents.json
    $pollAgentsJson = @"
[
  {
    "Id": "1",
    "FirstName": "Agent",
    "LastName": "One",
    "PhoneNumber": "+254700111222",
    "PollingStation": "Central Primary School",
    "Assignment": "Assigned",
    "TrainingCompleted": true
  },
  {
    "Id": "2",
    "FirstName": "Agent",
    "LastName": "Two",
    "PhoneNumber": "+254700222333",
    "PollingStation": "East Community Center",
    "Assignment": "Assigned",
    "TrainingCompleted": true
  }
]
"@
    $pollAgentsJson | Out-File -FilePath (Join-Path $partyPath "poll-agents.json") -Encoding UTF8
    $totalFiles++
    
    Write-Host "  ✓ Created 10 essential JSON files" -ForegroundColor Green
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    Summary                                     ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Total Parties: $($parties.Count)" -ForegroundColor White
Write-Host "Total Files Created: $totalFiles" -ForegroundColor White
Write-Host ""
Write-Host "Parties by Country:" -ForegroundColor Cyan
Write-Host "  Kenya:     UDA, ODM, Jubilee" -ForegroundColor White
Write-Host "  Nigeria:   APC, PDP, LP" -ForegroundColor White
Write-Host "  Tanzania:  CCM, CHADEMA, ACT" -ForegroundColor White
Write-Host "  Uganda:    NRM, NUP, FDC" -ForegroundColor White
Write-Host "  Ghana:     NPP, NDC, CPP" -ForegroundColor White
Write-Host ""
Write-Host "✓ Sample data generation complete!" -ForegroundColor Green
Write-Host ""
