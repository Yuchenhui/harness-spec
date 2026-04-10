Harness Engineering 技术实战

## §1 开场：通用智能体应用步入生产力阶段

  2026 年 2 月，OpenAI Codex 团队发布了一篇博文，正式引爆了一个技术概念。博文中的一组数据让整个技术圈沉默了几秒：**3 个工程师，5 个月，产出了 100 万行生产级代码——其中没有一行是人手写的**。他们通过大约 1,500 个 Pull Request 完成了一款内部 beta 产品的构建和迭代，每人日均合并 3.5 个 PR。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=ZTRjNGU2ZDgzMGNlMmQxMzZkOTE4MmFkNmI5N2EyODhfNngxSTJSbmdubmtqeXFtaWFyQXkyZ3JuVGFoSEF1SlVfVG9rZW46T1N4WWJGTTR6b2xSR0x4ZXJWcmNNNkpxbkNiXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

> 来源：[Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)（2026 年 2 月）

  这 3 个人没有用什么秘密的超级模型——他们用的是市面上所有人都能用的 AI。但他们做到了 10 倍效率的产出。**他们做对了什么？**

  答案是：**他们不写代码，他们设计让 Agent 写代码的环境。** 这篇博文正式引爆的技术概念，叫做 **Harness Engineering**。

### 通用智能体的爆发式普及

  你可能注意到了，我们现在讨论的不只是"AI 编程"。事实上，AI 智能体已经远远超出了编程领域。

  2025 年底到 2026 年初，通用智能体迎来了爆发式普及。**OpenClaw** 以超过 33 万 GitHub Stars 成为全平台最高星标的软件项目之一，它不是一个编程工具——它是一个通用智能体平台，支持飞书、钉钉、Telegram、企业微信等十余个平台，接入 OpenAI、Anthropic、MiniMax 等多家模型提供商，任何人都可以在自己常用的工作场景中部署 Agent。与此同时，Claude Code、OpenAI Codex 这些本来定位为"AI 编程工具"的产品，也在被越来越多的人用于**非代码领域**——写技术文档、做内容策划、搭建自动化工作流。说白了，**所谓的 AI 编程智能体，本质上就是通用智能体**，Claude Code 能写代码，当然也能写课件、做调研、搞数据分析。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=MWQ1YjE1NjA1ODZhYjIxMjZiZTE4NjAyYjVlOTFhN2ZfZkdyd25UMUE3eHROMTVMVDloNWl6aGQ4TzcxTDZPaDZfVG9rZW46SXQ3dWJTWFJDb1FxZk14ZkFNMWNzQ1JZblRjXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

  智能体变得触手可及了。但一个更深层的问题也随之浮出水面。

### 核心痛点：简单任务没问题，复杂任务做不了

  如果你用过 OpenClaw 或 Claude Code，你大概率有过这样的体验：

  **问答**——没问题。"解释一下什么是 RAG"，回答得头头是道。**简单任务**——也没问题。"帮我写一个 Python 函数"、"帮我翻译这段话"，几秒钟搞定。

  但当你试图让 Agent 做更复杂的事情时，问题就来了。

  举一个我们团队亲历的例子：我们想让 OpenClaw 帮忙编写课件、搭建一个全自动内容工厂。结果发现——OpenClaw 能帮你回答技术知识点、能帮你做技术调研、能帮你做头脑风暴。但如果要它一步到位生产一份 2 小时的高品质图文课件？**做出来的东西似是而非**——结构混乱、知识点浮于表面、关键步骤缺失、截图全靠编造。

  这不只是内容领域的问题。编程领域也一样：Agent 写个函数没问题，但要它独立完成一个完整功能的开发、测试、集成？大概率半途而废或者产出一堆不可维护的代码。

  **这到底是 Agent 的能力问题吗？**

  不是。OpenAI 那 3 个人用同样的模型产出了 100 万行生产级代码。Stripe 用同样的 Claude 每周自动完成 1,300 多个 Pull Request。模型是一样的——**区别在于我们会不会用。**

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=NWM3YTZmNzU1OTIxNjFlNGRkOTgwZjIzNDU2ZWE5NTBfSEVUcWx5VGpyTnRYU09DaFJ2NXNQOTNhaGpETlRNSEdfVG9rZW46SVJGZGJXdGdQb2xtN2N4V3JVaGNjbWVvbjJvXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

### 三个时代：我们学会"用好智能体"的过程

  回顾过去两年，人们"学会使用智能体"的过程，恰好经历了三个阶段：

  **2024 年：提示工程（Prompt Engineering）时代**。智能体概念刚刚诞生，我们用 Agent 主要是**问答**——在 ChatGPT 里精心措辞一个问题，期待得到一个好回答。当时最流行的技术是"提示工程"：提示写得好，回答质量就高；提示写得差，回答就跑偏。整个互动模式是"一问一答"，我们在乎的是**那一次回答的质量**。

  **2025 年：上下文工程（Context Engineering）时代**。我们发现，仅靠一次好提示是不够的。在 Agent 运行的过程中，**在合适的时间输入合适的内容**——比如先给 Agent 看相关文档、再给它看用户需求、最后让它动手——就能显著提升它完成具体任务的能力。大纲策划、头脑风暴、意图理解……这些任务的质量明显提升了。但要一步到位生产高品质课件？**还是做不到。**

  **2026 年：Harness Engineering 时代**。经过了一段时间的技术发展和大量的实践探索，人们不约而同地发现了同一个结论——**给 Agent 创建一个适合运行的环境，比优化单次提示或上下文输入更能驱动它完成复杂的系统性任务**。这个"环境"包括：项目导航配置（让 Agent 知道自己在做什么项目）、自动化约束（阻止 Agent 犯危险错误）、反馈循环（让 Agent 知道每一步做得对不对）、多 Agent 协作（让不同角色的 Agent 互相检查）。这就是 **Harness Engineering**——2026 年最热门的"如何用好智能体"的技术概念。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=ZjUxM2YyZWYwNTYwNDkwODIzZjc1ZjlhYzIyNjI3ZDBfQUpwdkFSQWREaWpRS1h6M2V3TndMT0RFSnIwbjNJT1ZfVG9rZW46SEkwUmIwdkFHb2FsSzV4aEt1Z2NQVjF3bkp6XzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

### 不是突然诞生，而是经验汇聚

  值得一提的是，Harness Engineering 并不是突然从天上掉下来的新概念——它是无数团队在长期实践中不约而同总结出的一致经验，只是在 2026 年 2 月被正式命名和引爆。

  事实上，在 Harness Engineering 这个概念爆火之前，我们团队研发的**九天智课系统**就已经完全采用了这套思路。九天智课系统是一个多 Agent 协作的课件制作系统：Teacher Agent 负责编写课件并实时截图验证，3 个 Student Agent 分别从零基础学员视角、深度技术追问视角和竞品对比视角对课件发起质疑，通过多轮对抗迭代驱动内容质量提升。整个系统配备了完整的约束体系（Agent 权限控制、行为边界）、反馈循环（Student 质疑 → Teacher 修改 → Student 再验证）和自动化工具链（真实环境执行、截图上传、质量自检）。**这不就是 Harness Engineering 吗？**——只不过我们是把它用在了内容生产领域，而不仅仅是编程。

  这恰恰说明了一个关键认知：**Harness Engineering 的价值不局限于 AI 编程，它是让任何 AI 智能体从"玩具级问答"进化到"生产级产出"的通用方法论。**

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=NzA2MzAxOTM0NmYxYjkyNzkzMThmMDYxMzkyZTlmMDVfSDV6T0s2dnR0bWlWb3lZVm5icUl4WTFIZW91WWVhT3pfVG9rZW46RHlTM2Jra3Q2bzVvOVF4bktDamM4NWRIbmxnXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=YzUzYzU0ZDczN2YxMzE1ZDc0M2IzN2RmNDI2MzdmZGJfSXhLamlZSmVORll6bWlIUXYzdnZZeDJFWHNJTExZbGdfVG9rZW46T201UGJGSHZwb1kxZ2J4bVh1Z2NXdk5tbks5XzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

  **这门课就是来解决这个问题的。** 我们会以 AI 编程（Claude Code）为主线展开实战——因为编程场景的 Harness 工具链最成熟、效果最可量化。但你学到的理论和方法论，完全可以迁移到内容生产、自动化工作流、数据分析等任何智能体应用场景。

## §2 概念起源：从 Prompt Engineering 到 Harness Engineering

  在逐步展开概念的历史脉络之前，我们先给出 Harness Engineering 的标准技术定义，并用一组行业标杆成果让你直观感受这个领域的能量级。

#### Harness Engineering 的技术定义

  **Harness Engineering** 是设计、构建和持续优化 AI Agent 运行时环境的工程学科。它通过四类核心机制——**声明式知识注入**（项目配置文件，让 Agent 自动理解项目）、**自动化行为约束**（生命周期钩子与规则引擎，拦截危险操作、强制执行规范）、**多层反馈循环**（从即时检查到独立评估 Agent，确保每一步都有验证）和**系统熵管理**（持续清理 Agent 产出的技术债，防止代码库退化）——将 Agent 的可靠性、产出质量和自主工作能力从"演示级"提升到"生产级"。

  其核心公式：

$$\text{AI Agent 的产出质量} = \text{AI 模型能力} + \text{Harness 设计水平$$

  Harness 之于 AI Agent，如同操作系统之于 CPU——裸机能运算，但只有在操作系统的调度、约束和资源管理下，才能稳定地运行复杂应用。

#### 行业标杆成果一览

  如果你是第一次接触这个概念，下面这组数据可能会让你心跳加速——先不用理解它们的技术细节，只需要感受这些数字的分量：

| 团队 / 项目            | 规模         | 核心成果                                           | Harness 关键机制                         |
| ---------------------- | ------------ | -------------------------------------------------- | ---------------------------------------- |
| **OpenAI Codex**       | 3 人 → 7 人  | 5 个月产出 **100 万行**生产级代码，零人手写        | AGENTS.md + 六层架构约束 + 自动垃圾回收  |
| **Stripe Minions**     | 企业级       | 每周自动完成 **1,300+ Pull Requests**，~500 个工具 | Blueprint 审批 + CI/CD 管线 + 人工终审   |
| **LangChain**          | 开源团队     | 不换模型，仅改 Harness：基准排名从 30+ → **Top 5** | 系统提示词 + 工具优化 + 死循环检测中间件 |
| **GStack (Garry Tan)** | 个人开发者   | 60 天 **60 万行**代码，GitHub **48k Stars**        | 项目配置 + 28 个角色定义 + Sprint 流程   |
| **Peter Steinberger**  | 个人（极端） | 月均 **6,600 次代码提交**                          | 轻量配置 + 高信任模式                    |

  这些数字背后的共同点是：**他们用的都是市面上所有人都能用的 AI 模型——区别只在于他们为 Agent 搭建了精心设计的运行时环境。** 接下来，我们一步步拆解这些成果背后的方法论是怎么形成的。

### 2.1 三个时代的嵌套关系

  在进入核心理论之前，我们需要先建立一个关键认知——**Harness Engineering 不是来替代 Prompt Engineering 的，它们是包含关系**。

  Philipp Schmid 提出了一个非常直观的计算机类比，帮助我们理解这层嵌套关系：

| 计算机组件   | AI Agent 类比                | 职责                                       |
| ------------ | ---------------------------- | ------------------------------------------ |
| **CPU**      | AI 模型（如 Claude、GPT）    | 提供原始推理能力                           |
| **RAM**      | 上下文窗口（Context Window） | 有限的、易失的工作记忆                     |
| **操作系统** | **Harness**                  | 管理上下文、处理启动序列、提供标准工具接口 |
| **应用程序** | Agent                        | 在操作系统之上运行的特定任务逻辑           |

> 来源：[The importance of Agent Harness in 2026](https://www.philschmid.de/agent-harness-2026) — Philipp Schmid

  你不会在没有操作系统的 CPU 上直接跑程序吧？同理，**让 AI Agent 在没有 Harness 的环境里"裸跑"，效率和可靠性都会大打折扣**。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=MzY1OWQ2OWJhNjBjZDk5ZTZhMzY1ZjNmYTllNmUwZTBfS0hCa1BsdndWME04d1pkY0pxRFdkVjRHMnk3UzFPNzRfVG9rZW46WGpibWJYTDhlb1JYeTB4dDVPdmNNSnVtbjc4XzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

  这三个时代各自解决不同层次的问题，每一层都在前一层基础上扩展了问题域：

| 维度         | Prompt Engineering      | Context Engineering  | Harness Engineering                 |
| ------------ | ----------------------- | -------------------- | ----------------------------------- |
| **核心问题** | "我怎么措辞？"          | "给模型喂什么信息？" | "Agent 需要什么环境才能自主工作？"  |
| **工作单位** | 单次 API 调用           | 多轮对话 / 工具链    | 完整功能（从需求到交付）            |
| **人类角色** | 提示词作者              | 信息架构师           | 环境设计师                          |
| **时间尺度** | 一次推理（秒级）        | 一个会话（分钟级）   | 系统全生命周期（天/周级）           |
| **典型工具** | ChatGPT、API Playground | RAG、MCP、Few-shot   | CLAUDE.md、Hooks、Sub-agents、CI/CD |
| **思维模型** | "写一个好问题"          | "导演一个好剧本"     | "搭建一个好剧场"                    |

> 注：表中几个缩写——RAG（Retrieval-Augmented Generation，检索增强生成）是让模型检索外部知识后再回答的技术；MCP（Model Context Protocol，模型上下文协议）是 Anthropic 提出的工具调用标准协议；CI/CD（持续集成/持续交付）是自动化构建、测试、部署的管线。

> 这不是"Prompt Engineering 过时了"——它仍然是一切的基座。写好提示词的能力永远有用，只是仅凭提示词已经不够应对 Agent 时代的复杂需求了。

#### Watch-out：三个常见误区

1. **"三个时代是替代关系"** → 错。是包含关系。Harness Engineering 的从业者依然需要写好提示词、管好上下文。
2. **"只有大团队才需要 Harness"** → 错。个人开发者搭一个 CLAUDE.md + 安全 Hook 只需要 5 分钟，但能避免 90% 的低级失误。
3. **"Harness 越复杂越好"** → 大错特错。Vercel 删掉了 80% 的 Agent 工具后反而效果更好——简洁的 Harness 比臃肿的更高效。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=YjkzM2FhZjk0NDhiYzI4NTM5Y2Q2YjQzMWFiMjZlY2VfWmNsWXlTc29JNVpteWdZazRzNHJ2OURYbTR4Mm4ycDlfVG9rZW46QzNiS2JSemh1b1BCbml4UE96TWM1S0FqblpnXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

### 2.2 Karpathy 推文与 Context Engineering 的兴起

  每一次技术范式的转变都有一个起点。2025 年 6 月 25 日，前 OpenAI 联合创始人、前 Tesla AI 总监 Andrej Karpathy 发了一条推文，引爆了技术圈：

> "+1 for 'context engineering' over 'prompt engineering'. People associate prompts with short task descriptions you'd give an LLM in your day-to-day use. When in every industrial-strength LLM app, context engineering is the delicate art and science of filling the context window with just the right information for the next step."

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=YTJlM2Q1NGMzYWZiMTkxZmM5NGJhZDY3NzgyMTg0MTlfWEdQUEh5d1ZhV0NwTURjZjFJZ3pMUWpYUU1PM3ZWUTJfVG9rZW46TDViZWJ0cVBFb3czdDN4Q0FQZmNUMVRmbnlmXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

> 来源：[Karpathy 推文](https://x.com/karpathy/status/1937902205765607626)（2025 年 6 月 25 日）

  Karpathy 的观点很明确：**人们把"prompt"和日常聊天时的短指令联系在一起，但真正工业级的 LLM 应用，核心功夫是"上下文工程"——精心填充上下文窗口，让模型在每一步都拿到恰好足够的信息**。

  这条推文像一颗石子扔进了池塘。三个月后，Anthropic 发布了 *Effective Context Engineering for AI Agents* 系统性博文，标志着 Context Engineering 从一个推文概念变成了有完整方法论支撑的工程实践。

#### Agent Skills：Context Engineering 的高级形态

  Context Engineering 的一个重要发展方向是 **Agent Skills**——Anthropic 在 Claude Code 中实现的渐进式知识加载机制。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=YTNhYWRkNzBkODJhNDRlNjUwMTIxNDhjNjA2Zjk4ZWNfZmoxbWRvVGpoQ0FZSHhyajNQT2xyM0RNa1hxclU3M0RfVG9rZW46U1FmU2JUekFpb0pIRnh4ckNkWWNFOHdlbmZlXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

  传统的 CLAUDE.md 方案有一个固有矛盾：**信息太少，Agent 不知道怎么做；信息太多，上下文窗口被挤满，Agent 反而找不到重点**。Agent Skills 用"渐进式披露"（Progressive Disclosure）解决了这个问题——把知识按需分层加载，而不是一次性全部灌入。

  Skills 的三层架构：

| 加载层级     | 内容                                       | 何时加载                          | 信息量  |
| ------------ | ------------------------------------------ | --------------------------------- | ------- |
| **元数据层** | Skill 名称 + 触发场景描述                  | Agent 启动时始终加载              | ~100 词 |
| **主体层**   | SKILL.md 文件（操作指南）                  | Agent 判断需要使用该 Skill 时加载 | <500 行 |
| **资源层**   | references/ 子目录（API 文档、配置模板等） | Skill 执行过程中按需检索          | 不限    |

  这种"需要时才加载"的设计，和操作系统的动态链接库（DLL/so）原理如出一辙——不是把所有库都预加载到内存，而是运行时按需加载。这使得 Agent 既能在需要时获取深度知识，又不会在不需要时浪费宝贵的上下文窗口。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=MDczOTc3MjJhY2MyM2I0NjRiNGIxZmMxODc0NTU0YjNfaWE0cTFPZGlsZVVXbWNvcjBRT3c5cEZyVG5nYjhxNmFfVG9rZW46U0NuSGJGRWRob3RxUFR4QWY3QmNiRUE3bjFnXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

> 注：Agent Skills 是 Context Engineering 向 Harness Engineering 过渡的典型例子——它既是"喂什么信息"（Context Engineering）的技术，又涉及"怎么组织 Agent 的工具和知识"（Harness Engineering）的设计。

### 2.3 Hashimoto 的正式命名与 DevOps 类比

  但故事并没有在 Context Engineering 这里停住。当工程师们开始大规模使用 AI Agent 做日常开发时，他们发现仅仅管好"喂给模型什么信息"还不够——**你还需要约束 Agent 的行为、验证它的输出、在它犯错时自动纠正**。这些已经超出了"上下文管理"的范畴。

  2026 年 2 月 5 日，HashiCorp 联合创始人 Mitchell Hashimoto 在他的个人博客发表了一篇 *[My AI Adoption Journey](https://mitchellh.com/writing/my-ai-adoption-journey)*（我的 AI 采用之旅），记录了他从"不信 AI"到"离不开 AI"的六个阶段。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=ZGM5NDBiMzJjOWQwMTI2ZTNiYmQyMWRiOTA4ZTk1YjRfT1V6RmdGZEUzcDZQOHluSWJlSmxGMTlrNGpxR0ZiRElfVG9rZW46QlhQRWJ2NU1Rb0pvdkR4M29ORWNycjZ1bmhoXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

**第五阶段，他正式命名了 Harness Engineering**：

| 阶段  | 名称                         | 一句话概括                                                 |
| ----- | ---------------------------- | ---------------------------------------------------------- |
| 1     | Drop the Chatbot             | 放弃聊天机器人，转向能读写文件的 Agent                     |
| 2     | Reproduce Your Own Work      | 强迫自己用 Agent 重做已完成的工作，建立对能力边界的认知    |
| 3     | End-of-Day Agents            | 下班前启动 Agent 做调研和分诊，第二天获得"热启动"          |
| 4     | Outsource the Slam Dunks     | 把高确信度任务委派给 Agent，自己专注有价值的工作           |
| **5** | **Engineer the Harness**     | **Agent 犯错 → 工程化一个永久解决方案 → 这个错误永不再犯** |
| 6     | Always Have an Agent Running | 保持 Agent 持续运行，约 10-20% 工作时间有 Agent 在并行工作 |

  Hashimoto 的核心定义值得反复品味：

> **"Anytime you find an agent makes a mistake, you take the time to engineer a solution such that the agent never makes that mistake again."**

> ——每当你发现 Agent 犯了一个错误，你就花时间工程化一个解决方案，让这个错误永远不再发生。

  这里的"engineer a solution"不是写一行提示词让 Agent"下次注意"——而是**用代码、配置、自动化脚本把约束固化下来**。具体手段包括两类：

1. **文档化约束**：在 AGENTS.md / CLAUDE.md 中写入规则——"在这个项目中用这个命令"、"不要用这个 API"、"用这个流程验证"
2. **工具化验证**：编写辅助脚本——自动截图比对、只运行相关测试、格式检查——让 Agent 能快速自验结果

#### 与 DevOps 运动的类比

  如果你有 DevOps 背景，会觉得这个范式转变似曾相识。十年前 DevOps 将"运维"从手工操作变成了自动化流水线；今天 Harness Engineering 在做类似的事情——**将"管理 AI Agent"从人工盯看变成自动化的环境设计**。

| 维度     | DevOps 的变化                      | Harness Engineering 的变化     |
| -------- | ---------------------------------- | ------------------------------ |
| 核心转变 | 手动部署 → 自动化流水线            | 人工盯 Agent → 自动化环境约束  |
| 关键产物 | CI/CD 配置、Dockerfile             | CLAUDE.md、Hooks、Sub-agents   |
| 设计哲学 | 基础设施即代码                     | 约束即代码                     |
| 效果     | 部署频率提升 10x、故障恢复时间降低 | Agent 可靠性和产出效率显著提升 |

> 注：这个类比来源于社区讨论，不是 Hashimoto 原文的内容。但它确实帮助有 DevOps 经验的学员快速建立直觉。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=NDg1NzQyNjFjZmI0Njg1Y2YwZDYxMDI1NTU3ZDk3MzFfejAyeWM1cEE1WEp0Mzl2VnJNbTdlbkxGNlZCTU12U3RfVG9rZW46Q0dFR2JXM0RybzI3czB4TVFhdGNuamRFbmNkXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

### 2.4 里程碑时间线

  让我们把前面提到的所有关键事件串成一条完整的时间线，方便你快速回顾这个新兴领域是如何在短短九个月内从一条推文发展到一个完整工程学科的：

| 时间           | 事件                                                         | 关键人物/组织            |
| -------------- | ------------------------------------------------------------ | ------------------------ |
| 2022.11        | ChatGPT 发布，Prompt Engineering 时代全面开启                | OpenAI                   |
| 2025.06.25     | Karpathy 推文为 "Context Engineering" 正名                   | Andrej Karpathy          |
| 2025.09        | Anthropic 发布 *Effective Context Engineering for AI Agents* | Anthropic                |
| 2025.11        | Anthropic 发布 *Effective Harnesses for Long-Running Agents* | Justin Young (Anthropic) |
| **2026.02.05** | **Mitchell Hashimoto 博文正式命名 Harness Engineering**      | **Mitchell Hashimoto**   |
| 2026.02 中旬   | OpenAI 发布三篇系列博文（方法论 / App Server / Agent Loop）  | OpenAI Codex 团队        |
| 2026.03        | LangChain 用 Harness Engineering 在 Terminal Bench 2.0 冲进 Top 5 | LangChain                |
| 2026.03        | Stripe 公开 Minions 系统：1,300+ PRs/周，500 MCP 工具        | Stripe                   |
| 2026.03.24     | Anthropic 发布 GAN 式三 Agent 架构博文                       | Anthropic Labs           |

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=ZDZkOWRkYjI4ODU3YWFlYmU0MDg5NDA0Y2I4MTUwMDVfbjBHN2o5SkV5OEVSeVdDQm9nR0o2eENqUldpQzdrREdfVG9rZW46THBLZmI5Q1JIb2lXQkd4VlZ5M2N4OW0wbjU4XzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

## §3 四大支柱：Harness Engineering 的理论内核

  概念有了名字之后，我们来看它的内核。一个完整的 Harness 应该具备哪些能力？

  综合 OpenAI、Anthropic、Martin Fowler 团队和社区的实践经验，Harness Engineering 可以提炼为**四大支柱**。这不是学术分类法——每一根支柱都直接对应你日常使用 AI Agent 时遇到的真实痛点，也都有业内顶级团队的工程实践作为支撑。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=MzcxYWIzNzkyNzk0NTQzNjIyZGVkMmEwYmRkZWQ0ZjlfVWNkUFg5N0pRWEJ1TTVtb2ZRdWE1Unl5ZkNaRE41bERfVG9rZW46TkNTc2JyNFppb2tiMmZ4dDVKTWNrREcxbmliXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

| 支柱               | 解决的痛点                             | 核心机制                    | 对应 Harness 组件            |
| ------------------ | -------------------------------------- | --------------------------- | ---------------------------- |
| **代码库即真相源** | Agent 不了解你的项目，每次都要重复解释 | 声明式配置 + 渐进式知识加载 | CLAUDE.md / AGENTS.md        |
| **机械化架构约束** | Agent 犯错靠"口头提醒"无法根治         | 自动化规则强制执行          | Hooks / Linter / 结构测试    |
| **反馈循环**       | Agent 在黑暗中工作，不知道做得对不对   | 多层自动化验证 + 结果回传   | CI/CD / 测试 / 独立评审      |
| **熵管理**         | Agent 产出越多，代码库越难维护         | 周期性清理 + 品味编码       | 垃圾回收 Agent / Linter 规则 |

> 注：如果你对上表中的一些术语还不熟悉，这里做一个快速说明——**CLAUDE.md / AGENTS.md** 是放在项目根目录下的 Markdown 配置文件，AI Agent 每次启动时会自动读取，从中获取项目信息和行为规则（CLAUDE.md 是 Anthropic Claude 体系的叫法，AGENTS.md 是 OpenAI 体系的叫法，功能基本相同）；**Hooks**（钩子）是 Agent 运行过程中的自动化检查点，类似于 Git Hooks——在 Agent 执行某个操作的前后自动触发脚本或检查程序，可以拦截危险操作或强制执行规范；**Linter** 是代码风格和规范的自动检查工具（如 ESLint、Prettier）；**CI/CD**（持续集成 / 持续交付）是自动化构建、测试、部署的流水线。这些概念在下文各支柱的详细讲解中都会有完整展开，这里先建立一个基础印象即可。

  接下来，我们逐根支柱深入讲解。每根支柱都会覆盖三个维度：**What**（是什么）、**Why**（为什么重要）、**Watch-out**（容易踩什么坑），并用 OpenAI、Anthropic 和社区的真实案例帮助理解。每根支柱的最后，我们还会看看九天智课系统——也就是制作这门课件的 AI 系统——是如何在实践中落地这些原则的。

### 3.1 支柱一：代码库即真相源（Codebase as Source of Truth）

#### What：一句话定义

  **Agent 的所有知识来自代码库本身，而非外部的"万页说明书"。** 通过在项目根目录中放置结构化的配置文件——Anthropic 体系叫 **CLAUDE.md**，OpenAI 体系叫 **AGENTS.md**——让 Agent 每次启动时自动读取，获取项目的技术栈、常用命令、编码规范和行为禁区。你可以把它理解为"给 AI 写的项目说明书"，只不过它不是一本厚厚的手册，而是一份精炼的行军指南。

#### Why：为什么这根支柱排在第一位

  没有这根支柱，其他三根支柱都无从谈起——Agent 连"这个项目用什么语言"都不知道，谈何"约束"和"反馈"？

  用一个场景来理解：你让 Agent 在一个 Python 项目里写代码。没有 CLAUDE.md 时，Agent 不知道你用 pytest 还是 unittest 跑测试、不知道你偏好 snake_case 还是 camelCase、不知道 `.env` 文件不能碰。你每次开新会话都得重复说一遍——而人是会忘记的，总有一次你忘了说"别碰 .env"，然后 Agent 就真的改了。

  **CLAUDE.md / AGENTS.md 就是 Agent 的"导航地图"**。OpenAI 的 AGENTS.md 通常只有约 100 行，不是百科全书，而是精炼的行军指南。它告诉 Agent："项目用什么技术栈、代码风格是什么、哪些命令不能碰、遇到问题怎么验证"。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=N2YzNzEzNjcxN2Y4ZDlkNWYyNDViNzA2YjkxN2ZiNmRfYTVCWUdkazFCTmEyRXZYczZnNm1SenJQSm9tcnpEVHRfVG9rZW46R3dUYmJodktLb25tWFF4Zmh5MGNpejY2bkpnXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

#### "地图"而非"百科全书"——OpenAI 的关键教训

  OpenAI Codex 团队在实践中得到了一条代价不菲的教训：**他们尝试过"把所有信息塞进一个巨大的 AGENTS.md"——失败了。** 原因是上下文窗口是稀缺资源，巨大的指令文件会挤掉真正需要的代码和任务信息。Agent 面对一个 500 行的说明书，反而不知道哪些信息和当前任务相关。

  他们的正确做法是：**AGENTS.md 作为"目录"指向结构化的文档目录**：

```Plaintext
AGENTS.md（约 100 行）→ 导航地图
    ├── 指向 docs/architecture.md    → 架构设计
    ├── 指向 docs/conventions.md    → 编码规范
    ├── 指向 docs/api-spec.md       → API 规格
    └── 关键约束和禁止事项           → 核心禁区
```

  Agent 拿到地图后，按需跳转检索具体文档——这就是 Karpathy 所说的"Just-in-Time 上下文检索"在代码库层面的落地。

#### Hashimoto 的配置文件维护法则

  前面 §2.3 提到的 Mitchell Hashimoto（HashiCorp 联合创始人、"Harness Engineering"这一术语的命名者）分享了一条经验，非常值得学习：**CLAUDE.md 中的每一条规则，都对应过去一个真实的 Agent 犯错。** 他的 Ghostty 项目的 AGENTS.md 文件，"每一行都对应一个过去的 Agent 错误行为，而且几乎完全解决了所有这些问题"。

  维护方法论：

```Plaintext
Agent 犯错 → 分析根因 → 写成规则 → 加入 AGENTS.md
                                          ↓
                    下次 Agent 启动时自动读取 → 永不再犯
```

  这是一种**增量式学习机制**——不是一次性写出"完美的"配置文件，而是在实际使用中不断积累。这意味着你的 CLAUDE.md 会随着项目推进越来越"聪明"，覆盖越来越多的边界情况。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=ZWRjOTY2YmY5MDljZTVmODdiZGI4Zjk2ZGI0NDIwMDVfQmVYWlh0QXVLQzNxMDhJNGJQdGt6Zjd6cW0xVlJ2ZEZfVG9rZW46UUtLemJYMk5ab3c1Znd4T3JPbmNkd2dIbjVkXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

#### 三层配置策略

  Claude Code 支持三层配置文件，从全局到个人逐级细化：

| 层级 | 路径                  | 作用域             | 是否提交 Git | 典型内容                         |
| ---- | --------------------- | ------------------ | ------------ | -------------------------------- |
| 全局 | `~/.claude/CLAUDE.md` | 所有项目           | —            | 个人偏好（语言、风格、工作习惯） |
| 项目 | `./CLAUDE.md`         | 当前项目           | ✅            | 技术栈、命令、代码规范、约束边界 |
| 个人 | `./.claude/local.md`  | 当前项目（仅自己） | ❌            | 个人在该项目的特殊偏好           |

  三层配置在 Agent 启动时自动合并加载，优先级：个人 > 项目 > 全局。这个设计和软件工程中"配置继承与覆盖"的模式完全一致——全局配置提供默认值，项目配置覆盖团队约定，个人配置覆盖个人偏好。

#### Watch-out：三个常见误区

1. **越长越好** → 错。OpenAI 的经验是 <100 行为黄金标准。CLAUDE.md 是地图，不是百科全书。写太多反而让 Agent 迷失重点
2. **写 Agent 已经知道的常识** → 浪费上下文。不用写"请用英文变量名"——Agent 本来就会。只写**Agent 猜不到的、你项目特有的**信息
3. **一次性写完就不管了** → 应该持续维护。按 Hashimoto 的方法，每次 Agent 犯错就补一条规则，让 CLAUDE.md 越用越强

#### 九天智课系统的实践

  制作这门课件的九天智课系统本身就是"代码库即真相源"的深度实践者。它的知识注入体系分为三层：

| 层级       | 文件                            | 作用                                                         | 加载时机                  |
| ---------- | ------------------------------- | ------------------------------------------------------------ | ------------------------- |
| **系统层** | 根目录 `CLAUDE.md`              | 系统宪法精华——核心原则、工具配置、写作风格、三机执行环境     | 所有 Agent 启动时自动加载 |
| **角色层** | `.claude/agents/teacher.md` 等  | 各 Agent 的角色定义——Teacher 怎么写课、Student 怎么提问、Researcher 怎么调研 | 对应 Agent 启动时加载     |
| **任务层** | `courses/{slug}/writing-plans/` | 每章课件的写作规划——Block 级大纲、预期产出、截图需求         | Teacher 开始写该章时读取  |

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=M2QwNDAzMWY4MzYzNGMzNmIyNmNhNThlYzc5YjRjNjVfc01HbEhDT1RJaW1mSWh6RDRzZFc4bnR4cGdMdHkwS0xfVG9rZW46WEphNmJ2VUlUb3NQcW54RGNBUWNyVXlWbk9oXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

  此外，系统维护着一份 `global-learnings.md`（永久经验库），记录跨课程的通用教训。这正是 Hashimoto 方法论的落地——每当 Agent 犯错或九天老师给出反馈，有价值的经验就会被提炼写入这个文件，下一次会话的 Agent 启动时自动读取，**确保同一个错误永远不会犯第二次**。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=YWU3ZDMzZjMwYzhlODA5YmEzOGY2YTQ5Nzc3NGUwNmZfRVNHdENnVjgzOEQxOVFPbEE1V1EzUWY4WWJDMnlwdU1fVG9rZW46VXZGUGJUM2Z6b1Vicnp4THQ3cWNJNUtYbmdiXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=MGJjMGQ1Y2U2ZTZkMjE4NzAyMWFiOTE1MzM5YTc2ZGRfMjhNaTlnbTJTY2dPZ0g0clY4a05kTzJNdVhaWlo1TklfVG9rZW46TnJGT2Jlc1Jsb3V0dzB4dG1yZWNzQXRkbldjXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

### 3.2 支柱二：机械化架构约束（Mechanized Architectural Constraints）

#### What：一句话定义

  **用自动化工具把约束刻进执行流程，不依赖 Agent 的"自觉性"。** CLAUDE.md 写的是"你应该这样做"（建议），而 **Hooks**（钩子）和结构测试执行的是"你必须这样做，否则操作被阻止"（法律）。

  这里的 Hooks 是什么？如果你用过 Git，可能听说过 Git Hooks——在 `git commit` 或 `git push` 时自动触发的检查脚本。AI Agent 的 Hooks 是同样的概念：**在 Agent 执行某个操作的前后，自动触发一段检查程序**。比如，Agent 准备执行一条命令时（PreToolUse），Hook 先检查这条命令是否安全；Agent 修改完文件后（PostToolUse），Hook 自动运行代码格式化。通过就继续，不通过就拦截——Agent 没有"选择忽略"的余地。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=ZjE1MmU5YmExZGFjZGYwZWJhYWRhM2RmZTc1NmNlNWRfWlVENjF1ZVJSenpzdnZIcWxiTElPS0JZb2xxaGg5bm9fVG9rZW46VEVYdmI3VENrbzgyTlF4N2FSaWNlMktVbm9nXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

#### Why：为什么"建议"不够，必须有"法律"

  Agent 和人类一样会犯错，但人类可以凭经验"感觉不对"，Agent 不行。你在 CLAUDE.md 里写了"不要执行 rm -rf /"（这条命令会删除整台机器上的所有文件），Agent 大概率会遵守——但**"大概率"对安全性来说是不够的**。在涉及数据安全、代码质量、架构一致性的地方，我们需要的是 100% 的确定性。

  用一句话概括这根支柱的核心思想：

> **"CLAUDE.md 是建议，Hooks 是法律。"** 建议可以忽略，法律不行。

  这不是理论说教——OpenAI 在他们的 Codex 项目中设计了**六层分级约束体系**，用自动化工具在每一层强制执行架构规则：

```Plaintext
Types → Config → Repo → Service → Runtime → UI
  ↑      ↑       ↑       ↑         ↑        ↑
  每层只能依赖上层，严禁反向依赖
  违反 → 结构测试自动报错 → Agent 被阻止
```

  这不是一个检查清单，而是一个**自动执行的"法律体系"**。当 Agent 试图在 UI 层直接调用 Types 层的内部实现（跳过中间抽象层），结构测试会立即失败，告诉 Agent："违反了分层规则，请通过 Service 层调用。"

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=OGVkZDc5ZTI3OTcyZWFlZTE4ZjQ3YjUwZTc2ODcwY2Ffa0NNc3JhbXhLVVFkZFFadjRJakZWNXBaUGdJcktLYVhfVG9rZW46WTBkY2Jad0Jxb3d2M1p4bjBFNWNJSVo1bnZoXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

#### Claude Code 的 Hooks 系统

  Claude Code 提供了一套精心设计的 Hooks 系统——**24 个生命周期事件 × 4 种处理器类型**，形成一个能力矩阵，覆盖了 Agent 运行的几乎每个关键节点。

  四种处理器类型，从简单到高级：

| 类型      | 执行方式            | 适用场景                 | 示例                           |
| --------- | ------------------- | ------------------------ | ------------------------------ |
| `command` | 执行 Shell 命令     | 文件操作、脚本检查、通知 | `bash firewall.sh`             |
| `prompt`  | 调用 LLM 单轮评估   | 代码审查、风险评估       | "检查这段改动是否引入安全风险" |
| `agent`   | 启动完整 Agent 验证 | 复杂的多步验证           | "验证单元测试是否通过"         |
| `http`    | 发送 HTTP POST 请求 | 外部系统集成、Webhook    | POST 到 Slack/飞书通知频道     |

  其中 `command` 类型的 Hook 有一个精妙的退出码设计：

| 退出码 | 含义 | Agent 行为                              |
| ------ | ---- | --------------------------------------- |
| 0      | 通过 | 继续执行                                |
| 2      | 拦截 | **阻止当前操作**，向 Agent 反馈错误信息 |
| 其他   | 忽略 | 继续执行（Hook 自身错误不影响主流程）   |

  退出码 2 是拦截的"魔法数字"——不是 1，是 2。这个设计区分了"Hook 脚本自身出错"（退出码 1）和"Hook 有意拦截"（退出码 2）。

  光看表格可能还是抽象，我们用三个具体场景来理解 Hooks 到底在做什么：

  **场景一：安全防火墙拦截危险命令**。你让 Agent 帮忙清理项目中的临时文件。Agent 准备执行 `rm -rf /tmp/project/*`——这本身没问题。但如果 Agent 理解有误，把路径写成了 `rm -rf /`（删除整台机器的所有文件），灾难就发生了。`PreToolUse` Hook 在 Agent 执行命令**之前**被触发，防火墙脚本 `firewall.sh` 检查命令内容，发现匹配了危险模式 `rm -rf /`，立即以退出码 2 终止——Agent 收到反馈"BLOCKED：检测到危险命令"，操作被硬性阻止。整个过程不到 10 毫秒，人类甚至来不及反应，机器已经拦住了。

  **场景二：提交前自动跑质量检查**。Agent 写完一段 Python 代码准备 `git commit`。同样是 `PreToolUse` Hook，这次检测到命令包含 `git commit`，于是先自动运行 `ruff check .`（Python 代码质量检查工具）。如果发现未使用的 import、类型错误等问题，Hook 以退出码 2 拦截 commit，并把 ruff 的错误报告反馈给 Agent。Agent 拿到报告后自动修复问题，再次尝试 commit——这次 ruff 通过了，Hook 返回退出码 0 放行。**整个过程无需人类介入。**

  **场景三：任务完成后桌面弹窗通知**。你让 Agent 跑一个耗时 15 分钟的数据处理任务，然后去泡咖啡了。当 Agent 完成任务触发 `Stop` 事件时，一个 `command` 类型的 Hook 执行 macOS 的 `osascript` 命令弹出桌面通知："Claude Code 任务已完成"。你听到提示音，回来查看结果。这个 Hook 不拦截任何操作（退出码始终为 0），它的作用纯粹是**改善开发者体验**。

#### Prompt Hook：用 AI 约束 AI

  `prompt` 类型的 Hook 是机械化约束的高阶形态——**它不运行 Shell 脚本做模式匹配，而是调用另一个 LLM 来做语义理解**。

  用三个场景来感受 Prompt Hook 和 command Hook 的差异：

  **场景一：变形的危险命令**。传统的 `command` Hook 通过字符串匹配来拦截 `rm -rf /`，但如果 Agent 写了一段"功能等价"的 Python 代码（比如 `shutil.rmtree('/')`），字符串匹配就抓不住了——因为压根没出现 `rm` 这个关键词。Prompt Hook 可以理解代码的语义："虽然这段代码没有 `rm -rf`，但 `shutil.rmtree('/')` 的效果是递归删除根目录"，并据此发出警告。

  **场景二：隐蔽的密钥泄露**。Agent 在代码中写了 `logger.info(f"Request headers: {request.headers}")`——表面看是正常的日志记录。`command` Hook 检查关键词 `password`、`secret`、`api_key` 都没有命中。但 Prompt Hook 能识别出：`request.headers` 里通常包含 `Authorization` 头，这意味着 API Token 会被写入日志文件，造成凭证泄露。字符串匹配看不到的风险，语义理解可以看到。

  **场景三：破坏性的 API 变更**。Agent 修改了一个公开 API 的返回格式——把 `{"data": [...]}` 改成了 `{"items": [...], "total": 100}`。代码本身完全正确，`command` Hook 不会有任何反应。但 Prompt Hook 可以判断："这是一个 breaking change（破坏性变更），所有调用这个 API 的前端页面都会因为找不到 `data` 字段而崩溃。建议保持向后兼容或发新版本。"

| 对比     | command Hook       | prompt Hook            |
| -------- | ------------------ | ---------------------- |
| 检测方式 | 字符串模式匹配     | 语义理解               |
| 速度     | 毫秒级             | 1-3 秒                 |
| 能力     | 检测已知的危险模式 | 发现未知的风险模式     |
| 成本     | 零（本地执行）     | 消耗 API 额度          |
| 适用场景 | 高频、确定性检查   | 低频、需要判断力的检查 |

  最佳实践是**双层防线**：用 `command` Hook 做高速模式匹配拦截已知威胁（速度快、零成本），用 `prompt` Hook 做深度语义分析捕获未知风险（能力强、但有延迟和成本）。两者不是替代关系——`command` Hook 是第一道筛子过滤 99% 的明显问题，`prompt` Hook 是第二道网兜住那些"看起来没问题但实际有隐患"的漏网之鱼。

#### 反直觉洞察：收窄解空间反而提高成功率

  很多人的直觉是"给 Agent 更多自由度，它能做更多事"。但 OpenAI 的实践证明了相反的结论——**限制选择比提供更多自由更有效**。

  当你告诉 Agent"用任何你觉得合适的方式实现这个功能"，它面对无限可能性，选择的方差极大。但当你约束它"必须用 React 组件、遵循项目的命名规范、通过 Service 层调用后端"，它在这个收窄后的解空间里反而更容易找到正确答案。

  这和人类的经验类似：有明确的编码规范的团队，代码质量通常优于"自由发挥"的团队。约束不是限制创造力，而是**把创造力引导到有价值的方向**。

  OpenAI 的 linter 设计中还有一个精妙之处：**自定义 linter 的错误消息同时也是 Agent 的修复指南**。当 Agent 违反了某条规则，linter 不只是说"错了"，还告诉 Agent 怎么修——这等于把 Agent 的学习能力嵌入了约束体系。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=YmYxMDRiNmJiZmZlOWNkOGFkMmIxZjU4NGY2ZTYxZjFfb2d3UWpmb2ZyYzZWUmRSaGRMS0I3VXRGZGljRzJDOVZfVG9rZW46WEs5dGJYb0Jab3dqOGh4d0duUWNQelZybm1nXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

#### Watch-out：约束设计的三个陷阱

1. **约束太多太细** → Agent 每一步都被拦截，效率反而下降。只约束**真正危险或真正重要**的行为
2. **退出码搞错** → 用 `exit 1` 想拦截操作但实际上被忽略了（应该用 `exit 2`）
3. **只约束不解释** → 拦截了 Agent 但不告诉它为什么被拦、怎么修。好的约束应该同时是教学工具

#### 九天智课系统的实践

  九天智课系统在机械化约束方面做了三件事：

  **第一，工具权限矩阵**。系统中 9 个 Agent 的工具权限各不相同——Student B（深度追问者）和 Student C（竞品达人）没有 Bash 工具权限，他们只能搜索和思考，不能执行命令修改任何东西；Refiner Agent（负责优化提示词的 Agent）没有 Bash 和 Web 工具，防止它通过"作弊"来游戏评估系统。**不是靠提示词说"你不能执行命令"——而是在工具层面直接禁用，Agent 连执行的入口都没有。**

  **第二，三级行为边界**。Teacher Agent 的行为被划分为三个等级：✅ Always（直接做，如编写常规内容、截图）、⚠️ Ask First（必须通知九天老师，如遇到认证墙或命令执行失败）、🚫 Never（绝对禁止，如编造命令输出或跳过截图）。这和 OpenAI 的分层约束思路完全一致——**对不同风险等级的行为施加不同强度的约束**。

  **第三，EDW 协议**（Expect-Execute-Align）。当 Teacher Agent 编写操作步骤时，必须遵循"先预期→再执行→基于真实输出写文字"的流程。这个协议从机制上杜绝了"凭经验想象输出"的可能——**你没有真正执行过的命令，就不能写进课件**。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=YzRkZjJkZjA5ODU0MmJiYzE2YTM4OGFlZjU2NDU4NTNfWjhCOXRsN1BZNHRvemFCNDZiRVhKMFJQNWpKQ1NvMTlfVG9rZW46UFRVQ2JrdGpDb2J2YUd4bGRIY2NWM2NmbmJoXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

### 3.3 支柱三：反馈循环（Feedback Loops）

#### What：一句话定义

  **让 Agent 在每一步都能自动获知"做得对不对"，而不是在完成所有工作后才发现错了。** 没有反馈的 Agent 就像在黑暗中射箭——可能偶尔命中，但大多数时候偏离靶心。

#### Why：反馈循环为什么是 Harness 的核心

  Anthropic 在他们的长时运行 Agent 博文中提出了一个极其精准的类比：**Agent 的每个新会话"开始时没有之前的记忆"——就像轮班的工程师没有交接记录。** 你想象一下：一个工程师上午做了一半的工作，下午换了另一个工程师接手——如果没有任何交接文档，下午的工程师怎么知道做到哪了？可能重做上午的工作，可能继续一个错误的方向。

  反馈循环就是**确保每一位"轮班工程师"都知道做到哪了、做得对不对、下一步应该做什么**。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=OTdkYTAzOWRhZDUyZWNjMjFjNGY0NTZjYmQ5OGY5YzdfUm1UME5CUkFCem9NaklHUHNiT0lpZDVGSDFvT1M4bGlfVG9rZW46UVlEU2JoM3hZb29JV2d4elhCdGMzVnZmbndmXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

#### 多层反馈机制

  实践中，反馈循环分为四个层次，从即时到跨会话逐层递进：

| 层级           | 触发时机     | 机制           | 反馈内容                      | 代表实现                           |
| -------------- | ------------ | -------------- | ----------------------------- | ---------------------------------- |
| **即时反馈**   | 工具调用前后 | Hooks          | 格式检查、安全拦截、语法验证  | Claude Code PreToolUse/PostToolUse |
| **构建反馈**   | PR 创建时    | CI/CD Pipeline | 测试结果、lint 报告、类型检查 | GitHub Actions、Stripe CI          |
| **运行时反馈** | 应用部署后   | 可观测性工具   | 日志、指标、性能追踪          | OpenAI Chrome DevTools 集成        |
| **评审反馈**   | 功能完成后   | 独立评估者     | 质量评分、改进建议            | Anthropic Evaluator Agent          |

  这四层不是"选一个就好"——它们互相补充。我们用一个具体任务来感受四层反馈各自在什么时刻发挥作用：

  假设你让 Agent 实现一个"用户注册 API"。以下是它从编写到上线的全过程中，四层反馈分别在哪里介入：

| 阶段       | Agent 做了什么                                            | 哪层反馈介入                     | 反馈内容                                                     |
| ---------- | --------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------ |
| 写代码时   | Agent 写了 `password = request.body["pwd"]`，没做任何加密 | **即时反馈**（PostToolUse Hook） | Prompt Hook 警告："用户密码以明文存储，存在安全风险"         |
| 准备提交时 | Agent 执行 `git commit`                                   | **即时反馈**（PreToolUse Hook）  | 自动 Lint 检查发现：函数缺少 type hints，import 顺序不规范   |
| 创建 PR 时 | Agent 提交 PR 到 GitHub                                   | **构建反馈**（CI/CD）            | GitHub Actions 运行单元测试，发现：邮箱格式验证有遗漏、重复注册没有返回正确的 409 状态码 |
| 部署后     | API 上线运行                                              | **运行时反馈**（可观测性）       | 日志显示注册 API 的 P99 延迟达到 3 秒（数据库缺少索引）      |
| 功能完成后 | Code Reviewer Agent 审查                                  | **评审反馈**（独立评估者）       | "注册流程缺少邮箱验证步骤，恶意用户可以用假邮箱批量注册"     |

  每一层反馈捕获的问题类型不同：即时反馈抓住明显的安全和格式问题，构建反馈抓住功能缺陷，运行时反馈抓住性能问题，评审反馈抓住设计层面的遗漏。**缺少任何一层，都意味着某类问题会"静默通过"直到造成实际损害。**

#### Anthropic 的两阶段会话协议

  Anthropic 在长时运行 Agent 的实践中设计了一套优雅的反馈协议，解决"Agent 重启后不知道做到哪了"的问题：

| 阶段    | Agent             | 职责                   | 关键产出                                     |
| ------- | ----------------- | ---------------------- | -------------------------------------------- |
| Phase 1 | Initializer Agent | 首次会话：搭建基础设施 | `init.sh` 启动脚本 + `progress.txt` 进度文件 |
| Phase 2 | Coding Agent      | 后续每次会话           | 逐个实现功能 + 描述性 commit + 端到端测试    |

  每次 Coding Agent 启动新会话，都遵循一个严格的**会话启动协议**：

```Plaintext
1. pwd → 确认自己在哪
2. git log + progress.txt → 了解做到哪了
3. 选最高优先级的未完成功能 → 决定做什么
4. init.sh → 启动开发服务器
5. 跑一遍端到端测试 → 确认基线正常
```

  这就是 Harness 的核心价值之一——**设计"交接制品"**。Agent 不需要记住上一个会话做了什么，因为 `git log` 和 `progress.txt` 已经记录了一切。

  用一个具体场景来还原这个协议的运作方式：假设你让 Agent 搭建一个博客系统，功能清单包含"用户认证、文章 CRUD、评论系统、搜索功能"四个模块。

  **第一次会话（Initializer Agent）**：创建项目骨架、安装依赖、生成 `init.sh`（一键启动开发服务器的脚本）和 `progress.json`（功能清单，标记每个模块的完成状态）。

  **第二次会话（Coding Agent #1）**：启动后执行会话协议——`git log` 显示只有 init commit，`progress.json` 显示四个模块全是 `"status": "pending"`。它选择优先级最高的"用户认证"模块开始实现。完成后 commit："feat: implement user auth with JWT tokens"，并将 `progress.json` 中该模块更新为 `"status": "done"`。

  **第三次会话（Coding Agent #2）**：又一个全新的 Agent 实例，没有前一个会话的任何记忆。但它执行相同的会话协议——`git log` 看到 auth 已完成，`progress.json` 显示认证模块 `"done"`，文章 CRUD 仍 `"pending"`。它跑 `init.sh` 启动服务器，跑端到端测试确认 auth 正常，然后接着实现文章 CRUD。**没有任何"交接会议"，但新 Agent 精确地知道从哪里接手。**

  三个关键的技术细节值得注意：

- **功能清单用 JSON 而非 Markdown**：Agent 很容易在编辑 Markdown 时"顺手"修改清单结构——JSON 的刚性格式防止了这种意外篡改。比如 `{"auth": {"status": "done"}, "crud": {"status": "pending"}}` 的结构是严格的，Agent 不会像编辑 Markdown 那样把 `- [x] 认证` 不小心改成 `- [x] 认证（已完成，但还需要加 refresh token）`
- **Git 作为最佳进度追踪**：描述性的 commit 消息本身就是进度记录——`feat: add article CRUD with pagination` 比任何进度文件都更真实。因为 commit 对应着实际的代码变更，不会出现"进度文件说完成了但代码没写"的不一致
- **Puppeteer MCP 做端到端测试**：让 Agent 像用户一样测试（打开浏览器、填写表单、点击按钮、验证页面内容），而不仅仅依赖单元测试。这确保了每次新会话启动时的"基线检查"是真实可靠的

#### LangChain 的 Doom Loop 检测

  LangChain 在 Terminal Bench 2.0 的实践中，发现了 Agent 的一个常见故障模式——**Doom Loop（死循环）**：Agent 反复修改同一个文件但始终无法通过测试，陷入"编辑→失败→编辑→失败"的无限循环。

  具体什么样呢？举个例子：Agent 要修复一个 CSS 布局问题——页面侧边栏在窄屏幕下和主内容区重叠。Agent 第一次尝试：给侧边栏加 `position: absolute`，测试失败（侧边栏脱离文档流，遮住了内容）。第二次尝试：改成 `float: left`，测试失败（底部 footer 跑上去了）。第三次：加 `clear: both`，测试失败（间距不对）。第四次、第五次……Agent 反复在同一个 `style.css` 文件上修修补补，但每次都只是在局部打补丁，始终跳不出"浮动布局"的思路框架。

  LangChain 的解决方案是 **LoopDetectionMiddleware**——一个嵌入在 Harness 中的中间件，监控单个文件的编辑次数。当 `style.css` 被编辑第 6 次仍未通过测试时，中间件自动注入一段提示：**"你已经修改这个文件 6 次了。考虑重新评估你的方法——也许应该用 CSS Flexbox 或 Grid 重构布局，而不是继续调整浮动属性。"**

  这个设计很精妙：它不是强制 Agent 停下来（那样可能中断正在收敛的尝试），而是**给 Agent 一个"退一步看全局"的提示**，让 Agent 自己决定是否改变策略。在上面的例子中，Agent 收到提示后可能会跳出浮动布局的思路，改用 `display: flex` 一次性解决侧边栏和主内容的布局问题——这往往就是正确答案。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=MDEwY2E3N2U4YTY4YTIxY2U3ODY3ZGNkNjkwMTlhN2JfMEk0dlQ4c09nbTZrQkxiSnBiYVg2YnlUYVBlaHVNT0JfVG9rZW46Vkw1a2J1MnNib2w5V3N4a1BsNGM0SldubkNjXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

#### 评估与生成的分离：GAN 式架构

  Anthropic 在 2026 年 3 月发布的最新博文中，将反馈循环推进到了一个全新的高度——**受 GAN（生成对抗网络）启发，设计了三 Agent 协作架构**：

| Agent                   | 职责                                         | 类比       |
| ----------------------- | -------------------------------------------- | ---------- |
| **Planner**（规划者）   | 把简短描述扩展为完整产品规格                 | 产品经理   |
| **Generator**（生成者） | 按 Sprint 迭代实现功能                       | 开发工程师 |
| **Evaluator**（评估者） | 用 Playwright 做端到端测试，基于客观标准打分 | QA 工程师  |

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=NGJiMmYwODY4NThhNDY4Y2I1NjIzZmEzN2I4MGJmMWVfc1ZuSjhFS0hIYUNpYXI4aEFNTWM0Q2o2S1JZV3ZQTUdfVG9rZW46RWw3RmJLbno0b0FsYVB4eGxJYWM4d2VBbkpjXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

  他们发现了 LLM 的一个根本性问题：**当 Agent 被要求评估自己的工作时，它会表现出不合理的自信和宽容**——即使产出很平庸，自评也倾向于打高分。解决方案不是"让 Agent 学会自我批评"（这很难），而是**把评估交给独立的 Agent**：

> "调校独立评估者的怀疑度，比让生成者对自己的工作保持批判性要容易得多。"

  用一个具体例子来看三个 Agent 是怎么协作的。假设用户的输入只有一句话："做一个博物馆网站"。

  **Planner（规划者）** 把这句话扩展为完整的产品规格："响应式布局、至少 5 个展品页面、导航菜单、搜索功能、展品详情页带高清图片和语音导览按钮、移动端适配"。

  **Generator（生成者）** 和 **Evaluator（评估者）** 在开工前先进行 **Sprint Contract 协商**——明确本轮交付物和可测试的成功标准。比如第一轮 Sprint 的合约是："交付首页布局 + 导航菜单。成功标准：(1) 页面在 1024px 和 375px 两种宽度下都能正常显示 (2) 导航菜单包含至少 4 个入口 (3) 首页加载时间 < 3 秒。" 这份合约弥合了"用户想要什么"和"可测试的实现"之间的鸿沟——Evaluator 拿着这份合约就知道该测什么。

  Generator 完成第一轮实现后，Evaluator 用 Playwright 自动打开页面、调整窗口大小、检查导航元素、测量加载时间。第一轮评分：Design Quality 6/10（"布局中规中矩，和模板网站无明显差异"）、Originality 3/10（"毫无创意，看起来像免费 Bootstrap 模板"）。Generator 拿到这份评分后继续迭代。

  到第 10 轮迭代时，一个惊人的事情发生了——Generator 主动放弃了之前 9 轮一直在调整的暗色主题设计，**重新构想为"3D 房间，棋盘格地板用 CSS 透视渲染，艺术品以自由形式挂在墙上，门廊式导航"**。这种创造性突破是单 Agent 模式下几乎不可能出现的——因为没有 Evaluator 持续在 Originality 维度上施压，Generator 不会有动力跳出舒适区。**好的反馈循环不只是"防错工具"——它还能激发创造力。**

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=OThkZjJlMzNmNzBjOTNhY2VmOTg3Y2Y1MTljZTg2Y2VfY0hrR1RzeFFXRmxoUkh3TklRV3RDcXJKZUVTZFkyV21fVG9rZW46VUFhYWI1ek1ob1U3UEp4d3RLd2NiSFUybnJjXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

#### Watch-out：反馈循环的三个陷阱

1. **反馈太慢** → 如果一个 Hook 要跑 30 秒才出结果，Agent 的开发节奏就被严重拖慢。即时反馈应在秒级完成
2. **反馈太模糊** → "测试失败"不够好，应该告诉 Agent 哪个测试、什么断言、实际输出是什么。信息量越大，Agent 修复越快
3. **自评代替独立评估** → LLM 天然有"自我感觉良好"的偏见。重要的质量验证必须由独立的评估者完成

#### 九天智课系统的实践

  九天智课系统的整个架构本质上就是一个多层反馈循环——而且它和 Anthropic 提出的 GAN 式三 Agent 架构几乎不谋而合：

| Anthropic GAN 架构      | 九天智课系统对应       | 职责                                                |
| ----------------------- | ---------------------- | --------------------------------------------------- |
| **Planner**（规划者）   | **Architect Agent**    | 基于逆向设计框架，产出 Writing Plan（课件编写规划） |
| **Generator**（生成者） | **Teacher Agent**      | 按 Writing Plan 逐 Block 编写课件，边执行边截图     |
| **Evaluator**（评估者） | **3 个 Student Agent** | 从零基础执行、深度追问、竞品对比三个维度独立质疑    |

  三个 Student Agent 就是三个独立的评估者，各自从不同角度验证课件质量——Student A 执行每条命令看是否跑得通（即时反馈），Student B 搜索官方文档交叉验证技术准确性（准确性反馈），Student C 对比同类教程找差距（市场反馈）。Teacher Agent 不能自评自己写的课件质量——**评估必须由独立的角色完成**。

  在 Student 对抗之前，系统还有一道"自检"环节——**draft-review**（初稿审查），从 8 个维度自动扫描课件中的常见问题（截图覆盖、术语解释、时效验证等）。这相当于把"即时反馈"和"评审反馈"两层都做了。

  标准流程是 3 轮对抗迭代：第一轮发现表面问题（命令跑不通、术语没解释），第二轮暴露深层问题（技术不严谨、竞品差距），第三轮验证修复并收敛。这和 Anthropic 博文中 Generator 的多轮 Sprint 迭代是同一种模式。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=NTZmODVmNDFjMzRjMjA5YzdiYWNlMTE2M2E4OTJiYjFfNEVId21FRVZmV2I0Y1E2VzEzNlBtaE9UWWlqemJyTU1fVG9rZW46VmdxQWJTQXN2b01ZajJ4U3lZSWNQNHF6bmxiXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

### 3.4 支柱四：熵管理（Entropy Management）

#### What：一句话定义

  **主动管理 AI 代码生成带来的独特"系统退化"——不是传统意义上的 bug，而是渐进式的文档漂移、架构侵蚀和风格不一致。** 如果不管理，Agent 产出的代码库会越来越难以维护，最终陷入"生成得越快、烂得越快"的恶性循环。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=MmQ1MjIyZjNkZWJmYjc2NGYzMmM5OWIyY2ZmNTkxYTZfaEJQd2ZIMWlpU2tnRXhVVFlmTWVNYUNaMzFQUXZjUkFfVG9rZW46QktzdmJSNURnb1RYZ1B4NUxxZ2NYNktObjJkXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

#### Why：AI 代码的"独特垃圾"

  这是最容易被忽视的一根支柱，但可能是 Harness Engineering 中**最具原创性的洞察**。

  传统软件开发中，代码质量问题主要是"bug"——程序崩溃、逻辑错误、安全漏洞。但 AI 生成的代码有一种全新类型的质量问题——**不是某一行代码有错，而是整个代码库在缓慢退化**：

| 熵类型         | 表现                                   | 为什么 AI 特别容易产生                  |
| -------------- | -------------------------------------- | --------------------------------------- |
| **文档漂移**   | 注释/文档说的和代码做的不一致          | Agent 改了代码但忘了更新注释            |
| **架构侵蚀**   | 绕过设计约束的"捷径代码"越来越多       | Agent 倾向于选择最短路径而非最规范路径  |
| **风格不一致** | 同一项目出现多种命名风格、多种实现模式 | 不同会话的 Agent "不记得"之前的风格选择 |
| **重复代码**   | 功能相似但不完全相同的代码块散落各处   | Agent 有时会重新实现已有的功能而非复用  |

  每种熵可能看起来抽象，我们用具体代码来感受它们的"毒性"：

  **文档漂移的例子**：你的项目最初有一个函数 `get_user(id)` 返回一个用户字典。注释写着"返回 `{name, email}`"。三个月后，Agent 给它加了 `avatar` 和 `role` 字段，但没更新注释。又过了两个月，另一个 Agent 依赖这条注释写了前端页面——只显示 `name` 和 `email`，遗漏了 `role` 字段。注释和代码的不一致在半年后才被人发现，而到那时已经有 12 个地方依赖了错误的假设。

  **架构侵蚀的例子**：项目约定"所有数据库查询必须通过 Repository 层"。Agent 在实现一个紧急功能时发现通过 Repository 层需要多写两个方法——于是它走了捷径，在 Controller 层直接写了 `db.execute("SELECT * FROM users WHERE ...")`。代码能跑，功能正常。但下一次 Agent 看到这个"先例"，也跟着在 Controller 里直接查数据库。几个月后，项目里有 30% 的数据库查询绕过了 Repository 层——当你想把数据库从 MySQL 迁到 PostgreSQL 时，才发现需要改的地方遍布各处。

  **风格不一致的例子**：周一的 Agent 会话给 API 响应用了 `camelCase`（`userName`、`createdAt`），周三的 Agent 会话用了 `snake_case`（`user_name`、`created_at`），周五的又用了 `camelCase`。三种风格在同一个项目中共存，前端开发者要在每个 API 调用处猜测"这个端点用的是哪种风格"。

  这些问题每一个单独看都不严重——不会让程序崩溃，不会触发报错。但它们的**累积效应**是致命的：代码库变得越来越难以理解和维护，新加入的 Agent（甚至人类开发者）理解代码的成本越来越高，修改的风险也越来越大。这就是"熵"的本质——**不是爆炸性的灾难，而是渐进式的腐烂**。

#### OpenAI 的"垃圾回收"方法

  OpenAI Codex 团队提出了一个精妙的类比：**把代码熵的管理当作编程语言的垃圾回收（GC）来做**——不是等技术债积累到爆发才一次性清理，而是持续运行、定期回收。

  他们的做法是：

1. **将编码原则固化为 linter 规则**：人类的"品味"和审美判断，通过规则编码为自动化检测。比如：团队约定"所有 API 响应必须用 `snake_case`"——他们不是在 AGENTS.md 里写"请用 snake_case"然后祈祷 Agent 遵守，而是写一条 linter 规则自动扫描所有 JSON 响应字段名。一旦发现 `userName` 这种 camelCase 字段，linter 直接报错并告诉 Agent："错误：字段名 `userName` 应改为 `user_name`（项目规范：API 响应统一使用 snake_case，详见 docs/api-conventions.md）"。注意错误消息本身就是修复指南——Agent 不需要去翻文档就知道该怎么改。
2. **后台 Agent 定期扫描**：专门的"清理 Agent"周期性运行，扫描文档不一致、约束违规、架构漂移。比如每天凌晨自动跑一遍：检查所有函数的注释是否与实际参数和返回值匹配（文档漂移检测）、检查是否有 Controller 层直接调用数据库的代码（架构侵蚀检测）、生成"代码健康度日报"推送到 Slack。
3. **持续重构而非积压技术债**：发现问题立即修复，而非放入"以后再说"的 backlog。Agent 发现一个重复代码块？立刻提取为共享函数。不是"先记下来以后再统一重构"——因为"以后"永远不会来。

  OpenAI 对此有一句非常精练的概括：

> **"品味捕获一次，强制执行无限次。"**

  你只需要把你对代码质量的判断标准编码为规则一次，然后 Agent 就会持续不断地按照这个标准执行检查。人类的品味是珍贵而稀缺的——通过机械化，它的价值被无限放大了。

#### Bitter Lesson：为删除而构建

  Philipp Schmid 在分析 Harness Engineering 时发出了一个重要警告，他称之为 **Bitter Lesson（苦涩的教训）**：

> **Harness 必须设计成可删除的。** 因为今天需要复杂管线来完成的任务，明天可能一个提示词就搞定了。

  具体数据很有说服力：

- **Manus** 团队在 6 个月内重构了 Harness **5 次**，每次都是为了删掉过时的复杂逻辑
- **Vercel** 删除了 80% 的 Agent 工具后，效果反而更好
- **LangChain** 一年内重架构 3 次

  这些血泪教训都指向同一个设计原则：

> **Start Simple（从简单开始）、Build to Delete（为删除而构建）。**

  不要一上来就搞复杂的控制流。先提供稳健的原子工具，用模块化架构让每个组件都可以独立替换或删除。举个例子：2025 年初，很多团队为 Agent 设计了复杂的"分步骤 JSON 输出解析器"来确保 Agent 按结构化格式返回结果——到了 2025 年底，模型原生就支持结构化输出了（JSON Mode），那个花了三周开发的解析器瞬间变成了需要清理的遗留代码。如果它和十几个模块深度耦合，删除它的成本比开发它还高。

#### Watch-out：熵管理的两个误区

1. **不管不顾** → 这是最常见的错误。大多数人搭完 Harness 后就不管了，半年后代码库已经悄悄退化到难以维护
2. **过度工程** → 另一个极端：设计过于复杂的清理规则和检查流程，Harness 本身变成了需要维护的技术债。记住 Bitter Lesson——保持轻量

#### 九天智课系统的实践

  九天智课系统的熵管理体系有三个层面：

  **经验沉淀——跨会话的知识不退化**。每章课件完成后，系统的 `learning-extractor`（经验提炼工具）会从教学反思和 Student 反馈中提取通用教训，写入 `global-learnings.md`（永久经验库）。这份文件在每个新会话启动时自动加载——确保过去踩过的坑不会在新章节中重复出现。这和 OpenAI 的"垃圾回收"思路异曲同工：**把经验固化为可执行的规则，而不是依赖 Agent 的"记忆"**。

  **状态追踪——跨章节的一致性不漂移**。`course-state.md` 文件持续追踪当前课程的环境状态（哪些软件已安装、哪些配置已完成）、已引入的概念和术语表、叙事进度等。当 Teacher Agent 开始写新章节时，它不是在真空中写作——它知道"上一章已经解释过什么"、"学员的环境现在是什么状态"，避免重复解释或遗漏前提。

  **提示词淬炼——Agent 自身能力的持续进化**。这是九天智课系统最独特的熵管理机制——**九炼系统**（JiuLian）。借鉴 Karpathy 的 autoresearch 模式，系统中有一个专门的 Refiner Agent 分析评估结果，自动修改 Agent 的提示词，让 Student 更会提问、Teacher 更会写课件。如果说前两层是"管理课件内容的熵"，九炼系统管理的是"Agent 自身能力的熵"——**确保系统不仅产出不退化，而且越用越好**。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=OTFiMjJiNTdmMTJkZGNjYzczZjA5OWU2NTdkOTZjOWJfa2VTazFORXQ3elREcHBpZXZYZm9GZG1DenRKMWdneVdfVG9rZW46WXZEWmJMNG9Yb1UxMjJ4eHM3NGNKdTdRbm9jXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

### 3.5 核心公式与震撼数据

  理解了四大支柱，我们回到 §1 提出的核心公式： $$\text{AI Agent} = \text{AI Model} + \text{Harness$$  这不是理论推导——LangChain 团队用一个精心控制变量的实验证明了这一点。2026 年 3 月，他们在 Terminal Bench 2.0 基准测试上的实验数据：

| 对比维度                | 改善前        | 改善后                           | 变化           |
| ----------------------- | ------------- | -------------------------------- | -------------- |
| Terminal Bench 2.0 得分 | 52.8%         | 66.5%                            | **+13.7pp**    |
| 排名                    | 30+           | **Top 5**                        | 提升 25+ 位    |
| 模型                    | GPT-5.2-Codex | GPT-5.2-Codex                    | **未更换**     |
| 改了什么                | —             | 系统提示词 + 工具 + 中间件 Hooks | Harness 三变量 |

> 来源：[Improving Deep Agents with harness engineering](https://blog.langchain.com/improving-deep-agents-with-harness-engineering/)（2026 年 3 月）

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=YWJmMTNiZTEyMDllOWNjZTNkY2M5ZGZkMDFkZGM1ZDZfYTlYbmV0a3dFV2syaHZTZHQyMXNjVFpwVWh5YWhwc2FfVG9rZW46S0M0dGJLcDVYb1Y3QUx4N2hKN2M5NTBObkVwXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

  作为参照，同期如果是通过**换更强的模型**来提升成绩，通常能获得约 +6.8pp 的提升。也就是说：

> **改善 Harness 的效果（+13.7pp）是换模型的 2 倍（+6.8pp）。**

  这组数据彻底颠覆了"性能不够就换更大模型"的朴素直觉。对于大多数团队来说，优化 Harness 的投入产出比远高于追逐最新模型。

  LangChain 还发现了一个有趣的现象——**Reasoning Sandwich**：将推理预算设为 xhigh（最高）时，Agent 反而因为超时导致成绩下降（53.9%），设为 high 时得 63.6%。这说明**"推理越多越好"也是一个迷思**——过度推理不如适度推理 + 好的 Harness。

### 3.6 工程师角色的深层转变

  四大支柱和核心公式共同指向一个更大的命题：**工程师的角色正在发生根本性转变**。

  Mitchell Hashimoto 这样描述自己的新角色定位："我是软件项目的**架构师**。我仍然负责代码结构、数据流设计、状态管理。"但具体的代码编写，越来越多地交给了 Agent。

  用一个"厨师"的类比来理解这个转变：

- **过去**：厨师亲自做菜（工程师亲自写代码）
- **现在**：厨师设计菜单 + 训练厨房团队 + 检查每道菜的出品质量（工程师设计约束 + 配置环境 + 验证 Agent 的产出）

  **这不是降级，而是升级**——它需要更高层次的系统思维。你需要同时理解：Agent 擅长什么、哪里会犯错、怎样的约束能最小化错误、怎样的反馈循环能让系统越用越好。

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=YWE5ZTcxNTYzZDU1YTdiMTVhMGYwMTk0NWY1ZTkwNDFfMDdxaGNBMTE4M2ZvTVJCSVpodzZTZUdwSURlNTZ4UURfVG9rZW46TGVWVGIxRG5Yb1c5M3B4MUs1Z2M5eFVlbmVoXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

### 3.7 局限性与冷思考

  在兴奋之余，我们也需要保持清醒。Martin Fowler 团队（ThoughtWorks）在对 Harness Engineering 的分析中提出了两个尖锐的质疑：

1. **验证缺口**：Harness 擅长检查代码是否"合规"（风格、结构、类型），但对代码是否"正确"（功能逻辑是否对）的验证仍然不够。Linter 能抓住格式问题，但抓不住业务逻辑错误。
2. **遗留代码困境**：目前的成功案例几乎都是**从零开始的新项目**。对于已有数万行遗留代码的项目，如何设计 Harness 使 Agent 能在其中安全工作，还没有成熟的方法论。

> 来源：[Harness Engineering](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html) — Martin Fowler's Blog

  此外还有一个被反复验证的事实：**复杂度转移而非消失**。"写代码的复杂度"转移为"设计环境的复杂度"——Harness Engineering 没有让软件开发变简单，它让复杂度从一个地方搬到了另一个地方。只不过，这个新的地方更适合人类发挥系统思维的优势。

## §4 行业全景：案例、生态与展望

### 4.1 五大行业案例：从个人到企业的 Harness 实践

  理论讲完了，我们来看真实世界中谁在用 Harness Engineering、怎么用、效果如何。以下五个案例覆盖了从个人开发者到大型企业的不同规模：

| 案例                   | 规模         | 核心机制                               | Harness 载体              | 关键成果                        |
| ---------------------- | ------------ | -------------------------------------- | ------------------------- | ------------------------------- |
| **OpenAI Codex**       | 3→7 人       | 五原则 + 六层约束 + 垃圾回收           | AGENTS.md + 结构测试 + CI | 100 万行零手写，~10x 效率       |
| **Stripe Minions**     | 企业级       | Slack 触发 → Blueprint → CI → 人工审查 | ~500 MCP 工具 + CI/CD     | 1,300+ PRs/周                   |
| **LangChain**          | 开源项目     | Harness 三变量优化 + Doom Loop 检测    | 系统提示 + 工具 + 中间件  | 排名 30+ → Top 5（+13.7pp）     |
| **GStack (Garry Tan)** | 个人         | 28 角色 + Sprint 流程 + 纯 Markdown    | CLAUDE.md + 自定义 Skill  | 60 天 60 万行，48k GitHub Stars |
| **Peter Steinberger**  | 个人（极端） | 高信任模式 + 最小约束                  | 轻量 CLAUDE.md            | 月均 6,600 commit               |

#### ① OpenAI Codex：Agent-First 开发的规模化证明

  OpenAI Codex 团队是 Harness Engineering 的规模化标杆。他们的五大核心原则——深度优先工作法、给地图不给百科全书、机械化架构强制、让应用对 Agent 可读、自动垃圾回收——为整个行业提供了从理论到实践的完整范本。核心启示：**Harness Engineering 不是"锦上添花"，而是 Agent-First 开发模式的根基。** 没有精心设计的 Harness，3 个人不可能管住 Agent 产出 100 万行代码。

> 来源：[Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)

#### ② Stripe Minions：企业级 AI 工程的标杆

  Stripe 的 Minions 系统可能是目前企业级 Harness Engineering 最成熟的案例。工作流程是：工程师在 Slack 中给 issue 打一个表情 → Minion 自动接手 → 生成代码 + 测试 + 文档 → 经过 CI/CD 管线验证 → 提交 PR → **人类审查后合并**。

  关键数据：近 500 个 MCP 工具、每周 1,300+ PR、所有 PR 都经过人工审查但不含人工编写的代码。特别值得注意的是他们的 **Blueprint 机制**——每个 Minion 在动手前，先生成一份"蓝图"（包含实现计划、需要修改的文件、预期的测试），交由人类审批后才开始执行。这是"机械化约束"和"反馈循环"在企业级场景中的完美结合。

> 来源：[How Stripe built "minions"](https://www.lennysnewsletter.com/p/how-stripe-built-minionsai-coding)

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=MDQ3NTYwM2VkNmJkMjcxODk5MTI4YWY0MzY4OThhZWJfWDlxdjM2dHZKRUw3Mnk5ZUV4eWZRajJnMGhjWUlPbGVfVG9rZW46WnRoVGJxZFlzb2xKSW54Mm9JS2M2WVY3bnFjXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

#### ③ LangChain：不换模型只改 Harness 的逆袭

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=NWI4OWExOTRmMjhhZDk4NmI1YjhkZDlkYzZiZTJmODVfNVBMUTZXSVVtN1RHUGg4SjN4N1pyUDJsV3o1cXFYT1RfVG9rZW46RTIzS2JaOFFrb1pCU1F4a09FZWNUOUdUblBiXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

  LangChain 的案例之所以特别有说服力，是因为他们**控制了变量**：模型不变（GPT-5.2-Codex），只调整 Harness 的三个变量（系统提示词、工具、中间件 Hooks），结果排名从 30+ 跃升到 Top 5。他们的独特贡献包括 Doom Loop 检测中间件和 Reasoning Sandwich 推理预算优化。

> 来源：[Improving Deep Agents with harness engineering](https://blog.langchain.com/improving-deep-agents-with-harness-engineering/)

#### ④ GStack (Garry Tan)：个人开发者的 Harness 标杆

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=NGZiNDI4Njk1ZDBmY2IxYjBjM2VhNzhhZjAyZTExYzBfcGxpalVIQzRRV3JTUDFqbFphZmthOGJzMldKNVkwakdfVG9rZW46QmZud2J3cnlLb05VWjh4UHdUTGNCUm9kbmdjXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

  Y Combinator 总裁 Garry Tan 开源了他的 Claude Code 工作流 GStack，**48 小时内拿到 10,000 GitHub Stars**（截至本课发布时已超过 48k Stars）。

  GStack 的核心理念是"**流程而非工具集**"——28 个角色按 Sprint 顺序运行：Think → Plan → Build → Review → Test → Ship → Reflect。整个 Harness 都是纯 Markdown 文件，零代码依赖。Garry Tan 用这套流程在 60 天内产出了 60 万行代码（35% 是测试），同时还在全职管理 YC。

> 来源：[github.com/garrytan/gstack](https://github.com/garrytan/gstack)

#### ⑤ Peter Steinberger：高信任模式的极端案例

  Peter Steinberger（PSPDFKit 创始人）月均 6,600 次 commit，代表了 Harness Engineering 的另一个极端——**最小约束、最大信任**。他几乎不使用复杂的 Hook 体系，而是通过极其精炼的 CLAUDE.md 和深度的项目理解来引导 Agent。

> 注：这是极端案例，不建议初学者模仿。Steinberger 对项目有极深的理解，能快速判断 Agent 的产出是否正确。大多数人需要更强的约束和反馈循环。

#### 五案例推荐参考

- **个人开发者** → 参考 GStack（流程清晰、上手门槛低、纯 Markdown）
- **团队协作** → 参考 Stripe Minions（CI/CD 集成、人工审查、MCP 工具链）
- **学习方法论** → 参考 LangChain（控制变量实验、数据驱动优化）
- **理解极限** → 参考 OpenAI Codex（Agent-First 的天花板在哪）

> 诚实说明：以上案例多为从零开始的新项目或绿地开发。对于已有大量遗留代码的项目，Harness Engineering 的落地难度更高，成功案例还较少。

### 4.2 五平台 Harness 机制对比

  Harness Engineering 的理念是平台无关的，但不同 AI 智能体工具提供的 Harness 能力差异很大。以下是五个主流平台的横向对比——我们特别加入了 OpenClaw，因为它代表了一类与 Claude Code / Cursor 完全不同的智能体形态：通过即时通讯平台（飞书、钉钉、Telegram 等）交互的通用智能体。

| 维度          | Claude Code                 | OpenAI Codex              | Cursor             | Zed       | OpenClaw                |
| ------------- | --------------------------- | ------------------------- | ------------------ | --------- | ----------------------- |
| **定位**      | CLI 编程智能体              | 云端编程智能体            | IDE 编程助手       | 编辑器 AI | 通用智能体平台          |
| **导航文件**  | CLAUDE.md（3 层）           | AGENTS.md                 | `.cursorrules`     | —         | 系统提示词 + 角色预设   |
| **约束机制**  | Hooks（24 事件×4 种处理器） | 结构测试 + 自定义 Linter  | Rules（项目/全局） | —         | 插件权限控制            |
| **反馈循环**  | Hooks + 自动测试            | CI/CD + Linter 回传       | —                  | —         | 对话式反馈              |
| **工具扩展**  | MCP + Skills                | MCP（评估过但未深度采用） | MCP                | MCP       | 插件系统（200+ 插件）   |
| **会话管理**  | Compaction + `/compact`     | Thread（创建/恢复/分叉）  | —                  | —         | 多平台会话 + 上下文记忆 |
| **Sub-agent** | ✅ YAML frontmatter 自定义   | ❌                         | ❌                  | ❌         | ✅ 工作流编排            |
| **持久记忆**  | ✅ memory scope              | ❌                         | ❌                  | ❌         | ✅ 对话历史持久化        |
| **开放程度**  | CLI 开源                    | codex-rs 开源             | 闭源               | 开源      | 开源（33 万+ Stars）    |

> 数据来源：各平台截至 2026 年 3 月的官方文档。Harness 功能发展很快，建议以最新文档为准。

  从上表可以看出一个有趣的分野：

  **Claude Code 和 OpenAI Codex** 代表了"深度 Harness"路线——它们提供了精细的生命周期钩子、结构化约束和自动化反馈机制，适合需要高度控制的编程场景。Claude Code 目前是 Harness 能力最完整的平台——24 个 Hook 事件覆盖了 Agent 生命周期的几乎每个节点，Sub-agent + 持久记忆是其独有能力。

  **OpenClaw** 代表了"广度覆盖"路线——它的 Harness 机制相对轻量（主要依赖系统提示词和插件权限控制，没有 Claude Code 那样精细的 Hook 系统），但它的核心优势在于**覆盖面**：支持十余个即时通讯平台、200 多个插件、多家模型提供商。对于非编程场景（客服、运营、内容管理），OpenClaw 的"轻 Harness + 广覆盖"模式可能比 Claude Code 的"深 Harness + 精控制"模式更实用。

  **Cursor** 的 Rules 系统是轻量替代，适合只需要基础约束的 IDE 编程场景。**Zed** 目前 Harness 能力最弱，但作为开源编辑器，未来有社区扩展的潜力。

### 4.3 应用前景与冷思考

  Harness Engineering 才诞生 7 周，前景令人兴奋但也需要保持清醒。

#### 应用前景光谱

| 领域                  | 成熟度     | 说明                                            |
| --------------------- | ---------- | ----------------------------------------------- |
| 软件开发              | ✅ 成熟     | OpenAI、Stripe、LangChain 已大规模验证          |
| 内容生成              | ✅ 有前景   | Anthropic 的 GAN 式架构展示了自主创意生成的可能 |
| 创意工作              | ⚠️ 需探索   | 博物馆案例展示了潜力，但 Agent 仍倾向"安全设计" |
| 专业领域（医疗/法律） | ❌ 暂不适用 | 验证缺口问题在高风险领域更加突出                |

#### Bitter Lesson 的三条设计原则

1. **Start Simple**：不要一上来就搞复杂的控制流，先提供稳健的原子工具
2. **Build to Delete**：模块化架构，随时准备替换——今天需要复杂管线的任务，明天可能一个提示词就搞定
3. **The Harness is the Dataset**：竞争优势来自捕获的执行轨迹（trajectories），而不是提示词本身

## §5 扩展阅读：6 篇重磅博文导读

  前面的理论讲解大量引用了 OpenAI 和 Anthropic 的 6 篇技术博文。如果你想深入原文，以下导读帮助你快速抓住每篇文章的核心价值——**先看关键观点，再决定是否花时间读全文**。

### 5.1 OpenAI 三篇博文

#### 博文一：Harness Engineering 方法论

> 原文：[Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)（2026 年 2 月）

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=OTRlMTc0MDYyZGRmYWVhNWQyNzBjZDAzYjNjNGEwODNfY1FpeHhndGRlak1kVkpGUHBaSENTUHpyTXZWOEw5aHlfVG9rZW46VzVrRWJ5dk5vb1l1eHp4ZHhyTGNvbU5vbjFjXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

  **价值定位**：整个 Harness Engineering 的方法论宣言，也是价值密度最高的一篇。

  **关键数据**：3 人团队 × 5 个月 = 100 万行代码、~1,500 PR、零行手写。

  **五大核心原则速览**：

| 原则                | 一句话精华                                                   |
| ------------------- | ------------------------------------------------------------ |
| 深度优先工作法      | 不给 Agent 宏大目标，而是分解为小的构建块逐个攻克            |
| 给地图不给百科全书  | AGENTS.md 约 100 行做导航，详细文档放在 docs/ 目录           |
| 机械化架构强制      | 六层分级约束（Types→Config→Repo→Service→Runtime→UI），自动验证 |
| 让应用对 Agent 可读 | Git worktree 独立实例 + Chrome DevTools 集成 + 本地可观测性  |
| 自动垃圾回收        | 品味编码为 linter 规则，后台 Agent 定期清理——"品味捕获一次，强制执行无限次" |

  **必读金句**："我们的工作是**使 Agent 能够做有用的工作**。"——这不是委婉说法，是对工程师角色的重新定义。

#### 博文二：App Server 架构

> 原文：[Unlocking the Codex harness: how we built the App Server](https://openai.com/index/unlocking-the-codex-harness/)

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=NWIwZGZjODVhMGMyZmViYWM5MTIyMzJmZjlmNzJlYTNfcGpqRUtmZzY3RVpPempyV1NuSGRzazh1MkNtQkF2dmlfVG9rZW46V3RrYmJxWGg4bzdjUm94b1RTSmNOd1dObjhlXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

  **价值定位**：回答"怎么让一个 Agent 引擎同时驱动 CLI、VS Code、Web 等六个平台"。

  **关键技术选型**：Rust 实现（codex-rs），JSON-RPC 2.0 via stdio JSONL 通信协议，三层会话模型（Item → Turn → Thread 支持暂停/恢复/分叉）。

  **必读观点**：OpenAI 评估过 MCP 但选择不用——MCP 的工具导向模型不适合更丰富的会话语义（流式 diff、审批流、线程持久化）。这意味着 **MCP 虽然是热点，但不是万能方案**。

#### 博文三：Agent Loop 解析

> 原文：[Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/)

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=ZmJmMDQ0YzdlOGFiYWI1YTE4MjE1OGY0NzliMjk5N2NfZ05xb2FkMUFTV2xuQ1Vqd3V0N1c3Yno2aW56c012MzJfVG9rZW46RHBkOWI1TVNkb2Z3Qk54UlpPaGNJdEsyblhlXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

  **价值定位**：揭示 Agent 不是"一次推理"而是"持续循环"——理解循环的每个阶段，才能在正确的位置插入 Harness 组件。

  **五阶段循环**：意图分析 → 工具选择 → 工具执行 → 结果集成 → 终止判断。CLAUDE.md 影响第①阶段，PreToolUse Hooks 拦截②→③过渡，PostToolUse Hooks 处理③→④过渡。

  **必读观点**：Agent 的主要产出是**代码而非文本**——每个工具调用都可能修改本地环境。设计 Harness 时，验证重点应放在"产出的代码是否正确"，而不是"回复的文字是否好听"。

### 5.2 Anthropic 三篇博文

#### 博文四：Context Engineering 理论基础

> 原文：[Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)（2025 年 9 月）

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=ZjBhM2M5MDgxZDgzZmU3NjA4MmNiNzBjMTkyYjRiYThfNVhnbWpFODZ4cVBJSGUyY0VOUHE0QkFIZGU3Y1RzWm1fVG9rZW46UktiQmJtUHNob21oRUZ4SkRMMWNZdVk2bjhkXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

  **价值定位**：Context Engineering 的系统方法论，Harness Engineering 的理论前身。

  **核心观点**：**注意力是有限资源，上下文越多不代表越好。** 发现了 Context Rot（上下文腐烂）现象——随着 token 增加，模型对早期信息的回忆准确率反而下降。

  **指导哲学**：找到"最小的高信号 token 集合，最大化期望结果的可能性"。不是塞得越满越好，而是越精越好。

  **必读实践**：Just-in-Time 上下文检索——不预加载所有数据，运行时按需动态加载。CLAUDE.md 在启动时注入静态上下文，glob/grep 工具提供运行时动态检索，静态 + 动态的混合才是最优解。

#### 博文五：长时运行 Agent 的 Harness 实践

> 原文：[Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)（2025 年 11 月）

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=YzkyZmFkZjM2NDEyMTBkMGQyOTU3ZDNiOThmNzMzNWVfZmttOGdETWZSSW1EazE5elM0WHQwMTY4Tm1qWVhpQlBfVG9rZW46QTY3a2J0S0dwb0JvN1J4SUc2TWN5bWJTbmZkXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

  **价值定位**：从理论到工程实践的跨越——解决"Agent 重启后记忆断裂"问题。

  **核心比喻**：Agent 的每个新会话就像"轮班的工程师没有交接记录"。Harness 的核心价值不是让 Agent"更聪明"，而是**设计"交接制品"**。

  **必读实践**：两阶段会话协议（Initializer Agent + Coding Agent）、JSON 格式功能清单（防篡改）、Git 作为进度追踪、Puppeteer MCP 端到端测试。

#### 博文六：GAN 式三 Agent 架构

> 原文：[Harness Design for Long-Running Application Development](https://www.anthropic.com/engineering/harness-design-long-running-apps)（2026 年 3 月 24 日）

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=ZjQ4ZDI4M2I2NzY4ZmY4ZWQ0YzQxM2RmODg5YTE2OTJfQ0JDcmVkbDJIdW1WUUJ0NHFrREpRVklzYnN0Nk52eWJfVG9rZW46U1h3NmJRb2FzbzVnQTR4enREbmNYMG56bkNjXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

![img](https://kq4b3vgg5b.feishu.cn/space/api/box/stream/download/asynccode/?code=ZjcyMTM0MDE5ZjIzYjUwNTA3OTIwNjdmNTE4MTk1YzJfNTUzOGZMMlBiU2ZGM2M3NXI0WmZiSVJ6bmJxV2VSdmxfVG9rZW46VW1UMGJQQ2Zib1k3bUR4dG9DemN6eGtKbmhmXzE3NzU3ODc5NjQ6MTc3NTc5MTU2NF9WNA)

  **价值定位**：目前最前沿的 Harness 设计——受 GAN 启发的三 Agent 协作架构（Planner + Generator + Evaluator）。

  **核心创新**：评估与生成彻底分离——"调校独立评估者的怀疑度，比让生成者对自己的工作保持批判性要容易得多。"四维评分（Design Quality、Originality、Craft、Functionality），故意在 Claude 不擅长的维度上加高权重，倒逼突破。

  **震撼数据**：Solo Agent 20 分钟/$$9 产出外观精美但游戏不可玩；Full Harness 6 小时$$200 产出物理引擎正常、可玩关卡、AI 自动内容生成。**时间和成本高了一个量级，但产出从 demo 变成了产品。**

  **必读观点**：好的 Harness 不只防错，还能**激发创造力**。博物馆网站项目中，Generator 到第 10 轮迭代时主动放弃初始设计，重新构想出 3D 房间的创意方案。

> 注：第三篇的 GAN 式架构属于实验性探索，不是生产环境建议。但其中的设计思想（评估与生成分离、Sprint Contract 协商）有很强的借鉴价值。

### 学习资源汇总

| 资源                              | 链接                                                         | 说明                               |
| --------------------------------- | ------------------------------------------------------------ | ---------------------------------- |
| OpenAI Harness Engineering 方法论 | [openai.com/index/harness-engineering](https://openai.com/index/harness-engineering/) | 核心方法论 + 震撼数据              |
| OpenAI App Server 架构            | [openai.com/index/unlocking-the-codex-harness](https://openai.com/index/unlocking-the-codex-harness/) | Rust + JSON-RPC 架构解析           |
| OpenAI Agent Loop                 | [openai.com/index/unrolling-the-codex-agent-loop](https://openai.com/index/unrolling-the-codex-agent-loop/) | Agent 循环五阶段                   |
| Anthropic Context Engineering     | [anthropic.com/.../effective-context-engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | 上下文工程理论基础                 |
| Anthropic Long-Running Agents     | [anthropic.com/.../effective-harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) | 长时运行 Harness 实践              |
| Anthropic GAN 式架构              | [anthropic.com/.../harness-design-long-running-apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) | 三 Agent 协作前沿探索              |
| Mitchell Hashimoto 实践博文       | [mitchellh.com/writing/my-ai-adoption-journey](https://mitchellh.com/writing/my-ai-adoption-journey) | 概念命名 + 个人实践                |
| GStack by Garry Tan               | [github.com/garrytan/gstack](https://github.com/garrytan/gstack) | Claude Code 开发流程 Starter Kit   |
| LangChain Terminal Bench 2.0      | [blog.langchain.com/...](https://blog.langchain.com/improving-deep-agents-with-harness-engineering/) | Harness 改进 +13.7pp 完整数据      |
| Claude Code 官方文档              | [docs.anthropic.com](https://docs.anthropic.com)             | Hooks/Sub-agent/CLAUDE.md 最新配置 |

- 