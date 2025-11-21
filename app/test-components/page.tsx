import { Button } from "@/components/library/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/library/card"
import { Input } from "@/components/library/input"
import { Label } from "@/components/library/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/library/tabs"
import { Calendar } from "@/components/library/calendar"
import { Badge } from "@/components/library/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/library/avatar"
import { Switch } from "@/components/library/switch"
import { Slider } from "@/components/library/slider"

export default function TestComponentsPage() {
    return (
        <div className="container mx-auto py-10 space-y-8">
            <header>
                <h1 className="text-4xl font-bold text-forest-canopy mb-2">shadcn/ui Components</h1>
                <p className="text-muted-foreground">Verifying core component installation and styling.</p>
            </header>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="forms">Forms</TabsTrigger>
                    <TabsTrigger value="cards">Cards</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8 mt-6">
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Buttons</CardTitle>
                                <CardDescription>Various button variants</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                <Button>Default</Button>
                                <Button variant="secondary">Secondary</Button>
                                <Button variant="destructive">Destructive</Button>
                                <Button variant="outline">Outline</Button>
                                <Button variant="ghost">Ghost</Button>
                                <Button variant="link">Link</Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Badges</CardTitle>
                                <CardDescription>Status indicators</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                <Badge>Default</Badge>
                                <Badge variant="secondary">Secondary</Badge>
                                <Badge variant="outline">Outline</Badge>
                                <Badge variant="destructive">Destructive</Badge>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Avatars</CardTitle>
                                <CardDescription>User profile images</CardDescription>
                            </CardHeader>
                            <CardContent className="flex gap-4">
                                <Avatar>
                                    <AvatarImage src="https://github.com/shadcn.png" />
                                    <AvatarFallback>CN</AvatarFallback>
                                </Avatar>
                                <Avatar>
                                    <AvatarFallback>MJ</AvatarFallback>
                                </Avatar>
                            </CardContent>
                        </Card>
                    </section>
                </TabsContent>

                <TabsContent value="forms" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Form Elements</CardTitle>
                            <CardDescription>Inputs, sliders, and switches</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input type="email" id="email" placeholder="Email" />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch id="airplane-mode" />
                                <Label htmlFor="airplane-mode">Airplane Mode</Label>
                            </div>

                            <div className="space-y-2">
                                <Label>Volume</Label>
                                <Slider defaultValue={[50]} max={100} step={1} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cards" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Alpha</CardTitle>
                                <CardDescription>Active development</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p>This is a sample card content demonstrating typography and spacing.</p>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full">View Details</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
