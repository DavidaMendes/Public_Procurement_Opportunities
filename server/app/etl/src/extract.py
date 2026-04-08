import requests
import json

base_url = "https://pncp.gov.br/api/consulta/v1/contratacoes/proposta"

#Parâmetros de Busca
dataFinal="20260331"
codigoModalidadeContratacao="8"
uf="pe"
codigoMunicipioIbge="2611606"
pagina="1"
tamanhoPagina="10"

parametros = { 
    "dataFinal": dataFinal,
    "codigoModalidadeContratacao": codigoModalidadeContratacao,
    "uf": uf,
    "codigoMunicipioIbge": codigoMunicipioIbge,
    "pagina": pagina,
    "tamanhoPagina": tamanhoPagina
}

response = requests.get(base_url, params=parametros) # Retorna apenas a resposta

data = response.json() # Descerializa o json em dictionary

print(data) # Imprime o resultado

# with open('response.json', 'w') as f:
#     json.dump(data, f)