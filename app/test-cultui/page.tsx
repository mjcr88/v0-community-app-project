import { Expandable } from "@/components/library/expandable"
import { FeatureCarousel } from "@/components/library/feature-carousel"
import { Card, CardContent } from "@/components/library/card"

export default function TestCultUIPage() {
    return (
        <div className="container mx-auto py-10 space-y-12">
            <header>
                <h1 className="text-4xl font-bold text-forest-canopy mb-4">CultUI Components</h1>
            </header>

            <section className="space-y-8">
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Expandable Card</h2>
                    <div className="h-[400px] w-full flex items-center justify-center bg-muted/20 rounded-xl">
                        <p className="text-muted-foreground">Expandable component demo placeholder (requires complex setup)</p>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-semibold mb-4">Feature Carousel</h2>
                    <div className="w-full max-w-4xl mx-auto">
                        {/* FeatureCarousel usually requires specific props, using placeholder if types are complex */}
                        <Card>
                            <CardContent className="p-6 text-center">
                                <p>Carousel Component Installed</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    )
}
