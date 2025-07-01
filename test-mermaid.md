# Mermaid 图表点击放大测试

这个文档用于测试 Mermaid 图表的点击放大功能。

## 流程图测试

点击下面的流程图可以放大查看：

```mermaid
graph TD
    A[开始] --> B{判断条件}
    B -->|是| C[执行操作A]
    B -->|否| D[执行操作B]
    C --> E[记录日志]
    D --> E
    E --> F[结束]
    
    style A fill:#e1f5fe
    style F fill:#f3e5f5
    style B fill:#fff3e0
```

## 时序图测试

点击下面的时序图可以放大查看：

```mermaid
sequenceDiagram
    participant 用户
    participant 前端
    participant 后端
    participant 数据库
    
    用户->>前端: 点击图表
    前端->>前端: 显示放大对话框
    前端->>后端: 请求图表数据
    后端->>数据库: 查询数据
    数据库-->>后端: 返回数据
    后端-->>前端: 返回图表数据
    前端-->>用户: 显示放大的图表
```

## 饼图测试

点击下面的饼图可以放大查看：

```mermaid
pie title 功能使用统计
    "查看文档" : 45
    "编辑文档" : 25
    "导出文档" : 15
    "分享文档" : 10
    "其他" : 5
```

## 甘特图测试

点击下面的甘特图可以放大查看：

```mermaid
gantt
    title 项目开发时间线
    dateFormat  YYYY-MM-DD
    section 设计阶段
    需求分析           :a1, 2024-01-01, 30d
    界面设计           :a2, after a1, 20d
    section 开发阶段  
    前端开发           :b1, 2024-02-01, 45d
    后端开发           :b2, 2024-02-15, 30d
    section 测试阶段
    功能测试           :c1, after b1, 15d
    性能测试           :c2, after b2, 10d
```

## 类图测试

点击下面的类图可以放大查看：

```mermaid
classDiagram
    class MarkdownViewer {
        +String filePath
        +Boolean loading
        +String content
        +Array toc
        +loadContent()
        +generateToc()
        +scrollToHeading()
    }
    
    class MermaidChart {
        +String chart
        +String svg
        +Boolean isLoading
        +Boolean isDialogOpen
        +renderChart()
        +downloadSvg()
    }
    
    class FileTree {
        +Array files
        +String currentPath
        +loadFiles()
        +selectFile()
    }
    
    MarkdownViewer --> MermaidChart : contains
    MarkdownViewer --> FileTree : uses
```

## 测试说明

每个图表都应该具备以下功能：

1. **点击图表本身** - 打开放大对话框
2. **点击放大按钮** - 打开放大对话框  
3. **点击下载按钮** - 下载 SVG 格式的图表
4. **在对话框中下载** - 在放大对话框中也可以下载

### 预期行为

- 图表应该有悬停效果
- 点击图表任意位置都能打开对话框
- 对话框应该居中显示
- 对话框中的图表应该保持清晰度
- 下载的 SVG 文件应该包含完整的图表内容 