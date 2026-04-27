import {
  CloudCog,
  Code2,
  Coffee,
  TerminalSquare,
} from "lucide-react";

export type LearningTopic = {
  id: string;
  label: string;
};

export type LearningResourceKind = "roadmap" | "docs" | "lab" | "reference" | "architecture";

export type LearningResource = {
  id: string;
  title: string;
  description: string;
  href: string;
  source: string;
  kind: LearningResourceKind;
};

export type LearningMilestone = {
  id: string;
  title: string;
  summary: string;
  topics: LearningTopic[];
};

export type LearningTrack = {
  id: string;
  title: string;
  shortLabel: string;
  description: string;
  icon: typeof Code2;
  accent: string;
  border: string;
  sourceUrl: string;
  sourceLabel: string;
  resources: LearningResource[];
  milestones: LearningMilestone[];
};

export const learningTracks: LearningTrack[] = [
  {
    id: "javascript",
    title: "JavaScript Developer",
    shortLabel: "JS",
    description:
      "Sciezka oparta o JavaScript Roadmap z roadmap.sh: od core jezyka przez DOM i async po tooling i budowe aplikacji.",
    icon: Code2,
    accent: "text-amber-300",
    border: "border-amber-500/20",
    sourceUrl: "https://roadmap.sh/javascript",
    sourceLabel: "roadmap.sh/javascript",
    resources: [
      {
        id: "js-roadmap",
        title: "Mapa calej sciezki",
        description: "Szybki przeglad tematow i luk, zanim wejdziesz w szczegoly.",
        href: "https://roadmap.sh/javascript",
        source: "roadmap.sh",
        kind: "roadmap",
      },
      {
        id: "mdn-js",
        title: "Core JavaScript od podstaw",
        description: "Najlepszy punkt startowy do skladni, DOM, eventow i pracy z przegladarka.",
        href: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting",
        source: "MDN",
        kind: "docs",
      },
      {
        id: "web-dev",
        title: "Web platform labs",
        description: "Krotkie kursy o HTML, CSS, JS, performance, accessibility i testowaniu.",
        href: "https://web.dev/learn",
        source: "web.dev",
        kind: "lab",
      },
      {
        id: "react-learn",
        title: "React mindset",
        description: "Oficjalny tor nauki komponentow, stanu i myslenia interfejsem.",
        href: "https://react.dev/learn",
        source: "React",
        kind: "docs",
      },
      {
        id: "node-learn",
        title: "Runtime i backend JS",
        description: "Node.js, npm, async, HTTP i diagnostyka od strony oficjalnych materialow.",
        href: "https://nodejs.org/learn",
        source: "Node.js",
        kind: "reference",
      },
    ],
    milestones: [
      {
        id: "js-core",
        title: "Core JavaScript",
        summary: "Fundamenty jezyka i skladni, bez ktorych reszta ekosystemu nie ma sensu.",
        topics: [
          { id: "syntax", label: "Skladnia, typy, zmienne i operatory" },
          { id: "control-flow", label: "Warunki, petle i podstawowe struktury sterujace" },
          { id: "functions", label: "Funkcje, parametry, scope i closures" },
          { id: "data-structures", label: "Array, Object, Map, Set i podstawowe operacje na danych" },
        ],
      },
      {
        id: "browser-web-apis",
        title: "Browser and Web APIs",
        summary: "To, co faktycznie sprawia, ze JS zyje w przegladarce.",
        topics: [
          { id: "dom", label: "DOM, selektory i manipulacja interfejsem" },
          { id: "events", label: "Eventy, bubbling, delegation i formularze" },
          { id: "fetch", label: "Fetch API, JSON i integracja z endpointami" },
          { id: "storage", label: "localStorage, sessionStorage i podstawy cache w przegladarce" },
        ],
      },
      {
        id: "async-modules",
        title: "Async and Language Depth",
        summary: "Nowoczesny JavaScript, ktory pojawia sie w realnym kodzie produkcyjnym.",
        topics: [
          { id: "promises", label: "Promises, async/await i obsluga bledow" },
          { id: "modules", label: "ES Modules, import/export i organizacja plikow" },
          { id: "oop", label: "Prototype chain, classes i this" },
          { id: "advanced-patterns", label: "Destructuring, spread/rest, optional chaining i immutability" },
        ],
      },
      {
        id: "tooling-quality",
        title: "Tooling and Quality",
        summary: "Rzeczy, ktore zamieniaja nauke jezyka w porzadny workflow deweloperski.",
        topics: [
          { id: "package-manager", label: "npm lub pnpm, skrypty i zarzadzanie paczkami" },
          { id: "bundling", label: "Vite, bundlery i podstawy build pipeline" },
          { id: "linting", label: "ESLint, Prettier i standard kodu" },
          { id: "testing", label: "Podstawy testow jednostkowych i integracyjnych" },
        ],
      },
      {
        id: "networking-for-apps",
        title: "Networking Fundamentals for Apps",
        summary: "Rozumienie, jak przegladarka, frontend i backend rozmawiaja ze soba w prawdziwej aplikacji.",
        topics: [
          { id: "http-basics", label: "HTTP, HTTPS, metody, status codes i headers" },
          { id: "dns-tls", label: "DNS, TLS, domeny i co dzieje sie zanim strona sie zaladuje" },
          { id: "cookies-sessions", label: "Cookies, sessions, JWT i podstawy utrzymywania sesji" },
          { id: "cors-cache", label: "CORS, cache control, browser cache i podstawy CDN" },
        ],
      },
      {
        id: "application-architecture",
        title: "Application Architecture",
        summary: "Tematy, ktore sprawiaja, ze aplikacja daje sie rozwijac, testowac i utrzymywac.",
        topics: [
          { id: "frontend-architecture", label: "Podzial na komponenty, feature folders i odpowiedzialnosci modulow" },
          { id: "data-flow", label: "Data flow, server state, client state i granice miedzy nimi" },
          { id: "api-contracts", label: "Projektowanie kontraktow API, walidacja danych i obsluga bledow" },
          { id: "observability", label: "Logowanie, monitoring frontendu i diagnozowanie problemow produkcyjnych" },
        ],
      },
      {
        id: "cloud-hosting-basics",
        title: "Cloud and Hosting Basics",
        summary: "Podstawy tego, jak aplikacja zyje poza laptopem developera.",
        topics: [
          { id: "hosting-models", label: "Static hosting, SSR, serverless i kontenery - kiedy co wybrac" },
          { id: "managed-services", label: "Managed bazy danych, object storage i sekrety w chmurze" },
          { id: "cdn-edge", label: "CDN, edge caching i dostarczanie assetow na produkcji" },
          { id: "cloud-deploy", label: "Proces deploymentu na Vercel, AWS albo innym cloud providerze" },
        ],
      },
      {
        id: "app-building",
        title: "Building Real Apps",
        summary: "Moment, w ktorym JS przestaje byc tylko jezykiem, a staje sie narzedziem do tworzenia produktow.",
        topics: [
          { id: "framework", label: "React albo inny framework do UI" },
          { id: "routing-state", label: "Routing, state management i struktura aplikacji" },
          { id: "auth-api", label: "Autoryzacja, formularze i praca z API" },
          { id: "deployment", label: "Deployment, env vars i debugowanie produkcyjne" },
        ],
      },
    ],
  },
  {
    id: "java",
    title: "Java Developer",
    shortLabel: "Java",
    description:
      "Sciezka inspirowana Java Roadmap z roadmap.sh: core language, JVM, backend, bazy danych i engineering practices.",
    icon: Coffee,
    accent: "text-sky-300",
    border: "border-sky-500/20",
    sourceUrl: "https://roadmap.sh/java",
    sourceLabel: "roadmap.sh/java",
    resources: [
      {
        id: "java-roadmap",
        title: "Mapa calej sciezki",
        description: "Widok od podstaw jezyka po backend, bazy danych i praktyki engineeringowe.",
        href: "https://roadmap.sh/java",
        source: "roadmap.sh",
        kind: "roadmap",
      },
      {
        id: "dev-java",
        title: "Java language track",
        description: "Oficjalne lekcje o skladni, OOP, kolekcjach, strumieniach i nowoczesnej Javie.",
        href: "https://dev.java/learn/",
        source: "Dev.java",
        kind: "docs",
      },
      {
        id: "oracle-java-docs",
        title: "Java SE reference",
        description: "Dokumentacja JDK, API i wersji Javy, gdy chcesz sprawdzic zrodlo prawdy.",
        href: "https://docs.oracle.com/en/java/javase/",
        source: "Oracle",
        kind: "reference",
      },
      {
        id: "spring-guides",
        title: "Spring hands-on guides",
        description: "Male, praktyczne projekty do REST API, danych, security i deploymentu.",
        href: "https://spring.io/guides/",
        source: "Spring",
        kind: "lab",
      },
      {
        id: "spring-boot-docs",
        title: "Spring Boot production docs",
        description: "Konfiguracja, starters, testing, observability i produkcyjny backend.",
        href: "https://docs.spring.io/spring-boot/",
        source: "Spring Docs",
        kind: "architecture",
      },
    ],
    milestones: [
      {
        id: "java-basics",
        title: "Java Foundations",
        summary: "Podstawy skladni i modelu obiektowego, ktore sa rdzeniem calego stosu.",
        topics: [
          { id: "java-syntax", label: "Skladnia, typy, klasy i metody" },
          { id: "oop", label: "OOP: dziedziczenie, polimorfizm i enkapsulacja" },
          { id: "collections", label: "Collections Framework i generyki" },
          { id: "exceptions", label: "Wyjatki, walidacja i obsluga bledow" },
        ],
      },
      {
        id: "jvm-tooling",
        title: "JVM and Tooling",
        summary: "To, co odroznia napisanie programu od efektywnej pracy w ekosystemie Javy.",
        topics: [
          { id: "jvm", label: "JDK, JRE, JVM i cykl uruchamiania aplikacji" },
          { id: "build-tools", label: "Maven lub Gradle" },
          { id: "debugging", label: "Debugging w IntelliJ i podstawy profilingu" },
          { id: "io", label: "I/O, pliki i serializacja danych" },
        ],
      },
      {
        id: "modern-java",
        title: "Modern Java",
        summary: "Nowoczesne funkcje jezyka potrzebne w codziennym backendzie.",
        topics: [
          { id: "streams", label: "Streams, lambdy i API funkcyjne" },
          { id: "concurrency", label: "Watki, executory i concurrency basics" },
          { id: "memory", label: "Garbage collection i podstawy zarzadzania pamiecia" },
          { id: "best-practices", label: "Clean code, SOLID i organizacja warstw aplikacji" },
        ],
      },
      {
        id: "backend-networking",
        title: "Networking and Web Fundamentals",
        summary: "Backend ma sens dopiero wtedy, gdy rozumiesz jak przyjmuje, przetwarza i odsyla ruch.",
        topics: [
          { id: "http-rest", label: "HTTP, REST, metody, status codes i semantyka endpointow" },
          { id: "tcp-dns-tls", label: "TCP/IP, DNS, TLS i podstawy komunikacji klient-serwer" },
          { id: "auth-session", label: "Sessions, JWT, cookies i podstawy autoryzacji" },
          { id: "reverse-proxy", label: "Reverse proxy, load balancer i ruch miedzy uslugami" },
        ],
      },
      {
        id: "spring-backend",
        title: "Backend with Spring",
        summary: "Najbardziej praktyczna czesc dla pracy komercyjnej w Javie.",
        topics: [
          { id: "spring-boot", label: "Spring Boot i struktura projektu" },
          { id: "rest-api", label: "REST API, kontrolery, DTO i walidacja" },
          { id: "security", label: "Spring Security i podstawy auth" },
          { id: "testing", label: "Testy z JUnit i testy integracyjne" },
        ],
      },
      {
        id: "data-delivery",
        title: "Data and Delivery",
        summary: "Bazy danych i wdrozenie aplikacji w realnym srodowisku.",
        topics: [
          { id: "sql", label: "SQL, modelowanie danych i relacje" },
          { id: "jpa", label: "JPA, Hibernate i migracje" },
          { id: "docker", label: "Docker i uruchamianie serwisu poza IDE" },
          { id: "cicd-monitoring", label: "CI/CD, logowanie i monitoring aplikacji" },
        ],
      },
      {
        id: "system-architecture",
        title: "Application and System Architecture",
        summary: "Warstwa, ktora pozwala przejsc od jednego endpointu do dobrze zaprojektowanego systemu.",
        topics: [
          { id: "layered-architecture", label: "Layered architecture, separacja odpowiedzialnosci i boundaries" },
          { id: "domain-design", label: "Encje, use case'y, serwisy domenowe i modelowanie biznesowe" },
          { id: "async-communication", label: "Komunikacja synchroniczna vs asynchroniczna, kolejki i eventy" },
          { id: "scaling-resilience", label: "Skalowanie, idempotencja, retry, timeouty i odporne integracje" },
        ],
      },
      {
        id: "cloud-backend-basics",
        title: "Cloud Backend Basics",
        summary: "Tematy potrzebne, zeby backend sensownie wdrozyc i utrzymac w chmurze.",
        topics: [
          { id: "compute-models", label: "VM, containers, PaaS i serverless functions" },
          { id: "managed-data", label: "Managed databases, cache i kolejki jako uslugi" },
          { id: "cloud-config", label: "Sekrety, env vars, konfiguracja srodowisk i rotacja kluczy" },
          { id: "cloud-observability-backend", label: "Monitoring, tracing i alerty dla backendu w chmurze" },
        ],
      },
    ],
  },
  {
    id: "devops",
    title: "DevOps",
    shortLabel: "DevOps",
    description:
      "Sciezka wzorowana na DevOps Beginner z roadmap.sh: Linux, sieci, automatyzacja, kontenery, cloud i obserwowalnosc.",
    icon: CloudCog,
    accent: "text-emerald-300",
    border: "border-emerald-500/20",
    sourceUrl: "https://roadmap.sh/devops-beginner",
    sourceLabel: "roadmap.sh/devops-beginner",
    resources: [
      {
        id: "devops-roadmap",
        title: "Mapa calej sciezki",
        description: "Kolejnosc tematow od Linuxa i sieci po CI/CD, kontenery i cloud.",
        href: "https://roadmap.sh/devops-beginner",
        source: "roadmap.sh",
        kind: "roadmap",
      },
      {
        id: "docker-get-started",
        title: "Docker od zera",
        description: "Oficjalne cwiczenia z obrazami, kontenerami, Compose i lokalnym runtime.",
        href: "https://docs.docker.com/get-started/",
        source: "Docker Docs",
        kind: "lab",
      },
      {
        id: "kubernetes-basics",
        title: "Kubernetes basics",
        description: "Interaktywny tor o pods, deployments, services i skalowaniu aplikacji.",
        href: "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
        source: "Kubernetes",
        kind: "lab",
      },
      {
        id: "terraform-docs",
        title: "Infrastructure as Code",
        description: "Terraform language, providers, state i workflow provisioningowy.",
        href: "https://developer.hashicorp.com/terraform/docs",
        source: "HashiCorp",
        kind: "docs",
      },
      {
        id: "aws-well-architected",
        title: "Cloud architecture lens",
        description: "Decyzje o reliability, security, cost, performance i operations w cloudzie.",
        href: "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html",
        source: "AWS",
        kind: "architecture",
      },
    ],
    milestones: [
      {
        id: "linux-networking",
        title: "Linux and Networking Base",
        summary: "Bez tego DevOps zamienia sie w klikanie bez rozumienia systemu.",
        topics: [
          { id: "linux-cli", label: "CLI, pliki, uprawnienia i procesy" },
          { id: "networking", label: "DNS, HTTP/HTTPS, TCP/IP i podstawy routingu" },
          { id: "ssh", label: "SSH, zdalne logowanie i bezpieczny dostep" },
          { id: "users-groups", label: "Uzytkownicy, grupy i hardening podstawowy" },
        ],
      },
      {
        id: "automation-git",
        title: "Automation and Version Control",
        summary: "Budowanie nawyku automatyzacji i pracy na kodzie infrastrukturalnym.",
        topics: [
          { id: "shell", label: "Shell scripting i proste automaty" },
          { id: "git", label: "Git workflow i repozytoria konfiguracji" },
          { id: "config-management", label: "Ansible albo podobne narzedzie konfiguracji" },
          { id: "secrets", label: "Sekrety, env vars i podstawy bezpiecznego storage" },
        ],
      },
      {
        id: "containers",
        title: "Containers and Runtime",
        summary: "Najczestsza warstwa uruchomieniowa nowoczesnych systemow.",
        topics: [
          { id: "docker", label: "Docker, obrazy, kontenery i registry" },
          { id: "compose", label: "Docker Compose i uruchamianie wielu uslug" },
          { id: "k8s-basics", label: "Kubernetes basics: pods, deployments, services" },
          { id: "helm", label: "Helm albo inny sposob pakowania deploymentow" },
        ],
      },
      {
        id: "cicd-iac",
        title: "CI/CD and Infrastructure as Code",
        summary: "Moment, w ktorym deployment staje sie przewidywalny i powtarzalny.",
        topics: [
          { id: "pipelines", label: "GitHub Actions, GitLab CI lub inne pipeline'y" },
          { id: "terraform", label: "Terraform i provisioning infrastruktury" },
          { id: "release-strategies", label: "Blue-green, rolling i rollback strategies" },
          { id: "artifact-flow", label: "Build artefaktow, tagging i promotion flow" },
        ],
      },
      {
        id: "cloud-observability",
        title: "Cloud and Observability",
        summary: "Warstwa, w ktorej system trzeba nie tylko postawic, ale tez utrzymac.",
        topics: [
          { id: "cloud", label: "AWS, GCP albo Azure fundamentals" },
          { id: "monitoring", label: "Monitoring, metryki i alerting" },
          { id: "logging", label: "Centralne logi i podstawy trace'ow" },
          { id: "security", label: "IAM, backupy, least privilege i podstawy security" },
        ],
      },
      {
        id: "platform-architecture",
        title: "Platform and Delivery Architecture",
        summary: "Rozumienie, jak warstwa platformowa wspiera prawdziwe aplikacje i ich zespoly.",
        topics: [
          { id: "reverse-proxy-edge", label: "Nginx, reverse proxy, TLS termination i traffic flow" },
          { id: "service-communication", label: "Service discovery, komunikacja miedzy uslugami i podstawy mesh thinking" },
          { id: "reliability", label: "Health checks, autoscaling, rate limiting i odporne rollouty" },
          { id: "cost-tradeoffs", label: "Koszty, wydajnosc i trade-offy architektoniczne na platformie" },
        ],
      },
    ],
  },
  {
    id: "linux",
    title: "Linux",
    shortLabel: "Linux",
    description:
      "Sciezka bazujaca na Linux Roadmap z roadmap.sh: command line, procesy, siec, pakiety i automatyzacja.",
    icon: TerminalSquare,
    accent: "text-violet-300",
    border: "border-violet-500/20",
    sourceUrl: "https://roadmap.sh/linux",
    sourceLabel: "roadmap.sh/linux",
    resources: [
      {
        id: "linux-roadmap",
        title: "Mapa calej sciezki",
        description: "Porzadkuje terminal, procesy, siec, storage i administracje systemem.",
        href: "https://roadmap.sh/linux",
        source: "roadmap.sh",
        kind: "roadmap",
      },
      {
        id: "linux-man-pages",
        title: "Man pages jako kompas",
        description: "Referencja komend, syscalls, bibliotek i konfiguracji w stylu source of truth.",
        href: "https://man7.org/linux/man-pages/",
        source: "man7.org",
        kind: "reference",
      },
      {
        id: "bash-manual",
        title: "Bash bez magii",
        description: "Oficjalny manual do shell'a, expansions, pipes, redirection i skryptow.",
        href: "https://www.gnu.org/software/bash/manual/bash.html",
        source: "GNU",
        kind: "docs",
      },
      {
        id: "openssh-manual",
        title: "SSH i bezpieczny dostep",
        description: "Manuale OpenSSH do kluczy, konfiguracji klienta, serwera i tunelowania.",
        href: "https://www.openssh.org/manual.html",
        source: "OpenSSH",
        kind: "reference",
      },
      {
        id: "kernel-docs",
        title: "Linux pod maska",
        description: "Dokumentacja kernela, userspace API, administracja i narzedzia systemowe.",
        href: "https://docs.kernel.org/",
        source: "Kernel Docs",
        kind: "architecture",
      },
    ],
    milestones: [
      {
        id: "command-line",
        title: "Command Line Basics",
        summary: "Swoboda pracy w terminalu i rozumienie struktury systemu.",
        topics: [
          { id: "navigation", label: "Poruszanie sie po filesystemie i podstawowe komendy" },
          { id: "files", label: "Tworzenie, kopiowanie i wyszukiwanie plikow" },
          { id: "permissions", label: "chmod, chown i model uprawnien" },
          { id: "man-help", label: "man, help i czytanie dokumentacji systemowej" },
        ],
      },
      {
        id: "text-shell",
        title: "Shell and Text Processing",
        summary: "Podstawa wydajnej pracy administratorskiej i developerskiej.",
        topics: [
          { id: "pipes", label: "Pipes, redirection i laczenie polecen" },
          { id: "grep-sed-awk", label: "grep, sed, awk i filtrowanie outputu" },
          { id: "environment", label: "Zmienne srodowiskowe i konfiguracja shell'a" },
          { id: "bash-basics", label: "Podstawy skryptow bash" },
        ],
      },
      {
        id: "processes-services",
        title: "Processes and Services",
        summary: "Rozumienie, co w systemie dziala, kiedy i dlaczego.",
        topics: [
          { id: "processes", label: "ps, top, htop, kill i zarzadzanie procesami" },
          { id: "systemd", label: "systemd, services i journalctl" },
          { id: "cron", label: "cron i harmonogram zadan" },
          { id: "logs", label: "Logi systemowe i debugowanie problemow" },
        ],
      },
      {
        id: "networking-storage",
        title: "Networking and Storage",
        summary: "Warstwa potrzebna do pracy na serwerach i w srodowiskach produkcyjnych.",
        topics: [
          { id: "network-tools", label: "ip, ss, ping, curl, traceroute i podstawowe narzedzia sieciowe" },
          { id: "dns-http", label: "DNS, HTTP i rozumienie przeplywu ruchu" },
          { id: "disks", label: "Dyski, partycje, mounty i filesystem hierarchy" },
          { id: "ssh-scp", label: "SSH, SCP i podstawy transferu plikow" },
        ],
      },
      {
        id: "packages-automation",
        title: "Packages and Automation",
        summary: "Dzieki temu Linux staje sie narzedziem codziennej pracy, a nie tylko systemem do obslugi.",
        topics: [
          { id: "package-managers", label: "apt, dnf albo pacman i zarzadzanie pakietami" },
          { id: "build-from-source", label: "Instalacja narzedzi i podstawy kompilacji" },
          { id: "shell-automation", label: "Automatyzacja rutynowych zadan skryptami" },
          { id: "server-basics", label: "Podstawy konfiguracji prostego serwera Linux" },
        ],
      },
      {
        id: "linux-in-cloud",
        title: "Linux in Cloud Environments",
        summary: "Praktyczne rozumienie Linuxa tak, jak spotyka sie go na serwerach i instancjach cloudowych.",
        topics: [
          { id: "vm-basics", label: "Instancje VM, obrazy systemowe i bootstrap serwera" },
          { id: "ssh-hardening", label: "SSH keys, podstawy hardeningu i bezpieczny dostep zdalny" },
          { id: "system-observability", label: "Logi, metryki i diagnozowanie problemow na zdalnym serwerze" },
          { id: "deployment-basics", label: "Deploy aplikacji na Linux serverze i podstawy rollbacku" },
        ],
      },
    ],
  },
];
