import { ArrowRightIcon, BotIcon, FileImageIcon, FileTextIcon, GaugeIcon, LayersIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react"
import { LandingAuthActions } from "@/components/landing-auth-actions"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  { icon: FileTextIcon, title: "智能大纲", description: "输入主题、受众和页数，自动生成结构清晰的演示文稿大纲。" },
  { icon: FileImageIcon, title: "页面生成", description: "根据每页大纲生成可预览的高保真 PPT 页面，支持并发提速。" },
  { icon: LayersIcon, title: "PPTX 导出", description: "确认内容与版式后，一键打包导出标准 PPTX 文件。" },
  { icon: ShieldCheckIcon, title: "后台管理", description: "支持用户、用户组、额度、模型和存储配置，适合团队部署。" },
]

export default function Page() {
  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-4 py-6 md:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <SparklesIcon />
            </div>
            <div>
              <p className="font-semibold leading-none">AI PPT Generator</p>
              <p className="mt-1 text-xs text-muted-foreground">智能演示文稿创作平台</p>
            </div>
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex">AI-first presentation workflow</Badge>
        </header>

        <section className="grid flex-1 items-center gap-8 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <Badge variant="outline" className="mb-5">
              <BotIcon data-icon="inline-start" />
              从主题到 PPTX 的完整生成链路
            </Badge>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
              用 AI 更快完成可交付的演示文稿
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              输入演示主题，自动规划大纲、生成每页视觉内容，并导出标准 PPTX。管理员可统一配置模型、用户组、额度和页面生成并发数。
            </p>
            <div className="mt-8">
              <LandingAuthActions />
            </div>
            <div className="mt-8 grid w-full max-w-xl grid-cols-3 gap-3 text-left">
              <Metric label="工作流" value="3 步" />
              <Metric label="并发生成" value="可配置" />
              <Metric label="部署方式" value="自托管" />
            </div>
          </div>

          <Card className="overflow-hidden border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>控制台预览</CardTitle>
                  <CardDescription>围绕 PPT 生成流程设计的轻量工作台。</CardDescription>
                </div>
                <GaugeIcon className="text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {[
                ["01", "主题输入", "定义主题、受众、页数和视觉风格"],
                ["02", "架构审核", "可视化调整每一页的目的与要点"],
                ["03", "PPT 预览与导出", "生成页面、复制源码或导出 PPTX"],
              ].map(([step, title, description]) => (
                <div key={step} className="rounded-xl border bg-background/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">{step}</div>
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                <ArrowRightIcon />
                登录后进入控制台继续创建、管理和导出你的 PPT。
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 pb-10 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/60 bg-card/70 shadow-sm">
              <CardHeader>
                <feature.icon className="text-primary" />
                <CardTitle className="text-base">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card/60 p-3 text-center">
      <p className="text-lg font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
