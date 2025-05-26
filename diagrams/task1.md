graph TB
%% Project Root
subgraph "PHA-v2 Project Structure"

        %% File System Structure
        subgraph "File System"
            ROOT[pha-v2/]

            %% Source Code
            SRC[src/]
            APP[app/]
            LAYOUT[layout.tsx]
            PAGE[page.tsx]
            GLOBALS[globals.css]

            %% Configuration Files
            PKG[package.json]
            NEXT_CONFIG[next.config.js]
            TS_CONFIG[tsconfig.json]
            TAILWIND[tailwind.config.js]
            POSTCSS[postcss.config.js]
            ESLINT[.eslintrc.json]

            %% Task Management
            TASKS_DIR[tasks/]
            TASKS_JSON[tasks.json]
            TASK_FILES[task_001.txt...task_015.txt]

            %% Scripts & Config
            SCRIPTS[scripts/]
            PRD[prd.txt]
            COMPLEXITY[task-complexity-report.json]
            TM_CONFIG[.taskmasterconfig]

            %% Build & Dependencies
            NEXT_BUILD[.next/]
            NODE_MODULES[node_modules/]
            VENV[.venv/]

            ROOT --> SRC
            ROOT --> PKG
            ROOT --> NEXT_CONFIG
            ROOT --> TS_CONFIG
            ROOT --> TAILWIND
            ROOT --> POSTCSS
            ROOT --> ESLINT
            ROOT --> TASKS_DIR
            ROOT --> SCRIPTS
            ROOT --> TM_CONFIG
            ROOT --> NEXT_BUILD
            ROOT --> NODE_MODULES
            ROOT --> VENV

            SRC --> APP
            APP --> LAYOUT
            APP --> PAGE
            APP --> GLOBALS

            TASKS_DIR --> TASKS_JSON
            TASKS_DIR --> TASK_FILES

            SCRIPTS --> PRD
            SCRIPTS --> COMPLEXITY
        end

        %% Technology Stack
        subgraph "Technology Stack"
            NEXTJS[Next.js 15.3.2<br/>App Router]
            REACT[React 19.0.0]
            TYPESCRIPT[TypeScript 5.7.3]
            TAILWINDCSS[Tailwind CSS 3.4.17]
            ESLINT_TECH[ESLint 9.17.0]
            TASKMASTER[Task Master AI]

            NEXTJS --> REACT
            NEXTJS --> TYPESCRIPT
            NEXTJS --> TAILWINDCSS
            NEXTJS --> ESLINT_TECH
        end

        %% Task Dependencies Flow
        subgraph "Task Dependencies"
            T1[Task 1: Setup Project<br/>Repository & Architecture]
            T2[Task 2: User Authentication<br/>with Supabase]
            T3[Task 3: Database Schema<br/>Design & Implementation]
            T4[Task 4: Core Survey<br/>Form Components]
            T5[Task 5: Dynamic Report<br/>Generation]
            T6[Task 6: Chiropractor<br/>Dashboard]
            T7[Task 7: Email Service<br/>Integration]
            T8[Task 8: Analytics &<br/>Reporting Module]
            T9[Task 9: Social Media<br/>Sharing & Viral Tracking]
            T10[Task 10: Content Library<br/>& Template Engine]
            T11[Task 11: Performance<br/>Optimization]
            T12[Task 12: Security &<br/>Compliance]
            T13[Task 13: Tablet &<br/>Offline Experience]
            T14[Task 14: Payment<br/>Processing]
            T15[Task 15: Mobile App<br/>Preparation]

            %% Dependencies
            T1 --> T2
            T1 --> T3
            T1 --> T4
            T1 --> T11
            T2 --> T6
            T2 --> T12
            T2 --> T14
            T3 --> T5
            T3 --> T6
            T3 --> T7
            T3 --> T8
            T3 --> T12
            T3 --> T14
            T4 --> T5
            T4 --> T13
            T5 --> T9
            T6 --> T7
            T6 --> T8
            T6 --> T9
            T6 --> T10
            T7 --> T10
            T11 --> T13
            T11 --> T15
            T13 --> T15
        end

        %% Task 1 Subtasks
        subgraph "Task 1 Subtasks (Setup)"
            ST1_1[1.1: Initialize Next.js<br/>Repository ✅]
            ST1_2[1.2: Configure App Router]
            ST1_3[1.3: TypeScript Setup]
            ST1_4[1.4: Modular Structure]
            ST1_5[1.5: Atomic Design]
            ST1_6[1.6: ESLint & Prettier]
            ST1_7[1.7: Husky Git Hooks]
            ST1_8[1.8: Vercel Deployment]

            ST1_1 --> ST1_2
            ST1_2 --> ST1_3
            ST1_3 --> ST1_4
            ST1_3 --> ST1_6
            ST1_4 --> ST1_5
            ST1_5 --> ST1_8
            ST1_6 --> ST1_8
            ST1_7 --> ST1_8
        end

        %% Current Status
        subgraph "Current Status"
            STATUS[✅ Next.js Project Initialized<br/>✅ Development Server Running<br/>✅ Tailwind CSS Configured<br/>✅ TypeScript Support<br/>⏳ 14 Tasks Pending<br/>⏳ 7 Subtasks Pending]
        end
    end

    %% Styling
    classDef completed fill:#d4edda,stroke:#155724,color:#155724
    classDef pending fill:#fff3cd,stroke:#856404,color:#856404
    classDef inProgress fill:#cce5ff,stroke:#004085,color:#004085
    classDef tech fill:#e7f3ff,stroke:#0066cc,color:#0066cc
    classDef file fill:#f8f9fa,stroke:#6c757d,color:#495057

    class ST1_1 completed
    class T2,T3,T4,T5,T6,T7,T8,T9,T10,T11,T12,T13,T14,T15,ST1_2,ST1_3,ST1_4,ST1_5,ST1_6,ST1_7,ST1_8 pending
    class NEXTJS,REACT,TYPESCRIPT,TAILWINDCSS,ESLINT_TECH,TASKMASTER tech
    class PKG,NEXT_CONFIG,TS_CONFIG,TAILWIND,POSTCSS,ESLINT,LAYOUT,PAGE,GLOBALS,TASKS_JSON,PRD file
