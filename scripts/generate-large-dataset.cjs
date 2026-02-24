/**
 * Generate a large dataset (~2000 documents) for CompanyMind
 * covering the same tech/software/AI/data domains as the existing sample-documents.json
 *
 * Usage: node scripts/generate-large-dataset.cjs [--count=2000] [--output=seeds/large-dataset.json]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let TARGET_COUNT = 2000;
let OUTPUT_FILE = path.join(__dirname, '..', 'seeds', 'large-dataset.json');

for (const arg of args) {
  if (arg.startsWith('--count=')) TARGET_COUNT = parseInt(arg.split('=')[1], 10);
  if (arg.startsWith('--output=')) OUTPUT_FILE = path.resolve(arg.split('=')[1]);
}

// ────────────────────────────────────────────────────────────────────────────
// CATEGORY → { subcategories, templates }
// Each template is { titleTemplate, contentTemplate, tags }
// We use placeholders like {LANG}, {TOOL}, etc. to generate variations
// ────────────────────────────────────────────────────────────────────────────

const CATEGORIES = {
  technology: {
    items: [
      {
        title: "Understanding {CONCEPT} in Modern Technology",
        content: "{CONCEPT} is a foundational concept in modern technology that influences how systems are designed, built, and maintained. It encompasses principles of {PRINCIPLE1} and {PRINCIPLE2}, enabling organizations to build more efficient and reliable solutions. As technology continues to evolve, understanding {CONCEPT} becomes increasingly critical for professionals across the industry. Companies that master {CONCEPT} gain significant competitive advantages in digital transformation initiatives.",
        tags: [["technology", "innovation"], ["digital transformation", "emerging tech"], ["systems design", "architecture"]],
        vars: {
          CONCEPT: ["edge computing", "quantum computing", "5G networks", "IoT platforms", "digital twins", "augmented reality", "virtual reality", "wearable technology", "autonomous systems", "smart cities", "biometric authentication", "spatial computing", "ambient computing", "neuromorphic computing", "photonics"],
          PRINCIPLE1: ["distributed processing", "low-latency communication", "parallel computation", "real-time data ingestion", "sensor fusion", "mesh networking", "federated learning", "energy efficiency", "miniaturization", "signal processing"],
          PRINCIPLE2: ["data sovereignty", "network resilience", "fault tolerance", "energy efficiency", "device interoperability", "privacy preservation", "adaptive control", "cognitive automation", "edge intelligence", "self-healing systems"]
        }
      },
      {
        title: "The Rise of {TECH} in Enterprise Solutions",
        content: "Enterprise adoption of {TECH} has accelerated rapidly in recent years, driven by the need for {BENEFIT1} and {BENEFIT2}. Organizations are leveraging {TECH} to streamline operations, reduce costs, and improve decision-making. Key challenges include integration with legacy systems, change management, and ensuring ROI. Industry leaders recommend a phased approach to {TECH} adoption, starting with pilot projects before scaling enterprise-wide. Successful implementations typically involve cross-functional teams and strong executive sponsorship.",
        tags: [["enterprise", "digital transformation"], ["business technology", "innovation"], ["enterprise software", "strategy"]],
        vars: {
          TECH: ["low-code platforms", "robotic process automation", "digital experience platforms", "composable architecture", "API-first design", "event-driven systems", "data mesh", "platform engineering", "internal developer portals", "service mesh", "feature flags", "observability platforms", "chaos engineering tools", "progressive delivery", "infrastructure as code"],
          BENEFIT1: ["operational efficiency", "faster time-to-market", "better customer experiences", "increased agility", "cost optimization", "risk reduction", "improved compliance", "enhanced collaboration", "data-driven insights", "workforce productivity"],
          BENEFIT2: ["competitive differentiation", "scalable growth", "regulatory compliance", "improved security posture", "talent retention", "customer satisfaction", "revenue acceleration", "process automation", "strategic alignment", "innovation capacity"]
        }
      },
      {
        title: "How {TECH} is Transforming {INDUSTRY}",
        content: "{TECH} is fundamentally reshaping {INDUSTRY} by enabling new capabilities and business models. Traditional approaches in {INDUSTRY} relied on manual processes and siloed data, but {TECH} introduces automation, real-time analytics, and seamless integration. Early adopters are reporting significant improvements in productivity, quality, and customer satisfaction. However, successful transformation requires addressing cultural resistance, upskilling the workforce, and establishing robust governance frameworks.",
        tags: [["digital transformation", "industry"], ["innovation", "automation"], ["disruption", "emerging tech"]],
        vars: {
          TECH: ["artificial intelligence", "blockchain", "cloud computing", "IoT", "5G", "augmented reality", "digital twins", "edge computing", "quantum computing", "robotics"],
          INDUSTRY: ["healthcare", "financial services", "manufacturing", "retail", "education", "logistics", "agriculture", "energy", "real estate", "telecommunications"]
        }
      }
    ]
  },
  "software engineering": {
    items: [
      {
        title: "{PATTERN} Pattern in {LANG} Development",
        content: "The {PATTERN} pattern is a widely used {PTYPE} design pattern in {LANG} development. It addresses the problem of {PROBLEM} by providing a structured approach to organizing code and managing complexity. When implementing {PATTERN} in {LANG}, developers typically create {COMPONENT1} that interacts with {COMPONENT2}. This separation of concerns improves testability, maintainability, and code reuse. Modern {LANG} frameworks often provide built-in support for the {PATTERN} pattern, making it easier to adopt.",
        tags: [["design patterns", "software architecture"], ["clean code", "best practices"], ["{LANG}", "patterns"]],
        vars: {
          PATTERN: ["Repository", "Factory", "Observer", "Strategy", "Decorator", "Adapter", "Mediator", "Command", "Builder", "Singleton", "Proxy", "Facade", "Template Method", "Chain of Responsibility", "State"],
          LANG: ["Java", "Python", "TypeScript", "C#", "Go", "Rust", "Kotlin", "Swift", "Ruby", "PHP"],
          PTYPE: ["creational", "structural", "behavioral", "architectural", "enterprise", "concurrency"],
          PROBLEM: ["object creation complexity", "interface incompatibility", "tight coupling between components", "managing complex state transitions", "handling cross-cutting concerns", "coordinating distributed operations"],
          COMPONENT1: ["an abstraction layer", "a factory class", "an event emitter", "a strategy interface", "a wrapper class", "a bridge component"],
          COMPONENT2: ["concrete implementations", "product hierarchies", "event listeners", "algorithm families", "wrapped objects", "platform-specific adapters"]
        }
      },
      {
        title: "Best Practices for {TOPIC} in {LANG}",
        content: "Following best practices for {TOPIC} in {LANG} is essential for building reliable and maintainable software. Key recommendations include writing clear and consistent code, using appropriate naming conventions, and leveraging {LANG}'s type system effectively. For {TOPIC} specifically, developers should focus on {PRACTICE1} and {PRACTICE2}. Code reviews are an important quality gate that helps enforce these practices across the team. Automated tools like linters and formatters can catch common issues early in the development cycle.",
        tags: [["{LANG}", "best practices"], ["clean code", "code quality"], ["software engineering", "development"]],
        vars: {
          TOPIC: ["error handling", "testing", "logging", "dependency injection", "configuration management", "API design", "database access", "caching", "authentication", "input validation", "serialization", "async programming", "memory management", "concurrency", "code organization"],
          LANG: ["Java", "Python", "TypeScript", "C#", "Go", "Rust", "Kotlin", "Swift", "Ruby", "JavaScript"],
          PRACTICE1: ["defensive programming techniques", "comprehensive input validation", "meaningful error messages", "separation of concerns", "proper encapsulation", "consistent error propagation"],
          PRACTICE2: ["thorough unit test coverage", "integration testing strategies", "performance benchmarking", "security scanning", "documentation generation", "continuous monitoring"]
        }
      },
      {
        title: "Building {APPTYPE} Applications with {FRAMEWORK}",
        content: "{FRAMEWORK} is a popular framework for building {APPTYPE} applications, offering a rich set of features including {FEATURE1} and {FEATURE2}. Getting started with {FRAMEWORK} involves setting up the project structure, configuring dependencies, and understanding the core abstractions. The framework follows the principle of {PRINCIPLE}, which helps developers write clean and maintainable code. Community support and extensive documentation make {FRAMEWORK} accessible for both beginners and experienced developers.",
        tags: [["{FRAMEWORK}", "development"], ["{APPTYPE}", "frameworks"], ["web development", "programming"]],
        vars: {
          APPTYPE: ["web", "mobile", "desktop", "API", "microservice", "serverless", "real-time", "event-driven", "data pipeline", "CLI"],
          FRAMEWORK: ["Express.js", "FastAPI", "Spring Boot", "Django", "Rails", "ASP.NET Core", "NestJS", "Flask", "Gin", "Actix"],
          FEATURE1: ["middleware support", "dependency injection", "ORM integration", "template engines", "WebSocket support", "GraphQL support", "rate limiting", "request validation", "CORS handling", "session management"],
          FEATURE2: ["automatic API documentation", "hot module reloading", "database migrations", "authentication plugins", "caching layers", "background job processing", "health checks", "metrics exposition", "graceful shutdown", "configuration profiles"],
          PRINCIPLE: ["convention over configuration", "explicit is better than implicit", "inversion of control", "don't repeat yourself", "composition over inheritance", "fail fast"]
        }
      },
      {
        title: "{METHODOLOGY} in Modern Software Teams",
        content: "{METHODOLOGY} has become a cornerstone of modern software development practices. Teams adopting {METHODOLOGY} report improvements in {METRIC1} and {METRIC2}. The approach emphasizes continuous improvement, team collaboration, and rapid feedback loops. Implementation typically involves establishing ceremonies like {CEREMONY1} and {CEREMONY2}, along with defining clear roles and responsibilities. Success with {METHODOLOGY} requires buy-in from both leadership and individual contributors.",
        tags: [["methodology", "agile"], ["team practices", "process"], ["software development", "management"]],
        vars: {
          METHODOLOGY: ["Scrum", "Kanban", "XP (Extreme Programming)", "SAFe", "Shape Up", "Lean Software Development", "DevOps Culture", "Trunk-Based Development", "Mob Programming", "Domain-Driven Design"],
          METRIC1: ["delivery velocity", "code quality", "team morale", "customer satisfaction", "lead time", "deployment frequency"],
          METRIC2: ["defect reduction", "faster feedback", "better estimation", "reduced waste", "higher throughput", "improved predictability"],
          CEREMONY1: ["daily standups", "sprint planning", "backlog refinement", "design reviews", "demo sessions", "retrospectives"],
          CEREMONY2: ["retrospectives", "pair programming sessions", "tech debt reviews", "architecture decision records", "post-mortems", "innovation sprints"]
        }
      }
    ]
  },
  "data science": {
    items: [
      {
        title: "{TECHNIQUE} for {DOMAIN} Data Analysis",
        content: "{TECHNIQUE} is a powerful analytical method used in {DOMAIN} to extract insights from complex datasets. The approach involves {STEP1}, followed by {STEP2}, and finally {STEP3}. In {DOMAIN}, {TECHNIQUE} has proven effective for identifying patterns, predicting outcomes, and optimizing processes. Practitioners should be aware of common pitfalls including overfitting, selection bias, and data leakage. Tools like Python's scikit-learn, R's caret package, and specialized libraries make {TECHNIQUE} accessible to data scientists.",
        tags: [["data science", "{TECHNIQUE}"], ["analytics", "{DOMAIN}"], ["statistical analysis", "modeling"]],
        vars: {
          TECHNIQUE: ["regression analysis", "clustering", "time series forecasting", "anomaly detection", "dimensionality reduction", "survival analysis", "A/B testing", "causal inference", "Bayesian analysis", "ensemble methods", "feature engineering", "text mining", "network analysis", "spatial analysis", "Monte Carlo simulation"],
          DOMAIN: ["marketing", "healthcare", "finance", "e-commerce", "supply chain", "social media", "energy", "manufacturing", "telecommunications", "insurance"],
          STEP1: ["data collection and preprocessing", "exploratory data analysis", "feature selection", "hypothesis formulation", "data partitioning"],
          STEP2: ["model training and validation", "statistical testing", "cross-validation", "hyperparameter tuning", "feature transformation"],
          STEP3: ["result interpretation and visualization", "model deployment", "A/B testing in production", "stakeholder communication", "continuous monitoring"]
        }
      },
      {
        title: "Data Visualization with {TOOL}: {VIZTYPE} Charts",
        content: "Creating effective {VIZTYPE} charts with {TOOL} enables data scientists and analysts to communicate complex findings clearly. {TOOL} provides a rich API for customizing {VIZTYPE} visualizations, including color schemes, annotations, and interactive features. Best practices for {VIZTYPE} charts include choosing appropriate scales, labeling axes clearly, and avoiding chartjunk. When dealing with large datasets, consider aggregation, sampling, or progressive rendering techniques. {TOOL} integrates well with Jupyter notebooks and web dashboards for seamless data storytelling.",
        tags: [["data visualization", "{TOOL}"], ["charts", "analytics"], ["data storytelling", "reporting"]],
        vars: {
          TOOL: ["Matplotlib", "Seaborn", "Plotly", "D3.js", "Altair", "Bokeh", "Chart.js", "Apache ECharts", "Vega-Lite", "Tableau"],
          VIZTYPE: ["scatter plot", "heatmap", "bar chart", "line chart", "box plot", "histogram", "treemap", "sunburst", "sankey", "radar"]
        }
      },
      {
        title: "Building {PTYPE} Pipelines with {TOOL}",
        content: "Data pipelines built with {TOOL} streamline the process of {PTYPE} by automating repetitive tasks and ensuring reproducibility. A typical {PTYPE} pipeline includes stages for data ingestion, validation, transformation, and output generation. {TOOL} provides built-in operators for connecting to various data sources, running transformations, and handling failures gracefully. Monitoring and alerting are critical for production pipelines to detect data quality issues early. Teams should adopt version control for pipeline definitions and implement comprehensive testing.",
        tags: [["data engineering", "{TOOL}"], ["pipelines", "ETL"], ["data processing", "automation"]],
        vars: {
          PTYPE: ["data transformation", "ETL processing", "feature engineering", "data validation", "data migration", "stream processing"],
          TOOL: ["Apache Airflow", "dbt", "Prefect", "Dagster", "Luigi", "Apache Beam", "Apache NiFi", "Databricks", "Snowflake", "Fivetran"]
        }
      }
    ]
  },
  "AI research": {
    items: [
      {
        title: "{MODEL} Architecture for {TASK}",
        content: "The {MODEL} architecture has shown remarkable performance on {TASK} benchmarks, achieving state-of-the-art results across multiple datasets. The model leverages {MECHANISM} to capture complex patterns in the input data, enabling more accurate and robust predictions. Training {MODEL} requires careful attention to hyperparameter selection, learning rate scheduling, and data augmentation strategies. Transfer learning from pre-trained {MODEL} models significantly reduces the amount of labeled data needed for downstream tasks. Recent research has explored scaling laws, efficiency improvements, and interpretability techniques for {MODEL}.",
        tags: [["AI", "{MODEL}"], ["deep learning", "{TASK}"], ["neural networks", "research"]],
        vars: {
          MODEL: ["Transformer", "GPT", "BERT", "Vision Transformer (ViT)", "Diffusion Model", "Graph Neural Network", "Mixture of Experts", "State Space Model (Mamba)", "Retrieval-Augmented Generation", "Autoencoder", "GAN", "Neuro-Symbolic", "Convolutional Neural Network", "Recurrent Neural Network", "Reinforcement Learning Agent"],
          TASK: ["text classification", "question answering", "image generation", "object detection", "speech recognition", "machine translation", "code generation", "summarization", "sentiment analysis", "named entity recognition", "semantic search", "recommendation", "anomaly detection", "time series prediction", "drug discovery"],
          MECHANISM: ["self-attention mechanisms", "cross-attention layers", "graph convolutions", "denoising objectives", "contrastive learning", "variational inference", "policy gradients", "memory augmentation", "sparse attention", "rotary position embeddings"]
        }
      },
      {
        title: "Advances in {SUBFIELD}: {TOPIC}",
        content: "Recent advances in {SUBFIELD} have led to significant breakthroughs in {TOPIC}. Researchers have developed novel approaches combining {APPROACH1} with {APPROACH2} to achieve superior performance. Key challenges in this area include data efficiency, computational cost, and generalization to out-of-distribution samples. The {SUBFIELD} community has published numerous papers at top venues like NeurIPS, ICML, and ICLR addressing these challenges. Open-source implementations and pre-trained models have democratized access to cutting-edge {SUBFIELD} techniques.",
        tags: [["AI research", "{SUBFIELD}"], ["{TOPIC}", "deep learning"], ["machine learning", "research"]],
        vars: {
          SUBFIELD: ["computer vision", "natural language processing", "reinforcement learning", "generative AI", "federated learning", "multimodal learning", "few-shot learning", "continual learning", "self-supervised learning", "causal AI"],
          TOPIC: ["zero-shot generalization", "prompt engineering", "model compression", "data augmentation", "knowledge distillation", "neural architecture search", "multi-task learning", "domain adaptation", "adversarial robustness", "interpretability"],
          APPROACH1: ["pre-training on large-scale data", "curriculum learning", "meta-learning", "contrastive objectives", "self-supervised pretext tasks", "knowledge graph integration"],
          APPROACH2: ["fine-tuning with task-specific data", "reinforcement learning from human feedback", "chain-of-thought prompting", "multi-step reasoning", "ensemble methods", "active learning"]
        }
      },
      {
        title: "Ethical Considerations in {AIAREA}",
        content: "As {AIAREA} systems become more prevalent, ethical considerations are paramount. Key concerns include {CONCERN1} and {CONCERN2}. Researchers and practitioners must ensure that {AIAREA} systems are developed responsibly, with thorough testing for bias and fairness across diverse populations. Regulatory frameworks like the EU AI Act and NIST AI Risk Management Framework provide guidance on responsible deployment. Organizations should establish AI governance committees and conduct regular impact assessments to mitigate risks associated with {AIAREA}.",
        tags: [["AI ethics", "responsible AI"], ["{AIAREA}", "governance"], ["fairness", "bias"]],
        vars: {
          AIAREA: ["facial recognition", "automated hiring", "content moderation", "predictive policing", "healthcare diagnostics", "autonomous vehicles", "credit scoring", "language models", "recommendation systems", "surveillance"],
          CONCERN1: ["algorithmic bias against minority groups", "lack of transparency in decision-making", "privacy violations through data collection", "job displacement and economic inequality", "misinformation generation"],
          CONCERN2: ["accountability gaps when AI systems make errors", "consent and data sovereignty issues", "environmental impact of training large models", "weaponization of AI capabilities", "concentration of power in few organizations"]
        }
      }
    ]
  },
  database: {
    items: [
      {
        title: "{DBTYPE} Database {TOPIC}: {SUBTOPIC}",
        content: "{DBTYPE} databases handle {TOPIC} through specialized mechanisms that ensure {GOAL}. {SUBTOPIC} is a critical aspect of {TOPIC} in {DBTYPE} systems, requiring careful configuration and monitoring. Key considerations include {CONSIDERATION1} and {CONSIDERATION2}. Database administrators and developers should regularly benchmark their {TOPIC} configurations to identify bottlenecks and optimize performance. Modern {DBTYPE} databases offer automated tools and advisors that simplify {TOPIC} management.",
        tags: [["database", "{DBTYPE}"], ["{TOPIC}", "optimization"], ["data management", "performance"]],
        vars: {
          DBTYPE: ["relational", "document", "graph", "time-series", "key-value", "columnar", "vector", "multi-model", "in-memory", "distributed"],
          TOPIC: ["indexing", "replication", "sharding", "query optimization", "transaction management", "backup and recovery", "security", "monitoring", "schema design", "data modeling"],
          SUBTOPIC: ["composite indexes", "read replicas", "hash-based partitioning", "query plan analysis", "ACID compliance", "point-in-time recovery", "role-based access control", "slow query logging", "normalization strategies", "embedding relationships"],
          GOAL: ["fast query execution", "high availability", "horizontal scalability", "cost-effective storage", "data consistency", "disaster recovery", "data privacy", "operational visibility", "data integrity", "flexible querying"],
          CONSIDERATION1: ["storage overhead and write amplification", "network latency between replicas", "data distribution skew", "index selectivity", "lock contention", "recovery time objectives"],
          CONSIDERATION2: ["impact on write throughput", "consistency guarantees", "rebalancing overhead", "statistics freshness", "deadlock detection", "backup storage costs"]
        }
      },
      {
        title: "{DB} Best Practices for {USECASE}",
        content: "Using {DB} for {USECASE} requires following specific best practices to achieve optimal performance and reliability. Start by designing your schema to match your query patterns, as {DB} performs best when the data model aligns with access patterns. Implement proper indexing strategies for your most common queries, and use {DB}'s built-in profiling tools to identify slow operations. For {USECASE} workloads, consider {RECOMMENDATION1} and {RECOMMENDATION2}. Connection pooling, retry logic, and proper error handling are essential for production deployments.",
        tags: [["{DB}", "best practices"], ["{USECASE}", "database"], ["performance", "optimization"]],
        vars: {
          DB: ["MongoDB", "PostgreSQL", "Redis", "Elasticsearch", "DynamoDB", "Cassandra", "Neo4j", "ClickHouse", "CockroachDB", "Supabase"],
          USECASE: ["real-time analytics", "e-commerce catalogs", "user session management", "content management", "IoT data ingestion", "social graphs", "search applications", "event sourcing", "geospatial queries", "multi-tenant SaaS"],
          RECOMMENDATION1: ["pre-aggregating frequently accessed metrics", "caching hot data in memory", "using read replicas for query distribution", "implementing data archiving policies", "leveraging change data capture"],
          RECOMMENDATION2: ["setting appropriate TTLs for ephemeral data", "using bulk operations for batch processing", "implementing connection pooling", "monitoring query performance dashboards", "enabling automated backups"]
        }
      }
    ]
  },
  devops: {
    items: [
      {
        title: "{TOOL} for {PRACTICE} in DevOps",
        content: "{TOOL} is a leading solution for implementing {PRACTICE} in DevOps workflows. It enables teams to automate {TASK1} and {TASK2}, reducing manual effort and human error. Getting started with {TOOL} involves {SETUP}, followed by configuring integrations with your existing tool chain. Teams adopting {TOOL} for {PRACTICE} typically see improvements in deployment frequency, lead time for changes, and mean time to recovery. Best practices include infrastructure as code, immutable deployments, and comprehensive monitoring.",
        tags: [["devops", "{TOOL}"], ["{PRACTICE}", "automation"], ["CI/CD", "infrastructure"]],
        vars: {
          TOOL: ["Terraform", "Ansible", "GitHub Actions", "ArgoCD", "Prometheus", "Grafana", "Helm", "Pulumi", "Crossplane", "Backstage", "Vault", "Consul", "Istio", "Linkerd", "Flagger"],
          PRACTICE: ["infrastructure provisioning", "configuration management", "continuous deployment", "GitOps", "monitoring and alerting", "observability", "service mesh", "secrets management", "progressive delivery", "developer experience"],
          TASK1: ["resource provisioning", "configuration drift detection", "pipeline execution", "deployment rollbacks", "metric collection", "dashboard creation", "chart management", "infrastructure definition", "resource reconciliation", "service catalog management"],
          TASK2: ["compliance checking", "environment replication", "artifact management", "canary releases", "alert routing", "log aggregation", "dependency management", "secret rotation", "traffic shifting", "self-service operations"],
          SETUP: ["installing the CLI and configuring credentials", "defining your infrastructure in declarative files", "creating workflow YAML configurations", "setting up the GitOps repository structure", "deploying the monitoring stack"]
        }
      },
      {
        title: "Container {TOPIC} with {TOOL}",
        content: "Container {TOPIC} is a critical aspect of modern DevOps practices, and {TOOL} provides robust capabilities for managing it at scale. Effective container {TOPIC} involves {ASPECT1} and {ASPECT2}. {TOOL} simplifies these tasks through declarative configuration and automation. Common challenges include resource optimization, security scanning, and multi-environment consistency. Organizations should establish container {TOPIC} standards and automate enforcement through CI/CD pipelines. Regular audits and updates ensure long-term reliability.",
        tags: [["containers", "{TOOL}"], ["{TOPIC}", "devops"], ["cloud native", "orchestration"]],
        vars: {
          TOOL: ["Docker", "Kubernetes", "Podman", "containerd", "Buildah", "Skaffold", "Tilt", "Garden", "ko", "Buildpacks"],
          TOPIC: ["image optimization", "security scanning", "networking", "storage management", "resource limits", "health checking", "logging", "scaling", "registry management", "multi-stage builds"],
          ASPECT1: ["reducing image size through multi-stage builds", "scanning for CVEs in base images", "configuring network policies", "provisioning persistent volumes", "setting CPU and memory limits", "implementing readiness and liveness probes"],
          ASPECT2: ["automating image rebuilds on dependency updates", "enforcing image signing and verification", "implementing service discovery", "managing storage classes and access modes", "configuring horizontal pod autoscalers", "centralizing log collection and forwarding"]
        }
      }
    ]
  },
  security: {
    items: [
      {
        title: "{ATTACK} Prevention in {PLATFORM} Applications",
        content: "{ATTACK} is one of the most common security vulnerabilities in {PLATFORM} applications, consistently appearing in the OWASP Top 10. Attackers exploit {ATTACK} by {EXPLOIT_METHOD}. Prevention strategies include {DEFENSE1} and {DEFENSE2}. Developers should implement defense-in-depth, combining multiple security layers rather than relying on a single control. Regular security testing, including static analysis (SAST) and dynamic analysis (DAST), helps identify {ATTACK} vulnerabilities before they reach production. Security training for development teams is crucial for building a security-first culture.",
        tags: [["security", "{ATTACK}"], ["{PLATFORM}", "vulnerabilities"], ["OWASP", "application security"]],
        vars: {
          ATTACK: ["SQL Injection", "Cross-Site Scripting (XSS)", "Cross-Site Request Forgery (CSRF)", "Server-Side Request Forgery (SSRF)", "XML External Entity (XXE)", "Insecure Deserialization", "Broken Authentication", "Security Misconfiguration", "Insufficient Logging", "Mass Assignment"],
          PLATFORM: ["web", "mobile", "API", "cloud-native", "microservices", "serverless", "embedded", "IoT", "desktop", "blockchain"],
          EXPLOIT_METHOD: ["injecting malicious code into user input fields", "crafting payloads that bypass input validation", "manipulating HTTP headers and cookies", "leveraging misconfigurations in authentication flows", "exploiting trust relationships between services"],
          DEFENSE1: ["parameterized queries and prepared statements", "content security policy headers", "anti-CSRF tokens and SameSite cookies", "URL allowlisting and request validation", "disabling external entity processing", "input validation and type checking"],
          DEFENSE2: ["output encoding and sanitization", "HTTP-only and secure cookie flags", "origin verification and referrer checks", "network segmentation and egress filtering", "using safe deserialization libraries", "implementing rate limiting and account lockout"]
        }
      },
      {
        title: "{SECAREA} Security Best Practices for {CONTEXT}",
        content: "Implementing robust {SECAREA} security in {CONTEXT} requires a comprehensive approach covering people, processes, and technology. Key best practices include {PRACTICE1} and {PRACTICE2}. Organizations should conduct regular risk assessments to identify gaps in their {SECAREA} security posture. Compliance frameworks like SOC 2, ISO 27001, and NIST Cybersecurity Framework provide structured guidance. Incident response plans should be tested regularly through tabletop exercises and simulated breaches. Automation plays a key role in maintaining consistent security across {CONTEXT} environments.",
        tags: [["security", "{SECAREA}"], ["{CONTEXT}", "compliance"], ["cybersecurity", "governance"]],
        vars: {
          SECAREA: ["network", "data", "identity", "cloud", "endpoint", "API", "supply chain", "email", "container", "zero trust"],
          CONTEXT: ["enterprise environments", "cloud-native applications", "remote workforces", "multi-cloud deployments", "startup organizations", "regulated industries", "open-source projects", "SaaS platforms", "edge computing", "hybrid infrastructure"],
          PRACTICE1: ["implementing least privilege access controls", "encrypting data at rest and in transit", "multi-factor authentication for all accounts", "network segmentation and micro-segmentation", "continuous vulnerability scanning"],
          PRACTICE2: ["maintaining an asset inventory and classification", "regular penetration testing and red team exercises", "automated compliance monitoring and reporting", "security awareness training for all employees", "implementing SIEM for centralized log analysis"]
        }
      }
    ]
  },
  cloud: {
    items: [
      {
        title: "{SERVICE} on {PROVIDER}: {USECASE}",
        content: "{PROVIDER}'s {SERVICE} enables organizations to implement {USECASE} efficiently in the cloud. The service offers features like {FEATURE1} and {FEATURE2}, making it suitable for a wide range of workloads. Pricing is typically based on usage, with options for reserved capacity to optimize costs. When architecting with {SERVICE}, consider availability zones, data residency requirements, and disaster recovery strategies. Integration with other {PROVIDER} services creates a cohesive cloud ecosystem. Following the Well-Architected Framework ensures reliability, security, and cost efficiency.",
        tags: [["cloud", "{PROVIDER}"], ["{SERVICE}", "{USECASE}"], ["cloud architecture", "infrastructure"]],
        vars: {
          SERVICE: ["managed Kubernetes", "serverless functions", "managed database", "object storage", "CDN", "message queue", "container registry", "API gateway", "load balancer", "managed cache", "data warehouse", "ML platform"],
          PROVIDER: ["AWS", "Azure", "Google Cloud", "Oracle Cloud", "IBM Cloud", "DigitalOcean", "Linode", "Vultr", "Alibaba Cloud", "Cloudflare"],
          USECASE: ["auto-scaling web applications", "event-driven data processing", "globally distributed APIs", "media streaming", "real-time analytics", "machine learning inference", "batch processing", "multi-tenant SaaS", "disaster recovery", "edge computing"],
          FEATURE1: ["automatic scaling and load balancing", "built-in monitoring and logging", "managed encryption and key rotation", "multi-region replication", "serverless billing model", "native container support"],
          FEATURE2: ["IAM integration for fine-grained access control", "VPC networking and private endpoints", "automated backups and snapshots", "blue-green deployment support", "cost allocation tags and budgets", "compliance certifications and audit logging"]
        }
      }
    ]
  },
  "NLP": {
    items: [
      {
        title: "{NLPTASK} with {APPROACH} Models",
        content: "{NLPTASK} is a fundamental NLP task that involves {DESCRIPTION}. Modern approaches use {APPROACH} models, which have significantly improved accuracy compared to traditional methods. The pipeline typically includes text preprocessing (tokenization, normalization), feature extraction, and model inference. Evaluation metrics for {NLPTASK} include {METRIC1} and {METRIC2}. Pre-trained models from Hugging Face and other repositories provide excellent starting points, with fine-tuning on domain-specific data often yielding the best results.",
        tags: [["NLP", "{NLPTASK}"], ["{APPROACH}", "text processing"], ["natural language processing", "AI"]],
        vars: {
          NLPTASK: ["named entity recognition", "text summarization", "sentiment analysis", "text classification", "question answering", "machine translation", "relation extraction", "coreference resolution", "dependency parsing", "topic modeling", "text generation", "keyword extraction", "language detection", "paraphrase detection", "textual entailment"],
          APPROACH: ["transformer-based", "BERT-family", "GPT-family", "encoder-decoder", "sequence-to-sequence", "attention-based", "fine-tuned LLM", "few-shot prompted", "retrieval-augmented", "hybrid neural-symbolic"],
          DESCRIPTION: ["identifying and classifying named entities in text", "condensing long documents into shorter summaries", "determining the emotional tone of text", "assigning predefined labels to text documents", "extracting answers from context passages", "converting text between languages"],
          METRIC1: ["precision, recall, and F1 score", "ROUGE scores", "accuracy and macro-F1", "exact match and F1", "BLEU score", "perplexity"],
          METRIC2: ["confusion matrix analysis", "human evaluation scores", "BERTScore", "semantic similarity metrics", "latency and throughput", "token-level accuracy"]
        }
      }
    ]
  },
  frontend: {
    items: [
      {
        title: "{TOPIC} in {FRAMEWORK} Applications",
        content: "{TOPIC} is a critical aspect of building modern {FRAMEWORK} applications. Effective implementation of {TOPIC} involves {APPROACH1} and {APPROACH2}. {FRAMEWORK} provides built-in tools and patterns for handling {TOPIC}, including {TOOL1} and {TOOL2}. Performance optimization is key when implementing {TOPIC}, as it directly impacts user experience and Core Web Vitals. Testing {TOPIC} implementations should cover unit tests, integration tests, and end-to-end tests. The {FRAMEWORK} community provides excellent resources and libraries for {TOPIC} best practices.",
        tags: [["frontend", "{FRAMEWORK}"], ["{TOPIC}", "web development"], ["UI", "performance"]],
        vars: {
          FRAMEWORK: ["React", "Vue.js", "Angular", "Svelte", "Next.js", "Nuxt", "Remix", "Astro", "SolidJS", "Qwik"],
          TOPIC: ["state management", "routing", "form handling", "accessibility", "internationalization", "server-side rendering", "code splitting", "animation", "error boundaries", "data fetching", "component composition", "theming", "responsive design", "testing strategies", "performance optimization"],
          APPROACH1: ["centralizing application state in a predictable store", "implementing lazy loading for route-based code splitting", "using controlled components with validation", "following WAI-ARIA guidelines", "providing locale-aware formatting and translations"],
          APPROACH2: ["optimizing re-renders through memoization", "prefetching data for anticipated navigation", "debouncing user input for expensive operations", "keyboard navigation and screen reader support", "fallback content for slow connections"],
          TOOL1: ["Context API", "Vue Composition API", "RxJS observables", "stores", "React Query", "SWR"],
          TOOL2: ["Redux Toolkit", "Pinia", "NgRx", "Svelte stores", "TanStack Router", "Zustand"]
        }
      },
      {
        title: "CSS {CSSTOPIC} Techniques for {GOAL}",
        content: "Modern CSS {CSSTOPIC} techniques enable developers to achieve {GOAL} with minimal JavaScript. Key approaches include {TECHNIQUE1} and {TECHNIQUE2}. Browser support for these features has improved significantly, though progressive enhancement strategies ensure compatibility with older browsers. The CSS {CSSTOPIC} specification continues to evolve, with new proposals adding more powerful capabilities. Preprocessors like Sass and PostCSS can fill gaps in browser support while maintaining clean source code. Performance considerations include minimizing layout thrashing, reducing paint operations, and leveraging GPU acceleration.",
        tags: [["CSS", "{CSSTOPIC}"], ["frontend", "{GOAL}"], ["web design", "styling"]],
        vars: {
          CSSTOPIC: ["Grid Layout", "Flexbox", "Custom Properties", "Container Queries", "Cascade Layers", "Subgrid", "Scroll Snap", "View Transitions", "Anchor Positioning", "Nesting"],
          GOAL: ["responsive layouts", "dynamic theming", "complex grid systems", "component-scoped styling", "smooth page transitions", "adaptive typography", "scroll-driven animations", "fluid interfaces", "dashboard layouts", "magazine-style layouts"],
          TECHNIQUE1: ["using grid template areas for named regions", "combining flex-grow and flex-shrink for fluid sizing", "defining variables on :root for global theming", "using container queries for component-level responsiveness", "layering third-party and component styles"],
          TECHNIQUE2: ["auto-fill and auto-fit for dynamic column counts", "using gap property for consistent spacing", "updating variables via JavaScript for runtime themes", "combining container queries with has() for parent-aware styling", "ordering layers for specificity control"]
        }
      }
    ]
  },
  backend: {
    items: [
      {
        title: "{TOPIC} in {RUNTIME} Backend Services",
        content: "Implementing {TOPIC} in {RUNTIME} backend services requires careful consideration of performance, scalability, and reliability. {RUNTIME} provides several mechanisms for handling {TOPIC}, including {MECHANISM1} and {MECHANISM2}. Production-grade implementations should include error handling, logging, and monitoring. Common patterns include {PATTERN1} and {PATTERN2}. Load testing with tools like k6, JMeter, or Locust helps validate {TOPIC} implementations under realistic conditions. Documenting API contracts with OpenAPI/Swagger ensures consistency across teams.",
        tags: [["backend", "{RUNTIME}"], ["{TOPIC}", "server-side"], ["API", "services"]],
        vars: {
          RUNTIME: ["Node.js", "Python", "Java", "Go", "Rust", "C#", ".NET", "Ruby", "PHP", "Elixir"],
          TOPIC: ["request handling", "database connection pooling", "caching strategies", "message queue integration", "file upload processing", "rate limiting", "WebSocket connections", "background job processing", "health checking", "graceful shutdown", "request validation", "pagination", "search implementation", "webhook delivery", "event streaming"],
          MECHANISM1: ["middleware pipelines", "connection pool managers", "LRU cache implementations", "consumer group patterns", "streaming multipart parsers", "token bucket algorithms"],
          MECHANISM2: ["async/await patterns", "prepared statement caching", "cache invalidation strategies", "dead letter queues", "resumable upload protocols", "sliding window counters"],
          PATTERN1: ["circuit breaker for external service calls", "bulkhead isolation for resource protection", "retry with exponential backoff", "saga pattern for distributed transactions", "outbox pattern for reliable messaging"],
          PATTERN2: ["request deduplication with idempotency keys", "event sourcing for audit trails", "CQRS for read/write optimization", "sidecar pattern for cross-cutting concerns", "strangler fig for incremental migration"]
        }
      }
    ]
  },
  "data engineering": {
    items: [
      {
        title: "{TOPIC} in Modern Data {ARCH}",
        content: "Modern data {ARCH} architecture emphasizes {TOPIC} as a key capability for organizations dealing with growing data volumes and complexity. Implementing {TOPIC} effectively requires understanding data lifecycle management, quality assurance, and governance. Tools like {TOOL1} and {TOOL2} provide specialized support for {TOPIC} within data {ARCH} environments. Key metrics to track include data freshness, completeness, and accuracy. Teams should establish data contracts and SLAs to ensure {TOPIC} meets business requirements consistently.",
        tags: [["data engineering", "{ARCH}"], ["{TOPIC}", "data platform"], ["big data", "architecture"]],
        vars: {
          ARCH: ["lakehouse", "warehouse", "mesh", "fabric", "pipeline", "platform", "lake", "hub", "catalog", "marketplace"],
          TOPIC: ["data quality monitoring", "schema evolution", "data lineage tracking", "metadata management", "data cataloging", "access control", "cost optimization", "data freshness SLAs", "change data capture", "data observability"],
          TOOL1: ["Great Expectations", "Apache Atlas", "DataHub", "Amundsen", "OpenMetadata", "dbt", "Monte Carlo", "Soda", "Atlan", "Collibra"],
          TOOL2: ["Apache Iceberg", "Delta Lake", "Apache Hudi", "Debezium", "Airbyte", "Fivetran", "Stitch", "Meltano", "Singer", "Census"]
        }
      }
    ]
  },
  MLOps: {
    items: [
      {
        title: "{TOPIC} with {TOOL} for ML Teams",
        content: "ML teams leverage {TOOL} to implement {TOPIC}, a critical practice for managing the machine learning lifecycle in production. {TOPIC} addresses challenges like {CHALLENGE1} and {CHALLENGE2}. {TOOL} provides features including experiment tracking, model versioning, and automated pipeline orchestration. Integration with popular ML frameworks like TensorFlow, PyTorch, and scikit-learn ensures compatibility with existing workflows. A mature {TOPIC} practice enables faster iteration, more reliable deployments, and better collaboration between data scientists and engineers.",
        tags: [["MLOps", "{TOOL}"], ["{TOPIC}", "ML lifecycle"], ["machine learning", "production"]],
        vars: {
          TOOL: ["MLflow", "Kubeflow", "Weights & Biases", "DVC", "BentoML", "Seldon Core", "Vertex AI", "SageMaker", "ClearML", "Neptune"],
          TOPIC: ["experiment tracking", "model versioning", "feature stores", "model serving", "pipeline orchestration", "model monitoring", "A/B testing for models", "hyperparameter optimization", "data versioning", "model registry"],
          CHALLENGE1: ["reproducibility of training experiments", "managing multiple model versions", "feature consistency between training and serving", "scaling inference to production traffic", "coordinating multi-step training pipelines"],
          CHALLENGE2: ["detecting model performance degradation", "rolling back to previous model versions", "tracking data lineage for compliance", "managing GPU resources efficiently", "maintaining feature freshness in real-time"]
        }
      }
    ]
  },
  "programming languages": {
    items: [
      {
        title: "{FEATURE} in {LANG}: A Deep Dive",
        content: "{LANG} provides powerful support for {FEATURE}, enabling developers to write more expressive and maintainable code. Understanding {FEATURE} in {LANG} requires familiarity with {PREREQ1} and {PREREQ2}. Common use cases include {USECASE1} and {USECASE2}. While {FEATURE} adds complexity to the language, it provides significant benefits in terms of code reuse, type safety, and abstraction. The {LANG} community has established best practices and idioms for using {FEATURE} effectively, documented in style guides and language reference materials.",
        tags: [["{LANG}", "{FEATURE}"], ["programming", "language features"], ["development", "coding"]],
        vars: {
          LANG: ["Rust", "Go", "TypeScript", "Kotlin", "Swift", "Python", "Java", "C#", "Scala", "Elixir", "Haskell", "Zig", "Julia", "Ruby", "Dart"],
          FEATURE: ["generics", "pattern matching", "async/await", "type inference", "closures", "traits/interfaces", "error handling", "metaprogramming", "operator overloading", "type classes", "coroutines", "algebraic data types", "macros", "property delegation", "extension functions"],
          PREREQ1: ["the type system fundamentals", "basic control flow", "ownership and borrowing", "class hierarchies", "function composition"],
          PREREQ2: ["generic programming concepts", "concurrent programming basics", "memory management", "collection types", "module system"],
          USECASE1: ["building generic data structures", "writing concise conditional logic", "handling asynchronous operations", "reducing boilerplate code", "creating domain-specific abstractions"],
          USECASE2: ["implementing polymorphic algorithms", "parsing and transforming data", "managing concurrent workflows", "improving compile-time safety", "extending existing types with new behavior"]
        }
      }
    ]
  },
  mobile: {
    items: [
      {
        title: "{TOPIC} in {PLATFORM} Mobile Development",
        content: "{TOPIC} is a key consideration in {PLATFORM} mobile development, directly impacting user experience and app store ratings. Modern {PLATFORM} development offers several approaches to {TOPIC}, including {APPROACH1} and {APPROACH2}. Performance profiling tools specific to {PLATFORM} help developers identify and resolve issues related to {TOPIC}. The mobile ecosystem evolves rapidly, so staying current with {PLATFORM}'s latest APIs and best practices for {TOPIC} is essential. Cross-platform frameworks offer alternative approaches but may require platform-specific optimization.",
        tags: [["mobile", "{PLATFORM}"], ["{TOPIC}", "app development"], ["iOS", "Android"]],
        vars: {
          PLATFORM: ["iOS", "Android", "React Native", "Flutter", "Kotlin Multiplatform", "SwiftUI", "Jetpack Compose", ".NET MAUI", "Capacitor", "Xamarin"],
          TOPIC: ["offline data sync", "push notifications", "deep linking", "app performance", "accessibility", "state management", "navigation patterns", "local storage", "network handling", "background processing", "animations", "testing", "security", "analytics", "CI/CD"],
          APPROACH1: ["using local databases with sync adapters", "implementing rich notification payloads", "configuring universal links and app links", "lazy loading and image optimization", "following platform accessibility guidelines"],
          APPROACH2: ["conflict resolution strategies for offline edits", "notification channels and categories", "deferred deep link handling", "profiling CPU and memory usage", "testing with screen readers and accessibility scanners"]
        }
      }
    ]
  },
  healthcare: {
    items: [
      {
        title: "{TECH} Applications in {AREA} Healthcare",
        content: "{TECH} is revolutionizing {AREA} healthcare by enabling {BENEFIT1} and {BENEFIT2}. Healthcare organizations are adopting {TECH} to improve patient outcomes, reduce costs, and enhance clinical decision-making. Key challenges include regulatory compliance (HIPAA, GDPR), interoperability with existing health information systems, and ensuring patient data privacy. The {AREA} sector has seen significant ROI from {TECH} implementations, with early adopters reporting improved diagnostic accuracy and operational efficiency. Continued research and clinical validation are essential for broader adoption.",
        tags: [["healthcare", "{TECH}"], ["{AREA}", "health IT"], ["medical technology", "digital health"]],
        vars: {
          TECH: ["AI-powered diagnostics", "telemedicine platforms", "electronic health records", "wearable health monitors", "robotic surgery", "blockchain for health data", "natural language processing", "predictive analytics", "genomic analysis tools", "digital therapeutics"],
          AREA: ["radiology", "cardiology", "oncology", "mental health", "emergency medicine", "primary care", "pathology", "dermatology", "ophthalmology", "pediatrics"],
          BENEFIT1: ["early disease detection through pattern recognition", "remote patient monitoring and consultation", "streamlined clinical workflows", "continuous vital sign tracking", "precision surgical procedures"],
          BENEFIT2: ["personalized treatment recommendations", "reduced wait times and improved access", "comprehensive patient data integration", "proactive health intervention", "faster recovery times and reduced complications"]
        }
      }
    ]
  },
  fintech: {
    items: [
      {
        title: "{TECH} in {AREA} Financial Services",
        content: "{TECH} is transforming {AREA} in the financial services industry by enabling faster, more secure, and more efficient operations. Traditional {AREA} processes were manual, error-prone, and slow, but {TECH} introduces automation, real-time processing, and intelligent decision-making. Regulatory requirements including KYC, AML, and PCI DSS compliance must be carefully addressed. The fintech ecosystem continues to evolve with innovations in {TECH}, creating opportunities for both startups and established institutions to serve customers better.",
        tags: [["fintech", "{TECH}"], ["{AREA}", "financial services"], ["banking", "innovation"]],
        vars: {
          TECH: ["real-time payments", "AI fraud detection", "open banking APIs", "blockchain settlement", "robo-advisory", "embedded finance", "regtech automation", "alternative credit scoring", "decentralized finance", "smart contracts"],
          AREA: ["payment processing", "lending", "insurance", "wealth management", "compliance", "risk assessment", "customer onboarding", "cross-border transactions", "trade finance", "retail banking"]
        }
      }
    ]
  },
  testing: {
    items: [
      {
        title: "{TESTTYPE} Testing {TOPIC} with {TOOL}",
        content: "{TESTTYPE} testing is essential for ensuring software quality, and {TOOL} provides excellent support for {TOPIC}. Effective {TESTTYPE} tests should be fast, reliable, and maintainable, following the {PRINCIPLE} principle. Setting up {TOOL} for {TOPIC} involves configuring test runners, assertion libraries, and mock frameworks. Key practices include {PRACTICE1} and {PRACTICE2}. Test coverage metrics provide visibility into tested and untested code paths, but teams should focus on testing critical business logic rather than chasing 100% coverage. CI integration ensures tests run automatically on every commit.",
        tags: [["testing", "{TESTTYPE}"], ["{TOOL}", "quality assurance"], ["software quality", "test automation"]],
        vars: {
          TESTTYPE: ["unit", "integration", "end-to-end", "performance", "security", "accessibility", "visual regression", "contract", "mutation", "property-based"],
          TOOL: ["Jest", "Playwright", "Cypress", "pytest", "JUnit", "Vitest", "Testing Library", "k6", "Postman", "Selenium"],
          TOPIC: ["React component testing", "API endpoint validation", "database integration tests", "load testing scenarios", "authentication flows", "form submission handling", "microservice communication", "error handling paths", "data transformation logic", "UI interaction testing"],
          PRINCIPLE: ["AAA (Arrange-Act-Assert)", "given-when-then", "test isolation", "single responsibility", "deterministic outcomes"],
          PRACTICE1: ["using factories for test data generation", "mocking external dependencies", "running tests in parallel", "using fixtures for consistent state", "implementing custom matchers"],
          PRACTICE2: ["testing edge cases and error paths", "using snapshot testing judiciously", "implementing retry logic for flaky tests", "profiling test execution time", "organizing tests by feature or module"]
        }
      }
    ]
  },
  search: {
    items: [
      {
        title: "{SEARCHTYPE} Search Implementation with {TECH}",
        content: "{SEARCHTYPE} search enables users to find relevant information by {DESCRIPTION}. {TECH} provides powerful features for implementing {SEARCHTYPE} search, including {FEATURE1} and {FEATURE2}. Building an effective search system requires attention to indexing strategies, query parsing, and relevance ranking. Performance optimization techniques include caching frequent queries, using pagination, and implementing search-as-you-type with debouncing. Measuring search quality through metrics like precision, recall, MRR, and NDCG helps iterate on the search experience over time.",
        tags: [["search", "{SEARCHTYPE}"], ["{TECH}", "information retrieval"], ["search engine", "relevance"]],
        vars: {
          SEARCHTYPE: ["semantic", "full-text", "hybrid", "faceted", "geo-spatial", "autocomplete", "fuzzy", "multi-modal", "personalized", "federated"],
          TECH: ["Elasticsearch", "MongoDB Atlas Search", "Algolia", "MeiliSearch", "Typesense", "Pinecone", "Weaviate", "Qdrant", "Vespa", "Apache Solr"],
          DESCRIPTION: ["matching query intent with document meaning", "matching keywords across text fields", "combining keyword and vector search", "filtering results across multiple dimensions", "finding results near a location", "suggesting results as users type"],
          FEATURE1: ["vector similarity search", "inverted index with BM25 scoring", "hybrid scoring with RRF", "dynamic facet generation", "geo-distance filtering", "prefix matching and typo tolerance"],
          FEATURE2: ["query expansion and synonyms", "highlight and snippet generation", "custom ranking and boosting", "real-time index updates", "multi-language analysis", "relevance tuning and A/B testing"]
        }
      }
    ]
  },
  "project management": {
    items: [
      {
        title: "{TOPIC} for {TEAMTYPE} Engineering Teams",
        content: "Effective {TOPIC} is crucial for {TEAMTYPE} engineering teams to deliver high-quality software on time. {TOPIC} involves {ACTIVITY1} and {ACTIVITY2}. Teams that excel at {TOPIC} typically use a combination of tools, processes, and cultural practices. Key metrics include cycle time, throughput, and quality indicators. Regular retrospectives help teams identify and address bottlenecks in their {TOPIC} processes. Balancing speed with quality requires clear priorities, well-defined acceptance criteria, and effective communication across stakeholders.",
        tags: [["project management", "{TOPIC}"], ["{TEAMTYPE}", "team efficiency"], ["engineering management", "process"]],
        vars: {
          TOPIC: ["sprint planning", "technical debt management", "estimation", "prioritization", "incident management", "release planning", "capacity planning", "knowledge sharing", "onboarding", "code review processes"],
          TEAMTYPE: ["distributed", "cross-functional", "platform", "product", "infrastructure", "data", "security", "mobile", "full-stack", "SRE"],
          ACTIVITY1: ["breaking down epics into actionable stories", "cataloging and scoring technical debt items", "using story points or cycle time for estimation", "using frameworks like RICE or ICE for scoring", "establishing on-call rotations and escalation paths"],
          ACTIVITY2: ["defining clear acceptance criteria and DoD", "allocating dedicated time for debt reduction", "improving estimation accuracy through historical data", "communicating trade-offs to stakeholders", "conducting blameless post-mortems"]
        }
      }
    ]
  },
  sustainability: {
    items: [
      {
        title: "Green {TOPIC} in Software Engineering",
        content: "Green {TOPIC} focuses on reducing the environmental impact of software systems through thoughtful engineering practices. As data centers consume approximately 1-2% of global electricity, optimizing {TOPIC} can have a significant positive environmental impact. Strategies include {STRATEGY1} and {STRATEGY2}. Organizations are increasingly measuring their software carbon footprint using tools and frameworks that track energy consumption and emissions. Sustainable software engineering is becoming a competitive differentiator as customers and regulators prioritize environmental responsibility.",
        tags: [["sustainability", "green computing"], ["{TOPIC}", "environmental"], ["carbon footprint", "efficiency"]],
        vars: {
          TOPIC: ["computing", "cloud architecture", "data storage", "AI training", "CI/CD pipelines", "frontend performance", "database operations", "network communication", "testing infrastructure", "development workflows"],
          STRATEGY1: ["right-sizing compute resources to avoid overprovisioning", "choosing energy-efficient hardware and regions", "implementing aggressive caching to reduce computation", "using efficient algorithms and data structures", "consolidating workloads during off-peak hours"],
          STRATEGY2: ["leveraging serverless to eliminate idle resource consumption", "optimizing container images to reduce storage and transfer", "scheduling batch jobs during renewable energy availability", "minimizing data transfer across regions", "adopting carbon-aware computing practices"]
        }
      }
    ]
  },
  algorithms: {
    items: [
      {
        title: "{ALGO} Algorithm: {SUBTOPIC}",
        content: "The {ALGO} algorithm is a fundamental technique in computer science for solving {PROBLEM}. It operates with a time complexity of {TIMEC} and space complexity of {SPACEC}. The algorithm works by {MECHANISM}. Practical applications include {APP1} and {APP2}. Understanding {ALGO} is essential for technical interviews and for making informed design decisions in production systems. Variants and optimizations exist for specialized use cases, often trading space for time or vice versa.",
        tags: [["algorithms", "{ALGO}"], ["computer science", "data structures"], ["optimization", "complexity"]],
        vars: {
          ALGO: ["binary search", "quicksort", "Dijkstra's shortest path", "BFS/DFS", "dynamic programming", "merge sort", "A* search", "Bloom filter", "consistent hashing", "trie", "topological sort", "union-find", "KMP string matching", "segment tree", "skip list"],
          SUBTOPIC: ["implementation and optimization", "practical applications", "complexity analysis", "variants and extensions", "parallel implementations"],
          PROBLEM: ["searching sorted data efficiently", "sorting large collections", "finding optimal paths in graphs", "graph traversal and exploration", "optimization with overlapping subproblems", "divide-and-conquer sorting", "heuristic pathfinding", "probabilistic set membership", "distributed data partitioning", "prefix-based string lookup"],
          TIMEC: ["O(log n)", "O(n log n)", "O(V + E log V)", "O(V + E)", "varies by subproblem structure", "O(n log n)", "O(b^d)", "O(k)", "O(1) amortized", "O(m) where m is key length"],
          SPACEC: ["O(1)", "O(log n)", "O(V)", "O(V)", "O(n × m)", "O(n)", "O(b^d)", "O(m)", "O(n)", "O(alphabet × m)"],
          MECHANISM: ["repeatedly dividing the search space in half", "partitioning around a pivot element", "greedily selecting the minimum-cost vertex", "exploring vertices level by level or depth-first", "storing and reusing solutions to subproblems", "recursively merging sorted halves", "expanding the most promising node using a heuristic", "using multiple hash functions for membership testing", "mapping keys to positions on a hash ring", "linking characters in a tree structure for fast prefix lookup"],
          APP1: ["database index lookups", "sorting user-facing data", "GPS navigation systems", "web crawlers and social network analysis", "resource allocation and scheduling", "external sorting of large files", "game AI and robotics", "spell checkers and URL shorteners", "load balancing in distributed systems", "autocomplete and dictionary implementations"],
          APP2: ["binary search trees and skip lists", "in-memory sorting libraries", "network routing protocols", "dependency resolution in build tools", "text alignment and sequence matching", "merge-based external sort algorithms", "robot path planning", "network traffic filtering", "database sharding strategies", "IP routing and phone directories"]
        }
      }
    ]
  },
  design: {
    items: [
      {
        title: "{TOPIC} Principles in {CONTEXT}",
        content: "Applying {TOPIC} principles in {CONTEXT} leads to more intuitive and engaging user experiences. Key {TOPIC} concepts include {CONCEPT1} and {CONCEPT2}. Designers and developers should collaborate closely to ensure {TOPIC} principles are faithfully implemented in the final product. User research, including usability testing and A/B experiments, validates that {TOPIC} decisions achieve their intended goals. Design systems and component libraries help maintain consistency in {TOPIC} across large applications.",
        tags: [["design", "{TOPIC}"], ["{CONTEXT}", "UX"], ["user experience", "UI design"]],
        vars: {
          TOPIC: ["visual hierarchy", "information architecture", "interaction design", "color theory", "typography", "responsive design", "motion design", "accessibility design", "dark mode design", "design systems"],
          CONTEXT: ["SaaS dashboards", "mobile applications", "e-commerce platforms", "developer tools", "educational platforms", "healthcare portals", "social media apps", "productivity tools", "gaming interfaces", "enterprise software"],
          CONCEPT1: ["creating clear focal points to guide user attention", "organizing content in logical and findable structures", "providing meaningful feedback for user actions", "choosing color palettes that convey brand identity", "selecting typefaces that enhance readability"],
          CONCEPT2: ["using whitespace to reduce cognitive load", "implementing breadcrumbs and clear navigation paths", "designing micro-interactions that delight users", "ensuring sufficient contrast for accessibility", "establishing a typographic scale for visual harmony"]
        }
      }
    ]
  },
  mathematics: {
    items: [
      {
        title: "{MATHTOPIC} in Machine Learning Applications",
        content: "{MATHTOPIC} provides the mathematical foundation for many machine learning algorithms and techniques. Understanding {MATHTOPIC} is essential for data scientists and ML engineers who want to go beyond using libraries as black boxes. Key concepts include {CONCEPT1} and {CONCEPT2}. In practice, {MATHTOPIC} is used in {APPLICATION1} and {APPLICATION2}. While high-level ML frameworks abstract away much of the math, understanding the underlying {MATHTOPIC} helps with debugging, optimization, and developing novel approaches.",
        tags: [["mathematics", "{MATHTOPIC}"], ["machine learning", "theory"], ["data science", "foundations"]],
        vars: {
          MATHTOPIC: ["linear algebra", "probability theory", "calculus and optimization", "information theory", "graph theory", "statistics", "numerical methods", "topology", "category theory", "game theory"],
          CONCEPT1: ["matrix operations and decompositions", "Bayes' theorem and conditional probability", "gradient computation and chain rule", "entropy and mutual information", "graph traversal and connectivity", "hypothesis testing and confidence intervals"],
          CONCEPT2: ["eigenvalues and eigenvectors", "probability distributions and sampling", "convex optimization and constraint satisfaction", "KL divergence and cross-entropy", "spectral graph theory", "regression and correlation analysis"],
          APPLICATION1: ["neural network weight initialization and training", "Bayesian inference and probabilistic models", "backpropagation and gradient descent", "feature selection and dimensionality reduction", "knowledge graph reasoning and link prediction", "model evaluation and statistical significance"],
          APPLICATION2: ["PCA and dimensionality reduction", "Markov chain Monte Carlo sampling", "learning rate scheduling and second-order methods", "language model evaluation", "community detection and clustering", "experimental design and A/B test analysis"]
        }
      }
    ]
  }
};

// ────────────────────────────────────────────────────────────────────────────
// Deterministic pseudo-random using a simple seed (for reproducibility)
// ────────────────────────────────────────────────────────────────────────────
function rand() {
  return Math.random();
}
function pick(arr) {
  return arr[Math.floor(rand() * arr.length)];
}
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => rand() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

// ────────────────────────────────────────────────────────────────────────────
// Generate documents
// ────────────────────────────────────────────────────────────────────────────

// Extra qualifiers to add unique variation to titles
const TITLE_PREFIXES = [
  "", "", "", // weight toward no prefix
  "A Guide to ", "Practical ", "Advanced ", "Essential ", "Comprehensive ",
  "Introduction to ", "Modern ", "Real-World ", "Production-Ready ",
  "Hands-On ", "Enterprise-Grade ", "Beginner's Guide to ", "Expert-Level "
];

const TITLE_SUFFIXES = [
  "", "", "", // weight toward no suffix
  " (2024 Edition)", " (2025 Update)", " - Part 1", " - Part 2",
  " - A Practical Guide", " for Beginners", " for Production",
  " in Practice", " at Scale", " - Best Practices", " - Deep Dive",
  " - Complete Guide", " - Quick Reference", " Explained",
  " - Tips and Tricks", " Fundamentals", " for Teams",
  " in Enterprise Settings", " for Startups", " - Case Study",
  " - Lessons Learned", " - Common Pitfalls", " Workshop Notes"
];

const CONTENT_EXTRA = [
  " This topic continues to evolve as the industry matures and new innovations emerge.",
  " Industry surveys show growing adoption rates year over year, reflecting the importance of this area.",
  " Practitioners recommend hands-on experimentation to build intuition alongside theoretical understanding.",
  " Open-source communities have been instrumental in advancing the state of the art in this domain.",
  " Cross-functional collaboration between engineering, product, and business teams amplifies the impact.",
  " Benchmarks and case studies from real-world deployments provide valuable insights for implementation.",
  " The landscape is expected to shift significantly in the coming years as new standards and tools emerge.",
  " Peer learning through conferences, meetups, and online communities accelerates professional growth in this area.",
  " Cost-benefit analysis should guide adoption decisions, balancing upfront investment with long-term returns.",
  " Documentation and knowledge management are often overlooked but critical success factors.",
];

function generateDocument(category, template) {
  const vars = template.vars || {};
  const chosen = {};

  // Pick a random value for each variable
  for (const [key, values] of Object.entries(vars)) {
    chosen[key] = pick(values);
  }

  // Replace placeholders in title, content
  let title = template.title;
  let content = template.content;

  for (const [key, value] of Object.entries(chosen)) {
    const re = new RegExp(`\\{${key}\\}`, 'g');
    title = title.replace(re, value);
    content = content.replace(re, value);
  }

  // Add prefix/suffix variation to title for uniqueness
  const prefix = pick(TITLE_PREFIXES);
  const suffix = pick(TITLE_SUFFIXES);
  title = prefix + title + suffix;

  // Add extra sentence to content for variety
  content += pick(CONTENT_EXTRA);

  // Pick tags
  const tagSet = pick(template.tags);
  const resolvedTags = tagSet.map(t => {
    let tag = t;
    for (const [key, value] of Object.entries(chosen)) {
      tag = tag.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return tag;
  });

  // Add 1-2 extra relevant tags from variable values
  const extraTagCandidates = Object.values(chosen).filter(v => typeof v === 'string' && v.length < 40);
  const extras = pickN(extraTagCandidates, Math.floor(rand() * 2) + 1);
  const allTags = [...new Set([...resolvedTags, ...extras])];

  return {
    title,
    content,
    category,
    tags: allTags
  };
}

function generateDataset(count) {
  const documents = [];
  const categories = Object.keys(CATEGORIES);
  const seen = new Set();

  let attempts = 0;
  while (documents.length < count && attempts < count * 20) {
    attempts++;
    const category = pick(categories);
    const catDef = CATEGORIES[category];
    const template = pick(catDef.items);
    const doc = generateDocument(category, template);

    // Deduplicate by title
    if (!seen.has(doc.title)) {
      seen.add(doc.title);
      documents.push(doc);
    }
  }

  return documents;
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

console.log(`Generating ${TARGET_COUNT} documents...`);
const dataset = generateDataset(TARGET_COUNT);
console.log(`Generated ${dataset.length} unique documents`);

// Category distribution
const catCounts = {};
for (const doc of dataset) {
  catCounts[doc.category] = (catCounts[doc.category] || 0) + 1;
}
console.log('\nCategory distribution:');
for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${count}`);
}

// Write output
fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dataset, null, 2), 'utf8');
console.log(`\nDataset written to: ${OUTPUT_FILE}`);
console.log(`File size: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);
