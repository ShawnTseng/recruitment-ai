@description('Azure OpenAI module — deployed to a region that supports OpenAI')
param prefix string
param tags object = {}
param openAiLocation string = 'japaneast'
param modelName string = 'gpt-4o'
param modelVersion string = '2024-11-20'
param deploymentCapacity int = 10

resource openAi 'Microsoft.CognitiveServices/accounts@2024-04-01-preview' = {
  name: '${prefix}-oai'
  location: openAiLocation
  tags: tags
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: '${prefix}-oai'
    publicNetworkAccess: 'Enabled'
  }
}

resource gpt4oDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-04-01-preview' = {
  parent: openAi
  name: modelName
  sku: {
    name: 'Standard'
    capacity: deploymentCapacity
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: modelName
      version: modelVersion
    }
  }
}

output openAiEndpoint string = openAi.properties.endpoint
output openAiName string = openAi.name
output openAiId string = openAi.id
