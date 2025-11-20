# Backend Architecture - Clean Architecture Pattern

## 🏗️ Cấu trúc thư mục

```
backend/src/
├── api/                    # API Layer - Presentation
│   ├── middleware/         # Authentication, validation, error handling
│   └── routes/            # Express route handlers
│       ├── dashboard.routes.js
│       ├── lstm.routes.js
│       └── price.routes.js
│
├── application/           # Application Layer - Use Cases & Orchestration
│   ├── DashboardOrchestrator.js    # Dashboard data aggregation
│   ├── PriceOrchestrator.js        # Price forecasting coordination
│   ├── ForecastOrchestrator.js     # Forecast workflow
│   ├── MarketOrchestrator.js       # Market sentiment analysis
│   └── NewsOrchestrator.js         # News data management
│
├── domain/                # Domain Layer - Business Logic
│   ├── ModelRegistry.js            # ML model registry
│   └── models/                     # Forecasting models
│       ├── LSTMModel.js           # LSTM neural network
│       ├── TrendModel.js          # Linear trend
│       ├── EMAModel.js            # Exponential moving average
│       └── SeasonalModel.js       # Seasonal decomposition
│
├── infrastructure/        # Infrastructure Layer - External Services
│   ├── data/
│   │   ├── ExcelReader.js         # Excel file processing
│   │   └── JSONCache.js           # File-based cache
│   ├── llm/
│   │   └── LLMProvider.js         # AI explanation service
│   └── ml/
│       └── PythonBridge.js        # Python LSTM bridge
│
├── db/                    # Database (if needed)
│   └── client.ts
│
├── workers/               # Background workers
│   ├── worker-ensemble.ts
│   ├── worker-market.ts
│   ├── worker-news.ts
│   └── worker-price.ts
│
├── server.js             # Express server entry point
└── settings.js           # Configuration

```

## 📋 Clean Architecture Layers

### 1. **API Layer** (`api/`)
- **Responsibility**: HTTP request/response handling, input validation
- **Components**:
  - Route handlers
  - Middleware (auth, validation, error handling)
  - Request DTOs
- **Dependencies**: → Application Layer

### 2. **Application Layer** (`application/`)
- **Responsibility**: Use case orchestration, business workflows
- **Components**:
  - Orchestrators: Coordinate multiple domain services
  - Use cases: Application-specific business logic
- **Pattern**: Singleton orchestrators
- **Dependencies**: → Domain Layer, Infrastructure Layer

### 3. **Domain Layer** (`domain/`)
- **Responsibility**: Core business logic, domain models
- **Components**:
  - Models: LSTM, Trend, EMA, Seasonal
  - ModelRegistry: Centralized model management
  - Business rules
- **Dependencies**: None (pure business logic)

### 4. **Infrastructure Layer** (`infrastructure/`)
- **Responsibility**: External services, data persistence, APIs
- **Components**:
  - Data access: ExcelReader, JSONCache
  - External APIs: LLMProvider, PythonBridge
  - File I/O
- **Dependencies**: None (implements interfaces defined by Domain)

## 🔄 Request Flow

```
HTTP Request
    ↓
API Routes (api/routes/*.js)
    ↓
Application Orchestrators (application/*.js)
    ↓         ↓
Domain Models   Infrastructure Services
    ↓              ↓
Business Logic   External APIs/Data
    ↓
Response
```

### Example: Price Forecast Flow

```javascript
// 1. API Layer
POST /api/v1/price/run-forecast
  ↓
// 2. Route Handler
priceRouter.post('/run-forecast', async (req, res) => {
  const result = await priceOrchestrator.runForecast(...)
})
  ↓
// 3. Application Orchestrator
PriceOrchestrator.runForecast()
  - Validates inputs
  - Selects model from ModelRegistry
  - Coordinates forecast generation
  ↓
// 4. Domain Model
LSTMModel.predict()
  - Pure business logic
  - Price calculation algorithms
  ↓
// 5. Infrastructure
PythonBridge.callPythonLSTM()
  - Calls external Python service
  - Returns predictions
```

## 🎯 Design Principles

### 1. **Dependency Rule**
- Dependencies point inward: API → Application → Domain
- Domain has NO dependencies on outer layers
- Infrastructure implements interfaces defined by Domain

### 2. **Separation of Concerns**
- **API**: HTTP concerns only
- **Application**: Workflow coordination
- **Domain**: Business rules
- **Infrastructure**: External integrations

### 3. **Single Responsibility**
- Each orchestrator handles one use case domain
- Each model handles one forecasting algorithm
- Each service has one clear purpose

### 4. **Singleton Pattern**
- Orchestrators: Shared state, coordinated workflows
- Infrastructure services: Connection pooling, caching

## 📦 Key Components

### Orchestrators (Application Layer)

#### DashboardOrchestrator
- Aggregates data from multiple sources
- Parallel execution with Promise.allSettled
- Graceful degradation on service failures

#### PriceOrchestrator
- Manages model registry
- Handles Excel file uploads
- Coordinates AI explanations
- Caches results

#### MarketOrchestrator
- Analyzes market sentiment
- Calculates volatility and trends
- Generates insights

#### NewsOrchestrator
- Fetches news data
- Provides fallback mechanisms
- AI-enhanced summaries

### Domain Models

#### LSTMModel
- Neural network forecasting
- Calls Python TensorFlow service
- Confidence scoring

#### TrendModel
- Linear regression
- Simple trend analysis

#### EMAModel
- Exponential moving average
- Short-term predictions

#### SeasonalModel
- Seasonal decomposition
- Cyclical pattern detection

## 🔧 Configuration

### Environment Variables
```bash
PORT=8000
PYTHON_LSTM_URL=http://localhost:8001
LLM_PROVIDER=none
```

### Settings (`settings.js`)
- Model configurations
- API endpoints
- Cache settings
- Timeouts

## 🚀 Running the Backend

```bash
# Install dependencies
npm install

# Start server
npm start

# Development mode
npm run dev
```

## 📝 API Endpoints

### Dashboard
- `GET /api/v1/dashboard/overview` - Dashboard overview data
- `GET /api/v1/dashboard/historical/:months` - Historical price data
- `GET /api/v1/dashboard/market-sentiment` - Market analysis
- `GET /api/v1/dashboard/news-summary/:limit` - News feed

### Price Forecast
- `GET /api/v1/price/latest` - Latest forecast
- `POST /api/v1/price/run-forecast` - Generate new forecast
- `POST /api/v1/price/upload-excel` - Upload price data

### LSTM
- `POST /api/v1/lstm/run` - Run LSTM forecast

## 🧪 Testing

Each layer should be tested independently:

- **API Tests**: HTTP request/response validation
- **Application Tests**: Orchestration logic, error handling
- **Domain Tests**: Business logic, calculations
- **Infrastructure Tests**: Mock external services

## 📚 References

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
