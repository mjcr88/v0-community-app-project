"use client"

import Image from "next/image"

export function RequestWizardCard() {
    return (
        <div className="h-full w-full flex flex-col items-center justify-start md:justify-center px-4 py-8 md:px-8 md:py-12 overflow-y-auto md:overflow-hidden">
            {/* Heading */}
            <div className="text-center mb-8 md:mb-12 shrink-0">
                <h2 className="text-2xl md:text-4xl font-bold">Requests: Help is on the way</h2>
                <p className="text-base md:text-xl text-muted-foreground mt-2">
                    See something? Say something. Submit maintenance requests or safety concerns in seconds.
                </p>
            </div>

            {/* Content area - Split layout */}
            <div className="flex-1 w-full flex items-center justify-center max-w-6xl md:max-h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full md:h-full items-center">

                    {/* Left: Step 1 (Categories) */}
                    <div className="relative w-full h-full min-h-[200px] md:min-h-[250px] rounded-2xl overflow-hidden border-2 border-primary/20 shadow-xl bg-muted/20 group">
                        <div className="absolute bottom-3 left-3 z-10 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full border shadow-sm">
                            <span className="text-xs font-medium text-primary">Step 1: Choose Category</span>
                        </div>
                        <Image
                            src="/artifacts/request_step1.png"
                            alt="Request wizard step 1: Category selection"
                            fill
                            className="object-contain p-1"
                            priority
                        />
                    </div>

                    {/* Right: Step 2 (Details) */}
                    <div className="relative w-full h-full min-h-[200px] md:min-h-[250px] rounded-2xl overflow-hidden border-2 border-primary/20 shadow-xl bg-muted/20 group">
                        <div className="absolute bottom-3 left-3 z-10 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full border shadow-sm">
                            <span className="text-xs font-medium text-primary">Step 2: Add Details</span>
                        </div>
                        <Image
                            src="/artifacts/request_step2.png"
                            alt="Request wizard step 2: Request details"
                            fill
                            className="object-contain p-1"
                            priority
                        />
                    </div>

                </div>
            </div>
        </div>
    )
}
