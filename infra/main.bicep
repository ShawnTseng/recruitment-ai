targetScope = 'resourceGroup'

// -- Parameters --------------------------------------------------------
@description('Primary Azure region for most resources')
param location string = 'eastasia'

@description('Region for Azure OpenAI (must support OpenAI models)')
param openAiLocation string = 'japaneast'

@description('Resource naming prefix')
param prefix string = 'recai'

@description('SQL Server administrator login')
param sqlAdminLogin string = 'recaiadmin'

@description('SQL Server administrator password')
@secure()
param sqlAdminPassword string

@description('Environment tag')
@allowed(['dev', 'prod'])
param environment string = 'dev'

// -- Variables ----------------------------------------------------------
var tags = {
  project: 'recruitment-ai'
  environment: environment
  managedBy: 'bicep'
}
var kvName = '${prefix}-kv'
var webAppName = '${prefix}-api'

// -- Modules ------------------------------------------------------------

module appInsights 'modules/app-insights.bicep' = {
  name: 'deploy-app-insights'
  params: {
    location: location
    prefix: prefix
    tags: tags
  }
}

module storage 'modules/storage.bicep' = {
  name: 'deploy-storage'
  params: {
    location: location
    prefix: prefix
    tags: tags
  }
}

module sql 'modules/sql-database.bicep' = {
  name: 'deploy-sql'
  params: {
    location: location
    prefix: prefix
    tags: tags
    sqlAdminLogin: sqlAdminLogin
    sqlAdminPassword: sqlAdminPassword
  }
}

module openAi 'modules/openai.bicep' = {
  name: 'deploy-openai'
  params: {
    prefix: prefix
    tags: tags
    openAiLocation: openAiLocation
  }
}

module staticWebApp 'modules/static-web-app.bicep' = {
  name: 'deploy-static-web-app'
  params: {
    location: location
    prefix: prefix
    tags: tags
  }
}

module appService 'modules/app-service.bicep' = {
  name: 'deploy-app-service'
  params: {
    location: location
    prefix: prefix
    tags: tags
    appInsightsConnectionString: appInsights.outputs.appInsightsConnectionString
  }
}

module keyVault 'modules/keyvault.bicep' = {
  name: 'deploy-keyvault'
  params: {
    location: location
    prefix: prefix
    tags: tags
    tenantId: subscription().tenantId
    apiPrincipalId: appService.outputs.webAppPrincipalId
  }
}

// Wire Key Vault URI into App Service (use deterministic name to avoid circular ref)
resource existingWebApp 'Microsoft.Web/sites@2023-12-01' existing = {
  name: webAppName
}

resource webAppSettings 'Microsoft.Web/sites/config@2023-12-01' = {
  parent: existingWebApp
  name: 'appsettings'
  dependsOn: [appService, sqlConnectionSecret, openAiEndpointSecret, storageEndpointSecret]
  properties: {
    APPLICATIONINSIGHTS_CONNECTION_STRING: appInsights.outputs.appInsightsConnectionString
    KeyVault__Uri: keyVault.outputs.keyVaultUri
    WEBSITES_CONTAINER_START_TIME_LIMIT: '600'
    // Key Vault References — secrets resolved by App Service platform, not SDK
    ConnectionStrings__DefaultConnection: '@Microsoft.KeyVault(VaultName=${kvName};SecretName=ConnectionStrings--DefaultConnection)'
    AzureOpenAI__Endpoint: '@Microsoft.KeyVault(VaultName=${kvName};SecretName=AzureOpenAI--Endpoint)'
    BlobStorage__Endpoint: '@Microsoft.KeyVault(VaultName=${kvName};SecretName=BlobStorage--Endpoint)'
    Jwt__SecretKey: '@Microsoft.KeyVault(VaultName=${kvName};SecretName=Jwt--SecretKey)'
    // CORS: allow local dev; SWA linked backend handles production (server-side proxy)
    Cors__AllowedOrigins__0: 'http://localhost:5173'
    Cors__AllowedOrigins__1: 'https://${staticWebApp.outputs.staticWebAppDefaultHostName}'
  }
}

// Link App Service as SWA backend so /api/* requests are proxied server-side (no CORS needed in prod)
resource existingSwa 'Microsoft.Web/staticSites@2023-12-01' existing = {
  name: '${prefix}-web'
}

resource swaLinkedBackend 'Microsoft.Web/staticSites/linkedBackends@2023-12-01' = {
  parent: existingSwa
  name: 'backend'
  dependsOn: [appService]
  properties: {
    backendResourceId: resourceId('Microsoft.Web/sites', webAppName)
    region: location
  }
}

// Easy Auth V2: disable platform auth so App Service JWT middleware handles auth
resource webAppAuthSettings 'Microsoft.Web/sites/config@2023-12-01' = {
  parent: existingWebApp
  name: 'authsettingsV2'
  dependsOn: [swaLinkedBackend]
  properties: {
    globalValidation: {
      requireAuthentication: false
      unauthenticatedClientAction: 'AllowAnonymous'
    }
    platform: {
      enabled: false
    }
  }
}

// Store secrets in Key Vault
resource existingKv 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: kvName
}

resource sqlConnectionSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: existingKv
  name: 'ConnectionStrings--DefaultConnection'
  dependsOn: [keyVault]
  properties: {
    value: 'Server=tcp:${sql.outputs.sqlServerFqdn},1433;Initial Catalog=${sql.outputs.sqlDatabaseName};Persist Security Info=False;User ID=${sqlAdminLogin};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=True;Connection Timeout=30;'
  }
}

resource openAiEndpointSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: existingKv
  name: 'AzureOpenAI--Endpoint'
  dependsOn: [keyVault]
  properties: {
    value: openAi.outputs.openAiEndpoint
  }
}

resource storageEndpointSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: existingKv
  name: 'BlobStorage--Endpoint'
  dependsOn: [keyVault]
  properties: {
    value: storage.outputs.blobEndpoint
  }
}

// -- Outputs ------------------------------------------------------------
output apiUrl string = 'https://${appService.outputs.webAppDefaultHostName}'
output webUrl string = 'https://${staticWebApp.outputs.staticWebAppDefaultHostName}'
output keyVaultUri string = keyVault.outputs.keyVaultUri
output sqlServerFqdn string = sql.outputs.sqlServerFqdn
output openAiEndpoint string = openAi.outputs.openAiEndpoint
output storageEndpoint string = storage.outputs.blobEndpoint
