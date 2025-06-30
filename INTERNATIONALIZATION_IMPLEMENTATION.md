# 国际化和主题切换实现说明

## 已实现的功能

### 🌐 国际化支持
- ✅ 使用 `next-intl` 实现完整的国际化支持
- ✅ 支持中文(zh)和英文(en)两种语言
- ✅ 动态语言切换，无需页面刷新
- ✅ 路由级别的国际化 (`/zh`, `/en`)
- ✅ 所有UI组件的文本国际化

### 🌙 主题切换
- ✅ 使用 `next-themes` 实现主题系统
- ✅ 支持浅色/深色/系统主题
- ✅ 平滑的主题切换动画
- ✅ 主题状态持久化

### 📚 新增功能
- ✅ 英文版 README.md
- ✅ 主题切换按钮
- ✅ 语言切换按钮
- ✅ 完整的翻译文件

## 文件结构变化

```
新增文件:
├── src/
│   ├── i18n/
│   │   ├── request.ts          # 国际化请求配置
│   │   └── routing.ts          # 路由配置
│   ├── middleware.ts           # 国际化中间件
│   └── components/
│       ├── ThemeProvider.tsx   # 主题提供者
│       ├── ThemeToggle.tsx     # 主题切换组件
│       └── LanguageToggle.tsx  # 语言切换组件
├── messages/
│   ├── zh.json                 # 中文翻译
│   └── en.json                 # 英文翻译
└── README.en.md                # 英文版README

修改文件:
├── src/app/
│   ├── [locale]/               # 国际化路由结构
│   │   ├── layout.tsx          # 语言布局
│   │   ├── page.tsx            # 主页面
│   │   └── api/                # 国际化API路由
│   ├── layout.tsx              # 根布局更新
│   └── page.tsx                # 根页面重定向
├── next.config.ts              # 添加next-intl配置
├── package.json                # 新增依赖
└── README.md                   # 更新中文README
```

## 核心实现

### 1. 国际化配置

**路由配置** (`src/i18n/routing.ts`):
```typescript
export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'zh'
});
```

**请求配置** (`src/i18n/request.ts`):
```typescript
export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
```

### 2. 中间件设置

**中间件** (`src/middleware.ts`):
```typescript
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(zh|en)/:path*']
};
```

### 3. 主题系统

**主题提供者** (`src/components/ThemeProvider.tsx`):
```typescript
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

**主题切换** (`src/components/ThemeToggle.tsx`):
```typescript
export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const t = useTranslations('Theme')

  return (
    <Button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
```

### 4. 语言切换

**语言切换** (`src/components/LanguageToggle.tsx`):
```typescript
export function LanguageToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()

  const toggleLanguage = () => {
    const newLocale = locale === 'zh' ? 'en' : 'zh'
    const pathnameWithoutLocale = pathname.startsWith(`/${locale}`) 
      ? pathname.slice(locale.length + 1) 
      : pathname
    router.push(`/${newLocale}${pathnameWithoutLocale}`)
  }

  return <Button onClick={toggleLanguage}>...</Button>
}
```

### 5. 组件国际化

所有组件都已更新为使用 `useTranslations` 钩子:

```typescript
const t = useTranslations('Navigation')
return <h1>{t('title')}</h1>
```

### 6. API路由更新

API路由已移动到国际化结构下:
- `/api/filetree` → `/[locale]/api/filetree`  
- `/api/file/[...filename]` → `/[locale]/api/file/[...filename]`

组件中的API调用已更新为使用当前语言:
```typescript
const locale = useLocale()
const response = await fetch(`/${locale}/api/filetree`)
```

## 翻译内容

### 中文翻译 (messages/zh.json)
包含所有UI元素的中文翻译，如导航、主题、语言切换、文件树、Markdown查看器等。

### 英文翻译 (messages/en.json)  
对应的英文翻译，保持与中文版本的结构一致。

## 使用方法

### 访问应用
- 中文版: `http://localhost:3000/zh`
- 英文版: `http://localhost:3000/en`
- 根路径: `http://localhost:3000` (自动重定向到 `/zh`)

### 切换语言
点击页面右上角的语言切换按钮（🌐图标）

### 切换主题
点击页面右上角的主题切换按钮（☀️/🌙图标）

## 技术特点

1. **类型安全**: 所有翻译都有TypeScript类型支持
2. **性能优化**: 按需加载翻译文件
3. **SEO友好**: 每种语言都有独立的URL
4. **响应式**: 主题和语言切换在所有设备上都能正常工作
5. **持久化**: 主题偏好会被保存到localStorage

## 扩展指南

### 添加新语言
1. 在 `src/i18n/routing.ts` 中添加新语言代码
2. 创建对应的翻译文件 `messages/[locale].json`
3. 更新语言切换组件（如需要）

### 添加新翻译
1. 在翻译文件中添加新的键值对
2. 在组件中使用 `t('newKey')` 调用

### 自定义主题
1. 修改 `src/app/globals.css` 中的CSS变量
2. 或者在 `ThemeProvider` 中添加新的主题选项 