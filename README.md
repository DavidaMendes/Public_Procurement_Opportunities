# 📋 Public Procurement Opportunities (PPO)

Uma plataforma completa para consultar e gerenciar oportunidades de contratações públicas, desenvolvida com tecnologias modernas de web, mobile e big data.

## 🎯 Sobre o Projeto

O PPO é uma solução integrada que combina:
- **Interface Mobile/Web** para consulta de oportunidades
- **API REST** para acesso aos dados
- **Pipeline ETL** para processamento e carregamento de dados
- **Banco de Dados MongoDB** para armazenamento escalável

## 📁 Estrutura do Projeto

```
Public_Procurement_Opportunities/
├── client/                    # Aplicação Frontend
│   └── PPO-client/           # App Expo React Native + Web
│       ├── src/
│       │   └── app/          # Routing e componentes principais
│       ├── assets/           # Ícones, imagens e recursos
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
│
├── server/                    # Backend e Infrastructure
│   ├── api/
│   │   └── main.py           # FastAPI application
│   ├── ETL/
│   │   ├── src/
│   │   │   ├── extract.py    # Extração de dados
│   │   │   └── load.py       # Carregamento de dados
│   │   └── db/
│   │       └── db_conection.py # Conexão com MongoDB
│   ├── requirements.txt       # Dependências Python
│   └── README.md
│
└── README.md                  # Este arquivo
```

## 🛠️ Tecnologias

### Frontend
- **Expo** 55.0.10 - Framework para React Native
- **React** 19.2.0 - Biblioteca UI
- **React Native** 0.83.4 - Mobile native
- **TypeScript** ~5.9.2 - Tipagem estática
- **expo-router** - Roteamento da aplicação
- **React Navigation** - Navegação entre telas

### Backend
- **FastAPI** 0.104.0 - Framework REST API
- **Uvicorn** 0.24.0 - ASGI server
- **MongoDB** + **pymongo** 4.6.0 - Banco de dados NoSQL
- **Pandas** 2.2.0 - Processamento de dados
- **Requests** 2.32.3 - Cliente HTTP
- **python-dotenv** 1.0.0 - Gerenciamento de variáveis de ambiente

## 📋 Pré-requisitos

### Para o Frontend
- **Node.js** >= 16.x
- **npm** ou **yarn**
- **Expo CLI** (instalado globalmente ou local)

### Para o Backend
- **Python** >= 3.10
- **MongoDB** >= 5.0 (local ou cloud como MongoDB Atlas)
- **pip** ou **poetry** para gerenciamento de dependências

## 🚀 Instalação e Configuração

### 1. Clonar o Repositório

```bash
git clone <seu-repositorio>
cd Public_Procurement_Opportunities
```

### 2. Configurar o Frontend

```bash
cd client/PPO-client

# Instalar dependências
npm install
# ou
yarn install

# Testar a instalação
npm run lint
```

### 3. Configurar o Backend

```bash
cd server

# Criar ambiente virtual (recomendado)
python -m venv venv

# Ativar ambiente virtual
# No Windows:
venv\Scripts\activate
# No Linux/macOS:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
# Crie um arquivo .env na raiz de /server com "as credencias" 
# Se for do projeto: pedir a credencial aos adm's
```

## ▶️ Como Executar

### Frontend

```bash
cd client/PPO-client

# Inicie o servidor Expo
npx expo start
```

A aplicação estará disponível em `http://localhost:8081` (web)

### Backend - API

```bash
cd server

# Certifique-se que o ambiente virtual está ativado
# Inicie o servidor FastAPI
python api/main.py

# Ou use uvicorn diretamente
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

A API estará disponível em `http://localhost:8000`

### Backend - ETL

```bash
cd server

# Execute o pipeline ETL
python ETL/src/main.py
```

## 📡 API Endpoints

### Saúde e Status

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Root da API, teste de conexão |
| GET | `/health` | Verificar saúde da API |
| GET | `/db-status` | Verificar status da conexão com MongoDB |

### Documentação Interativa

A documentação automática da API está disponível em:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🔄 Pipeline ETL

O pipeline ETL realiza as seguintes etapas:

### 1. **Extract** (`extract.py`)
- Coleta dados de fontes externas (portais governamentais, APIs públicas)
- Validação básica dos dados
- Armazenamento temporário

### 2. **Load** (`load.py`)
- Processamento e limpeza dos dados
- Transformação para formato padronizado
- Inserção no MongoDB

### 3. **Agendamento**
- Configure jobs recorrentes para atualizar dados regularmente (via Celery ou APScheduler)

## 🗄️ Banco de Dados

### Conexão

A conexão com MongoDB é gerenciada em `server/ETL/db/db_conection.py`.

Configure a variável de ambiente `MONGODB_URI` para apontarpara sua instância MongoDB.

## 🧪 Testes

### Frontend

```bash
cd client/PPO-client
npm run lint
```

### Backend (A ser implementado)

```bash
cd server
pytest # ou outro framework de testes
```

## 📚 Estrutura de Pastas Detalhada

### Cliente (`client/PPO-client/`)

```
├── src/app/
│   ├── _layout.tsx       # Configuração de rotas
│   └── index.tsx         # Tela principal
├── assets/
│   ├── expo.icon/        # Ícones da aplicação
│   └── images/
│       └── tabIcons/     # Ícones de abas
├── package.json          # Dependências npm
├── tsconfig.json         # Configuração TypeScript
└── app.json             # Configuração Expo
```

### Servidor (`server/`)

```
├── api/
│   ├── main.py          # Inicialização FastAPI
│   └── routes/          # Endpoints (a criar)
├── ETL/
│   ├── src/
│   │   ├── extract.py   # Extração de dados
│   │   └── load.py      # Carregamento de dados
│   └── db/
│       └── db_conection.py # Configuração MongoDB
├── requirements.txt     # Dependências Python
└── .env                # Variáveis de ambiente (não commitar)
```

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz de `server/`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/ppo
DATABASE_NAME=ppo

# FastAPI
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=True

# Ambiente
ENVIRONMENT=development
```