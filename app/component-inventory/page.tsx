import { componentInventory, getComponentCount } from "@/lib/components-inventory"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/library/card"
import { Badge } from "@/components/library/badge"

export default function ComponentInventoryPage() {
    const counts = getComponentCount()

    return (
        <div className="container mx-auto py-10 space-y-8">
            <header className="space-y-4">
                <h1 className="text-4xl font-bold text-forest-canopy">Component Inventory</h1>
                <p className="text-xl text-muted-foreground">
                    Tracking installation status of all library components.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Components" count={counts.total} color="bg-forest-canopy text-white" />
                <StatCard title="shadcn/ui" count={counts.shadcn} color="bg-sky-blue text-white" />
                <StatCard title="MagicUI" count={counts.magicui} color="bg-sunrise-orange text-white" />
                <StatCard title="CultUI & ReactBits" count={counts.cultui + counts.reactbits} color="bg-honey-amber text-white" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                        shadcn/ui <Badge variant="outline">{counts.shadcn}</Badge>
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        {Object.entries(componentInventory.shadcn).map(([category, items]) => (
                            <Card key={category}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg capitalize">{category}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {items.map(item => (
                                            <Badge key={item} variant="secondary" className="font-mono">
                                                {item}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                <section className="space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                            MagicUI <Badge variant="outline">{counts.magicui}</Badge>
                        </h2>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex flex-wrap gap-2">
                                    {componentInventory.magicui.map(item => (
                                        <Badge key={item} variant="secondary" className="font-mono">
                                            {item}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                            CultUI <Badge variant="outline">{counts.cultui}</Badge>
                        </h2>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex flex-wrap gap-2">
                                    {componentInventory.cultui.map(item => (
                                        <Badge key={item} variant="secondary" className="font-mono">
                                            {item}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                            ReactBits <Badge variant="outline">{counts.reactbits}</Badge>
                        </h2>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex flex-wrap gap-2">
                                    {componentInventory.reactbits.map(item => (
                                        <Badge key={item} variant="secondary" className="font-mono">
                                            {item}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </div>
        </div>
    )
}

function StatCard({ title, count, color }: { title: string, count: number, color: string }) {
    return (
        <Card className={`${color} border-none`}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-90">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold">{count}</div>
            </CardContent>
        </Card>
    )
}
