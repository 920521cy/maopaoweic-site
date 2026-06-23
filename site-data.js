window.SITE_DATA = {
  products: [
    {
      id: "prod-n8n-content-flow",
      slug: "n8n-content-flow",
      title: "n8n 内容流模板",
      description: "面向个人内容记录的自动化流程示例，覆盖选题、整理、提醒和归档节点。",
      longDescription: "该模板用于把内容生产流程拆成可执行节点，方便后续接入真实的自动化平台和个人知识库。当前为静态演示商品，用于验证商品数据结构和详情页渲染。",
      price: "¥29",
      tags: ["n8n workflow", "Automation"],
      category: "AI 自动化模板",
      delivery: ["工作流结构说明", "节点配置清单", "使用步骤和调整建议"],
      audience: ["想尝试 n8n 自动化的个人创作者", "需要整理 AI 实验记录的独立开发者", "希望把重复流程模板化的站点维护者"],
      status: "演示商品",
      featured: true
    },
    {
      id: "prod-ai-lab-components",
      slug: "ai-lab-components",
      title: "AI Lab 页面组件包",
      description: "适合个人实验站的深色卡片、项目展示、FAQ 和联系区域静态组件。",
      longDescription: "围绕个人 AI 实验室风格整理的静态页面组件包，适合用于个人项目站、作品记录页和轻量资源展示页。",
      price: "¥39",
      tags: ["HTML/CSS", "Web Lab"],
      category: "网站组件",
      delivery: ["静态组件结构", "样式组织建议", "页面组合示例"],
      audience: ["正在搭建个人主页的独立开发者", "需要深色科技风组件的站点维护者", "想快速整理项目展示页面的创作者"],
      status: "演示商品",
      featured: true
    },
    {
      id: "prod-codex-workflow-notes",
      slug: "codex-workflow-notes",
      title: "Codex 协作流程笔记",
      description: "从需求说明、页面实现、验证检查到部署复盘的轻量实践记录。",
      longDescription: "记录使用 AI 编程助手完成静态网站迭代的流程，包括需求拆解、代码修改、页面检查和发布前确认。",
      price: "¥19",
      tags: ["Codex", "教程"],
      category: "教程资源包",
      delivery: ["协作流程说明", "检查清单模板", "复盘记录示例"],
      audience: ["想学习 AI 协作开发流程的用户", "需要项目检查清单的站点维护者", "希望沉淀开发记录的个人开发者"],
      status: "演示商品",
      featured: true
    },
    {
      id: "prod-agent-board",
      slug: "agent-board",
      title: "个人 Agent 任务清单",
      description: "用于整理 Agent 任务拆解、工具调用边界和输出检查标准的模板。",
      longDescription: "面向个人智能体实验的任务拆解模板，帮助记录目标、输入、执行边界、输出格式和检查步骤。",
      price: "¥49",
      tags: ["Agent", "Prompt"],
      category: "AI Agent",
      delivery: ["任务拆解模板", "输出检查清单", "Agent 实验记录格式"],
      audience: ["正在尝试个人 Agent 的用户", "需要规范提示词流程的创作者", "希望复盘 AI 自动化任务的人"],
      status: "演示商品",
      featured: false
    },
    {
      id: "prod-site-structure-review",
      slug: "site-structure-review",
      title: "个人网站结构诊断",
      description: "围绕独立开发站点的信息架构、展示节奏和上线检查做一次轻量梳理。",
      longDescription: "用于演示咨询服务类商品的信息结构，后续可接入预约、订单和交付记录。",
      price: "¥99",
      tags: ["独立开发", "咨询"],
      category: "咨询服务",
      delivery: ["站点结构建议", "首页信息层级反馈", "上线检查清单"],
      audience: ["已有个人站但结构不清晰的用户", "准备上线作品集的独立开发者", "希望优化展示节奏的创作者"],
      status: "演示商品",
      featured: false
    },
    {
      id: "prod-ai-tools-archive",
      slug: "ai-tools-archive",
      title: "AI 工具实验记录包",
      description: "用于记录 GPT、Gemini、图像工具和网页生成实验结果的归档模板。",
      longDescription: "把不同 AI 工具的输入、输出、评价和复盘整理成统一记录格式，方便长期沉淀个人实验资产。",
      price: "¥29",
      tags: ["AI Tools", "记录"],
      category: "多模态",
      delivery: ["实验记录模板", "工具对比表", "阶段性复盘格式"],
      audience: ["经常测试 AI 工具的用户", "需要整理实验素材的创作者", "希望沉淀工作流的人"],
      status: "演示商品",
      featured: false
    }
  ],
  demoOrders: [
    {
      id: "LAB-2026-001",
      productTitle: "n8n 内容流模板",
      amount: "¥29",
      status: "待接入支付系统",
      createdAt: "2026-06-23 09:30",
      label: "演示数据"
    },
    {
      id: "LAB-2026-002",
      productTitle: "AI Lab 页面组件包",
      amount: "¥39",
      status: "待发货演示",
      createdAt: "2026-06-23 10:12",
      label: "演示数据"
    },
    {
      id: "LAB-2026-003",
      productTitle: "Codex 协作流程笔记",
      amount: "¥19",
      status: "已记录演示",
      createdAt: "2026-06-23 11:05",
      label: "演示数据"
    }
  ],
  demoCards: [
    {
      id: "CARD-DEMO-001",
      productTitle: "n8n 内容流模板",
      status: "演示库存",
      maskedCode: "****-****-DEMO",
      stock: 12,
      count: 12,
      note: "安全占位符，不包含真实卡密。"
    },
    {
      id: "CARD-DEMO-002",
      productTitle: "AI Lab 页面组件包",
      status: "待导入演示",
      maskedCode: "****-****-DEMO",
      stock: 0,
      count: 0,
      note: "后续接入数据库后显示库存统计。"
    },
    {
      id: "CARD-DEMO-003",
      productTitle: "Codex 协作流程笔记",
      status: "演示库存",
      maskedCode: "****-****-DEMO",
      stock: 6,
      count: 6,
      note: "仅用于静态页面展示。"
    }
  ]
};
