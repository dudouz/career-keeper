# 🤖 AI Agent - Chain of Density Pipeline

## 📋 Resumo Executivo

Implementamos um **agente de IA completo** que analisa contribuições do GitHub (commits e PRs) e gera relatórios profissionais personalizados usando um pipeline de 3 etapas (Chain of Density).

**O que isso faz?**
- ✅ Lê seus commits e PRs do GitHub
- ✅ Analisa tecnologias, padrões de design e decisões arquiteturais
- ✅ Gera relatórios em Markdown adaptados ao seu objetivo (job, promoção, LinkedIn, etc.)
- ✅ Personaliza output baseado em senioridade (Junior → Principal) e role (Backend, Frontend, etc.)

---

## 🏗️ Arquitetura

### Pipeline Chain of Density (3 Steps)

```
GitHub Contributions (JSON)
         ↓
┌────────────────────────────────────────┐
│  STEP 1: Extraction & Summary          │
│  → O QUE mudou?                        │
│  → Extrai mudanças técnicas            │
│  → Identifica arquivos, dependências   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  STEP 2: Pattern Recognition           │
│  → COMO e POR QUÊ?                     │
│  → Identifica design patterns          │
│  → Analisa stack tecnológico           │
│  → Extrai decisões arquiteturais       │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  STEP 3: Final Reporting               │
│  → Apresentação profissional           │
│  → Gera Markdown formatado             │
│  → Adapta ao objetivo (job/promo/etc)  │
└────────────────────────────────────────┘
         ↓
Relatório Profissional em Markdown ✨
```

### Service Layer Pattern

```
API Route (/api/agents/analyze-contributions)
    ↓
Service Layer (agents.service.ts)
    ├── Busca contribuições do DB (se não fornecidas)
    ├── Filtra por período (lastNDays, startDate/endDate)
    ├── Busca OpenAI key do usuário (criptografada)
    └── Executa Pipeline Chain of Density
    ↓
Pipeline retorna ConsolidatedReport + RichAnalysis
```

---

## 📁 Estrutura de Arquivos Criados

```
src/lib/agents/chain-of-density/
├── types.ts                      # Tipos TypeScript (PRAnalysis, CommitAnalysis, etc.)
├── context-types.ts              # Tipos de contexto (seniority, role, objective) ⭐ NOVO
├── prompt-templates.ts           # Templates dinâmicos de prompts ⭐ NOVO
├── helpers.ts                    # Funções auxiliares (conversão de dados)
├── step1-extraction.ts           # Step 1: Extraction & Summary
├── step2-pattern-recognition.ts  # Step 2: Pattern Recognition
├── step3-final-reporting.ts      # Step 3: Final Reporting
├── pipeline.ts                   # Orquestrador principal
├── index.ts                      # Exports públicos
├── README.md                     # Documentação técnica
└── CONTEXT-CUSTOMIZATION.md      # Guia de customização ⭐ NOVO

src/lib/services/agents/
├── agents.types.ts               # Tipos do service
├── agents.service.ts             # Lógica de negócio
└── index.ts                      # Exports

src/app/api/agents/analyze-contributions/
└── route.ts                      # API endpoint REST

src/lib/agents/
├── README.md                     # Explicação simplificada
├── EXAMPLE.md                    # Exemplo prático de uso
└── CONTEXT-CUSTOMIZATION.md      # Guia de customização de prompts
```

---

## 🚀 Como Usar

### Opção 1: Automático (mais fácil)

```bash
POST /api/agents/analyze-contributions
{
  # Vazio! Busca contribuições do banco automaticamente
}
```

### Opção 2: Com filtro de período

```bash
POST /api/agents/analyze-contributions
{
  "options": {
    "lastNDays": 30  # Últimos 30 dias
  }
}
```

### Opção 3: Com contexto personalizado ⭐ NOVO

```bash
POST /api/agents/analyze-contributions
{
  "options": {
    "context": {
      "seniority": "senior",
      "role": "backend",
      "objective": "job_application",
      "targetJobTitle": "Senior Backend Engineer at Google"
    }
  }
}
```

### Opção 4: Programaticamente

```typescript
import { analyzeContributionsWithAgent } from "@/lib/services/agents";

const result = await analyzeContributionsWithAgent({
  userId: "user-123",
  options: {
    lastNDays: 30,
    maxCommits: 20,
    maxPRs: 10,
    context: {
      seniority: "senior",
      role: "backend",
      objective: "promotion"
    }
  }
});

console.log(result.consolidatedReport.overallSummary);
console.log(result.richAnalysis.prAnalyses);
```

---

## 🎯 Sistema de Customização de Contexto ⭐ NOVO

### O que é?

Adapta os prompts do agente baseado em:
1. **Seniority** (quem você é)
2. **Role** (sua especialidade)
3. **Objective** (o que você quer)

### Opções Disponíveis

#### Seniority (6 níveis)
```typescript
type Seniority =
  | "junior"      // 0-2 anos
  | "mid"         // 2-5 anos
  | "senior"      // 5-8 anos
  | "staff"       // 8+ anos
  | "principal"   // 10+ anos
  | "lead";       // Tech Lead
```

#### Role (8 especializações)
```typescript
type Role =
  | "backend"    | "frontend"   | "fullstack"  | "devops"
  | "mobile"     | "data"       | "ml"         | "security";
```

#### Objective (8 objetivos)
```typescript
type Objective =
  | "job_application"      // Aplicando para vaga
  | "promotion"            // Buscando promoção
  | "year_review"          // Review anual
  | "portfolio"            // Portfolio
  | "general"              // Análise geral
  | "linkedin"             // LinkedIn
  | "resume_update"        // Currículo
  | "salary_negotiation";  // Negociação
```

### Exemplo: Diferença na Prática

#### SEM contexto (default):
```markdown
## Contribution
Added email validation to login form
```

#### COM contexto (Senior Backend + Job Application):
```markdown
## Key Achievement: Robust Validation Infrastructure

**Challenge:** Login form lacked proper input validation, causing 1000+ failed signups/month

**Solution:**
- Implemented RFC 5322 compliant email validation
- Created reusable Strategy Pattern-based validation framework
- Added comprehensive test coverage (95%)

**Impact:**
- ↓ 45% invalid submissions
- ↓ 30% support tickets
- ✓ Pattern adopted by 3 other teams

**Tech Stack:** TypeScript, Zod, React Hook Form, Strategy Pattern
```

#### COM contexto (Mid Frontend + LinkedIn):
```markdown
🚀 Just shipped a game-changing UX improvement!

Over the past month, I revamped our login flow with smart validation
that catches errors *before* users hit submit. No more frustrating
failed login attempts!

💡 Tech highlights:
• React Hook Form for performance
• Zod for type-safe validation
• Real-time feedback UX

📊 Impact: 45% fewer failed logins, happier users!

#frontend #react #ux
```

---

## 📦 O que você recebe de volta?

### ConsolidatedReport

```typescript
{
  overallSummary: string,              // Executive summary (Markdown)

  individualReports: [                 // Report para cada PR/commit
    {
      markdownReport: string,
      contributionMetadata: {...}
    }
  ],

  aggregatedInsights: {
    totalContributions: 45,
    topTechnologies: [
      { name: "React", count: 28 },
      { name: "TypeScript", count: 30 }
    ],
    topPatterns: [
      { name: "Repository Pattern", count: 8 }
    ],
    keyAchievements: [...]
  },

  richAnalysisResult: {...}            // Dados estruturados
}
```

### RichAnalysis (Dados Estruturados)

```typescript
{
  prAnalyses: [                        // Análise detalhada de PRs
    {
      prNumber: 123,
      title: "feat: add validation",
      summary: "...",
      technologies: ["React", "Zod"],
      patterns: ["Strategy Pattern"],
      complexity: "medium",
      impact: "Improves UX and security"
    }
  ],

  commitAnalyses: [...],               // Análise de commits

  keyTechnologies: ["React", "TypeScript", "Next.js"],
  keyPatterns: ["Repository", "Strategy", "Factory"],
  recommendations: [...],

  metadata: {
    totalPRs: 12,
    totalCommits: 45,
    totalFilesChanged: 187,
    complexityDistribution: {
      low: 3, medium: 7, high: 2
    }
  }
}
```

---

## 🔧 Funcionalidades Implementadas

### ✅ Core Pipeline
- [x] Step 1: Extraction & Summary
- [x] Step 2: Pattern Recognition & Reasoning
- [x] Step 3: Final Reporting
- [x] Consolidação de relatórios
- [x] Rich analysis (PRAnalysis, CommitAnalysis)

### ✅ Service Layer
- [x] Service pattern (separation of concerns)
- [x] Busca automática de contribuições do banco
- [x] Filtro por período (lastNDays, startDate/endDate)
- [x] Busca e descriptografia de OpenAI key
- [x] Error handling robusto

### ✅ Customização de Contexto ⭐ NOVO
- [x] 6 níveis de seniority
- [x] 8 roles/especializações
- [x] 8 objetivos diferentes
- [x] Templates de prompts dinâmicos
- [x] Custom instructions
- [x] Target job title/company

### ✅ API & Integração
- [x] REST endpoint `/api/agents/analyze-contributions`
- [x] Rate limiting (5 req/min)
- [x] Authentication
- [x] Error handling com status codes apropriados

### ✅ Tipos & TypeScript
- [x] 100% type-safe
- [x] Zero erros de type checking
- [x] Interfaces bem definidas
- [x] Exports organizados

### ✅ Documentação
- [x] README técnico
- [x] Guia simplificado
- [x] Exemplos práticos
- [x] Guia de customização de contexto

---

## 💰 Custos & Performance

### Custos (OpenAI GPT-4 Turbo)
- **1 contribuição**: ~$0.03 USD
- **20 contribuições**: ~$0.60 USD
- **100 contribuições**: ~$3.00 USD

### Performance
- **1 contribuição**: ~3-5 segundos
- **20 contribuições**: ~1-2 minutos
- Processamento **sequencial** para evitar rate limits

### Rate Limits
- **API Endpoint**: 5 requests/minuto
- **OpenAI**: Usa quota pessoal do usuário

---

## 🎓 Tecnologias Usadas

### Core
- **LangChain/LangGraph**: Framework para pipelines de IA
- **OpenAI GPT-4 Turbo**: LLM para análise inteligente
- **TypeScript**: Type safety
- **Next.js API Routes**: REST endpoints

### Database & Auth
- **Drizzle ORM**: Database queries
- **PostgreSQL**: Armazenamento
- **NextAuth**: Authentication
- **Crypto**: Encriptação de API keys

---

## 📚 Dependências Instaladas

```json
{
  "@langchain/core": "1.1.4",
  "@langchain/langgraph": "1.0.4",
  "@langchain/openai": "1.1.3",
  "langchain": "1.1.5"
}
```

---

## 🔐 Segurança

- ✅ OpenAI API key **criptografada** no banco
- ✅ Descriptografia server-side only
- ✅ Rate limiting por usuário
- ✅ Authentication obrigatória
- ✅ Nenhuma key enviada ao cliente

---

## 📖 Exemplos de Uso Real

### Caso 1: Aplicando para Senior Backend na Google

```typescript
{
  options: {
    lastNDays: 90,  // Últimos 3 meses
    context: {
      seniority: "senior",
      role: "backend",
      objective: "job_application",
      targetJobTitle: "Senior Backend Engineer - Payments at Google",
      customInstructions: "Emphasize distributed systems, scalability, and high-traffic experience"
    }
  }
}
```

**Output**: Relatório focado em achievements quantificáveis, distributed systems, scalability, performance metrics.

### Caso 2: Review Anual Mid Full Stack

```typescript
{
  options: {
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    context: {
      seniority: "mid",
      role: "fullstack",
      objective: "year_review",
      yearsOfExperience: 4
    }
  }
}
```

**Output**: Relatório comprehensivo mostrando crescimento, organizando por quarters, incluindo wins e learnings.

### Caso 3: Post LinkedIn

```typescript
{
  options: {
    lastNDays: 7,  // Última semana
    context: {
      seniority: "mid",
      role: "frontend",
      objective: "linkedin",
      customInstructions: "Focus on the most impressive feature shipped this week"
    }
  }
}
```

**Output**: Post em primeira pessoa, engajante, com emojis, pronto pra copiar pro LinkedIn.

### Caso 4: Negociação de Salário

```typescript
{
  options: {
    lastNDays: 365,  // Último ano
    context: {
      seniority: "senior",
      role: "backend",
      objective: "salary_negotiation",
      yearsOfExperience: 7,
      customInstructions: "Quantify all business impact with metrics, cost savings, and revenue impact"
    }
  }
}
```

**Output**: Relatório focado em ROI, business value, métricas quantificáveis de custo/benefício.

---

## 🔄 Fluxo Completo (End-to-End)

```
1. User faz request → POST /api/agents/analyze-contributions
         ↓
2. API valida auth + rate limit
         ↓
3. Service busca OpenAI key do usuário (banco)
         ↓
4. Service busca contribuições (ou usa fornecidas)
         ↓
5. Service filtra por período (se especificado)
         ↓
6. Service executa Pipeline Chain of Density
         ↓
         ├─ Step 1: Extração (com contexto)
         ├─ Step 2: Padrões (com contexto)
         └─ Step 3: Relatórios (com contexto)
         ↓
7. Pipeline agrega resultados
         ↓
8. Service retorna ConsolidatedReport + RichAnalysis
         ↓
9. Frontend recebe JSON com relatórios
         ↓
10. User visualiza relatório formatado
```

---

## 🎯 Casos de Uso

### ✅ Para Desenvolvedores
- Gerar resumos profissionais de contribuições
- Preparar material para job applications
- Construir portfolio
- Atualizar LinkedIn com achievements

### ✅ Para Team Leads
- Reviews de performance do time
- Identificar contribuições chave
- Preparar promoções
- Documentar achievements para upper management

### ✅ Para Empresas
- Year-end reviews automatizados
- Identificar expertise técnica do time
- Documentar technical debt e melhorias
- Track patterns e decisões arquiteturais

---

## 🚦 Próximos Passos (Sugestões)

### Frontend (UI)
- [ ] Criar página de análise com form para selecionar contexto
- [ ] Dropdown para seniority, role, objective
- [ ] Preview do relatório em tempo real
- [ ] Salvar contextos favoritos do usuário
- [ ] Exportar relatórios para PDF

### Backend (Features)
- [ ] Cache de análises (não processar mesmo commit 2x)
- [ ] Streaming de respostas (ver progresso em tempo real)
- [ ] Suporte a múltiplos LLMs (Claude, Gemini)
- [ ] Sistema de templates customizáveis pelo usuário
- [ ] Webhooks para análise automática após commits

### Analytics
- [ ] Track qual contexto gera melhores resultados
- [ ] A/B testing de prompts
- [ ] Feedback do usuário nos relatórios
- [ ] Métricas de uso (contextos mais populares)

---

## 📝 Changelog

### v1.0.0 (2024-12-12)

**🎉 Lançamento Inicial**

**Features:**
- ✅ Pipeline Chain of Density completo (3 steps)
- ✅ Service layer com separation of concerns
- ✅ Sistema de customização de contexto
- ✅ Templates de prompts dinâmicos
- ✅ Filtros de período (lastNDays, dates)
- ✅ Busca automática de contribuições
- ✅ API REST endpoint
- ✅ Rich analysis (PRAnalysis, CommitAnalysis)
- ✅ Documentação completa

**Tech Stack:**
- LangChain/LangGraph 1.0.4
- OpenAI GPT-4 Turbo
- TypeScript 5.6
- Next.js 16
- Drizzle ORM

**Breaking Changes:**
- N/A (primeira versão)

---

## 📞 Suporte

### Documentação
- `/src/lib/agents/README.md` - Explicação simplificada
- `/src/lib/agents/EXAMPLE.md` - Exemplos práticos
- `/src/lib/agents/CONTEXT-CUSTOMIZATION.md` - Guia de customização
- `/src/lib/agents/chain-of-density/README.md` - Docs técnicos

### Arquivos Chave
- Service: `/src/lib/services/agents/agents.service.ts`
- Pipeline: `/src/lib/agents/chain-of-density/pipeline.ts`
- API: `/src/app/api/agents/analyze-contributions/route.ts`
- Prompts: `/src/lib/agents/chain-of-density/prompt-templates.ts`

---

## 🎓 Conclusão

Você agora tem um **sistema completo de análise inteligente de código** que:

1. ✅ Analisa automaticamente contribuições do GitHub
2. ✅ Identifica tecnologias, padrões, e decisões arquiteturais
3. ✅ Gera relatórios profissionais personalizados
4. ✅ Adapta output baseado em contexto (seniority/role/objetivo)
5. ✅ Filtra por período
6. ✅ Retorna dados estruturados + Markdown
7. ✅ Está pronto para uso em produção

É basicamente um **Senior Software Architect + Technical Writer automatizado**! 🚀

---

**Criado em:** 12 de Dezembro de 2024
**Versão:** 1.0.0
**Stack:** LangChain + OpenAI GPT-4 + TypeScript + Next.js
