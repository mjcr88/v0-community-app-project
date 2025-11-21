import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getButtonStateClasses } from "@/lib/design-system/component-states"

export default function AccessibilityTestPage() {
    return (
        <div className="container mx-auto py-10 space-y-10">
            <header className="space-y-4">
                <h1 className="text-3xl font-bold text-foreground">WP2 Design System & Accessibility Test</h1>
                <p className="text-lg text-muted-foreground">
                    Verifying design tokens, component states, and WCAG AA compliance.
                </p>
            </header>

            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">1. Color Contrast Tests</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-lg bg-background border border-border">
                        <h3 className="text-lg font-medium mb-2">Light Mode (Default)</h3>
                        <div className="space-y-2">
                            <div className="p-4 bg-earth-cloud text-earth-soil rounded">
                                <span className="font-bold">Text: Rich Soil</span> on Cloud Background
                                <div className="text-xs mt-1">Expected Ratio: 14.5:1 (Pass)</div>
                            </div>
                            <div className="p-4 bg-earth-cloud text-forest-canopy rounded">
                                <span className="font-bold">Text: Forest Canopy</span> on Cloud Background
                                <div className="text-xs mt-1">Expected Ratio: 5.8:1 (Pass)</div>
                            </div>
                            <div className="p-4 bg-sunlight text-sunrise-orange rounded">
                                <span className="font-bold">Text: Sunrise Orange</span> on Sunlight Background
                                <div className="text-xs mt-1">Expected Ratio: 4.6:1 (Pass)</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-lg bg-soil border border-stone dark">
                        <h3 className="text-lg font-medium mb-2 text-sunlight">Dark Mode Context</h3>
                        <div className="space-y-2">
                            <div className="p-4 bg-soil text-sunlight rounded border border-stone">
                                <span className="font-bold">Text: Sunlight</span> on Deep Soil
                                <div className="text-xs mt-1">Expected Ratio: 15.8:1 (Pass)</div>
                            </div>
                            <div className="p-4 bg-soil text-forest-growth rounded border border-stone">
                                <span className="font-bold">Text: Forest Growth</span> on Deep Soil
                                <div className="text-xs mt-1">Expected Ratio: 6.1:1 (Pass)</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">2. Component States & Keyboard Navigation</h2>
                <p className="text-muted-foreground">Tab through these elements. Focus rings should be clearly visible (2px forest-canopy).</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Buttons</h3>
                        <div className="flex flex-col gap-3 items-start">
                            <Button>Primary Default</Button>
                            <Button state="hover">Primary Hover (Forced)</Button>
                            <Button state="active">Primary Active (Forced)</Button>
                            <Button disabled>Primary Disabled</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="destructive">Destructive</Button>
                            <Button variant="outline">Outline</Button>
                            <Button variant="ghost">Ghost</Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Inputs</h3>
                        <div className="space-y-3 max-w-xs">
                            <div className="space-y-1">
                                <label htmlFor="input-default" className="text-sm font-medium">Default Input</label>
                                <Input id="input-default" placeholder="Type something..." />
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="input-error" className="text-sm font-medium text-destructive">Error State</label>
                                <Input id="input-error" hasError defaultValue="Invalid content" />
                                <p className="text-xs text-destructive">Please enter a valid value</p>
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="input-success" className="text-sm font-medium text-forest-canopy">Success State</label>
                                <Input id="input-success" state="success" defaultValue="Valid content" />
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="input-disabled" className="text-sm font-medium">Disabled Input</label>
                                <Input id="input-disabled" disabled placeholder="Cannot type here" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Touch Targets (44px+)</h3>
                        <div className="flex flex-wrap gap-4">
                            <button className="min-h-[44px] min-w-[44px] bg-forest-mist rounded-md flex items-center justify-center border border-forest-light">
                                44px
                            </button>
                            <button className="min-h-[48px] min-w-[48px] bg-forest-mist rounded-md flex items-center justify-center border border-forest-light">
                                48px
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">3. Typography Scale</h2>
                <div className="space-y-4 border p-6 rounded-lg">
                    <h1 className="text-3xl font-bold">Heading 1 (text-3xl)</h1>
                    <h2 className="text-2xl font-bold">Heading 2 (text-2xl)</h2>
                    <h3 className="text-xl font-semibold">Heading 3 (text-xl)</h3>
                    <p className="text-lg">Body Large (text-lg) - Used for introductions and emphasis.</p>
                    <p className="text-base">Body Base (text-base) - The default body text size for comfortable reading.</p>
                    <p className="text-sm text-muted-foreground">Body Small (text-sm) - Used for secondary information.</p>
                    <p className="text-xs text-muted-foreground">Caption (text-xs) - Used for labels and tiny details.</p>
                </div>
            </section>
        </div>
    )
}
