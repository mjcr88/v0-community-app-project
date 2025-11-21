// import SplitText from 'react-bits/SplitText'
// import RotatingText from 'react-bits/RotatingText'
// import GradientText from 'react-bits/GradientText'

export default function TestReactBitsPage() {
    return (
        <div className="container mx-auto py-10 space-y-12">
            <header className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-forest-canopy">
                    {/* <GradientText
                        colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
                        animationSpeed={3}
                        showBorder={false}
                        className="text-4xl font-bold"
                    >
                        ReactBits Components
                    </GradientText> */}
                    ReactBits Components
                </h1>
                <p className="text-xl text-muted-foreground">
                    {/* <RotatingText
                        texts={['Creative', 'Interactive', 'Dynamic', 'Fun']}
                        mainClassName="px-2 bg-forest-canopy text-white rounded-md"
                        staggerFrom={"last"}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "-120%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 400 }}
                        rotationInterval={2000}
                    />
                    {" "} UI Elements */}
                    (Installation Failed - Check Report)
                </p>
            </header>

            <section className="max-w-2xl mx-auto text-center">
                <div className="p-8 border rounded-xl bg-muted/10">
                    {/* <SplitText
                        text="This text is split by character and animated!"
                        className="text-2xl font-semibold"
                        delay={50}
                        animationFrom={{ opacity: 0, transform: 'translate3d(0,50px,0)' }}
                        animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
                        threshold={0.2}
                        rootMargin="-50px"
                    /> */}
                    <p>ReactBits components could not be installed via registry.</p>
                </div>
            </section>
        </div>
    )
}
